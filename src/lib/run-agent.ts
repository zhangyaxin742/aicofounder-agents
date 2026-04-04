import Anthropic from "@anthropic-ai/sdk";
import chalk from "chalk";
import {
  createStoredAgentReport,
  type Canvas,
  type StoredAgentReport,
  type VerificationStatus
} from "../canvas/schema.js";
import { checkBudget, recordUsageCost } from "./budget.js";
import { buildContextSlice } from "./context-builder.js";
import { buildTelemetryRecord, recordTelemetry } from "./telemetry.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "missing" });

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search"
} as unknown as Anthropic.Messages.Tool;

const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

const AGENT_MODEL_DEFAULTS = {
  scout: "claude-sonnet-4-6",
  analyst: "claude-sonnet-4-6",
  sizer: "claude-sonnet-4-6",
  icp: "claude-sonnet-4-6",
  architect: "claude-sonnet-4-6",
  "technical-cofounder": "claude-opus-4-6",
  gtm: "claude-sonnet-4-6",
  critic: "claude-opus-4-6",
  verifier: "claude-haiku-4-5-20251001",
  "export-agent": "claude-sonnet-4-6"
} as const satisfies Record<AgentName, string>;

const WEB_SEARCH_ENABLED = {
  scout: true,
  analyst: true,
  sizer: true,
  icp: true,
  architect: true,
  "technical-cofounder": false,
  gtm: true,
  critic: false,
  verifier: false,
  "export-agent": false
} as const satisfies Record<AgentName, boolean>;

const AGENT_TIMEOUTS_MS = {
  scout: 90_000,
  analyst: 90_000,
  sizer: 90_000,
  icp: 90_000,
  architect: 75_000,
  "technical-cofounder": 75_000,
  gtm: 90_000,
  critic: 75_000,
  verifier: 20_000,
  "export-agent": 30_000
} as const satisfies Record<AgentName, number>;

const FALLBACK_CHAINS: Record<string, string[]> = {
  "claude-opus-4-6": ["claude-opus-4-6", "claude-sonnet-4-6"],
  "claude-sonnet-4-6": ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  "claude-3-5-sonnet-latest": ["claude-3-5-sonnet-latest", "claude-haiku-4-5-20251001"],
  "claude-haiku-4-5-20251001": ["claude-haiku-4-5-20251001"]
};

export type AgentName =
  | "scout"
  | "analyst"
  | "sizer"
  | "icp"
  | "architect"
  | "technical-cofounder"
  | "gtm"
  | "critic"
  | "verifier"
  | "export-agent";

export interface AgentUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface RunAgentOptions {
  agent: AgentName;
  reportType: string;
  systemPrompt: string;
  canvas: Canvas;
  task: string;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
  requireStructuredOutput?: boolean;
}

export interface ExecuteAgentRunResult {
  markdown: string;
  structured: Record<string, unknown> | null;
  usage: AgentUsage;
  model: string;
  durationMs: number;
  retries: number;
  fallbackUsed: boolean;
  webSearchEnabled: boolean;
  contractValid: boolean;
  cacheWriteTokens: number;
  cacheReadTokens: number;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is required to run the cofounder swarm.");
    this.name = "MissingApiKeyError";
  }
}

export class StructuredOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StructuredOutputError";
  }
}

export async function runAgent(options: RunAgentOptions): Promise<StoredAgentReport> {
  const execution = await executeAgentRun(options);
  const rawMarkdown = execution.markdown.trim() || `No response returned for task: ${options.task}`;
  const summary = extractSummary(execution.structured, rawMarkdown);
  const verification = buildInitialVerification(execution.contractValid);

  return createStoredAgentReport({
    reportType: options.reportType,
    rawMarkdown,
    summary,
    structured: {
      ...(execution.structured ?? {}),
      ...(execution.contractValid
        ? {}
        : {
            bullets: extractBullets(rawMarkdown),
            contract_valid: false,
            contract_issue: "Structured JSON output missing or invalid; markdown fallback stored."
          }),
      runtime: {
        agent: options.agent,
        model: execution.model,
        retries: execution.retries,
        fallback_used: execution.fallbackUsed,
        web_search_enabled: execution.webSearchEnabled,
        cache_read_tokens: execution.cacheReadTokens,
        cache_write_tokens: execution.cacheWriteTokens
      }
    },
    verification
  });
}

export async function executeAgentRun({
  agent,
  reportType,
  systemPrompt,
  canvas,
  task,
  model = AGENT_MODEL_DEFAULTS[agent],
  maxTokens = 8000,
  timeoutMs = AGENT_TIMEOUTS_MS[agent],
  requireStructuredOutput = false
}: RunAgentOptions): Promise<ExecuteAgentRunResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingApiKeyError();
  }

  checkBudget(agent);

  const startTime = Date.now();
  const fallbackChain = FALLBACK_CHAINS[model] ?? [model];
  const webSearchEnabled = WEB_SEARCH_ENABLED[agent];
  const userMessage = buildAgentMessage(agent, task, canvas);
  const progressLabel = `${agent}${webSearchEnabled ? " researching" : " running"}`;

  process.stdout.write(chalk.yellow(`  -> ${progressLabel}`));
  const interval = setInterval(() => process.stdout.write(chalk.yellow(".")), 1200);

  let totalRetries = 0;
  let lastError: Error | null = null;

  try {
    for (const currentModel of fallbackChain) {
      const maxRetries = currentModel === fallbackChain[0] ? 2 : 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await createMessageWithTimeout({
            model: currentModel,
            maxTokens,
            timeoutMs,
            systemPrompt: buildContractPrompt(systemPrompt, agent, reportType),
            userMessage,
            webSearchEnabled
          });

          const text = extractText(response);
          const parsed = parseAgentResponse(text, requireStructuredOutput);
          const durationMs = Date.now() - startTime;
          const usage = {
            input_tokens: response.usage?.input_tokens ?? 0,
            output_tokens: response.usage?.output_tokens ?? 0,
            cache_creation_input_tokens: response.usage?.cache_creation_input_tokens ?? 0,
            cache_read_input_tokens: response.usage?.cache_read_input_tokens ?? 0
          };
          const cacheCreation = response.usage?.cache_creation_input_tokens ?? 0;
          const cacheRead = response.usage?.cache_read_input_tokens ?? 0;
          const cacheHitRate = cacheRead > 0
            ? Math.round((cacheRead / (cacheRead + (response.usage?.input_tokens ?? 0))) * 100)
            : 0;
          const cacheWriteTokens = cacheCreation;
          const cacheReadTokens = cacheRead;
          const fallbackUsed = currentModel !== model;
          const costUsd = recordUsageCost(currentModel, usage);

          clearInterval(interval);
          process.stdout.write(
            chalk.green(" done") +
              chalk.gray(
                ` (${Math.round((usage.input_tokens ?? 0) / 1000)}k->${Math.round((usage.output_tokens ?? 0) / 1000)}k tokens, $${costUsd.toFixed(3)}, ${(durationMs / 1000).toFixed(1)}s)`
              ) +
              (fallbackUsed ? chalk.yellow(" [fallback]") : "") +
              (!parsed.contractValid ? chalk.yellow(" [markdown-only]") : "") +
              "\n"
          );

          recordTelemetry(buildTelemetryRecord({
            agent,
            model: currentModel,
            status: "success",
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            cacheWriteTokens,
            cacheReadTokens,
            cacheHitRate,
            costUsd,
            durationMs,
            retries: totalRetries,
            fallbackModel: fallbackUsed ? currentModel : null,
            webSearch: webSearchEnabled,
            structuredExtracted: parsed.contractValid
          }));

          return {
            markdown: parsed.markdown,
            structured: parsed.structured,
            usage,
            model: currentModel,
            durationMs,
            retries: totalRetries,
            fallbackUsed,
            webSearchEnabled,
            contractValid: parsed.contractValid,
            cacheWriteTokens,
            cacheReadTokens
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (!isRetryableError(error) || error instanceof StructuredOutputError) {
            throw lastError;
          }

          totalRetries += 1;
          const waitMs = retryDelayMs(attempt, isRateLimitError(error));
          process.stdout.write(
            chalk.red(
              `\n    ! ${agent}: ${lastError.message} - retrying in ${Math.max(1, Math.round(waitMs / 1000))}s`
            )
          );
          await sleep(waitMs);
        }
      }

      if (currentModel !== fallbackChain[fallbackChain.length - 1]) {
        const nextModel = fallbackChain[fallbackChain.indexOf(currentModel) + 1];
        process.stdout.write(chalk.yellow(`\n    -> ${agent}: falling back to ${nextModel}`));
      }
    }

    throw lastError ?? new Error(`Agent ${agent} failed without a reported cause.`);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const finalError = error instanceof Error ? error : new Error(String(error));
    recordTelemetry(buildTelemetryRecord({
      agent,
      model,
      status: "failed",
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      cacheHitRate: 0,
      costUsd: 0,
      durationMs,
      retries: totalRetries,
      fallbackModel: null,
      webSearch: webSearchEnabled,
      structuredExtracted: false,
      error: finalError.message
    }));
    clearInterval(interval);
    process.stdout.write(chalk.red(` FAILED (${finalError.message})\n`));
    throw finalError;
  } finally {
    clearInterval(interval);
  }
}

export function buildAgentMessage(agent: AgentName, brief: string, canvas: Canvas): string {
  const context = buildContextSlice({
    agent,
    canvas,
    includeFullCanvas: agent === "critic" || agent === "export-agent"
  });

  return [`<brief>`, brief, `</brief>`, "", `<context>`, context, `</context>`].join("\n");
}

function buildContractPrompt(systemPrompt: string, agent: AgentName, reportType: string): string {
  return [
    systemPrompt.trim(),
    "",
    "OUTPUT CONTRACT:",
    `- Return a human-readable markdown report for the ${agent} agent.`,
    "- Then return one JSON object inside <json_output> ... </json_output>.",
    `- The JSON must be valid and must include: "report_type": "${reportType}", "summary" (string), "bullets" (string[]), "sources" (string[]), and "confidence" (string).`,
    "- If a field is unknown, use an empty array or a short string. Do not invent citations.",
    "- Keep the markdown and JSON consistent."
  ].join("\n");
}

async function createMessageWithTimeout(options: {
  model: string;
  maxTokens: number;
  timeoutMs: number;
  systemPrompt: string;
  userMessage: string;
  webSearchEnabled: boolean;
}): Promise<Anthropic.Messages.Message> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const currentModel = options.model;
    const maxTokens = options.maxTokens;
    const systemPrompt = options.systemPrompt;
    const userMessage = options.userMessage;
    const webSearch = options.webSearchEnabled;

    const response = await client.messages.create(
      {
        model: currentModel,
        max_tokens: maxTokens,
        // Cache the system prompt — identical across turns/calls
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" } // 5-min cache
          }
        ],
        messages: [{ role: "user", content: userMessage }],
        ...(webSearch && { tools: [WEB_SEARCH_TOOL] })
      },
      { signal: controller.signal }
    );

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractText(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseAgentResponse(
  text: string,
  requireStructuredOutput: boolean
): { markdown: string; structured: Record<string, unknown> | null; contractValid: boolean } {
  const match = text.match(/<json_output>\s*([\s\S]*?)\s*<\/json_output>/i);
  const markdown = text.replace(/<json_output>[\s\S]*?<\/json_output>/i, "").trim();

  if (!match) {
    if (requireStructuredOutput) {
      throw new StructuredOutputError("Structured output missing from agent response.");
    }

    return {
      markdown,
      structured: null,
      contractValid: false
    };
  }

  try {
    const parsed = JSON.parse(match[1]) as unknown;

    if (!isRecord(parsed)) {
      throw new StructuredOutputError("Structured output must be a JSON object.");
    }

    return {
      markdown,
      structured: parsed,
      contractValid: true
    };
  } catch (error) {
    if (requireStructuredOutput) {
      throw new StructuredOutputError(
        error instanceof Error ? error.message : "Structured output JSON could not be parsed."
      );
    }

    return {
      markdown,
      structured: null,
      contractValid: false
    };
  }
}

function buildInitialVerification(contractValid: boolean): {
  status: VerificationStatus;
  issues: string[];
  source_count: number;
  hallucination_markers: string[];
} {
  if (contractValid) {
    return {
      status: "pass_with_warnings",
      issues: ["Verifier has not reviewed this report yet."],
      source_count: 0,
      hallucination_markers: []
    };
  }

  return {
    status: "pass_with_warnings",
    issues: [
      "Structured output missing or invalid; stored markdown fallback pending verifier review."
    ],
    source_count: 0,
    hallucination_markers: ["missing_structured_output"]
  };
}

function extractSummary(structured: Record<string, unknown> | null, markdown: string): string {
  const structuredSummary = structured?.summary;
  if (typeof structuredSummary === "string" && structuredSummary.trim()) {
    return structuredSummary.trim();
  }

  return firstMeaningfulLine(markdown) ?? "No summary available.";
}

function extractBullets(markdown: string): string[] {
  const bullets = markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

  return bullets.length > 0 ? bullets : [firstMeaningfulLine(markdown) ?? "No summary available."];
}

function firstMeaningfulLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .find(Boolean);
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("aborted") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("socket hang up")
    );
  }

  return false;
}

function isRateLimitError(error: unknown): boolean {
  return error instanceof Anthropic.APIError && error.status === 429;
}

function retryDelayMs(attempt: number, rateLimited: boolean): number {
  const base = rateLimited ? 4_000 : 1_000;
  return base * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
