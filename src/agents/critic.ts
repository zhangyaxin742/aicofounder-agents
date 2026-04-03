import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { criticPrompt } from "../prompts/critic.js";

export async function runCritic(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "critic",
    reportType: "critic",
    systemPrompt: criticPrompt,
    canvas,
    task: `Pressure-test the riskiest assumptions in: ${getIdeaSummary(canvas)}`
  });
}
