import type { ReactConfig } from "@swc/core";
import type { TsConfigJson } from "type-fest";

export type ModuleType = "cjs" | "esm";

export type JSXRuntime = ReactConfig["runtime"];

export type CompileTsOpts = {
  cwd: string;
  entryPoints: string[];
  format: ModuleType;
  noStripLeading: boolean;
  noDts: boolean;
  outDir: string;
  outExtension: "cjs" | "mjs" | "js";
  parsedTsConfig: TsConfigJson;
  jsxRuntime: JSXRuntime;
  tsconfig: string;
  watch: boolean;
};

export type Nullish<T> = T | null | undefined;

export type SafePackageJsonExportObject = {
  default?: string;
  types?: string;
};

export type PerFileExports = SafePackageJsonExportObject & {
  import?: SafePackageJsonExportObject;
  require?: SafePackageJsonExportObject;
};

export type ExportsObject = Record<string, PerFileExports>;

export type TSDualityLibOpts = {
  /**
   * if set, will clean out the build dirs before compiling anything
   */
  clean: boolean;
  /**
   * if true, will copy any non source files (anything that doesn't end with .js, .jsx, .cjs, .mts, .ts or .tsx)
   * to the output folder, while maintining the location of the files
   * to match where they were in your source folder
   */
  copyOtherFiles: boolean;
  /**
   * the CWD to use when building
   */
  cwd: string;
  /**
   * the type of JSX runtime to use when compiling your code
   */
  jsx: JSXRuntime;
  /**
   * if true, will not build the CommonJS variant of this package
   */
  noCjs: boolean;
  /**
   * if set, will not write typescript typings
   */
  noDts: boolean;
  /**
   * if true, will not build the ESM variant of this package
   */
  noEsm: boolean;
  /**
   * if set, will not strip the leading, last common portion of your input file paths when writing output file paths. if your code is located in a "src/" folder, you want to leave this unset.
   * NOTE: this does *not* affect how typescript compiles typings, so if your tsconfig#compilerOptions#rootDir is misconfigured,
   * or you are mixing roots from across your package, your typings might end up in a different folder than you expect
   */
  noStripLeading: boolean;
  /**
   * the folder where the built files will be written
   */
  outDir: string;
  /**
   * if provided, will explicitly use this tsconfig.json location instead of searching for a tsconfig.build.json or a plain tsconfig.json
   */
  tsconfig: string;
  /**
   * if set, will automatically watch for any changes to this library and rebuild, making it easier for you to consume changes in the monorepo while doing local development
   */
  watch: boolean;
};
