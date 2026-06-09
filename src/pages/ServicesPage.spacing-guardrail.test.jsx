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

    expect(cssSource).toContain('.services-pie-header {');
    expect(cssSource).toContain('.services-pie-interactive-shell {');
    expect(cssSource).toContain('.services-pie-hero-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1.24fr) minmax(300px, 0.82fr);');
    expect(cssSource).toContain('.services-pie-card {');
    expect(cssSource).toContain('border-radius: 26px;');
    expect(cssSource).toContain('.services-pie-selector {');
    expect(cssSource).toContain('.services-pie-pill {');
    expect(cssSource).toContain('.services-native-intro {');
    expect(cssSource).toContain('padding: clamp(2.45rem, 5.2vw, 3.85rem) 0 clamp(3rem, 6.2vw, 4.9rem);');
    expect(cssSource).toContain('.services-native-intro h2 {');
    expect(cssSource).toContain('font-size: clamp(2.65rem, 6vw, 4.55rem);');
  });

  it('keeps the services card sub-lists slightly larger without crowding the single-column mobile stack', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-native-card ul {');
    expect(cssSource).toContain('gap: 0.28rem;');
    expect(cssSource).toContain('.services-native-card li a,');
    expect(cssSource).toContain('font-size: clamp(1.03rem, 1.15vw, 1.1rem);');
    expect(cssSource).toContain('line-height: 1.42;');
    expect(cssSource).toContain('.services-native-card li a:visited {');
    expect(cssSource).toContain('font-size: 1rem;');
    expect(cssSource).toContain('line-height: 1.38;');
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
