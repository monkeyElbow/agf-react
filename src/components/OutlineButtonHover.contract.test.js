import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('outline button hover contract', () => {
  it('keeps shared service outline buttons on outward padding expansion instead of transform scale and hover glow', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-outline-expand-block: 0.125rem;');
    expect(cssSource).toContain('--btn-outline-expand-inline: 0.1875rem;');
    expect(cssSource).toContain('--btn-outline-padding-block-base: 0.76rem;');
    expect(cssSource).toContain('--btn-outline-padding-inline-base: 1.5rem;');
    expect(cssSource).toContain('margin: 0;');
    expect(cssSource).toContain('padding:\n    var(--btn-outline-padding-block-base)\n    var(--btn-outline-padding-inline-base);');
    expect(cssSource).toContain('.service-native-btn.is-outline:hover {');
    expect(cssSource).toContain('margin:\n      calc(-1 * var(--btn-outline-expand-block))\n      calc(-1 * var(--btn-outline-expand-inline));');
    expect(cssSource).toContain('calc(var(--btn-outline-padding-block-base) + var(--btn-outline-expand-block))');
    expect(cssSource).toContain('calc(var(--btn-outline-padding-inline-base) + var(--btn-outline-expand-inline));');
    expect(cssSource).toContain('.service-native-btn.is-outline:focus-visible {');
    expect(cssSource).toContain('0 0 0 5px rgba(0, 138, 171, 0.34);');
    expect(cssSource).not.toContain('scale(1.032)');
    expect(cssSource).not.toContain('scale(1.014)');
    expect(cssSource).not.toContain('--btn-outline-hover-shadow');
  });

  it('keeps home outline variants aligned to the same non-scaling expansion contract', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-services-feature .service-native-btn.is-outline.is-tone-white {');
    expect(cssSource).toContain('.home-impact-story-cta {');
    expect(cssSource).toContain('--home-impact-cta-expand-inline: var(--home-impact-story-button-expand-inline);');
    expect(cssSource).toContain('--home-impact-cta-padding-block-base: 0.72rem;');
    expect(cssSource).toContain('--home-impact-cta-padding-inline-base: 1.9rem;');
    expect(cssSource).toContain('.home-impact-story-cta:hover {');
    expect(cssSource).not.toContain('calc(var(--home-impact-cta-padding-block-base) + var(--home-impact-cta-expand-inline))');
    expect(cssSource).toContain('calc(var(--home-impact-cta-padding-inline-base) + var(--home-impact-cta-expand-inline));');
    expect(cssSource).not.toContain('scale(1.032)');
    expect(cssSource).not.toContain('scale(1.014)');
    expect(cssSource).not.toContain('--home-impact-cta-hover-shadow');
  });
});
