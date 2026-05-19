import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('legacy giving review polish guardrail', () => {
  it('keeps the route-specific wills spacing and mobile opportunity collapse scoped to legacy giving', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-wills {');
    expect(cssSource).toContain('padding-top: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('padding-top: clamp(2.8rem, 7.8vw, 3.5rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-copy {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('min-width: 0;');
  });

  it('keeps the legacy giving route wired to the comparison widget and the opportunity feature block', () => {
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("className: 'legacy-giving-comparison-matrix'");
    expect(contentSource).toContain("widget: 'giving-comparison-matrix'");
    expect(contentSource).toContain("className: 'legacy-giving-opportunity'");
  });
});
