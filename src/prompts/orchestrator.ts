import { getIdeaSummary, type Canvas } from "../canvas/schema.js";

export function buildOrchestratorPrompt(canvas: Canvas): string {
  const lines = [
    "Orchestrator synthesis",
    `Project: ${canvas.project.name} (${canvas.project.slug})`,
    `Phase: ${canvas.project.phase}`,
    `Idea: ${getIdeaSummary(canvas)}`,
    "Use the specialist outputs to push the user toward sharper scope, better evidence, and clear next actions."
  ];

  if (canvas.conversation_summary) {
    lines.push(`Conversation summary: ${canvas.conversation_summary}`);
  }

  return lines.join("\n");
}
