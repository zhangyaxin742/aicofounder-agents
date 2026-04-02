# Cofounder Agent Swarm - Planned Codebase

> Target end state after sprint: run locally with your own Anthropic API key via a terminal-first CLI. This document describes the planned codebase; the architecture doc is the source of truth for final roster, phase flow, tool list, budget defaults, and export behavior.

---

### Editorial Lock: Authority Reference

- cofounder-architecture.md is the single source of truth for the final agent roster, final phase flow, final tool list, final budget defaults, and final export behavior
- legacy build-planning labels are superseded by Architect + Technical Cofounder
- legacy legal-review labels are superseded by the Critic running an optional legal-risk lens
- legacy export-synthesis labels are superseded by the Export Agent
- legacy knowledge-extraction labels are deferred from sprint scope
- Research fan-out uses Promise.allSettled
- Projects begin in warmup, not intake
- This repo is positioned as a paid Anthropic local CLI, not a free runtime

## README

```markdown
# Cofounder Agent Swarm

A terminal-first local CLI that uses the Anthropic API to run an AI cofounder swarm. The active sprint roster is: Orchestrator, Market Scout, Competitor Analyst, Market Sizer, ICP Whisperer, Architect, Technical Cofounder, GTM Specialist, Critic, Verifier, and Export Agent.

No web app. No database. No auth. Run locally with your own Anthropic API key.

---

## What It Does

You describe your product idea. The Orchestrator leads the conversation, challenges assumptions, launches research, and pulls in specialist reports only when needed.

- Parallel market research via Scout, Analyst, and Sizer
- ICP analysis grounded in sourced pain and willingness-to-pay signals
- Build planning split between Architect research and Technical Cofounder judgment
- GTM planning and post-milestone Critic pressure tests
- Legal-risk flagging through the Critic's optional legal lens; AI is not a lawyer
- Verifier checks for structure, sourcing presence, and obvious hallucination markers
- Export Agent writes the final markdown brief to `/output`

## Agent Roster

| Agent | Model | Role |
|---|---|---|
| The Orchestrator | claude-opus-4-6 | Leads the conversation and directs all agents |
| Market Scout | claude-sonnet-4-6 | Pain mining, VOC, demand signals |
| Competitor Analyst | claude-sonnet-4-6 | Competitor map, pricing, complaints, tech stacks |
| Market Sizer | claude-sonnet-4-6 | TAM/SAM/SOM, timing, funding landscape |
| ICP Whisperer | claude-sonnet-4-6 | Personas, WTP, community locations |
| Architect | claude-sonnet-4-6 | Stack research, infrastructure costs, integrations, build sequence |
| Technical Cofounder | claude-opus-4-6 | Architecture decisions, MVP cuts, build-vs-buy, technical risk judgment |
| GTM Specialist | claude-sonnet-4-6 | 90-day plan, monetization framing, channel strategy |
| The Critic | claude-opus-4-6 | Kill-shot assumptions, adversarial red-team, optional legal-risk lens |
| The Verifier | claude-haiku-4-5-20251001 | Structural checks, sourcing presence, hallucination markers |
| Export Agent | claude-sonnet-4-6 | Final markdown brief export |

Scout, Analyst, and Sizer run in parallel with `Promise.allSettled` during the research phase.
Projects start in `warmup`, not `intake`.
Expected cost per full run: roughly `$0.60-$2.00`, depending on reruns and session length.
```

## Prerequisites

- Node.js 18+
- An Anthropic API key (https://console.anthropic.com)
- VS Code (recommended - canvas and briefs render natively)

---
## Installation

```bash
git clone https://github.com/YOUR_USERNAME/cofounder-swarm
cd cofounder-swarm
npm install
cp .env.example .env
# Open .env and add your ANTHROPIC_API_KEY
npm start
```

## Usage

```
You: I want to build a tool that helps solo founders validate startup ideas faster

── COFOUNDER ──────────────────────────────────────────────────

Interesting. Before we go further — "faster" compared to what? 
What's the specific friction point you're solving for? Because 
"faster validation" is a feature, not a product. What does the 
founder actually feel when they hit this problem?

I'm going to pull in research to ground this. Launching Scout,
Analyst, and Sizer in parallel now...
```

## REPL Commands

| Command | What It Does |
|---|---|
| `/export` | Assembles full canvas into a markdown brief → /output |
| `/canvas` | Prints the current canvas JSON to terminal |
| `/rerun` | Resets research phase so the next conversation turn re-runs Scout, Analyst, and Sizer |
| `/quit` or `/exit` | Saves canvas and exits |
| Ctrl+C | Emergency exit (canvas auto-saved on each turn) |

## Customizing Prompts

All agent system prompts live in `/prompts` as plain `.md` files.
Edit them without touching any code. The TypeScript files in
`src/prompts/` just import these as strings.

## Project Structure

```
cofounder-swarm/
├── .env.example
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              ← REPL entry point
│   ├── orchestrator.ts       ← Orchestrator loop + tool handling
│   ├── agents/               ← One file per agent (thin wrappers)
│   ├── lib/
│   │   ├── run-agent.ts      ← Core API call with web search
│   │   ├── fan-out.ts        ← Parallel research Promise.allSettled
│   │   └── export.ts         ← Canvas → markdown brief
│   ├── canvas/
│   │   ├── schema.ts         ← TypeScript types
│   │   ├── read.ts           ← Load canvas from disk
│   │   └── write.ts          ← Save canvas to disk
│   └── prompts/
│       ├── orchestrator.ts   ← Orchestrator system prompt
│       └── agents.ts         ← All agent system prompts
├── prompts/                  ← Raw .md prompt files (edit these)
│   ├── orchestrator.md
│   ├── scout.md
│   └── ...
├── canvas/                   ← Auto-created. One JSON per project.
└── output/                   ← Exported briefs land here
```

## Cost Estimates

Full research phase (3 parallel agents): ~$0.30–0.60
Full project run (all phases): ~$2–5 depending on depth

## Contributing

PRs welcome. The most valuable contributions are improved agent
prompts — edit the /prompts .md files and open a PR.

---

Built with the Anthropic API. No affiliation with Anthropic.
```

---

## File: `.env.example`

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## File: `package.json`

```json
{
  "name": "cofounder-swarm",
  "version": "1.0.0",
  "description": "Multi-agent AI cofounder swarm — runs in your terminal",
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "type": "module"
}
```

---

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## File: `src/canvas/schema.ts`

```typescript
export interface Canvas {
  project: {
    id: string;
    name: string;
    created_at: string;
    phase:
      | 'warmup'
      | 'intake'
      | 'research'
      | 'icp'
      | 'positioning'
      | 'build'
      | 'gtm'
      | 'fundraising'
      | 'launched';
  };
  idea: {
    summary?: string;
    founder_context?: string;
    initial_assumptions?: string[];
    open_questions?: string[];
    last_updated?: string;
  };
  research: {
    raw_reports?: {
      scout?: string;
      analyst?: string;
      sizer?: string;
    };
    pain_signals?: string[];
    user_quotes?: string[];
    market_size?: {
      tam?: string;
      sam?: string;
      som?: string;
    };
    timing_verdict?: string;
    last_updated?: string;
  };
  icp: {
    raw_report?: string;
    personas?: unknown[];
    primary_icp?: string;
    willingness_to_pay?: string;
    last_updated?: string;
  };
  positioning: {
    thesis?: string;
    feature_strategy?: unknown[];
    blue_ocean?: unknown;
    one_liner?: string;
    last_updated?: string;
  };
  build: {
    raw_report?: string;
    mvp_scope?: unknown[];
    recommended_stack?: unknown;
    technical_risks?: string[];
    last_updated?: string;
  };
  legal: {
    raw_report?: string;
    risks?: unknown[];
    actions_required?: string[];
    last_updated?: string;
  };
  gtm: {
    raw_report?: string;
    primary_channel?: string;
    monetization_model?: unknown;
    unit_economics?: unknown;
    last_updated?: string;
  };
  fundraising: {
    strategy?: string;
    investor_list?: unknown[];
    pitch_framing?: unknown;
    last_updated?: string;
  };
  critic_reports: Array<{
    report: string;
    timestamp: string;
  }>;
  decisions: Array<{
    date: string;
    decision: string;
    rationale?: string;
  }>;
  risks: {
    items?: unknown[];
    last_updated?: string;
  };
  [key: string]: unknown;
}
```

---

## File: `src/canvas/read.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Canvas } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANVAS_DIR = path.join(process.cwd(), 'canvas');

export function ensureCanvasDir(): void {
  if (!fs.existsSync(CANVAS_DIR)) {
    fs.mkdirSync(CANVAS_DIR, { recursive: true });
  }
}

export function listProjects(): string[] {
  ensureCanvasDir();
  return fs
    .readdirSync(CANVAS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

export function loadCanvas(slug: string): Canvas {
  const filePath = path.join(CANVAS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Canvas not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Canvas;
}

export function createCanvas(name: string): Canvas {
  return {
    project: {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
      phase: 'warmup',
    },
    idea: {},
    research: {},
    icp: {},
    positioning: {},
    build: {},
    legal: {},
    gtm: {},
    fundraising: {},
    critic_reports: [],
    decisions: [],
    risks: {},
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
}
```

---

## File: `src/canvas/write.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import type { Canvas } from './schema.js';

const CANVAS_DIR = path.join(process.cwd(), 'canvas');

export function saveCanvas(slug: string, canvas: Canvas): void {
  if (!fs.existsSync(CANVAS_DIR)) {
    fs.mkdirSync(CANVAS_DIR, { recursive: true });
  }
  const filePath = path.join(CANVAS_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(canvas, null, 2), 'utf-8');
}
```

---

## File: `src/lib/run-agent.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Anthropic built-in web search tool.
// Searches are executed server-side — no external API keys needed.
const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
} as unknown as Anthropic.Messages.Tool;

export interface AgentOptions {
  systemPrompt: string;
  userMessage: string;
  agentName: string;
  model?: string;
  maxTokens?: number;
  webSearch?: boolean;
}

export async function runAgent({
  systemPrompt,
  userMessage,
  agentName,
  model = 'claude-sonnet-4-6',
  maxTokens = 8000,
  webSearch = true,
}: AgentOptions): Promise<string> {
  process.stdout.write(chalk.yellow(`  → ${agentName} researching`));

  // Animate dots while waiting
  const interval = setInterval(() => process.stdout.write(chalk.yellow('.')), 1200);

  // Retry on transient errors (overload / rate limit) with exponential backoff.
  // Max 3 attempts: immediate, 8s, 24s.
  const MAX_RETRIES = 3;
  const BACKOFF_BASE_MS = 8_000;
  const RETRYABLE = ['overloaded_error', 'rate_limit_error', '529', '529'];

  let response!: Anthropic.Messages.Message; // assigned before use — loop throws on all failure paths
  let lastError: unknown;

  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          ...(webSearch && { tools: [WEB_SEARCH_TOOL] }),
        });
        break; // success — exit retry loop
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable = RETRYABLE.some((token) => msg.includes(token));

        if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;

        const waitMs = BACKOFF_BASE_MS * Math.pow(3, attempt);
        process.stdout.write(chalk.yellow(` [retry ${attempt + 1}/${MAX_RETRIES - 1} in ${waitMs / 1000}s]`));
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  } finally {
    clearInterval(interval);
  }

  const inputK = Math.round((response.usage?.input_tokens ?? 0) / 1000);
  const outputK = Math.round((response.usage?.output_tokens ?? 0) / 1000);
  process.stdout.write(
    chalk.green(` done`) + chalk.gray(` (${inputK}k→${outputK}k tokens)\n`)
  );

  // Extract all text content. Web search results are embedded server-side;
  // Claude's written report comes through as text blocks.
  const text = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!text.trim()) {
    return `[${agentName} returned no text content. Stop reason: ${response.stop_reason}]`;
  }

  return text;
}

export function buildAgentMessage(brief: string, canvas: unknown): string {
  return `<brief>\n${brief}\n</brief>\n\n<canvas>\n${JSON.stringify(canvas, null, 2)}\n</canvas>`;
}
```

---

## File: `src/lib/fan-out.ts`

```typescript
import chalk from 'chalk';
import { runAgent, buildAgentMessage } from './run-agent.js';
import { SCOUT_SYSTEM_PROMPT, ANALYST_SYSTEM_PROMPT, SIZER_SYSTEM_PROMPT } from '../prompts/agents.js';
import type { Canvas } from '../canvas/schema.js';

export interface ResearchPhaseResult {
  scoutReport: string;
  analystReport: string;
  sizerReport: string;
}

// Minimum token threshold for a valid agent report.
// Reports shorter than this are almost certainly truncated or errored.
const MIN_REPORT_TOKENS = 300;

/**
 * Runs Scout, Analyst, and Sizer in parallel.
 * Each agent operates in its own context window — no cross-contamination.
 * Uses Promise.allSettled so one failed agent doesn't kill the whole phase.
 * Results are returned to the orchestrator for synthesis.
 */
export async function runResearchPhase(
  brief: string,
  canvas: Canvas
): Promise<ResearchPhaseResult> {
  const message = buildAgentMessage(brief, canvas);

  console.log(chalk.yellow('\n  Launching Scout, Analyst, and Sizer in parallel...\n'));

  // allSettled: a single agent failure returns a fallback string rather than
  // throwing and losing all three results.
  const [scoutSettled, analystSettled, sizerSettled] = await Promise.allSettled([
    runAgent({
      systemPrompt: SCOUT_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'Market Scout     ',
    }),
    runAgent({
      systemPrompt: ANALYST_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'Competitor Analyst',
    }),
    runAgent({
      systemPrompt: SIZER_SYSTEM_PROMPT,
      userMessage: message,
      agentName: 'Market Sizer     ',
    }),
  ]);

  function resolveReport(settled: PromiseSettledResult<string>, agentName: string): string {
    if (settled.status === 'rejected') {
      console.error(chalk.red(`  ✗ ${agentName} failed: ${settled.reason}`));
      return `[${agentName} FAILED — ${settled.reason}. Re-run or proceed with partial data.]`;
    }
    const text = settled.value;
    // Rough token estimate: 1 token ≈ 4 chars
    if (text.length < MIN_REPORT_TOKENS * 4) {
      console.warn(chalk.yellow(`  ⚠ ${agentName} output is suspiciously short (${text.length} chars). May be incomplete.`));
    }
    return text;
  }

  const scoutReport   = resolveReport(scoutSettled,   'Market Scout');
  const analystReport = resolveReport(analystSettled, 'Competitor Analyst');
  const sizerReport   = resolveReport(sizerSettled,   'Market Sizer');

  const failCount = [scoutSettled, analystSettled, sizerSettled].filter(s => s.status === 'rejected').length;
  if (failCount === 3) {
    throw new Error('All three research agents failed. Check API key and network, then retry.');
  }
  if (failCount > 0) {
    console.log(chalk.yellow(`\n  ⚠ Research phase complete with ${failCount} agent failure(s). Orchestrator will see failure notices inline.\n`));
  } else {
    console.log(chalk.green('\n  ✓ Research phase complete\n'));
  }

  return { scoutReport, analystReport, sizerReport };
}
```

---

## File: `src/lib/export.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import type { Canvas } from '../canvas/schema.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function exportBrief(canvas: Canvas, slug: string): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}-brief-${date}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);
  const brief = assembleBrief(canvas);
  fs.writeFileSync(filePath, brief, 'utf-8');
  return filePath;
}

function section(title: string, content: string): string {
  return `---\n\n## ${title}\n\n${content}`;
}

function assembleBrief(canvas: Canvas): string {
  const parts: string[] = [];

  parts.push(`# ${canvas.project.name} — Research Brief`);
  parts.push(
    `**Date:** ${new Date().toISOString().split('T')[0]}  \n` +
    `**Phase:** ${canvas.project.phase}  \n` +
    `**Project ID:** ${canvas.project.id}`
  );

  if (canvas.idea?.summary) {
    const idea = canvas.idea;
    let content = idea.summary ?? '';
    if (idea.initial_assumptions?.length) {
      content += '\n\n**Initial Assumptions:**\n' +
        idea.initial_assumptions.map((a) => `- ${a}`).join('\n');
    }
    if (idea.open_questions?.length) {
      content += '\n\n**Open Questions:**\n' +
        idea.open_questions.map((q) => `- ${q}`).join('\n');
    }
    parts.push(section('Idea Summary', content));
  }

  const r = canvas.research;
  if (r?.raw_reports) {
    const researchParts: string[] = [];
    if (r.raw_reports.scout) {
      researchParts.push(`### Market Scout Report\n\n${r.raw_reports.scout}`);
    }
    if (r.raw_reports.analyst) {
      researchParts.push(`### Competitor Analysis\n\n${r.raw_reports.analyst}`);
    }
    if (r.raw_reports.sizer) {
      researchParts.push(`### Market Sizing\n\n${r.raw_reports.sizer}`);
    }
    if (researchParts.length) {
      parts.push(section('SECTION 1: Market Research', researchParts.join('\n\n')));
    }
  }

  if (canvas.icp?.raw_report) {
    parts.push(section('SECTION 2: ICP & Customer Intelligence', canvas.icp.raw_report));
  }

  if (canvas.positioning?.thesis) {
    let content = `**Thesis:** ${canvas.positioning.thesis}`;
    if (canvas.positioning.one_liner) {
      content += `\n\n**One-liner:** ${canvas.positioning.one_liner}`;
    }
    parts.push(section('SECTION 3: Differentiation & Positioning', content));
  }

  if (canvas.build?.raw_report) {
    parts.push(section('SECTION 4: Tech & Product Stack', canvas.build.raw_report));
  }

  if (canvas.legal?.raw_report) {
    parts.push(section('Legal Assessment', canvas.legal.raw_report));
  }

  if (canvas.gtm?.raw_report) {
    parts.push(section('SECTION 5–6: GTM & Fundraising', canvas.gtm.raw_report));
  }

  if (canvas.critic_reports?.length) {
    const criticContent = canvas.critic_reports
      .map((r, i) => `### Critic Report ${i + 1} — ${r.timestamp.split('T')[0]}\n\n${r.report}`)
      .join('\n\n');
    parts.push(section('Critic Reports', criticContent));
  }

  if (canvas.decisions?.length) {
    const decisionsContent = canvas.decisions
      .map((d) => {
        let line = `**${d.date}:** ${d.decision}`;
        if (d.rationale) line += `\n*Rationale: ${d.rationale}*`;
        return line;
      })
      .join('\n\n');
    parts.push(section('Decision Log', decisionsContent));
  }

  parts.push('\n---\n\n*Generated by Cofounder Agent Swarm*');
  return parts.join('\n\n');
}
```

---

## File: `src/orchestrator.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import type { Canvas } from './canvas/schema.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './prompts/orchestrator.js';
import {
  ICP_SYSTEM_PROMPT,
  ENGINEER_SYSTEM_PROMPT,
  LEGAL_SYSTEM_PROMPT,
  GTM_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
} from './prompts/agents.js';
import { runResearchPhase } from './lib/fan-out.js';
import { runAgent, buildAgentMessage } from './lib/run-agent.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Orchestrator Tools ───────────────────────────────────────────────────────
// These are custom tools the Orchestrator uses to delegate to subagents.
// Each invocation triggers one or more Claude API calls.

const ORCHESTRATOR_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'run_research_phase',
    description:
      'Launch the parallel research swarm: Market Scout (pain mining, Reddit, VOC), Competitor Analyst (landscape, pricing, complaints), and Market Sizer (TAM/SAM/SOM, timing, funding) all run simultaneously. Use this when you need market grounding before moving forward. CALL THIS TOOL ONLY ONCE PER PROJECT — re-running it wastes ~$0.15–0.30 and overwrites prior findings. If the user wants to revisit specific research questions, use individual follow-up conversation instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'A detailed, specific research brief covering three distinct territories — one per agent. (1) Scout territory: which specific subreddits, review platforms, and communities to mine for pain language. (2) Analyst territory: which named competitors to map, what pricing/feature gaps to look for. (3) Sizer territory: which market definition to use, which data sources to pull. Vague briefs produce duplicate work across agents.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_icp_analysis',
    description:
      'Launch the ICP Whisperer to build detailed customer personas, willingness-to-pay ranges, behavioral signals, and specific community locations for the target customer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What specifically to investigate about the customer. Which segments to explore, what WTP data to find, which communities to check.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_engineering_review',
    description:
      'Launch the Architect first and then the Technical Cofounder to produce stack research, infrastructure cost modeling, MVP scope cuts, build-vs-buy decisions, and technical risks.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What to focus on. Which product decisions to validate. What technical unknowns to surface.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_critic_legal_lens',
    description:
      'Deprecated in sprint scope. Use The Critic with a legal-risk brief when regulatory or IP exposure needs to be pressure-tested.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'Which legal areas to focus on. Any specific regulatory concerns, IP questions, or data handling risks to investigate.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_gtm_planning',
    description:
      'Launch the GTM + Fundraising Specialist to produce a week-by-week 90-day plan, monetization model, unit economics, and a named investor list with thesis and check sizes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'Which GTM questions to answer and what fundraising context to consider.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_critic',
    description:
      'Launch The Critic for adversarial red-teaming. Surfaces kill-shot assumptions, competitive vulnerabilities, distribution fantasies, and the uncomfortable truths the team is avoiding. Run this after every major milestone.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What to specifically pressure-test. Which assumptions to attack. What the founder seems most attached to.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'update_canvas',
    description:
      'Write structured data to the project canvas. Use this after synthesizing agent outputs — record the key findings, decisions, and positioning work so nothing is lost between sessions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: [
            'idea',
            'research',
            'icp',
            'positioning',
            'build',
            'legal',
            'gtm',
            'fundraising',
            'decisions',
            'risks',
          ],
          description: 'Which canvas section to update.',
        },
        content: {
          type: 'object',
          description: 'The structured data to merge into this section.',
        },
      },
      required: ['section', 'content'],
    },
  },
];

// ─── Tool Handler ─────────────────────────────────────────────────────────────

async function handleTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  canvas: Canvas
): Promise<{ output: string; updatedCanvas: Canvas }> {
  let updatedCanvas = structuredClone(canvas);
  const brief = toolInput.brief as string;

  switch (toolName) {
    case 'run_research_phase': {
      // Phase gate: research runs once per project. If the canvas already has
      // research data and the user hasn't explicitly requested a rerun, return
      // a warning rather than overwriting findings and burning $0.15–0.30.
      if (!@('warmup', 'intake').Contains(canvas.project.phase) && canvas.research?.raw_reports) {
        return {
          output: `Research phase already completed (phase: ${canvas.project.phase}). Raw reports are in the canvas. To re-run research, type /rerun in the chat.`,
          updatedCanvas: canvas,
        };
      }

      const { scoutReport, analystReport, sizerReport } = await runResearchPhase(brief, canvas);

      // Validate that each report contains its required section header before
      // writing to canvas. A missing header means the agent produced malformed
      // output (truncation, refusal, or hallucination) and the orchestrator
      // should see a warning alongside the raw text rather than silently
      // persisting bad data.
      function validateReport(report: string, expectedHeader: string, agentName: string): string {
        if (!report.includes(expectedHeader)) {
          console.warn(chalk.yellow(`  ⚠ ${agentName} output missing expected header "${expectedHeader}". May be malformed.`));
          return `[VALIDATION WARNING: ${agentName} output did not contain "${expectedHeader}". Review carefully.]\n\n${report}`;
        }
        return report;
      }

      const validatedScout   = validateReport(scoutReport,   'MARKET SCOUT REPORT',      'Market Scout');
      const validatedAnalyst = validateReport(analystReport, 'COMPETITOR ANALYST REPORT', 'Competitor Analyst');
      const validatedSizer   = validateReport(sizerReport,   'MARKET SIZER REPORT',       'Market Sizer');

      const output = [
        '=== MARKET SCOUT REPORT ===',
        validatedScout,
        '',
        '=== COMPETITOR ANALYST REPORT ===',
        validatedAnalyst,
        '',
        '=== MARKET SIZER REPORT ===',
        validatedSizer,
      ].join('\n');
      updatedCanvas.research = {
        ...canvas.research,
        raw_reports: { scout: validatedScout, analyst: validatedAnalyst, sizer: validatedSizer },
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'research';
      return { output, updatedCanvas };
    }

    case 'run_icp_analysis': {
      console.log(chalk.yellow('\n  👤 Launching ICP Whisperer...\n'));
      const report = await runAgent({
        systemPrompt: ICP_SYSTEM_PROMPT,
        userMessage: buildAgentMessage(brief, canvas),
        agentName: 'ICP Whisperer',
      });
      updatedCanvas.icp = { raw_report: report, last_updated: new Date().toISOString() };
      updatedCanvas.project.phase = 'icp';
      return { output: report, updatedCanvas };
    }

    case 'run_engineering_review': {
      console.log(chalk.yellow('\n  ⚙️  Launching Architect, then Technical Cofounder...\n'));
      const report = await runAgent({
        systemPrompt: ARCHITECT_SYSTEM_PROMPT, // sprint roster: Architect researches first; Technical Cofounder then judges
        userMessage: buildAgentMessage(brief, canvas),
        agentName: 'Architect', // historical snippet retained; active sprint flow is Architect + Technical Cofounder
      });
      updatedCanvas.build = { raw_report: report, last_updated: new Date().toISOString() };
      updatedCanvas.project.phase = 'build';
      return { output: report, updatedCanvas };
    }

    case 'run_critic_legal_lens': {
      console.log(chalk.yellow('\n  ⚖️  Launching Critic legal-risk lens...\n'));
      const report = await runAgent({
        systemPrompt: CRITIC_SYSTEM_PROMPT, // sprint roster folds legal-risk review into the Critic
        userMessage: buildAgentMessage(brief, canvas),
        agentName: 'The Critic', // final sprint roster folds legal-risk review into the Critic
      });
      updatedCanvas.legal = { raw_report: report, last_updated: new Date().toISOString() };
      return { output: report, updatedCanvas };
    }

    case 'run_gtm_planning': {
      console.log(chalk.yellow('\n  🚀 Launching GTM + Fundraising Specialist...\n'));
      const report = await runAgent({
        systemPrompt: GTM_SYSTEM_PROMPT,
        userMessage: buildAgentMessage(brief, canvas),
        agentName: 'GTM Specialist',
      });
      updatedCanvas.gtm = { raw_report: report, last_updated: new Date().toISOString() };
      updatedCanvas.project.phase = 'gtm';
      return { output: report, updatedCanvas };
    }

    case 'run_critic': {
      console.log(chalk.yellow('\n  🔥 Launching The Critic...\n'));
      const report = await runAgent({
        systemPrompt: CRITIC_SYSTEM_PROMPT,
        userMessage: buildAgentMessage(brief, canvas),
        agentName: 'The Critic',
        model: 'claude-opus-4-6', // Critic always runs Opus
        maxTokens: 6000,
      });
      updatedCanvas.critic_reports = [
        ...(canvas.critic_reports ?? []),
        { report, timestamp: new Date().toISOString() },
      ];
      return { output: report, updatedCanvas };
    }

    case 'update_canvas': {
      const s = toolInput.section as string;
      updatedCanvas[s] = {
        ...(typeof canvas[s] === 'object' && canvas[s] !== null ? canvas[s] as object : {}),
        ...(toolInput.content as object),
        last_updated: new Date().toISOString(),
      };
      return { output: `Canvas section "${s}" updated.`, updatedCanvas };
    }

    default:
      return { output: `Unknown tool: ${toolName}`, updatedCanvas: canvas };
  }
}

// ─── Orchestrator Turn ────────────────────────────────────────────────────────

export async function runOrchestratorTurn(
  messages: Anthropic.Messages.MessageParam[],
  canvas: Canvas
): Promise<{ response: string; updatedCanvas: Canvas }> {
  const systemPrompt = ORCHESTRATOR_SYSTEM_PROMPT.replace(
    '{{CANVAS_STATE}}',
    JSON.stringify(canvas, null, 2)
  );

  let currentMessages = [...messages];
  let updatedCanvas = canvas;
  let finalResponse = '';

  // Agentic loop — continue while orchestrator is calling tools
  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: currentMessages,
      tools: ORCHESTRATOR_TOOLS,
    });

    // Capture any text the orchestrator produced this turn
    const textBlocks = response.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
    );
    if (textBlocks.length > 0) {
      finalResponse = textBlocks.map((b) => b.text).join('\n');
    }

    // Done — no tool calls
    if (response.stop_reason !== 'tool_use') break;

    // Handle tool calls
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
    );

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const { output, updatedCanvas: newCanvas } = await handleTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        updatedCanvas
      );
      updatedCanvas = newCanvas;
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: output,
      });
    }

    // Append assistant response + tool results to continue the loop
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  return { response: finalResponse, updatedCanvas };
}
```

---

## File: `src/index.ts`

```typescript
import 'dotenv/config';
import readline from 'readline';
import chalk from 'chalk';
import type { Anthropic } from '@anthropic-ai/sdk';
import { runOrchestratorTurn } from './orchestrator.js';
import { loadCanvas, createCanvas, listProjects, slugify } from './canvas/read.js';
import { saveCanvas } from './canvas/write.js';
import { exportBrief } from './lib/export.js';
import type { Canvas } from './canvas/schema.js';

type MessageParam = Anthropic['messages']['create'] extends (params: infer P) => unknown
  ? P extends { messages: Array<infer M> }
    ? M
    : never
  : never;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function printBanner(): void {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║        COFOUNDER AGENT SWARM  v1.0            ║'));
  console.log(chalk.bold.cyan('║  Orchestrator · Research · ICP · Build · GTM  ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════╝\n'));
  console.log(chalk.gray('Commands: /export  /canvas  /quit\n'));
}

function printHelp(): void {
  console.log(chalk.gray('\n  /export   → assemble full canvas into a markdown brief'));
  console.log(chalk.gray('  /canvas   → print current canvas JSON'));
  console.log(chalk.gray('  /quit     → save and exit\n'));
}

// ─── Project Selection ────────────────────────────────────────────────────────

async function selectProject(
  rl: readline.Interface
): Promise<{ canvas: Canvas; slug: string }> {
  const projects = listProjects();

  if (projects.length > 0) {
    console.log(chalk.yellow('Existing projects:'));
    projects.forEach((p, i) =>
      console.log(chalk.gray(`  [${i + 1}] ${p}`))
    );
    console.log(chalk.gray('  [n] Start a new project\n'));

    const choice = await prompt(rl, chalk.bold.green('Select > '));
    const idx = parseInt(choice, 10) - 1;

    if (!isNaN(idx) && idx >= 0 && idx < projects.length) {
      const slug = projects[idx];
      const canvas = loadCanvas(slug);
      console.log(chalk.green(`\nLoaded: ${slug}`));
      console.log(chalk.gray(`Phase: ${canvas.project.phase}`));
      if (canvas.idea?.summary) {
        console.log(chalk.gray(`Idea: ${canvas.idea.summary.slice(0, 80)}...`));
      }
      console.log();
      return { canvas, slug };
    }
  }

  // New project
  const name = await prompt(
    rl,
    chalk.bold.green('\nDescribe your idea (or just give it a name): ')
  );
  const slug = slugify(name || 'new-project');
  const canvas = createCanvas(name || 'New Project');
  return { canvas, slug };
}

// ─── Main REPL ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('\nError: ANTHROPIC_API_KEY is not set.'));
    console.error(chalk.gray('Copy .env.example to .env and add your key.\n'));
    process.exit(1);
  }

  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let { canvas, slug } = await selectProject(rl);

  // Conversation history — last 40 messages (20 turns) to keep context manageable
  const history: { role: 'user' | 'assistant'; content: string }[] = [];

  console.log(chalk.bold.cyan('── COFOUNDER ─────────────────────────────────────────────────\n'));

  // Main loop
  const lineIterator = rl[Symbol.asyncIterator]();
  process.stdout.write(chalk.bold.white('You: '));

  for await (const line of lineIterator) {
    const input = line.trim();
    if (!input) {
      process.stdout.write(chalk.bold.white('You: '));
      continue;
    }

    // Built-in commands
    if (input === '/quit' || input === '/exit') {
      saveCanvas(slug, canvas);
      console.log(chalk.gray('\nCanvas saved. Goodbye.\n'));
      break;
    }
    if (input === '/help') {
      printHelp();
      process.stdout.write(chalk.bold.white('You: '));
      continue;
    }
    if (input === '/canvas') {
      console.log('\n' + chalk.gray(JSON.stringify(canvas, null, 2)) + '\n');
      process.stdout.write(chalk.bold.white('You: '));
      continue;
    }
    if (input === '/rerun') {
      // Reset phase to 'warmup' so the phase gate in run_research_phase allows a new run.
      canvas.project.phase = 'warmup';
      canvas.research = {};
      saveCanvas(slug, canvas);
      console.log(chalk.yellow('\nResearch phase reset. The next run_research_phase call will re-run all three agents.\n'));
      process.stdout.write(chalk.bold.white('You: '));
      continue;
    }
    if (input === '/export') {
      try {
        const briefPath = await exportBrief(canvas, slug);
        console.log(chalk.green(`\n✓ Brief exported → ${briefPath}`));
        console.log(chalk.gray('  Open in VS Code: code ' + briefPath + '\n'));
      } catch (err) {
        console.error(chalk.red('Export failed:'), err);
      }
      process.stdout.write(chalk.bold.white('You: '));
      continue;
    }

    // Add user message to history
    history.push({ role: 'user', content: input });

    console.log(chalk.bold.cyan('\n── COFOUNDER ─────────────────────────────────────────────────\n'));

    try {
      const { response, updatedCanvas } = await runOrchestratorTurn(history, canvas);
      canvas = updatedCanvas;
      saveCanvas(slug, canvas);
      console.log(chalk.cyan(response));
      history.push({ role: 'assistant', content: response });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red('\nError during orchestrator turn:'), message);
      if (message.includes('overloaded')) {
        console.log(chalk.yellow('API overloaded — wait a moment and try again.\n'));
      }
    }

    // Trim history to last 40 messages
    if (history.length > 40) history.splice(0, 2);

    console.log();
    process.stdout.write(chalk.bold.white('You: '));
  }

  rl.close();
}

main().catch((err) => {
  console.error(chalk.red('\nFatal error:'), err);
  process.exit(1);
});
```

---

## File: `src/prompts/orchestrator.ts`

```typescript
export const ORCHESTRATOR_SYSTEM_PROMPT = `You are a world-class founding CEO and product visionary. You think like Steve Jobs (taste as a filter, brutal simplicity, saying no to 99% so 1% can be excellent), reason like Peter Thiel (contrarian interrogation, zero-to-one thinking, the question "what do you believe that no one else does?"), operate like Paul Graham (make something people want — nothing else matters, talk to users, find the real problem not the stated one), move like Zuckerberg (ruthless prioritization, no ego on the work, ship and learn), and plan like Bezos (work backwards from the customer, write the press release first, think in decades).

You are NOT an assistant. You are a cofounder. You lead. You don't wait for instructions — you propose the next move, challenge weak assumptions, and push the founder to think harder than they would on their own.

YOUR OPERATING PRINCIPLES:
1. Say no more than yes. Most features, pivots, and ideas are wrong. Help the founder find the one thing that matters and ignore the rest.
2. Question assumptions before accepting them. "This will work" is not a reason. "Because X users said Y and competitor Z failed to solve it by doing W" is a reason.
3. Never validate bad ideas to be kind. Honesty is respect. Softening a bad idea doesn't help anyone.
4. Always know where the project is in its lifecycle. Read the canvas before every response. Notice contradictions between what the founder says and what the canvas shows.
5. Lead the conversation. End every response with either: a specific proposed next step, one probing question, or an explanation of which agent you're invoking and why.
6. Delegate all research and domain work to agents. You do NOT do deep research yourself — you synthesize what agents bring back and make decisions.
7. When you receive agent reports, don't just summarize them — interpret them. Tell the founder what the findings mean for their specific decisions.

YOUR CURRENT PROJECT CANVAS:
<canvas>
{{CANVAS_STATE}}
</canvas>

YOUR AVAILABLE AGENTS — invoke them using the tools provided:
- run_research_phase: Market Scout + Competitor Analyst + Market Sizer run in parallel. Use when you need market grounding. Write a specific brief — not "research this space" but exactly which subreddits, which competitors, which pain points to validate.
- run_icp_analysis: ICP Whisperer builds personas with behavioral signals, community locations, and WTP. Use after research confirms the market is real.
- run_engineering_review: Architect researches stacks/costs first, then Technical Cofounder makes architecture and MVP scope decisions.
- run_critic_legal_lens: Deprecated in sprint scope. Use run_critic with a legal-risk brief when product touches regulated data or novel IP.
- run_gtm_planning: GTM + Fundraising Specialist produces week-by-week 90-day plan, monetization model, unit economics, named investors.
- run_critic: The Critic red-teams everything. Finds kill-shot assumptions and the uncomfortable truths. Run this after phases 1, 2, and 3 at minimum.
- update_canvas: Record decisions, positioning work, and synthesized findings. Use this to ensure nothing is lost between sessions.

EFFORT SCALING — embed this logic when writing agent briefs:
- Simple clarification needed: ask the founder, no agent needed
- Single domain question: one agent, focused brief
- Full market grounding: run_research_phase (all 3 parallel agents)
- Post-research depth: individual domain agents in sequence
- After major milestone: always run_critic

PHASE RULES — enforce these without exception:
- run_research_phase: call ONCE per project. If canvas.research is already populated, do not call again. Use /rerun if the founder explicitly requests a redo.
- run_icp_analysis: only after research phase is complete and canvas shows meaningful pain signals.
- run_critic: mandatory after phases 2, 4, and 6 complete. Not optional, not skippable.
- update_canvas: call after every synthesis turn where you've drawn conclusions — decisions not in canvas are decisions lost.

BRIEF WRITING RULES — when you write the brief argument for any agent tool:
- run_research_phase briefs must name three distinct territories (Scout: sources + pain framing; Analyst: named competitors to target; Sizer: market definition + data sources). Never give all three agents the same brief.
- All other agent briefs: name specific questions, not just "analyze this." Bad: "research the GTM." Good: "Find the top 3 distribution channels that similar B2B dev tools used to get their first 500 users. Name specific communities."

CONVERSATION STYLE:
- Direct. No padding. No "Great question!" or "Certainly!".
- One question at a time when you need clarification.
- Reference specific things from the canvas and the founder's prior messages.
- State opinions clearly. "I think X" not "One approach could be X."
- Use the language of building: shipping, retention, CAC, ICP, distribution, moat, churn.
- When something is genuinely good, say so and build on it immediately.
- When something is weak, name it precisely and offer a better frame.

WHAT YOU ARE NOT:
- Not a yes-man. If an idea is weak, say so.
- Not a research assistant. Agents research; you synthesize and decide.
- Not a writing service. You make product and strategy decisions.
- Not neutral. You have strong opinions on product and will defend them.`;
```

---

## File: `src/prompts/agents.ts`

```typescript
// ─── Market Scout ─────────────────────────────────────────────────────────────

export const SCOUT_SYSTEM_PROMPT = `You are a specialized market research agent. Your only job is to find what real people are actually saying about this problem online — unfiltered, specific, and cited. You never paraphrase when you can quote directly.

YOU WILL BE GIVEN:
- A <brief> with specific research instructions
- A <canvas> with full project context

SCOPE BOUNDARY — you run in parallel with two other agents:
- The Competitor Analyst covers: competitor features, pricing pages, tech stacks, funding rounds, whitespace mapping. Do NOT duplicate this work.
- The Market Sizer covers: TAM/SAM/SOM, CAGR figures, VC activity, market timing. Do NOT duplicate this work.
Your exclusive territory: user pain language, behavioral signals, direct quotes, demand evidence. Stay in it.

YOUR RESEARCH MANDATE:
Mine these sources aggressively using web search:
- Reddit: Find threads in relevant subreddits. Pull exact complaint language, workarounds, feature requests. Quote directly.
- X/Twitter: Find posts where people express frustration or desire related to this problem.
- App Store / Google Play: If competitors exist, mine their 1–3 star reviews for churn signals and pain language.
- Product Hunt: Comments on competitor launches reveal what users wish existed.
- G2, Capterra, Trustpilot: For B2B products, mine what buyers complain about in competitors.
- Hacker News: Search "Ask HN" threads for relevant discussions.

SEARCH STRATEGY:
Run 8–12 distinct, specific searches. Search for:
- The problem itself in natural language ("hate managing my X", "frustrated with Y")
- Competitor names + "review" or "alternatives"
- "[problem] Reddit", "[problem] forum"
- "wish [competitor] would", "switched from [competitor] because"
- "[space] frustrating", "worst thing about [tool]"

Do NOT use generic search terms. Be specific to the brief you've been given.

OUTPUT FORMAT — return exactly this structure:

---
MARKET SCOUT REPORT
Searches run: [number]
Sources checked: [list]

TOP PAIN SIGNALS (ranked by frequency and intensity):
1. [Pain point]: [evidence — specific sources and frequency]
2. [Pain point]: [evidence]
3. [continue for all significant signals]

EXACT USER QUOTES (minimum 6 — real pulled quotes with source attribution):
- "[exact quote]" — [source: Reddit r/[sub] / App Store review / G2 / etc.]
- "[exact quote]" — [source]
[continue — more is better here]

DEMAND SIGNALS (evidence people would pay for a solution):
- [signal]: [source + context]

WHAT PEOPLE SAY THEY WISH EXISTED:
- [wish]: [source]

GAPS IN CURRENT SOLUTIONS (what competitors are consistently failing at):
- [gap]: [evidence — cited]

CONFIDENCE LEVEL: [High / Medium / Low]
Reason: [why this confidence level — note any data gaps honestly]
---

RULES:
- Never invent quotes or attribute paraphrases as direct quotes
- Flag honestly when you couldn't find strong signal for something
- Prioritize posts from the last 18 months
- Specificity beats breadth — 4 great quotes beat 12 weak ones`;

// ─── Competitor Analyst ───────────────────────────────────────────────────────

export const ANALYST_SYSTEM_PROMPT = `You are a specialized competitive intelligence agent. Your job is to produce an accurate, complete, and decision-useful competitor map — the kind a product team would actually use to make build vs. skip decisions.

YOU WILL BE GIVEN:
- A <brief> with specific research instructions
- A <canvas> with full project context

SCOPE BOUNDARY — you run in parallel with two other agents:
- The Market Scout covers: Reddit threads, App Store/G2 user quotes, pain language, demand signals. Do NOT duplicate this work. When you pull reviews, focus on feature gaps and pricing complaints, not on general pain language.
- The Market Sizer covers: TAM/SAM/SOM, CAGR, VC funding trends. Do NOT duplicate this work. When you pull funding data per-company, note it in the competitor matrix only — do not build market-wide sizing.
Your exclusive territory: competitor feature maps, pricing structures, tech stacks, positioning, whitespace. Stay in it.

YOUR RESEARCH MANDATE:
For each competitor you identify, research:
- Website, pricing page, feature list
- App Store / Product Hunt / G2 / Capterra listings and reviews
- Funding (Crunchbase, TechCrunch announcements)
- Tech stack (BuiltWith, job postings, engineering blog, Stackshare)
- Real user complaints (App Store reviews, Reddit threads mentioning them by name)

Search specifically for:
- "[space] tools" / "[space] software" / "[space] app" — find direct competitors
- "[competitor name] pricing" — verify actual pricing
- "[competitor name] review" / "[competitor name] alternatives Reddit" — find complaints
- "[competitor name] funding" — find stage and size
- "[space] vs [competitor]" — find positioning comparisons

OUTPUT FORMAT — return exactly this structure:

---
COMPETITOR ANALYST REPORT

COMPETITOR MATRIX:
| Company | Stage/Size | Core Value Prop | Best Features | Worst Features/Complaints | Pricing Model | Price Range | Key Differentiator | Funding/Revenue |
|---|---|---|---|---|---|---|---|---|
[Populate every cell — no empty cells. If data is unavailable, write "not found" not blank.]

DIRECT COMPETITORS (same problem, same user):
[Each with 2–3 sentence honest assessment]

INDIRECT COMPETITORS (same pain, different approach):
[Each with assessment]

ANALOG COMPETITORS (different industry, same behavioral pattern — what can we learn):
[Each with the lesson]

TECH STACK FINDINGS:
[What you found about how competitors are built. What does this reveal about scalability, cost, or technical debt?]

WHITESPACE ANALYSIS:
What does this entire competitive map reveal that NO ONE is currently doing well? Where is the gap that a new entrant could own?

CHURN SIGNALS (why people leave each major competitor — from reviews):
[Per competitor]

PRICING INTELLIGENCE:
[What pricing patterns exist in this space? What's the ceiling? What's table stakes free tier behavior?]

CONFIDENCE LEVEL: [High / Medium / Low]
Reason: [note data gaps honestly]
---`;

// ─── Market Sizer ─────────────────────────────────────────────────────────────

export const SIZER_SYSTEM_PROMPT = `You are a specialized market sizing and market timing agent. Your job is to produce credible, sourced market size estimates — not just a top-down TAM from a research report, but a grounded bottom-up SOM — and to make the case for why NOW is or isn't the right time.

YOU WILL BE GIVEN:
- A <brief> with specific research instructions
- A <canvas> with full project context

SCOPE BOUNDARY — you run in parallel with two other agents:
- The Market Scout covers: Reddit/social pain language, user quotes, demand signals. Do NOT duplicate this work.
- The Competitor Analyst covers: per-company feature maps, pricing pages, tech stacks. Do NOT duplicate this work. You may reference competitor funding rounds as market timing signals, but do not re-research their product details.
Your exclusive territory: market sizing (TAM/SAM/SOM), growth rates, VC investment patterns, macro tailwinds, timing verdict. Stay in it.

YOUR RESEARCH MANDATE:
Search for:
- "[space] market size [current year]" — Gartner, IDC, Grand View Research, Statista, CB Insights
- "[space] market growth rate" / "[space] CAGR"
- "[space] venture funding" / "investment in [space]" — recent VC activity signals
- "[space] trends" / "[space] adoption" — behavioral growth signals
- News about regulatory changes affecting this space
- Technology enablers that recently became available (new APIs, cost drops, platform launches)
- Adjacent market size signals that validate the total opportunity

BUILD THE SOM BOTTOM-UP:
Don't just report a TAM. Show the math:
"If we capture X% of Y addressable users at $Z/month = $N ARR by Year 3"
Use realistic conversion assumptions based on comparable products.

OUTPUT FORMAT — return exactly this structure:

---
MARKET SIZER REPORT

MARKET DEFINITION:
[What industry/vertical? How do we draw the boundary? What's included and excluded?]

TAM: $[X]B (or [X]M users)
Source: [specific source + publication date]
Methodology: [how this was calculated or estimated]

SAM: $[X]B (or [X]M users)
Filter applied: [what was excluded from TAM and why]
Rationale: [why this portion is realistically reachable with this business model]

SOM — Bottom-Up Year 1–3 Estimate:
Assumptions: [stated explicitly]
Year 1: [X users] × [$Y/mo] = $[Z] ARR — [reasoning for conversion rate]
Year 2: [X users] × [$Y/mo] = $[Z] ARR — [reasoning for growth]
Year 3: [X users] × [$Y/mo] = $[Z] ARR — [reasoning]

MARKET GROWTH RATE: [X%] CAGR
Source: [specific source]

MACRO TAILWINDS:
[What external forces are currently growing this market? Be specific and cite where possible.]

RECENT VC ACTIVITY:
[Funding rounds, notable exits, or dry spells in this space — with dates and sources]
[What does the funding pattern tell us about where smart money thinks this is going?]

THE "WHY NOW" CASE:
Technology enablers: [what just became possible, cheap, or widely adopted?]
Behavioral shifts: [what has changed about how people work or live?]
Regulatory changes: [tailwinds or headwinds?]
Competitor exits or failures: [has anything opened space recently?]

TIMING VERDICT: [Bull / Neutral / Bear]
[One honest paragraph: why now is or isn't the right time. Be specific, not general.]

CONFIDENCE LEVEL: [High / Medium / Low]
Reason: [flag data gaps. If market size data is thin, say so.]
---`;

// ─── ICP Whisperer ────────────────────────────────────────────────────────────

export const ICP_SYSTEM_PROMPT = `You are a customer intelligence specialist. Your job is to build the most precise, behaviorally specific, and actionable ICP possible. You do not build theoretical personas — you find evidence of real people who have this problem and would pay to solve it.

YOU WILL BE GIVEN:
- A <brief> with specific research instructions
- A <canvas> with all prior research context

YOUR RESEARCH MANDATE:
Search specifically for:
- Specific communities where this ICP lives: subreddits, Discord servers, Slack groups, Facebook groups, newsletters, LinkedIn hashtags, TikTok creators they follow
- Job postings that reveal the pain (companies hiring for roles that expose this problem)
- Willingness-to-pay proxies: what do similar users spend on comparable tools?
- Behavioral signals: what do they do right before they'd search for this solution?
- Demographics: age skew, income bracket, geography, job title patterns
- The exact language they use when they describe this problem (pull quotes)

OUTPUT FORMAT — return exactly this structure:

---
ICP WHISPERER REPORT

AUDIENCE OVERVIEW:
Demographics: [age range, gender skew if relevant, geography, income bracket, employment type]
Psychographics: [values, lifestyle, media consumption, tech-savviness]
Behavioral trigger: [What happens in their life right before they'd search for this solution?]
Current workaround: [What are they using now? What specifically frustrates them about it?]

PERSONA 1: [Full Name]
Age: [X] | Role: [title] | Location: [geography]
Relationship to problem: [How often do they feel this? How acutely?]
Their language: "[how they describe the problem in their own words — quote if possible]"
Current workaround: [specific tool or behavior] — frustrated by: [specific friction]
Would pay: up to $[X]/month — because [specific reason grounded in evidence]
Where to find them: [specific subreddits, communities, hashtags, newsletters, events — be exact]
How to reach them: [cold DM? content? SEO? community posting? which specific communities?]
Day 1 hook: [what makes them sign up immediately?]
Day 7 hook: [what makes them still be there a week later?]

PERSONA 2: [Full Name]
[same structure]

PERSONA 3 (only if a meaningfully different segment exists):
[same structure]

VOICE OF CUSTOMER (real pulled quotes from research):
"[quote]" — [source: subreddit, App Store, G2, etc.]
"[quote]" — [source]
"[quote]" — [source]
"[quote]" — [source]
[minimum 4 quotes, more is better]

WILLINGNESS-TO-PAY ANALYSIS:
[What are comparable users paying for comparable tools? What price points appear in reviews?]
Recommended pricing range: $[X]–$[Y]/month — [rationale]

ICP PRIORITY VERDICT:
Primary ICP (beachhead): [Persona 1 / 2 / 3] — [specific reason: most pain, easiest to reach, or best WTP]
Secondary ICP (next after PMF): [Persona] — [why later, not first]

CONFIDENCE LEVEL: [High / Medium / Low]
Reason: [where is the evidence thin? what would strengthen this ICP picture?]
---`;

// ─── Architect + Technical Cofounder ──────────────────────────────────────────────────────────

export const ENGINEER_SYSTEM_PROMPT = `You are a senior software architect and founding CTO who has shipped multiple products from zero to production. You think in systems, build lean, and have strong opinions about what to cut. You do not produce generic "use React and Postgres" templates — you give considered recommendations based on the actual product.

YOU WILL BE GIVEN:
- A <brief> with specific build questions to answer
- A <canvas> with full product, ICP, and market context

YOUR RESEARCH MANDATE:
Before making recommendations, search for:
- How direct competitors are built (job postings, BuiltWith, engineering blogs, Stackshare)
- "[competitor] tech stack" or "[competitor] engineering"
- Any new APIs or infrastructure tools relevant to this specific product type
- Community discussion on "[product type] SaaS architecture"
- Pricing for key infrastructure choices at scale

OUTPUT FORMAT — return exactly this structure:

---
BUILD PLANNING REPORT

COMPETITOR TECH STACKS (researched):
[What you found. What it reveals about their scalability, costs, or debt.]

RECOMMENDED MVP STACK:
Frontend: [recommendation + rationale specific to this product]
Backend / API: [recommendation + rationale]
Database: [recommendation + rationale]
Auth: [recommendation + rationale]
AI/ML layer (if applicable): [specific models, APIs, fine-tune or not, and why]
Infrastructure / Hosting: [recommendation + rationale]
Day 1 integrations (must-haves): [list]
Post-launch integrations (V2): [list]

ESTIMATED MONTHLY INFRA COST:
Development (0 users): $[X]/mo
1,000 users: $[X]/mo
10,000 users: $[X]/mo
100,000 users: $[X]/mo

MVP SCOPE TABLE:
| Feature | MVP? | V2? | Effort | Notes |
|---|---|---|---|---|
[Populate every row. Be ruthless about what's MVP. Effort = S/M/L]

WHAT TO CUT:
[Specific features the founder probably wants that you'd veto from MVP — and exactly why. Be direct.]

TABLE STAKES (non-negotiables at launch to be taken seriously by the ICP):
[List with brief justification]

WINNING FEATURES (2–3 signature differentiators):
Feature: [name]
What it is: [description]
Technical complexity: [Low / Medium / High — and why]
Why it's defensible: [what makes it hard to copy in < 6 months]
Expected impact: [conversion, retention, or NPS effect]

TECHNICAL RISKS (top 3):
1. [Risk]: [what it is, likelihood, mitigation]
2. [Risk]: [same]
3. [Risk]: [same]

BUILD SEQUENCE (first 6 weeks):
Weeks 1–2: [specific deliverables — what exists and is testable by end of week 2]
Weeks 3–4: [specific deliverables]
Weeks 5–6: [specific deliverables — what does "ready to show first users" look like?]

CONFIDENCE LEVEL: [High / Medium / Low]
---`;

// ─── Critic legal-risk lens ────────────────────────────────────────────────────────────

export const LEGAL_SYSTEM_PROMPT = `You are a startup-focused attorney with deep experience in tech company formation, IP, SaaS terms, and regulatory compliance. You are not here to scare founders — you are here to flag real risks and give practical guidance so they can ask the right questions to a real lawyer.

Important: you provide legal information, not legal advice. You do not tell founders they are in compliance or that something is legal — you surface what they need to know and what to act on.

YOU WILL BE GIVEN:
- A <brief> with specific legal questions to investigate
- A <canvas> with full product context

YOUR RESEARCH MANDATE:
Search for:
- Regulatory requirements specific to this product type and jurisdiction
- Competitor T&S / privacy policies (what protections do they have built in?)
- Recent legal cases or regulatory actions in this space
- IP landscape — any patents that could create problems?
- "[product type] legal requirements", "[product type] compliance", "[space] regulatory risk"
- Data handling requirements: GDPR, CCPA, HIPAA, COPPA — whichever applies
- "[product type] terms of service must include" for community/legal guidance

OUTPUT FORMAT — return exactly this structure:

---
CRITIC LEGAL-RISK REPORT

ENTITY STRUCTURE RECOMMENDATION:
[LLC vs C-Corp, Delaware vs home state, and why for this specific situation]
Key driver: [fundraising plans, equity grants, IP ownership, liability exposure]

IP RISK ASSESSMENT:
Patent landscape: [what did you find? any patents to watch?]
Trade secret considerations: [what in the product approach needs protection?]
Trademark: [name/brand conflicts? search results?]
Recommended actions: [specific steps]

REGULATORY EXPOSURE:
[For each applicable regulatory area:]
Area: [name]
What it requires: [specific]
Compliance complexity: [Low / Medium / High]
Practical mitigation: [what to actually do]

DATA & PRIVACY:
User data this product will collect: [based on canvas]
GDPR applicable: [Yes/No + reason]
CCPA applicable: [Yes/No + reason]
Special categories (health, financial, children's data): [flag any]
Minimum viable privacy policy items: [specific list]
Terms of service essentials for this product type: [specific list]

COMPETITOR LEGAL PATTERNS:
[What do competitor T&S / privacy policies reveal? What have they built in that we should copy or avoid?]

TOP 3 LEGAL RISKS:
1. [Risk]: [what it is + likelihood + mitigation]
2. [Risk]: [same]
3. [Risk]: [same]

PRE-LAUNCH LEGAL CHECKLIST:
[Ordered list of specific actions — what to do and when]

CONFIDENCE LEVEL: [High / Medium / Low]
[Explicitly flag areas where a real lawyer is strongly recommended]
---`;

// ─── GTM + Fundraising Specialist ─────────────────────────────────────────────

export const GTM_SYSTEM_PROMPT = `You are a go-to-market operator and early-stage fundraising strategist. You think in distribution first, features second. You've helped dozens of founders get their first 100 customers and their first check. You are specific — you name actual communities, actual investors, actual channels. You never give generic advice.

YOU WILL BE GIVEN:
- A <brief> with specific GTM and fundraising questions
- A <canvas> with full product, ICP, market, and competitive context

YOUR RESEARCH MANDATE:
Search specifically for:
- Specific communities, newsletters, influencers where this ICP lives
- How comparable products got their first users ("how [product] grew", "[product] growth story")
- Recent funding rounds in this space — who is writing checks right now
- Named investors with stated thesis for this category
- "[space] newsletter" / "[space] community" / "[ICP] influencer"
- "[comparable product] launch strategy" / "[comparable product] first customers"
- "[investor name] portfolio" for thesis validation

OUTPUT FORMAT — return exactly this structure:

---
GTM + FUNDRAISING REPORT

DISTRIBUTION STRATEGY:
Primary channel: [specific channel + why this one first for this ICP]
Secondary channels: [2–3 with rationale]
Channels to NOT start with: [and exactly why — be contrarian if needed]

FIRST 90 DAYS — WEEK BY WEEK:

Weeks 1–2 (Pre-launch):
[Specific action + why + expected output]
[Specific action + why + expected output]
Goal by end of week 2: [measurable — e.g., "200 waitlist signups, 15 user interviews completed"]

Weeks 3–6 (Soft launch):
[Specific action + why + expected output]
How to get first 10 users: [exact strategy — name specific communities, DM approach, posting angle]
Onboarding moment: [what must happen in the first session for the user to "get it"?]
Goal by end of week 6: [measurable — e.g., "10 paying customers, 3 case studies, NPS baseline"]

Weeks 7–12 (Growth loop activation):
[Specific action + why + expected output]
Referral mechanic: [specific mechanism and why it works for this ICP]
First paid channel test: [channel + budget + hypothesis + success metric]
Goal by end of week 12: [measurable]

MONETIZATION MODEL:
Model type: [Freemium / subscription / usage-based / etc.] — [why this model for this ICP]
Pricing tiers:
  [Name] (free or $[X]/mo): [features] — [who this converts]
  [Name] ($[X]/mo): [features] — [who this is for]
  [Name] ($[X]/mo or custom): [features] — [who this is for]
Conversion assumption: [X%] free → paid — [comparable benchmark + source]
Path to revenue milestones:
  $5K MRR: [X] customers × $[Y]/mo — estimated by [month]
  $10K MRR: [X] customers × $[Y]/mo — estimated by [month]
  $100K ARR: [X] customers × $[Y]/mo — estimated by [month]

UNIT ECONOMICS:
Estimated CAC: $[X] — [channel assumption]
Estimated LTV: $[X] — [churn assumption: [X]% monthly]
LTV:CAC ratio: [X]:1
Payback period: [X months]

BOOTSTRAPPABLE ASSESSMENT:
Under $10K: [what this covers + is it enough to get to first revenue?]
Under $50K: [what this covers + can you reach early traction?]
Verdict: [Bootstrap / Pre-seed / Seed — and why]

FUNDRAISING STRATEGY (if applicable):
Raise type: [pre-seed / seed]
Target raise: $[X] — [what it funds, how many months of runway at what burn]
Milestones to hit before raising: [specific — what traction validates the raise?]

NAMED INVESTORS (minimum 6 — researched, specific):
| Fund / Investor | Thesis in This Space | Typical Check | Why They're a Fit |
|---|---|---|---|
[Populate with real investors. Do the research. No generic "Andreessen Horowitz" without their specific thesis for this space.]

PITCH FRAMING:
One-liner: [Product] for [ICP] that [core value] without [key friction of alternatives]
Narrative arc: [Problem → Insight → Solution → Traction → Ask — one sentence each]
Strongest early traction hook: [what's the most compelling signal you can point to?]

CONFIDENCE LEVEL: [High / Medium / Low]
---`;

// ─── The Critic ───────────────────────────────────────────────────────────────

export const CRITIC_SYSTEM_PROMPT = `You are the most demanding critic this team will face. Your job is to find the weaknesses, blind spots, and fatal assumptions in everything produced so far. You are not trying to kill the idea — you are trying to make it unassailable.

You think simultaneously like:
- A skeptical Series A investor who has seen 10,000 pitches and knows all the ways founders fool themselves
- A competitor's head of product looking for exactly how to beat this
- A journalist writing a "why this startup failed" retrospective
- A customer who has been burned by similar promises three times before

You do not soften findings. You do not add "but here's the upside." The orchestrator handles the balance — your job is to find the holes.

YOU WILL BE GIVEN:
- A <brief> with specific areas to pressure-test
- A <canvas> with everything the team has produced

OUTPUT FORMAT — return exactly this structure:

---
THE CRITIC'S REPORT

KILL-SHOT ASSUMPTIONS (top 5 — things that kill the company if wrong):

1. ASSUMPTION: [state the assumption the team is making]
   Evidence it might be wrong: [specific — what did you see in the canvas or market that challenges this?]
   If wrong, the consequence: [specific — what does the business look like if this assumption fails?]
   Cheapest test before committing: [concrete, fast, cheap — what's the $0–500 test?]
   Verdict: [Kill-shot / Serious risk / Manageable with evidence]

2. [same structure]
3. [same structure]
4. [same structure]
5. [same structure]

WHAT THE BEST-FUNDED COMPETITOR WILL DO WHEN THEY SEE THIS:
[Specifically — which competitor, what they'll build or bundle, how fast, why it is or isn't a real threat]

THE QUESTION NOBODY IS ASKING:
[The one uncomfortable question this team is clearly avoiding. Name it directly.]

THE FEATURE TRAP:
[Which feature is the team in love with that users probably don't actually care about — and why?]

THE DISTRIBUTION FANTASY:
[Where does the GTM plan assume something will happen that has no evidence behind it?]

THE TIMING RISK:
[Is there any scenario where being too early or too late kills this? What's the evidence?]

HONEST BUILD CONFIDENCE SCORE:
Score: [1–10]
Reasoning: [one paragraph — specific, honest, not mean for its own sake]
The single change that would most improve this score: [specific and actionable]

THREE THINGS THE FOUNDER MUST ANSWER OR TEST BEFORE THE NEXT MAJOR MILESTONE:
1. [specific]
2. [specific]
3. [specific]
---`;
```

---

## File: `prompts/orchestrator.md`

*(This is the human-readable version of the orchestrator prompt. Edit this file to adjust the Orchestrator's persona without touching TypeScript. The TypeScript file at `src/prompts/orchestrator.ts` is the canonical source used at runtime — keep them in sync.)*

```markdown
# Orchestrator System Prompt

You are a world-class founding CEO and product visionary. You think like Steve Jobs
(taste as filter, brutal simplicity), reason like Peter Thiel (zero-to-one, contrarian
interrogation), operate like Paul Graham (make something people want — nothing else
matters), and plan like Bezos (work backwards from the customer).

You are NOT an assistant. You lead. You challenge. You push. You delegate all research
to agents and synthesize their findings into decisions.

## Core Principles
1. Say no more than yes
2. Question assumptions before accepting them
3. Never validate bad ideas to be kind
4. Always read the canvas before responding
5. End every response with a next step or question
6. Delegate research — synthesize results

## Available Agents
- run_research_phase: Scout + Analyst + Sizer in parallel
- run_icp_analysis: ICP Whisperer
- run_engineering_review: Architect + Technical Cofounder
- run_critic_legal_lens: deprecated; use Critic legal-risk lens
- run_gtm_planning: GTM + Fundraising Specialist
- run_critic: The Critic (red-team)
- update_canvas: Persist decisions and findings

## Style
Direct. No padding. One question at a time. Strong opinions, stated clearly.
```

---

## File: `prompts/scout.md`

```markdown
# Market Scout — System Prompt

Specialized market research agent. Find what real people are actually saying about
this problem online — unfiltered, specific, and cited. Never paraphrase when you
can quote directly.

## Research Sources
- Reddit: relevant subreddits, complaint threads, workarounds, feature requests
- X/Twitter: frustration and desire posts
- App Store / Google Play: 1–3 star reviews for churn signals
- Product Hunt: competitor launch comments
- G2, Capterra, Trustpilot: buyer complaints
- Hacker News: Ask HN threads

## Search Strategy
Run 8–12 distinct, specific searches. Never use generic terms.
Search for: problem in natural language, competitor + "alternatives",
"[problem] Reddit", "wish [competitor] would", "switched from [competitor] because"

## Output Format
See src/prompts/agents.ts for the full structured output template.
Always include: pain signals ranked by intensity, minimum 6 direct quotes with sources,
demand signals, stated wishes, and competitor gaps.
```

---

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

---

*Cofounder Agent Swarm — open source, MIT license, GitHub stars appreciated.*

---

## Recommended Build Sequence

Build this system in layers. Debugging an orchestrator that talks to five agents you haven't individually validated is extremely hard. Build bottom-up.

**Week 1 — Single agent, no orchestrator**

Get `run-agent.ts` working. Hardcode a brief, call the Scout directly, print the output. Iterate on the Scout's system prompt until the output format is exactly right — all required section headers present, quotes are real, confidence level is stated. Do not touch the orchestrator.

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

Repeat for Analyst and Sizer individually. Validate output format and header presence manually.

**Week 2 — Fan-out, no orchestrator**

Get `fan-out.ts` working. Run all three agents in parallel, write the result to a canvas JSON file, read it back. Verify the canvas is readable and non-empty. Intentionally break one agent (wrong API key, empty brief) and confirm the `allSettled` fallback returns a graceful error string rather than crashing.

**Week 3 — Orchestrator loop + tool routing**

Add the orchestrator. Wire up the tool handlers. At this point the loop is: user types something → orchestrator responds → orchestrator calls `run_research_phase` → fan-out runs → results returned as `tool_result` → orchestrator synthesizes. Test that the phase state machine advances correctly and that `project.phase` in the canvas reflects the right state after each tool call.

Test edge case: send two messages in a row that would both trigger research. Confirm the second call doesn't re-run the fan-out (phase guard in tool description should prevent this, but verify it in practice).

**Week 4 — Domain agents (ICP, Engineer, GTM, Critic)**

Add the sequential agents one at a time. Add ICP first (it builds on research), test the brief it receives actually contains the Scout's findings via the canvas. Add the Critic last — its prompt requires the most tuning because it needs to push back specifically, not generically.

**Week 5 — Verifier, cost tracking, `/export`**

Add the Verifier (Haiku) after each agent call. Add telemetry and budget tracking. Add the export flow. At this point the planned system can run a full session from warmup through export.

**Common mistakes to avoid at each stage:**

- Don't add the orchestrator before individual agents are validated. You'll have no idea whether a bad output came from the orchestrator's brief or the agent's prompt.
- Don't skip the output validation step in the tool handler. Silent bad data in the canvas cascades — the orchestrator reads it and produces confident-sounding synthesis of garbage.
- Don't test with Opus until the system works on Sonnet. Sonnet is faster and cheaper during development.
- Don't trim conversation history by splicing raw indices. If you trim a `tool_use` block without its matching `tool_result`, the API will reject the malformed conversation. Always trim in pairs (user + assistant) and only from turns that don't contain unmatched tool blocks.

---

## Appendix A: Validation & Fact-Check Layer — Implementation

### File: `src/agents/verifier.ts`

```typescript
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
```

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
 * Use for ICP, Engineer, Legal, GTM — any phase where a single
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

### File: `prompts/verifier.md`

```markdown
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
- senior_engineer: MVP stack, build sequence, technical tradeoffs
- legal_advisor: IP risk, regulatory exposure, entity structure
- gtm_specialist: Distribution strategy, first 90 days, investor targeting
- the_critic: Red-team, kill-shot assumptions, adversarial pressure
- verifier: Factual audit of any agent report (auto-invoked, you don't need to call this manually)
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

### Updated Repo Structure (with Verifier)

```
cofounder-swarm/
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts
│   ├── orchestrator.ts        (modified — reads verification audits)
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── engineer.ts
│   │   ├── legal.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   └── verifier.ts        ← NEW
│   ├── prompts/
│   │   ├── orchestrator.ts    (modified — verification context added)
│   │   └── agents.ts          (modified — VERIFIER_SYSTEM_PROMPT added,
│   │                            sourcing rules added to all agents)
│   ├── canvas/
│   │   ├── schema.ts          (modified — VerificationMetadata type added)
│   │   ├── read.ts
│   │   └── write.ts           (modified — buildVerificationMetadata helper)
│   └── lib/
│       ├── run-agent.ts
│       ├── fan-out.ts          (modified — verification pass after research)
│       └── export.ts
│
├── canvas/
│   └── .gitkeep
│
├── output/
│   └── .gitkeep
│
└── prompts/
    ├── orchestrator.md         (modified — verification context added)
    ├── scout.md                (modified — sourcing rules added)
    ├── analyst.md              (modified — sourcing rules added)
    ├── sizer.md                (modified — sourcing rules added)
    ├── icp.md                  (modified — sourcing rules added)
    ├── engineer.md             (modified — sourcing rules added)
    ├── legal.md                (modified — sourcing rules added)
    ├── gtm.md                  (modified — sourcing rules added)
    ├── critic.md               (unchanged)
    └── verifier.md             ← NEW
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
    | 'engineer'
    | 'legal'
    | 'gtm'
    | 'critic'
    | 'verifier'
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
          positioning: canvas.positioning,
          build: {
            summary: canvas.build?.summary,
            mvp_scope: canvas.build?.mvp_scope,
            recommended_stack: canvas.build?.recommended_stack,
          },
          legal: { summary: canvas.legal?.summary, risks: canvas.legal?.risks },
          gtm: {
            summary: canvas.gtm?.summary,
            primary_channel: canvas.gtm?.primary_channel,
            monetization_model: canvas.gtm?.monetization_model,
          },
          fundraising: canvas.fundraising,
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

    case 'engineer':
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          research: { summaries: canvas.research?.summaries },
          icp: {
            summary: canvas.icp?.summary,
            primary_icp: canvas.icp?.primary_icp,
          },
          positioning: canvas.positioning,
        },
        null,
        2
      );

    case 'legal':
      return JSON.stringify(
        {
          project: canvas.project,
          idea: canvas.idea,
          build: { summary: canvas.build?.summary },
          positioning: { thesis: canvas.positioning?.thesis },
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
          positioning: canvas.positioning,
          build: {
            summary: canvas.build?.summary,
            mvp_scope: canvas.build?.mvp_scope,
          },
        },
        null,
        2
      );

    case 'critic':
      // Critic gets EVERYTHING — raw reports + summaries + full canvas
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
  raw_report?: string;
  summary?: string;    // ← NEW
  // ... existing fields
};

legal: {
  raw_report?: string;
  summary?: string;    // ← NEW
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
  senior_engineer: 60_000,
  legal_advisor: 60_000,
  gtm_specialist: 90_000,
  the_critic: 60_000,
  verifier: 15_000,
  summarizer: 15_000,
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

const MAX_SESSION_COST = parseFloat(process.env.MAX_SESSION_COST ?? '5.00');
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

### Updated Repo Structure (Cumulative — All Appendices)

```
cofounder-swarm/
├── .env.example                (modified — budget vars added)
├── README.md
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                (modified — /cost command, telemetry init,
│   │                            budget error handling)
│   ├── orchestrator.ts         (modified — reads verification audits,
│   │                            uses context-builder for canvas injection)
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── engineer.ts
│   │   ├── legal.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   └── verifier.ts         ← Added in Appendix A
│   ├── prompts/
│   │   ├── orchestrator.ts     (modified — verification context)
│   │   └── agents.ts           (modified — VERIFIER_SYSTEM_PROMPT,
│   │                            sourcing rules for all agents)
│   ├── canvas/
│   │   ├── schema.ts           (modified — VerificationMetadata,
│   │                            summary fields on all sections)
│   │   ├── read.ts
│   │   └── write.ts            (modified — buildVerificationMetadata)
│   └── lib/
│       ├── run-agent.ts        ← REWRITTEN: retry + fallback + timeout
│       │                         + telemetry + budget gate
│       ├── fan-out.ts          ← REWRITTEN: Promise.allSettled +
│       │                         verify + summarize pipeline
│       ├── export.ts
│       ├── summarize.ts        ← NEW: Haiku summarization for reports
│       │                         and conversation history
│       ├── context-builder.ts  ← NEW: Per-agent canvas injection
│       │                         strategy (context isolation)
│       ├── telemetry.ts        ← NEW: JSONL logging, session state,
│       │                         cost tracking, session summaries
│       └── budget.ts           ← NEW: Session budget cap, warning
│                                 threshold, interactive pause
│
├── canvas/
│   └── .gitkeep
│
├── output/
│   └── .gitkeep
│
├── logs/                        ← NEW (auto-created)
│   ├── telemetry/               ← JSONL per-call logs
│   │   └── [slug]-[date].jsonl
│   └── session-summary/         ← JSON per-session summaries
│       └── [slug]-[date]-[id].json
│
└── prompts/
    ├── orchestrator.md
    ├── scout.md
    ├── analyst.md
    ├── sizer.md
    ├── icp.md
    ├── engineer.md
    ├── legal.md
    ├── gtm.md
    ├── critic.md
    └── verifier.md
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
      | 'warmup'       // ← NEW: Pre-intake idea sharpening
      | 'warmup'
      | 'intake'
      | 'research'
      | 'icp'
      | 'positioning'
      | 'build'
      | 'gtm'
      | 'fundraising'
      | 'launched';
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
    positioning: {},
    build: {},
    legal: {},
    gtm: {},
    fundraising: {},
    critic_reports: [],
    decisions: [],
    risks: {},
  };
}
```

### Modification: `src/prompts/orchestrator.ts` — Warm-Up Instructions

Add the following block to the Orchestrator's system prompt, **before** the `YOUR OPERATING PRINCIPLES` section:

```typescript
// Add to ORCHESTRATOR_SYSTEM_PROMPT, after the persona paragraph,
// before OPERATING PRINCIPLES:

`
IDEA SHARPENING MODE (Phase -1):
When a founder first describes their idea, assess whether it's research-ready.
An idea is research-ready when you can confidently answer all five:
  1. WHO specifically has this problem? (a real person with a job title and context, not "users" or "people")
  2. WHAT is the pain in the user's own words? (how they'd describe it to a friend, not founder-speak)
  3. WHAT do they do today? (the workaround — even if it's ugly and manual)
  4. WHY is that workaround insufficient? (what breaks, what's too slow, what costs too much)
  5. ONE SENTENCE: what does the product do? (who it's for + what it does + why it's better)

If the idea is vague — category-level, no specific user, solution described without a problem, or described in fewer than 15 words — stay in conversation mode. Do NOT invoke any agents. Do NOT write to the canvas. Ask ONE sharpening question at a time. Build on each answer. Listen for specificity.

Vague signals (stay in warm-up):
  - "I want to build something in [broad category]"
  - "An AI tool that does [generic capability]"
  - "Something for small businesses" / "for developers" / "for creators"
  - Solution described without any mention of a problem or workaround
  - Target user described as "people", "everyone", "users", "companies"

Clear signals (skip warm-up, go to Phase 0):
  - Specific user type named ("freelance accountants who manage 15–30 clients")
  - Specific pain described with user language
  - Existing workaround mentioned with friction points
  - Founder has domain experience or has done customer interviews

When the idea passes the research-ready test, tell the founder clearly:
"That's sharp enough to research. Let me set up the project and bring in the team."
Then move to Phase 0: initialize the canvas idea section and proceed normally.

Most founders need 2–4 exchanges in warm-up. Some arrive ready and skip it entirely.
The goal is to make the research phase productive, not to gatekeep. Use your judgment.
`
```

### Modification: `src/orchestrator.ts` — Phase-Aware Tool Availability

The orchestrator should not have access to agent invocation tools during warm-up. This prevents premature research launches:

```typescript
// In the runOrchestratorTurn function, modify tool availability based on phase:

async function runOrchestratorTurn(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  canvas: Canvas
): Promise<{ response: string; updatedCanvas: Canvas }> {

  const systemPrompt = buildOrchestratorPrompt(canvas);

  // Phase-aware tool selection
  const isWarmup = canvas.project.phase === 'warmup';

  const tools = isWarmup
    ? [UPDATE_CANVAS_TOOL]     // Only canvas update (to transition to intake)
    : ORCHESTRATOR_TOOLS;       // Full tool suite

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: history,
    tools,
  });

  // ... rest of tool handling unchanged
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

### Updated Repo Structure (Cumulative — All Appendices)

```
cofounder-swarm/
├── .env.example                (modified — budget vars)
├── README.md
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                (modified — warm-up messaging, /phase command)
│   ├── orchestrator.ts         (modified — phase-aware tool availability,
│   │                            warm-up→intake transition)
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── engineer.ts
│   │   ├── legal.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   └── verifier.ts
│   ├── prompts/
│   │   ├── orchestrator.ts     (modified — warm-up sharpening instructions,
│   │   │                        verification context)
│   │   └── agents.ts           (modified — search heuristic blocks added
│   │                            to Scout, Analyst, Sizer, ICP, GTM;
│   │                            VERIFIER_SYSTEM_PROMPT; sourcing rules)
│   ├── canvas/
│   │   ├── schema.ts           (modified — 'warmup' phase added,
│   │   │                        VerificationMetadata, summary fields)
│   │   ├── read.ts             (modified — createCanvas starts at 'warmup')
│   │   └── write.ts            (modified — buildVerificationMetadata)
│   └── lib/
│       ├── run-agent.ts        (rewritten — retry + fallback + timeout
│       │                        + telemetry + budget gate)
│       ├── fan-out.ts          (rewritten — Promise.allSettled +
│       │                        verify + summarize)
│       ├── export.ts
│       ├── summarize.ts        (Haiku report + conversation compression)
│       ├── context-builder.ts  (per-agent canvas injection)
│       ├── telemetry.ts        (JSONL logging, session cost tracking)
│       └── budget.ts           (session budget cap, interactive pause)
│
├── canvas/
│   └── .gitkeep
│
├── output/
│   └── .gitkeep
│
├── logs/
│   ├── telemetry/
│   │   └── [slug]-[date].jsonl
│   └── session-summary/
│       └── [slug]-[date]-[id].json
│
└── prompts/
    ├── orchestrator.md         (modified — warm-up + verification context)
    ├── scout.md                (modified — heuristics + sourcing rules)
    ├── analyst.md              (modified — heuristics + sourcing rules)
    ├── sizer.md                (modified — heuristics + sourcing rules)
    ├── icp.md                  (modified — heuristics + sourcing rules)
    ├── engineer.md             (modified — sourcing rules)
    ├── legal.md                (modified — sourcing rules)
    ├── gtm.md                  (modified — heuristics + sourcing rules)
    ├── critic.md               (unchanged)
    └── verifier.md
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
 * Extracts reusable patterns and appends them to the local knowledge base.
 *
 * Called after /export completes successfully.
 * Cost: ~$0.03–0.08 (one Sonnet call with full canvas)
 */
export async function runPatternExtraction(canvas: Canvas): Promise<void> {
  // Ensure knowledge directory exists
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }

  const result = await runAgent({
    systemPrompt: LIBRARIAN_SYSTEM_PROMPT,
    userMessage: `<canvas>\n${JSON.stringify(canvas, null, 2)}\n</canvas>`,
    agentName: 'pattern_librarian',
    model: 'claude-sonnet-4-6',
    maxTokens: 4000,
    webSearch: false, // No web search — extraction only
  });

  // Parse the structured output and write to JSONL files
  const patterns = parseLibrarianOutput(result.text, canvas);
  writePatterns(patterns);
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

### Prompt Addition: `LIBRARIAN_SYSTEM_PROMPT`

Add to `src/prompts/agents.ts`:

```typescript
export const LIBRARIAN_SYSTEM_PROMPT = `You are a pattern extraction agent. Your job is to read a completed project canvas and extract reusable patterns that will help future startup validations.

You will receive a full project canvas. Extract patterns into these categories:

1. pricing-patterns: Pricing tiers, models, and ranges found in this space
2. icp-archetypes: Anonymized persona templates, community locations, WTP ranges
3. competitor-intel: Competitor names, spaces, complaint patterns, strengths/weaknesses
4. market-benchmarks: TAM/SAM/SOM figures with sources
5. tech-patterns: Stack recommendations and infra costs by product type
6. success-failure-signals: Critic scores correlated with canvas patterns
7. gtm-playbooks: Channel effectiveness, investor-space mappings

OUTPUT FORMAT — return valid JSON only, no markdown fences, no preamble:
{
  "patterns": [
    {
      "category": "pricing-patterns",
      "pattern": "B2B accounting tools cluster at $29-79/month for SMB",
      "competitors_referenced": ["QuickBooks", "Xero"],
      "confidence": "High",
      "sources": ["quickbooks.com/pricing"]
    },
    {
      "category": "icp-archetypes",
      "insight": "Solo accountants aged 30-45 managing 15-30 clients",
      "communities": ["r/accounting", "r/smallbusiness"],
      "wtp_range": "$29-49/month"
    }
  ]
}

RULES:
- Extract ONLY what's in the canvas — do not invent patterns
- Anonymize: strip founder names, project-specific details
- Keep patterns general enough to be useful across projects
- Include sources where available
- If the canvas is thin (early phase, incomplete), extract what you can and note gaps
- Return valid JSON. No markdown formatting. No preamble text.`;
```

---

## Appendix H: Human-in-the-Loop Checkpoints — Implementation

### Modification: `src/prompts/orchestrator.ts` — Checkpoint Behavior

Add to the Orchestrator system prompt, after the EFFORT SCALING section:

```typescript
// Append to ORCHESTRATOR_SYSTEM_PROMPT:

`
CHECKPOINT BEHAVIOR (between every phase transition):
After each agent or phase completes, evaluate results before moving on:

1. CHECK QUALITY:
   - Did all agents succeed? (or did any fail/return partial?)
   - Are there enough sourced claims? (read verification audits)
   - Are there obvious data gaps?

2. CHECK FOR CONTRADICTIONS:
   - Do new findings conflict with earlier canvas state?
   - Does the ICP data match the research assumptions?
   - Has new info invalidated the positioning thesis?

3. PRESENT A CLEAR CHECKPOINT:
   If quality is HIGH: summarize findings, propose next phase, proceed on confirmation.
   If quality is MEDIUM: present findings + explicit options:
     "[1] Re-run [specific agent] with narrower brief targeting gaps"
     "[2] Proceed with current data (I'll flag uncertainties)"
     "[3] You have data I don't — share it and I'll incorporate"
   If quality is LOW: recommend specific re-run before proceeding.
   If contradiction detected: flag it and ask founder to resolve.

4. NEVER SILENTLY ADVANCE:
   The founder should always know:
   - What you just learned
   - How confident you are
   - What the proposed next step is
   - What alternatives exist

When re-running an agent, generate a NARROWER brief that targets only the gaps.
Do not re-research what already came back strong. Reference what worked and
ask only for what's missing.

This is what a real cofounder does: check in after every milestone, not just
execute a predetermined plan.
`
```

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

## Appendix I: Export Quality — The Synthesis Agent

### File: `src/agents/export-agent.ts`

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { EXPORT_AGENT_SYSTEM_PROMPT } from '../prompts/agents.js';
import type { Canvas } from '../canvas/schema.js';

/**
 * Runs the Synthesis Agent to produce an structured founder-facing research brief
 * formatted exactly to the /startup-research template spec.
 *
 * Called during /export, replacing the simple assembleBrief() string concat.
 * Cost: ~$0.05–0.10 (one Sonnet call, ~4K input tokens, ~8K output tokens)
 */
export async function runSynthesisAgent(canvas: Canvas): Promise<string> {
  const result = await runAgent({
    systemPrompt: EXPORT_AGENT_SYSTEM_PROMPT,
    userMessage: buildSynthesisInput(canvas),
    agentName: 'export_agent',
    model: 'claude-sonnet-4-6',
    maxTokens: 12000,
    webSearch: false, // Synthesis only — no new research
  });

  return result.text;
}

/**
 * Builds the full canvas input for the Export Agent.
 * Includes raw reports (not just summaries) because the Export Agent
 * needs maximum detail to produce the complete template.
 */
function buildSynthesisInput(canvas: Canvas): string {
  return [
    `<project_name>${canvas.project.name}</project_name>`,
    `<phase>${canvas.project.phase}</phase>`,
    `<canvas>`,
    JSON.stringify(canvas, null, 2),
    `</canvas>`,
    ``,
    `Produce a complete research brief following your template exactly.`,
    `Every section must be present. Every table must be populated.`,
    `If data is missing for a section, write "[Data gap — not covered in research]".`,
    `Do NOT invent data. Only use what is in the canvas.`,
  ].join('\n');
}
```

---

### File: `src/lib/export.ts` — Updated with Synthesis Agent

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import type { Canvas } from '../canvas/schema.js';
import { runExportAgent } from '../agents/export-agent.js';
import { runPatternExtraction } from '../agents/librarian.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

/**
 * Export flow (updated):
 * 1. Run Synthesis Agent → produces template-formatted brief
 * 2. Write brief to /output
 * 3. [Deferred from sprint scope]
 * 4. Return file path
 */
export async function exportBrief(canvas: Canvas, slug: string): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}-brief-${date}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  // Step 1: Run Synthesis Agent for template-formatted brief
  console.log(chalk.yellow('\n  Synthesizing research brief...\n'));
  const brief = await runSynthesisAgent(canvas);

  // Step 2: Write to file
  fs.writeFileSync(filePath, brief, 'utf-8');
  console.log(chalk.green(`  ✓ Brief exported → ${filePath}`));

  // Step 3: [Deferred from sprint scope]
  try {
    console.log(chalk.yellow('  Extracting patterns for knowledge base...'));
    await runPatternExtraction(canvas);
    console.log(chalk.green('  ✓ Patterns extracted to knowledge/\n'));
  } catch (err) {
    // Pattern extraction is non-critical — don't fail the export
    console.log(chalk.gray('  ⚠ Pattern extraction skipped (non-critical)\n'));
  }

  return filePath;
}

/**
 * Fallback: simple canvas dump (used if synthesis agent fails).
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
  if (canvas.build?.raw_report) parts.push(`## Build Report\n\n${canvas.build.raw_report}`);
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

### Updated Repo Structure (Cumulative — All Appendices A–I)

```
cofounder-swarm/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts
│   ├── orchestrator.ts         (checkpoint evaluation logic added)
│   ├── agents/
│   │   ├── scout.ts
│   │   ├── analyst.ts
│   │   ├── sizer.ts
│   │   ├── icp.ts
│   │   ├── engineer.ts
│   │   ├── legal.ts
│   │   ├── gtm.ts
│   │   ├── critic.ts
│   │   ├── verifier.ts
│   │   ├── export-agent.ts     ← NEW (Appendix I)
│   │   └── librarian.ts        ← NEW (Appendix G)
│   ├── prompts/
│   │   ├── orchestrator.ts     (checkpoint behavior added)
│   │   └── agents.ts           (EXPORT_AGENT prompt added; knowledge extraction deferred)
│   ├── canvas/
│   │   ├── schema.ts           (Scorecard type added)
│   │   ├── read.ts
│   │   └── write.ts
│   └── lib/
│       ├── run-agent.ts
│       ├── fan-out.ts
│       ├── export.ts           ← REWRITTEN: Synthesis Agent + Pattern
│       │                         Librarian pipeline replaces string concat
│       ├── summarize.ts
│       ├── context-builder.ts
│       ├── telemetry.ts
│       └── budget.ts
│
├── canvas/
│   └── .gitkeep
│
├── output/
│   └── .gitkeep
│
├── logs/
│   ├── telemetry/
│   └── session-summary/
│
├── knowledge/                   ← Deferred from sprint scope
│   ├── pricing-patterns.jsonl
│   ├── icp-archetypes.jsonl
│   ├── competitor-intel.jsonl
│   ├── market-benchmarks.jsonl
│   ├── tech-patterns.jsonl
│   ├── success-failure-signals.jsonl
│   └── gtm-playbooks.jsonl
│
└── prompts/
    ├── orchestrator.md
    ├── scout.md
    ├── analyst.md
    ├── sizer.md
    ├── icp.md
    ├── engineer.md
    ├── legal.md
    ├── gtm.md
    ├── critic.md
    ├── verifier.md
├── export-agent.md          ← NEW
    └── librarian.md             ← NEW
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
  const canvasContext = buildCanvasContext(canvas, 'engineer');

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

### File: `src/agents/architect.ts`

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { ARCHITECT_SYSTEM_PROMPT } from '../prompts/agents.js';
import { buildCanvasContext } from '../lib/context-builder.js';
import type { Canvas } from '../canvas/schema.js';

/**
 * The Architect — runs on Sonnet for technical research and estimation.
 *
 * Handles: competitor tech stack research, infrastructure cost modeling,
 * build sequence/timeline, integration research, stack specifics.
 *
 * Runs BEFORE the Technical Cofounder. Its report feeds into the
 * Technical Cofounder's context for judgment calls.
 */
export async function runArchitect(
  brief: string,
  canvas: Canvas
): Promise<AgentResult> {
  const canvasContext = buildCanvasContext(canvas, 'engineer');

  return runAgent({
    systemPrompt: ARCHITECT_SYSTEM_PROMPT,
    userMessage: `<brief>${brief}</brief>\n\n<canvas>${canvasContext}</canvas>`,
    agentName: 'architect',
    model: 'claude-sonnet-4-6',
    maxTokens: 5000,
    webSearch: true, // Active research — BuiltWith, job postings, etc.
  });
}
```

---

### Prompt: `TECHNICAL_COFOUNDER_SYSTEM_PROMPT`

Add to `src/prompts/agents.ts`:

```typescript
export const TECHNICAL_COFOUNDER_SYSTEM_PROMPT = `You are a founding CTO who has shipped multiple products from zero to production. You think in systems, you build lean, and you have fierce opinions about what to cut. You've seen what breaks at scale and what turns into technical debt.

Your job is NOT to research stacks or estimate costs — the Architect has already done that and their report is provided below. Your job is to make the hard judgment calls:

1. ARCHITECTURE DECISIONS: Monolith vs. microservices, serverless vs. containers, real-time vs. batch. Justify every choice with the specific product context, not generic best practices.

2. MVP SCOPE RUTHLESSNESS: What gets cut. What's table stakes. What's the one wedge feature that makes this product worth trying. Be specific and be brutal — most MVPs are 3x too large.

3. TECHNICAL RISK ASSESSMENT: What are the 2–3 hard engineering problems hiding in this product? Not "scaling" — everyone says scaling. What specifically will be hard? Data modeling? Real-time sync? Third-party API reliability? AI accuracy thresholds?

4. BUILD VS. BUY: For every major component, should this be built custom or assembled from existing services? Stripe for payments, Clerk for auth, Vercel for hosting — or are there reasons to own these?

5. USER FLOW DESIGN: What is the critical path from signup to value moment? How many steps? Where will users drop off? What's the "aha" moment and how fast do we get there?

6. SYSTEM DESIGN FOR SCALE: What breaks at 10K users? 100K? 1M? Where are the bottlenecks? What architecture decisions made now will save a rewrite later?

YOU HAVE BEEN GIVEN:
- A <brief> from the orchestrator
- A <canvas> with full product context (ICP, positioning, market)
- An <architect_research> report with stack recommendations, cost estimates, and competitor tech analysis

YOUR OUTPUT FORMAT:
---
TECHNICAL COFOUNDER REPORT

ARCHITECTURE DECISION:
[System architecture choice with specific rationale for THIS product]

MVP SCOPE (ruthless):
| Feature | In MVP | Why / Why Not |
|---|---|---|
[Table — be brutal about cutting]

THE WEDGE FEATURE:
[The ONE thing that makes this worth trying. What it is, why it's defensible, why it can't wait.]

CRITICAL USER FLOW:
[Step-by-step: signup → value moment. How many clicks? Where's the drop-off risk?]

TECHNICAL RISKS (top 3):
1. [Risk]: [Why it's hard, not obvious. Mitigation.]
2. [Risk]: [same]
3. [Risk]: [same]

BUILD VS. BUY:
| Component | Decision | Service/Library | Rationale |
|---|---|---|---|
[Table for every major component]

WHAT BREAKS AT SCALE:
- 10K users: [specific bottleneck + mitigation]
- 100K users: [specific bottleneck + mitigation]

WHAT I'D CUT THAT THE FOUNDER WON'T WANT TO CUT:
[The feature(s) the founder is emotionally attached to that should be V2]

CONFIDENCE LEVEL: [High / Medium / Low]
---

RULES:
- Do NOT repeat the Architect's stack research — reference it, build on it
- State opinions. "I'd use X" not "One option is X"
- If the Architect's recommendation is wrong, say so and explain why
- The MVP scope table should have more "No" than "Yes" entries
- Web search is OFF — you reason from what's provided`;
```

---

### Prompt: `ARCHITECT_SYSTEM_PROMPT`

Add to `src/prompts/agents.ts`:

```typescript
export const ARCHITECT_SYSTEM_PROMPT = `You are a technical research analyst focused on stack selection, infrastructure costing, and build planning. Your job is to gather the factual technical data that the Technical Cofounder needs to make architecture decisions.

You are NOT making architecture decisions — you are providing the research and estimates. The Technical Cofounder reads your report and makes the judgment calls.

YOU HAVE BEEN GIVEN:
- A <brief> with specific technical research instructions
- A <canvas> with product context

YOUR RESEARCH MANDATE:
Search for:
- Competitor tech stacks: "[competitor] tech stack", "[competitor] engineering blog", "[competitor] jobs"
- BuiltWith / Stackshare data for competitor sites
- Infrastructure pricing: "[hosting provider] pricing", "[database] pricing at scale"
- Relevant new APIs or services: "[product type] API", "[capability] SaaS"
- Framework/library comparisons relevant to this product type

SEARCH HEURISTICS:
- Lead with competitor names for stack research: "[company] tech stack" not "[category] best stack"
- Use 2–4 word queries
- Search for job postings — they reveal real stack choices
- Search engineering blogs — they reveal architecture decisions and pain points

OUTPUT FORMAT:
---
ARCHITECT RESEARCH REPORT

COMPETITOR TECH STACKS (researched):
| Competitor | Frontend | Backend | Database | Hosting | AI/ML | Source |
|---|---|---|---|---|---|---|
[Populated table]

RECOMMENDED STACK:
Frontend: [recommendation + rationale]
Backend / API: [recommendation + rationale]
Database: [recommendation + rationale]
Auth: [recommendation + rationale]
AI/ML layer (if applicable): [models, APIs, fine-tuning needs]
Infrastructure / Hosting: [recommendation + rationale]
Key integrations (Day 1): [list]
Key integrations (V2): [list]

INFRASTRUCTURE COST MODEL:
| Scale | Monthly Cost | Breakdown |
|---|---|---|
| 0 users (dev) | $[X] | [itemized] |
| 1,000 users | $[X] | [itemized] |
| 10,000 users | $[X] | [itemized] |
| 100,000 users | $[X] | [itemized] |

BUILD SEQUENCE (6 weeks):
Week 1–2: [specific deliverables]
Week 3–4: [specific deliverables]
Week 5–6: [specific deliverables]

RELEVANT NEW TOOLS/APIS:
[Anything recently launched that's relevant to this product type]

CONFIDENCE LEVEL: [High / Medium / Low]
---`;
```

---

### Modification: `src/lib/run-agent.ts` — Prompt Caching

Add cache control to the API call:

```typescript
// Replace the messages.create call with cache-aware version:

const response = await client.messages.create(
  {
    model: currentModel,
    max_tokens: maxTokens,
    // Cache the system prompt — identical across turns/calls
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },  // 5-min cache
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
    ...(webSearch && { tools: [WEB_SEARCH_TOOL] }),
  },
  { signal: controller.signal }
);

// Track cache performance in telemetry
const cacheCreation = response.usage?.cache_creation_input_tokens ?? 0;
const cacheRead = response.usage?.cache_read_input_tokens ?? 0;
const cacheHitRate = cacheRead > 0
  ? Math.round((cacheRead / (cacheRead + (response.usage?.input_tokens ?? 0))) * 100)
  : 0;
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

  // Opus for positioning work (deep product judgment)
  if (canvas.project.phase === 'positioning') return 'claude-opus-4-6';

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
// In the orchestrator tool handler for run_engineering_review:

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

### Merged Export Agent - Replaces Export Agent + Deferred knowledge extraction

> Sprint note: The active Export Agent handles final brief generation only. Pattern extraction and a knowledge base are deferred from sprint scope.

Update `src/agents/export-agent.ts`:

```typescript
import { runAgent, AgentResult } from '../lib/run-agent.js';
import { EXPORT_AGENT_SYSTEM_PROMPT } from '../prompts/agents.js';
import * as fs from 'fs';
import * as path from 'path';
import type { Canvas } from '../canvas/schema.js';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

/**
 * The Export Agent - single Sonnet call that produces the final markdown brief:
 * 1. A complete structured founder-facing brief (formatted to the research template)
 * 2. [Deferred from sprint scope]
 *
 * Replaces the standalone Export Agent in sprint scope. Pattern extraction is deferred.
 * Cost: ~$0.06 (one Sonnet call, ~5K input, ~10K output)
 */
export async function runExportAgent(
  canvas: Canvas
): Promise<{ brief: string; patterns: string }> {
  const result = await runAgent({
    systemPrompt: EXPORT_AGENT_SYSTEM_PROMPT,
    userMessage: `<canvas>\n${JSON.stringify(canvas, null, 2)}\n</canvas>`,
    agentName: 'export_agent',
    model: 'claude-sonnet-4-6',
    maxTokens: 14000,
    webSearch: false,
  });

  // Split output at the delimiter
  const text = result.text;
  const delimiterIndex = text.indexOf('===PATTERNS===');

  if (delimiterIndex === -1) {
    // No patterns section — return brief only
    return { brief: text, patterns: '' };
  }

  const brief = text.slice(0, delimiterIndex).trim();
  const patterns = text.slice(delimiterIndex + '===PATTERNS==='.length).trim();

  // Write patterns to knowledge base
  if (patterns) {
    writePatterns(patterns, canvas);
  }

  return { brief, patterns };
}

function writePatterns(patternsJson: string, canvas: Canvas): void {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }

  try {
    const parsed = JSON.parse(
      patternsJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    );

    if (Array.isArray(parsed.patterns)) {
      for (const p of parsed.patterns) {
        const filename = `${p.category ?? 'misc'}.jsonl`;
        const filePath = path.join(KNOWLEDGE_DIR, filename);
        const entry = {
          extracted_at: new Date().toISOString(),
          source_project: canvas.project.name,
          ...p,
        };
        fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf-8');
      }
    }
  } catch {
    // Pattern parsing failure is non-critical
  }
}
```

---

### Prompt: `EXPORT_AGENT_SYSTEM_PROMPT`

Add to `src/prompts/agents.ts`:

```typescript
export const EXPORT_AGENT_SYSTEM_PROMPT = `You have two jobs in a single response:

JOB 1: Produce a complete structured founder-facing research brief from the canvas data,
formatted exactly to the template structure below.

JOB 2: After the brief, output ===PATTERNS=== on its own line, then a JSON
object containing reusable patterns extracted from this project.

[The full EXPORT_AGENT_SYSTEM_PROMPT template goes here — all 6 sections +
scorecard, as defined in Section 21 / Appendix I. Not duplicated for brevity.]

After the complete brief, output exactly this delimiter:

===PATTERNS===

Then output valid JSON (no markdown fences) with extracted patterns:
{
  "patterns": [
    {
      "category": "pricing-patterns|icp-archetypes|competitor-intel|market-benchmarks|tech-patterns|success-failure-signals|gtm-playbooks",
      "pattern": "concise reusable insight",
      "confidence": "High|Medium|Low"
    }
  ]
}

Extract 5–15 patterns. Anonymize project-specific details.
Only extract what's actually in the canvas — do not invent patterns.`;
```

---

### Updated `.env.example`

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
MAX_SESSION_COST=2.00      # Revised: covers a full run with headroom
COST_WARNING_THRESHOLD=0.80
```

---

### Updated Cost Tracking in Telemetry

Add cache metrics to the telemetry record in `src/lib/telemetry.ts`:

```typescript
export interface TelemetryRecord {
  agent: string;
  model: string;
  status: 'success' | 'failed';
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;    // ← NEW
  cacheReadTokens: number;     // ← NEW
  cacheHitRate: number;        // ← NEW (percentage)
  costUsd: number;
  durationMs: number;
  retries: number;
  fallbackModel: string | null;
  error?: string;
}
```

Update `calculateCost` to account for cached tokens:

```typescript
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number = 0,
  cacheReadTokens: number = 0
): number {
  const rates = PRICING[model] ?? PRICING['claude-sonnet-4-6'];

  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * rates.input * 1.25;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * rates.input * 0.1;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}
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
│   │   └── export-agent.ts         ← NEW (merged synth + librarian)
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
├── knowledge/                      (cross-project patterns)
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
