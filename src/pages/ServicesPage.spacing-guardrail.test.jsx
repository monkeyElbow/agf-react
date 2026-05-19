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
  it('keeps the services overview intro title oversized with extra bottom breathing room', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-native-intro {');
    expect(cssSource).toContain('padding: clamp(4rem, 8.2vw, 6.4rem) 0 clamp(7.2rem, 14vw, 12.4rem);');
    expect(cssSource).toContain('.services-native-intro h2 {');
    expect(cssSource).toContain('font-size: clamp(3.7rem, 8.8vw, 6.85rem);');
    expect(cssSource).toContain('@media (max-width: 767px) {');
    expect(cssSource).toContain('padding: clamp(3.5rem, 11vw, 4.4rem) 0 clamp(5.2rem, 14vw, 6.8rem);');
    expect(cssSource).toContain('font-size: clamp(3.35rem, 11.8vw, 4.5rem);');
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
});
