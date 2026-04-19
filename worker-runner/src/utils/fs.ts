import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function removeDir(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}

export function childPath(root: string, child: string) {
  return path.join(root, child.replace(/[^a-zA-Z0-9_.-]/g, "_"));
}
