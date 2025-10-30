import createCLI from "yargs";
import { hideBin } from "yargs/helpers";

import { ALLOWED_JSX_RUNTIMES } from "./constants.js";
import { buildTsPackage } from "./ts-duality-lib.js";
import type { TSDualityLibOpts } from "./types.js";

export async function setupCLI() {
  const yargs = createCLI(hideBin(process.argv));
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    $0: __,
    _,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest
  } = await yargs
    .scriptName("build-ts-package")
    .option("clean", {
      default: false,
      description:
        "if set, will clean out the build dirs before compiling anything",
      type: "boolean",
    })
    .option("copyOtherFiles", {
      default: false,
      description: `if true, will copy any non source files (anything that doesn't end with .js, .jsx, .cjs, .mts, .ts or .tsx)
to the output folder, while maintining the location of the files
to match where they were in your source folder`,
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
      description: `if set, will not strip the leading, last common portion of your input file paths when writing output file paths. if your code is located in a "src/" folder, you want to leave this unset.
NOTE: this does *not* affect how typescript compiles typings, so if your tsconfig#compilerOptions#rootDir is misconfigured,
or you are mixing roots from across your package, your typings might end up in a different folder than you expect`,
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
    .strict()
    .help().argv;

  await buildTsPackage(rest as TSDualityLibOpts);
}
setupCLI();
