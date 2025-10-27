import path from "node:path";

import chalk from "chalk";
import fs from "fs-extra";
import type { PackageJson, TsConfigJson } from "type-fest";
import createCLI from "yargs";
import { hideBin } from "yargs/helpers";

import { compileCode } from "./compile-code.js";
import { ALLOWED_JSX_RUNTIMES } from "./constants.js";

import { findTsconfigFile } from "./find-tsconfig-file.js";
import { generateTsconfigs } from "./generate-tsconfigs.js";
import type { PackageJsonWithPossibleConfig } from "./inject-extra-exports.js";
import { injectExtraExports } from "./inject-extra-exports.js";
import { Logger } from "./logger.js";
import type {
  ExportsObject,
  JSXRuntime,
  ModuleType,
  SafePackageJsonExportObject,
} from "./types.js";
import { runWithPm } from "./run-with-pm.js";

export async function buildTsPackage(argv = process.argv) {
  const yargs = createCLI(hideBin(argv));
  const {
    clean,
    cwd: absOrRelativeCwd,
    generateTsconfig,
    jsx,
    noCjs,
    noDts,
    noEsm,
    noStripLeading,
    outDir,
    tsconfig: tsconfigOverride,
    watch,
  } = await yargs
    .scriptName("build-ts-package")
    .option("clean", {
      default: false,
      description:
        "if set, will clean out the build dirs before compiling anything",
      type: "boolean",
    })
    .option("cwd", {
      default: process.cwd(),
      description: "the CWD to use when building",
      type: "string",
    })
    .option("generateTsconfig", {
      default: false,
      description:
        "if set, will NOT build, but instead, will generate reasonable default TSConfig files that will work with dual publishing, and in most other use cases, as well",
      type: "boolean",
    })
    .option("jsx", {
      choices: ALLOWED_JSX_RUNTIMES,
      default: "automatic",
      description: "the type of JSX runtime to use when compiling your code",
      type: "string",
    })
    .option("noCjs", {
      default: false,
      description:
        "if true, will not build the CommonJS variant of this package",
      type: "boolean",
    })
    .option("noDts", {
      default: false,
      description: "if set, will not write typescript typings",
      type: "boolean",
    })
    .option("noEsm", {
      default: false,
      description: "if true, will not build the ESM variant of this package",
      type: "boolean",
    })
    .option("noStripLeading", {
      default: false,
      description:
        'if set, will not strip the leading, last common portion of your input file paths when writing output file paths. if your code is located in a "src/" folder, you want to leave this unset.',
      type: "boolean",
    })
    .option("outDir", {
      default: "dist",
      description: "the folder where the built files will be written",
      type: "string",
    })
    .option("tsconfig", {
      description:
        "if provided, will explicitly use this tsconfig.json location instead of searching for a tsconfig.build.json or a plain tsconfig.json",
      type: "string",
    })
    .option("watch", {
      default: false,
      description:
        "if set, will automatically watch for any changes to this library and rebuild, making it easier for you to consume changes in the monorepo while doing local development",
      type: "boolean",
    })
    .help().argv;

  const cwd = path.isAbsolute(absOrRelativeCwd)
    ? absOrRelativeCwd
    : path.resolve(absOrRelativeCwd);

  if (generateTsconfig) {
    return generateTsconfigs(cwd);
  }

  const outDirPath = path.isAbsolute(outDir) ? outDir : path.join(cwd, outDir);

  if (clean) await fs.remove(outDirPath);

  // ESM Must come before CJS, as those typings and such take precedence
  // when dual publishing.
  const formats = [noEsm ? undefined : "esm", noCjs ? undefined : "cjs"].filter(
    (fmt): fmt is ModuleType => !!fmt,
  );

  const tsconfig = await findTsconfigFile(cwd, tsconfigOverride);

  if (!tsconfig) {
    throw new Error(`unable to build ${cwd} because no tsconfig was found`);
  }

  const pjsonPath = path.join(path.dirname(tsconfig), "package.json");

  const numFormats = formats.length;

  const pjson = JSON.parse(await fs.readFile(pjsonPath, "utf8")) as PackageJson;
  if (!pjson.name) {
    throw new Error('your package.json is missing its "name" field');
  }
  // always freshly reset the exports and let the tool take over
  pjson.exports = {};

  Logger.info("building package", chalk.magenta(pjson.name));
  for (const format of formats) {
    try {
      Logger.info("  building", chalk.magenta(format), "variant in", cwd);
      Logger.info("    tsconfig", chalk.magenta(tsconfig));

      const outDir =
        numFormats <= 1 ? outDirPath : path.join(outDirPath, format);

      const getConfigCmd = `tsc --project ${tsconfig} --showConfig`;
      const finalConfig = JSON.parse(
        await runWithPm(getConfigCmd, { cwd, stdio: "pipe" }),
      ) as TsConfigJson;

      const tscFoundFiles = Array.isArray(finalConfig.files)
        ? finalConfig.files
        : [];

      const absoluteBuiltFiles = await compileCode({
        cwd,
        entryPoints: tscFoundFiles,
        format,
        jsxRuntime: (jsx ?? "automatic") as JSXRuntime,
        noDts,
        noStripLeading,
        outDir,
        parsedTsConfig: finalConfig,
        tsconfig,
        watch,
      });

      const builtFiles = absoluteBuiltFiles
        .map((fp) => {
          const relPath = path.relative(outDir, fp);
          if (numFormats <= 1) return `.${path.sep}${relPath}`;
          return `.${path.sep}${path.join(format, relPath)}`;
        })
        .sort();

      const indexFile = builtFiles.find((fp) => {
        const r = /^\.(\/|\\)((cjs|esm)(\/|\\))?index\.(c|m)?js$/;
        return r.test(fp);
      });

      if (indexFile) {
        const fixedIndexFile = `./${path.join(path.basename(outDirPath), indexFile)}`;

        Logger.info("index file detected");
        if (format === "cjs" || numFormats <= 1) {
          // we use the legacy type of typing exports for the top-level
          // typings
          pjson.types = fixedIndexFile.replace(
            path.extname(indexFile),
            ".d.ts",
          );
        }
        if (format === "esm") {
          pjson.module = fixedIndexFile;
        } else {
          pjson.main = fixedIndexFile;
        }
      }

      const exports = pjson.exports as ExportsObject;

      const outDirBasename = path.basename(outDirPath);

      for (const fp of builtFiles) {
        const fpWithNoExt = fp
          .replace(/(\.d)?\.(c|m)?(js|ts)$/, "")
          .replaceAll("\\", "/");
        const key = fpWithNoExt
          .replace(/(\/|\\)?index$/, "")
          .replace(/^\.(\/|\\)(cjs|esm)/, ".")
          .replaceAll("\\", "/");
        const fpWithBasename = `./${path
          .join(outDirBasename, fp)
          .replaceAll("\\", "/")}`;

        // Ensure key object exists
        const tempExports = exports[key] ?? {};

        let target: SafePackageJsonExportObject | undefined;
        if (numFormats > 1) {
          tempExports.require ??= {};
          tempExports.import ??= {};
          target = format === "cjs" ? tempExports.require : tempExports.import;
        } else {
          target = tempExports;
        }

        // Assign default JS entry
        target.default = fpWithBasename;

        // Assign type definitions if applicable
        if (!noDts && fp.endsWith(".d.ts")) {
          target.types = fpWithBasename;
        }

        exports[key] = tempExports;
      }

      pjson.exports = exports;

      await fs.writeFile(
        path.join(outDir, "package.json"),
        `{ "type": "${format === "esm" ? "module" : "commonjs"}" }`,
        "utf8",
      );

      Logger.info(chalk.green(`${pjson.name} - ${format} has been built!`));
    } catch (error) {
      Logger.error(
        "**building",
        pjson.name,
        chalk.underline(format),
        "variant has failed**",
      );
      throw error;
    }
  }

  pjson.exports["./package.json"] = "./package.json";
  const injected = injectExtraExports(pjson as PackageJsonWithPossibleConfig);

  await fs.writeFile(pjsonPath, JSON.stringify(injected, undefined, 2), "utf8");
}
