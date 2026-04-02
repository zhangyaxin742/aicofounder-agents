import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { scoutPrompt } from "../prompts/scout.js";

export async function runScout(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "Market Scout",
    systemPrompt: scoutPrompt,
    canvas,
    task: `Investigate demand signals for: ${canvas.idea}`
  });
}
