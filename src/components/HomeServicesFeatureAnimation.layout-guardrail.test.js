import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home services feature alignment guardrail', () => {
  it('keeps right-panel body copy pinned to the same rail as the title and action while mobile stays left-aligned', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: end;');
    expect(cssSource).toContain('text-align: right;');
    expect(cssSource).toContain('p.home-services-feature-panel-body {');
    expect(cssSource).toContain('width: min(100%, 62rem);');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('.home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('text-align: left;');
  });
});
