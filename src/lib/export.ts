import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getIdeaSummary, type Canvas, type StoredAgentReport } from "../canvas/schema.js";
import { runExportAgent } from "../agents/export-agent.js";

function renderReport(title: string, report?: StoredAgentReport): string {
  if (!report) {
    return `## ${title}\n\n[Data gap — not covered in research]\n`;
  }

  return [
    `## ${title}`,
    "",
    `Summary: ${report.summary}`,
    `Verification: ${report.verification.status}`,
    `Source count: ${report.verification.source_count}`,
    "",
    report.raw_markdown,
    ""
  ].join("\n");
}

function renderCriticReports(canvas: Canvas): string {
  if (canvas.critic.reports.length === 0) {
    return "## Critic\n\n[Data gap — not covered in research]\n";
  }

  return [
    "## Critic",
    "",
    ...canvas.critic.reports.flatMap((report, index) => [
      `### Critic Pass ${index + 1}`,
      "",
      `Summary: ${report.summary}`,
      `Verification: ${report.verification.status}`,
      "",
      report.raw_markdown,
      ""
    ])
  ].join("\n");
}

export async function assembleBrief(canvas: Canvas): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "output");
  const filePath = path.join(outputDir, `${canvas.project.slug}.md`);
  const markdown = [
    `# ${canvas.project.name}`,
    "",
    `Project slug: ${canvas.project.slug}`,
    `Phase: ${canvas.project.phase}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Idea",
    "",
    getIdeaSummary(canvas),
    "",
    ...(canvas.idea.founder_context ? [`Founder context: ${canvas.idea.founder_context}`, ""] : []),
    renderReport("Market Scout", canvas.research.reports.scout),
    renderReport("Competitor Analyst", canvas.research.reports.analyst),
    renderReport("Market Sizer", canvas.research.reports.sizer),
    renderReport("ICP Whisperer", canvas.icp.report),
    renderReport("Architect", canvas.build.architect),
    renderReport("Technical Cofounder", canvas.build.technical_cofounder),
    renderReport("GTM Specialist", canvas.gtm.report),
    renderCriticReports(canvas)
  ].join("\n");

  await mkdir(outputDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");
  return filePath;
}

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function exportBrief(canvas: Canvas, slug: string): Promise<string> {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}-brief-${date}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  const result = await runExportAgent(canvas);
  writeFileSync(filePath, result.markdown, 'utf-8');

  canvas.exports = {
    last_path: filePath,
    exported_at: new Date().toISOString(),
  };

  return filePath;
}
