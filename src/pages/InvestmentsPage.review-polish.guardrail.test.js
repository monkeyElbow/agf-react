import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments page review polish guardrails', () => {
  it('keeps the Grow section copy and shared display title treatment in the investments route', () => {
    const featureSource = readSource('../components/InvestmentsGrowthFeature.jsx');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(catalogSource).toContain("title: 'Grow your backup plan.'");
    expect(catalogSource).toContain("title: 'Grow the Kingdom.'");
    expect(catalogSource).toContain("surfaceTone: 'blue'");
    expect(featureSource).toContain('data-investments-growth-background-panel={panel.surfaceTone}');
    expect(featureSource).toContain('className="investments-native-build-title-line"');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-blue {');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-mango {');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-white {');
    expect(cssSource).toContain('padding-top: clamp(4.35rem, 7.8vw, 6.65rem);');
    expect(cssSource).toContain('padding-bottom: clamp(4.05rem, 7.2vw, 6.1rem);');
    expect(cssSource).toContain('max-width: min(13.4ch, 100%);');
    expect(cssSource).toContain('--investments-growth-display-size: clamp(3.7rem, 9vw, 6.2rem);');
    expect(cssSource).toContain('--investments-growth-display-letter-spacing: clamp(-0.051em, -0.036vw, -0.032em);');
    expect(cssSource).toContain('overflow-wrap: normal;');
    expect(cssSource).toContain('.investments-native-build-title .investments-native-build-title-line {');
    expect(cssSource).toContain('.investments-native-growth-card h3 {');
    expect(cssSource).toContain('font-size: var(--investments-growth-display-size);');
    expect(cssSource).toContain('letter-spacing: var(--investments-growth-display-letter-spacing);');
    expect(cssSource).toContain('text-wrap: balance;');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('--investments-growth-display-size: clamp(3rem, 13vw, 4.25rem);');
    expect(cssSource).toContain('max-width: min(11.2ch, 100%);');
    expect(cssSource).toContain('white-space: normal;');
  });

  it('keeps the already investor dashboard copy styling when the content is reused as the final growth slide', () => {
    const featureSource = readSource('../components/InvestmentsGrowthFeature.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(featureSource).toContain('investments-native-growth-card--investor investments-native-dashboard-billboard');
    expect(featureSource).toContain('billboard-scroll-progress-copy');
    expect(featureSource).toContain('service-native-btn is-outline is-tone-atlantean');
    expect(featureSource).toContain("blockId = 'growth_feature'");
    expect(featureSource).toContain('investments-native-dashboard-billboard--final');
    expect(cssSource).toContain('.investments-native-dashboard-title {');
    expect(cssSource).toContain('margin: 0;');
    expect(cssSource).toContain('.investments-native-growth-card--investor .investments-native-dashboard-title {');
    expect(cssSource).toContain('.investments-native-growth-card--investor .native-info-section-copy.billboard-scroll-progress-copy {');
    expect(cssSource).toContain('.investments-native-dashboard-billboard .native-info-rich-html p {');
    expect(cssSource).toContain('font-size: clamp(1.4rem, 2.8vw, 1.85rem);');
  });

  it('keeps the CTA form below the Grow feature on the canonical cta_form renderer path', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain('blocks={[renderedCtaFormBlock]}');
    expect(pageSource).toContain('ownershipPathname="/services/investments"');
    expect(pageSource).not.toContain('<DynamicCtaSection');
    expect(cssSource).toContain('.investments-native-page .service-native-section.native-dynamic-cta[data-block-id="cta_form"] > .ag-panel-rail > .native-info-inline-form {');
    expect(cssSource).toContain('.investments-native-page .service-native-section.native-dynamic-cta[data-block-id="cta_form"] .dynamic-cta-form-callout {');
  });

  it('keeps the investments intro body and followup line on the shared intro type scale', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain('service-native-intro investments-native-intro');
    expect(cssSource).not.toContain('.investments-native-intro h2 {');
    expect(cssSource).toContain('.investments-native-intro p {');
    expect(cssSource).toContain('font-size: var(--service-native-intro-body-size);');
    expect(cssSource).toContain('.investments-native-intro-tagline {');
    expect(cssSource).toContain('font-size: var(--service-native-intro-emphasis-size);');
  });

  it('reveals investment certificate cards individually instead of fading the whole grid as one block', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain('className="service-native-grid is-two investments-native-cert-grid"');
    expect(pageSource).not.toContain('className="service-native-grid is-two investments-native-cert-grid fade-out"');
    expect(pageSource).toContain('fade-up fade-up-force-observe');
    expect(cssSource).toContain('clamp(1.18rem, 2.45vw, 1.42rem)');
    expect(cssSource).toContain('margin: 0 0 clamp(0.8rem, 1.75vw, 1.1rem);');
    expect(cssSource).toContain('font-size: clamp(1.9rem, 3.35vw, 2.45rem);');
    expect(cssSource).toContain('clamp(0.62rem, 1.32vw, 0.78rem)');
    expect(cssSource).toContain('padding-top: clamp(1.45rem, 6.2vw, 1.9rem);');
    expect(cssSource).toContain('padding-bottom: clamp(0.68rem, 2.9vw, 0.86rem);');
    expect(cssSource).toContain('margin-bottom: clamp(1rem, 4.2vw, 1.3rem);');
    expect(cssSource).toContain('font-size: clamp(2rem, 9.1vw, 2.45rem);');
  });

  it('keeps the ladder calculator as one cohesive calculator zone with ladder-owned result sheets', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain('data-ladder-intro');
    expect(pageSource).toContain('Initial setup');
    expect(pageSource).toContain('Initial ladder setup');
    expect(pageSource).toContain('data-ladder-mini-axis-label');
    expect(pageSource).toContain('data-ladder-mini-maturity-marker');
    expect(pageSource).toContain('Start with equal investments across 1-year through');
    expect(pageSource).toContain('This view shows the starting ladder. Open the timeline to see how maturities roll forward.');
    expect(pageSource).toContain('View ongoing rollover timeline');
    expect(pageSource).toContain('className="investments-native-ladder-table-shell"');
    expect(pageSource).toContain('className="investments-native-ladder-mobile-sheet"');
    expect(pageSource).not.toContain('investments-native-ladder-process-line');
    expect(pageSource).not.toContain('ag-table has-fixed-layout investments-native-ladder-table');
    expect(cssSource).toContain('.investments-native-ladder-result-sheet {');
    expect(cssSource).toContain('.investments-native-ladder-result-sheet::before {');
    expect(cssSource).toContain('.investments-native-ladder-table-shell {');
    expect(cssSource).toContain('.investments-native-ladder-mobile-sheet {');
    expect(cssSource).toContain('.investments-native-ladder-mini-heading {');
    expect(cssSource).toContain('.investments-native-ladder-preview-note {');
    expect(cssSource).toContain('.investments-native-ladder-status.is-cash {');
  });
});
