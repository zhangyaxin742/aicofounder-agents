import { runAnalyst } from "./agents/analyst.js";
import { runArchitect } from "./agents/architect.js";
import { runCritic } from "./agents/critic.js";
import { runGtm } from "./agents/gtm.js";
import { runIcp } from "./agents/icp.js";
import { runScout } from "./agents/scout.js";
import { runSizer } from "./agents/sizer.js";
import { runTechnicalCofounder } from "./agents/technical-cofounder.js";
import {
  createCanvas,
  createEmptyResearchState,
  getIdeaSummary,
  nowIso,
  type Canvas,
  type ProjectPhase,
  type ResearchAgentKey,
  type StoredAgentReport
} from "./canvas/schema.js";
import { loadOrCreateCanvas, type CanvasLoadResult } from "./canvas/read.js";
import { writeCanvas } from "./canvas/write.js";
import { assembleBrief } from "./lib/export.js";
import { buildOrchestratorPrompt } from "./prompts/orchestrator.js";

const RESEARCH_TASKS: Array<{
  key: ResearchAgentKey;
  agentName: string;
  runner: (canvas: Canvas) => Promise<StoredAgentReport>;
}> = [
  { key: "scout", agentName: "Market Scout", runner: runScout },
  { key: "analyst", agentName: "Competitor Analyst", runner: runAnalyst },
  { key: "sizer", agentName: "Market Sizer", runner: runSizer }
];

export class Orchestrator {
  private canvas: Canvas = createCanvas("default", "default");

  constructor(private readonly projectRef: string) {}

  async init(): Promise<CanvasLoadResult> {
    const session = await loadOrCreateCanvas(this.projectRef);
    this.canvas = session.canvas;
    await this.save();
    return session;
  }

  async save(): Promise<void> {
    await writeCanvas(this.canvas);
  }

  async handleInput(input: string): Promise<string> {
    if (input === "/canvas") {
      return JSON.stringify(this.canvas, null, 2);
    }

    if (input === "/rerun") {
      return this.resetForRerun();
    }

    if (input === "/export") {
      return this.exportBrief();
    }

    return this.runIdeaCycle(input);
  }

  getProjectSummary(): { projectName: string; projectSlug: string; phase: ProjectPhase } {
    return {
      projectName: this.canvas.project.name,
      projectSlug: this.canvas.project.slug,
      phase: this.canvas.project.phase
    };
  }

  private async resetForRerun(): Promise<string> {
    this.clearDerivedState();
    this.canvas.project.phase = this.canvas.idea.summary ? "intake" : "warmup";
    this.appendConversationSummary("Research cache cleared. Downstream phase outputs were reset.");
    this.recordDecision(
      "Cleared research and downstream outputs",
      "Preparing for a clean rerun from the current intake brief."
    );
    await this.save();
    return "Research outputs cleared. The next run will start from the current intake brief.";
  }

  private async exportBrief(): Promise<string> {
    this.canvas.project.phase = "exported";
    const filePath = await assembleBrief(this.canvas);
    this.canvas.exports = {
      last_path: filePath,
      exported_at: nowIso()
    };
    this.recordDecision("Exported founder brief", `Wrote latest export to ${filePath}`);
    await this.save();
    return `Brief exported to ${filePath}`;
  }

  private async runIdeaCycle(input: string): Promise<string> {
    const timestamp = nowIso();
    const hadExistingIdea = Boolean(this.canvas.idea.summary);

    this.clearDerivedState();
    this.canvas.project.phase = "intake";
    this.canvas.idea = {
      ...this.canvas.idea,
      summary: input,
      last_updated: timestamp
    };
    this.appendConversationSummary(`Founder updated the intake brief: ${input}`);
    this.recordDecision(
      "Updated intake brief",
      hadExistingIdea
        ? "Replaced the prior intake summary and reset downstream outputs."
        : "Captured the first researchable project summary."
    );
    await this.save();

    await this.runResearchPhase();

    this.canvas.project.phase = "icp";
    this.canvas.icp.report = await runIcp(this.canvas);
    this.canvas.icp.last_updated = this.canvas.icp.report.timestamp;
    await this.save();

    this.canvas.project.phase = "build";
    this.canvas.build.architect = await runArchitect(this.canvas);
    this.canvas.build.technical_cofounder = await runTechnicalCofounder(this.canvas);
    this.canvas.build.last_updated = latestReportTimestamp(
      this.canvas.build.architect,
      this.canvas.build.technical_cofounder
    );
    await this.save();

    this.canvas.project.phase = "gtm";
    this.canvas.gtm.report = await runGtm(this.canvas);
    this.canvas.gtm.last_updated = this.canvas.gtm.report.timestamp;
    await this.save();

    this.canvas.project.phase = "critic";
    const criticReport = await runCritic(this.canvas);
    this.canvas.critic.reports.push(criticReport);
    this.canvas.critic.last_updated = criticReport.timestamp;
    this.recordDecision("Completed full swarm pass", "Research, ICP, build, GTM, and critic phases finished.");
    await this.save();

    const response = [
      buildOrchestratorPrompt(this.canvas),
      "",
      `Scout: ${formatSummary(this.canvas.research.reports.scout)}`,
      `Analyst: ${formatSummary(this.canvas.research.reports.analyst)}`,
      `Sizer: ${formatSummary(this.canvas.research.reports.sizer)}`,
      `ICP: ${formatSummary(this.canvas.icp.report)}`,
      `Architect: ${formatSummary(this.canvas.build.architect)}`,
      `Technical Cofounder: ${formatSummary(this.canvas.build.technical_cofounder)}`,
      `GTM: ${formatSummary(this.canvas.gtm.report)}`,
      `Critic: ${formatSummary(this.latestCriticReport())}`
    ];

    if (this.canvas.research.failures.length > 0) {
      response.push(
        "",
        `Research failures: ${this.canvas.research.failures.map((failure) => failure.reason).join(" | ")}`
      );
    }

    const rendered = response.join("\n");
    this.appendConversationSummary(
      [
        `Latest synthesis for "${getIdeaSummary(this.canvas)}":`,
        `Scout=${formatSummary(this.canvas.research.reports.scout)}`,
        `Analyst=${formatSummary(this.canvas.research.reports.analyst)}`,
        `Sizer=${formatSummary(this.canvas.research.reports.sizer)}`,
        `ICP=${formatSummary(this.canvas.icp.report)}`,
        `Architect=${formatSummary(this.canvas.build.architect)}`,
        `Technical Cofounder=${formatSummary(this.canvas.build.technical_cofounder)}`,
        `GTM=${formatSummary(this.canvas.gtm.report)}`,
        `Critic=${formatSummary(this.latestCriticReport())}`
      ].join(" ")
    );
    await this.save();
    return rendered;
  }

  private async runResearchPhase(): Promise<void> {
    this.canvas.project.phase = "research";
    const settlements = await Promise.allSettled(
      RESEARCH_TASKS.map((task) => task.runner(this.canvas))
    );
    const completedAt = nowIso();

    this.canvas.research = createEmptyResearchState();

    settlements.forEach((result, index) => {
      const task = RESEARCH_TASKS[index];

      if (result.status === "fulfilled") {
        this.canvas.research.reports[task.key] = result.value;
        return;
      }

      this.canvas.research.failures.push({
        phase: "research",
        reason: `${task.agentName} failed: ${formatReason(result.reason)}`,
        timestamp: completedAt
      });
    });

    this.canvas.research.last_updated = completedAt;

    if (this.canvas.research.failures.length > 0) {
      this.recordDecision(
        "Completed research with partial failures",
        this.canvas.research.failures.map((failure) => failure.reason).join(" | ")
      );
    } else {
      this.recordDecision("Completed research phase", "All three research agents returned reports.");
    }

    await this.save();
  }

  private latestCriticReport(): StoredAgentReport | undefined {
    const reports = this.canvas.critic.reports;
    return reports.length > 0 ? reports[reports.length - 1] : undefined;
  }

  private clearDerivedState(): void {
    this.canvas.project.phase = "warmup";
    this.canvas.research = createEmptyResearchState();
    this.canvas.icp = {};
    this.canvas.build = {};
    this.canvas.gtm = {};
    this.canvas.critic = { reports: [] };
    this.canvas.risks = {};
    this.canvas.scorecard = undefined;
    this.canvas.exports = undefined;
  }

  private recordDecision(decision: string, rationale?: string): void {
    this.canvas.decisions.push({
      date: nowIso(),
      decision,
      rationale
    });
  }

  private appendConversationSummary(entry: string): void {
    const lines = [this.canvas.conversation_summary, entry].filter(Boolean);
    this.canvas.conversation_summary = lines.slice(-6).join("\n");
  }
}

function formatSummary(report?: StoredAgentReport): string {
  return report?.summary ?? "Not run yet.";
}

function latestReportTimestamp(...reports: Array<StoredAgentReport | undefined>): string | undefined {
  const timestamps = reports
    .map((report) => report?.timestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort();

  return timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined;
}

function formatReason(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
