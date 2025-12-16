import detectIndent from 'detect-indent';

/**
 * detects the indentation size for a given file
 */
export function getIndentationSize(fileContents: string) {
  return detectIndent(fileContents).amount;
}
