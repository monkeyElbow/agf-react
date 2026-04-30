import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('retirement split panel renderer guardrail', () => {
  it('keeps the shared dynamic split panel builder in the retirement page path', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain('buildDynamicSplitPanelFromBlock,');
    expect(source).toContain("kind: 'split_panel',");
    expect(source).toContain("id: 'split_options',");
    expect(source).toContain('const splitPanelRuntime = useMemo(');
    expect(source).toContain("split_options: RETIREMENT_SPLIT_PANEL_HUD_PANEL_ID");
    expect(source).toContain('data-block-id="split_options"');
  });
});
