import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments feature panel renderer guardrail', () => {
  it('keeps the shared dynamic feature panel builder in the investments page path', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain('buildDynamicFeaturePanelFromBlock,');
    expect(source).toContain("kind: 'feature_panel',");
    expect(source).toContain("id: 'cash_reserves',");
    expect(source).toContain('const featurePanelRuntime = useMemo(');
    expect(source).toContain("panel.blockId === 'cash_reserves'");
    expect(source).toContain('data-block-id="cash_reserves"');
  });
});
