import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  createProjectCanvas,
  normalizeCanvas,
  slugifyProjectName,
  type ProjectCanvas
} from "./schema.js";

function canvasDir(): string {
  return path.resolve(process.cwd(), "canvas");
}

export function canvasPath(projectSlug: string): string {
  return path.join(canvasDir(), `${slugifyProjectName(projectSlug)}.json`);
}

export interface CanvasLoadResult {
  canvas: ProjectCanvas;
  created: boolean;
  filePath: string;
}

export async function loadOrCreateCanvas(projectRef: string): Promise<CanvasLoadResult> {
  const requestedName = projectRef.trim() || "default";
  const projectSlug = slugifyProjectName(requestedName);
  const filePath = canvasPath(projectSlug);

  await mkdir(canvasDir(), { recursive: true });

  try {
    const raw = await readFile(filePath, "utf8");
    const canvas = normalizeCanvas(JSON.parse(raw), requestedName);
    canvas.projectSlug = projectSlug;
    canvas.lastOpenedAt = new Date().toISOString();

    return {
      canvas,
      created: false,
      filePath
    };
  } catch (error: unknown) {
    const isMissingFile =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT";

    if (!isMissingFile && !(error instanceof SyntaxError)) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Canvas file is not valid JSON: ${filePath}`);
    }

    return {
      canvas: createProjectCanvas(requestedName, projectSlug),
      created: true,
      filePath
    };
  }
}

export async function loadCanvas(projectSlug: string): Promise<ProjectCanvas> {
  const result = await loadOrCreateCanvas(projectSlug);
  return result.canvas;
}
