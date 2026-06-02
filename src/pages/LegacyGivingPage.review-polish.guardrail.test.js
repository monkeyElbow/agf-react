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
    expect(cssSource).toContain('padding-bottom: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('padding-top: clamp(2.8rem, 7.8vw, 3.5rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card.fade-up[data-fade-state="pending"] {');
    expect(cssSource).toContain('opacity: 0.24;');
    expect(cssSource).toContain('translate: 0 16px;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card > div:first-child {');
    expect(cssSource).toContain('flex: 1 1 auto;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-action-row {');
    expect(cssSource).toContain('margin-top: auto;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-copy {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('min-width: 0;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta {');
    expect(cssSource).toContain('padding-top: clamp(2.2rem, 5vw, 3.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .native-info-inline-form {');
    expect(cssSource).toContain('width: min(680px, 100%);');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(cssSource).toContain('padding: clamp(2.2rem, 4vw, 3rem) clamp(1.3rem, 2.4vw, 1.85rem) clamp(1.65rem, 2.9vw, 2.3rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-heading {');
    expect(cssSource).toContain('max-width: 30rem;');
    expect(cssSource).toContain('margin: 0 auto clamp(1.95rem, 4vw, 2.6rem);');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-subtitle {');
    expect(cssSource).toContain('max-width: 24rem;');
    expect(cssSource).toContain('margin: 0.7rem auto 0;');
  });

  it('keeps the legacy giving route wired to the comparison widget and the opportunity feature block', () => {
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("className: 'legacy-giving-comparison-matrix'");
    expect(contentSource).toContain("widget: 'giving-comparison-matrix'");
    expect(contentSource).toContain("className: 'legacy-giving-opportunity'");
  });
});
