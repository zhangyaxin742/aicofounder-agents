import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import type { Canvas } from './canvas/schema.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './prompts/orchestrator.js';
import { ICP_SYSTEM_PROMPT } from './prompts/icp.js';
import { ARCHITECT_SYSTEM_PROMPT } from './prompts/architect.js';
import { TECHNICAL_COFOUNDER_SYSTEM_PROMPT } from './prompts/technical-cofounder.js';
import { GTM_SYSTEM_PROMPT } from './prompts/gtm.js';
import { CRITIC_SYSTEM_PROMPT } from './prompts/critic.js';
import { runResearchPhase } from './lib/fan-out.js';
import { runAgent } from './lib/run-agent.js';
import { runVerifier } from './agents/verifier.js';
import { loadOrCreateCanvas } from './canvas/read.js';
import { saveCanvas } from './canvas/write.js';
import { exportBrief } from './lib/export.js';
import { printDone, printInfo, printStage, startLoading, stopLoading } from './lib/loading.js';

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
  (tool) => tool.name === 'update_canvas' || tool.name === 'run_research_phase'
);

function buildOrchestratorSystemPrompt(canvas: Canvas): string {
  return ORCHESTRATOR_SYSTEM_PROMPT.replace(
    '{{CANVAS_STATE}}',
    JSON.stringify(canvas, null, 2)
  );
}

function describePhase(phase: Canvas['project']['phase']): { title: string; detail: string } {
  switch (phase) {
    case 'warmup':
      return {
        title: 'Warmup',
        detail: 'Clarifying the idea and deciding whether it is research-ready.'
      };
    case 'intake':
      return {
        title: 'Intake',
        detail: 'The idea is sharp enough; the next step is structured intake and research launch.'
      };
    case 'research':
      return {
        title: 'Research',
        detail: 'Market grounding exists; the next step is synthesis or deeper analysis.'
      };
    case 'icp':
      return {
        title: 'ICP',
        detail: 'Customer profile work is active or complete; next comes product and GTM judgment.'
      };
    case 'build':
      return {
        title: 'Build',
        detail: 'Technical planning is active or complete; next comes GTM and red-team review.'
      };
    case 'gtm':
      return {
        title: 'GTM',
        detail: 'Go-to-market planning is active or complete; next comes critic review or export.'
      };
    case 'critic':
      return {
        title: 'Critic',
        detail: 'The project is being pressure-tested for weak assumptions and hidden risks.'
      };
    default:
      return {
        title: 'Orchestration',
        detail: 'Evaluating the current project state and deciding what to do next.'
      };
  }
}

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
    markdown: result.raw_markdown,
    structured: result.structured,
    canvas,
  });

  return {
    raw_markdown: result.raw_markdown,
    structured: result.structured,
    verification,
    summary: result.summary,
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

      printStage('Research Launching', 'Dispatching Market Scout, Competitor Analyst, and Market Sizer.');
      updatedCanvas = await runResearchPhase(brief, updatedCanvas);
      updatedCanvas.project.phase = 'research';
      printDone('orchestrator', 'Research outputs stored in canvas; phase set to research.');
      return { output: 'Research phase complete.', updatedCanvas };
    }

    case 'run_icp_analysis': {
      printStage('ICP Launching', 'Starting ICP Whisperer for personas, urgency, and WTP signals.');
      console.log(chalk.yellow('\n  👤 Launching ICP Whisperer...\n'));
      const result = await runAgent({
        agent: 'icp',
        reportType: 'icp',
        systemPrompt: ICP_SYSTEM_PROMPT,
        canvas,
        task: brief,
      });
      updatedCanvas.icp = {
        report: await verifyAndStore('icp', result, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'icp';
      printDone('orchestrator', 'ICP report stored in canvas; phase set to icp.');
      return { output: 'ICP analysis complete.', updatedCanvas };
    }

    case 'run_build_phase': {
      printStage('Build Planning', 'Starting Architect first, then Technical Cofounder.');
      console.log(chalk.yellow('\n  ⚙️  Launching Architect, then Technical Cofounder...\n'));

      const architect = await runAgent({
        agent: 'architect',
        reportType: 'architect',
        systemPrompt: ARCHITECT_SYSTEM_PROMPT,
        canvas,
        task: brief,
      });

      const technicalCofounder = await runAgent({
        agent: 'technical-cofounder',
        reportType: 'technical_cofounder',
        systemPrompt: TECHNICAL_COFOUNDER_SYSTEM_PROMPT,
        canvas,
        task: brief,
      });

      updatedCanvas.build = {
        architect: await verifyAndStore('architect', architect, updatedCanvas),
        technical_cofounder: await verifyAndStore('technical-cofounder', technicalCofounder, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'build';
      printDone('orchestrator', 'Build reports stored in canvas; phase set to build.');
      return { output: 'Build phase complete.', updatedCanvas };
    }

    case 'run_gtm_planning': {
      printStage('GTM Launching', 'Starting GTM Specialist for launch plan and monetization framing.');
      console.log(chalk.yellow('\n  🚀 Launching GTM Specialist...\n'));
      const result = await runAgent({
        agent: 'gtm',
        reportType: 'gtm',
        systemPrompt: GTM_SYSTEM_PROMPT,
        canvas,
        task: brief,
      });
      updatedCanvas.gtm = {
        report: await verifyAndStore('gtm', result, updatedCanvas),
        last_updated: new Date().toISOString(),
      };
      updatedCanvas.project.phase = 'gtm';
      printDone('orchestrator', 'GTM report stored in canvas; phase set to gtm.');
      return { output: 'GTM planning complete.', updatedCanvas };
    }

    case 'run_critic': {
      printStage('Critic Launching', 'Starting adversarial review to pressure-test the current thesis.');
      console.log(chalk.yellow('\n  🔥 Launching Critic...\n'));
      const lens = toolInput.lens === 'legal-risk' ? 'legal-risk' : 'default';
      const result = await runAgent({
        agent: 'critic',
        reportType: 'critic',
        systemPrompt: CRITIC_SYSTEM_PROMPT,
        canvas,
        task: `Lens: ${lens}\n\n${brief}`,
      });
      updatedCanvas.critic.reports = [
        ...(updatedCanvas.critic.reports ?? []),
        await verifyAndStore('critic', result, updatedCanvas),
      ];
      updatedCanvas.critic.last_updated = new Date().toISOString();
      updatedCanvas.project.phase = 'critic';
      printDone('orchestrator', `Critic report stored in canvas; phase set to critic (${lens}).`);
      return { output: `Critic complete (${lens}).`, updatedCanvas };
    }

    case 'update_canvas': {
      if (toolInput.phase_transition === 'intake') {
        printStage('Writing Intake', 'Saving the structured idea brief into the canvas.');
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
        printDone('orchestrator', 'Intake saved to canvas; phase set to intake.');
        return {
          output: 'Idea sharpened and project moved from warmup to intake.',
          updatedCanvas,
        };
      }

      if (toolInput.section && toolInput.content) {
        const section = String(toolInput.section) as 'research' | 'icp' | 'build' | 'gtm' | 'decisions' | 'risks';
        printStage('Updating Canvas', `Merging new structured data into the ${section} section.`);
        updatedCanvas[section] = {
          ...(typeof updatedCanvas[section] === 'object' && updatedCanvas[section] !== null
            ? updatedCanvas[section] as object
            : {}),
          ...(toolInput.content as object),
          last_updated: new Date().toISOString(),
        } as never;
        printDone('orchestrator', `Canvas section "${section}" updated.`);
        return { output: `Canvas section "${section}" updated.`, updatedCanvas };
      }

      return { output: 'No canvas update applied.', updatedCanvas };
    }

    default:
      return { output: `Unknown tool: ${toolName}`, updatedCanvas: canvas };
  }
}

// ─── Orchestrator Turn ────────────────────────────────────────────────────────

async function runOrchestratorTurn(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  canvas: Canvas
): Promise<{
  response: string;
  updatedCanvas: Canvas;
  toolsRun: string[];
  startingPhase: Canvas['project']['phase'];
  endingPhase: Canvas['project']['phase'];
}> {

  const systemPrompt = buildOrchestratorSystemPrompt(canvas);

  // Phase-aware tool selection
  const isWarmup = canvas.project.phase === 'warmup';

  const tools = isWarmup
    ? WARMUP_TOOLS
    : ORCHESTRATOR_TOOLS;

  startLoading('orchestrator');
  const response = await client.messages.create({
    model: selectOrchestratorModel(canvas),
    max_tokens: 4096,
    system: systemPrompt,
    messages: history,
    tools,
  }).finally(() => {
    stopLoading();
  });


  let updatedCanvas = canvas;
  const responseParts: string[] = [];
  const toolsRun: string[] = [];

  for (const block of response.content) {
    if (block.type === 'text') {
      const text = block.text.trim();
      if (text) {
        responseParts.push(text);
      }
      continue;
    }

    if (block.type === 'tool_use') {
      toolsRun.push(block.name);
      printInfo('Tool Call', `${block.name} requested by orchestrator.`);
      const toolResult = await handleTool(
        block.name,
        typeof block.input === 'object' && block.input !== null
          ? block.input as Record<string, unknown>
          : {},
        updatedCanvas
      );
      updatedCanvas = toolResult.updatedCanvas;
      if (toolResult.output) {
        responseParts.push(toolResult.output);
      }
    }
  }

  return {
    response: responseParts.join('\n\n') || 'No response returned.',
    updatedCanvas,
    toolsRun,
    startingPhase: canvas.project.phase,
    endingPhase: updatedCanvas.project.phase,
  };
}

export class Orchestrator {
  private canvas?: Canvas;
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(private readonly projectRef: string) {}

  async init(): Promise<{ created: boolean }> {
    const session = await loadOrCreateCanvas(this.projectRef);
    this.canvas = session.canvas;
    return { created: session.created };
  }

  getProjectSummary(): { projectName: string; projectSlug: string; phase: Canvas['project']['phase'] } {
    const canvas = this.requireCanvas();
    return {
      projectName: canvas.project.name,
      projectSlug: canvas.project.slug,
      phase: canvas.project.phase,
    };
  }

  async handleInput(input: string): Promise<string> {
    const canvas = this.requireCanvas();
    const trimmed = input.trim();

    if (trimmed === '/canvas') {
      printStage('Canvas', 'Printing the current project canvas JSON.');
      return JSON.stringify(canvas, null, 2);
    }

    if (trimmed === '/export') {
      printStage('Exporting Brief', 'Assembling the founder-facing markdown brief from canvas state.');
      const briefPath = await exportBrief(canvas, canvas.project.slug);
      printDone('orchestrator', `Brief exported to ${briefPath}`);
      return `Brief exported -> ${briefPath}`;
    }

    if (trimmed === '/rerun') {
      printStage('Research Reset', 'Clearing prior research outputs and moving the project back to warmup.');
      canvas.project.phase = 'warmup';
      canvas.research = {
        reports: {},
        failures: [],
      };
      await this.save();
      printDone('orchestrator', 'Research outputs cleared; the next research run will start fresh.');
      return 'Research phase reset. The next run_research_phase call will re-run all three agents.';
    }

    if (trimmed.startsWith('/rerun ')) {
      const sub = trimmed.slice(7).trim();
      const brief = canvas.idea.summary?.trim() || 'Re-run this phase using the current intake brief.';

      if (sub === 'research') {
        printStage('Research Re-run', 'Clearing prior research and re-running Scout, Analyst, and Sizer.');
        canvas.research = { reports: {}, failures: [] };
        await runResearchPhase(brief, canvas);
        canvas.project.phase = 'research';
        await this.save();
        printDone('orchestrator', 'Research re-run complete; reports stored in canvas.');
        return 'Research re-run complete.';
      }

      if (sub === 'icp') {
        printStage('ICP Re-run', 'Clearing ICP report and re-running ICP Whisperer.');
        canvas.icp = {};
        const result = await runAgent({ agent: 'icp', reportType: 'icp', systemPrompt: ICP_SYSTEM_PROMPT, canvas, task: brief });
        canvas.icp = { report: await verifyAndStore('icp', result, canvas), last_updated: new Date().toISOString() };
        canvas.project.phase = 'icp';
        await this.save();
        printDone('orchestrator', 'ICP re-run complete; report stored in canvas.');
        return 'ICP analysis re-run complete.';
      }

      if (sub === 'build') {
        printStage('Build Re-run', 'Clearing build reports and re-running Architect then Technical Cofounder.');
        canvas.build = {};
        const architect = await runAgent({ agent: 'architect', reportType: 'architect', systemPrompt: ARCHITECT_SYSTEM_PROMPT, canvas, task: brief });
        const tc = await runAgent({ agent: 'technical-cofounder', reportType: 'technical_cofounder', systemPrompt: TECHNICAL_COFOUNDER_SYSTEM_PROMPT, canvas, task: brief });
        canvas.build = {
          architect: await verifyAndStore('architect', architect, canvas),
          technical_cofounder: await verifyAndStore('technical-cofounder', tc, canvas),
          last_updated: new Date().toISOString(),
        };
        canvas.project.phase = 'build';
        await this.save();
        printDone('orchestrator', 'Build re-run complete; reports stored in canvas.');
        return 'Build phase re-run complete.';
      }

      if (sub === 'gtm') {
        printStage('GTM Re-run', 'Clearing GTM report and re-running GTM Specialist.');
        canvas.gtm = {};
        const result = await runAgent({ agent: 'gtm', reportType: 'gtm', systemPrompt: GTM_SYSTEM_PROMPT, canvas, task: brief });
        canvas.gtm = { report: await verifyAndStore('gtm', result, canvas), last_updated: new Date().toISOString() };
        canvas.project.phase = 'gtm';
        await this.save();
        printDone('orchestrator', 'GTM re-run complete; report stored in canvas.');
        return 'GTM planning re-run complete.';
      }

      return `Unknown subcommand: /rerun ${sub}. Available: research, icp, build, gtm`;
    }

    if (trimmed === '/critic' || trimmed === '/critic legal') {
      const lens = trimmed === '/critic legal' ? 'legal-risk' : 'default';
      printStage('Critic Launching', 'Starting adversarial review to pressure-test the current thesis.');
      const brief = canvas.idea.summary?.trim() || 'Pressure-test the current business thesis.';
      const result = await runAgent({
        agent: 'critic',
        reportType: 'critic',
        systemPrompt: CRITIC_SYSTEM_PROMPT,
        canvas,
        task: `Lens: ${lens}\n\n${brief}`,
      });
      canvas.critic.reports = [...(canvas.critic.reports ?? []), await verifyAndStore('critic', result, canvas)];
      canvas.critic.last_updated = new Date().toISOString();
      canvas.project.phase = 'critic';
      await this.save();
      printDone('orchestrator', `Critic report stored (${lens}).`);
      return `Critic review complete (${lens}).`;
    }

    const phaseDescription = describePhase(canvas.project.phase);
    printStage(phaseDescription.title, phaseDescription.detail);
    this.history.push({ role: 'user', content: trimmed });
    const { response, updatedCanvas, toolsRun, startingPhase, endingPhase } = await runOrchestratorTurn(this.history, canvas);
    this.canvas = updatedCanvas;
    this.history.push({ role: 'assistant', content: response });

    if (this.history.length > 40) {
      this.history.splice(0, this.history.length - 40);
    }

    await this.save();
    printStage(
      'Turn Summary',
      `Tools run: ${toolsRun.length > 0 ? toolsRun.join(', ') : 'none'} | phase: ${startingPhase} -> ${endingPhase}`
    );
    return response;
  }

  async save(): Promise<void> {
    const canvas = this.requireCanvas();
    await saveCanvas(canvas.project.slug, canvas);
  }

  private requireCanvas(): Canvas {
    if (!this.canvas) {
      throw new Error('Orchestrator has not been initialized.');
    }

    return this.canvas;
  }
}

/* Notes:
- `warmup` is tool-limited; it can write intake and, in the same turn, launch research once intake is set.
- `update_canvas` is the warmup handoff into intake.
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
*/
