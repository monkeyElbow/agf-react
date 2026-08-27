import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('insurance Mission Assure mobile layout guardrail', () => {
  it('uses the shared housing-allowance columns mobile contract', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-grid,');
    expect(cssSource).toContain('grid-template-columns: clamp(22.5rem, 34vw, 26rem) minmax(0, 1fr);');
    expect(cssSource).toContain('@media (max-width: 760px) {');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-grid,');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance .native-columns-media-wrap,');
    expect(cssSource).toContain('width: min(var(--dynamic-columns-photo-max-width, 372px), 100%);');
    expect(cssSource).not.toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature');
  });
});
