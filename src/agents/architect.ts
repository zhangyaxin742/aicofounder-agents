import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { architectPrompt } from "../prompts/architect.js";

export async function runArchitect(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "architect",
    reportType: "architect",
    systemPrompt: architectPrompt,
    canvas,
    task: `Propose a practical architecture and stack for: ${getIdeaSummary(canvas)}`
  });
}
