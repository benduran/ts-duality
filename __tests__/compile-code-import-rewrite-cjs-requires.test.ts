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

describe('compileCode import rewrites - CJS requires', () => {
  const tempParent = path.join(import.meta.dirname, 'temp');
  const tempDir = path.join(
    tempParent,
    'compile-code-import-rewrites-cjs-requires',
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

  test('rewrites requires to .cjs for CJS output', async () => {
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'dist');

    await Promise.all([
      writeBasePackageFiles(tempDir),
      ensureWriteFile(
        path.join(srcDir, 'index.ts'),
        [
          "const Button = require('./Button');",
          "const styles = require('./Button.styles');",
          "const util = require('./utils/util');",
          'module.exports = { Button, styles, util };',
          '',
        ].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'Button.ts'),
        ['module.exports = function Button() { return "button"; };', ''].join(
          os.EOL,
        ),
      ),
      ensureWriteFile(
        path.join(srcDir, 'Button.styles.ts'),
        ['module.exports = { color: "red" };', ''].join(os.EOL),
      ),
      ensureWriteFile(
        path.join(srcDir, 'utils', 'util.ts'),
        ['module.exports = { util: true };', ''].join(os.EOL),
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

    expect(builtIndex).toMatch(/['"]\.\/Button\.cjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/Button\.styles\.cjs['"]/);
    expect(builtIndex).toMatch(/['"]\.\/utils\/util\.cjs['"]/);
  });
});
