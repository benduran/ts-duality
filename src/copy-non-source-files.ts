import path from "node:path";

import glob from "fast-glob";
import fs from "fs-extra";

import { getCommonRootPath } from "./get-common-root-path.js";
import { Logger } from "./logger.js";

const SOURCE_FILES_ONLY = /\.(cjs|mts|js|jsx|ts|tsx)$/;

export async function copyNonSourceFiles(
  cwd: string,
  detectedInputTypescriptFiles: string[],
  outDir: string,
) {
  Logger.info("copying non-source files");

  const inputDirs = [
    ...new Set(
      detectedInputTypescriptFiles.map((relFp) =>
        path.dirname(path.join(cwd, relFp)),
      ),
    ),
  ];

  const globs = inputDirs.map((absDir) => path.join(absDir, "**", "*"));

  const allFiles = await Promise.all(
    globs.map((g) => glob(g, { absolute: true, onlyFiles: true })),
  );

  const nonSrcFiles = allFiles
    .flat()
    .filter(
      (fp) => !fp.includes("node_modules") && !SOURCE_FILES_ONLY.test(fp),
    );

  const rootDir = getCommonRootPath(
    detectedInputTypescriptFiles.map((p) => path.join(cwd, p)),
  );

  await Promise.all(
    nonSrcFiles.map(
      (fp) =>
        new Promise<void>((resolve, reject) => {
          // Compute relative path *from rootDir if possible*
          let relPath = path.relative(rootDir, fp);

          // If rootDir isn’t actually part of the path (edge case), fall back to cwd
          if (relPath.startsWith("..")) {
            relPath = path.relative(cwd, fp);
          }

          const outPath = path.join(outDir, relPath);

          fs.ensureFile(outPath)
            .then(() => fs.copyFile(fp, outPath))
            .then(resolve)
            .catch(reject);
        }),
    ),
  );

  Logger.info(`Copied ${nonSrcFiles.length.toString()} non-source files.`);
}
