import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('services page spacing and typography guardrail', () => {
  it('keeps the services wheel as a branded two-column shell with a compact payoff band below it', () => {
    const cssSource = readSource('../styles/home-native.css');
    const serviceCssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.services-pie-header {');
    expect(cssSource).toContain('.services-pie-interactive-shell {');
    expect(cssSource).toContain('.services-pie-hero-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1.24fr) minmax(300px, 0.82fr);');
    expect(cssSource).toContain('.services-pie-card {');
    expect(cssSource).toContain('border-radius: 26px;');
    expect(cssSource).toContain('.services-pie-card .service-native-btn {');
    expect(cssSource).toContain('margin-top: 0.75rem;');
    expect(cssSource).toContain('.services-pie-selector {');
    expect(cssSource).toContain('.services-pie-pill {');
    expect(cssSource).toContain('.services-native-intro {');
    expect(cssSource).toContain('padding: clamp(2.45rem, 5.2vw, 3.85rem) 0 clamp(3rem, 6.2vw, 4.9rem);');
    expect(cssSource).toContain('.services-native-intro h2 {');
    expect(cssSource).toContain('font-size: clamp(3.38rem, 7.65vw, 5.8rem);');
    expect(cssSource).toContain('letter-spacing: -0.04em;');
    expect(cssSource).toContain('line-height: 0.89;');
    expect(serviceCssSource).toContain('.services-native-page .services-native-intro.service-native-intro.dynamic-intro .service-native-intro-copy > h2 {');
    expect(serviceCssSource).toContain('font-size: clamp(3.38rem, 7.65vw, 5.8rem);');
    expect(serviceCssSource).toContain('letter-spacing: -0.04em;');
    expect(serviceCssSource).toContain('line-height: 0.89;');
    expect(serviceCssSource).toContain('@media (max-width: 767px) {');
    expect(serviceCssSource).toContain('font-size: clamp(3.19rem, 13.26vw, 4.4rem);');
    expect(serviceCssSource).toContain('line-height: 0.91;');
  });

  it('keeps the services breakdown as a stacked editorial directory with wrapped links and mobile-safe rows', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-breakdown-shell {');
    expect(cssSource).toContain('display: grid;');
    expect(cssSource).toContain('.services-breakdown-header {');
    expect(cssSource).toContain('.services-breakdown-list {');
    expect(cssSource).toContain('.services-breakdown-panel {');
    expect(cssSource).toContain('grid-template-columns: minmax(150px, 0.42fr) minmax(0, 1fr);');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.services-breakdown-panel h3 {');
    expect(cssSource).toContain('grid-row: 1 / span 2;');
    expect(cssSource).toContain('.services-breakdown-description {');
    expect(cssSource).toContain('grid-column: 2;');
    expect(cssSource).toContain('max-width: 38ch;');
    expect(cssSource).toContain('.services-breakdown-links {');
    expect(cssSource).toContain('display: flex;');
    expect(cssSource).toContain('flex-wrap: wrap;');
    expect(cssSource).toContain('justify-content: flex-start;');
    expect(cssSource).toContain('.services-breakdown-links a,');
    expect(cssSource).toContain("content: '→';");
    expect(cssSource).toContain('border-bottom: 1px solid transparent;');
    expect(cssSource).toContain('@media (max-width: 767px) {');
    expect(cssSource).toContain('.services-breakdown-panel {\n    grid-template-columns: 1fr;');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('.services-breakdown-links {\n    grid-column: auto;');
    expect(cssSource).toContain('justify-content: center;');
  });

  it('removes the visible services breakdown eyebrow and relies on a stronger heading', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).not.toContain('.services-breakdown-eyebrow {');
    expect(cssSource).toContain('.services-breakdown-header h2 {');
    expect(cssSource).toContain('font-size: clamp(1.95rem, 3.15vw, 2.55rem);');
  });

  it('keeps titles graphite and links on one consistent Atlantean brand treatment', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-breakdown-panel h3 {');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
    expect(cssSource).toContain('.services-breakdown-links a,');
    expect(cssSource).toContain('color: var(--ag-color-atlantean);');
    expect(cssSource).toContain('.services-breakdown-links a:hover,');
    expect(cssSource).toContain('color: var(--ag-color-atlantean-dark);');
  });

  it('keeps the What you do matters band roomier without changing its route-specific shell', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-native-matters {');
    expect(cssSource).toContain('padding: clamp(3rem, 6vw, 4.8rem) 0 clamp(3.2rem, 6.3vw, 5rem);');
    expect(cssSource).toContain('.services-native-matters h2 {');
  });

  it('keeps the services wheel motion respectful when visitors prefer reduced motion', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('.services-pie-wedge,');
    expect(cssSource).toContain('.services-pie-pill {');
    expect(cssSource).toContain('transition: none;');
  });
});
