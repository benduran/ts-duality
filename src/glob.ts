import { glob as g } from "glob";

import { normalizePath } from "./normalize-path.js";

export function glob(...paths: string[]) {
  return g(
    paths.map((p) => normalizePath(p)),
    { absolute: true, nodir: true },
  );
}
