import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { architectPrompt } from "../prompts/architect.js";

export async function runArchitect(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "Architect",
    systemPrompt: architectPrompt,
    canvas,
    task: `Propose a practical architecture and stack for: ${canvas.idea}`
  });
}
