import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { technicalCofounderPrompt } from "../prompts/technical-cofounder.js";

export async function runTechnicalCofounder(
  canvas: ProjectCanvas
): Promise<ResearchNote> {
  return runAgent({
    agent: "Technical Cofounder",
    systemPrompt: technicalCofounderPrompt,
    canvas,
    task: `Turn the architecture into a scoped build plan for: ${canvas.idea}`
  });
}
