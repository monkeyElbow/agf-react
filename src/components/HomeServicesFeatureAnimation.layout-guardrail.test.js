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
  it('keeps the services panels as rounded content-width cards while mobile stays left-aligned', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-services-feature {');
    expect(cssSource).toContain('padding-bottom: clamp(3rem, 5vw, 4.5rem);');
    expect(cssSource).toContain('overflow: visible;');
    expect(cssSource).toContain('.home-services-feature-shell {');
    expect(cssSource).toContain('--home-services-intro-top-space: clamp(5.75rem, 13vw, 13rem);');
    expect(cssSource).toContain('--home-services-intro-shell-gap: clamp(1.4rem, 3.2vw, 3rem);');
    expect(cssSource).toContain('--home-services-intro-cue-offset: clamp(0.82rem, 2.05vw, 1.8rem);');
    expect(cssSource).toContain('--home-services-panel-gap: clamp(0.675rem, 1.1vw, 1.125rem);');
    expect(cssSource).toContain('--home-services-panel-gap: clamp(0.34rem, 0.72vw, 0.58rem);');
    expect(cssSource).toContain('gap: var(--home-services-intro-shell-gap);');
    expect(cssSource).toContain('.home-services-feature-list {');
    expect(cssSource).toContain('gap: var(--home-services-panel-gap);');
    expect(cssSource).toContain('width: min(var(--ag-panel-wide-max), calc(100% - (var(--ag-panel-gutter) * 2)));');
    expect(cssSource).toContain('padding: 0 clamp(0.7rem, 1.5vw, 1.1rem) clamp(3.45rem, 5.8vw, 4.7rem);');
    expect(cssSource).toContain('perspective: 1800px;');
    expect(cssSource).toContain('.home-services-feature-panel {');
    expect(cssSource).toContain('width: min(100%, 84rem);');
    expect(cssSource).toContain('border-radius: 32px;');
    expect(cssSource).toContain('transform: translate3d(0, var(--home-services-panel-lift-y), 0) scale(var(--home-services-panel-scale));');
    expect(cssSource).toContain('.home-native-services {');
    expect(cssSource).toContain('padding: clamp(3.6rem, 7.8vw, 5.7rem) 0 clamp(2.6rem, 5.6vw, 4rem);');
    expect(cssSource).toContain('.home-services-feature-panel-frame {');
    expect(cssSource).toContain('overflow: clip;');
    expect(cssSource).toContain('min-height: clamp(16rem, 24vw, 21rem);');
    expect(cssSource).toContain('padding-top: clamp(3.05rem, 4.8vw, 4.25rem);');
    expect(cssSource).toContain('padding-bottom: clamp(2.45rem, 4vw, 3.35rem);');
    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: end;');
    expect(cssSource).toContain('text-align: right;');
    expect(cssSource).toContain('p.home-services-feature-panel-body {');
    expect(cssSource).toContain('width: min(100%, 72rem);');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('.home-services-feature-intro,');
    expect(cssSource).toContain('.home-services-feature-panel {');
    expect(cssSource).toContain('transform: none;');
    expect(cssSource).toContain('.home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy,');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('@media (max-width: 640px) {');
    expect(cssSource).toContain('.home-services-feature {');
    expect(cssSource).toContain('padding-bottom: clamp(0.75rem, 2.6vw, 1.1rem);');
    expect(cssSource).toContain('.home-services-feature-panel {');
    expect(cssSource).toContain('border-radius: 24px;');
    expect(cssSource).toContain('0 24px 46px rgba(7, 19, 27, var(--home-services-panel-shadow-opacity))');
    expect(cssSource).toContain('min-height: clamp(14.75rem, 29vw, 19rem);');
    expect(cssSource).toContain('padding-top: clamp(2rem, 6.7vw, 2.7rem);');
    expect(cssSource).toContain('padding-bottom: clamp(1.9rem, 6.4vw, 2.55rem);');
    expect(cssSource).toContain('padding: 0 clamp(0.45rem, 2.4vw, 0.65rem) clamp(3.25rem, 7vw, 4.25rem);');
    expect(cssSource).toContain('.home-native-cta-form-wrap {');
    expect(cssSource).toContain('padding: clamp(1.25rem, 2.8vw, 2rem) 0 clamp(2.4rem, 5vw, 3.8rem);');
    expect(cssSource).toContain('padding: clamp(1.35rem, 5vw, 1.9rem) 0 clamp(2rem, 6vw, 2.6rem);');
  });

  it('keeps the home services typography contract pinned to the shared Typekit avenir stack', () => {
    const cssSource = readSource('../styles/home-native.css');
    const tokenSource = readSource('../styles/tokens.css');
    const appStylesSource = readSource('../styles.css');

    expect(tokenSource).toContain("--ag-font-heading: 'avenir-next-world', 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif;");
    expect(appStylesSource).toContain("@import url('https://use.typekit.net/nmy3epc.css');");
    expect(cssSource).toContain('h3.home-services-feature-panel-title {');
    expect(cssSource).toContain('font-size: clamp(4.55rem, 10.3vw, 9.95rem);');
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
    expect(cssSource).toContain('--home-services-panel-title-color: #ffffff;');
    expect(cssSource).toContain('--home-services-card-accent: var(--ag-color-atlantean);');
    expect(cssSource).toContain('--home-services-preview-bg-lift: calc((var(--home-services-intro-bottom-padding) + var(--home-services-intro-shell-gap)) * 0.5);');
    expect(cssSource).toContain('color-mix(in srgb, var(--ag-color-atlantean) 72%, #8ce3eb 28%) 0%');
    expect(cssSource).toContain('color-mix(in srgb, var(--ag-color-atlantean-dark) 88%, #07131b 12%) 100%');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-current {');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-next {');
    expect(cssSource).toContain('background-color: rgb(var(--home-services-base-rgb));');
    expect(cssSource).toContain('rgba(var(--home-services-dark-rgb), 0.22) 100%');
    expect(cssSource).toContain('rgba(var(--home-services-layer-secondary-rgb), 0.18)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-accent-rgb), 0.08)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-dark-rgb), calc(var(--home-services-dark-strength) * 0.18))');
    expect(cssSource).toContain(".home-services-feature-shell.is-preview-white-cards .home-services-feature-panel[data-proof-index='3'] {");
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-list::before {');
    expect(cssSource).toContain('width: 100vw;');
    expect(cssSource).toContain('transform: translateX(-50%);');
    expect(cssSource).toContain('border-radius: 0;');
    expect(cssSource).toContain('var(--home-services-preview-sheen),');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('border-color: transparent;');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.143));');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-panel-gradient-layer,');
    expect(cssSource).not.toContain('--home-services-panel-bg:');
    expect(componentSource).toContain('const HOME_SERVICES_PANEL_PALETTES = Object.freeze([');
    expect(componentSource).toContain('const HOME_SERVICES_PALETTE_HANDOFF_CURVES = Object.freeze({');
    expect(componentSource).toContain('const HOME_SERVICES_PANEL_MOTION_PROFILES = Object.freeze({');
    expect(componentSource).toContain('scale: Object.freeze([0.972, 1.016])');
    expect(componentSource).toContain('scale: Object.freeze([0.976, 1.084])');
    expect(componentSource).toContain('secondary: Object.freeze([248, 145, 122])');
    expect(componentSource).toContain('secondary: Object.freeze([255, 205, 118])');
    expect(componentSource).toContain("className: 'service-native-btn is-outline is-tone-white home-services-feature-btn'");
    expect(componentSource).toContain('className="home-services-feature-shell is-preview-white-cards"');
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
    expect(cssSource).toContain('min-height: 50vh;');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('clamp(1.85rem, 4.5vh, 3rem)');
    expect(cssSource).toContain('clamp(0.58rem, 1.55vh, 0.95rem)');
  });

  it('keeps intro reveal and panel motion on shell-level vars instead of per-content translation', () => {
    const cssSource = readSource('../styles/home-native.css');
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');

    expect(cssSource).toContain('opacity: var(--home-services-intro-opacity, 0);');
    expect(cssSource).toContain('transform: translate3d(0, var(--home-services-intro-shift-y, 58px), 0) scale(var(--home-services-intro-scale, 0.92));');
    expect(cssSource).toContain('--home-services-intro-top-space: clamp(5.75rem, 13vw, 13rem);');
    expect(cssSource).toContain('--home-services-intro-bottom-padding: clamp(2rem, 3.8vw, 3.25rem);');
    expect(cssSource).toContain('margin-top: var(--home-services-intro-cue-offset);');
    expect(componentSource).toContain('introNode.style.setProperty(\'--home-services-intro-opacity\'');
    expect(componentSource).toContain('panel.style.setProperty(\'--home-services-panel-scale\'');
    expect(componentSource).toContain('const motionProfile = resolvePanelMotionProfile(viewportWidth);');
    expect(componentSource).toContain('focusPoint: 0.38');
    expect(componentSource).toContain('startViewport: 0.82');
    expect(componentSource).toContain('endViewport: 0.56');
    expect(componentSource).toContain('requestMotionFrame();');
    expect(componentSource).not.toContain('panel.style.setProperty(\'--home-services-content-scale\'');
  });
});
