import type { CompileTsOpts } from './types.js';

export const ALLOWED_JSX_RUNTIMES: CompileTsOpts['jsxRuntime'][] = [
  'automatic',
  'classic',
  'preserve',
];
