import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { gtmPrompt } from "../prompts/gtm.js";

export async function runGtm(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "GTM Specialist",
    systemPrompt: gtmPrompt,
    canvas,
    task: `Outline go-to-market priorities for: ${canvas.idea}`
  });
}
