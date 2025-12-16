import path from 'node:path';

import { Logger } from './logger.js';
import { runWithPm } from './run-with-pm.js';

/**
 * if the user has prettier installed in their repo,
 * try to format with prettier and leverage their settings
 */
export async function formatWithPrettierIfPossible(
  cwd: string,
  fileToFormat: string,
) {
  const relPathToFormat = path.relative(cwd, fileToFormat);
  try {
    // this will fail if prettier is not installed, and that's fine
    await runWithPm(`prettier --write '${relPathToFormat}'`, {
      cwd,
      stdio: 'pipe',
    });
    Logger.info(`formatted ${relPathToFormat} with prettier`);
  } catch {
    /* no-op */
  }
}
