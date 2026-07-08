import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('investments feature block guardrails', () => {
  it('renders the Grow sequence from a site_feature block instead of a bridged cta band or billboard', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');
    const rendererSource = readSource('../components/blocks/PageBlocksRenderer.jsx');
    const featureSource = readSource('../components/InvestmentsGrowthFeature.jsx');

    expect(pageSource).toContain('const growthFeatureBlock = useMemo(');
    expect(pageSource).toContain("block?.id === 'growth_feature'");
    expect(pageSource).toContain("block?.kind === 'site_feature'");
    expect(pageSource).not.toContain('function buildInvestmentsCanonicalBlocks(blocks) {');
    expect(pageSource).not.toContain("block?.id === 'investor_cta' && block?.kind === 'cta_band'");
    expect(pageSource).toContain('<PageBlocksRenderer');
    expect(pageSource).not.toContain('DynamicCtaSection');
    expect(pageSource).not.toContain('toLegacyInvestorBillboardBlock');

    expect(blueprintSource).toContain("id: 'growth_feature'");
    expect(blueprintSource).toContain("featureId: 'investments_growth_feature'");
    expect(blueprintSource).toContain("id: 'dashboard_login_cta'");
    expect(blueprintSource).toContain("templateId: 'cta_band'");
    expect(blueprintSource).toContain("kind: 'cta_band'");
    expect(blueprintSource).toContain('hidden: true');

    expect(catalogSource).toContain("featureId: 'investments_growth_feature'");
    expect(catalogSource).toContain("label: 'Investments growth feature'");
    expect(featureSource).toContain("blockId = 'growth_feature'");
    expect(catalogSource).toContain("title: 'Grow your backup plan.'");
    expect(rendererSource).toContain("runtime.runtimeKey === 'investments_growth_feature'");
  });
});
