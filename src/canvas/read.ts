import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  createCanvas,
  normalizeCanvas,
  nowIso,
  slugifyProjectName,
  type Canvas
} from "./schema.js";

function canvasDir(): string {
  return path.resolve(process.cwd(), "canvas");
}

export function canvasPath(projectRef: string): string {
  return path.join(canvasDir(), `${slugifyProjectName(projectRef)}.json`);
}

export async function ensureCanvasDir(): Promise<string> {
  const dir = canvasDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function listCanvasProjects(): Promise<string[]> {
  const dir = await ensureCanvasDir();
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -".json".length))
    .sort((left, right) => left.localeCompare(right));
}

export interface CanvasLoadResult {
  canvas: Canvas;
  created: boolean;
  filePath: string;
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function finalizeLoadedCanvas(canvas: Canvas, projectSlug: string): Canvas {
  if (!canvas?.project) {
    throw new Error(`Canvas normalization failed for project "${projectSlug}".`);
  }

  canvas.project.slug = projectSlug;
  canvas.project.id = canvas.project.id || projectSlug;
  canvas.last_opened_at = nowIso();

  return canvas;
}

async function loadCanvasFromDisk(
  projectRef: string,
  options: { createIfMissing: boolean }
): Promise<CanvasLoadResult> {
  const requestedName = projectRef.trim() || "default";
  const projectSlug = slugifyProjectName(requestedName);
  const filePath = canvasPath(projectSlug);

  await ensureCanvasDir();

  try {
    const raw = await readFile(filePath, "utf8");
    const canvas = finalizeLoadedCanvas(
      normalizeCanvas(JSON.parse(raw), requestedName),
      projectSlug
    );

    return {
      canvas,
      created: false,
      filePath
    };
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new Error(`Canvas file is not valid JSON: ${filePath}`);
    }

    if (!isErrorWithCode(error, "ENOENT")) {
      throw error;
    }

    if (!options.createIfMissing) {
      throw new Error(`Canvas not found: ${filePath}`);
    }

    return {
      canvas: createCanvas(requestedName, projectSlug),
      created: true,
      filePath
    };
  }
}

export async function loadExistingCanvas(projectRef: string): Promise<CanvasLoadResult> {
  return loadCanvasFromDisk(projectRef, { createIfMissing: false });
}

export async function loadOrCreateCanvas(projectRef: string): Promise<CanvasLoadResult> {
  return loadCanvasFromDisk(projectRef, { createIfMissing: true });
}

export async function loadCanvas(projectRef: string): Promise<Canvas> {
  const result = await loadExistingCanvas(projectRef);
  return result.canvas;
}
