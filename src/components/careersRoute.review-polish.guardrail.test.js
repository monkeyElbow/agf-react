import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('careers route review polish guardrail', () => {
  it('keeps negative tracking on the Ready and Work Matters section titles only on the careers route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--careers .careers-native-ready .native-info-section-copy > h2 {');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-matters .native-info-section-copy > h2 {');
    expect(cssSource).toContain('letter-spacing: -0.03em;');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-ready > .ag-panel-rail {');
    expect(cssSource).toContain('align-content: center;');
    expect(cssSource).toContain('padding-bottom: clamp(1.65rem, 3vw, 2.35rem);');
    expect(cssSource).toContain('min-height: clamp(176px, 16vw, 218px);');
    expect(cssSource).toContain('white-space: nowrap;');
  });

  it('keeps the careers hero emphasis scoped to the shared native hero path without a special final-line treatment', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("{ title: 'Be part of', className: 'careers-hero-line is-mango' }");
    expect(contentSource).toContain("{ title: 'something', className: 'careers-hero-line is-mango' }");
    expect(contentSource).toContain("className: 'careers-hero-line careers-hero-line--major is-mango'");
    expect(contentSource).toContain("bgTone: 'white'");
    expect(cssSource).toContain('.native-info-page--careers .service-native-hero h1.careers-hero-line {');
    expect(cssSource).not.toContain('.native-info-page--careers .service-native-hero h1.careers-hero-line--major {');
    expect(cssSource).not.toContain('transform: scale(1.2);');
  });

  it('keeps the careers benefits-to-ready background progress and observed enter reveals wired in source', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');
    const pageSource = readSource('./NativeContentPage.jsx');

    expect(contentSource).toContain("copyClassName: 'careers-native-ready-copy fade-up fade-up-force-observe'");
    expect(contentSource).toContain("headingClassName: 'careers-native-top-intro-heading fade-up fade-up-force-observe fade-up-no-shift'");
    expect(contentSource).toContain("emphasisClassName: 'careers-native-top-intro-emphasis fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up'");
    expect(cssSource).toContain('.native-info-page--careers .service-native-intro.careers-native-top-intro .native-info-intro-emphasis.billboard-scroll-reveal-scale-up {');
    expect(cssSource).toContain('.native-info-page--careers .service-native-intro.careers-native-top-intro .native-info-intro-emphasis.billboard-scroll-reveal-scale-up[data-fade-state="pending"] {');
    expect(contentSource).toContain("title: 'A few reasons you’ll love working here…'");
    expect(contentSource).toContain("titleClassName: 'loans-native-display-heading careers-native-benefits-title careers-native-benefits-title--roll fade-up fade-up-force-observe'");
    expect(cssSource).toContain('--careers-benefits-ready-progress: 0;');
    expect(cssSource).toContain('.service-native-page .fade-up.fade-up-no-shift[data-fade-state="pending"] {');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-benefits > .native-info-full-bleed > h2.careers-native-benefits-title {');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-benefits > .native-info-full-bleed > h2.careers-native-benefits-title--roll[data-fade-state="pending"] {');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-ready .native-info-section-copy > h2,');
    expect(cssSource).toContain('color: #ffffff;');
    expect(pageSource).toContain("const benefitsHeading = benefitsSection?.querySelector('h2');");
    expect(pageSource).toContain("const readyHeading = readySection?.querySelector('h2');");
    expect(pageSource).toContain('const endY = readyHeadingMid - (viewportHeight * 0.72);');
    expect(pageSource).toContain("root.style.setProperty('--careers-benefits-ready-progress', progress.toFixed(3));");
  });

  it('keeps the ADP apply link scoped to the careers jobs list action row rather than turning the whole card into a stretched link', () => {
    const rendererSource = readSource('./nativeFunctionalRouteRenderers.jsx');

    expect(rendererSource).toContain('<article key={job.id || job.title} className="careers-native-job">');
    expect(rendererSource).toContain('<div className="service-native-action-row is-centered">');
    expect(rendererSource).toContain('className="service-native-btn is-outline is-tone-atlantean"');
    expect(rendererSource).not.toContain('careers-native-job service-native-card has-stretched-link');
  });
});
