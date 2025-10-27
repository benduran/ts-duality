import { spawn } from "node:child_process";

import { Logger } from "./logger.js";

export type ExecAsyncOpts = {
  cwd: string;
  stdio: "inherit" | "ignore" | "pipe";
  verbose?: boolean; // defaults to false if not provided
};

/**
 * Executes a command asynchronously via spawn.
 */
export function execAsync(
  command: string,
  { verbose = false, ...opts }: ExecAsyncOpts,
): Promise<string> {
  if (verbose) Logger.info("Executing", command, "in", opts.cwd);

  const [cmd, ...args] = command.split(/\s+/);

  if (!cmd) throw new Error("unable to spawn because no command was given");

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, opts);

    let errBuffer = Buffer.alloc(0);
    let stdoutBuffer = Buffer.alloc(0);

    let error: Error | undefined;
    child.on("error", (err) => {
      error = err;
    });
    child.stderr?.on("data", (data) => {
      errBuffer = Buffer.concat([errBuffer, data]);
    });

    child.stdout?.on("data", (data) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
    });

    child.once("exit", (code) => {
      if (code) {
        const errMsg = errBuffer.toString("utf8");
        Logger.error(errMsg);

        if (error) {
          reject(error);
          return;
        }
        reject(new Error(errMsg));
        return;
      }

      const output = stdoutBuffer.toString("utf8");
      resolve(output);
    });
  });
}
