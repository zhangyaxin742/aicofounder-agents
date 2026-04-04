import { runAgent, AgentResult } from '../lib/run-agent.js';
import { ARCHITECT_SYSTEM_PROMPT } from '../prompts/agents.js';
import { buildCanvasContext } from '../lib/context-builder.js';
import type { Canvas } from '../canvas/schema.js';

export async function runArchitect(
  brief: string,
  canvas: Canvas
): Promise<AgentResult> {
  const canvasContext = buildCanvasContext(canvas, 'architect');

  return runAgent({
    systemPrompt: ARCHITECT_SYSTEM_PROMPT,
    userMessage: `<brief>${brief}</brief>\n\n<canvas>${canvasContext}</canvas>`,
    agentName: 'architect',
    model: 'claude-sonnet-4-6',
    maxTokens: 5000,
    webSearch: true, // Active research — BuiltWith, job postings, etc.
  });
}