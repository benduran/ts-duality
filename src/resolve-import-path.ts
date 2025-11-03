import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

/**
 * Create a resolver bound to the directory of a given file path.
 */
export function createResolver(absFilePath: string): ResolveImportCallback {
  const absDir = path.dirname(absFilePath);

  // Bind Node's resolution to the given file (behaves as if that file did the import)
  const require = createRequire(pathToFileURL(absFilePath));

  return function resolve(importSpecifier, expectedFileExtensionWithDot) {
    const hadExtension = /\.[a-zA-Z0-9]+$/.test(importSpecifier);

    const pathsToCheckForResolution = [
      hadExtension
        ? importSpecifier
        : `.${importSpecifier}${expectedFileExtensionWithDot}`,
      hadExtension
        ? undefined
        : `.${path.join(importSpecifier, `index${expectedFileExtensionWithDot}`)}`,
    ]
      .filter((toCheck): toCheck is string => !!toCheck)
      .map((specifier) =>
        hadExtension
          ? specifier.replace(
              path.extname(specifier),
              expectedFileExtensionWithDot,
            )
          : `${specifier}${expectedFileExtensionWithDot}`,
      );

    for (const specifier of pathsToCheckForResolution) {
      // Try Node's resolution first (handles bare specifiers, exports fields, node_modules, etc.)
      try {
        const resolved = require.resolve(
          hadExtension
            ? specifier
            : `${specifier}${expectedFileExtensionWithDot}`,
        );

        const resolvedRelative = path.relative(absDir, resolved);

        return { resolved, resolvedRelative, hadExtension };
      } catch {
        /* no-op */
      }
    }

    return;
  };
}
