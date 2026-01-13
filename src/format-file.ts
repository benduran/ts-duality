import path from 'node:path';

import { Logger } from './logger.js';
import { runWithPm } from './run-with-pm.js';

async function formatWithBiome(cwd: string, relPathToFormat: string) {
  // this will fail if biome is not installed, and that's fine
  try {
    await runWithPm(`biome check --write '${relPathToFormat}'`, {
      cwd,
      stdio: 'pipe',
    });
    Logger.info(`formatted ${relPathToFormat} with biome`);
    return true;
  } catch {
    /* no-op */
  }
  return false;
}

async function formatWithPrettier(cwd: string, relPathToFormat: string) {
  try {
    // this will fail if prettier is not installed, and that's fine
    await runWithPm(`prettier --write '${relPathToFormat}'`, {
      cwd,
      stdio: 'pipe',
    });
    Logger.info(`formatted ${relPathToFormat} with prettier`);
    return true;
  } catch {
    /* no-op */
  }

  return false;
}

/**
 * if the user has prettier or biome installed in their repo,
 * try to format with either and leverage their settings
 */
export async function formatFile(cwd: string, fileToFormat: string) {
  const relPathToFormat = path.relative(cwd, fileToFormat);

  const didFormat = await formatWithBiome(cwd, relPathToFormat);

  if (didFormat) return;

  await formatWithPrettier(cwd, relPathToFormat);
}
