import {
  createVerificationMetadata,
  type Canvas,
  type VerificationMetadata,
  type VerificationStatus
} from '../canvas/schema.js';
import { runAgent } from '../lib/run-agent.js';
import { VERIFIER_SYSTEM_PROMPT } from '../prompts/verifier.js';

type SourceAgent =
  | 'scout'
  | 'analyst'
  | 'sizer'
  | 'icp'
  | 'architect'
  | 'technical-cofounder'
  | 'gtm'
  | 'critic';

interface RunVerifierOptions {
  sourceAgent: SourceAgent;
  markdown: string;
  structured: Record<string, unknown>;
  canvas: Canvas;
}

export async function runVerifier({
  sourceAgent,
  markdown,
  structured,
  canvas
}: RunVerifierOptions): Promise<VerificationMetadata> {
  const result = await runAgent({
    agent: 'verifier',
    reportType: 'verification',
    systemPrompt: VERIFIER_SYSTEM_PROMPT,
    canvas,
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 2_000,
    requireStructuredOutput: true,
    task: [
      `Audit the ${sourceAgent} report for unsupported specificity, fabricated-looking claims, and source hygiene.`,
      'Use the provided markdown and structured payload as the object of review. Do not do fresh research.',
      '',
      `<source_agent>${sourceAgent}</source_agent>`,
      '',
      '<report_markdown>',
      markdown,
      '</report_markdown>',
      '',
      '<report_structured>',
      JSON.stringify(structured, null, 2),
      '</report_structured>'
    ].join('\n')
  });

  return toVerificationMetadata(result.structured);
}

function toVerificationMetadata(structured: Record<string, unknown>): VerificationMetadata {
  const status = isVerificationStatus(structured.status)
    ? structured.status
    : 'pass_with_warnings';

  return createVerificationMetadata({
    status,
    issues: toStringArray(structured.issues),
    source_count: toSourceCount(structured),
    hallucination_markers: toStringArray(structured.hallucination_markers)
  });
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return value === 'pass' || value === 'pass_with_warnings' || value === 'needs_rerun';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function toSourceCount(structured: Record<string, unknown>): number {
  if (typeof structured.source_count === 'number' && Number.isFinite(structured.source_count)) {
    return Math.max(0, Math.trunc(structured.source_count));
  }

  return toStringArray(structured.sources).length;
}
