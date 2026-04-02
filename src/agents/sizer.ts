import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { sizerPrompt } from "../prompts/sizer.js";

export async function runSizer(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "Market Sizer",
    systemPrompt: sizerPrompt,
    canvas,
    task: `Estimate addressable market potential for: ${canvas.idea}`
  });
}
