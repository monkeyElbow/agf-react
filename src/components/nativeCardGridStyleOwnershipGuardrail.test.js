import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native card-grid style ownership guardrail', () => {
  it('keeps preset-owned retirement 403(b) card-grid styling on canonical preset hooks instead of block ids', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options {');
    expect(source).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-eligibility-cards {');
    expect(source).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-step-cards {');
    expect(source).not.toContain('.service-native-section.native-dynamic-grid[data-block-id="investment_strategy_options"]');
    expect(source).not.toContain('.service-native-section.native-dynamic-grid[data-block-id="who_qualifies"]');
    expect(source).not.toContain('.service-native-section.native-dynamic-grid[data-block-id="loan_apply"]');
    expect(source).not.toContain('.native-info-page--retirement-403b .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options');
    expect(source).not.toContain('.native-info-page--retirement-403b .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-eligibility-cards');
  });

  it('keeps planned-giving gift-card bullets regular weight with shared spacing', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain(
      '.native-info-page--legacy-child\n  .service-native-section.native-dynamic-grid.legacy-child-native-assets\n  .service-native-card-bullet-list li {',
    );
    expect(source).toContain('font-weight: 400;');
    expect(source).toContain('font-size: var(--planned-giving-bullet-size, clamp(1.1rem, 2vw, 1.35rem));');
    expect(source).toContain(
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).legacy-child-native-assets .service-native-card :is(.service-native-card-bullet-list li, .service-native-card-rich-body > ul li)',
    );
    expect(source).toContain(
      '.native-info-page--legacy-cga .legacy-child-native-cga-assets .service-native-card-rich-body > p:empty {',
    );
    expect(source).toContain(
      '.native-info-page--legacy-cga .legacy-child-native-cga-assets .service-native-card-rich-body > ul + :is(strong, span, em, a) {',
    );
    expect(source).toContain('margin-top: clamp(1.75rem, 3vw, 2.25rem);');
    expect(source).toContain(
      '.native-info-page--legacy-cga .legacy-child-native-cga-assets .service-native-card-fineprint {',
    );
    expect(source).toContain('margin: clamp(2rem, 3vw, 2.5rem) 0 0;');
    expect(source).toContain('display: none;');
    expect(source).toContain(
      '.native-info-page--legacy-cga .legacy-child-native-cga-assets .service-native-action-row {',
    );
    expect(source).toContain('margin-top: clamp(0.7rem, 1.35vw, 0.95rem);');
    expect(source).toContain('padding-top: 0;');
    expect(source).toContain('margin-top: clamp(0.7rem, 1.35vw, 0.95rem);');
    expect(source).toContain(
      '.service-native-card-bullet-list li strong {\n  font-weight: 400;',
    );
  });

  it('keeps the MIF fifth gift-asset bullet marked when the former last item moves to fineprint', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).not.toContain(
      '.native-info-page--legacy-child.native-info-page--legacy-ministry-impact .legacy-child-native-assets .service-native-card-bullet-list li:last-child {',
    );
    expect(source).toContain(
      '.native-info-page--legacy-child.native-info-page--legacy-ministry-impact .legacy-child-native-assets .service-native-card-fineprint {',
    );
  });
});
