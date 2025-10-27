import path from "node:path";

import fs from "fs-extra";

/**
 * will generate a tsconfig.json tsconfig.build.json files
 * in the CWD, which will be used for your typescript configuration
 */
export async function generateTsconfigs(cwd: string) {
  const baseTsconfigPath = path.join(import.meta.dirname, "base.tsconfig.json");
  const buildTsconfigPath = path.join(
    import.meta.dirname,
    "build.tsconfig.json",
  );

  const [base, build] = await Promise.all([
    fs.readFile(baseTsconfigPath),
    fs.readFile(buildTsconfigPath),
  ]);

  await Promise.all([
    fs.writeFile(path.join(cwd, "tsconfigs", "tsconfig.json"), base),
    fs.writeFile(path.join(cwd, "tsconfigs", "tsconfig.build.json"), build),
  ]);
}
