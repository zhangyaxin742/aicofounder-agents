import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectCanvas } from "./schema.js";

export async function writeCanvas(canvas: ProjectCanvas): Promise<string> {
  const dir = path.resolve(process.cwd(), "canvas");
  const filePath = path.join(dir, `${canvas.projectSlug}.json`);
  const tempPath = path.join(
    dir,
    `${canvas.projectSlug}.${process.pid ?? "pid"}.${Date.now()}.tmp`
  );

  await mkdir(dir, { recursive: true });

  try {
    await writeFile(tempPath, `${JSON.stringify(canvas, null, 2)}\n`, "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }

  return filePath;
}
