import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('mobile overflow source guardrails', () => {
  it('keeps shared table scrollers constrained to their own box instead of widening the page', () => {
    const stylesSource = readSource('../styles.css');
    const serviceStylesSource = readSource('../styles/service-native.css');

    expect(stylesSource).toContain('.table-scroll {');
    expect(stylesSource).toContain('width: 100%;');
    expect(stylesSource).toContain('max-width: 100%;');
    expect(stylesSource).toContain('min-width: 0;');
    expect(stylesSource).toContain('overflow-x: auto;');
    expect(stylesSource).toContain('overflow-y: hidden;');
    expect(stylesSource).toContain('overscroll-behavior-x: contain;');
    expect(serviceStylesSource).toContain('.native-info-table-wrap {');
    expect(serviceStylesSource).toContain('max-width: 100%;');
    expect(serviceStylesSource).toContain('min-width: 0;');
    expect(serviceStylesSource).toContain('.loans-native-table-scroll {');
    expect(serviceStylesSource).toContain('overflow-x: auto;');
  });

  it('keeps the shared service page shell clipped on mobile as a backup containment layer', () => {
    const serviceStylesSource = readSource('../styles/service-native.css');

    expect(serviceStylesSource).toContain('@media (max-width: 980px) {');
    expect(serviceStylesSource).toContain('.service-native-page {');
    expect(serviceStylesSource).toContain('overflow-x: clip;');
  });
});
