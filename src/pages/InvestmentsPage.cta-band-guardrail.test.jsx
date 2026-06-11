import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments investor cta compatibility guardrail', () => {
  it('keeps the legacy investor cta block bridged into the billboard runtime and final growth slide without duplicating a standalone section', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain('buildDynamicBillboardFromBlock,');
    expect(source).toContain('function toLegacyInvestorBillboardBlock(block) {');
    expect(source).toContain("block?.id === 'investor_cta'");
    expect(source).toContain("block?.kind === 'cta_band'");
    expect(source).toContain('const legacyInvestorCtaBlock = useMemo(');
    expect(source).toContain('const investorBillboardSourceBlock = billboardBlock || legacyInvestorCtaBlock || null;');
    expect(source).toContain('const investorBillboardRuntime = useMemo(');
    expect(source).toContain("data-investments-growth-background-panel=\"white\"");
    expect(source).toContain("actionButtonClassName('outline', action.tone || 'atlantean')");
    expect(source).not.toContain('className={`service-native-section dynamic-billboard investments-native-dashboard-billboard');
  });
});
