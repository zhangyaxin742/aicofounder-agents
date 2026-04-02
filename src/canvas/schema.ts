export interface ConversationTurn {
  role: "user" | "assistant";
  message: string;
  at: string;
}

export interface ResearchNote {
  agent: string;
  summary: string;
  bullets: string[];
  updatedAt: string;
}

export type ProjectPhase =
  | "warmup"
  | "research"
  | "icp"
  | "build"
  | "gtm"
  | "critic"
  | "exported";

export interface ResearchSwarmState {
  scout: ResearchNote;
  analyst: ResearchNote;
  sizer: ResearchNote;
}

export interface ProjectCanvas {
  projectName: string;
  projectSlug: string;
  phase: ProjectPhase;
  createdAt: string;
  lastOpenedAt: string;
  idea: string;
  updatedAt: string;
  conversation: ConversationTurn[];
  research: ResearchSwarmState;
  icp: ResearchNote;
  architecture: ResearchNote;
  buildPlan: ResearchNote;
  gtm: ResearchNote;
  critique: ResearchNote;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyNote(agent: string): ResearchNote {
  return {
    agent,
    summary: "Not run yet.",
    bullets: [],
    updatedAt: nowIso()
  };
}

export function createEmptyResearch(): ResearchSwarmState {
  return {
    scout: emptyNote("Market Scout"),
    analyst: emptyNote("Competitor Analyst"),
    sizer: emptyNote("Market Sizer")
  };
}

export function slugifyProjectName(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "default";
}

export function createProjectCanvas(
  projectName: string,
  projectSlug = slugifyProjectName(projectName)
): ProjectCanvas {
  const timestamp = nowIso();
  return {
    projectName: projectName.trim() || "default",
    projectSlug,
    phase: "warmup",
    createdAt: timestamp,
    lastOpenedAt: timestamp,
    idea: "",
    updatedAt: timestamp,
    conversation: [],
    research: createEmptyResearch(),
    icp: emptyNote("ICP Whisperer"),
    architecture: emptyNote("Architect"),
    buildPlan: emptyNote("Technical Cofounder"),
    gtm: emptyNote("GTM Specialist"),
    critique: emptyNote("Critic")
  };
}

export function createEmptyCanvas(projectSlug: string): ProjectCanvas {
  return createProjectCanvas(projectSlug, projectSlug);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isProjectPhase(value: unknown): value is ProjectPhase {
  return (
    value === "warmup" ||
    value === "research" ||
    value === "icp" ||
    value === "build" ||
    value === "gtm" ||
    value === "critic" ||
    value === "exported"
  );
}

function normalizeTurn(value: unknown): ConversationTurn | null {
  if (!isRecord(value)) {
    return null;
  }

  const role = value.role === "assistant" ? "assistant" : value.role === "user" ? "user" : null;
  const message = nonEmptyString(value.message);

  if (!role || !message) {
    return null;
  }

  return {
    role,
    message,
    at: nonEmptyString(value.at) ?? nowIso()
  };
}

function normalizeNote(value: unknown, agent: string): ResearchNote {
  if (!isRecord(value)) {
    return emptyNote(agent);
  }

  const bullets = Array.isArray(value.bullets)
    ? value.bullets
        .filter((bullet): bullet is string => typeof bullet === "string")
        .map((bullet) => bullet.trim())
        .filter(Boolean)
    : [];

  return {
    agent: nonEmptyString(value.agent) ?? agent,
    summary: nonEmptyString(value.summary) ?? "Not run yet.",
    bullets,
    updatedAt: nonEmptyString(value.updatedAt) ?? nowIso()
  };
}

export function normalizeCanvas(raw: unknown, fallbackProjectRef: string): ProjectCanvas {
  const fallbackName = fallbackProjectRef.trim() || "default";
  const fallbackSlug = slugifyProjectName(fallbackName);

  if (!isRecord(raw)) {
    return createProjectCanvas(fallbackName, fallbackSlug);
  }

  const research = isRecord(raw.research) ? raw.research : {};
  const conversation = Array.isArray(raw.conversation)
    ? raw.conversation
        .map((turn) => normalizeTurn(turn))
        .filter((turn): turn is ConversationTurn => turn !== null)
    : [];

  return {
    projectName: nonEmptyString(raw.projectName) ?? nonEmptyString(raw.projectSlug) ?? fallbackName,
    projectSlug: slugifyProjectName(nonEmptyString(raw.projectSlug) ?? fallbackSlug),
    phase: isProjectPhase(raw.phase) ? raw.phase : "warmup",
    createdAt: nonEmptyString(raw.createdAt) ?? nowIso(),
    lastOpenedAt: nonEmptyString(raw.lastOpenedAt) ?? nowIso(),
    idea: nonEmptyString(raw.idea) ?? "",
    updatedAt: nonEmptyString(raw.updatedAt) ?? nowIso(),
    conversation,
    research: {
      scout: normalizeNote(research.scout, "Market Scout"),
      analyst: normalizeNote(research.analyst, "Competitor Analyst"),
      sizer: normalizeNote(research.sizer, "Market Sizer")
    },
    icp: normalizeNote(raw.icp, "ICP Whisperer"),
    architecture: normalizeNote(raw.architecture, "Architect"),
    buildPlan: normalizeNote(raw.buildPlan, "Technical Cofounder"),
    gtm: normalizeNote(raw.gtm, "GTM Specialist"),
    critique: normalizeNote(raw.critique, "Critic")
  };
}
