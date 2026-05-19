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
    expect(cssSource).toContain('.investments-native-growth-card h3 {');
    expect(cssSource).toContain('font-size: clamp(5.75rem, 9.95vw, 7.875rem);');
    expect(cssSource).toContain('letter-spacing: -0.055em;');
    expect(cssSource).toContain('text-wrap: balance;');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('font-size: clamp(4.95rem, 14vw, 5.65rem);');
  });

  it('keeps the already investor dashboard band on lead-copy sizing with tightened title tracking', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.investments-native-dashboard-title {');
    expect(cssSource).toContain('letter-spacing: -0.05em;');
    expect(cssSource).toContain('.service-native-cta-band.is-cta-band-preset-dashboard-login .investments-native-dashboard-title + p {');
    expect(cssSource).toContain('font-size: clamp(1.4rem, 2.8vw, 1.85rem);');
  });
});
