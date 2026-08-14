import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('Vision fuel billboard typography guardrail', () => {
  it('keeps the short headline open, the subtitle on one desktop line, and the supporting copy readable', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.loans-native-vision-fuel {');
    expect(cssSource).toContain('--dynamic-billboard-copy-max-width: 64rem;');
    expect(cssSource).toContain('letter-spacing: -0.012em !important;');
    expect(cssSource).toContain('.loans-native-vision-fuel .native-info-section-subtitle {');
    expect(cssSource).toContain('white-space: nowrap;');
    expect(cssSource).toContain('.service-native-section.dynamic-billboard.loans-native-vision-fuel .native-info-rich-html p {');
    expect(cssSource).toContain('font-size: clamp(1.35rem, 2.3vw, 1.8rem);');
    expect(cssSource).toContain('@media (max-width: 760px) {');
    expect(cssSource).toContain('white-space: normal;');
  });
});
