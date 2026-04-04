import { runAgent } from '../lib/run-agent.js';
import { EXPORT_AGENT_SYSTEM_PROMPT } from '../prompts/export-agent.js';
import type { Canvas } from '../canvas/schema.js';
export async function runExportAgent(
  canvas: Canvas
): Promise<{ markdown: string; structured: Record<string, unknown> }> {
  const result = await runAgent({
    agent: 'export-agent',
    reportType: 'export',
    systemPrompt: EXPORT_AGENT_SYSTEM_PROMPT,
    canvas,
    task: 'Produce the final founder-facing export from the current canvas.',
    model: 'claude-sonnet-4-6',
    maxTokens: 14000
  });
  return {
    markdown: result.raw_markdown,
    structured: result.structured,
  };
}
