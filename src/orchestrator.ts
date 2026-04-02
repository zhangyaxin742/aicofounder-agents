import { runAnalyst } from "./agents/analyst.js";
import { runArchitect } from "./agents/architect.js";
import { runCritic } from "./agents/critic.js";
import { runGtm } from "./agents/gtm.js";
import { runIcp } from "./agents/icp.js";
import { runScout } from "./agents/scout.js";
import { runSizer } from "./agents/sizer.js";
import { runTechnicalCofounder } from "./agents/technical-cofounder.js";
import { createEmptyResearch, createProjectCanvas, type ProjectCanvas } from "./canvas/schema.js";
import { loadOrCreateCanvas, type CanvasLoadResult } from "./canvas/read.js";
import { writeCanvas } from "./canvas/write.js";
import { assembleBrief } from "./lib/export.js";
import { fanOut } from "./lib/fan-out.js";
import { buildOrchestratorPrompt } from "./prompts/orchestrator.js";

export class Orchestrator {
  private canvas: ProjectCanvas = createProjectCanvas("default", "default");

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
      this.canvas.research = createEmptyResearch();
      await this.commit();
      return "Research summaries cleared.";
    }

    if (input === "/export") {
      this.canvas.phase = "exported";
      const filePath = await assembleBrief(this.canvas);
      await this.commit();
      return `Brief exported to ${filePath}`;
    }

    this.canvas.idea = input;
    this.canvas.phase = "research";
    this.canvas.conversation.push({
      role: "user",
      message: input,
      at: new Date().toISOString()
    });
    await this.commit();

    const research = await fanOut({
      scout: () => runScout(this.canvas),
      analyst: () => runAnalyst(this.canvas),
      sizer: () => runSizer(this.canvas)
    }, (key, reason) => ({
      agent: key,
      summary: `${key} failed during this run.`,
      bullets: [reason instanceof Error ? reason.message : String(reason)],
      updatedAt: new Date().toISOString()
    }));

    this.canvas.research.scout = research.scout;
    this.canvas.research.analyst = research.analyst;
    this.canvas.research.sizer = research.sizer;
    await this.commit();

    this.canvas.phase = "icp";
    this.canvas.icp = await runIcp(this.canvas);
    await this.commit();

    this.canvas.phase = "build";
    this.canvas.architecture = await runArchitect(this.canvas);
    await this.commit();

    this.canvas.buildPlan = await runTechnicalCofounder(this.canvas);
    await this.commit();

    this.canvas.phase = "gtm";
    this.canvas.gtm = await runGtm(this.canvas);
    await this.commit();

    this.canvas.phase = "critic";
    this.canvas.critique = await runCritic(this.canvas);
    await this.commit();

    const response = [
      buildOrchestratorPrompt(this.canvas),
      "",
      `Scout: ${this.canvas.research.scout.summary}`,
      `Analyst: ${this.canvas.research.analyst.summary}`,
      `Sizer: ${this.canvas.research.sizer.summary}`,
      `ICP: ${this.canvas.icp.summary}`,
      `Architect: ${this.canvas.architecture.summary}`,
      `Technical Cofounder: ${this.canvas.buildPlan.summary}`,
      `GTM: ${this.canvas.gtm.summary}`,
      `Critic: ${this.canvas.critique.summary}`
    ].join("\n");

    this.canvas.conversation.push({
      role: "assistant",
      message: response,
      at: new Date().toISOString()
    });

    await this.commit();
    return response;
  }

  getProjectSummary(): Pick<ProjectCanvas, "projectName" | "projectSlug" | "phase"> {
    return {
      projectName: this.canvas.projectName,
      projectSlug: this.canvas.projectSlug,
      phase: this.canvas.phase
    };
  }

  private async commit(): Promise<void> {
    this.canvas.updatedAt = new Date().toISOString();
    await this.save();
  }
}
