import path from "node:path";

import chalk from "chalk";
import fs from "fs-extra";
import type { PackageJson, TsConfigJson } from "type-fest";

import { checkFileExists } from "./check-file-exists.js";
import { compileCode } from "./compile-code.js";
import { copyNonSourceFiles } from "./copy-non-source-files.js";
import { findTsconfigFile } from "./find-tsconfig-file.js";
import { formatWithPrettierIfPossible } from "./format-with-prettier-if-possible.js";
import { generateTsconfigs } from "./generate-tsconfigs.js";
import { getIndentationSize } from "./get-indentation.js";
import type { PackageJsonWithPossibleConfig } from "./inject-extra-exports.js";
import { injectExtraExports } from "./inject-extra-exports.js";
import { Logger } from "./logger.js";
import { runWithPm } from "./run-with-pm.js";
import type {
  ExportsObject,
  JSXRuntime,
  ModuleType,
  SafePackageJsonExportObject,
  TSDualityLibOpts,
} from "./types.js";

export async function buildTsPackage({
  clean,
  copyOtherFiles,
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
}: TSDualityLibOpts) {
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

  const pjsonContents = await fs.readFile(pjsonPath, "utf8");
  const pjson = JSON.parse(pjsonContents) as PackageJson;
  if (!pjson.name) {
    throw new Error('your package.json is missing its "name" field');
  }
  const pjsonIndentSize = getIndentationSize(pjsonContents);

  // we make the package.json a module if the user has an ESM build target.
  // otherwise, we leave it alone
  if (numFormats > 1 || formats.includes("esm")) {
    pjson.type = "module";
    await fs.writeFile(
      pjsonPath,
      JSON.stringify(pjson, undefined, pjsonIndentSize),
      "utf8",
    );
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
        await runWithPm(getConfigCmd, {
          cwd,
          stdio: "pipe",
        }),
      ) as TsConfigJson;

      const tscFoundFiles = Array.isArray(finalConfig.files)
        ? finalConfig.files
        : [];

      const outExtension = format === "cjs" ? "cjs" : "mjs";

      const absoluteBuiltFiles = await compileCode({
        cwd,
        entryPoints: tscFoundFiles,
        format,
        jsxRuntime: (jsx ?? "automatic") as JSXRuntime,
        noDts,
        noStripLeading,
        outDir,
        outExtension,
        parsedTsConfig: finalConfig,
        tsconfig,
        watch,
      });

      if (copyOtherFiles) {
        await copyNonSourceFiles(cwd, tscFoundFiles, outDir);
      }

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
          const indexTypingFilePath = fixedIndexFile.replace(
            path.extname(indexFile),
            ".d.ts",
          );
          if (await checkFileExists(cwd, indexTypingFilePath)) {
            pjson.types = indexTypingFilePath;
          }
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
        const possibleTypingFile = `./${path.join(
          outDirBasename,
          fp.replace(path.extname(fp), ".d.ts"),
        )}`;

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

        // Assign type definitions if applicable
        if (!noDts) {
          const typingFileExists = await checkFileExists(
            cwd,
            possibleTypingFile,
          );
          if (typingFileExists) {
            target.types = possibleTypingFile;
          }
        }

        // Assign default JS entry
        target.default = fpWithBasename;
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

  await fs.writeFile(
    pjsonPath,
    JSON.stringify(injected, undefined, pjsonIndentSize),
    "utf8",
  );
  await formatWithPrettierIfPossible(cwd, pjsonPath);
}
