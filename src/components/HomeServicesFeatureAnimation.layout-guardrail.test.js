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
    expect(cssSource).toContain('width: min(100%, 72rem);');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('.home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('text-align: left;');
  });

  it('keeps the home services typography contract pinned to the shared Typekit avenir stack', () => {
    const cssSource = readSource('../styles/home-native.css');
    const tokenSource = readSource('../styles/tokens.css');
    const appStylesSource = readSource('../styles.css');

    expect(tokenSource).toContain("--ag-font-heading: 'avenir-next-world', 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif;");
    expect(appStylesSource).toContain("@import url('https://use.typekit.net/nmy3epc.css');");
    expect(cssSource).toContain('h3.home-services-feature-panel-title {');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('font-synthesis: none;');
    expect(cssSource).toContain('text-rendering: geometricPrecision;');
    expect(cssSource).toContain('p.home-services-feature-panel-body {');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('-webkit-font-smoothing: antialiased;');
  });

  it('uses a shared bokeh engine with current/next palette layers instead of one dominant angled poster gradient', () => {
    const cssSource = readSource('../styles/home-native.css');
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');

    expect(cssSource).toContain('--home-services-base-rgb: 0, 30, 48;');
    expect(cssSource).toContain('--home-services-next-base-rgb: 0, 57, 70;');
    expect(cssSource).toContain('--home-services-secondary-rgb: 0, 138, 171;');
    expect(cssSource).toContain('--home-services-light-rgb: 0, 173, 187;');
    expect(cssSource).toContain('--home-services-dark-rgb: 0, 20, 30;');
    expect(cssSource).toContain('--home-services-accent-rgb: 216, 251, 255;');
    expect(cssSource).toContain('--home-services-palette-handoff: 0;');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-current {');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-next {');
    expect(cssSource).toContain('ellipse 140% 120% at 50% 48%');
    expect(cssSource).toContain('rgba(var(--home-services-layer-secondary-rgb), 0.24)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-accent-rgb), 0.14)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-dark-rgb), calc(var(--home-services-dark-strength) * 0.18))');
    expect(cssSource).not.toContain('--home-services-panel-bg:');
    expect(componentSource).toContain('const HOME_SERVICES_PANEL_PALETTES = Object.freeze([');
    expect(componentSource).toContain('const HOME_SERVICES_PALETTE_HANDOFF_CURVES = Object.freeze({');
    expect(componentSource).toContain('applyPaletteVars(panel, currentPalette);');
    expect(componentSource).toContain("applyPaletteVars(panel, nextPalette, 'next');");
  });

  it('keeps the current runtime order and palette handoff aligned to rendered panel order', () => {
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');

    expect(catalogSource.indexOf("title: 'Loans'")).toBeLessThan(catalogSource.indexOf("title: 'Investments'"));
    expect(catalogSource.indexOf("title: 'Investments'")).toBeLessThan(catalogSource.indexOf("title: 'Retirement'"));
    expect(catalogSource.indexOf("title: 'Retirement'")).toBeLessThan(catalogSource.indexOf("title: 'Legacy Giving'"));
    expect(catalogSource.indexOf("title: 'Legacy Giving'")).toBeLessThan(catalogSource.indexOf("title: 'Insurance'"));
    expect(componentSource).toContain('const currentPalette = resolveHomeServicesPalette(index);');
    expect(componentSource).toContain('const nextPalette = resolveHomeServicesPalette(Math.min(panelNodes.length - 1, index + 1));');
    expect(componentSource).toContain('const paletteHandoff = index < panelNodes.length - 1');
  });

  it('keeps the hero visually suppressed on home while the feature intro gets the requested desktop runway', () => {
    const cssSource = readSource('../styles/home-native.css');
    const pageSource = readSource('../pages/HomePage.jsx');

    expect(pageSource).toContain("const HOME_HERO_TEMPORARILY_HIDDEN = true;");
    expect(pageSource).toContain('return reorderHomeTopBlocks(resolvedBlocks.concat(extraRenderableManagedBlocks));');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden [data-block-id="hero"] {');
    expect(cssSource).toContain('display: none;');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden .home-impact-story-stage {');
    expect(cssSource).toContain('min-height: calc(100vh - clamp(10rem, 17vh, 12rem));');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden .home-services-feature-intro {');
    expect(cssSource).toContain('min-height: 75vh;');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('padding: clamp(2.5rem, 6vh, 4.5rem) 0;');
  });
});
