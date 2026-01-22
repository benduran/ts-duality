/* eslint-disable no-console */
// eslint-disable-next-line unicorn/import-style
import type { ColorName } from 'chalk';
import chalk from 'chalk';

type LogLevel = 'error' | 'info' | 'warn';
type LogLevelWithSilence = LogLevel | 'silent';

const DUALITY_LOGLEVEL = (process.env.DUALITY_LOGLEVEL ??
  'info') as LogLevelWithSilence;

export const Logger = {
  /**
   * Prints a message to the console in whatever color your heart desires ❤️
   */
  colorful(color: ColorName, level: LogLevel, ...msg: unknown[]) {
    if (DUALITY_LOGLEVEL === 'silent') return;
    console[level](chalk[color](...msg));
  },
  /**
   * Logs an error message
   */
  error(...msg: unknown[]) {
    if (DUALITY_LOGLEVEL === 'silent') return;
    console.error(chalk.red(...msg));
  },
  /**
   * Logs an info message
   */
  info(...msg: unknown[]) {
    if (DUALITY_LOGLEVEL === 'silent') return;
    console.info(chalk.blue(...msg));
  },
  /**
   * Logs a warning message
   */
  warn(...msg: unknown[]) {
    if (DUALITY_LOGLEVEL === 'silent') return;
    console.warn(chalk.yellow(...msg));
  },
};
