import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home page mobile overflow guardrail', () => {
  it('keeps the dev-only columns diagnostics overlay layout-viewport safe on mobile', () => {
    const source = readSource('./HomePage.jsx');

    expect(source).toContain('width: \'min(560px, calc(100% - 24px))\'');
    expect(source).toContain('maxWidth: \'calc(100% - 24px)\'');
    expect(source).toContain('boxSizing: \'border-box\'');
    expect(source).not.toContain('maxWidth: \'min(560px, calc(100vw - 24px))\'');
  });
});
