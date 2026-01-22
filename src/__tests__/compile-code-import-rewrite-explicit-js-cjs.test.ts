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

async function writePackageJson(tempDir: string) {
  await ensureWriteFile(
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
  );
}

async function writeTsconfig(tempDir: string, tsconfig: typeof DUMMY_TSCONFIG) {
  await ensureWriteFile(
    path.join(tempDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
  );
}

const DUMMY_TSCONFIG_WITH_JS = {
  ...DUMMY_TSCONFIG,
  compilerOptions: {
    ...DUMMY_TSCONFIG.compilerOptions,
    allowJs: true,
  },
  include: ['./**/*.ts', './**/*.tsx', './**/*.js'],
};

describe('compileCode import rewrites - explicit .js CJS', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-explicit-js-cjs',
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

  test('rewrites explicit .js specifiers to .cjs for CJS output', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writePackageJson(tempDir),
      writeTsconfig(tempDir, DUMMY_TSCONFIG_WITH_JS),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          "const value = require('./runtime.js');",
          "const helper = require('./helpers');",
          'module.exports = { value, helper };',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'runtime.js'),
        ['module.exports = "v";', ''].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'helpers.ts'),
        ["module.exports = 'h';", ''].join(os.EOL),
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

    expect(builtIndex).toMatch(/['"]\.\/runtime\.cjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/helpers\.cjs['"]/);
  });
});
