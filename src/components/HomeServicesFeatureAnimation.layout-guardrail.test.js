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

  it('pins the legacy panel to the warmer brand gradient while retirement uses the shared white body copy', () => {
    const cssSource = readSource('../styles/home-native.css');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');

    expect(catalogSource).toContain("tone: 'legacy-warm'");
    expect(cssSource).toContain('.home-services-feature-panel.is-tone-legacy-warm {');
    expect(cssSource).toContain('--home-services-motion-dark-rgb: 111, 68, 16;');
    expect(cssSource).toContain('linear-gradient(115.58deg, #fff5da 0%, #8f5716 100.22%),');
    expect(cssSource).toContain('radial-gradient(92.72% 100% at 50% 0%, #fff8df 0%, #6f4410 100%),');
    expect(cssSource).toContain('radial-gradient(92.72% 100% at 50% 0%, #f6b146 0%, #8f5716 100%),');
    expect(cssSource).toContain('radial-gradient(109.21% 213.32% at 100% 0%, #e8991f 0%, #fff0c8 100%),');
    expect(cssSource).toContain('linear-gradient(127.43deg, #9f5411 0%, #f6b146 100%);');
    expect(cssSource).toContain('background-blend-mode: normal, overlay, multiply, soft-light, normal;');
    expect(cssSource).not.toContain('.home-services-feature-panel.is-tone-atlantean-dark p.home-services-feature-panel-body {');
  });

  it('pins the investments panel to its dedicated two-layer blue gradient without changing the insurance grey tone', () => {
    const cssSource = readSource('../styles/home-native.css');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');

    expect(catalogSource).toContain("title: 'Investments'");
    expect(catalogSource).toContain("tone: 'investments-blue'");
    expect(cssSource).toContain('.home-services-feature-panel.is-tone-investments-blue {');
    expect(cssSource).toContain('--home-services-motion-light-rgb: var(--ag-color-atlantean-rgb);');
    expect(cssSource).toContain('linear-gradient(90deg, rgba(7, 19, 27, 0.56) 0%, rgba(0, 96, 126, 0.52) 30.21%, rgba(0, 122, 149, 0.52) 44.79%, rgba(0, 148, 170, 0.5) 60.42%, rgba(0, 173, 187, 0.5) 100%),');
    expect(cssSource).toContain('linear-gradient(180deg, #003946 0%, #00546b 13.54%, #007785 32.57%, #008fa0 45.51%, #00a3b2 55.22%, #4bc7d4 67.75%, #86eff6 83.12%, #50c9d5 92.83%, #00adbb 100%);');
    expect(cssSource).toContain('background-blend-mode: overlay, normal;');
  });
});
