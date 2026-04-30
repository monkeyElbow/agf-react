import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments calculator cta renderer guardrail', () => {
  it('keeps the shared dynamic calculator cta builder in the investments page path', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain('buildDynamicCalculatorCtaFromBlock,');
    expect(source).toContain("id: 'laddering',");
    expect(source).toContain("kind: 'calculator_cta',");
    expect(source).toContain('const calculatorCtaRuntime = useMemo(');
    expect(source).toContain("panel.blockId === 'laddering'");
    expect(source).toContain('data-block-id="laddering"');
    expect(source).toContain("const INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID = 'investments-calculator-cta';");
  });
});
