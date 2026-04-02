import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { analystPrompt } from "../prompts/analyst.js";

export async function runAnalyst(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "Competitor Analyst",
    systemPrompt: analystPrompt,
    canvas,
    task: `Map the competitive landscape for: ${canvas.idea}`
  });
}
