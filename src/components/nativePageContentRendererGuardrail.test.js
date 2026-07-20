import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native page content renderer guardrail', () => {
  it('keeps the shared dynamic page content builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicPageContentFromBlock,');
    expect(source).toContain('const runtime = buildDynamicPageContentFromBlock(block);');
    expect(source).toContain("const sectionClassBase = pathname === '/test' ? 'test-dynamic-page-content' : 'native-dynamic-page-content';");
    expect(source).toContain('const pageContentSection = buildDynamicPageContentSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'content') {");
    expect(source).toContain("const dynamicSectionPanel = dynamicSectionBlockId ? (hudPanelByBlockId[dynamicSectionBlockId] || null) : null;");
    expect(source).not.toContain("if (block.id === 'page_content') {");
  });

  it('keeps site features on the shared dynamic section path instead of bespoke page ownership', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicSiteFeatureFromBlock,');
    expect(source).toContain('const runtime = buildDynamicSiteFeatureFromBlock(block);');
    expect(source).toContain("className: `${pathname === '/test' ? 'test-dynamic-site-feature' : 'native-dynamic-site-feature'}${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}`");
    expect(source).toContain('const siteFeatureSection = buildDynamicSiteFeatureSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'site_feature') {");
  });

  it('keeps feature panels on the shared dynamic section path so native pages can target legacy shells without bespoke route code', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicFeaturePanelFromBlock,');
    expect(source).toContain('const runtime = buildDynamicFeaturePanelFromBlock(block);');
    expect(source).toContain("className: `${pathname === '/test' ? 'test-dynamic-feature-panel' : 'native-dynamic-feature-panel'}${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}`");
    expect(source).toContain('const mappedSection = buildDynamicFeaturePanelSection(block, activePath);');
    expect(source).toContain('const featurePanelSection = buildDynamicFeaturePanelSection(block, activePath);');
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'feature_panel') {");
  });

  it('routes static value-card sections through the shared feature-panel shell instead of page-specific card grids', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const cardsPresetToken = String(section.cardsPreset || '').trim().toLowerCase();");
    expect(source).toContain("const isValueCardsFeatureSection = cardsPresetToken === 'value-cards';");
    expect(source).toContain("root.querySelectorAll('.service-native-section.is-cards-preset-value-cards')");
    expect(source).toContain("setupInvestmentsGrowthRevealMotion(node, { includeBackgroundMotion: false })");
    expect(source).toContain("is-cards-preset-${cardsPresetToken}");
    expect(source).not.toContain("sectionClassName.includes('about-native-strategy')");
  });

  it('does not keep a dormant loans legacy bridge in the native page renderer once the custom loans route owns that page', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).not.toContain("import InvestmentsPage from '../pages/InvestmentsPage';");
    expect(source).not.toContain("import LoansPage from '../pages/LoansPage';");
    expect(source).not.toContain("import RetirementPage from '../pages/RetirementPage';");
    expect(source).not.toContain("section?.widget === 'loans-legacy-sections'");
    expect(source).not.toContain('loans-legacy');
  });

  it('keeps live child-route composition narrowed to active helpers instead of a bespoke 403(b) route compositor', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("composeConsultantSections,");
    expect(source).toContain('let nextSections = composeConsultantSections({');
    expect(source).not.toContain("composeRetirement403bSections,");
    expect(source).not.toContain('const retirement403bComposition = isBlockOnlyManagedPage');
    expect(source).not.toContain('composeRetirement403bSections({');
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'investment_strategy_heading')");
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'investment_strategy_options')");
    expect(source).not.toContain("dynamicSections.find((section) => section?.blockId === 'who_qualifies')");
  });

  it('keeps native public tables on the shared table-sheet renderer instead of legacy data-table markup', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("import InfoTableSheet from './InfoTableSheet';");
    expect(source).toContain('function Retirement403bRateTableWidget({ rates, ratesMeta }) {');
    expect(source).toContain('<InfoTableSheet');
    expect(source).toContain("headers={['Investment Type', 'Rate', 'APY*']}");
    expect(source).toContain('headers={section.table.headers}');
    expect(source).toContain('rows={section.table.rows}');
    expect(source).not.toContain('<table className="data-table data-table--fixed">');
  });

  it('keeps 403(b) strategy document links on button-style lists without native bullets on the active preset shell', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options .service-native-card-link-list,');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options .service-native-card-accordion-links {');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .retirement-child-native-strategies');
    expect(cssSource).toContain('list-style: none;');
    expect(cssSource).toContain('padding-left: 0;');
    expect(cssSource).toContain('.service-native-card-link-list:has(.service-native-btn) {');
    expect(cssSource).toContain('padding-inline: 0.1rem;');
    expect(cssSource).toContain('padding: 0.2rem 0.85rem 0.85rem;');
  });

  it('keeps explicit sibling spacing between 403(b) strategy panels so row separation does not depend on wrapper gap rendering', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.ret403b-strategy-feature {');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.ret403b-strategy-feature > .ret403b-strategy-feature-row.services-breakdown-panel + .ret403b-strategy-feature-row.services-breakdown-panel {');
    expect(cssSource).toContain('margin-top: clamp(0.8rem, 1.45vw, 1.05rem) !important;');
    expect(cssSource).toContain('.retirement-403b-native-strategy-feature .native-info-rich-html .services-breakdown-panel + .services-breakdown-panel,');
    expect(cssSource).toContain('.retirement-403b-native-strategy-feature .native-info-rich-html .ret403b-strategy-feature-row + .ret403b-strategy-feature-row {');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .ret403b-strategy-feature {');
  });

  it('forces 403(b) strategy document links into block-owned outline buttons even when older stored markup still uses services-breakdown-links', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.retirement-403b-native-strategy-feature .native-info-rich-html :is(.services-breakdown-links, .ret403b-strategy-feature-links) {');
    expect(cssSource).toContain('.retirement-403b-native-strategy-feature .native-info-rich-html :is(.services-breakdown-links, .ret403b-strategy-feature-links) a,');
    expect(cssSource).toContain('background: transparent !important;');
    expect(cssSource).toContain('border: 1px solid var(--btn-color) !important;');
    expect(cssSource).toContain('box-shadow: none !important;');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .retirement-403b-native-strategy-feature .native-info-rich-html :is(.services-breakdown-links, .ret403b-strategy-feature-links) {');
  });

  it('keeps promoted 403(b) block-owned class families out of route-scoped CSS selectors', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b\s+\.retirement-403b-native-/);
    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b\s+\.ret403b-/);
    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b\s+\.retirement-403b-loan-/);
    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b[^{\n]*\.retirement-403b-group-compliance-copy/);
    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b\s+\.retirement-child-native-(qualify|enroll|table|rollover)/);
    expect(cssSource).not.toMatch(/\.native-info-page--retirement-403b\s+\.retirement-child-native-(strategies|highlight|housing|loans)/);
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .service-native-section.dynamic-billboard');
  });

  it('delegates active functional native routes to extracted renderers instead of keeping inline route mini-apps in NativeContentPage', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("} from './nativeFunctionalRouteRenderers';");
    expect(source).toContain('<NativeSitemapRouteRenderer');
    expect(source).toContain('<NativeProspectusRouteRenderer');
    expect(source).toContain('<NativeFormsRouteRenderer');
    expect(source).not.toContain('function SitemapSection() {');
    expect(source).not.toContain('function ProspectusSection({ content }) {');
    expect(source).not.toContain('function FormsLibrarySection({ content }) {');
    expect(source).not.toContain('native-functional-page-head--sitemap');
    expect(source).not.toContain('native-functional-page-head--prospectus');
    expect(source).not.toContain('native-functional-page-head--forms');
  });

  it('delegates careers route shaping and jobs-list rendering to extracted helpers instead of keeping an inline careers mini-app in NativeContentPage', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildCareersRouteSections,');
    expect(source).toContain('isNativeCareersJobsSection,');
    expect(source).toContain('NativeCareersJobsSection,');
    expect(source).toContain('nextSections = buildCareersRouteSections({');
    expect(source).toContain('{isNativeCareersJobsSection(section) ? <NativeCareersJobsSection jobs={section.jobs} /> : null}');
    expect(source).not.toContain("getVisibleJobs().map((job) => ({");
    expect(source).not.toContain("if (section.className !== 'careers-native-jobs-list') {");
    expect(source).not.toContain('careers-native-jobs-list-wrap');
    expect(source).not.toContain('There are currently no open positions to display.');
  });

  it('keeps the remaining NativeContentPage ownership boundary explicit: delegated functional routes, delegated child-route composition, and only named inline path exceptions', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const resolvedPagePath = String(activePath || templatePath || '/').trim() || '/';");
    expect(source).toContain("isBlockOnlyManagedPagePath,");
    expect(source).toContain("toBlockOnlyManagedPageShell,");
    expect(source).toContain("const isBlockOnlyManagedPage = isBlockOnlyManagedPagePath(activePath || templatePath);");
    expect(source).toContain('const baseNativeContent = getNativePageContent(templatePath, page.title);');
    expect(source).toContain('const baseContent = isBlockOnlyManagedPage');
    expect(source).toContain('? toBlockOnlyManagedPageShell(baseNativeContent)');
    expect(source).toContain('const allowTargetedDynamicSections = !isBlockOnlyManagedPage;');
    expect(source).toContain('if (!allowTargetedDynamicSections || !mappedSection || !targetKey || targetedDynamicCtaSections.has(targetKey)) {');
    expect(source).toContain("const isTestPage = templatePath === '/test';");
    expect(source).toContain("const isLegacyGivingPage = resolvedPagePath === '/services/planned-giving';");
    expect(source).toContain("const testimonialsHudDefaultTag = isLegacyGivingPage ? 'legacy-giving' : '';");
    expect(source).toContain('let nextSections = composeConsultantSections({');
    expect(source).toContain('nextSections = buildCareersRouteSections({');
    expect(source).not.toContain("const retirement403bComposition = isBlockOnlyManagedPage");
    expect(source).not.toContain("composeRetirement403bSections({");
    expect(source).toContain("if (templatePath === '/sitemap') {");
    expect(source).toContain("if (templatePath === '/prospectus') {");
    expect(source).toContain("if (templatePath === '/forms') {");
    expect(source).not.toContain("templatePath === '/about-us/careers'");
    expect(source).not.toContain("templatePath === '/services/retirement/403b'");
    expect(source).not.toContain("templatePath === '/services/retirement/retirement-consultants'");
  });

  it('keeps the investments by-mail widget block-owned instead of native-section-owned', () => {
    const nativeContentSource = readSource('../data/nativePageContent.js');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(nativeContentSource).toContain("'/services/investments/invest-by-mail': {");
    expect(nativeContentSource).not.toContain("widget: 'investments-institutional-by-mail'");
    expect(blueprintSource).toContain("id: 'mail_flow'");
    expect(blueprintSource).toContain("widget: 'investments-institutional-by-mail'");
    expect(blueprintSource).toContain("sectionClassName: 'investments-mail-native-shell'");
    expect(cssSource).toContain('.investments-mail-native-shell {');
    expect(cssSource).not.toContain('.native-info-page--investments-invest-by-mail .investments-mail');
  });
});
