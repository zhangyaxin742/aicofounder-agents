import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import type { Canvas } from './canvas/schema.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './prompts/orchestrator.js';
import {
  ICP_SYSTEM_PROMPT,
  ARCHITECT_SYSTEM_PROMPT,
  TECHNICAL_COFOUNDER_SYSTEM_PROMPT,
  GTM_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
} from './prompts/agents.js';
import { runResearchPhase } from './lib/fan-out.js';
import { runAgent } from './lib/run-agent.js';
import { runVerifier } from './agents/verifier.js';
import { summarizeReport } from './lib/summarize.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Orchestrator Tools ───────────────────────────────────────────────────────
// These are custom tools the Orchestrator uses to delegate to subagents.
// Each invocation triggers one or more Claude API calls.

const ORCHESTRATOR_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'run_research_phase',
    description:
      'Launch the parallel research swarm: Market Scout, Competitor Analyst, and Market Sizer. Use this once the idea has passed warmup and has been written into intake.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'A detailed research brief covering pain signals, competitors, and market sizing without duplicating work across agents.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_icp_analysis',
    description:
      'Launch the ICP Whisperer to build customer personas, urgency, willingness-to-pay signals, and community locations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What specifically to investigate about the customer and buying context.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_build_phase',
    description:
      'Launch Architect first, then Technical Cofounder, to produce technical research plus architecture and MVP judgment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What product decisions to validate and what technical unknowns to surface.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_gtm_planning',
    description:
      'Launch GTM Specialist to produce the launch plan, monetization framing, and channel strategy.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'Which GTM questions to answer and what launch constraints to consider.',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'run_critic',
    description:
      'Launch Critic for adversarial red-teaming. Optional legal-risk behavior is handled through the `lens` parameter, not a separate legal agent.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description:
            'What to specifically pressure-test and which assumptions to attack.',
        },
        lens: {
          type: 'string',
          enum: ['default', 'legal-risk'],
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'update_canvas',
    description:
      'Write structured data to the project canvas. In warmup, this is the only available tool and is used to transition into intake.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phase_transition: {
          type: 'string',
          enum: ['intake'],
        },
        idea_summary: { type: 'string' },
        founder_context: { type: 'string' },
        initial_assumptions: {
          type: 'array',
          items: { type: 'string' },
        },
        open_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        value_proposition: { type: 'string' },
        possible_icp: {
          type: 'array',
          items: { type: 'string' },
        },
        section: {
          type: 'string',
          enum: ['research', 'icp', 'build', 'gtm', 'decisions', 'risks'],
        },
        content: {
          type: 'object',
          description: 'The structured data to merge into this section.',
        },
      },
      required: [],
    },
  },
];

const WARMUP_TOOLS: Anthropic.Messages.Tool[] = ORCHESTRATOR_TOOLS.filter(
  (tool) => tool.name === 'update_canvas'
);

function selectOrchestratorModel(canvas: Canvas): string {
  if (canvas.project.phase === 'warmup') return 'claude-opus-4-6';
  if (canvas.project.phase === 'research') return 'claude-opus-4-6';
  if (canvas.project.phase === 'icp') return 'claude-opus-4-6';
  if (canvas.project.phase === 'critic') return 'claude-opus-4-6';
  return 'claude-sonnet-4-6';
}

async function verifyAndStore(
  sourceAgent: 'icp' | 'architect' | 'technical-cofounder' | 'gtm' | 'critic',
  result: Awaited<ReturnType<typeof runAgent>>,
  canvas: Canvas
) {
  const verification = await runVerifier({
    sourceAgent,
    markdown: result.markdown,
    structured: result.structured,
    canvas,
  });

  const summary = await summarizeReport({
    agent: sourceAgent,
    structured: result.structured,
    verification,
  });

  return {
    raw_markdown: result.markdown,
    structured: result.structured,
    verification,
    summary,
    timestamp: new Date().toISOString(),
  };
}

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
      if (canvas.project.phase === 'warmup') {
        return {
          output: 'Research is locked during warmup. Use update_canvas to transition into intake first.',
          updatedCanvas: canvas,
        };
      }

      updatedCanvas = await runResearchPhase(brief, updatedCanvas);
      updatedCanvas.project.phase = 'research';
      return { output: 'Research phase complete.', updatedCanvas };
    }

    case 'run_icp_analysis': {
      console.log(chalk.yellow('\n  👤 Launching ICP Whisperer...\n'));
      const result = await runAgent({
        agent: 'icp',
        systemPrompt: ICP_SYSTEM_PROMPT,
        brief,
        canvas,
      });
      updatedCanvas.icp = {
        report: await verifyAndStore('icp', result, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'icp';
      return { output: 'ICP analysis complete.', updatedCanvas };
    }

    case 'run_build_phase': {
      console.log(chalk.yellow('\n  ⚙️  Launching Architect, then Technical Cofounder...\n'));

      const architect = await runAgent({
        agent: 'architect',
        systemPrompt: ARCHITECT_SYSTEM_PROMPT,
        brief,
        canvas,
      });

      const technicalCofounder = await runAgent({
        agent: 'technical-cofounder',
        systemPrompt: TECHNICAL_COFOUNDER_SYSTEM_PROMPT,
        brief,
        canvas,
      });

      updatedCanvas.build = {
        architect: await verifyAndStore('architect', architect, updatedCanvas),
        technical_cofounder: await verifyAndStore('technical-cofounder', technicalCofounder, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'build';
      return { output: 'Build phase complete.', updatedCanvas };
    }

    case 'run_gtm_planning': {
      console.log(chalk.yellow('\n  🚀 Launching GTM Specialist...\n'));
      const result = await runAgent({
        agent: 'gtm',
        systemPrompt: GTM_SYSTEM_PROMPT,
        brief,
        canvas,
      });
      updatedCanvas.gtm = {
        report: await verifyAndStore('gtm', result, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'gtm';
      return { output: 'GTM planning complete.', updatedCanvas };
    }

    case 'run_critic': {
      console.log(chalk.yellow('\n  🔥 Launching Critic...\n'));
      const lens = toolInput.lens === 'legal-risk' ? 'legal-risk' : 'default';
      const result = await runAgent({
        agent: 'critic',
        systemPrompt: CRITIC_SYSTEM_PROMPT,
        brief: `Lens: ${lens}\n\n${brief}`,
        canvas,
      });
      updatedCanvas.critic.reports = [
        ...(updatedCanvas.critic.reports ?? []),
        await verifyAndStore('critic', result, updatedCanvas),
      ];
      updatedCanvas.critic.last_updated = new Date().toISOString();
      updatedCanvas.project.phase = 'critic';
      return { output: `Critic complete (${lens}).`, updatedCanvas };
    }

    case 'update_canvas': {
      if (toolInput.phase_transition === 'intake') {
        updatedCanvas.project.phase = 'intake';
        updatedCanvas.idea = {
          summary: String(toolInput.idea_summary ?? ''),
          founder_context: String(toolInput.founder_context ?? ''),
          initial_assumptions: Array.isArray(toolInput.initial_assumptions)
            ? toolInput.initial_assumptions.map(String)
            : [],
          open_questions: Array.isArray(toolInput.open_questions)
            ? toolInput.open_questions.map(String)
            : [],
          value_proposition: String(toolInput.value_proposition ?? ''),
          possible_icp: Array.isArray(toolInput.possible_icp)
            ? toolInput.possible_icp.map(String)
            : [],
          last_updated: new Date().toISOString(),
        };
        return {
          output: 'Idea sharpened and project moved from warmup to intake.',
          updatedCanvas,
        };
      }

      if (toolInput.section && toolInput.content) {
        const section = String(toolInput.section) as 'research' | 'icp' | 'build' | 'gtm' | 'decisions' | 'risks';
        updatedCanvas[section] = {
          ...(typeof updatedCanvas[section] === 'object' && updatedCanvas[section] !== null
            ? updatedCanvas[section] as object
            : {}),
          ...(toolInput.content as object),
          last_updated: new Date().toISOString(),
        } as never;
        return { output: `Canvas section "${section}" updated.`, updatedCanvas };
      }

      return { output: 'No canvas update applied.', updatedCanvas };
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
      model: selectOrchestratorModel(updatedCanvas),
      max_tokens: 4096,
      system: systemPrompt,
      messages: currentMessages,
      tools: updatedCanvas.project.phase === 'warmup' ? WARMUP_TOOLS : ORCHESTRATOR_TOOLS,
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

Notes:
- `warmup` is tool-limited and cannot trigger research fan-out.
- `update_canvas` is the only warmup tool and is used to move `warmup -> intake`.
- build planning is Architect first, then Technical Cofounder.
- the legal path is a Critic lens parameter, not a standalone agent.
- `/export` should invoke Export Agent through `src/lib/export.ts`.
- structured output plus Verifier metadata is the validation path; markdown headers are not.

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