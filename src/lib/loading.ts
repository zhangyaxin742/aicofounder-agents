const ESC = "\x1b[";

const ansi = {
  clearLine: `${ESC}2K`,
  cursorUp: (n: number) => `${ESC}${n}A`,
  cursorStart: "\r",
  hideCursor: `${ESC}?25l`,
  showCursor: `${ESC}?25h`,
  rgb: (r: number, g: number, b: number, s: string) =>
    `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[96m${s}\x1b[0m`,
  white: (s: string) => `\x1b[97m${s}\x1b[0m`,
  green: (s: string) => `\x1b[92m${s}\x1b[0m`,
  red: (s: string) => `\x1b[91m${s}\x1b[0m`
};

type RGB = [number, number, number];

const PALETTE: RGB[] = [
  [255, 80, 100],
  [255, 140, 60],
  [255, 215, 60],
  [60, 215, 180],
  [60, 140, 255],
  [160, 60, 255]
];

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

function gradientBar(width: number, offset: number): string {
  let out = "";

  for (let i = 0; i < width; i++) {
    const t = ((i + offset) % width) / width;
    const raw = t * (PALETTE.length - 1);
    const lo = PALETTE[Math.floor(raw) % PALETTE.length];
    const hi = PALETTE[Math.ceil(raw) % PALETTE.length];
    const [r, g, b] = lerp(lo, hi, raw % 1);
    out += ansi.rgb(r, g, b, "=");
  }

  return out;
}

const PET_MOODS = {
  idle: ["(o_o)", "(._.)", "(o_o)", "(^_^)"],
  searching: ["(o_o)", "(O_O)", "(o_o)", "(._.)"],
  thinking: ["(-_-)", "(. .)", "(-_-)", "(._.)"],
  writing: ["(^_^)", "(o_o)", "(^_^)", "(o_o)"],
  judging: ["(>_<)", "(o_o)", "(>_<)", "(._.)"]
} as const;

type Mood = keyof typeof PET_MOODS;

const AGENT_MOOD: Record<string, Mood> = {
  scout: "searching",
  analyst: "searching",
  sizer: "searching",
  icp: "thinking",
  architect: "searching",
  "technical-cofounder": "judging",
  gtm: "thinking",
  critic: "judging",
  verifier: "thinking",
  orchestrator: "thinking",
  "export-agent": "writing"
};

const SPINNER = ["   ", ".  ", ".. ", "..."];

const STATUS: Record<string, string[]> = {
  scout: [
    "scanning for pain signals",
    "reading user complaints",
    "looking for voice-of-customer quotes"
  ],
  analyst: [
    "mapping the competitive landscape",
    "checking pricing pages",
    "reverse-engineering competitor stacks"
  ],
  sizer: [
    "estimating market size",
    "checking growth signals",
    "building the bottom-up SOM"
  ],
  icp: [
    "building your customer persona",
    "mapping buying triggers",
    "finding where the ICP lives"
  ],
  architect: [
    "researching stack choices",
    "modeling infrastructure costs",
    "checking integration constraints"
  ],
  "technical-cofounder": [
    "making the hard architecture calls",
    "cutting the MVP aggressively",
    "finding the real technical risks"
  ],
  gtm: [
    "finding distribution channels",
    "building the 90-day plan",
    "modeling the path to revenue"
  ],
  critic: [
    "looking for the kill shots",
    "stress-testing assumptions",
    "finding what you do not want to hear"
  ],
  verifier: [
    "checking sources",
    "flagging unsupported specificity",
    "auditing for hallucinations"
  ],
  orchestrator: [
    "thinking this through",
    "connecting the dots",
    "forming a point of view"
  ],
  "export-agent": [
    "assembling the founder-facing brief",
    "formatting the export package",
    "turning canvas state into a readable brief"
  ]
};

const AGENT_LABELS: Record<string, string> = {
  scout: "Market Scout",
  analyst: "Competitor Analyst",
  sizer: "Market Sizer",
  icp: "ICP Whisperer",
  architect: "Architect",
  "technical-cofounder": "Technical Cofounder",
  gtm: "GTM Specialist",
  critic: "The Critic",
  verifier: "Verifier",
  orchestrator: "Cofounder",
  "export-agent": "Export Agent"
};

interface AgentRow {
  agent: string;
  done: boolean;
  statusIdx: number;
}

interface LoaderState {
  mode: "single" | "parallel";
  rows: AgentRow[];
  interval: ReturnType<typeof setInterval> | null;
  frame: number;
  barOffset: number;
  lineCount: number;
}

const state: LoaderState = {
  mode: "single",
  rows: [],
  interval: null,
  frame: 0,
  barOffset: 0,
  lineCount: 0
};

function isInteractiveTerminal(): boolean {
  return Boolean(process.stdout.isTTY);
}

function width(): number {
  return Math.min((process.stdout.columns || 80) - 4, 56);
}

function pet(agent: string, frame: number): string {
  const mood = AGENT_MOOD[agent] ?? "idle";
  const frames = PET_MOODS[mood];
  return frames[Math.floor(frame / 4) % frames.length];
}

function renderSingle(): string[] {
  const row = state.rows[0];
  const msgs = STATUS[row.agent] ?? STATUS.orchestrator;
  const label = AGENT_LABELS[row.agent] ?? row.agent;
  const spinner = SPINNER[state.frame % SPINNER.length];
  const status = msgs[row.statusIdx % msgs.length];
  const bar = gradientBar(width(), state.barOffset);
  const face = pet(row.agent, state.frame);

  return [
    "",
    `  ${ansi.bold(ansi.white(face))}  ${ansi.cyan(label)}  ${ansi.dim(spinner)}`,
    `  ${ansi.dim(status)}`,
    `  ${bar}`,
    ""
  ];
}

function renderParallel(): string[] {
  const lines: string[] = [""];
  const bar = gradientBar(width(), state.barOffset);

  for (const row of state.rows) {
    const msgs = STATUS[row.agent] ?? STATUS.orchestrator;
    const label = (AGENT_LABELS[row.agent] ?? row.agent).padEnd(20);
    const spinner = row.done ? ansi.green("OK") : SPINNER[state.frame % SPINNER.length];
    const status = row.done ? ansi.dim("done") : ansi.dim(msgs[row.statusIdx % msgs.length]);
    const face = row.done ? "(^_^)" : pet(row.agent, state.frame);
    const color = row.done ? ansi.dim : ansi.cyan;

    lines.push(`  ${ansi.dim(face)}  ${color(label)}  ${ansi.dim(spinner)}  ${status}`);
  }

  lines.push(`  ${bar}`, "");
  return lines;
}

function tick(): void {
  state.frame += 1;
  state.barOffset = (state.barOffset + 1) % width();

  if (state.frame % 60 === 0) {
    for (const row of state.rows) {
      if (!row.done) {
        row.statusIdx += 1;
      }
    }
  }

  const lines = state.mode === "single" ? renderSingle() : renderParallel();

  if (state.lineCount > 0) {
    process.stdout.write(ansi.cursorUp(state.lineCount));
  }

  const out = lines
    .map((line) => `${ansi.clearLine}${ansi.cursorStart}${line}`)
    .join("\n");

  process.stdout.write(out);
  state.lineCount = lines.length - 1;
}

function clear(): void {
  if (state.lineCount > 0) {
    process.stdout.write(ansi.cursorUp(state.lineCount));
    for (let i = 0; i <= state.lineCount; i++) {
      process.stdout.write(
        `${ansi.clearLine}${ansi.cursorStart}${i < state.lineCount ? "\n" : ""}`
      );
    }
    process.stdout.write(ansi.cursorStart);
  }
}

export function startLoading(agent = "orchestrator"): void {
  if (!isInteractiveTerminal()) {
    return;
  }

  stopLoading();
  state.mode = "single";
  state.rows = [{ agent, done: false, statusIdx: 0 }];
  state.frame = 0;
  state.barOffset = 0;
  state.lineCount = 0;
  process.stdout.write(ansi.hideCursor);
  tick();
  state.interval = setInterval(tick, 100);
}

export function startParallelLoading(agents: string[]): void {
  if (!isInteractiveTerminal()) {
    return;
  }

  stopLoading();
  state.mode = "parallel";
  state.rows = agents.map((agent) => ({ agent, done: false, statusIdx: 0 }));
  state.frame = 0;
  state.barOffset = 0;
  state.lineCount = 0;
  process.stdout.write(ansi.hideCursor);
  tick();
  state.interval = setInterval(tick, 100);
}

export function markAgentDone(agent: string): void {
  if (!isInteractiveTerminal()) {
    return;
  }

  const row = state.rows.find((candidate) => candidate.agent === agent);
  if (row) {
    row.done = true;
  }
}

export function stopLoading(): void {
  if (!isInteractiveTerminal()) {
    return;
  }

  if (!state.interval) {
    return;
  }

  clearInterval(state.interval);
  state.interval = null;
  clear();
  process.stdout.write(ansi.showCursor);
}

export function printDone(agent: string, detail: string): void {
  const label = AGENT_LABELS[agent] ?? agent;
  if (!isInteractiveTerminal()) {
    console.log(`  OK ${label}  ${detail}`);
    return;
  }

  console.log(`  ${ansi.green("OK")} ${ansi.bold(label)}  ${ansi.dim(detail)}`);
}

export function printFailed(agent: string, reason: string): void {
  const label = AGENT_LABELS[agent] ?? agent;
  if (!isInteractiveTerminal()) {
    console.log(`  FAIL ${label}  ${reason}`);
    return;
  }

  console.log(`  ${ansi.red("FAIL")} ${ansi.bold(label)}  ${ansi.dim(reason)}`);
}

export function printStage(title: string, detail?: string): void {
  const suffix = detail ? `  ${detail}` : "";
  if (!isInteractiveTerminal()) {
    console.log(`\n[stage] ${title}${suffix}\n`);
    return;
  }

  console.log(`\n  ${ansi.bold(ansi.cyan("STAGE"))} ${ansi.bold(title)}${detail ? `  ${ansi.dim(detail)}` : ""}\n`);
}

export function printInfo(label: string, detail: string): void {
  if (!isInteractiveTerminal()) {
    console.log(`  INFO ${label}  ${detail}`);
    return;
  }

  console.log(`  ${ansi.cyan("INFO")} ${ansi.bold(label)}  ${ansi.dim(detail)}`);
}
