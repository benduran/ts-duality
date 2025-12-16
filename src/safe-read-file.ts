import path from 'node:path';

import fs from 'fs-extra';

import { checkFileExists } from './check-file-exists.js';

export async function safeReadFile(cwd: string, fp: string) {
  const absFp = path.isAbsolute(fp) ? fp : path.join(cwd, fp);
  const exists = await checkFileExists(cwd, fp);

  if (exists) return fs.readFile(absFp, 'utf8');
  return '';
}
