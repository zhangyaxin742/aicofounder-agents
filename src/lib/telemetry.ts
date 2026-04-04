import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export interface AgentRunTelemetry {
  agent: string;
  model: string;
  status: "success" | "failed";
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  durationMs: number;
  retries: number;
  fallbackModel: string | null;
  webSearch: boolean;
  structuredExtracted: boolean;
  error?: string;
}

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

## ADDITIONAL FUNCTIONS FOR COST CALCULATION AND TELEMETRY RECORD STRUCTURE
export interface TelemetryRecord {
  agent: string;
  model: string;
  status: 'success' | 'failed';
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;    // ← NEW
  cacheReadTokens: number;     // ← NEW
  cacheHitRate: number;        // ← NEW (percentage)
  costUsd: number;
  durationMs: number;
  retries: number;
  fallbackModel: string | null;
  error?: string;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number = 0,
  cacheReadTokens: number = 0
): number {
  const rates = PRICING[model] ?? PRICING['claude-sonnet-4-6'];

  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * rates.input * 1.25;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * rates.input * 0.1;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}