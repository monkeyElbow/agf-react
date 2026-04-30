import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments cta band renderer guardrail', () => {
  it('keeps the shared dynamic cta band builder in the investments page path', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain('buildDynamicCtaBandFromBlock,');
    expect(source).toContain("id: 'investor_cta',");
    expect(source).toContain("kind: 'cta_band',");
    expect(source).toContain('const investorCtaRuntime = useMemo(');
    expect(source).toContain("buildPresetFamilyRuntimeClassName('cta_band', investorCtaRuntime.presetId)");
    expect(source).not.toContain('is-cta-band-preset-${investorCtaRuntime.presetId}');
    expect(source).toContain("panel.blockId === 'investor_cta'");
    expect(source).toContain('data-block-id="investor_cta"');
    expect(source).toContain("const INVESTMENTS_CTA_BAND_HUD_PANEL_ID = 'investments-cta-band';");
  });
});
