import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = __dirname;
const SOURCE_EXTENSIONS = new Set(['.css', '.js', '.jsx']);
const POSITIVE_CSS_LETTER_SPACING = /letter-spacing:\s*(?:0?\.[1-9]\d*|[1-9]\d*(?:\.\d+)?)(?:px|em|rem)/g;
const POSITIVE_JS_LETTER_SPACING = /letterSpacing:\s*['"](?:0?\.[1-9]\d*|[1-9]\d*(?:\.\d+)?)(?:px|em|rem)['"]/g;

function collectSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      return collectSourceFiles(absolutePath);
    }
    const extension = path.extname(entry);
    const isTestFile = /\.test\./.test(entry);
    if (!SOURCE_EXTENSIONS.has(extension) || isTestFile) {
      return [];
    }
    return [absolutePath];
  });
}

describe('letter spacing policy guardrail', () => {
  it('keeps non-test source files at zero-or-tighter letter spacing', () => {
    const violations = [];

    collectSourceFiles(SOURCE_ROOT).forEach((absolutePath) => {
      const source = readFileSync(absolutePath, 'utf8');
      const matches = [
        ...(source.match(POSITIVE_CSS_LETTER_SPACING) || []),
        ...(source.match(POSITIVE_JS_LETTER_SPACING) || []),
      ];
      if (!matches.length) {
        return;
      }
      violations.push({
        file: path.relative(SOURCE_ROOT, absolutePath),
        matches,
      });
    });

    expect(violations).toEqual([]);
  });
});
