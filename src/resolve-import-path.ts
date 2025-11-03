import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

type ResolveImportCallback = (
  specifier: string,
  expectedFileExtensionWithDot: string,
) => {
  hadExtension: boolean;
  resolved: string;
  resolvedRelative: string;
};

/**
 * Create a resolver bound to the directory of a given file path.
 */
export function createResolver(absFilePath: string): ResolveImportCallback {
  const absDir = path.dirname(absFilePath);

  // Bind Node's resolution to the given file (behaves as if that file did the import)
  const require = createRequire(pathToFileURL(absFilePath));

  return function resolve(specifier, expectedFileExtensionWithDot) {
    const hadExtension = /\.[a-zA-Z0-9]+$/.test(specifier);

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
      // Fallback for simple relative specifiers; preserves original extension or lack thereof
      const resolved = path.resolve(absDir, specifier);

      const resolvedRelative = path.relative(absDir, resolved);
      return { resolved, resolvedRelative, hadExtension };
    }
  };
}
