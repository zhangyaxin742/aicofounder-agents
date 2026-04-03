import { runAgent } from '../lib/run-agent.js';
import { VERIFIER_SYSTEM_PROMPT } from '../prompts/agents.js';

export interface VerificationResult {
  report: string;
  risk: 'Low' | 'Medium' | 'High';
  flaggedClaims: string[];
  recommendation: 'Pass' | 'Pass with warnings' | 'Needs re-research on specific items';
}

/**
 * Runs a lightweight fact-check audit on a single agent report.
 * Uses Haiku for cost efficiency (~$0.003 per call).
 * Does NOT re-search — only audits what's in front of it.
 */
export async function runVerifier(
  report: string,
  agentName: string
): Promise<VerificationResult> {
  const brief = [
    `Audit the following ${agentName} report for unsourced claims,`,
    `fabricated data, and hallucination risk. Return your assessment`,
    `in the exact VERIFICATION REPORT format specified in your instructions.`,
  ].join(' ');

  const raw = await runAgent('verifier', {
    brief,
    context: report, // Single report only — NOT full canvas
    systemPrompt: VERIFIER_SYSTEM_PROMPT,
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1500,
  });

  // Parse the structured output
  return parseVerifierOutput(raw, agentName);
}

/**
 * Parse the Verifier's structured text output into a typed result.
 * Gracefully degrades if parsing fails — defaults to "Pass with warnings".
 */
function parseVerifierOutput(raw: string, agentName: string): VerificationResult {
  try {
    // Extract fabrication risk level
    const riskMatch = raw.match(/FABRICATION RISK:\s*(Low|Medium|High)/i);
    const risk = (riskMatch?.[1] as 'Low' | 'Medium' | 'High') ?? 'Medium';

    // Extract recommendation
    const recMatch = raw.match(
      /RECOMMENDATION:\s*(Pass with warnings|Pass|Needs re-research on specific items)/i
    );
    const recommendation =
      (recMatch?.[1] as VerificationResult['recommendation']) ?? 'Pass with warnings';

    // Extract flagged claims
    const flaggedClaims: string[] = [];
    const flagSection = raw.match(/FLAGS[\s\S]*?(?=FABRICATION RISK|$)/i);
    if (flagSection) {
      const lines = flagSection[0].split('\n');
      for (const line of lines) {
        const claimMatch = line.match(/^\d+\.\s*(.+)/);
        if (claimMatch) {
          flaggedClaims.push(claimMatch[1].trim());
        }
      }
    }

    return { report: raw, risk, flaggedClaims, recommendation };
  } catch {
    // If parsing fails, return a safe default
    console.warn(`[Verifier] Failed to parse output for ${agentName}, defaulting to Medium risk`);
    return {
      report: raw,
      risk: 'Medium',
      flaggedClaims: ['Verifier output could not be parsed — manual review recommended'],
      recommendation: 'Pass with warnings',
    };
  }
}