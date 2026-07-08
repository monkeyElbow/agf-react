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
  it('keeps base button typography on zero tracking while routing Safari through its own heavier browser override', () => {
    const serviceCssSource = readSource('../styles/service-native.css');
    const appCssSource = readSource('../styles.css');
    const sharedButtonBlock = appCssSource.match(
      /a\.service-native-btn,[\s\S]*?button\.action-btn\s*\{[\s\S]*?\n\}/,
    )?.[0] || '';
    const safariButtonBlock = appCssSource.match(
      /html\.ag-browser-safari a\.service-native-btn,[\s\S]*?button\.action-btn\s*\{[\s\S]*?\n\}/,
    )?.[0] || '';
    const actionButtonBlock = appCssSource.match(
      /\.action-btn\s*\{\n\s*border-radius:[\s\S]*?\n\}/,
    )?.[0] || '';
    const serviceButtonBlock = serviceCssSource.match(
      /\.service-native-action-row\.is-right \{\n  justify-content: flex-end;\n\}\n\n\.service-native-btn,[\s\S]*?text-align: center;\n[\s\S]*?\n\}/,
    )?.[0] || '';

    expect(serviceCssSource).toContain('.service-native-btn,');
    expect(serviceButtonBlock).toContain('font-weight: 100;');
    expect(serviceButtonBlock).toContain('letter-spacing: 0;');
    expect(appCssSource).toContain('a.service-native-btn,');
    expect(sharedButtonBlock).not.toContain('font-family: var(--ag-font-helv);');
    expect(sharedButtonBlock).not.toContain('font-weight: 700;');
    expect(sharedButtonBlock).not.toContain('letter-spacing: 0.45px;');
    expect(sharedButtonBlock).not.toContain('font-weight: 100;');
    expect(safariButtonBlock).toContain('font-weight: 400;');
    expect(actionButtonBlock).toContain('font-family: var(--ag-font-helv);');
    expect(actionButtonBlock).toContain('font-weight: 100;');
  });

  it('keeps shared service outline buttons on an outward border-ring expansion instead of transform scale and hover glow', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-hover-bg: transparent;');
    expect(cssSource).toContain('--btn-hover-text: var(--btn-color);');
    expect(cssSource).toContain('--btn-outline-expand-block: 0.125rem;');
    expect(cssSource).toContain('--btn-outline-expand-inline: 0.1875rem;');
    expect(cssSource).toContain('--btn-outline-padding-block-base: 0.76rem;');
    expect(cssSource).toContain('--btn-outline-padding-inline-base: 1.5rem;');
    expect(cssSource).toContain('margin: 0;');
    expect(cssSource).toContain('padding:\n    var(--btn-outline-padding-block-base)\n    var(--btn-outline-padding-inline-base);');
    expect(cssSource).toContain('.service-native-btn.is-outline:hover {');
    expect(cssSource).toContain('margin:\n      calc(-1 * var(--btn-outline-expand-block))\n      calc(-1 * var(--btn-outline-expand-inline));');
    expect(cssSource).toContain('padding:\n      calc(var(--btn-outline-padding-block-base) + var(--btn-outline-expand-block))\n      calc(var(--btn-outline-padding-inline-base) + var(--btn-outline-expand-inline));');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('color: var(--btn-color);');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.service-native-btn.is-outline:focus-visible {');
    expect(cssSource).toContain('box-shadow: 0 0 0 3px rgba(0, 138, 171, 0.28);');
    expect(cssSource).not.toContain('scale(1.032)');
    expect(cssSource).not.toContain('scale(1.014)');
    expect(cssSource).not.toContain('--btn-outline-hover-shadow');
  });

  it('keeps home outline variants aligned to the same non-scaling expansion contract', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-services-feature .service-native-btn.is-outline.is-tone-white {');
    expect(cssSource).toContain('.home-services-feature .service-native-btn.is-outline.is-tone-white:hover,');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-btn.service-native-btn.is-outline.is-tone-white:hover,');
    expect(cssSource).toContain('.home-impact-story-proof-cta-block {');
    expect(cssSource).toContain('.home-impact-story-proof-intro {');
    expect(cssSource).not.toContain('.home-impact-story-cta {');
    expect(cssSource).not.toContain('--home-impact-cta-expand-inline');
    expect(cssSource).not.toContain('scale(1.032)');
    expect(cssSource).not.toContain('scale(1.014)');
    expect(cssSource).not.toContain('--home-impact-cta-hover-shadow');
  });
});
