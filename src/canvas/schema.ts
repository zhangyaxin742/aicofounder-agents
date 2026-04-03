export const CANVAS_SCHEMA_VERSION = "1";

export type ProjectPhase =
  | "warmup"
  | "intake"
  | "research"
  | "icp"
  | "build"
  | "gtm"
  | "critic"
  | "exported";

export type VerificationStatus = "pass" | "pass_with_warnings" | "needs_rerun";

export type ResearchAgentKey = "scout" | "analyst" | "sizer";

export interface VerificationMetadata {
  status: VerificationStatus;
  passed: boolean;
  issues: string[];
  source_count: number;
  hallucination_markers: string[];
  checked_at: string;
}

export interface StoredAgentReport {
  raw_markdown: string;
  structured: Record<string, unknown>;
  verification: VerificationMetadata;
  summary: string;
  timestamp: string;
}

export interface Canvas {
  schema_version: typeof CANVAS_SCHEMA_VERSION;
  project: {
    id: string;
    slug: string;
    name: string;
    created_at: string;
    phase: ProjectPhase;
  };
  last_opened_at?: string;
  conversation_summary?: string;
  idea: {
    summary?: string;
    founder_context?: string;
    initial_assumptions?: string[];
    open_questions?: string[];
    value_proposition?: string;
    possible_icp?: string[];
    last_updated?: string;
  };
  research: {
    reports: Partial<Record<ResearchAgentKey, StoredAgentReport>>;
    failures: Array<{
      phase: "research";
      reason: string;
      timestamp: string;
    }>;
    last_updated?: string;
  };
  icp: {
    report?: StoredAgentReport;
    last_updated?: string;
  };
  build: {
    architect?: StoredAgentReport;
    technical_cofounder?: StoredAgentReport;
    last_updated?: string;
  };
  gtm: {
    report?: StoredAgentReport;
    last_updated?: string;
  };
  critic: {
    reports: StoredAgentReport[];
    last_updated?: string;
  };
  risks: {
    items?: unknown[];
    last_updated?: string;
  };
  scorecard?: {
    verdict?: string;
    notes?: string[];
    last_updated?: string;
  };
  exports?: {
    last_path?: string;
    exported_at?: string;
  };
  decisions: Array<{
    date: string;
    decision: string;
    rationale?: string;
  }>;
}

type LegacyConversationTurn = {
  role?: unknown;
  message?: unknown;
  at?: unknown;
};

type LegacyResearchNote = {
  summary?: unknown;
  bullets?: unknown;
  updatedAt?: unknown;
  agent?: unknown;
};

export function nowIso(): string {
  return new Date().toISOString();
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

export function createVerificationMetadata(
  overrides: Partial<VerificationMetadata> & { status?: VerificationStatus } = {}
): VerificationMetadata {
  const status = overrides.status ?? "pass_with_warnings";

  return {
    status,
    passed: overrides.passed ?? status !== "needs_rerun",
    issues: overrides.issues ?? [],
    source_count: overrides.source_count ?? 0,
    hallucination_markers: overrides.hallucination_markers ?? [],
    checked_at: overrides.checked_at ?? nowIso()
  };
}

interface CreateStoredAgentReportOptions {
  reportType: string;
  rawMarkdown: string;
  structured?: Record<string, unknown>;
  summary?: string;
  verification?: Partial<VerificationMetadata> & { status?: VerificationStatus };
  timestamp?: string;
}

export function createStoredAgentReport(
  options: CreateStoredAgentReportOptions
): StoredAgentReport {
  const rawMarkdown = options.rawMarkdown.trim();
  const summary = (options.summary ?? firstMeaningfulLine(rawMarkdown) ?? "No summary available.").trim();
  const structured = {
    report_type: options.reportType,
    summary,
    ...(options.structured ?? {})
  };

  return {
    raw_markdown: rawMarkdown,
    structured,
    verification: createVerificationMetadata(options.verification),
    summary,
    timestamp: options.timestamp ?? nowIso()
  };
}

export function createEmptyResearchState(): Canvas["research"] {
  return {
    reports: {},
    failures: []
  };
}

export function createCanvas(
  projectName: string,
  projectSlug = slugifyProjectName(projectName)
): Canvas {
  const timestamp = nowIso();
  const slug = slugifyProjectName(projectSlug);

  return {
    schema_version: CANVAS_SCHEMA_VERSION,
    project: {
      id: slug,
      slug,
      name: projectName.trim() || "default",
      created_at: timestamp,
      phase: "warmup"
    },
    last_opened_at: timestamp,
    idea: {},
    research: createEmptyResearchState(),
    icp: {},
    build: {},
    gtm: {},
    critic: {
      reports: []
    },
    risks: {},
    decisions: []
  };
}

export function getIdeaSummary(canvas: Pick<Canvas, "idea">): string {
  return canvas.idea.summary?.trim() || "No idea captured yet.";
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

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function normalizeUnknownArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) && value.length > 0 ? value : undefined;
}

function isProjectPhase(value: unknown): value is ProjectPhase {
  return (
    value === "warmup" ||
    value === "intake" ||
    value === "research" ||
    value === "icp" ||
    value === "build" ||
    value === "gtm" ||
    value === "critic" ||
    value === "exported"
  );
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return value === "pass" || value === "pass_with_warnings" || value === "needs_rerun";
}

function firstMeaningfulLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .find(Boolean);
}

function composeLegacyMarkdown(note: LegacyResearchNote): string | undefined {
  const summary = nonEmptyString(note.summary);
  const bullets = normalizeStringArray(note.bullets);

  if (!summary && !bullets) {
    return undefined;
  }

  return [
    summary,
    bullets?.map((bullet) => `- ${bullet}`).join("\n")
  ]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeVerification(value: unknown, fallbackIssues: string[] = []): VerificationMetadata {
  if (!isRecord(value)) {
    return createVerificationMetadata({
      status: fallbackIssues.length > 0 ? "pass_with_warnings" : "pass",
      issues: fallbackIssues
    });
  }

  const derivedStatus = isVerificationStatus(value.status)
    ? value.status
    : value.passed === false
      ? "needs_rerun"
      : "pass_with_warnings";
  const issues = normalizeStringArray(value.issues) ?? fallbackIssues;
  const hallucinationMarkers = normalizeStringArray(value.hallucination_markers) ?? [];
  const sourceCount = typeof value.source_count === "number" && Number.isFinite(value.source_count)
    ? value.source_count
    : 0;

  return createVerificationMetadata({
    status: derivedStatus,
    passed: typeof value.passed === "boolean" ? value.passed : derivedStatus !== "needs_rerun",
    issues,
    source_count: sourceCount,
    hallucination_markers: hallucinationMarkers,
    checked_at: nonEmptyString(value.checked_at) ?? nowIso()
  });
}

function normalizeStoredAgentReport(
  value: unknown,
  reportType: string
): StoredAgentReport | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const rawMarkdown = nonEmptyString(value.raw_markdown)
    ?? composeLegacyMarkdown(value as LegacyResearchNote);

  if (!rawMarkdown) {
    return undefined;
  }

  const summary = nonEmptyString(value.summary)
    ?? firstMeaningfulLine(rawMarkdown)
    ?? "No summary available.";
  const fallbackIssues =
    nonEmptyString(value.raw_markdown) || isRecord(value.verification)
      ? []
      : ["Migrated from legacy note without verifier metadata."];
  const legacyBullets = normalizeStringArray((value as LegacyResearchNote).bullets);
  const isLegacyPlaceholder =
    rawMarkdown === "Not run yet." &&
    !isRecord(value.structured) &&
    !isRecord(value.verification) &&
    !legacyBullets;

  if (isLegacyPlaceholder) {
    return undefined;
  }

  const structured = isRecord(value.structured)
    ? {
        report_type: reportType,
        summary,
        ...value.structured
      }
    : {
        report_type: reportType,
        summary,
        ...(legacyBullets ? { bullets: legacyBullets } : {})
      };

  return {
    raw_markdown: rawMarkdown,
    structured,
    verification: normalizeVerification(value.verification, fallbackIssues),
    summary,
    timestamp:
      nonEmptyString(value.timestamp)
      ?? nonEmptyString((value as LegacyResearchNote).updatedAt)
      ?? nonEmptyString(value.last_updated)
      ?? nowIso()
  };
}

function summarizeLegacyConversation(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const lines = value
    .slice(-4)
    .map((turn) => {
      const record = turn as LegacyConversationTurn;
      const role = record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : undefined;
      const message = nonEmptyString(record.message);

      if (!role || !message) {
        return undefined;
      }

      return `${role}: ${message}`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length > 0 ? lines.join("\n") : undefined;
}

function normalizeDecisions(value: unknown): Canvas["decisions"] {
  if (!Array.isArray(value)) {
    return [];
  }

  const decisions: Canvas["decisions"] = [];

  value.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const decision = nonEmptyString(item.decision);

    if (!decision) {
      return;
    }

    decisions.push({
      date: nonEmptyString(item.date) ?? nowIso(),
      decision,
      rationale: nonEmptyString(item.rationale)
    });
  });

  return decisions;
}

function normalizeResearchFailures(value: unknown): Canvas["research"]["failures"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const reason = nonEmptyString(item.reason);

      if (!reason) {
        return null;
      }

      return {
        phase: "research" as const,
        reason,
        timestamp: nonEmptyString(item.timestamp) ?? nowIso()
      };
    })
    .filter((item): item is Canvas["research"]["failures"][number] => item !== null);
}

function latestTimestamp(...values: Array<string | undefined>): string | undefined {
  const sorted = values.filter((value): value is string => Boolean(value)).sort();
  return sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
}

export function normalizeCanvas(raw: unknown, fallbackProjectRef: string): Canvas {
  const fallbackName = fallbackProjectRef.trim() || "default";
  const fallbackSlug = slugifyProjectName(fallbackName);

  if (!isRecord(raw)) {
    return createCanvas(fallbackName, fallbackSlug);
  }

  const canonicalProject = isRecord(raw.project) ? raw.project : {};
  const legacyProjectName = nonEmptyString(raw.projectName) ?? nonEmptyString(raw.projectSlug);
  const projectName = nonEmptyString(canonicalProject.name) ?? legacyProjectName ?? fallbackName;
  const projectSlug = slugifyProjectName(
    nonEmptyString(canonicalProject.slug)
    ?? nonEmptyString(canonicalProject.id)
    ?? nonEmptyString(raw.projectSlug)
    ?? fallbackSlug
  );
  const projectCreatedAt =
    nonEmptyString(canonicalProject.created_at)
    ?? nonEmptyString(raw.createdAt)
    ?? nowIso();
  const phase = isProjectPhase(canonicalProject.phase)
    ? canonicalProject.phase
    : isProjectPhase(raw.phase)
      ? raw.phase
      : "warmup";

  const canonicalIdea = isRecord(raw.idea) ? raw.idea : {};
  const legacyIdeaSummary =
    !isRecord(raw.idea) ? nonEmptyString(raw.idea) : undefined;
  const ideaLastUpdated =
    nonEmptyString(canonicalIdea.last_updated)
    ?? nonEmptyString(raw.updatedAt)
    ?? (legacyIdeaSummary ? projectCreatedAt : undefined);

  const researchRoot = isRecord(raw.research) ? raw.research : {};
  const researchReportsRoot = isRecord(researchRoot.reports) ? researchRoot.reports : {};
  const scoutReport = normalizeStoredAgentReport(
    researchReportsRoot.scout ?? researchRoot.scout,
    "market_scout"
  );
  const analystReport = normalizeStoredAgentReport(
    researchReportsRoot.analyst ?? researchRoot.analyst,
    "competitor_analyst"
  );
  const sizerReport = normalizeStoredAgentReport(
    researchReportsRoot.sizer ?? researchRoot.sizer,
    "market_sizer"
  );

  const icpRoot = isRecord(raw.icp) ? raw.icp : {};
  const buildRoot = isRecord(raw.build) ? raw.build : {};
  const gtmRoot = isRecord(raw.gtm) ? raw.gtm : {};
  const criticRoot = isRecord(raw.critic) ? raw.critic : {};
  const risksRoot = isRecord(raw.risks) ? raw.risks : {};
  const scorecardRoot = isRecord(raw.scorecard) ? raw.scorecard : {};
  const exportsRoot = isRecord(raw.exports) ? raw.exports : {};

  const criticReports = Array.isArray(criticRoot.reports)
    ? criticRoot.reports
        .map((report) => normalizeStoredAgentReport(report, "critic"))
        .filter((report): report is StoredAgentReport => Boolean(report))
    : [];
  const legacyCritic = normalizeStoredAgentReport(raw.critique, "critic");

  if (legacyCritic) {
    criticReports.push(legacyCritic);
  }

  return {
    schema_version: CANVAS_SCHEMA_VERSION,
    project: {
      id: nonEmptyString(canonicalProject.id) ?? projectSlug,
      slug: projectSlug,
      name: projectName,
      created_at: projectCreatedAt,
      phase
    },
    last_opened_at:
      nonEmptyString(raw.last_opened_at)
      ?? nonEmptyString(raw.lastOpenedAt)
      ?? nowIso(),
    conversation_summary:
      nonEmptyString(raw.conversation_summary)
      ?? summarizeLegacyConversation(raw.conversation),
    idea: {
      summary: nonEmptyString(canonicalIdea.summary) ?? legacyIdeaSummary,
      founder_context: nonEmptyString(canonicalIdea.founder_context),
      initial_assumptions: normalizeStringArray(canonicalIdea.initial_assumptions),
      open_questions: normalizeStringArray(canonicalIdea.open_questions),
      value_proposition: nonEmptyString(canonicalIdea.value_proposition),
      possible_icp: normalizeStringArray(canonicalIdea.possible_icp),
      last_updated: ideaLastUpdated
    },
    research: {
      reports: {
        ...(scoutReport ? { scout: scoutReport } : {}),
        ...(analystReport ? { analyst: analystReport } : {}),
        ...(sizerReport ? { sizer: sizerReport } : {})
      },
      failures: normalizeResearchFailures(researchRoot.failures),
      last_updated:
        nonEmptyString(researchRoot.last_updated)
        ?? latestTimestamp(
          scoutReport?.timestamp,
          analystReport?.timestamp,
          sizerReport?.timestamp
        )
    },
    icp: {
      report: normalizeStoredAgentReport(icpRoot.report ?? raw.icp, "icp"),
      last_updated:
        nonEmptyString(icpRoot.last_updated)
        ?? normalizeStoredAgentReport(icpRoot.report ?? raw.icp, "icp")?.timestamp
    },
    build: {
      architect: normalizeStoredAgentReport(buildRoot.architect ?? raw.architecture, "architect"),
      technical_cofounder: normalizeStoredAgentReport(
        buildRoot.technical_cofounder ?? raw.buildPlan,
        "technical_cofounder"
      ),
      last_updated:
        nonEmptyString(buildRoot.last_updated)
        ?? latestTimestamp(
          normalizeStoredAgentReport(buildRoot.architect ?? raw.architecture, "architect")?.timestamp,
          normalizeStoredAgentReport(
            buildRoot.technical_cofounder ?? raw.buildPlan,
            "technical_cofounder"
          )?.timestamp
        )
    },
    gtm: {
      report: normalizeStoredAgentReport(gtmRoot.report ?? raw.gtm, "gtm"),
      last_updated:
        nonEmptyString(gtmRoot.last_updated)
        ?? normalizeStoredAgentReport(gtmRoot.report ?? raw.gtm, "gtm")?.timestamp
    },
    critic: {
      reports: criticReports,
      last_updated:
        nonEmptyString(criticRoot.last_updated)
        ?? latestTimestamp(...criticReports.map((report) => report.timestamp))
    },
    risks: {
      items: normalizeUnknownArray(risksRoot.items),
      last_updated: nonEmptyString(risksRoot.last_updated)
    },
    scorecard: isRecord(raw.scorecard)
      ? {
          verdict: nonEmptyString(scorecardRoot.verdict),
          notes: normalizeStringArray(scorecardRoot.notes),
          last_updated: nonEmptyString(scorecardRoot.last_updated)
        }
      : undefined,
    exports: isRecord(raw.exports)
      ? {
          last_path: nonEmptyString(exportsRoot.last_path),
          exported_at: nonEmptyString(exportsRoot.exported_at)
        }
      : undefined,
    decisions: normalizeDecisions(raw.decisions)
  };
}
