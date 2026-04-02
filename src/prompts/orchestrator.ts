import type { ProjectCanvas } from "../canvas/schema.js";

export function buildOrchestratorPrompt(canvas: ProjectCanvas): string {
  return [
    "Orchestrator synthesis",
    `Idea: ${canvas.idea || "No idea captured yet."}`,
    `Canvas updated: ${canvas.updatedAt}`,
    "Use the specialist outputs to push the user toward sharper scope, better evidence, and clear next actions."
  ].join("\n");
}
