type Config = Partial<{
  extraExports: Record<string, unknown>;
}>;

export type PackageJsonWithPossibleConfig = Partial<{
  'ts-duality': Config;
  exports: Record<string, unknown>;
}>;

/**
 * takes the package.json blob and smears some additional
 * export statements into the existing block, if avaialble
 */
export function injectExtraExports(pjson: PackageJsonWithPossibleConfig) {
  const config = pjson['ts-duality'];

  if (!config?.extraExports) return pjson;

  return {
    ...pjson,
    exports: {
      ...pjson.exports,
      ...config.extraExports,
    },
  };
}
