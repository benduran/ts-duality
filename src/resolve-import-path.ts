import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type ResolveImportCallback = (
  importSpecifier: string,
  expectedFileExtensionWithDot: string,
) =>
  | {
      hadExtension: boolean;
      resolved: string;
      resolvedRelative: string;
    }
  | null
  | undefined;

function ensureRelativePathStartsWithDotSlash(relpath: string) {
  if (/^\.(\/|\\)/.test(relpath)) return relpath;
  return `./${relpath}`;
}

const KNOWN_EXTENSIONS = [
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.cts',
  '.ts',
  '.tsx',
  '.mts',
] as const;

function importSpecifierHadJavascriptyExtension(importSpecifier: string) {
  for (const ext of KNOWN_EXTENSIONS) {
    if (importSpecifier.endsWith(ext)) return true;
  }

  return false;
}

/**
 * Create a resolver bound to the directory of a given file path.
 */
export function createResolver(absFilePath: string): ResolveImportCallback {
  const absDir = path.dirname(absFilePath);

  // Bind Node's resolution to the given file (behaves as if that file did the import)
  const require = createRequire(pathToFileURL(absFilePath));

  return function resolve(importSpecifier, expectedFileExtensionWithDot) {
    const hadExtension =
      importSpecifierHadJavascriptyExtension(importSpecifier);

    const pathsToCheckForResolution = [
      ensureRelativePathStartsWithDotSlash(
        hadExtension
          ? importSpecifier
          : path.join(`${importSpecifier}${expectedFileExtensionWithDot}`),
      ),
      hadExtension
        ? undefined
        : ensureRelativePathStartsWithDotSlash(
            path.join(importSpecifier, `index${expectedFileExtensionWithDot}`),
          ),
    ]
      .filter((toCheck): toCheck is string => !!toCheck)
      .map((specifier) =>
        specifier.replace(
          path.extname(specifier),
          expectedFileExtensionWithDot,
        ),
      );

    for (const specifier of pathsToCheckForResolution) {
      // Try Node's resolution first (handles bare specifiers, exports fields, node_modules, etc.)
      try {
        const resolved = require.resolve(specifier);

        const resolvedRelative = path.relative(absDir, resolved);

        return { resolved, resolvedRelative, hadExtension };
      } catch {
        /* no-op */
      }
    }

    return;
  };
}
