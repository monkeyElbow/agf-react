import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('insurance overview review polish guardrail', () => {
  it('keeps the blue product-card treatment and quote heading polish scoped to the insurance overview route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage .service-native-card {');
    expect(cssSource).toContain('linear-gradient(138deg, rgba(7, 53, 81, 0.98) 0%, rgba(0, 117, 149, 0.98) 55%, rgba(0, 173, 187, 0.9) 100%);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-coverage > .ag-panel-rail > .service-native-action-row {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-quote h2 {');
    expect(cssSource).toContain('letter-spacing: -0.06em;');
    expect(cssSource).toContain('line-height: 0.76;');
    expect(cssSource).toContain('margin-bottom: 1.2rem;');
  });
});
