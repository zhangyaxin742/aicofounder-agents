import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { criticPrompt } from "../prompts/critic.js";

export async function runCritic(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "Critic",
    systemPrompt: criticPrompt,
    canvas,
    task: `Pressure-test the riskiest assumptions in: ${canvas.idea}`
  });
}
