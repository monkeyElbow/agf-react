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

    expect(pageSource).toContain('const growthFeatureBlockRecord = useMemo(');
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

  it('keeps the investments hero on the shared headline sizing, tracking, and line-gap path', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');

    expect(pageSource).toContain("import {\n  buildHeroLineStyle,\n  normalizeHeroLineGapEm,\n} from '../lib/heroLineStyle';");
    expect(pageSource).toContain("import {\n  heroTitleSizeRemToRuntimeCss,\n  normalizeHeroTitleLetterSpacingEm,\n} from '../lib/heroTitleSize';");
    expect(pageSource).toContain('const heroHudLineGap = normalizeHeroLineGapEm(heroHudSettings.lineGap);');
    expect(pageSource).toContain('const heroHudTitleSize = heroTitleSizeRemToRuntimeCss(heroHudSettings.titleSizeRem);');
    expect(pageSource).toContain('const heroHudLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(heroHudSettings.titleLetterSpacingEm);');
    expect(pageSource).toContain('fontSize={heroHudTitleSize}');
    expect(pageSource).toContain('lineGap={heroHudLineGap}');
    expect(pageSource).toContain('letterSpacing={heroHudLetterSpacingEm}');
    expect(pageSource).toContain('style={buildHeroLineStyle({');
  });

  it('keeps certificate card content on the managed card-grid block path', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(pageSource).toContain('const certificatesBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('resolveInvestmentCertificateCards(certificatesBlock || DEFAULT_CERTIFICATES_BLOCK)');
    expect(pageSource).toContain('data-block-id="certificates"');
    expect(pageSource).toContain("certificates: 'investments-certificates'");
    expect(pageSource).not.toContain('const certificateCards = [');

    expect(blueprintSource).toContain("id: 'certificates'");
    expect(blueprintSource).toContain("mode: 'dynamic'");
    expect(blueprintSource).toContain("title: 'Demand Certificates'");
    expect(blueprintSource).toContain("title: 'Term Certificates'");
  });

  it('keeps the investments certificate rates band on the managed rates block path', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(pageSource).toContain('const ratesBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('buildDynamicRatesFromBlock(ratesBlock || DEFAULT_CERTIFICATES_RATES_BLOCK)');
    expect(pageSource).toContain('data-block-id="certificates_table"');
    expect(pageSource).toContain('certificates_table: INVESTMENTS_RATES_HUD_PANEL_ID');
    expect(pageSource).not.toContain("block?.id === 'rates_table'");

    expect(blueprintSource).toContain("id: 'certificates_table'");
    expect(blueprintSource).toContain("kind: 'rates'");
    expect(blueprintSource).toContain('editableFields: ratesEditableFields');
    expect(blueprintSource).not.toContain("id: 'rates_table'");
  });

  it('keeps the investments laddering calculator on the managed calculator-cta block path', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(pageSource).toContain('const calculatorCtaBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('calculatorCtaBlockIsHidden ? null : buildDynamicCalculatorCtaFromBlock(calculatorCtaBlock || DEFAULT_LADDERING_BLOCK)');
    expect(pageSource).toContain('data-block-id="laddering"');
    expect(pageSource).toContain('laddering: INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID');
    expect(pageSource).toContain('{calculatorCtaRuntime ? (');

    expect(blueprintSource).toContain("id: 'laddering'");
    expect(blueprintSource).toContain("kind: 'calculator_cta'");
    expect(blueprintSource).toContain('editableFields: calculatorCtaEditableFields');
    expect(blueprintSource).not.toContain("presetId: 'investment_laddering'");
  });

  it('keeps investments overview fallbacks from rendering when managed blocks are hidden', () => {
    const pageSource = readSource('./InvestmentsPage.jsx');

    expect(pageSource).toContain('function isHiddenManagedBlock(block) {');
    expect(pageSource).toContain('const heroBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('const introBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('const testimonialsBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('const featurePanelBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('const growthFeatureBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('const ctaFormBlockRecord = useMemo(() => (');
    expect(pageSource).toContain('heroBlockIsHidden ? null : (');
    expect(pageSource).toContain('introBlockIsHidden ? null : dynamicIntro || buildDefaultInvestmentsIntroRuntime()');
    expect(pageSource).toContain('testimonialsBlockIsHidden ? null : resolveTestimonialsBlockData({');
    expect(pageSource).toContain('growthFeatureBlockIsHidden ? null : growthFeatureBlock || {');
    expect(pageSource).toContain('ctaFormBlockIsHidden ? null : ctaFormBlock || {');
    expect(pageSource).toContain('if (featurePanelBlockIsHidden) {');
    expect(pageSource).toContain('renderedGrowthFeatureBlock ? (');
    expect(pageSource).toContain('renderedCtaFormBlock ? (');
    expect(pageSource).toContain('testimonialsData ? (');
  });
});
