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
  });
});
