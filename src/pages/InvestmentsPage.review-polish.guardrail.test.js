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
  it('keeps the Grow section copy and oversized title treatment in the investments route', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain("title: 'Grow your backup plan.'");
    expect(pageSource).toContain("title: 'Grow the Kingdom.'");
    expect(pageSource).toContain("surfaceTone: 'blue'");
    expect(pageSource).toContain('data-investments-growth-background-panel={card.surfaceTone}');
    expect(pageSource).toContain('className="investments-native-build-title-line"');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-blue {');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-mango {');
    expect(cssSource).toContain('.investments-native-growth-surface-layer.is-white {');
    expect(cssSource).toContain('padding-top: clamp(4.35rem, 7.8vw, 6.65rem);');
    expect(cssSource).toContain('padding-bottom: clamp(4.05rem, 7.2vw, 6.1rem);');
    expect(cssSource).toContain('max-width: min(13.4ch, 100%);');
    expect(cssSource).toContain('letter-spacing: clamp(-0.051em, -0.036vw, -0.032em);');
    expect(cssSource).toContain('overflow-wrap: normal;');
    expect(cssSource).toContain('.investments-native-build-title .investments-native-build-title-line {');
    expect(cssSource).toContain('.investments-native-growth-card h3 {');
    expect(cssSource).toContain('font-size: clamp(5.75rem, 9.95vw, 7.875rem);');
    expect(cssSource).toContain('letter-spacing: -0.055em;');
    expect(cssSource).toContain('text-wrap: balance;');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('font-size: clamp(4.2rem, 12.8vw, 4.95rem);');
    expect(cssSource).toContain('max-width: min(13.2ch, 100%);');
  });

  it('keeps the already investor dashboard copy styling when the content is reused as the final growth slide', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain('investments-native-growth-card--investor investments-native-dashboard-billboard');
    expect(pageSource).toContain('billboard-scroll-progress-copy');
    expect(pageSource).toContain("actionButtonClassName('outline', action.tone || 'atlantean')");
    expect(cssSource).toContain('.investments-native-dashboard-title {');
    expect(cssSource).toContain('margin: 0;');
    expect(cssSource).toContain('.investments-native-growth-card--investor .investments-native-dashboard-title {');
    expect(cssSource).toContain('.investments-native-growth-card--investor .native-info-section-copy.billboard-scroll-progress-copy {');
    expect(cssSource).toContain('.investments-native-growth-card--investor .service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-hover-bg: transparent;');
    expect(cssSource).toContain('.investments-native-dashboard-billboard .native-info-rich-html p {');
    expect(cssSource).toContain('font-size: clamp(1.4rem, 2.8vw, 1.85rem);');
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
