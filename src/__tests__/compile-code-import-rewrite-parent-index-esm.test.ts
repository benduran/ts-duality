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

describe('compileCode import rewrites - parent/index ESM', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-parent-index-esm',
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

  test('rewrites parent and directory index imports for ESM output', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writeBasePackageFiles(tempDir),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          "export * from './features';",
          "export { sharedValue } from './shared';",
          "export { byIndex } from './shared/index';",
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'features', 'index.ts'),
        [
          "import { sharedValue } from '../shared';",
          "import { byIndex } from '../shared/index';",
          "export const feature = `${sharedValue}-${byIndex}`;",
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'shared', 'index.ts'),
        [
          "export const sharedValue = 'shared';",
          'export const byIndex = 7;',
          '',
        ].join(os.EOL),
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
    const builtFeatures = await fs.readFile(
      builtFiles.find((fp) => fp.endsWith(path.join('features', 'index.mjs'))) ??
        '',
      'utf-8',
    );

    expect(builtIndex).toMatch(/['"]\.\/features\/index\.mjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/shared\/index\.mjs['"]/);
    expect(builtFeatures).toMatch(/['"]\.\.\/shared\/index\.mjs['"]/);
  });
});
