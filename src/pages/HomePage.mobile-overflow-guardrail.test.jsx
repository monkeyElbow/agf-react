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
  it('keeps columns diagnostics out of the rendered page surface', () => {
    const source = readSource('./HomePage.jsx');

    expect(source).toContain('window.__agfHomeColumnsDebug = homeColumnsDiagnostics;');
    expect(source).not.toContain('JSON.stringify(homeColumnsDiagnostics, null, 2)');
    expect(source).not.toContain('position: \'fixed\'');
  });
});
