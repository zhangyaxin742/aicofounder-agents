# aicofounder-agents

A standalone local CLI for an AI cofounder agent swarm. The CLI is a Node/TypeScript terminal app that uses `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY` for direct API calls. Anthropic is the model provider only; this project does not depend on any Anthropic CLI.

## Current Status

This repo is currently architecture-first and docs-heavy. The active docs lock the intended runtime, user flow, and agent behavior. The target user flow is:

1. Install this repo.
2. Provide an `ANTHROPIC_API_KEY`.
3. Run the AI cofounder swarm in-terminal.

Until the full implementation lands, treat this README as the operational guide for the planned CLI and treat the architecture doc as the authority file.

## What It Is

- Standalone local CLI, not a web app
- Node/TypeScript app using direct `@anthropic-ai/sdk` calls
- Requires your own Anthropic API key
- Uses a routed multi-agent swarm to research, challenge, and export startup validation work
- Targets roughly `$0.60-$2.00` per full run, depending on reruns and session length

## Quickstart

```bash
git clone https://github.com/YOUR_USERNAME/aicofounder-agents
cd aicofounder-agents
npm install
cp .env.example .env
# set ANTHROPIC_API_KEY in .env
npm start
```

If the implementation is not fully landed yet, use this README plus the architecture doc as the intended runtime guide.

## What It Does

The swarm is designed to act like a brutally honest AI cofounder for startup validation. The active sprint roster is:

- Orchestrator
- Market Scout
- Competitor Analyst
- Market Sizer
- ICP Whisperer
- Architect
- Technical Cofounder
- GTM Specialist
- Critic
- Verifier
- Export Agent

In practice, that means:

- warmup-first idea sharpening before heavy research spend
- parallel market research with graceful partial failure handling
- customer, market, build, and GTM synthesis across specialist agents
- adversarial pressure-testing from the Critic
- persistent project canvas state
- markdown brief export at the end of a session

## Requirements

- Node.js `18+`
- npm
- an Anthropic API key
- terminal access
- VS Code recommended for inspecting markdown, JSON canvas files, and prompt files

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/aicofounder-agents
cd aicofounder-agents
npm install
```

## Configuration

Create a `.env` file from the project template:

```bash
cp .env.example .env
```

Add your Anthropic key:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
MAX_SESSION_COST=2.00
COST_WARNING_THRESHOLD=0.80
```

Important notes:

- `ANTHROPIC_API_KEY` is required.
- `MAX_SESSION_COST=2.00` is the intended default budget cap.
- The CLI uses direct SDK calls through `@anthropic-ai/sdk`.
- Do not install or rely on Anthropic CLI tooling for this project.

## Running The CLI

Planned runtime command:

```bash
npm start
```

The intended startup flow is:

1. The CLI opens in-terminal.
2. The Orchestrator starts in `warmup`.
3. The user describes a startup idea.
4. The swarm sharpens the idea before spending research budget.
5. Scout, Analyst, and Sizer fan out with `Promise.allSettled`.
6. Later phases move through ICP, build planning, GTM, Critic review, and export.

## How It Works

High-level runtime behavior:

1. `warmup`
   The Orchestrator pressure-tests the idea before invoking expensive research.

2. `research`
   Market Scout, Competitor Analyst, and Market Sizer run in parallel with `Promise.allSettled`, so one failure does not kill the whole phase.

3. `icp`
   ICP Whisperer narrows the real buyer, pain, and willingness-to-pay.

4. `build`
   Architect researches stack and cost tradeoffs, then Technical Cofounder makes scope and architecture judgments.

5. `gtm`
   GTM Specialist outlines channel strategy and 90-day plan.

6. `critic`
   Critic pressure-tests assumptions and can enable a legal-risk lens when appropriate.

7. `export`
   Export Agent writes the final structured markdown brief to `output/`.

## Built-In Commands

These are the intended fixed CLI commands:

| Command | Behavior |
|---|---|
| `/export` | Assemble the current canvas into the final markdown brief in `output/` |
| `/canvas` | Print the current project canvas JSON in-terminal |
| `/rerun` | Reset research gating so the next turn can rerun Scout, Analyst, and Sizer |
| `/quit` | Save and exit |
| `/exit` | Save and exit |
| `Ctrl+C` | Emergency exit; intended runtime should autosave on each turn |

## Example Session: Focused Idea

```text
You: I want to build an AI assistant for independent accountants.

Cofounder:
Start narrower. What is the exact recurring pain for an accountant with 15-30 clients?
What is breaking today, what tools are they already using, and what are they paying for?

You: Monthly close is fragmented across email, spreadsheets, and QuickBooks notes.

Cofounder:
Good. I'm keeping this in warmup for one more turn, then I'll launch Scout, Analyst, and Sizer with Promise.allSettled so we can ground demand, competition, and market timing before we decide whether this deserves build planning.
```

## Example Session: Weak Idea Gets Pushed Back

```text
You: I want to build a platform that helps everyone validate any idea faster.

Cofounder:
That is not a market. "Everyone" is not an ICP and "faster" is not a pain.
Who is the first buyer, what do they do today, and what specific loss do they feel strongly enough to pay to fix?

You: Solo B2B founders who waste 2-3 weeks on ideas with no demand signal.

Cofounder:
Better. Now we can test whether that pain is strong, frequent, and monetizable instead of pretending the category exists because it sounds broad.
```

## Project Structure

Expected runtime structure:

```text
aicofounder-agents/
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── orchestrator.ts
│   ├── agents/
│   ├── lib/
│   ├── canvas/
│   └── prompts/
├── prompts/
├── canvas/
├── output/
└── logs/
```

What these are for:

- `src/`: application source for the CLI runtime
- `prompts/`: editable raw prompt files
- `canvas/`: local JSON project state
- `output/`: exported markdown briefs
- `logs/`: telemetry or runtime diagnostics

## Customization

You should be able to customize the swarm without changing the core idea:

- edit prompt files under `prompts/`
- adjust `MAX_SESSION_COST` and `COST_WARNING_THRESHOLD`
- tune model routing only if you understand the cost/quality tradeoff
- preserve the authority assumptions in `cofounder-architecture.md` unless you intentionally update both docs together

## Troubleshooting

If the CLI does not behave as expected, check these first:

- confirm `ANTHROPIC_API_KEY` is set in `.env`
- confirm Node `18+`
- confirm you are running the repo locally with npm, not via Anthropic CLI
- inspect `canvas/` for saved project state
- inspect `output/` for exported markdown briefs
- inspect prompt files if agent behavior feels off
- check whether the budget cap blocked further agent calls

## Common Issues And Limitations

- This project is not meant to run for free; it uses your Anthropic API key directly.
- Legal-risk output is flagging and escalation guidance only. AI is not a lawyer.
- Exported briefs are structured research/planning output, not certainty and not guaranteed diligence.
- Quality depends on prompt quality, source availability, and model behavior.
- Costs increase with longer sessions, reruns, and repeated critic passes.
- The active export path is `Export Agent`; knowledge extraction is deferred from sprint scope.

## Debugging

Useful debugging habits:

- inspect the active canvas before assuming state is lost
- rerun research intentionally with `/rerun` instead of assuming the gate is broken
- compare prompt files with runtime behavior when an agent drifts
- check budget values before assuming API failure
- confirm export output exists before debugging markdown rendering

## Source Of Truth

- [cofounder-architecture.md](/C:/Users/user/Documents/GitHub/aicofounder-agents/cofounder-architecture.md)
  Single source of truth for the final agent roster, final phase flow, final tool list, final budget defaults, and final export behavior.

- [cofounder-codebase.md](/C:/Users/user/Documents/GitHub/aicofounder-agents/cofounder-codebase.md)
  Planned codebase and implementation notes aligned to the architecture doc.
