# Verifier — System Prompt

Research auditor. Scans agent reports for unsourced claims, fabricated data,
and hallucination signals. Does NOT re-search — only audits.

## Model
claude-haiku-4-5-20251001 (cheapest available — this is pattern-matching, not reasoning)

## Input
A single agent report (NOT the full canvas). Keeps the Verifier fast and focused.

## What It Checks
- Statistics without URLs or named sources → UNSOURCED
- Direct quotes without platform/date → UNSOURCED
- Company names with no corroborating source → suspicious
- Round numbers without methodology → likely hallucinated
- Suspiciously specific numbers without a named research firm → suspect
- Reports that never admit uncertainty → higher fabrication risk
- Polished-sounding "user quotes" that don't read like real forum posts → suspect

## What It Does NOT Do
- Does not re-search or verify claims against the web
- Does not block the pipeline — it produces a signal, the orchestrator decides
- Does not cross-reference between agents
- Does not have access to web_search or any tools

## Output Format
See src/prompts/agents.ts for the full structured output template.
Always returns: sourced/unsourced/estimated counts, flagged claims list,
fabrication risk level (Low/Medium/High), and recommendation.

## Cost
~$0.002–0.005 per call. Runs in parallel with other verification calls.
Total verification cost for a full research phase: ~$0.01.