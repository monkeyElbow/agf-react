import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('impact proof story layout guardrail', () => {
  it('keeps the desktop proof copy wider while preserving the stacked mobile fallbacks', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.impact-proof-story-body {');
    expect(cssSource).toContain('width: min(calc(100% - (var(--ag-panel-gutter) * 2)), 68vw);');
    expect(cssSource).toContain('max-width: 68vw;');
    expect(cssSource).toContain('.impact-proof-story-proof.is-left .impact-proof-story-proof-content {');
    expect(cssSource).toContain('grid-column: 1 / span 10;');
    expect(cssSource).toContain('.impact-proof-story-proof.is-right .impact-proof-story-proof-content {');
    expect(cssSource).toContain('grid-column: 3 / -1;');
    expect(cssSource).toContain('.impact-proof-story-proof-action {');
    expect(cssSource).toContain('margin-top: clamp(1.3rem, 2vw, 1.75rem);');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-atlantean-dark {');
    expect(cssSource).toContain('linear-gradient(144deg, #07131b 0%, #0b1e29 52%, rgba(var(--ag-color-atlantean-dark-rgb), 0.92) 100%);');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('@media (max-width: 680px) {');
    expect(cssSource).toContain('.impact-proof-story-proof {');
    expect(cssSource).toContain('width: 100%;');
  });
});
