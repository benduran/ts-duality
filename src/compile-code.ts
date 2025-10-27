import path from "node:path";

import { transformFile } from "@swc/core";
import glob from "fast-glob";
import fs from "fs-extra";
import type { TsConfigJson } from "type-fest";

import { Logger } from "./logger.js";
import { createResolver } from "./resolve-import-path.js";
import type { CompileTsOpts } from "./types.js";
import { runWithPm } from "./run-with-pm.js";

/**
 * Generates typescript typings, if requested
 */
async function generateTypings({
  cwd,
  noDts,
  outDir,
  parsedTsConfig,
  tsconfig,
}: CompileTsOpts) {
  if (noDts) {
    Logger.warn("noDts was set so skipping generating TypeScript typings");
    return;
  }

  // if the tsconfig has incremental: true enabled, we have to disable it
  // or TSC might not generate typings for us at all.
  // we do this by overriding it if it is set.
  if (parsedTsConfig.compilerOptions?.incremental) {
    Logger.warn(
      `your tsconfig at ${tsconfig} was found to have incremental: true set. we are setting this to false to allow typings to be written to disk properly`,
    );
    const tsconfigContents = JSON.parse(
      await fs.readFile(tsconfig, "utf8"),
    ) as TsConfigJson;
    await fs.writeFile(
      tsconfig,
      JSON.stringify(
        {
          ...tsconfigContents,
          compilerOptions: {
            ...tsconfigContents.compilerOptions,
            incremental: false,
          },
        },
        undefined,
        2,
      ),
      "utf8",
    );
  }

  const cmd = `tsc --project ${tsconfig} --outDir ${outDir} --declaration true --emitDeclarationOnly true --noEmit false`;

  await runWithPm(cmd, { cwd, stdio: "inherit", verbose: true });
  return;
}

/**
 * compiles typescript, using any build utility of your choosing
 */
export async function compileCode(opts: CompileTsOpts) {
  const { cwd, entryPoints, format, jsxRuntime, noStripLeading, outDir } = opts;

  const outExtension = "js";
  const outExtensionWithDot = `.${outExtension}`;

  const filesToCompile = entryPoints.filter((ep) =>
    /^(?!.*\.d\.ts$).*\.(?:[jt]sx?|cjs|mts)$/.test(ep),
  );

  const typescriptCompilationPromise = generateTypings(opts);
  debugger;
  const swcCompilationPromises = filesToCompile.map(async (fp) => {
    const absFp = path.isAbsolute(fp) ? fp : path.join(cwd, fp);
    const trueRelPath = path.relative(cwd, absFp);

    const outFilePath = path.join(
      outDir,
      ...trueRelPath
        .replace(path.extname(fp), outExtensionWithDot)
        .split(path.sep)
        .slice(noStripLeading ? 0 : 1)
        .filter(Boolean),
    );

    const { code } = await transformFile(fp, {
      cwd,
      jsc: {
        target: "esnext",
        transform: {
          react: {
            runtime: jsxRuntime ?? "automatic",
          },
        },
      },
      module: {
        outFileExtension: outExtension,
        resolveFully: true,
        strict: true,
        type: format === "esm" ? "es6" : "commonjs",
      },
      outputPath: outDir,
      sourceMaps: false,
    });

    await fs.ensureFile(outFilePath);
    await fs.writeFile(outFilePath, code, "utf8");
  });

  await Promise.all([typescriptCompilationPromise, ...swcCompilationPromises]);

  const absoluteBuiltFiles = await glob(
    [
      path.join(outDir, "**", "*.d.ts"),
      path.join(outDir, "**", "*.js"),
      path.join(outDir, "**", "*.cjs"),
      path.join(outDir, "**", "*.mjs"),
    ],
    { absolute: true, onlyFiles: true },
  );

  // Matches ESM import/export statements and captures the module specifier
  const esmRegex =
    /\bimport\s+(?:[\s\S]*?\bfrom\s+)?(['"])([^'"]+)\1|\bexport\s+(?:[\s\S]*?\bfrom\s+)(['"])([^'"]+)\3/g;

  await Promise.all(
    absoluteBuiltFiles.map(async (absFp) => {
      if (absFp.endsWith(".d.ts")) return;

      let contents = await fs.readFile(absFp, "utf8");

      contents = contents.replaceAll(esmRegex, (full, _q1, imp1, _q2, imp2) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const importPath = String(imp1 || imp2);
        const resolveImport = createResolver(absFp);
        const { resolved, resolvedRelative } = resolveImport(importPath);

        if (!resolved.startsWith(outDir)) return full;

        // Compute the new path:
        // - If the specifier has an extension, replace it.
        // - If it doesn't, append the desired extension.
        const ext = path.extname(resolvedRelative);
        let newPath = ext
          ? resolvedRelative.replace(ext, outExtensionWithDot)
          : `${resolvedRelative}${outExtensionWithDot}`;

        if (!newPath.startsWith(".") && !newPath.startsWith("/")) {
          newPath = `./${newPath}`;
        }

        if (/\.jsx?/.test(resolved)) {
          // Replace only inside the matched statement to avoid accidental global replacements.
          const out = full.replace(importPath, newPath);

          return out;
        }
        return full;
      });

      await fs.writeFile(absFp, contents, "utf8");
    }),
  );

  return absoluteBuiltFiles;
}
