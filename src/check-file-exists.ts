import path from 'node:path';

import fs from 'fs-extra';

/**
 * as the name suggests, this checks whether a file path exists
 * as a file
 */
export async function checkFileExists(
  cwd: string,
  fp: string,
): Promise<boolean> {
  const absFp = path.isAbsolute(fp) ? fp : path.join(cwd, fp);
  try {
    const stat = await fs.stat(absFp);
    if (!stat.isFile()) {
      throw new Error(`${absFp} is not a file`);
    }
    return true;
  } catch {
    return false;
  }
}
