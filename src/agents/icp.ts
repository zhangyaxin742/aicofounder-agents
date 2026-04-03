import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { icpPrompt } from "../prompts/icp.js";

export async function runIcp(canvas: Canvas): Promise<StoredAgentReport> {
  return runAgent({
    agent: "ICP Whisperer",
    reportType: "icp",
    systemPrompt: icpPrompt,
    canvas,
    task: `Define the sharpest ICP and buying trigger for: ${getIdeaSummary(canvas)}`
  });
}
