import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { analystPrompt } from "../prompts/analyst.js";

export async function runAnalyst(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "Competitor Analyst",
    reportType: "competitor_analyst",
    systemPrompt: analystPrompt,
    canvas,
    task: `Map the competitive landscape for: ${getIdeaSummary(canvas)}`
  });
}
