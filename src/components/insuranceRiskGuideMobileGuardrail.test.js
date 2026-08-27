import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('insurance risk guide mobile layout guardrail', () => {
  it('uses the shared do-the-math columns mobile contract', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) clamp(22.5rem, 34vw, 26rem);');
    expect(cssSource).toContain('@media (max-width: 760px) {');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-grid {\n    grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-item:not(.is-photo) .native-columns-copy {');
    expect(cssSource).toContain('padding-bottom: clamp(1.6rem, 7vw, 2.7rem);');
    expect(cssSource).not.toContain('.native-info-page--insurance .insurance-native-risk .service-native-dark-feature');
  });
});
