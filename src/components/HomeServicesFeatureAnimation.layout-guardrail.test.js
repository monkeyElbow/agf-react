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
  it('keeps the home services typography contract pinned to the shared Typekit avenir stack', () => {
    const cssSource = readSource('../styles/home-native.css');
    const tokenSource = readSource('../styles/tokens.css');
    const appStylesSource = readSource('../styles.css');

    expect(tokenSource).toContain("--ag-font-heading: 'avenir-next-world', 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif;");
    expect(appStylesSource).not.toContain("@import url('https://use.typekit.net/nmy3epc.css');");
    expect(readSource('../../index.html')).toContain('https://use.typekit.net/nmy3epc.css');
    expect(cssSource).toContain('h3.home-services-feature-panel-title {');
    expect(cssSource).toContain('font-size: clamp(4.1rem, 9.45vw, 8.9rem);');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('font-synthesis: none;');
    expect(cssSource).toContain('letter-spacing: -0.05em;');
    expect(cssSource).toContain('text-rendering: geometricPrecision;');
    expect(cssSource).toContain('p.home-services-feature-panel-body {');
    expect(cssSource).toContain('font-family: var(--ag-font-helv);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('-webkit-font-smoothing: antialiased;');
  });

  it('keeps the shared panel bokeh engine while letting the preview-white-cards stage sit on a neutral white field', () => {
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
    expect(cssSource).toContain('--home-services-preview-bg-lift: calc((var(--home-services-intro-bottom-padding) + var(--home-services-intro-shell-gap)) * 0.32);');
    expect(cssSource).toContain('--home-services-preview-surface: #ffffff;');
    expect(cssSource).toContain('--home-services-preview-sheen: none;');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-stage {');
    expect(cssSource).toContain('overflow-x: clip;');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-stage-bg {');
    expect(cssSource).toContain('position: sticky;');
    expect(cssSource).toContain('height: 100vh;');
    expect(cssSource).toContain('margin: 0 calc(50% - 50vw) -100vh;');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-current {');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-next {');
    expect(cssSource).toContain('background-color: rgb(var(--home-services-base-rgb));');
    expect(cssSource).toContain('rgba(var(--home-services-dark-rgb), 0.22) 100%');
    expect(cssSource).toContain('rgba(var(--home-services-layer-secondary-rgb), 0.18)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-accent-rgb), 0.08)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-dark-rgb), calc(var(--home-services-dark-strength) * 0.18))');
    expect(cssSource).toContain(".home-services-feature-shell.is-preview-white-cards .home-services-feature-panel[data-proof-index='3'] {");
    expect(cssSource).not.toContain('var(--home-services-preview-sheen),');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('border-color: transparent;');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('filter: none;');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-panel-gradient-layer,');
    expect(cssSource).toContain('opacity: var(--home-services-panel-opacity);');
    expect(cssSource).not.toContain('--home-services-panel-bg:');
    expect(componentSource).toContain('const HOME_SERVICES_PANEL_PALETTES = Object.freeze([');
    expect(componentSource).toContain('const HOME_SERVICES_PALETTE_HANDOFF_CURVES = Object.freeze({');
    expect(componentSource).toContain('const HOME_SERVICES_PANEL_MOTION_PROFILES = Object.freeze({');
    expect(componentSource).toContain('scale: Object.freeze([0.892, 1.024])');
    expect(componentSource).toContain('opacity: Object.freeze([0.52, 1])');
    expect(componentSource).toContain('focusViewport: 0.54');
    expect(componentSource).toContain('focusLift: 34');
    expect(componentSource).toContain('holdZone: 0.32');
    expect(componentSource).toContain('scale: Object.freeze([0.91, 1.072])');
    expect(componentSource).toContain('opacity: Object.freeze([0.6, 1])');
    expect(componentSource).toContain('focusViewport: 0.56');
    expect(componentSource).toContain('focusLift: 20');
    expect(componentSource).toContain('holdZone: 0.34');
    expect(componentSource).toContain('secondary: Object.freeze([248, 145, 122])');
    expect(componentSource).toContain('secondary: Object.freeze([255, 205, 118])');
    expect(componentSource).toContain("className: 'service-native-btn is-tone-atlantean home-services-feature-btn'");
    expect(componentSource).toContain('className="home-services-feature-shell is-preview-white-cards"');
    expect(componentSource).toContain('className="home-services-feature-stage"');
    expect(componentSource).toContain('className="home-services-feature-stage-bg"');
    expect(componentSource).toContain('function resolveHoldCurve(');
    expect(componentSource).toContain('function resolveHeldOffset(');
    expect(componentSource).toContain(".split(/\\r?\\n/)");
    expect(componentSource).toContain("is-impact-mango-gradient");
    expect(componentSource).toContain('applyPaletteVars(panel, currentPalette);');
    expect(componentSource).toContain("applyPaletteVars(panel, nextPalette, 'next');");
  });

  it('keeps the current runtime order and palette handoff aligned to rendered panel order', () => {
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');

    expect(catalogSource.indexOf("title: 'Loans'")).toBeLessThan(catalogSource.indexOf("title: 'Investments'"));
    expect(catalogSource.indexOf("title: 'Investments'")).toBeLessThan(catalogSource.indexOf("title: 'Retirement'"));
    expect(catalogSource.indexOf("title: 'Retirement'")).toBeLessThan(catalogSource.indexOf("title: 'Planned Giving'"));
    expect(catalogSource.indexOf("title: 'Planned Giving'")).toBeLessThan(catalogSource.indexOf("title: 'Insurance'"));
    expect(componentSource).toContain('const currentPalette = resolveHomeServicesPalette(index);');
    expect(componentSource).toContain('const nextPalette = resolveHomeServicesPalette(Math.min(panelNodes.length - 1, index + 1));');
    expect(componentSource).toContain('const paletteHandoff = index < panelNodes.length - 1');
  });

  it('keeps the hero visually suppressed on home while the feature intro gets the requested desktop runway', () => {
    const cssSource = readSource('../styles/home-native.css');
    const pageSource = readSource('../pages/HomePage.jsx');
    const resolverSource = readSource('../lib/homeBlockResolver.js');

    expect(pageSource).toContain("const HOME_HERO_TEMPORARILY_HIDDEN = false;");
    expect(resolverSource).toContain('return reorderHomeTopBlocks(resolvedBlocks);');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden [data-block-id="hero"] {');
    expect(cssSource).toContain('display: none;');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden .home-impact-story-stage {');
    expect(cssSource).toContain('min-height: calc(100vh - clamp(12.25rem, 20vh, 14.5rem));');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden .home-services-feature-intro {');
    expect(cssSource).toContain('min-height: 42vh;');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('clamp(3rem, 9vh, 4.5rem)');
    expect(cssSource).toContain('clamp(0.9rem, 2.3vh, 1.35rem)');
  });

  it('keeps intro reveal and panel motion on shell-level vars instead of per-content translation', () => {
    const cssSource = readSource('../styles/home-native.css');
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');

    expect(cssSource).toContain('opacity: var(--home-services-intro-opacity, 0);');
    expect(cssSource).toContain('transform: translate3d(0, var(--home-services-intro-shift-y, 58px), 0) scale(var(--home-services-intro-scale, 0.92));');
    expect(cssSource).toContain('--home-services-intro-top-space: clamp(6rem, 13vw, 12.5rem);');
    expect(cssSource).toContain('--home-services-intro-bottom-padding: clamp(0.55rem, 1.35vw, 0.95rem);');
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
