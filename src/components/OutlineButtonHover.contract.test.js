import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readRuleBlock(source, selectorPattern) {
  return source.match(new RegExp(`${selectorPattern}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] || '';
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
      /\.service-native-action-row\.is-right \{\n {2}justify-content: flex-end;\n\}\n\n\.service-native-btn,[\s\S]*?text-align: center;\n[\s\S]*?\n\}/,
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

  it('keeps shared service outline buttons on a non-layout outward border-ring expansion instead of transform scale and hover glow', () => {
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
    expect(cssSource).toContain('.service-native-btn.is-outline::after {');
    expect(cssSource).toContain('position: absolute;');
    expect(cssSource).toContain('inset: 0;');
    expect(cssSource).toContain('border: 1px solid transparent;');
    expect(cssSource).toContain('.service-native-btn.is-outline:hover {');
    expect(cssSource).toContain('.service-native-btn.is-outline:hover::after {');
    expect(cssSource).toContain('border-color: transparent;');
    expect(cssSource).toContain('inset:\n      calc(-1 * var(--btn-outline-expand-block))\n      calc(-1 * var(--btn-outline-expand-inline));');
    expect(cssSource).toContain('opacity: 1;');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('color: var(--btn-outline-hover-color);');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.service-native-btn.is-outline:focus-visible {');
    expect(cssSource).toContain('.service-native-btn.is-outline:focus-visible::after {');
    expect(cssSource).toContain('box-shadow: 0 0 0 3px rgba(0, 138, 171, 0.28);');
    expect(cssSource).not.toContain('transition:\n    margin 220ms cubic-bezier(0.22, 1, 0.36, 1),');
    expect(cssSource).not.toContain('scale(1.032)');
    expect(cssSource).not.toContain('scale(1.014)');
    expect(cssSource).not.toContain('--btn-outline-hover-shadow');
  });

  it('keeps super-grey service button hover color centralized as a lighter tone', () => {
    const cssSource = readSource('../styles/service-native.css');
    const homeCssSource = readSource('../styles/home-native.css');
    const tokensSource = readSource('../styles/tokens.css');
    const superGreyButtonBlock = cssSource.match(
      /\.service-native-btn\.is-tone-super-grey,[\s\S]*?\.service-native-btn\.is-tone-super-grey:visited\s*\{[\s\S]*?\n\}/,
    )?.[0] || '';
    const darkButtonBlock = readRuleBlock(
      cssSource,
      String.raw`\.service-native-btn\.is-dark,[\s\S]*?\.service-native-btn\.is-dark:visited`,
    );
    const legacyGivingButtonBlock = readRuleBlock(
      cssSource,
      String.raw`\.native-info-page--legacy-giving \.legacy-giving-types \.service-native-card:first-child \.service-native-btn\.is-outline,[\s\S]*?\.native-info-page--legacy-giving \.legacy-giving-types \.service-native-card:first-child \.service-native-btn\.is-ghost`,
    );
    const loansIntroButtonHoverBlock = readRuleBlock(
      cssSource,
      String.raw`\.loans-native-intro \.service-native-btn:hover`,
    );
    const missionAssureButtonHoverBlock = readRuleBlock(
      cssSource,
      String.raw`\.native-info-page--mission-assure \.mission-assure-native-get-covered \.service-native-btn:hover`,
    );
    const homeStripLoginButtonBlock = readRuleBlock(
      homeCssSource,
      String.raw`\.home-native-strip-login-btn\.is-tone-super-grey`,
    );
    const homeStripRatesButtonBlock = readRuleBlock(
      homeCssSource,
      String.raw`\.home-native-strip-rates\.is-tone-super-grey`,
    );

    expect(tokensSource).toContain('--ag-color-super-grey-hover: color-mix(in srgb, var(--ag-color-super-grey) 60%, #ffffff 40%);');
    expect(superGreyButtonBlock).toContain('--btn-color: var(--ag-color-super-grey);');
    expect(superGreyButtonBlock).toContain('--btn-hover-color: var(--ag-color-super-grey-hover);');
    expect(superGreyButtonBlock).toContain('--btn-outline-hover-color: var(--btn-hover-color);');
    expect(superGreyButtonBlock).not.toContain('--btn-hover-color: #2d2f31;');
    expect(darkButtonBlock).toContain('--btn-color: var(--ag-color-super-grey);');
    expect(darkButtonBlock).toContain('--btn-hover-color: var(--ag-color-super-grey-hover);');
    expect(darkButtonBlock).not.toContain('--btn-hover-color: #2d2f31;');
    expect(legacyGivingButtonBlock).toContain('--btn-hover-color: var(--ag-color-super-grey-hover);');
    expect(legacyGivingButtonBlock).toContain('--btn-outline-hover-color: var(--btn-hover-color);');
    expect(loansIntroButtonHoverBlock).toContain('border-color: var(--ag-color-super-grey-hover);');
    expect(loansIntroButtonHoverBlock).toContain('background: var(--ag-color-super-grey-hover);');
    expect(missionAssureButtonHoverBlock).toContain('border-color: var(--ag-color-super-grey-hover);');
    expect(missionAssureButtonHoverBlock).toContain('background: var(--ag-color-super-grey-hover);');
    expect(homeStripLoginButtonBlock).toContain('--strip-btn-hover-bg: var(--ag-color-super-grey-hover);');
    expect(homeStripLoginButtonBlock).toContain('--strip-btn-hover-border: var(--ag-color-super-grey-hover);');
    expect(homeStripRatesButtonBlock).toContain('--strip-rates-hover-color: var(--ag-color-super-grey-hover);');
    expect(cssSource).not.toContain('--btn-hover-color: #2d2f31;');
    expect(homeCssSource).not.toContain('--strip-btn-hover-bg: #3b3a3c;');
    expect(homeCssSource).not.toContain('--strip-btn-hover-border: #3b3a3c;');
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
