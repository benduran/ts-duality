import path from "node:path";

import fs from "fs-extra";

import { Logger } from "./logger.js";
import { safeReadFile } from "./safe-read-file.js";

export type WhichTsconfigToGenerate = "all" | "base" | "build";

/**
 * will generate a tsconfig.json tsconfig.build.json files
 * in the CWD, which will be used for your typescript configuration
 */
export async function generateTsconfigs(
  cwd: string,
  which: WhichTsconfigToGenerate,
) {
  const baseTsconfigPath = path.join(
    import.meta.dirname,
    "tsconfigs",
    "base.tsconfig.json",
  );
  const buildTsconfigPath = path.join(
    import.meta.dirname,
    "tsconfigs",
    "build.tsconfig.json",
  );

  const [base, build] = await Promise.all([
    safeReadFile(cwd, baseTsconfigPath),
    safeReadFile(cwd, buildTsconfigPath),
  ]);

  Logger.info(
    "creating",
    which === "all"
      ? "both tsconfig.json and tsconfig.build.json"
      : which === "base"
        ? "tsconfig.json"
        : "tsconfig.build.json",
  );

  await Promise.all([
    which === "all" || which === "base"
      ? fs.writeFile(path.join(cwd, "tsconfig.json"), base, "utf8")
      : Promise.resolve(),
    which === "all" || which === "build"
      ? fs.writeFile(path.join(cwd, "tsconfig.build.json"), build, "utf8")
      : Promise.resolve(),
  ]);
}
