import { execa } from 'execa';

import { Logger } from './logger.js';

export type ExecAsyncOpts = {
  cwd: string;
  stdio: 'inherit' | 'ignore' | 'pipe';
  verbose?: boolean; // defaults to false if not provided
};

/**
 * Executes a command asynchronously via spawn.
 */
export async function execAsync(
  command: string,
  { verbose = false, ...opts }: ExecAsyncOpts,
): Promise<string> {
  if (verbose) Logger.info('Executing', command, 'in', opts.cwd);

  if (!command) throw new Error('unable to spawn because no command was given');

  const child = await execa({ ...opts, shell: true })`${command}`;

  return child.stdout ?? '';
}
