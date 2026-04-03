import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { sizerPrompt } from "../prompts/sizer.js";

export async function runSizer(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "sizer",
    reportType: "market_sizer",
    systemPrompt: sizerPrompt,
    canvas,
    task: `Estimate addressable market potential for: ${getIdeaSummary(canvas)}`
  });
}
