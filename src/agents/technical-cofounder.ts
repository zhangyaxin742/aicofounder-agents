import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { technicalCofounderPrompt } from "../prompts/technical-cofounder.js";

export async function runTechnicalCofounder(
  canvas: Canvas
): Promise<StoredAgentReport> {
  return runAgent({
    agent: "technical-cofounder",
    reportType: "technical_cofounder",
    systemPrompt: technicalCofounderPrompt,
    canvas,
    task: `Turn the architecture into a scoped build plan for: ${getIdeaSummary(canvas)}`
  });
}
