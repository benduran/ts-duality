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
import { buildTsPackage } from '../src/ts-duality-lib.js';
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

describe('compileCode import rewrites - parent/index CJS', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-parent-index-cjs',
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

  test('rewrites CJS directory index and parent requires', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writeBasePackageFiles(tempDir),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          'export {};',
          "const feature = require('./features');",
          "const shared = require('./shared');",
          "const byIndex = require('./shared/index');",
          'module.exports = { feature, shared, byIndex };',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'features', 'index.ts'),
        [
          'export {};',
          "const shared = require('../shared');",
          "const byIndex = require('../shared/index');",
          'module.exports = { shared, byIndex };',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'shared', 'index.ts'),
        ['module.exports = { value: "shared", byIndex: 7 };', ''].join(os.EOL),
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
      noCjs: false,
      noDts: false,
      noEsm: true,
      noGenerateExports: false,
      noStripLeading: false,
      tsconfig,
      outDir,
      watch: false,
    });

    const builtIndex = await fs.readFile(
      builtFiles.find((fp) => fp.endsWith('index.cjs')) ?? '',
      'utf-8',
    );
    const builtFeatures = await fs.readFile(
      builtFiles.find((fp) =>
        fp.endsWith(path.join('features', 'index.cjs')),
      ) ?? '',
      'utf-8',
    );

    expect(builtIndex).toMatch(/['"]\.\/features\/index\.cjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/shared\/index\.cjs['"]/);
    expect(builtFeatures).toMatch(/['"]\.\.\/shared\/index\.cjs['"]/);
  });
});
