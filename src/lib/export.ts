import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";

function section(title: string, note: ResearchNote): string {
  const bullets = note.bullets.map((bullet) => `- ${bullet}`).join("\n");
  return `## ${title}\n\n${note.summary}\n\n${bullets}`;
}

export async function assembleBrief(canvas: ProjectCanvas): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "output");
  const filePath = path.join(outputDir, `${canvas.projectSlug}.md`);
  const markdown = [
    `# ${canvas.projectSlug}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `## Idea`,
    "",
    canvas.idea || "No idea captured.",
    "",
    section("Market Scout", canvas.research.scout),
    "",
    section("Competitor Analyst", canvas.research.analyst),
    "",
    section("Market Sizer", canvas.research.sizer),
    "",
    section("ICP Whisperer", canvas.icp),
    "",
    section("Architect", canvas.architecture),
    "",
    section("Technical Cofounder", canvas.buildPlan),
    "",
    section("GTM Specialist", canvas.gtm),
    "",
    section("Critic", canvas.critique),
    ""
  ].join("\n");

  await mkdir(outputDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");
  return filePath;
}
