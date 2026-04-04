# aicofounder-agents

Local TypeScript CLI scaffold for an AI cofounder swarm backed by Anthropic.

## Setup

```bash
npm install
cp .env.example .env
```

Set `ANTHROPIC_API_KEY` in `.env`.

## Usage

```bash
npm start
```

The CLI starts a simple REPL, loads or creates a project canvas in `canvas/`, and supports:

- `/canvas` to print the active canvas
- `/export` to write a markdown brief to `output/`
- `/rerun` to clear research summaries
- `/quit` or `/exit` to save and leave

## Structure

```text
.
|-- .env.example
|-- README.md
|-- package.json
|-- tsconfig.json
|-- src/
|   |-- index.ts
|   |-- orchestrator.ts
|   |-- agents/
|   |-- prompts/
|   |-- canvas/
|   `-- lib/
|-- canvas/
|-- output/
`-- prompts/
```

## Notes

- `src/lib/run-agent.ts` contains the Anthropic SDK wrapper and a deterministic fallback when no API key is present.
- `prompts/` stores raw markdown prompt references.
- `src/prompts/` stores TypeScript prompt builders used by the runtime.

## README
# Cofounder Agent Swarm

A standalone local Node/TypeScript CLI that runs an AI cofounder swarm in terminal by calling Anthropic directly through `@anthropic-ai/sdk`.

No Anthropic CLI. No web app. No hosted backend. Bring your own `ANTHROPIC_API_KEY`.

---

## What It Does

You describe a startup idea. The Orchestrator sharpens it, challenges weak assumptions, launches specialist research only when the idea is ready, and drives the project toward a founder-facing export.

- `warmup` sharpens vague ideas through Socratic questioning
- `intake` writes the structured idea brief into canvas
- Scout, Analyst, and Sizer run in parallel with `Promise.allSettled`
- ICP analysis develops the clearest customer and willingness-to-pay view
- Architect researches stack, integrations, and infrastructure tradeoffs
- Technical Cofounder makes the architecture, scope, and build-vs-buy judgment calls
- GTM Specialist frames launch, channels, and monetization
- Critic pressure-tests the business and can apply an optional legal-risk lens
- Verifier checks structure, source presence, and obvious hallucination markers
- Export Agent writes the final markdown brief to `/output`

## Agent Roster

| Agent | Model | Role |
|---|---|---|
| Orchestrator | claude-opus-4-6 | Leads conversation, phase flow, and tool routing |
| Market Scout | claude-sonnet-4-6 | Pain mining, user quotes, demand signals |
| Competitor Analyst | claude-sonnet-4-6 | Competitor map, pricing, complaints, positioning |
| Market Sizer | claude-sonnet-4-6 | TAM/SAM/SOM, timing, funding and growth signals |
| ICP Whisperer | claude-sonnet-4-6 | Personas, urgency, WTP, buying context |
| Architect | claude-sonnet-4-6 | Technical research, stack and infra evaluation |
| Technical Cofounder | claude-opus-4-6 | Architecture judgment, MVP cuts, technical risk |
| GTM Specialist | claude-sonnet-4-6 | Channel strategy, launch plan, monetization framing |
| Critic | claude-opus-4-6 | Red-team pressure test, optional legal-risk lens |
| Verifier | claude-haiku-4-5-20251001 | Contract validation, source presence, hallucination markers |
| Export Agent | claude-sonnet-4-6 | Final markdown brief generation |

Research fan-out uses `Promise.allSettled`.
Projects begin in `warmup`, then move into `intake`.
Expected cost per full run: roughly `$0.60-$2.00`, depending on session length, reruns, and how much iteration happens before the idea is research-ready.

## Requirements

- Node.js 20+
- npm 10+
- Anthropic API key

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/aicofounder-agents
cd aicofounder-agents
npm install
cp .env.example .env
# edit .env and add ANTHROPIC_API_KEY
npm start
```

## Configuration

`.env.example`

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
MAX_SESSION_COST=2.00
COST_WARNING_THRESHOLD=0.80
```

## Running The CLI

The CLI starts a local REPL. Give it a vague idea or a sharp one.

```text
You: I want to build something for solo founders.

Cofounder:
That's still too broad to research well.
What specific recurring workflow is breaking for solo founders today, and what are they doing instead?
```

If the idea is vague, the Orchestrator stays in `warmup`. Once the idea is sharp enough, it writes the intake brief into canvas and proceeds to research.

## REPL Commands

| Command | What It Does |
|---|---|
| `/canvas` | Print the current canvas JSON to terminal |
| `/rerun research` | Re-run Scout, Analyst, and Sizer using the current intake brief |
| `/rerun icp` | Re-run ICP analysis |
| `/rerun build` | Re-run Architect followed by Technical Cofounder |
| `/rerun gtm` | Re-run GTM planning |
| `/critic` | Run the Critic with the default lens |
| `/critic legal` | Run the Critic with the legal-risk lens |
| `/export` | Run Export Agent and write the final brief to `/output` |
| `/quit` or `/exit` | Save canvas and exit |
| Ctrl+C | Emergency exit; canvas should already be auto-saved |

## Project Structure

```text
aicofounder-agents/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── orchestrator.ts
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── architect.ts
│   │   ├── technical-cofounder.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   ├── verifier.ts
│   │   └── export-agent.ts
│   ├── prompts/
│   │   ├── orchestrator.ts
│   │   └── agents.ts
│   ├── canvas/
│   │   ├── schema.ts
│   │   ├── read.ts
│   │   └── write.ts
│   └── lib/
│       ├── run-agent.ts
│       ├── fan-out.ts
│       ├── export.ts
│       ├── context-builder.ts
│       ├── summarize.ts
│       ├── telemetry.ts
│       └── budget.ts
├── prompts/
│   ├── orchestrator.md
│   ├── scout.md
│   ├── analyst.md
│   ├── sizer.md
│   ├── icp.md
│   ├── architect.md
│   ├── technical-cofounder.md
│   ├── gtm.md
│   ├── critic.md
│   ├── verifier.md
│   └── export-agent.md
├── canvas/
├── output/
└── logs/
```

## Debugging / Troubleshooting

- Invalid `ANTHROPIC_API_KEY`: confirm `.env` is loaded and the key is active
- Session stops near budget limit: check `MAX_SESSION_COST` and `COST_WARNING_THRESHOLD`
- Research is generic: the intake brief is still too vague; tighten the idea and rerun
- Export missing: confirm `/output` exists and rerun `/export`
- Partial research results: one agent may have failed, but the system should continue with successful reports

## Prompt Customization

Prompt markdown lives in `/prompts`, while the runtime prompt exports live in `src/prompts/`.
The implementation assumes these stay aligned.

## Limitations

- AI is not a lawyer; the legal lens only flags risks
- this is decision support, not investor-grade certainty
- output quality depends on the specificity of the intake brief and the quality of available sources

## README

# Cofounder Agent Swarm

A standalone local Node/TypeScript CLI that runs an AI cofounder swarm in terminal by calling Anthropic directly through `@anthropic-ai/sdk`.

No Anthropic CLI. No web app. No hosted backend. Bring your own `ANTHROPIC_API_KEY`.

---

## What It Does

You describe a startup idea. The Orchestrator sharpens it, challenges weak assumptions, launches specialist research only when the idea is ready, and drives the project toward a founder-facing export.

- `warmup` sharpens vague ideas through Socratic questioning
- `intake` writes the structured idea brief into canvas
- Scout, Analyst, and Sizer run in parallel with `Promise.allSettled`
- ICP analysis develops the clearest customer and willingness-to-pay view
- Architect researches stack, integrations, and infrastructure tradeoffs
- Technical Cofounder makes the architecture, scope, and build-vs-buy judgment calls
- GTM Specialist frames launch, channels, and monetization
- Critic pressure-tests the business and can apply an optional legal-risk lens
- Verifier checks structure, source presence, and obvious hallucination markers
- Export Agent writes the final markdown brief to `/output`

## Agent Roster

| Agent | Model | Role |
|---|---|---|
| Orchestrator | claude-opus-4-6 | Leads conversation, phase flow, and tool routing |
| Market Scout | claude-sonnet-4-6 | Pain mining, user quotes, demand signals |
| Competitor Analyst | claude-sonnet-4-6 | Competitor map, pricing, complaints, positioning |
| Market Sizer | claude-sonnet-4-6 | TAM/SAM/SOM, timing, funding and growth signals |
| ICP Whisperer | claude-sonnet-4-6 | Personas, urgency, WTP, buying context |
| Architect | claude-sonnet-4-6 | Technical research, stack and infra evaluation |
| Technical Cofounder | claude-opus-4-6 | Architecture judgment, MVP cuts, technical risk |
| GTM Specialist | claude-sonnet-4-6 | Channel strategy, launch plan, monetization framing |
| Critic | claude-opus-4-6 | Red-team pressure test, optional legal-risk lens |
| Verifier | claude-haiku-4-5-20251001 | Contract validation, source presence, hallucination markers |
| Export Agent | claude-sonnet-4-6 | Final markdown brief generation |

Research fan-out uses `Promise.allSettled`.
Projects begin in `warmup`, then move into `intake`.
Expected cost per full run: roughly `$0.60-$2.00`, depending on session length, reruns, and how much iteration happens before the idea is research-ready.

## Requirements

- Node.js 20+
- npm 10+
- Anthropic API key

## Installation

git clone https://github.com/YOUR_USERNAME/aicofounder-agents
cd aicofounder-agents
npm install
cp .env.example .env
# edit .env and add ANTHROPIC_API_KEY
npm start

## Configuration

`.env.example`

ANTHROPIC_API_KEY=sk-ant-your-key-here
MAX_SESSION_COST=2.00
COST_WARNING_THRESHOLD=0.80

## Running The CLI

The CLI starts a local REPL. Give it a vague idea or a sharp one.

You: I want to build something for solo founders.

Cofounder:
That's still too broad to research well.
What specific recurring workflow is breaking for solo founders today, and what are they doing instead?
```

If the idea is vague, the Orchestrator stays in `warmup`. Once the idea is sharp enough, it writes the intake brief into canvas and proceeds to research.

## REPL Commands

| Command | What It Does |
|---|---|
| `/canvas` | Print the current canvas JSON to terminal |
| `/rerun research` | Re-run Scout, Analyst, and Sizer using the current intake brief |
| `/rerun icp` | Re-run ICP analysis |
| `/rerun build` | Re-run Architect followed by Technical Cofounder |
| `/rerun gtm` | Re-run GTM planning |
| `/critic` | Run the Critic with the default lens |
| `/critic legal` | Run the Critic with the legal-risk lens |
| `/export` | Run Export Agent and write the final brief to `/output` |
| `/quit` or `/exit` | Save canvas and exit |
| Ctrl+C | Emergency exit; canvas should already be auto-saved |

## Project Structure

aicofounder-agents/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── orchestrator.ts
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── architect.ts
│   │   ├── technical-cofounder.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   ├── verifier.ts
│   │   └── export-agent.ts
│   ├── prompts/
│   │   ├── orchestrator.ts
│   │   └── agents.ts
│   ├── canvas/
│   │   ├── schema.ts
│   │   ├── read.ts
│   │   └── write.ts
│   └── lib/
│       ├── run-agent.ts
│       ├── fan-out.ts
│       ├── export.ts
│       ├── context-builder.ts
│       ├── summarize.ts
│       ├── telemetry.ts
│       └── budget.ts
├── prompts/
│   ├── orchestrator.md
│   ├── scout.md
│   ├── analyst.md
│   ├── sizer.md
│   ├── icp.md
│   ├── architect.md
│   ├── technical-cofounder.md
│   ├── gtm.md
│   ├── critic.md
│   ├── verifier.md
│   └── export-agent.md
├── canvas/
├── output/
└── logs/

## Debugging / Troubleshooting

- Invalid `ANTHROPIC_API_KEY`: confirm `.env` is loaded and the key is active
- Session stops near budget limit: check `MAX_SESSION_COST` and `COST_WARNING_THRESHOLD`
- Research is generic: the intake brief is still too vague; tighten the idea and rerun
- Export missing: confirm `/output` exists and rerun `/export`
- Partial research results: one agent may have failed, but the system should continue with successful reports

## Prompt Customization

Prompt markdown lives in `/prompts`, while the runtime prompt exports live in `src/prompts/`.
The implementation assumes these stay aligned.

## Limitations

- AI is not a lawyer; the legal lens only flags risks
- this is decision support, not investor-grade certainty
- output quality depends on the specificity of the intake brief and the quality of available sources

## Setup Notes

### Verify it works

```bash
npm start
# → Should print banner and ask for project name
# → Type a one-sentence idea and press Enter
# → Orchestrator should respond and propose a next step
```

### If you get TypeScript errors

```bash
npm install
# Then check Node version:
node --version  # Must be 18+
```

### Viewing canvas files

Canvas files are in `/canvas/[project-slug].json`. In VS Code:
- Install the "Prettier" extension to auto-format JSON
- Right-click → "Format Document" to make it readable

### Viewing exported briefs

Briefs land in `/output/`. In VS Code:
- Open the `.md` file
- Press `Cmd+Shift+V` (Mac) or `Ctrl+Shift+V` (Win/Linux) to open Markdown Preview
- Install "Markdown Preview Enhanced" for better rendering

### Editing prompts

Every agent prompt lives in both:
- `src/prompts/agents.ts` — used at runtime (edit this to change behavior immediately)
- `prompts/[agent].md` — human-readable reference (keep in sync manually)

Editing `src/prompts/agents.ts` is sufficient to change agent behavior.

### Reducing costs during testing

In `src/lib/run-agent.ts`, change the default model:
```typescript
model = 'claude-sonnet-4-6',  // ← change to 'claude-haiku-4-5-20251001' for testing
```

In `src/orchestrator.ts`, change the orchestrator model:
```typescript
model: 'claude-opus-4-6',  // ← change to 'claude-sonnet-4-6' for testing
```

aicofounder-agents/
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
---

*Cofounder Agent Swarm — open source, MIT license, GitHub stars appreciated.*