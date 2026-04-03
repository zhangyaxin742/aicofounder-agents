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
