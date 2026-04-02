import { runAnalyst } from "./agents/analyst.js";
import { runArchitect } from "./agents/architect.js";
import { runCritic } from "./agents/critic.js";
import { runGtm } from "./agents/gtm.js";
import { runIcp } from "./agents/icp.js";
import { runScout } from "./agents/scout.js";
import { runSizer } from "./agents/sizer.js";
import { runTechnicalCofounder } from "./agents/technical-cofounder.js";
import { createEmptyCanvas, type ProjectCanvas } from "./canvas/schema.js";
import { loadCanvas } from "./canvas/read.js";
import { writeCanvas } from "./canvas/write.js";
import { assembleBrief } from "./lib/export.js";
import { fanOut } from "./lib/fan-out.js";
import { buildOrchestratorPrompt } from "./prompts/orchestrator.js";

export class Orchestrator {
  private canvas: ProjectCanvas = createEmptyCanvas("default");

  constructor(private readonly projectSlug: string) {}

  async init(): Promise<void> {
    this.canvas = await loadCanvas(this.projectSlug);
  }

  async save(): Promise<void> {
    await writeCanvas(this.canvas);
  }

  async handleInput(input: string): Promise<string> {
    if (input === "/canvas") {
      return JSON.stringify(this.canvas, null, 2);
    }

    if (input === "/rerun") {
      this.canvas.research = createEmptyCanvas(this.projectSlug).research;
      this.touch();
      await this.save();
      return "Research summaries cleared.";
    }

    if (input === "/export") {
      const path = await assembleBrief(this.canvas);
      return `Brief exported to ${path}`;
    }

    this.canvas.idea = input;
    this.canvas.conversation.push({
      role: "user",
      message: input,
      at: new Date().toISOString()
    });

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

    this.canvas.icp = await runIcp(this.canvas);
    this.canvas.architecture = await runArchitect(this.canvas);
    this.canvas.buildPlan = await runTechnicalCofounder(this.canvas);
    this.canvas.gtm = await runGtm(this.canvas);
    this.canvas.critique = await runCritic(this.canvas);
    this.touch();

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

    await this.save();
    return response;
  }

  private touch(): void {
    this.canvas.updatedAt = new Date().toISOString();
  }
}
