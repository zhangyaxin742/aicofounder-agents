import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { scoutPrompt } from "../prompts/scout.js";

export async function runScout(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "Market Scout",
    reportType: "market_scout",
    systemPrompt: scoutPrompt,
    canvas,
    task: `Investigate demand signals for: ${getIdeaSummary(canvas)}`
  });
}
