import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectCanvas } from "./schema.js";

export async function writeCanvas(canvas: ProjectCanvas): Promise<string> {
  const dir = path.resolve(process.cwd(), "canvas");
  const filePath = path.join(dir, `${canvas.projectSlug}.json`);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(canvas, null, 2)}\n`, "utf8");
  return filePath;
}
