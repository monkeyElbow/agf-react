import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('HomeImpactStoryFeature left edge surface', () => {
  it('keeps the wide-screen story surface from fading the left edge to transparent', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story-surface {');
    expect(cssSource).toContain('.home-impact-story-surface::before {');
    expect(cssSource).toContain('.home-impact-story .ag-panel-rail {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).not.toContain('rgba(10, 124, 148, 0) 7%');
    expect(cssSource).not.toContain('rgba(var(--home-impact-story-base-rgb), 0) 7%');
  });
});
