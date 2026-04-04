// lib/loading.ts
// Terminal pet + gradient loading animations for agent turns

// ─── ANSI ────────────────────────────────────────────────────────────────────

const ESC = '\x1b[';
const ansi = {
  clearLine:         `${ESC}2K`,
  cursorUp:   (n: number) => `${ESC}${n}A`,
  cursorStart:       '\r',
  hideCursor:        `${ESC}?25l`,
  showCursor:        `${ESC}?25h`,
  rgb: (r: number, g: number, b: number, s: string) =>
    `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan:   (s: string) => `\x1b[96m${s}\x1b[0m`,
  white:  (s: string) => `\x1b[97m${s}\x1b[0m`,
  green:  (s: string) => `\x1b[92m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[93m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[91m${s}\x1b[0m`,
};

// ─── Gradient ────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const PALETTE: RGB[] = [
  [255, 80,  100],  // rose
  [255, 140, 60 ],  // orange
  [255, 215, 60 ],  // amber
  [60,  215, 180],  // teal
  [60,  140, 255],  // blue
  [160, 60,  255],  // violet
];

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function gradientBar(width: number, offset: number): string {
  let out = '';
  for (let i = 0; i < width; i++) {
    const t = ((i + offset) % width) / width;
    const raw = t * (PALETTE.length - 1);
    const lo  = PALETTE[Math.floor(raw) % PALETTE.length];
    const hi  = PALETTE[Math.ceil(raw)  % PALETTE.length];
    const [r, g, b] = lerp(lo, hi, raw % 1);
    out += ansi.rgb(r, g, b, '█');
  }
  return out;
}

// ─── Pet ─────────────────────────────────────────────────────────────────────
//  Mood cycles at 1/4 the frame rate so it doesn't strobe

const PET_MOODS = {
  idle:      ['◉‿◉', '◉ ◉', '◉‿◉', '◕‿◕'],
  searching: ['◉_◉', '◕_◕', '◉_◉', '◕ ◕'],
  thinking:  ['◉~◉', '◉-◉', '◕~◕', '◉-◉'],
  writing:   ['◉‿◉', '◕‿◕', '◉‿◉', '◕‿◕'],
  judging:   ['⊙_⊙', '◉_◉', '⊙ ⊙', '◉ ◉'],
} as const;

type Mood = keyof typeof PET_MOODS;

const AGENT_MOOD: Record<string, Mood> = {
  market_scout:        'searching',
  competitor_analyst:  'searching',
  market_sizer:        'searching',
  icp_whisperer:       'thinking',
  architect:           'searching',
  technical_cofounder: 'judging',
  gtm_specialist:      'thinking',
  critic:              'judging',
  verifier:            'thinking',
  orchestrator:        'thinking',
};

// ─── Spinner ─────────────────────────────────────────────────────────────────

const SPINNER = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

// ─── Status messages ─────────────────────────────────────────────────────────

const STATUS: Record<string, string[]> = {
  market_scout: [
    'scanning r/SaaS for pain signals',
    'digging through Hacker News threads',
    'mining App Store reviews',
    'finding the voice of your customer',
    'reading between the lines of complaints',
    'looking for the quote that says everything',
  ],
  competitor_analyst: [
    'mapping the competitive landscape',
    'checking pricing pages',
    'pulling funding rounds from Crunchbase',
    'reading G2 reviews so you don\'t have to',
    'reverse-engineering competitor stacks',
    'finding what they\'re not telling you',
  ],
  market_sizer: [
    'pulling TAM data from Statista',
    'cross-referencing market reports',
    'building a bottom-up SOM estimate',
    'checking recent funding signals',
    'making the timing case',
    'separating hype from real market size',
  ],
  icp_whisperer: [
    'building your customer persona',
    'finding where your ICP actually hangs out',
    'modeling willingness to pay',
    'mapping behavioral signals',
    'identifying the beachhead segment',
    'asking: who hurts most right now?',
  ],
  architect: [
    'checking BuiltWith and Stackshare',
    'researching competitor tech stacks',
    'modeling infrastructure costs at scale',
    'scoping the build sequence',
    'finding the right integrations',
    'reading engineering blogs so you don\'t have to',
  ],
  technical_cofounder: [
    'making the hard architecture calls',
    'figuring out what to cut',
    'finding the real technical risks',
    'deciding what to build vs buy',
    'mapping signup → value moment',
    'asking: what breaks at 10k users?',
  ],
  gtm_specialist: [
    'finding your distribution channels',
    'building the 90-day plan',
    'researching your first investors',
    'modeling the path to MRR',
    'locating your ICP\'s communities',
    'finding the growth lever that works',
  ],
  critic: [
    'looking for the kill shots',
    'stress-testing every assumption',
    'finding what you don\'t want to hear',
    'pressure-testing the thesis',
    'playing devil\'s advocate',
    'asking: why will this fail?',
  ],
  verifier: [
    'checking sources',
    'flagging unsourced claims',
    'auditing for hallucinations',
  ],
  orchestrator: [
    'thinking this through',
    'synthesizing the findings',
    'forming a point of view',
    'challenging the assumptions',
    'deciding what matters',
    'connecting the dots',
  ],
};

const AGENT_LABELS: Record<string, string> = {
  market_scout:        'Market Scout',
  competitor_analyst:  'Competitor Analyst',
  market_sizer:        'Market Sizer',
  icp_whisperer:       'ICP Whisperer',
  architect:           'Architect',
  technical_cofounder: 'Technical Cofounder',
  gtm_specialist:      'GTM Specialist',
  critic:              'The Critic',
  verifier:            'Verifier',
  orchestrator:        'Cofounder',
};

// ─── Loader ───────────────────────────────────────────────────────────────────

interface AgentRow {
  agent:     string;
  done:      boolean;
  statusIdx: number;
}

interface LoaderState {
  mode:       'single' | 'parallel';
  rows:       AgentRow[];
  interval:   ReturnType<typeof setInterval> | null;
  frame:      number;
  barOffset:  number;
  lineCount:  number;
}

const state: LoaderState = {
  mode:      'single',
  rows:      [],
  interval:  null,
  frame:     0,
  barOffset: 0,
  lineCount: 0,
};

const WIDTH = Math.min((process.stdout.columns || 80) - 4, 56);

function pet(agent: string, frame: number): string {
  const mood   = AGENT_MOOD[agent] ?? 'idle';
  const frames = PET_MOODS[mood];
  return frames[Math.floor(frame / 4) % frames.length];
}

function renderSingle(): string[] {
  const row     = state.rows[0];
  const msgs    = STATUS[row.agent] ?? STATUS.orchestrator;
  const label   = AGENT_LABELS[row.agent] ?? row.agent;
  const spinner = SPINNER[state.frame % SPINNER.length];
  const status  = msgs[row.statusIdx % msgs.length];
  const bar     = gradientBar(WIDTH, state.barOffset);
  const face    = pet(row.agent, state.frame);

  return [
    '',
    `  ${ansi.bold(ansi.white(face))}  ${ansi.cyan(label)}  ${ansi.dim(spinner)}`,
    `  ${ansi.dim(status)}`,
    `  ${bar}`,
    '',
  ];
}

function renderParallel(): string[] {
  const lines: string[] = [''];
  const bar = gradientBar(WIDTH, state.barOffset);

  for (const row of state.rows) {
    const msgs    = STATUS[row.agent] ?? STATUS.orchestrator;
    const label   = (AGENT_LABELS[row.agent] ?? row.agent).padEnd(20);
    const spinner = row.done ? ansi.green('✓') : SPINNER[state.frame % SPINNER.length];
    const status  = row.done ? ansi.dim('done') : ansi.dim(msgs[row.statusIdx % msgs.length]);
    const face    = row.done ? '◉‿◉' : pet(row.agent, state.frame);
    const color   = row.done ? ansi.dim : ansi.cyan;

    lines.push(`  ${ansi.dim(face)}  ${color(label)}  ${ansi.dim(spinner)}  ${status}`);
  }

  lines.push(`  ${bar}`, '');
  return lines;
}

function tick(): void {
  state.frame++;
  state.barOffset = (state.barOffset + 1) % WIDTH;

  // Rotate status messages every ~3s at 50ms interval = 60 frames
  if (state.frame % 60 === 0) {
    for (const row of state.rows) {
      if (!row.done) row.statusIdx++;
    }
  }

  const lines = state.mode === 'single' ? renderSingle() : renderParallel();

  // Move cursor up to overwrite previous frame
  if (state.lineCount > 0) {
    process.stdout.write(ansi.cursorUp(state.lineCount));
  }

  // Write new frame
  const out = lines
    .map(l => `${ansi.clearLine}${ansi.cursorStart}${l}`)
    .join('\n');

  process.stdout.write(out);
  state.lineCount = lines.length - 1;
}

function clear(): void {
  if (state.lineCount > 0) {
    process.stdout.write(ansi.cursorUp(state.lineCount));
    for (let i = 0; i <= state.lineCount; i++) {
      process.stdout.write(
        `${ansi.clearLine}${ansi.cursorStart}${i < state.lineCount ? '\n' : ''}`
      );
    }
    process.stdout.write(ansi.cursorStart);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Single agent loading (orchestrator turns, sequential agents) */
export function startLoading(agent = 'orchestrator'): void {
  stopLoading();
  state.mode      = 'single';
  state.rows      = [{ agent, done: false, statusIdx: 0 }];
  state.frame     = 0;
  state.barOffset = 0;
  state.lineCount = 0;

  process.stdout.write(ansi.hideCursor);
  state.interval = setInterval(tick, 50);
}

/** Parallel fan-out loading (research phase — Scout + Analyst + Sizer) */
export function startParallelLoading(agents: string[]): void {
  stopLoading();
  state.mode      = 'parallel';
  state.rows      = agents.map(agent => ({ agent, done: false, statusIdx: 0 }));
  state.frame     = 0;
  state.barOffset = 0;
  state.lineCount = 0;

  process.stdout.write(ansi.hideCursor);
  state.interval = setInterval(tick, 50);
}

/** Mark one parallel agent as done (row goes green ✓) */
export function markAgentDone(agent: string): void {
  const row = state.rows.find(r => r.agent === agent);
  if (row) row.done = true;
}

/** Stop and clear everything */
export function stopLoading(): void {
  if (!state.interval) return;
  clearInterval(state.interval);
  state.interval = null;
  clear();
  process.stdout.write(ansi.showCursor);
}

/** Print a completion line after stopLoading() */
export function printDone(agent: string, detail: string): void {
  const label = AGENT_LABELS[agent] ?? agent;
  console.log(`  ${ansi.green('✓')} ${ansi.bold(label)}  ${ansi.dim(detail)}`);
}

/** Print an error line after stopLoading() */
export function printFailed(agent: string, reason: string): void {
  const label = AGENT_LABELS[agent] ?? agent;
  console.log(`  ${ansi.red('✗')} ${ansi.bold(label)}  ${ansi.dim(reason)}`);
}