import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";
import { runAgent } from "../lib/run-agent.js";
import { icpPrompt } from "../prompts/icp.js";

export async function runIcp(canvas: ProjectCanvas): Promise<ResearchNote> {
  return runAgent({
    agent: "ICP Whisperer",
    systemPrompt: icpPrompt,
    canvas,
    task: `Define the sharpest ICP and buying trigger for: ${canvas.idea}`
  });
}
