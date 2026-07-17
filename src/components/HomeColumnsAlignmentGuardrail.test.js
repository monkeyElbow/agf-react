import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home columns alignment guardrail', () => {
  it('sizes the home feature media track to the actual photo footprint so text and photo edges share the same rail', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance,');
    expect(cssSource).toContain('--dynamic-columns-photo-max-width: 26rem;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-grid {');
    expect(cssSource).toContain('grid-template-columns: clamp(22.5rem, 34vw, 26rem) minmax(0, 1fr);');
    expect(cssSource).toContain('align-items: center;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-item:not(.is-photo) .native-columns-copy {');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) clamp(22.5rem, 34vw, 26rem);');
  });

  it('keeps extra mobile runway under the do-the-math button when the photo stacks beneath the copy', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('@media (max-width: 760px) {');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-item:not(.is-photo) .native-columns-copy {');
    expect(cssSource).toContain('padding-bottom: clamp(1.6rem, 7vw, 2.7rem);');
  });
});
