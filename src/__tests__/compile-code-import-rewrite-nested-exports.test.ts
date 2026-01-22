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

describe('compileCode import rewrites - nested exports', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-nested-exports',
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

  test('rewrites nested and export-from imports for ESM output', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writeBasePackageFiles(tempDir),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          "import { util } from './utils/util';",
          "export { Component } from './components/Component';",
          "export * from './components/Component.styles';",
          'async function loadLazy() {',
          "  return import('./lazy/Lazy');",
          '}',
          'void loadLazy();',
          'console.log(util);',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'utils', 'util.ts'),
        ["export const util = 'util';", ''].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'components', 'Component.ts'),
        ["export const Component = 'component';", ''].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'components', 'Component.styles.ts'),
        ['export const componentStyles = { color: "blue" };', ''].join(
          os.EOL,
        ),
      ),
      ensureWriteFile(
        path.join(srcDir, 'lazy', 'Lazy.ts'),
        ['export const Lazy = 123;', ''].join(os.EOL),
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

    expect(builtIndex).toMatch(/['"]\.\/utils\/util\.mjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/components\/Component\.mjs['"]/);
    expect(builtIndex).toMatch(
      /['"]\.\/components\/Component\.styles\.mjs['"]/,
    );
    expect(builtIndex).toMatch(/['"]\.\/lazy\/Lazy\.mjs['"]/);
  });
});
