import { detect } from "package-manager-detector";
import { execAsync, type ExecAsyncOpts } from "./exec-async.js";

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

  return execAsync(`${name} ${cmd}`, execOpts);
}
