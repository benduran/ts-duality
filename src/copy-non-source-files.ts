import path from "node:path";

import fs from "fs-extra";

import { getCommonRootPath } from "./get-common-root-path.js";
import { glob } from "./glob-get.js";
import { Logger } from "./logger.js";

const SOURCE_FILES_ONLY = /\.(cjs|mts|js|jsx|ts|tsx)$/;

export async function copyNonSourceFiles(
  cwd: string,
  detectedInputTypescriptFiles: string[],
  outDir: string,
) {
  const rootDir = getCommonRootPath(
    detectedInputTypescriptFiles.map((p) => path.join(cwd, p)),
  );
  Logger.info("copying all non-source files found in", rootDir);

  const globs = [path.join(rootDir, "**", "*")];

  const allFiles = await Promise.all(globs.map((g) => glob(g)));

  const nonSrcFiles = allFiles
    .flat()
    .filter(
      (fp) => !fp.includes("node_modules") && !SOURCE_FILES_ONLY.test(fp),
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
