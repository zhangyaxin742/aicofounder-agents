import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export interface TelemetryRecord {
  agent: string;
  model: string;
  status: "success" | "failed";
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cacheHitRate: number;
  costUsd: number;
  durationMs: number;
  retries: number;
  fallbackModel: string | null;
  error?: string;
}

export interface AgentRunTelemetry extends TelemetryRecord {
  webSearch: boolean;
  structuredExtracted: boolean;
}

export interface AgentRunTelemetryInput
  extends Omit<AgentRunTelemetry, "costUsd" | "cacheHitRate"> {
  costUsd?: number;
  cacheHitRate?: number;
}

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-3-5-sonnet-latest": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 }
};

function telemetryFilePath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.resolve(process.cwd(), "logs", "telemetry", `${date}.jsonl`);
}

export function recordTelemetry(entry: AgentRunTelemetry): void {
  try {
    const filePath = telemetryFilePath();
    const directory = path.dirname(filePath);

    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    appendFileSync(
      filePath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry
      }) + "\n",
      "utf8"
    );
  } catch {
    // Telemetry should never break agent execution.
  }
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number = 0,
  cacheReadTokens: number = 0
): number {
  const rates = PRICING[model] ?? PRICING["claude-sonnet-4-6"];

  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * rates.input * 1.25;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * rates.input * 0.1;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export function buildTelemetryRecord(
  entry: AgentRunTelemetryInput
): AgentRunTelemetry {
  const cacheHitRate = entry.cacheHitRate ?? calculateCacheHitRate(
    entry.cacheWriteTokens,
    entry.cacheReadTokens
  );
  const costUsd = entry.costUsd ?? calculateCost(
    entry.model,
    entry.inputTokens,
    entry.outputTokens,
    entry.cacheWriteTokens,
    entry.cacheReadTokens
  );

  return {
    ...entry,
    cacheHitRate,
    costUsd
  };
}

function calculateCacheHitRate(
  cacheWriteTokens: number,
  cacheReadTokens: number
): number {
  const totalCacheTokens = cacheWriteTokens + cacheReadTokens;

  if (totalCacheTokens === 0) {
    return 0;
  }

  return (cacheReadTokens / totalCacheTokens) * 100;
}
