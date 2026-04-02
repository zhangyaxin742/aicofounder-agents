import { readFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyCanvas, type ProjectCanvas } from "./schema.js";

function canvasPath(projectSlug: string): string {
  return path.resolve(process.cwd(), "canvas", `${projectSlug}.json`);
}

export async function loadCanvas(projectSlug: string): Promise<ProjectCanvas> {
  try {
    const raw = await readFile(canvasPath(projectSlug), "utf8");
    return JSON.parse(raw) as ProjectCanvas;
  } catch {
    return createEmptyCanvas(projectSlug);
  }
}
