import fs from "node:fs/promises";
import path from "node:path";

import type { Nullish } from "./types.js";

/**
 * returns the path of the found tsconfig file
 * or uses the provided override, instead,
 * if it's available
 */
export async function findTsconfigFile(
  cwd: string,
  tsconfigOverride: Nullish<string>,
) {
  if (tsconfigOverride) {
    const overridePath = path.isAbsolute(tsconfigOverride)
      ? tsconfigOverride
      : path.join(cwd, tsconfigOverride);
    return overridePath;
  }

  const locations = [
    path.join(cwd, "tsconfig.build.json"),
    path.join(cwd, "tsconfig.json"),
  ];

  for (const fp of locations) {
    try {
      const stat = await fs.stat(fp);
      if (stat.isFile()) return fp;
    } catch {
      /* no-top */
    }
  }
  return;
}
