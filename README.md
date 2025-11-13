# ts-duality

A slightly-opinionated but no BS, easy-to-use utility for compiling TypeScript code to both ESM and A no BS, easy-to-use utility for compiling TypeScript code to both ESM and CJS targets, as well as properly wiring up package.json exports.

`ts-duality` will do the whole-song-and-dance for you, and by default, it will render to both CJS and ESM.
You can optionally target one-specific output, or you can just compile without generating typings.

`ts-duality` will also render CJS and ESM modules with their correct `.cjs` and `.esm` formats, respectively, while ensuring that any relative imports used in your code are rewritten to also point to `.cjs` and `.esm` files.

Every file that TypeScript detects as part of your source will be automatically added to your `package.json#exports`, and if there is a an index file, this will be linked as your `package.json#main` and `package.json#module`.

For an example of what this looks like, checkout the [package.json file](./package.json) for `ts-duality`. `ts-duality` is compiled by itself 🔁.

## Get Started

### Installation

Install `ts-duality` with your favorite package manager:

**npm**
```
npm i @better-builds/ts-duality --save-dev
```

**pnpm**
```
pnpm i @better-builds/ts-duality -D
```

**yarn**
```
yarn add @better-builds/ts-duality --dev
```

**bun**
```
bun add @better-builds/ts-duality -d
```

---

## API
### CLI

Run `npx ts-duality` (or your equivalent for your package manager of choice) to kick off a build.

To see the help menu and all of its options, run `npx ts-duality --help`:

```bash
Options:
  --version         Show version number                                [boolean]
  --clean           if set, will clean out the build dirs before compiling
                    anything                          [boolean] [default: false]
  --copyOtherFiles  if true, will copy any non source files (anything that
                    doesn't end with .js, .jsx, .cjs, .mts, .ts or .tsx)
                    to the output folder, while maintining the location of the
                    files
                    to match where they were in your source folder
                                                      [boolean] [default: false]
  --cwd             the CWD to use when building
       [string] [default: "/Users/benjaminduran/dddddddd/opensource/ts-duality"]
  --jsx             the type of JSX runtime to use when compiling your code
   [string] [choices: "automatic", "classic", "preserve"] [default: "automatic"]
  --noCjs           if true, will not build the CommonJS variant of this package
                                                      [boolean] [default: false]
  --noDts           if set, will not write typescript typings
                                                      [boolean] [default: false]
  --noEsm           if true, will not build the ESM variant of this package
                                                      [boolean] [default: false]
  --noStripLeading  if set, will not strip the leading, last common portion of
                    your input file paths when writing output file paths. if
                    your code is located in a "src/" folder, you want to leave
                    this unset.
                    NOTE: this does *not* affect how typescript compiles
                    typings, so if your tsconfig#compilerOptions#rootDir is
                    misconfigured,
                    or you are mixing roots from across your package, your
                    typings might end up in a different folder than you expect
                                                      [boolean] [default: false]
  --outDir          the folder where the built files will be written
                                                      [string] [default: "dist"]
  --tsconfig        if provided, will explicitly use this tsconfig.json location
                    instead of searching for a tsconfig.build.json or a plain
                    tsconfig.json                                       [string]
  --watch           if set, will automatically watch for any changes to this
                    library and rebuild, making it easier for you to consume
                    changes in the monorepo while doing local development
                                                      [boolean] [default: false]
  --help            Show help                                          [boolean]
```

### JavaScript API

If you would prefer to interact with `ts-duality` in a JavaScript or TypeScript file, you can import its API as follows:
```
javascript
import { buildTsPackage } from '@better-builds/ts-duality';

await buildTsPackage({ /* accepts the same options as the CLI */ });
```

---

## Contributing

Ensure you have the proper versions of the tools installed in your environment.
You can see the versions in the [.tool-versions](./.tool-versions) file.

If you prefer, you can use the [mise](https://mise.jdx.dev/getting-started.html) utility to quickly get started by simply cloning this repository, then running `mise x -- bun ci` to install all dependencies.

Once you have them installed, simply run `bun ci` to get started developing in this project.
