import "dotenv/config";
import chalk from "chalk";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Orchestrator } from "./orchestrator.js";

async function main(): Promise<void> {
  const rl = createInterface({ input, output });
  const projectRef = (process.env.PROJECT_SLUG ?? "").trim()
    || (await rl.question(chalk.cyan("Project name or slug: "))).trim()
    || "default";
  const orchestrator = new Orchestrator(projectRef);
  const session = await orchestrator.init();
  const summary = orchestrator.getProjectSummary();

  console.log(chalk.cyan(`cofounder-swarm ready for project "${summary.projectName}"`));
  console.log(chalk.dim(`Slug: ${summary.projectSlug} | phase: ${summary.phase}`));
  console.log(chalk.dim(session.created ? "Created new canvas." : "Resumed existing canvas."));
  console.log(chalk.dim("Type your idea, or use /canvas, /export, /rerun, /quit"));

  while (true) {
    const line = (await rl.question(chalk.green("> "))).trim();

    if (!line) {
      continue;
    }

    if (line === "/quit" || line === "/exit") {
      await orchestrator.save();
      break;
    }

    const response = await orchestrator.handleInput(line);
    console.log(response);
  }

  rl.close();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(message));
  process.exitCode = 1;
});
