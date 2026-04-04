# Cofounder Agent Swarm - Planned Codebase

> Target end state after sprint: run locally with your own Anthropic API key via a terminal-first CLI. This document exists only to describe implementation of the final sprint architecture. [cofounder-architecture.md](/C:/Users/user/Documents/GitHub/aicofounder-agents/cofounder-architecture.md) is the source of truth for final roster, phase flow, tool list, budget defaults, and export behavior.

---

### Editorial Lock: Authority Reference

- `cofounder-architecture.md` is the single source of truth for the final agent roster, final phase flow, final tool list, final budget defaults, and final export behavior
- this codebase doc describes only the implementation of that final sprint architecture
- this is a standalone Node/TypeScript terminal CLI using `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY`
- there is no Anthropic CLI dependency or shell-out path in the sprint implementation
- final active roster only: Orchestrator, Market Scout, Competitor Analyst, Market Sizer, ICP Whisperer, Architect, Technical Cofounder, GTM Specialist, Critic, Verifier, Export Agent
- research fan-out uses `Promise.allSettled`
- projects begin in `warmup`, then move into `intake`
- web search stays ON only for Scout, Analyst, Sizer, ICP, Architect, and GTM when needed
- web search stays OFF for Orchestrator, Technical Cofounder, Critic, Verifier, and Export Agent
- Verifier scope is structure validation, sourcing presence, and hallucination markers only
- Pattern Librarian and knowledge extraction are deferred from sprint scope
- structured machine-readable output is required; section-header presence is not the primary contract
- context stays small by default through context slices and summaries; full canvas is reserved for Critic and Export Agent
- `MAX_SESSION_COST=2.00`

## Recommended Build Sequence

Build this system in layers. Debugging an orchestrator that talks to five agents you haven't individually validated is extremely hard. Build bottom-up.

**Week 1 — Single agent, no orchestrator**

Get `run-agent.ts` working. Hardcode a brief, call the Scout directly, print the output. Iterate until the structured `<json_output>` block parses cleanly, the human-readable report is useful, source attribution is present, and the Verifier would pass it. Do not touch the orchestrator.

```bash
# Temporary test script: src/test-scout.ts
import { runAgent } from './lib/run-agent.js';
import { SCOUT_SYSTEM_PROMPT } from './prompts/agents.js';

const report = await runAgent({
  systemPrompt: SCOUT_SYSTEM_PROMPT,
  userMessage: '<brief>Research pain around spreadsheet-based financial modeling for startup CFOs.</brief>',
  agentName: 'Market Scout',
});
console.log(report);
```

Repeat for Analyst and Sizer individually. Validate structured output extraction and source presence manually before wiring them into fan-out.

**Week 2 — Fan-out, no orchestrator**

Get `fan-out.ts` working. Run all three agents in parallel, write the result to a canvas JSON file, read it back. Verify the canvas is readable and non-empty. Intentionally break one agent (wrong API key, empty brief) and confirm the `allSettled` fallback returns a graceful error string rather than crashing.

**Week 3 — Orchestrator loop + tool routing**

Add the orchestrator. Wire up the tool handlers. At this point the loop is: user types something → orchestrator responds → orchestrator calls `run_research_phase` → fan-out runs → results returned as `tool_result` → orchestrator synthesizes. Test that the phase state machine advances correctly and that `project.phase` in the canvas reflects the right state after each tool call.

Test edge case: send two messages in a row that would both trigger research. Confirm the second call doesn't re-run the fan-out (phase guard in tool description should prevent this, but verify it in practice).

**Week 4 — Domain agents (ICP, Architect, Technical Cofounder, GTM, Critic)**

Add the sequential agents one at a time. Add ICP first (it builds on research), then add Architect and Technical Cofounder as the build-phase pair, then GTM, then Critic. Test that Architect receives research + ICP context, that Technical Cofounder receives the Architect's report without fresh web search, and add the Critic last because its prompt requires the most tuning to push back specifically rather than generically.

**Week 5 — Verifier, cost tracking, `/export`**

Add the Verifier (Haiku) after each agent call. Add telemetry and budget tracking. Add the export flow. At this point the planned system can run a full session from warmup through export.

**Common mistakes to avoid at each stage:**

- Don't add the orchestrator before individual agents are validated. You'll have no idea whether a bad output came from the orchestrator's brief or the agent's prompt.
- Don't skip the output validation step in the tool handler. Silent bad data in the canvas cascades — the orchestrator reads it and produces confident-sounding synthesis of garbage.
- Don't test with Opus until the system works on Sonnet. Sonnet is faster and cheaper during development.
- Don't trim conversation history by splicing raw indices. If you trim a `tool_use` block without its matching `tool_result`, the API will reject the malformed conversation. Always trim in pairs (user + assistant) and only from turns that don't contain unmatched tool blocks.

---

## Appendix A: Validation & Fact-Check Layer — Implementation

---

### File: `src/lib/fan-out.ts` — Modified with Verification Pass

```typescript
import { runAgent } from './run-agent.js';
import { runVerifier, VerificationResult } from '../agents/verifier.js';
import { Canvas } from '../canvas/schema.js';

export interface VerifiedReport {
  report: string;
  audit: VerificationResult;
}

export interface ResearchResults {
  scout: VerifiedReport;
  analyst: VerifiedReport;
  sizer: VerifiedReport;
}

/**
 * Runs the Phase 1 parallel research fan-out with verification.
 *
 * Step 1: Scout, Analyst, Sizer run in parallel (Sonnet)
 * Step 2: Verifier audits all 3 reports in parallel (Haiku)
 * Step 3: Returns { report, audit } for each agent
 *
 * Total added cost for verification: ~$0.01
 */
export async function runResearchFanOut(
  briefs: { scout: string; analyst: string; sizer: string },
  canvas: Canvas
): Promise<ResearchResults> {
  // ── Step 1: Parallel research ──────────────────────────────────
  const [scoutReport, analystReport, sizerReport] = await Promise.allSettled([ // use allSettled for research fan-out
    runAgent('market_scout', {
      brief: briefs.scout,
      canvas,
      model: 'claude-sonnet-4-6',
      maxTokens: 4000,
    }),
    runAgent('competitor_analyst', {
      brief: briefs.analyst,
      canvas,
      model: 'claude-sonnet-4-6',
      maxTokens: 4000,
    }),
    runAgent('market_sizer', {
      brief: briefs.sizer,
      canvas,
      model: 'claude-sonnet-4-6',
      maxTokens: 4000,
    }),
  ]);

  // ── Step 2: Parallel verification (Haiku — fast + cheap) ──────
  const [scoutAudit, analystAudit, sizerAudit] = await Promise.allSettled([
    runVerifier(scoutReport, 'Market Scout'),
    runVerifier(analystReport, 'Competitor Analyst'),
    runVerifier(sizerReport, 'Market Sizer'),
  ]);

  // ── Step 3: Package verified results ──────────────────────────
  return {
    scout: { report: scoutReport, audit: scoutAudit },
    analyst: { report: analystReport, audit: analystAudit },
    sizer: { report: sizerReport, audit: sizerAudit },
  };
}

/**
 * Generic single-agent run with verification.
 * Use for ICP, Architect, Technical Cofounder, GTM, or Critic — any phase where a single
 * subagent returns a report that should be audited.
 */
export async function runAgentWithVerification(
  agentName: string,
  options: {
    brief: string;
    canvas: Canvas;
    systemPrompt: string;
    model?: string;
    maxTokens?: number;
  }
): Promise<VerifiedReport> {
  const report = await runAgent(agentName, {
    ...options,
    model: options.model ?? 'claude-sonnet-4-6',
    maxTokens: options.maxTokens ?? 4000,
  });

  const audit = await runVerifier(report, agentName);

  return { report, audit };
}
```

---

### File: `src/canvas/schema.ts` — Verification Fields Added

Append these types to the existing Canvas interface:

```typescript
// ── Verification Types (added for fact-check layer) ──────────────

export interface VerificationMetadata {
  agent_risk_levels?: Record<string, 'Low' | 'Medium' | 'High'>;
  flagged_claims?: string[];
  unverified_items?: string[];
  last_verified?: string; // ISO timestamp
}

// Add to the existing Canvas interface:
//
//   research: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
//
//   icp: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
//
//   build: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
//
//   legal: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
//
//   gtm: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
//
//   fundraising: {
//     ...existing fields...
//     verification?: VerificationMetadata;   ← ADD THIS
//   };
```

---

### File: `src/prompts/agents.ts` — Verifier Prompt Added

Append to the end of the existing `agents.ts` file:

```typescript
// ─── The Verifier ─────────────────────────────────────────────────────────────

export const VERIFIER_SYSTEM_PROMPT = `You are a research auditor. Your only job is to scan a research report and flag claims that lack sources, appear fabricated, or contradict each other.

You will receive a single agent report inside a <report> tag. Scan it and return EXACTLY this format:

---
VERIFICATION REPORT

SOURCED CLAIMS: [count — claims with a URL, named source, or specific citation]
UNSOURCED CLAIMS: [count — claims presented as fact with no source]
ESTIMATED CLAIMS: [count — claims explicitly tagged as estimates]

FLAGS (claims that need attention):
1. [Claim text] — Issue: [no source / suspiciously specific / contradicts other data / likely hallucinated]
2. [Claim text] — Issue: [...]
[continue for all flagged claims, or "None" if all claims are sourced]

FABRICATION RISK: [Low / Medium / High]
Reasoning: [one sentence explaining your assessment]

RECOMMENDATION: [Pass / Pass with warnings / Needs re-research on specific items]
---

RULES:
- A statistic without a URL or named source is UNSOURCED
- A direct quote without a platform and approximate date is UNSOURCED
- A company name not mentioned alongside any source or URL is suspicious — flag it
- Round numbers ($1B, $500M, 10M users) without methodology are likely hallucinated
- Suspiciously specific numbers (e.g., "$4.23B" or "23.7% CAGR") without a named research firm are suspect
- If the report says "I couldn't find data on X" or "data was limited" — that is GOOD. Flag reports that never admit uncertainty, as they are more likely to contain fabrication
- If a report claims 6+ direct user quotes and every quote sounds polished and articulate, flag it — real Reddit/forum quotes are messy
- You are not re-searching. You are auditing what's in front of you.
- Be concise. This is a quality gate, not a research paper.
- Return the VERIFICATION REPORT format and nothing else.`;
```

---

### Modification: Sourcing Rules Block for All Subagent Prompts

Add the following block to the `RULES` section of every subagent system prompt - Scout, Analyst, Sizer, ICP Whisperer, Architect, Technical Cofounder, GTM Specialist, and Critic when its legal lens is enabled. This goes in both `src/prompts/agents.ts` and the corresponding `prompts/*.md` files:

```
SOURCING RULES:
- Every statistic, quote, company name, or market claim MUST include a source URL or citation
- If you cannot find a source, tag the claim as [ESTIMATED] or [UNSOURCED]
- Never present an estimate as a fact. "The market is ~$2B [ESTIMATED based on adjacent market X]" is acceptable. "$2B TAM" with no source is not.
- Quotes must include: platform, subreddit/thread if applicable, approximate date
- If a search returned no useful results for a specific question, say so explicitly rather than filling in from general knowledge
- Reports that never admit uncertainty are more likely to contain hallucinations. Flag your confidence honestly.
- Prefer saying "I found limited data" over inventing plausible-sounding numbers
```

---

### Modification: Orchestrator Prompt — Verification Context

Add to the Orchestrator's system prompt in `src/prompts/orchestrator.ts` and `prompts/orchestrator.md`, immediately after the `AVAILABLE AGENTS` section:

```
VERIFICATION CONTEXT:
Each research report comes with a Verification Audit from an independent auditor (The Verifier).
Before synthesizing findings into the canvas:
- Check each audit's FABRICATION RISK level
- If any report is flagged "High" risk or "Needs re-research," tell the user which findings you're treating as unverified and why
- Never write an UNSOURCED claim to the canvas without marking it [UNVERIFIED]
- If multiple agents' claims contradict each other, flag the contradiction explicitly
- Reports that admit uncertainty are MORE trustworthy, not less — reward honesty in agent outputs
- When presenting research to the user, distinguish between verified findings and unverified claims

YOUR AVAILABLE AGENTS (updated):
- market_scout: Reddit/social pain mining, voice of customer
- competitor_analyst: Competitor mapping, pricing, complaints
- market_sizer: TAM/SAM/SOM, market structure, funding data
- icp_whisperer: Persona building, willingness-to-pay, where to find them
- architect: stack, integration, and infrastructure research
- technical_cofounder: architecture judgment, MVP cuts, build-vs-buy, technical risks
- gtm_specialist: distribution strategy, first 90 days, monetization framing
- the_critic: Red-team, kill-shot assumptions, adversarial pressure, optional legal-risk lens
- verifier: contract and source audit of any agent report (auto-invoked, you don't need to call this manually)
```

---

### Modification: Canvas Write Utility — `src/canvas/write.ts`

Add a helper function for writing verification metadata alongside section updates:

```typescript
import { Canvas, VerificationMetadata } from './schema.js';
import { VerificationResult } from '../agents/verifier.js';

/**
 * Converts a VerificationResult into canvas-ready metadata.
 * Call this when writing any section that was produced by a verified agent.
 */
export function buildVerificationMetadata(
  agentName: string,
  audit: VerificationResult,
  existing?: VerificationMetadata
): VerificationMetadata {
  return {
    agent_risk_levels: {
      ...(existing?.agent_risk_levels ?? {}),
      [agentName]: audit.risk,
    },
    flagged_claims: [
      ...(existing?.flagged_claims ?? []),
      ...audit.flaggedClaims,
    ],
    unverified_items: [
      ...(existing?.unverified_items ?? []),
      ...audit.flaggedClaims.filter((c) =>
        c.toLowerCase().includes('unsourced') || c.toLowerCase().includes('no source')
      ),
    ],
    last_verified: new Date().toISOString(),
  };
}
```

---

## Appendix B: Context Window Management — Implementation

### File: `src/lib/summarize.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUMMARIZE_SYSTEM_PROMPT = `Compress the following agent report into a 300–500 token executive summary.

Preserve: all specific numbers, company names, named sources, direct quotes, risk levels, and recommendations.
Remove: search methodology details, preamble, hedging language, and any section where the agent says they couldn't find data (note this as a single line: "[Data gap: X]").
Format: Use the same section headers as the original but with 1–2 sentences per section instead of paragraphs.
Do NOT add analysis or interpretation — summarize only what the report says.`;

/**
 * Compresses a full agent report (~2000–5000 tokens) into an executive
 * summary (~300–500 tokens) using Haiku for cost efficiency.
 *
 * Used to build the "summaries" layer of the canvas — the orchestrator
 * and subsequent agents receive summaries, not raw reports.
 *
 * Cost: ~$0.002–0.004 per call.
 */
export async function summarizeReport(
  report: string,
  agentName: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: SUMMARIZE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Agent: ${agentName}\n\n<report>\n${report}\n</report>`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return text.trim() || `[Summary generation failed for ${agentName}]`;
}

/**
 * Compresses the orchestrator's conversation history into a running summary.
 * Called when conversation history exceeds the sliding window (6 turns).
 *
 * Preserves: key decisions, user preferences, current direction, open questions.
 * Removes: back-and-forth deliberation, repeated context, superseded plans.
 */
export async function summarizeConversation(
  messages: Array<{ role: string; content: string }>,
  existingSummary?: string
): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const prompt = existingSummary
    ? `Update this existing conversation summary with the new exchanges below.
Preserve all decisions, user preferences, and action items. Remove superseded plans.

EXISTING SUMMARY:
${existingSummary}

NEW EXCHANGES:
${conversationText}`
    : `Summarize this conversation into a concise record of decisions, user preferences, and current direction.

CONVERSATION:
${conversationText}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system:
      'You are a conversation summarizer. Produce a concise summary that preserves all decisions, preferences, and action items. Use bullet points. Never add interpretation.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return text.trim() || existingSummary || '[Conversation summary failed]';
}
```

---

### File: `src/lib/context-builder.ts`

```typescript
import type { Canvas } from '../canvas/schema.js';

/**
 * Builds a context-appropriate canvas injection for each agent type.
 *
 * Not every agent needs the full canvas. Context isolation is the point —
 * each agent gets exactly what it needs and nothing more.
 */
export function buildCanvasContext(
  canvas: Canvas,
  agentType:
    | 'orchestrator'
    | 'research'
    | 'icp'
    | 'architect'
    | 'technical_cofounder'
    | 'gtm'
    | 'critic'
    | 'verifier'
    | 'export_agent'
): string {
  switch (agentType) {
    case 'orchestrator':
      // Full canvas with summaries (not raw reports) + decisions + current phase
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: {
            summaries: canvas.research?.summaries,
            market_size: canvas.research?.market_size,
            timing_verdict: canvas.research?.timing_verdict,
            verification: canvas.research?.verification,
          },
          icp: {
            summary: canvas.icp?.summary,
            primary_icp: canvas.icp?.primary_icp,
            willingness_to_pay: canvas.icp?.willingness_to_pay,
          },
          build: {
            architect_summary: canvas.build?.architect_summary,
            technical_summary: canvas.build?.technical_summary,
            mvp_scope: canvas.build?.mvp_scope,
          },
          gtm: {
            summary: canvas.gtm?.summary,
            primary_channel: canvas.gtm?.primary_channel,
            monetization_model: canvas.gtm?.monetization_model,
          },
          critic_reports: canvas.critic_reports,
          decisions: canvas.decisions?.slice(-10), // Last 10 decisions
          risks: canvas.risks,
        },
        null,
        2
      );

    case 'research':
      // Minimal — research agents only need the idea and their brief
      return JSON.stringify(
        { project: canvas.project, idea: canvas.idea },
        null,
        2
      );

    case 'icp':
      // Idea + research summaries
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: {
            summaries: canvas.research?.summaries,
            market_size: canvas.research?.market_size,
          },
        },
        null,
        2
      );

    case 'architect':
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: { summaries: canvas.research?.summaries },
          icp: {
            summary: canvas.icp?.summary,
            primary_icp: canvas.icp?.primary_icp,
          },
        },
        null,
        2
      );

    case 'technical_cofounder':
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: { summaries: canvas.research?.summaries },
          icp: {
            summary: canvas.icp?.summary,
            primary_icp: canvas.icp?.primary_icp,
          },
          build: {
            architect_summary: canvas.build?.architect_summary,
            architect_report: canvas.build?.architect_report,
          },
        },
        null,
        2
      );

    case 'gtm':
      // GTM needs the whole picture — full summaries
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: {
            summaries: canvas.research?.summaries,
            market_size: canvas.research?.market_size,
          },
          icp: canvas.icp,
          build: {
            architect_summary: canvas.build?.architect_summary,
            technical_summary: canvas.build?.technical_summary,
            mvp_scope: canvas.build?.mvp_scope,
          },
        },
        null,
        2
      );

    case 'critic':
      // Critic gets EVERYTHING — raw reports + summaries + full canvas
      return JSON.stringify(canvas, null, 2);

    case 'export_agent':
      // Export Agent also gets the full canvas so it can render the final brief
      return JSON.stringify(canvas, null, 2);

    case 'verifier':
      // Verifier gets nothing from canvas — only the single report in the brief
      return '{}';

    default:
      return JSON.stringify(canvas, null, 2);
  }
}

/**
 * Estimates token count for a string (rough: 1 token ≈ 4 chars).
 * Used for budget checks and compression triggers.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

---

### Canvas Schema Addition for Summaries

Add `summary` and `summaries` fields to the existing Canvas interface in `src/canvas/schema.ts`:

```typescript
// Add to research section:
research: {
  raw_reports?: { scout?: string; analyst?: string; sizer?: string };
  summaries?: { scout?: string; analyst?: string; sizer?: string };  // ← NEW
  verification?: VerificationMetadata;
  // ... existing fields
};

// Add summary field to each section:
icp: {
  raw_report?: string;
  summary?: string;    // ← NEW
  // ... existing fields
};

build: {
  architect_report?: string;
  architect_summary?: string;
  technical_report?: string;
  technical_summary?: string;
  raw_report?: string; // backward-compatible alias for the final technical report
  summary?: string;    // backward-compatible alias for the final technical summary
  // ... existing fields
};

gtm: {
  raw_report?: string;
  summary?: string;    // ← NEW
  // ... existing fields
};
```

---

## Appendix C: Error Handling & Graceful Degradation — Implementation

### File: `src/lib/run-agent.ts` — Rewritten with Retry + Fallback + Timeout

```typescript
import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { recordTelemetry } from './telemetry.js';
import { checkBudget } from './budget.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
} as unknown as Anthropic.Messages.Tool;

// ─── Error Classification ────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 529]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('socket hang up')
    );
  }
  return false;
}

function isRateLimitError(error: unknown): boolean {
  return error instanceof Anthropic.APIError && error.status === 429;
}

// ─── Model Fallback Chain ────────────────────────────────────────────────────

const FALLBACK_CHAINS: Record<string, string[]> = {
  'claude-opus-4-6': ['claude-opus-4-6', 'claude-sonnet-4-6'],
  'claude-sonnet-4-6': ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  'claude-haiku-4-5-20251001': ['claude-haiku-4-5-20251001'],
};

// ─── Timeout Configuration ───────────────────────────────────────────────────

const AGENT_TIMEOUTS: Record<string, number> = {
  orchestrator: 120_000,
  market_scout: 90_000,
  competitor_analyst: 90_000,
  market_sizer: 90_000,
  icp_whisperer: 90_000,
  architect: 60_000,
  technical_cofounder: 60_000,
  gtm_specialist: 90_000,
  the_critic: 60_000,
  verifier: 15_000,
  export_agent: 15_000,
};

// ─── Core Agent Runner ───────────────────────────────────────────────────────

export interface AgentOptions {
  systemPrompt: string;
  userMessage: string;
  agentName: string;
  model?: string;
  maxTokens?: number;
  webSearch?: boolean;
}

export interface AgentResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  fallbackUsed: boolean;
  retries: number;
  durationMs: number;
  costUsd: number;
}

export async function runAgent({
  systemPrompt,
  userMessage,
  agentName,
  model = 'claude-sonnet-4-6',
  maxTokens = 8000,
  webSearch = true,
}: AgentOptions): Promise<AgentResult> {
  // Budget gate: check before starting
  await checkBudget(agentName);

  const startTime = Date.now();
  const timeout = AGENT_TIMEOUTS[agentName] ?? 90_000;
  const fallbackChain = FALLBACK_CHAINS[model] ?? [model];

  process.stdout.write(chalk.yellow(`  → ${agentName} researching`));
  const interval = setInterval(() => process.stdout.write(chalk.yellow('.')), 1200);

  let lastError: Error | null = null;
  let totalRetries = 0;
  let usedModel = model;
  let fallbackUsed = false;

  try {
    // Try each model in the fallback chain
    for (const currentModel of fallbackChain) {
      const maxRetries = currentModel === fallbackChain[0] ? 3 : 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await client.messages.create(
            {
              model: currentModel,
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: [{ role: 'user', content: userMessage }],
              ...(webSearch && { tools: [WEB_SEARCH_TOOL] }),
            },
            { signal: controller.signal }
          );

          clearTimeout(timeoutId);

          const inputTokens = response.usage?.input_tokens ?? 0;
          const outputTokens = response.usage?.output_tokens ?? 0;
          usedModel = currentModel;
          fallbackUsed = currentModel !== model;

          const text = response.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('\n');

          const durationMs = Date.now() - startTime;
          const costUsd = calculateCost(currentModel, inputTokens, outputTokens);

          clearInterval(interval);
          const costStr = `$${costUsd.toFixed(3)}`;
          const fallbackTag = fallbackUsed ? chalk.red(' [fallback]') : '';
          process.stdout.write(
            chalk.green(` done`) +
              chalk.gray(
                ` (${Math.round(inputTokens / 1000)}k→${Math.round(outputTokens / 1000)}k tokens, ${costStr}, ${(durationMs / 1000).toFixed(1)}s)`
              ) +
              fallbackTag +
              '\n'
          );

          const result: AgentResult = {
            text: text || `[${agentName} returned no text. Stop: ${response.stop_reason}]`,
            inputTokens,
            outputTokens,
            model: currentModel,
            fallbackUsed,
            retries: totalRetries,
            durationMs,
            costUsd,
          };

          // Record telemetry
          recordTelemetry({
            agent: agentName,
            model: currentModel,
            status: 'success',
            inputTokens,
            outputTokens,
            costUsd,
            durationMs,
            retries: totalRetries,
            fallbackModel: fallbackUsed ? currentModel : null,
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (!isRetryableError(error)) {
            throw error; // Non-retryable: skip to next model or fail
          }

          totalRetries++;
          const baseDelay = isRateLimitError(error) ? 5000 : 1000;
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

          process.stdout.write(
            chalk.red(`\n    ⚠ ${agentName}: ${lastError.message} — retrying in ${Math.round(delay / 1000)}s`)
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // If primary model exhausted retries, log fallback attempt
      if (currentModel !== fallbackChain[fallbackChain.length - 1]) {
        const nextModel = fallbackChain[fallbackChain.indexOf(currentModel) + 1];
        process.stdout.write(
          chalk.yellow(`\n    → ${agentName}: falling back to ${nextModel}`)
        );
      }
    }

    // All models exhausted
    clearInterval(interval);
    const durationMs = Date.now() - startTime;

    recordTelemetry({
      agent: agentName,
      model,
      status: 'failed',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      retries: totalRetries,
      fallbackModel: null,
      error: lastError?.message,
    });

    process.stdout.write(chalk.red(` FAILED after ${totalRetries} retries\n`));

    return {
      text: `[${agentName} failed after ${totalRetries} retries. Error: ${lastError?.message}. The orchestrator should proceed with available data.]`,
      inputTokens: 0,
      outputTokens: 0,
      model,
      fallbackUsed: false,
      retries: totalRetries,
      durationMs,
      costUsd: 0,
    };
  } finally {
    clearInterval(interval);
  }
}

// ─── Cost Calculation ────────────────────────────────────────────────────────

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 5, output: 25 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export function buildAgentMessage(brief: string, canvas: unknown): string {
  return `<brief>\n${brief}\n</brief>\n\n<canvas>\n${JSON.stringify(canvas, null, 2)}\n</canvas>`;
}
```

---

### File: `src/lib/fan-out.ts` — Updated with `Promise.allSettled`

Use `Promise.allSettled` for graceful partial failure:

```typescript
import chalk from 'chalk';
import { runAgent, buildAgentMessage, AgentResult } from './run-agent.js';
import { runVerifier, VerificationResult } from '../agents/verifier.js';
import { summarizeReport } from './summarize.js';
import { buildCanvasContext } from './context-builder.js';
import {
  SCOUT_SYSTEM_PROMPT,
  ANALYST_SYSTEM_PROMPT,
  SIZER_SYSTEM_PROMPT,
} from '../prompts/agents.js';
import type { Canvas } from '../canvas/schema.js';

export interface VerifiedReport {
  report: string;
  summary: string;
  audit: VerificationResult;
  agentResult: AgentResult;
}

export interface FailedReport {
  status: 'failed';
  error: string;
  agentName: string;
}

export type ReportOutcome = VerifiedReport | FailedReport;

export interface ResearchResults {
  scout: ReportOutcome;
  analyst: ReportOutcome;
  sizer: ReportOutcome;
  anyFailed: boolean;
  failedAgents: string[];
}

/**
 * Runs Phase 1 parallel research with:
 * - Promise.allSettled (surviving agents aren't lost if one fails)
 * - Parallel verification on Haiku
 * - Parallel summarization on Haiku
 * - Graceful degradation: partial results returned to orchestrator
 */
export async function runResearchPhase(
  brief: string,
  canvas: Canvas
): Promise<ResearchResults> {
  const canvasContext = buildCanvasContext(canvas, 'research');
  const message = `<brief>\n${brief}\n</brief>\n\n<canvas>\n${canvasContext}\n</canvas>`;

  console.log(chalk.yellow('\n  Launching Scout, Analyst, and Sizer in parallel...\n'));

  // ── Step 1: Parallel research (Promise.allSettled) ──────────
  const settlements = await Promise.allSettled([
    runAgent({
      systemPrompt: SCOUT_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'market_scout',
    }),
    runAgent({
      systemPrompt: ANALYST_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'competitor_analyst',
    }),
    runAgent({
      systemPrompt: SIZER_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'market_sizer',
    }),
  ]);

  // ── Step 2: Process results + parallel verify + summarize ───
  const agentNames = ['market_scout', 'competitor_analyst', 'market_sizer'];
  const outcomes: ReportOutcome[] = [];

  for (let i = 0; i < 3; i++) {
    const settlement = settlements[i];
    if (settlement.status === 'fulfilled' && settlement.value.text && !settlement.value.text.startsWith('[')) {
      const agentResult = settlement.value;
      // Parallel: verify + summarize simultaneously
      const [audit, summary] = await Promise.allSettled([
        runVerifier(agentResult.text, agentNames[i]),
        summarizeReport(agentResult.text, agentNames[i]),
      ]);
      outcomes.push({ report: agentResult.text, summary, audit, agentResult });
    } else {
      const error =
        settlement.status === 'rejected'
          ? settlement.reason?.message ?? 'Unknown error'
          : settlement.value.text;
      outcomes.push({ status: 'failed', error, agentName: agentNames[i] });
    }
  }

  const failedAgents = outcomes
    .filter((o): o is FailedReport => 'status' in o && o.status === 'failed')
    .map((o) => o.agentName);

  if (failedAgents.length > 0) {
    console.log(
      chalk.red(`\n  ⚠ ${failedAgents.length} agent(s) failed: ${failedAgents.join(', ')}`)
    );
  }

  console.log(chalk.green('\n  ✓ Research phase complete\n'));

  return {
    scout: outcomes[0],
    analyst: outcomes[1],
    sizer: outcomes[2],
    anyFailed: failedAgents.length > 0,
    failedAgents,
  };
}
```

---

## Appendix D: Observability & Logging — Implementation

### File: `src/lib/telemetry.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs', 'telemetry');

export interface TelemetryRecord {
  agent: string;
  model: string;
  status: 'success' | 'failed';
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  retries: number;
  fallbackModel: string | null;
  error?: string;
}

interface SessionState {
  sessionId: string;
  projectSlug: string;
  startTime: string;
  totalCostUsd: number;
  totalTokens: number;
  totalCalls: number;
  costByAgent: Record<string, number>;
  costByModel: Record<string, number>;
  errors: string[];
  records: TelemetryRecord[];
}

let session: SessionState | null = null;

/**
 * Initialize telemetry for a new session.
 */
export function initTelemetry(projectSlug: string): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  session = {
    sessionId: crypto.randomUUID().slice(0, 8),
    projectSlug,
    startTime: new Date().toISOString(),
    totalCostUsd: 0,
    totalTokens: 0,
    totalCalls: 0,
    costByAgent: {},
    costByModel: {},
    errors: [],
    records: [],
  };
}

/**
 * Record a single agent call. Called from runAgent() after every API response.
 */
export function recordTelemetry(record: TelemetryRecord): void {
  if (!session) return;

  session.totalCalls++;
  session.totalTokens += record.inputTokens + record.outputTokens;
  session.totalCostUsd += record.costUsd;

  session.costByAgent[record.agent] =
    (session.costByAgent[record.agent] ?? 0) + record.costUsd;
  session.costByModel[record.model] =
    (session.costByModel[record.model] ?? 0) + record.costUsd;

  if (record.status === 'failed' && record.error) {
    session.errors.push(`${record.agent}: ${record.error}`);
  }

  session.records.push(record);

  // Append to JSONL log file (one line per call, append-only)
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOG_DIR, `${session.projectSlug}-${date}.jsonl`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    session_id: session.sessionId,
    project_slug: session.projectSlug,
    ...record,
  });
  fs.appendFileSync(logFile, line + '\n', 'utf-8');
}

/**
 * Get the current session cost. Used by the budget gate.
 */
export function getSessionCost(): number {
  return session?.totalCostUsd ?? 0;
}

/**
 * Get full session state (for /cost command and session summary).
 */
export function getSessionState(): SessionState | null {
  return session;
}

/**
 * Write a final session summary at exit. Called from the REPL on /quit.
 */
export function writeSessionSummary(budgetExit: boolean = false): void {
  if (!session) return;

  const summaryDir = path.join(process.cwd(), 'logs', 'session-summary');
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const summaryFile = path.join(
    summaryDir,
    `${session.projectSlug}-${date}-${session.sessionId}.json`
  );

  const summary = {
    session_id: session.sessionId,
    project_slug: session.projectSlug,
    start_time: session.startTime,
    end_time: new Date().toISOString(),
    total_agent_calls: session.totalCalls,
    total_tokens: session.totalTokens,
    total_cost_usd: Math.round(session.totalCostUsd * 1000) / 1000,
    cost_by_agent: session.costByAgent,
    cost_by_model: session.costByModel,
    errors: session.errors,
    budget_exit: budgetExit,
  };

  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
}
```

---

### File: `src/lib/budget.ts`

```typescript
import chalk from 'chalk';
import * as readline from 'readline';
import { getSessionCost, getSessionState } from './telemetry.js';

const MAX_SESSION_COST = parseFloat(process.env.MAX_SESSION_COST ?? '2.00');
const WARNING_THRESHOLD = parseFloat(process.env.COST_WARNING_THRESHOLD ?? '0.80');

let budgetWarningShown = false;
let budgetExceeded = false;
let additionalBudget = 0;

/**
 * Check the session budget BEFORE every agent call.
 * If budget is exceeded, pause and ask the user what to do.
 * Never interrupts an in-progress call — only gates new ones.
 */
export async function checkBudget(agentName: string): Promise<void> {
  if (MAX_SESSION_COST <= 0) return; // Budget disabled

  const effectiveBudget = MAX_SESSION_COST + additionalBudget;
  const currentCost = getSessionCost();

  // Warning at threshold
  if (!budgetWarningShown && currentCost >= effectiveBudget * WARNING_THRESHOLD) {
    budgetWarningShown = true;
    console.log(
      chalk.yellow(
        `\n  ⚠ Budget notice: $${currentCost.toFixed(2)} of $${effectiveBudget.toFixed(2)} used (${Math.round((currentCost / effectiveBudget) * 100)}%)\n`
      )
    );
  }

  // Hard stop at limit
  if (currentCost >= effectiveBudget) {
    console.log(
      chalk.red(`\n  ⛔ Session budget reached: $${currentCost.toFixed(2)} / $${effectiveBudget.toFixed(2)}`)
    );

    const state = getSessionState();
    if (state) {
      console.log(chalk.gray('\n  Breakdown:'));
      for (const [agent, cost] of Object.entries(state.costByAgent)) {
        console.log(chalk.gray(`    ${agent}: $${cost.toFixed(3)}`));
      }
    }

    console.log(chalk.white('\n  Options:'));
    console.log(chalk.white('    [1] Add $5.00 to budget and continue'));
    console.log(chalk.white('    [2] Add custom amount'));
    console.log(chalk.white('    [3] Export current brief and exit'));
    console.log(chalk.white('    [q] Quit without exporting'));

    const choice = await promptUser('\n  Choice: ');

    switch (choice.trim()) {
      case '1':
        additionalBudget += 5.0;
        budgetWarningShown = false;
        console.log(
          chalk.green(
            `\n  ✓ Budget increased to $${(effectiveBudget + 5).toFixed(2)}. Continuing...\n`
          )
        );
        break;
      case '2': {
        const amountStr = await promptUser('  Amount to add ($): ');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          additionalBudget += amount;
          budgetWarningShown = false;
          console.log(
            chalk.green(
              `\n  ✓ Budget increased to $${(effectiveBudget + amount).toFixed(2)}. Continuing...\n`
            )
          );
        } else {
          console.log(chalk.red('  Invalid amount. Exiting.'));
          process.exit(0);
        }
        break;
      }
      case '3':
        budgetExceeded = true;
        throw new BudgetExceededError('export');
      case 'q':
      default:
        budgetExceeded = true;
        throw new BudgetExceededError('quit');
    }
  }
}

export class BudgetExceededError extends Error {
  public readonly action: 'export' | 'quit';
  constructor(action: 'export' | 'quit') {
    super(`Budget exceeded — user chose: ${action}`);
    this.action = action;
    this.name = 'BudgetExceededError';
  }
}

function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Format the /cost command output for the REPL.
 */
export function formatCostSummary(): string {
  const state = getSessionState();
  if (!state) return 'No session active.';

  const effectiveBudget = MAX_SESSION_COST + additionalBudget;
  const lines: string[] = [
    '',
    `Session Cost Summary (${state.projectSlug})`,
    '─'.repeat(40),
    `Total cost:       $${state.totalCostUsd.toFixed(2)} / $${effectiveBudget.toFixed(2)} budget`,
    `Agent calls:      ${state.totalCalls}`,
    `Tokens used:      ${state.totalTokens.toLocaleString()}`,
    '',
    'By agent:',
  ];

  for (const [agent, cost] of Object.entries(state.costByAgent).sort(
    (a, b) => b[1] - a[1]
  )) {
    lines.push(`  ${agent.padEnd(22)} $${cost.toFixed(3)}`);
  }

  lines.push('');
  lines.push(`Budget remaining: $${(effectiveBudget - state.totalCostUsd).toFixed(2)}`);

  if (state.errors.length > 0) {
    lines.push('');
    lines.push(`Errors: ${state.errors.length}`);
    state.errors.forEach((e) => lines.push(`  - ${e}`));
  }

  return lines.join('\n');
}
```

---

### File: `.env.example` — Updated

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Maximum cost per session in USD. The swarm pauses and asks for
# confirmation before exceeding this amount. Set to 0 to disable.
# Default: $5.00 (covers a full research-through-GTM run)
MAX_SESSION_COST=2.00

# Cost warning threshold (percentage of budget).
# At this percentage, the REPL shows a budget notice.
COST_WARNING_THRESHOLD=0.80
```

---

### REPL Updates in `src/index.ts`

Add the `/cost` command and budget handling to the existing REPL:

```typescript
// Add to the REPL command handler (existing /export, /canvas, /quit):

case '/cost':
  console.log(formatCostSummary());
  break;

// Add to the REPL help text:
// | /cost           | Show running session cost and budget |

// Add to the REPL initialization (after project selection):
import { initTelemetry, writeSessionSummary } from './lib/telemetry.js';
import { formatCostSummary, BudgetExceededError } from './lib/budget.js';

// After project name is set:
initTelemetry(projectSlug);

// Wrap the main loop in try/catch for budget exits:
try {
  // ... existing REPL loop
} catch (error) {
  if (error instanceof BudgetExceededError) {
    if (error.action === 'export') {
      // Trigger export, then exit
      const exportPath = await exportBrief(canvas, slug);
      console.log(chalk.green(`\n  Brief exported to: ${exportPath}\n`));
    }
    writeSessionSummary(true);
    process.exit(0);
  }
  throw error;
}

// Add to existing quit/exit handler:
writeSessionSummary(false);
```

---

## Appendix E: Tool Design Specificity — Search Heuristic Blocks

### Modifications to `src/prompts/agents.ts`

Each agent's system prompt gains a `SEARCH HEURISTICS` block inserted immediately after the existing `SEARCH STRATEGY` section. These blocks tell agents *how* to use web_search — query construction rules, source priorities, and explicit territory boundaries to prevent duplication.

**Scout — add after SEARCH STRATEGY, before OUTPUT FORMAT:**

```typescript
// Append to SCOUT_SYSTEM_PROMPT, after the search strategy section:

`
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Start BROAD (2–3 words), then narrow based on what you find. "[problem]" before "[problem] Reddit r/saas"
- Use natural language phrasing that real users would type: "hate managing invoices" not "invoice management dissatisfaction analysis"
- Never exceed 6 words per query. Long queries return nothing useful.
- Run at least 8 distinct searches. Never run the same query twice with minor word variations.
- If a search returns zero useful results, reformulate with shorter/different terms. Never repeat a failed query.

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Reddit threads — append "Reddit" to queries
2. Hacker News discussions — append "Hacker News" to queries
3. X/Twitter posts — search "[problem] frustrating" or "[tool] hate"
4. App Store / Google Play reviews — search "[competitor] reviews app store"
5. Product Hunt comments — search "[competitor] Product Hunt"
6. YouTube comments — only if other sources are thin

TERRITORY BOUNDARIES (do NOT search for these — other agents handle them):
- Company pricing pages or feature lists → Analyst's job
- Crunchbase / funding data → Analyst's job
- Market research reports (Gartner, Statista) → Sizer's job
- "[space] market size" or TAM/SAM data → Sizer's job
- "[competitor] pricing" → Analyst's job
`
```

**Analyst — add after search instructions, before OUTPUT FORMAT:**

```typescript
// Append to ANALYST_SYSTEM_PROMPT:

`
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Lead with competitor names, not categories. "[CompanyName] pricing" not "[space] pricing comparison"
- Use 2–4 word queries. Shorter queries return more comprehensive results.
- For each competitor, run at least 3 searches: [name]+"pricing", [name]+"reviews", [name]+"funding"
- Search for the space itself only to DISCOVER competitors: "[space] tools", "[space] startup 2026"

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Competitor websites — pricing pages, feature lists, about pages
2. G2, Capterra, TrustRadius — search "[competitor] G2 review"
3. Crunchbase / TechCrunch — search "[competitor] funding round"
4. BuiltWith / Stackshare / job postings — search "[competitor] tech stack"
5. Product Hunt launch pages
6. App Store listings (if mobile product)

TERRITORY BOUNDARIES (do NOT search for these — other agents handle them):
- Reddit threads about user frustration → Scout's job
- Market size reports from research firms → Sizer's job
- "[problem] Reddit" or user pain language → Scout's job
- "[space] market size" or CAGR data → Sizer's job
`
```

**Sizer — add after search instructions, before OUTPUT FORMAT:**

```typescript
// Append to SIZER_SYSTEM_PROMPT:

`
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Lead with market terms: "[space] market size", "[space] TAM", "[space] CAGR"
- Include the current year for freshness: "[space] market size 2026"
- For funding data: "seed funding [space] 2026", "Series A [space]"
- Use research firm names for credibility: "Gartner [space]", "Statista [space] market"
- Use 2–5 word queries. Do not add unnecessary modifiers.

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Market research reports — Grand View Research, Mordor Intelligence, Statista, IBISWorld
2. Industry analyst reports — Gartner, IDC, Forrester, CB Insights
3. VC and funding databases — Crunchbase/PitchBook via TechCrunch reporting
4. Regulatory news — "[space] regulation 2026"
5. Credible trend sources — a16z blog, Sequoia blog, First Round Review
6. Government/academic data — Census, BLS, industry associations

TERRITORY BOUNDARIES (do NOT search for these — other agents handle them):
- Reddit threads / user forum posts → Scout's job
- Individual competitor websites or pricing pages → Analyst's job
- App Store reviews or user complaints → Scout's job
- "[competitor] reviews" → Analyst's job
`
```

**ICP Whisperer — add after research mandate, before OUTPUT FORMAT:**

```typescript
// Append to ICP_SYSTEM_PROMPT:

`
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Search for WHERE people are, not what they think: "[ICP] Discord", "[ICP] subreddit", "[ICP] newsletter"
- Search for behavioral signals: "[ICP] daily routine", "[ICP] tools they use"
- Search for willingness-to-pay proxies: "[comparable tool] pricing reviews"
- Use 2–4 word queries. Add "community" or "forum" to find gathering places.

SOURCE PRIORITY:
1. Community directories — subreddit lists, Discord servers, Slack groups
2. Newsletter/influencer directories — "[space] newsletter", "[ICP] creator"
3. Job postings that reveal pain — "[pain point] hiring"
4. LinkedIn/X hashtags and bio patterns
5. Demographic data — Pew Research, industry surveys

TERRITORY BOUNDARIES:
- Market sizing data → already collected in Phase 1
- Competitor feature lists → already collected in Phase 1
- General user pain language → already collected by Scout
`
```

**GTM Specialist — add after research mandate, before OUTPUT FORMAT:**

```typescript
// Append to GTM_SYSTEM_PROMPT:

`
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Search for HOW comparable products grew: "[product] first 1000 users", "[product] growth story"
- Search for distribution channels: "[ICP] newsletter", "[space] community"
- Search for investor thesis: "[investor] portfolio [space]", "[space] seed investors 2026"
- Search for pricing benchmarks: "[comparable product] pricing"

SOURCE PRIORITY:
1. Growth retrospectives — Lenny's Newsletter, First Round Review, a16z blog
2. Investor portfolio pages and thesis blog posts
3. Community/newsletter directories for the ICP
4. Pricing pages of adjacent/comparable products
5. TechCrunch / The Information for recent deals

TERRITORY BOUNDARIES:
- General market size data → already collected
- User pain language → already collected by Scout
- Competitor tech stacks → already collected by Analyst
`
```

### Corresponding `prompts/*.md` Updates

Each `prompts/*.md` file gets the same heuristic block appended after its search strategy section. The `.md` files are human-readable references — keep them in sync with the TypeScript source.

**Files to update:**
- `prompts/scout.md` — add Scout heuristics
- `prompts/analyst.md` — add Analyst heuristics
- `prompts/sizer.md` — add Sizer heuristics
- `prompts/icp.md` — add ICP heuristics
- `prompts/gtm.md` — add GTM heuristics

---

## Appendix F: Warm-Up Phase (Phase -1) — Implementation

### Modification: `src/canvas/schema.ts` — Phase Enum Update

```typescript
// Update the phase union type to include 'warmup':

export interface Canvas {
  project: {
    id: string;
    name: string;
    created_at: string;
    phase:
      | 'warmup'       // â† NEW: Pre-intake idea sharpening
      | 'intake'
      | 'research'
      | 'icp'
      | 'build'
      | 'gtm'
      | 'critic'
      | 'exported';
  };
  // ... rest of schema unchanged
}
```

### Modification: `src/canvas/read.ts` — Updated `createCanvas`

```typescript
// Update createCanvas to start in 'warmup' phase instead of 'intake':

export function createCanvas(name: string): Canvas {
  return {
    project: {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
      phase: 'warmup',  // ← Changed from 'intake'
    },
    idea: {},             // Stays empty until Phase 0
    research: {},
    icp: {},
    build: {},
    gtm: {},
    critic_reports: [],
    decisions: [],
    risks: {},
    exports: {},
  };
}
```
### Modification: `update_canvas` Tool — Phase Transition

When the orchestrator decides the idea is sharp, it uses `update_canvas` to transition from `warmup` → `intake` and populate the idea section:

```typescript
// Add to the update_canvas tool handler in orchestrator.ts:

if (toolInput.phase_transition === 'intake') {
  updatedCanvas.project.phase = 'intake';
  updatedCanvas.idea = {
    summary: toolInput.idea_summary,
    founder_context: toolInput.founder_context,
    initial_assumptions: toolInput.initial_assumptions ?? [],
    open_questions: toolInput.open_questions ?? [],
    last_updated: new Date().toISOString(),
  };
  console.log(chalk.green('\n  ✓ Idea sharpened — entering Intake phase\n'));
}
```

### Modification: `src/index.ts` — New Project Entry

Update the project selection to show warm-up state and inform the user:

```typescript
// After creating a new canvas, show warm-up messaging:

const { canvas, slug } = await selectProject(rl);

if (canvas.project.phase === 'warmup') {
  console.log(
    chalk.bold.cyan('── COFOUNDER ─────────────────────────────────────────────────\n')
  );
  console.log(
    chalk.cyan(
      "Tell me about the product you want to build. Be as specific\n" +
      "or as vague as you want — I'll help you sharpen it before we\n" +
      "bring in the research team.\n"
    )
  );
}
```

### Updated REPL Help Text

```typescript
// Update printHelp:
function printHelp(): void {
  console.log(chalk.gray('\n  /export   → assemble full canvas into a markdown brief'));
  console.log(chalk.gray('  /canvas   → print current canvas JSON'));
  console.log(chalk.gray('  /cost     → show running session cost and budget'));
  console.log(chalk.gray('  /phase    → show current project phase'));    // ← NEW
  console.log(chalk.gray('  /quit     → save and exit\n'));
}
```

---

## Appendix G: The Deferred knowledge extraction - Cross-Project Knowledge Persistence

> Sprint note: Deferred from active scope. Keep this appendix as a post-MVP option, not part of the sprint build.

### File: `src/agents/pattern-extraction.ts` (Deferred)

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { LIBRARIAN_SYSTEM_PROMPT } from '../prompts/agents.js';
import * as fs from 'fs';
import * as path from 'path';
import type { Canvas } from '../canvas/schema.js';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

const PATTERN_FILES = [
  'pricing-patterns',
  'icp-archetypes',
  'competitor-intel',
  'market-benchmarks',
  'tech-patterns',
  'success-failure-signals',
  'gtm-playbooks',
] as const;

/**
 * Historical appendix only. Pattern extraction is deferred from sprint scope.
 * It is intentionally NOT called by the sprint export flow and NOT part of the
 * active repo tree for the shipping MVP.
 */
export async function runPatternExtraction(canvas: Canvas): Promise<void> {
  void canvas;
  throw new Error('Pattern extraction is deferred from sprint scope.');
}

interface ExtractedPattern {
  category: string;
  data: Record<string, unknown>;
}

function parseLibrarianOutput(
  raw: string,
  canvas: Canvas
): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const timestamp = new Date().toISOString();
  const sourceProject = canvas.project.name;
  const space = canvas.idea?.summary?.slice(0, 100) ?? 'unknown';

  // Try to parse as JSON (the prompt asks for JSON output)
  try {
    const parsed = JSON.parse(
      raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    );

    if (Array.isArray(parsed.patterns)) {
      for (const p of parsed.patterns) {
        patterns.push({
          category: p.category ?? 'misc',
          data: {
            extracted_at: timestamp,
            source_project: sourceProject,
            space,
            ...p,
          },
        });
      }
    }
  } catch {
    // If JSON parsing fails, store the raw text as a single entry
    patterns.push({
      category: 'misc',
      data: {
        extracted_at: timestamp,
        source_project: sourceProject,
        raw_extraction: raw,
      },
    });
  }

  return patterns;
}

function writePatterns(patterns: ExtractedPattern[]): void {
  for (const pattern of patterns) {
    const filename = `${pattern.category}.jsonl`;
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    const line = JSON.stringify(pattern.data);
    fs.appendFileSync(filePath, line + '\n', 'utf-8');
  }
}

/**
 * Search the knowledge base for patterns relevant to a given idea.
 * Returns matching entries as a formatted string for injection into agent briefs.
 *
 * Uses simple text matching (grep-equivalent). For <1000 entries, this is sufficient.
 * Upgrade to vector search if the knowledge base exceeds ~5000 entries.
 */
export function searchKnowledgeBase(keywords: string[]): string {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return '';

  const matches: string[] = [];
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.jsonl'));

  for (const file of files) {
    const lines = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8')
      .split('\n')
      .filter((l) => l.trim());

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some((kw) => lowerLine.includes(kw.toLowerCase()))) {
        try {
          const entry = JSON.parse(line);
          matches.push(
            `[${file.replace('.jsonl', '')}] ${entry.pattern ?? entry.insight ?? JSON.stringify(entry).slice(0, 200)}`
          );
        } catch {
          // Skip malformed lines
        }
      }
    }
  }

  if (matches.length === 0) return '';

  return (
    'PRIOR INTELLIGENCE (from previous projects in similar spaces):\n' +
    matches.slice(0, 10).map((m) => `  - ${m}`).join('\n') +
    '\n\nUse this as a starting point. Verify and update — prior data may be outdated.'
  );
}
```

---

## Appendix H: Human-in-the-Loop Checkpoints — Implementation

### Modification: `src/orchestrator.ts` — Phase Transition Logic

Add checkpoint evaluation to the tool result handler:

```typescript
// After processing agent results in the tool handler, add checkpoint evaluation:

interface CheckpointResult {
  quality: 'high' | 'medium' | 'low';
  gaps: string[];
  contradictions: string[];
  recommendation: string;
}

function evaluatePhaseResults(
  canvas: Canvas,
  phaseJustCompleted: string,
  agentResults: Record<string, { report?: string; audit?: VerificationResult }>
): CheckpointResult {
  const gaps: string[] = [];
  const contradictions: string[] = [];

  // Check for failed agents
  for (const [agent, result] of Object.entries(agentResults)) {
    if (!result.report || result.report.startsWith('[')) {
      gaps.push(`${agent} returned no usable data`);
    }
    if (result.audit?.risk === 'High') {
      gaps.push(`${agent} has high fabrication risk — findings need verification`);
    }
  }

  // Check for thin results (heuristic: report shorter than 500 chars likely thin)
  for (const [agent, result] of Object.entries(agentResults)) {
    if (result.report && result.report.length < 500) {
      gaps.push(`${agent} report is unusually short — may indicate thin data`);
    }
  }

  // Determine quality level
  let quality: 'high' | 'medium' | 'low';
  if (gaps.length === 0 && contradictions.length === 0) {
    quality = 'high';
  } else if (gaps.length <= 2) {
    quality = 'medium';
  } else {
    quality = 'low';
  }

  const recommendation =
    quality === 'high'
      ? 'Findings are solid. Ready to proceed.'
      : quality === 'medium'
        ? `Some gaps detected: ${gaps.join('; ')}. Consider re-running targeted agents.`
        : `Significant gaps: ${gaps.join('; ')}. Recommend re-running before proceeding.`;

  return { quality, gaps, contradictions, recommendation };
}
```

---

## Appendix I: Export Quality — The Export Agent Final Pass

### File: `src/agents/export-agent.ts`

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { EXPORT_AGENT_SYSTEM_PROMPT } from '../prompts/agents.js';
import type { Canvas } from '../canvas/schema.js';

/**
 * Runs the Export Agent to produce a structured founder-facing research brief
 * formatted exactly to the /startup-research template spec.
 *
 * Called during /export, replacing the simple assembleBrief() string concat.
 * Cost: ~$0.05–0.10 (one Sonnet call, ~4K input tokens, ~8K output tokens)
 */
export async function runExportAgent(canvas: Canvas): Promise<{ markdown: string; structured: unknown }> {
  const result = await runAgent({
    systemPrompt: EXPORT_AGENT_SYSTEM_PROMPT,
    userMessage: buildExportInput(canvas),
    agentName: 'export-agent',
    model: 'claude-sonnet-4-6',
    maxTokens: 12000,
    webSearch: false, // Export only — no new research
  });

  return {
    markdown: result.markdown,
    structured: result.structured,
  };
}

/**
 * Builds the full canvas input for the Export Agent.
 * Includes raw reports (not just summaries) because the Export Agent
 * needs maximum detail to produce the complete template.
 */
function buildExportInput(canvas: Canvas): string {
  return [
    `<project_name>${canvas.project.name}</project_name>`,
    `<phase>${canvas.project.phase}</phase>`,
    `<canvas>`,
    JSON.stringify(canvas, null, 2),
    `</canvas>`,
    ``,
    `Produce a complete founder-facing research brief following your template exactly.`,
    `Every section must be present. Every table must be populated.`,
    `If data is missing for a section, write "[Data gap — not covered in research]".`,
    `Do NOT invent data. Only use what is in the canvas.`,
  ].join('\n');
}
```

---

### File: `src/lib/export.ts` — Updated with Export Agent

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import type { Canvas } from '../canvas/schema.js';
import { runExportAgent } from '../agents/export-agent.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

/**
 * Export flow (updated):
 * 1. Run Export Agent → produces template-formatted brief
 * 2. Write brief to /output
 * 3. Return file path
 */
export async function exportBrief(canvas: Canvas, slug: string): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}-brief-${date}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  // Step 1: Run Export Agent for template-formatted brief
  console.log(chalk.yellow('\n  Running Export Agent...\n'));
  const result = await runExportAgent(canvas);

  // Step 2: Write to file
  fs.writeFileSync(filePath, result.markdown, 'utf-8');
  console.log(chalk.green(`  ✓ Brief exported → ${filePath}`));

  return filePath;
}

/**
 * Fallback: simple canvas dump (used if Export Agent fails).
 * This is the original assembleBrief logic, kept as a safety net.
 */
export function assembleBriefFallback(canvas: Canvas): string {
  const parts: string[] = [];
  parts.push(`# ${canvas.project.name} — Research Brief (Raw Canvas Export)`);
  parts.push(
    `**Date:** ${new Date().toISOString().split('T')[0]}  \n` +
    `**Phase:** ${canvas.project.phase}  \n` +
    `**Note:** This is a raw canvas export. Run /export for the full formatted brief.`
  );

  if (canvas.idea?.summary) {
    parts.push(`## Idea Summary\n\n${canvas.idea.summary}`);
  }

  const r = canvas.research;
  if (r?.raw_reports) {
    if (r.raw_reports.scout) parts.push(`## Scout Report\n\n${r.raw_reports.scout}`);
    if (r.raw_reports.analyst) parts.push(`## Analyst Report\n\n${r.raw_reports.analyst}`);
    if (r.raw_reports.sizer) parts.push(`## Sizer Report\n\n${r.raw_reports.sizer}`);
  }

  if (canvas.icp?.raw_report) parts.push(`## ICP Report\n\n${canvas.icp.raw_report}`);
  if (canvas.build?.architect_report) parts.push(`## Architect Report\n\n${canvas.build.architect_report}`);
  if (canvas.build?.technical_report) parts.push(`## Technical Cofounder Report\n\n${canvas.build.technical_report}`);
  if (canvas.gtm?.raw_report) parts.push(`## GTM Report\n\n${canvas.gtm.raw_report}`);

  parts.push('\n---\n\n*Raw export by Cofounder Agent Swarm*');
  return parts.join('\n\n');
}
```

---

### Canvas Schema Addition: Scorecard

Add to `src/canvas/schema.ts`:

```typescript
export interface ScorecardDimension {
  score: number;     // 1–10
  rationale: string;
}

export interface Scorecard {
  problem_severity?: ScorecardDimension;
  market_size?: ScorecardDimension;
  timing?: ScorecardDimension;
  differentiation?: ScorecardDimension;
  icp_clarity?: ScorecardDimension;
  ego_relevance?: ScorecardDimension;
  stakes_immediacy?: ScorecardDimension;
  distribution_advantage?: ScorecardDimension;
  retention_churn?: ScorecardDimension;
  monetization_clarity?: ScorecardDimension;
  bootstrappability?: ScorecardDimension;
  overall_conviction?: ScorecardDimension;
  founder_verdict?: string;
  generated_at?: string;
}

// Add to Canvas interface:
//   scorecard?: Scorecard;   ← NEW
```
---

## Appendix J: Agent Roster Optimization & Cost Architecture — Implementation

### File: `src/agents/technical-cofounder.ts`

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { TECHNICAL_COFOUNDER_SYSTEM_PROMPT } from '../prompts/agents.js';
import { buildCanvasContext } from '../lib/context-builder.js';
import type { Canvas } from '../canvas/schema.js';

/**
 * The Technical Cofounder — runs on Opus for deep technical judgment.
 *
 * Handles: architecture decisions, MVP scope ruthlessness, technical risk
 * identification, build vs. buy, user flow design, system design at scale.
 *
 * Receives the Architect's research report as additional context so it can
 * make decisions grounded in real stack/cost data.
 */
export async function runTechnicalCofounder(
  brief: string,
  canvas: Canvas,
  architectReport: string
): Promise<AgentResult> {
  const canvasContext = buildCanvasContext(canvas, 'technical_cofounder');

  const userMessage = [
    `<brief>${brief}</brief>`,
    `<canvas>${canvasContext}</canvas>`,
    `<architect_research>${architectReport}</architect_research>`,
  ].join('\n\n');

  return runAgent({
    systemPrompt: TECHNICAL_COFOUNDER_SYSTEM_PROMPT,
    userMessage,
    agentName: 'technical_cofounder',
    model: 'claude-opus-4-6',
    maxTokens: 6000,
    webSearch: false, // Judgment only — Architect already did research
  });
}
```

---

### Modification: `src/orchestrator.ts` — Model Routing

```typescript
/**
 * Select orchestrator model based on current phase and context.
 * Opus for judgment-heavy turns, Sonnet for routine.
 */
function selectOrchestratorModel(
  canvas: Canvas,
  lastAction: string
): string {
  // Always Opus for warm-up (Socratic questioning needs best reasoning)
  if (canvas.project.phase === 'warmup') return 'claude-opus-4-6';

  // Opus for post-research synthesis (reading 3 agent reports)
  if (lastAction === 'research_complete') return 'claude-opus-4-6';
  if (lastAction === 'icp_complete') return 'claude-opus-4-6';
  if (lastAction === 'critic_complete') return 'claude-opus-4-6';

  // Opus for build work (deep product and technical judgment)
  if (canvas.project.phase === 'build') return 'claude-opus-4-6';

  // Sonnet for everything else
  return 'claude-sonnet-4-6';
}

// In runOrchestratorTurn:
const model = selectOrchestratorModel(canvas, lastAction);
```

---

### Modification: Build Phase Flow

The build phase now runs two agents in sequence:

```typescript
// In the orchestrator tool handler for run_build_phase:

// Step 1: Architect researches (Sonnet, web search ON)
const architectResult = await runArchitect(brief, canvas);
const architectAudit = await runVerifier(architectResult.text, 'architect');
const architectSummary = await summarizeReport(architectResult.text, 'architect');

// Step 2: Technical Cofounder judges (Opus, web search OFF)
const techCofounderResult = await runTechnicalCofounder(
  brief,
  canvas,
  architectResult.text  // Full report, not summary — TC needs all details
);
const tcAudit = await runVerifier(techCofounderResult.text, 'technical_cofounder');

// Both reports go to canvas
canvas.build = {
  architect_report: architectResult.text,
  architect_summary: architectSummary,
  tc_report: techCofounderResult.text,
  raw_report: techCofounderResult.text,  // backward compat
  summary: await summarizeReport(techCofounderResult.text, 'technical_cofounder'),
  verification: buildVerificationMetadata('build', tcAudit),
  last_updated: new Date().toISOString(),
};
```


---

### Final Repo Structure (All Appendices A–J)

```
cofounder-swarm/
├── .env.example                (MAX_SESSION_COST=2.00)
├── README.md
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts
│   ├── orchestrator.ts         (model routing + checkpoint logic)
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── technical-cofounder.ts   ← NEW (Opus — judgment)
│   │   ├── architect.ts             ← NEW (Sonnet — research)
│   │   ├── gtm.ts
│   │   ├── critic.ts               (now includes legal lens)
│   │   ├── verifier.ts
│   │   └── export-agent.ts         ← NEW (final brief generation only)
│   ├── prompts/
│   │   ├── orchestrator.ts
│   │   └── agents.ts               (TC + Architect + Export Agent prompts)
│   ├── canvas/
│   │   ├── schema.ts
│   │   ├── read.ts
│   │   └── write.ts
│   └── lib/
│       ├── run-agent.ts            (prompt caching + cache telemetry)
│       ├── fan-out.ts
│       ├── export.ts               (uses Export Agent)
│       ├── summarize.ts
│       ├── context-builder.ts
│       ├── telemetry.ts            (cache metrics added)
│       └── budget.ts
│
├── canvas/
├── output/
├── logs/
│   ├── telemetry/
│   └── session-summary/
│
└── prompts/
    ├── orchestrator.md
    ├── scout.md
    ├── analyst.md
    ├── sizer.md
    ├── icp.md
    ├── technical-cofounder.md       ← NEW
    ├── architect.md                 ← NEW
    ├── gtm.md
    ├── critic.md                    (legal lens documented)
    ├── verifier.md
└── export-agent.md              ← NEW
```
