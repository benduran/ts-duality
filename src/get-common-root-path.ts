import path from "node:path";

const PATH_SEP_REGEX = /\/|\\/;

/**
 * Given an array of file or folder paths, returns the longest
 * common parent folder path. Returns an empty string if there
 * is no common root.
 */
export function getCommonRootPath(paths: string[]): string {
  if (paths.length === 0) return "";

  // Split each path into segments
  const splitPaths = paths.map((p) => p.split(PATH_SEP_REGEX).filter(Boolean));

  // Start from the first path as a baseline
  const first = splitPaths[0];
  const commonSegments: string[] = [];

  for (const [i, segment] of first?.entries() ?? []) {
    // If all paths share this segment at this position, keep it
    if (splitPaths.every((parts) => parts[i] === segment)) {
      commonSegments.push(segment);
      continue;
    }
  }

  // If nothing in common, return empty string
  if (commonSegments.length === 0) return "";

  // Preserve absolute path prefix if present
  const startsWithSlash = paths[0]?.startsWith(path.sep);
  const joined = path.join(...commonSegments);
  return startsWithSlash ? path.sep + joined : joined;
}
