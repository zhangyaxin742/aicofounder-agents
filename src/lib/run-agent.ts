import Anthropic from "@anthropic-ai/sdk";
import {
  createStoredAgentReport,
  type Canvas,
  type StoredAgentReport,
  type VerificationStatus
} from "../canvas/schema.js";

interface RunAgentOptions {
  agent: string;
  reportType: string;
  systemPrompt: string;
  canvas: Canvas;
  task: string;
  onToken?: (chunk: string) => void;
}

export async function runAgent(options: RunAgentOptions): Promise<StoredAgentReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return mockReport(options.agent, options.reportType, options.task);
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
  const stream = client.messages.stream({
    model,
    max_tokens: 700,
    system: options.systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                task: options.task,
                canvas: options.canvas
              },
              null,
              2
            )
          }
        ]
      }
    ]
  }) as AsyncIterable<unknown> & { finalMessage: () => Promise<unknown> };

  let text = "";

  for await (const event of stream) {
    const maybeDelta = event as {
      type?: string;
      delta?: { type?: string; text?: string };
    };

    if (
      maybeDelta.type === "content_block_delta" &&
      maybeDelta.delta?.type === "text_delta"
    ) {
      const chunk = maybeDelta.delta.text ?? "";
      text += chunk;
      options.onToken?.(chunk);
    }
  }

  await stream.finalMessage();
  return parseReport(options.reportType, text, options.task);
}

function parseReport(
  reportType: string,
  text: string,
  fallbackTask: string
): StoredAgentReport {
  const cleaned = text.trim() || `No response returned for task: ${fallbackTask}`;
  const bullets = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const sourceCount = countSources(cleaned);
  const hallucinationMarkers = sourceCount === 0 ? ["no_explicit_sources_detected"] : [];
  const issues = sourceCount === 0
    ? ["No explicit sources detected in the agent response."]
    : [];
  const status: VerificationStatus = cleaned.startsWith("No response returned")
    ? "needs_rerun"
    : sourceCount === 0
      ? "pass_with_warnings"
      : "pass";

  return createStoredAgentReport({
    reportType,
    rawMarkdown: cleaned,
    summary: bullets[0] ?? cleaned,
    structured: {
      bullets
    },
    verification: {
      status,
      issues,
      source_count: sourceCount,
      hallucination_markers: hallucinationMarkers
    }
  });
}

function mockReport(
  agent: string,
  reportType: string,
  task: string
): StoredAgentReport {
  const rawMarkdown = [
    `${agent} scaffold response for "${task}".`,
    "",
    "- No ANTHROPIC_API_KEY detected, so the scaffold returned a deterministic placeholder.",
    "- Add a valid API key to switch to live Anthropic calls."
  ].join("\n");

  return createStoredAgentReport({
    reportType,
    rawMarkdown,
    summary: `${agent} scaffold response for "${task}".`,
    structured: {
      mode: "mock",
      bullets: [
        "No ANTHROPIC_API_KEY detected, so the scaffold returned a deterministic placeholder.",
        "Add a valid API key to switch to live Anthropic calls."
      ]
    },
    verification: {
      status: "pass_with_warnings",
      issues: ["Report was generated from deterministic mock mode."],
      source_count: 0,
      hallucination_markers: ["mock_output", "no_live_verification"]
    }
  });
}

function countSources(value: string): number {
  const matches = value.match(/https?:\/\/\S+|www\.\S+/gi);
  return matches?.length ?? 0;
}
