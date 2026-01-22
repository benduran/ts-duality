/* eslint-disable n/no-process-env */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable turbo/no-undeclared-env-vars */
/* eslint-disable @typescript-eslint/no-namespace */
import { detect } from 'package-manager-detector';

import type { ExecAsyncOpts } from './exec-async.js';
import { execAsync } from './exec-async.js';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DUALITY_VERBOSE: string;
    }
  }
}

/**
 * given a command, runs it via "pnpm," "npm" etc, depending
 * on the package manager the user has installed in their repo
 */
export async function runWithPm(cmd: string, execOpts: ExecAsyncOpts) {
  const pmInfo = await detect({ cwd: execOpts.cwd });
  if (!pmInfo) {
    throw new Error(`unable to detect package manager in ${execOpts.cwd}`);
  }

  const { name } = pmInfo;

  return execAsync(`${name === 'npm' ? 'npx' : name} ${cmd}`, {
    ...execOpts,
    verbose:
      (process.env.DUALITY_VERBOSE === 'true' || execOpts.verbose) ?? false,
  });
}
