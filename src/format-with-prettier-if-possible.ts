import { runWithPm } from "./run-with-pm.js";

/**
 * if the user has prettier installed in their repo,
 * try to format with prettier and leverage their settings
 */
export async function formatWithPrettierIfPossible(cwd: string) {
  try {
    // this will fail if prettier is not installed, and that's fine
    await runWithPm("prettier --write .", { cwd, stdio: "pipe" });
  } catch {
    /* no-op */
  }
}
