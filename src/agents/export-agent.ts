import { runAgent, AgentResult } from '../lib/run-agent.js';
import { EXPORT_AGENT_SYSTEM_PROMPT } from '../prompts/agents.js';
import * as fs from 'fs';
import * as path from 'path';
import type { Canvas } from '../canvas/schema.js';


export async function runExportAgent(
  canvas: Canvas
): Promise<{ markdown: string; structured: Record<string, unknown> }> {
  const result = await runAgent({
    systemPrompt: EXPORT_AGENT_SYSTEM_PROMPT,
    brief: 'Produce the final founder-facing export from the current canvas.',
    canvas,
    agent: 'export-agent',
    model: 'claude-sonnet-4-6',
    maxTokens: 14000
  });
  return {
    markdown: result.markdown,
    structured: result.structured,
  };
}