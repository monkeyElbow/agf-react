import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native columns style ownership guardrail', () => {
  it('keeps canonical home-retirement columns internals on family-owned preset hooks instead of route selectors', () => {
    const source = readSource('../styles/service-native.css');
    const rendererSource = readSource('./blocks/PageBlocksRenderer.jsx');

    expect(source).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance,');
    expect(source).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math {');
    expect(source).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-do-the-math .native-columns-copy h3 mark {');
    expect(source).not.toContain('.is-columns-preset-housing-allowance .native-columns-copy h3.is-atlantean,');
    expect(source).not.toContain('.is-columns-preset-do-the-math .native-columns-copy h3.is-atlantean,');
    expect(source).not.toContain('.is-columns-preset-housing-allowance .native-columns-photo-label.is-atlantean,');
    expect(source).not.toContain('.is-columns-preset-do-the-math .native-columns-photo-label.is-atlantean,');
    expect(source).not.toContain('.home-native-page .service-native-section.native-dynamic-columns.is-columns-style-retirement .native-columns-copy h3 {');
    expect(source).not.toContain('.home-native-page .service-native-section.native-dynamic-columns.is-columns-style-retirement[data-block-id="columns_math"] .native-columns-copy h3 mark {');
    expect(rendererSource).toContain("presetClassToken === 'housing-allowance' || presetClassToken === 'do-the-math'");
    expect(rendererSource).not.toContain("dynamicBlock?.id === 'columns_mha' || dynamicBlock?.id === 'columns_math'");
  });

  it('keeps loans value-cards internals on the family-owned columns preset instead of route-local selectors', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-value-cards {');
    expect(source).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-value-cards .native-columns-grid {');
    expect(source).toContain('.is-columns-preset-value-cards .native-columns-growth-surface .investments-native-growth-surface-layer.is-blue,');
    expect(source).toContain('rgba(0, 173, 187, 0.28)');
    expect(source).toContain('rgba(0, 138, 171, 0.2)');
    expect(source).not.toContain('.service-native-section.native-dynamic-columns.is-columns-style-loans-value,');
    expect(source).not.toContain('.service-native-section.native-dynamic-columns.is-columns-style-loans-value .native-columns-grid,');
    expect(source).not.toContain('.loans-native-more-grid {');
    expect(source).not.toContain('.loans-native-more-card {');
    expect(source).not.toContain('.loans-native-more-card h3.is-atlantean mark {');
  });
});
