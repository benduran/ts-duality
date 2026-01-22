import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { buildTsPackage } from '../ts-duality-lib.js';
import { DUMMY_TSCONFIG } from './dummyTsconfig.js';

async function ensureWriteFile(filepath: string, contents: string) {
  await fs.ensureFile(filepath);
  await fs.writeFile(filepath, contents, 'utf-8');
}

async function writeBasePackageFiles(tempDir: string) {
  await Promise.all([
    ensureWriteFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(
        {
          devDependencies: {
            typescript: 'latest',
          },
          name: 'my-package',
          version: '0.0.0',
        },
        null,
        2,
      ),
    ),
    ensureWriteFile(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(DUMMY_TSCONFIG, null, 2),
    ),
  ]);
}

describe('compileCode import rewrites - type-only', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-type-only',
  );
  let ogCwd = ';';

  beforeAll(() => {
    ogCwd = process.cwd();
  });
  beforeEach(async () => {
    await fs.remove(tempDir);
  });
  afterAll(() => {
    process.chdir(ogCwd);
  });

  test('removes type-only imports and exports for ESM output', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writeBasePackageFiles(tempDir),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          "import type { Config } from './types';",
          "export type { Config } from './types';",
          "import { runtime } from './runtime';",
          'export { runtime };',
          'export type AnotherConfig = Config & { pizza: boolean; };',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'types.ts'),
        ['export interface Config {', '  enabled: boolean;', '}', ''].join(
          os.EOL,
        ),
      ),
      ensureWriteFile(
        path.join(srcDir, 'runtime.ts'),
        ["export const runtime = 'ok';", ''].join(os.EOL),
      ),
    ]);
    execSync('npm i', { cwd: tempDir, stdio: 'inherit' });

    const tsconfig = path.join(tempDir, 'tsconfig.json');

    expect(
      fs.statSync(tsconfig, { throwIfNoEntry: false })?.isFile(),
    ).toBeTruthy();

    process.chdir(tempDir);

    const builtFiles = await buildTsPackage({
      clean: true,
      copyOtherFiles: false,
      cwd: tempDir,
      jsx: 'automatic',
      noCjs: true,
      noDts: false,
      noEsm: false,
      noGenerateExports: false,
      noStripLeading: false,
      tsconfig,
      outDir,
      watch: false,
    });

    const builtIndex = await fs.readFile(
      builtFiles.find((fp) => fp.endsWith('index.mjs')) ?? '',
      'utf-8',
    );

    expect(builtIndex).toMatch(/['"]\.\/runtime\.mjs['"]/);
    expect(builtIndex).not.toMatch(/['"]\.\/types\.mjs['"]/);
  });
});
