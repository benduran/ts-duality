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
