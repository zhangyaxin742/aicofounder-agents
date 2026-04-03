import type { Canvas, StoredAgentReport } from "../canvas/schema.js";

type ContextAgentName =
  | "scout"
  | "analyst"
  | "sizer"
  | "icp"
  | "architect"
  | "technical-cofounder"
  | "gtm"
  | "critic"
  | "verifier"
  | "export-agent";

interface BuildContextSliceOptions {
  agent: ContextAgentName;
  canvas: Canvas;
  includeFullCanvas?: boolean;
}

interface SerializedReport {
  summary: string;
  raw_markdown: string;
  structured: Record<string, unknown>;
  verification: StoredAgentReport["verification"];
  timestamp: string;
}

function serializeReport(report?: StoredAgentReport): SerializedReport | undefined {
  if (!report) {
    return undefined;
  }

  return {
    summary: report.summary,
    raw_markdown: report.raw_markdown,
    structured: report.structured,
    verification: report.verification,
    timestamp: report.timestamp
  };
}

export function buildContextSlice({
  agent,
  canvas,
  includeFullCanvas = false
}: BuildContextSliceOptions): string {
  if (includeFullCanvas || agent === "critic" || agent === "export-agent") {
    return JSON.stringify(canvas, null, 2);
  }

  const baseContext = {
    project: {
      id: canvas.project.id,
      slug: canvas.project.slug,
      name: canvas.project.name,
      phase: canvas.project.phase
    },
    conversation_summary: canvas.conversation_summary,
    idea: canvas.idea
  };

  const researchReports = {
    scout: serializeReport(canvas.research.reports.scout),
    analyst: serializeReport(canvas.research.reports.analyst),
    sizer: serializeReport(canvas.research.reports.sizer)
  };

  let context: Record<string, unknown>;

  switch (agent) {
    case "scout":
    case "analyst":
    case "sizer":
      context = {
        ...baseContext,
        prior_research_failures: canvas.research.failures
      };
      break;
    case "icp":
      context = {
        ...baseContext,
        research: {
          reports: researchReports,
          failures: canvas.research.failures,
          last_updated: canvas.research.last_updated
        }
      };
      break;
    case "architect":
      context = {
        ...baseContext,
        research: {
          reports: researchReports
        },
        icp: {
          report: serializeReport(canvas.icp.report)
        }
      };
      break;
    case "technical-cofounder":
      context = {
        ...baseContext,
        research: {
          reports: researchReports
        },
        icp: {
          report: serializeReport(canvas.icp.report)
        },
        build: {
          architect: serializeReport(canvas.build.architect)
        }
      };
      break;
    case "gtm":
      context = {
        ...baseContext,
        research: {
          reports: researchReports
        },
        icp: {
          report: serializeReport(canvas.icp.report)
        },
        build: {
          architect: serializeReport(canvas.build.architect),
          technical_cofounder: serializeReport(canvas.build.technical_cofounder)
        }
      };
      break;
    case "verifier":
      context = {
        ...baseContext,
        phase_inputs: {
          research: {
            reports: researchReports
          },
          icp: serializeReport(canvas.icp.report),
          build: {
            architect: serializeReport(canvas.build.architect),
            technical_cofounder: serializeReport(canvas.build.technical_cofounder)
          },
          gtm: serializeReport(canvas.gtm.report)
        }
      };
      break;
    default:
      context = baseContext;
      break;
  }

  return JSON.stringify(context, null, 2);
}
