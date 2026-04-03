import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { gtmPrompt } from "../prompts/gtm.js";

export async function runGtm(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "GTM Specialist",
    reportType: "gtm",
    systemPrompt: gtmPrompt,
    canvas,
    task: `Outline go-to-market priorities for: ${getIdeaSummary(canvas)}`
  });
}
