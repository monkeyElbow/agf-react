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
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('.impact-proof-story-proof.is-right .impact-proof-story-proof-content {');
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('.impact-proof-story-proof-action {');
    expect(cssSource).toContain('margin-top: clamp(0.45rem, 0.9vw, 0.9rem);');
    expect(cssSource).toContain('.impact-proof-story-proof.is-tone-atlantean-dark {');
    expect(cssSource).toContain('linear-gradient(144deg, #07131b 0%, #0b1e29 52%, rgba(var(--ag-color-atlantean-dark-rgb), 0.92) 100%);');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('@media (max-width: 680px) {');
    expect(cssSource).toContain('.impact-proof-story-proof {');
    expect(cssSource).toContain('--impact-proof-light-strength: 0.34;');
    expect(cssSource).toContain('--impact-proof-light-width: 42%;');
    expect(cssSource).toContain('--impact-proof-panel-opacity: 0.95;');
    expect(cssSource).toContain('--impact-proof-dark-angle: 136deg;');
    expect(cssSource).toContain('--impact-proof-dark-stop-3: 68%;');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('.impact-proof-story-proof::before {');
    expect(cssSource).toContain('z-index: 0;');
    expect(cssSource).toContain('ellipse var(--impact-proof-light-width) var(--impact-proof-light-height) at var(--impact-proof-light-x) var(--impact-proof-light-y)');
    expect(cssSource).toContain('var(--impact-proof-panel-opacity)');
    expect(cssSource).toContain('.impact-proof-story-proof::after {');
    expect(cssSource).toContain('var(--impact-proof-dark-angle)');
    expect(cssSource).toContain('var(--impact-proof-dark-stop-2)');
    expect(cssSource).toContain('h2.impact-proof-story-proof-stat {');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('font-size: clamp(99px, 7.9vw, 122px);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('font-synthesis: none;');
    expect(cssSource).toContain('line-height: 0.96;');
    expect(cssSource).toContain('letter-spacing: -0.036em;');
    expect(cssSource).toContain('.impact-proof-story-proof-label {');
    expect(cssSource).toContain('display: inline;');
    expect(cssSource).toContain('--impact-proof-content-max-width: min(100%, 78rem);');
    expect(cssSource).toContain('position: relative;');
    expect(cssSource).toContain('z-index: 1;');
    expect(cssSource).toContain('max-width: min(46rem, 100%);');
    expect(cssSource).toContain('font-size: clamp(47px, 11vw, 65px);');
    expect(cssSource).toContain('font-size: clamp(1.5rem, 2vw, 2rem);');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
  });
});
