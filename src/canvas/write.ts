import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { canvasPath } from "./read.js";
import { slugifyProjectName, type Canvas } from "./schema.js";

function serializeCanvas(canvas: Canvas): string {
  return `${JSON.stringify(canvas, null, 2)}\n`;
}

export async function saveCanvas(projectRef: string, canvas: Canvas): Promise<string> {
  const normalizedProjectRef = projectRef.trim() || canvas.project.slug || canvas.project.name;
  const slug = slugifyProjectName(normalizedProjectRef);
  const filePath = canvasPath(slug);
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `${slug}.${process.pid ?? "pid"}.${Date.now()}.tmp`);

  canvas.project.slug = slug;

  await mkdir(dir, { recursive: true });

  try {
    await writeFile(tempPath, serializeCanvas(canvas), "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }

  return filePath;
}

export async function writeCanvas(canvas: Canvas): Promise<string> {
  return saveCanvas(canvas.project.slug, canvas);
}
