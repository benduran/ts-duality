import { Logger } from "./logger.js";

type Config = Partial<{
  extraExports: Record<string, unknown>;
}>;

export type PackageJsonWithPossibleConfig = Partial<{
  "build-ts-package": Config;
  exports: Record<string, unknown>;
}>;

/**
 * takes the package.json blob and smears some additional
 * export statements into the existing block, if avaialble
 */
export function injectExtraExports(pjson: PackageJsonWithPossibleConfig) {
  const config = pjson["build-ts-package"];

  if (!config?.extraExports) return pjson;

  Logger.info("config.extraExports", JSON.stringify(config.extraExports));

  return {
    ...pjson,
    exports: {
      ...pjson.exports,
      ...config.extraExports,
    },
  };
}
