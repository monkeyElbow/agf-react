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
    expect(cssSource).toContain('overflow-x: clip;');
    expect(cssSource).toContain('.home-services-feature-shell {');
    expect(cssSource).toContain('--home-services-intro-top-space: clamp(6rem, 13vw, 12.5rem);');
    expect(cssSource).toContain('--home-services-intro-shell-gap: clamp(2.2rem, 4.2vw, 3.9rem);');
    expect(cssSource).toContain('--home-services-intro-cue-offset: clamp(0.82rem, 2.05vw, 1.8rem);');
    expect(cssSource).toContain('--home-services-panel-gap: clamp(0.675rem, 1.1vw, 1.125rem);');
    expect(cssSource).toContain('--home-services-panel-gap: clamp(0.34rem, 0.72vw, 0.58rem);');
    expect(cssSource).toContain('gap: var(--home-services-intro-shell-gap);');
    expect(cssSource).toContain('.home-services-feature-stage {');
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
    expect(cssSource).toContain('min-height: clamp(13.15rem, 19vw, 16.25rem);');
    expect(cssSource).toContain('padding-top: clamp(2.35rem, 3.7vw, 3.25rem);');
    expect(cssSource).toContain('padding-bottom: clamp(1.9rem, 3.08vw, 2.6rem);');
    expect(cssSource).toContain('.home-services-feature-panel.is-right .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: end;');
    expect(cssSource).toContain('text-align: right;');
    expect(cssSource).toContain('p.home-services-feature-panel-body {');
    expect(cssSource).toContain('width: min(100%, 72rem);');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('--home-services-panel-body-color: #ffffff;');
    expect(cssSource).toContain('gap: clamp(1.45rem, 2.15vw, 2.15rem);');
    expect(cssSource).toContain('gap: clamp(0.85rem, 1.35vw, 1.3rem);');
    expect(cssSource).toContain('.home-services-feature-panel.is-left .home-services-feature-panel-copy {');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('.home-services-feature-heading-line {');
    expect(cssSource).toContain('.home-services-feature-heading-text.is-impact-mango-gradient {');
    expect(cssSource).toContain('--home-impact-metric-top: #ffd27a;');
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
    expect(cssSource).toContain('min-height: clamp(11.5rem, 22vw, 13.75rem);');
    expect(cssSource).toContain('padding-top: clamp(1.7rem, 5.2vw, 2.15rem);');
    expect(cssSource).toContain('padding-bottom: clamp(1.45rem, 4.6vw, 1.95rem);');
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
    expect(cssSource).toContain('--home-services-preview-bg-lift: calc((var(--home-services-intro-bottom-padding) + var(--home-services-intro-shell-gap)) * 0.32);');
    expect(cssSource).toContain('circle at 16% 18%');
    expect(cssSource).toContain('linear-gradient(');
    expect(cssSource).toContain('145deg');
    expect(cssSource).toContain('color-mix(in srgb, var(--ag-color-atlantean) 76%, #8ce3eb 24%) 0%');
    expect(cssSource).toContain('color-mix(in srgb, var(--ag-color-atlantean-dark) 86%, #07131b 14%) 100%');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-stage {');
    expect(cssSource).toContain('overflow-x: clip;');
    expect(cssSource).toContain('.home-services-feature-shell.is-preview-white-cards .home-services-feature-stage-bg {');
    expect(cssSource).toContain('position: sticky;');
    expect(cssSource).toContain('height: 100vh;');
    expect(cssSource).toContain('margin: 0 calc(50% - 50vw) -100vh;');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-current {');
    expect(cssSource).toContain('.home-services-feature-panel-gradient-layer.is-next {');
    expect(cssSource).toContain('background-color: rgb(var(--home-services-base-rgb));');
    expect(cssSource).toContain('rgba(var(--home-services-dark-rgb), 0.22) 100%');
    expect(cssSource).toContain('rgba(var(--home-services-layer-secondary-rgb), 0.18)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-accent-rgb), 0.08)');
    expect(cssSource).toContain('rgba(var(--home-services-layer-dark-rgb), calc(var(--home-services-dark-strength) * 0.18))');
    expect(cssSource).toContain(".home-services-feature-shell.is-preview-white-cards .home-services-feature-panel[data-proof-index='3'] {");
    expect(cssSource).toContain('var(--home-services-preview-sheen),');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('border-color: transparent;');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.143));');
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
    expect(componentSource).toContain("className: 'service-native-btn is-outline is-tone-white home-services-feature-btn'");
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
    expect(cssSource).toContain('min-height: calc(100vh - clamp(12.25rem, 20vh, 14.5rem));');
    expect(cssSource).toContain('.home-native-page.is-home-hero-temporarily-hidden .home-services-feature-intro {');
    expect(cssSource).toContain('min-height: 44vh;');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('clamp(3.4rem, 7.2vh, 5.6rem)');
    expect(cssSource).toContain('clamp(1rem, 2.4vh, 1.5rem)');
  });

  it('keeps intro reveal and panel motion on shell-level vars instead of per-content translation', () => {
    const cssSource = readSource('../styles/home-native.css');
    const componentSource = readSource('./HomeServicesFeatureAnimation.jsx');

    expect(cssSource).toContain('opacity: var(--home-services-intro-opacity, 0);');
    expect(cssSource).toContain('transform: translate3d(0, var(--home-services-intro-shift-y, 58px), 0) scale(var(--home-services-intro-scale, 0.92));');
    expect(cssSource).toContain('--home-services-intro-top-space: clamp(6rem, 13vw, 12.5rem);');
    expect(cssSource).toContain('--home-services-intro-bottom-padding: clamp(2.05rem, 3.7vw, 3.05rem);');
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
