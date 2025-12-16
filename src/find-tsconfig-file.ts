import path from 'node:path';

import { checkFileExists } from './check-file-exists.js';
import type { WhichTsconfigToGenerate } from './generate-tsconfigs.js';
import { generateTsconfigs } from './generate-tsconfigs.js';
import type { Nullish } from './types.js';

/**
 * returns the path of the found tsconfig file
 * or uses the provided override, instead,
 * if it's available.
 *
 * if no TSConfig is available, one will be generated
 * automatically for the user
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

  // always prefer tsconfig.build.json if a user didn't provide an override,
  // and generate one if it isn't available.
  const baseTsconfigPath = path.join(cwd, 'tsconfig.json');
  const buildTsconfigPath = path.join(cwd, 'tsconfig.build.json');

  const [baseExists, buildExists] = await Promise.all([
    checkFileExists(cwd, baseTsconfigPath),
    checkFileExists(cwd, buildTsconfigPath),
  ]);

  const whichConfigToGenerate = (): WhichTsconfigToGenerate => {
    if (!baseExists && !buildExists) return 'all';
    if (!baseExists) return 'base';
    return 'build';
  };

  if (!baseExists || !buildExists) {
    await generateTsconfigs(cwd, whichConfigToGenerate());
  }

  return buildTsconfigPath;
}
