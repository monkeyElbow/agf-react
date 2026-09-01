import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readCssBetween(source, startPattern, endPattern) {
  const start = source.indexOf(startPattern);
  const end = source.indexOf(endPattern, start + startPattern.length);
  return start >= 0 && end >= 0 ? source.slice(start, end) : '';
}

describe('native page content renderer guardrail', () => {
  it('keeps the shared dynamic page content builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('buildDynamicPageContentFromBlock,');
    expect(source).toContain('const runtime = buildDynamicPageContentFromBlock(block);');
    expect(source).toContain('blockKind === CALCULATOR_WIDGET_KIND');
    expect(source).toContain('blockKind === CALCULATOR_INTRO_KIND');
    expect(source).toContain("'native-dynamic-calculator-intro'");
    expect(source).toContain("'native-dynamic-calculator-widget'");
    expect(source).toContain('const shouldRenderIntro = !isBlockOnlyManagedPage && !hideIntro && hasIntroContent;');
    expect(source).toContain('const showIntroHud = showFrontHud && shouldRenderIntro && Boolean(introHudPanel);');
    expect(source).toContain('{shouldRenderIntro ? (');
    expect(source).toContain('function buildManagedBlockSection(block, {');
    expect(source).toContain("if (renderBlock.kind === 'content' || renderBlock.kind === 'support_library' || renderBlock.kind === CALCULATOR_INTRO_KIND || renderBlock.kind === CALCULATOR_WIDGET_KIND) {");
    expect(source).toContain('buildDynamicPageContentSection(renderBlock, pathname);');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
    expect(compositionSource).toContain('buildSection(block, { pathname, isBlockOnlyManagedPage })');
    expect(source).toContain("const dynamicSectionPanel = dynamicSectionBlockId ? (renderHudPanelByBlockId[dynamicSectionBlockId] || null) : null;");
    expect(source).not.toContain("if (block.id === 'page_content') {");
  });

  it('keeps block-only hero and intro blocks on the ordered dynamic section path instead of shell slots', () => {
    const source = readSource('./NativeContentPage.jsx');
    const shellSource = readSource('../lib/managedPageShells.js');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('function buildDynamicHeroShellSection(block) {');
    expect(source).toContain('function buildDynamicIntroShellSection(block, { includeTestClassName = false } = {}) {');
    expect(compositionSource).toContain('const primarySlotIds = new Set(');
    expect(compositionSource).toContain('isBlockOnlyManagedPage');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
    expect(source).toContain('const shouldRenderHero = !isBlockOnlyManagedPage && !hideHero && Boolean(heroBase);');
    expect(compositionSource).toContain('hideHero: !isBlockOnlyManagedPage && (');
    expect(compositionSource).toContain('hideIntro: !isBlockOnlyManagedPage && (');
    expect(shellSource).toContain('hero: null,');
    expect(shellSource).toContain('intro: null,');
    expect(shellSource).toContain('hideHero: false,');
    expect(shellSource).toContain('hideIntro: false,');
  });

  it('keeps site features on the shared dynamic section path instead of bespoke page ownership', () => {
    const source = readSource('./NativeContentPage.jsx');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('buildDynamicSiteFeatureFromBlock,');
    expect(source).toContain('const runtime = buildDynamicSiteFeatureFromBlock(block);');
    expect(source).toContain("className: `${pathname === '/test' ? 'test-dynamic-site-feature' : 'native-dynamic-site-feature'}${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}`");
    expect(source).toContain("if (renderBlock.kind === 'site_feature') {");
    expect(source).toContain('buildDynamicSiteFeatureSection(renderBlock, pathname);');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
  });

  it('keeps feature panels on the shared dynamic section path without native-section targeting', () => {
    const source = readSource('./NativeContentPage.jsx');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain('buildDynamicFeaturePanelFromBlock,');
    expect(source).toContain('const runtime = buildDynamicFeaturePanelFromBlock(block);');
    expect(source).toContain("className: `${pathname === '/test' ? 'test-dynamic-feature-panel' : 'native-dynamic-feature-panel'} service-native-feature-panel${runtime.sectionClassName ? ` ${runtime.sectionClassName}` : ''}`");
    expect(source).toContain("if (renderBlock.kind === 'feature_panel') {");
    expect(source).toContain('buildDynamicFeaturePanelSection(renderBlock, pathname);');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
    expect(source).not.toContain('const mappedSection = buildDynamicFeaturePanelSection(block, activePath);');
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

    expect(source).toContain("import RatesBlock from './RatesBlock';");
    expect(source).toContain('function Retirement403bRateTableWidget({ rates, ratesMeta }) {');
    expect(source).toContain('<RatesBlock');
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
    expect(cssSource).toContain('padding-inline: 0;');
    expect(cssSource).toContain('padding: 0;');
    expect(cssSource).toContain('flex-wrap: wrap;');
  });

  it('keeps 403(b) benefits and enrollment card sizing on the rendered block-owned variables', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).retirement-403b-native-benefits-cards.is-width-browser > .ag-panel-rail-wide {');
    expect(cssSource).toContain('width: calc(100% - (var(--ag-panel-gutter) * 0.8));');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('.retirement-403b-native-benefits-cards .native-info-section-copy > h2 {');
    expect(cssSource).toContain('margin-bottom: clamp(2.3rem, 4.4vw, 3.2rem);');
    expect(cssSource).toContain('.retirement-403b-native-benefits-cards .service-native-card {');
    expect(cssSource).toContain('--dynamic-grid-card-padding: clamp(2.1rem, 3.2vw, 3rem);');
    expect(cssSource).toContain('justify-content: flex-start;');
    expect(cssSource).toContain('.retirement-403b-native-benefits-cards .service-native-card > div:first-child {');
    expect(cssSource).toContain('align-items: flex-start;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).retirement-403b-native-benefits-cards .service-native-card h3 {');
    expect(cssSource).toContain('font-size: var(--dynamic-grid-card-title-size, clamp(1.68rem, 2.45vw, 2.14rem));');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('align-items: flex-start !important;');
    expect(cssSource).toContain('line-height: 0.9 !important;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-enroll,');
    expect(cssSource).toContain('.service-native-section.test-dynamic-grid.retirement-403b-native-enroll {');
    expect(cssSource).toContain('padding-bottom: clamp(6.9rem, 10.6vw, 9rem);');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-enroll .service-native-card h3,');
    expect(cssSource).toContain('.service-native-section.test-dynamic-grid.retirement-403b-native-enroll .service-native-card h3 {');
    expect(cssSource).toContain('font-size: var(--dynamic-grid-card-title-size, clamp(1.68rem, 2.45vw, 2.14rem)) !important;');
    expect(cssSource).toContain('line-height: 0.9 !important;');
    expect(cssSource).toContain('letter-spacing: -0.035em;');
  });

  it('keeps 403(b) loans surface and text tones on the shared page-content contract', () => {
    const rendererSource = readSource('./NativeContentPage.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const definitionSource = readSource('../blocks/definitions/pageContent.definition.js');
    const adminEditorSource = readSource('./block-editors/migratedBlockEditors.jsx');
    const hudEditorSource = readSource('./PageContentHudEditorPanel.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(runtimeSource).toContain('const bgTone = normalizeSurfaceBgTone(settings.bgTone, \'white\');');
    expect(runtimeSource).toContain('const textTone = normalizeSharedPanelTextTone(settings.textTone, \'dark\');');
    expect(rendererSource).toContain('is-bg-${bgTone} is-text-${textTone}');
    expect(definitionSource).toContain("id: 'bgTone'");
    expect(definitionSource).toContain("id: 'textTone'");
    expect(adminEditorSource).toContain("['bgTone', 'textTone'].includes(field.id)");
    expect(hudEditorSource).toContain('PageContentSurfaceToneControls');
    expect(cssSource).toContain('.retirement-403b-native-loans.is-bg-grey');
    expect(cssSource).toContain('.retirement-403b-native-loans.is-bg-sand');
    expect(cssSource).toContain('.retirement-403b-native-loans.is-text-white');
    expect(cssSource).toContain('color: var(--ag-color-mango) !important;');
    expect(cssSource).not.toContain('--dyn-content-padding-top: clamp(10rem, 15vw, 13rem);');
    expect(cssSource).not.toContain('padding-top: clamp(5rem, 8.5vw, 6.75rem);');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .retirement-403b-native-loans');
  });

  it('keeps the About building photo as a true viewport-width image block', () => {
    const cssSource = readSource('../styles/service-native.css');
    const aboutBuildingCss = readCssBetween(
      cssSource,
      '.about-native-building-shot,',
      '.native-info-page--about .about-native-strategy {',
    );

    expect(cssSource).toContain('.native-info-viewport-bleed {');
    expect(aboutBuildingCss).toContain('inline-size: 100vw;');
    expect(aboutBuildingCss).toContain('width: 100vw;');
    expect(aboutBuildingCss).toContain('min-inline-size: 100vw;');
    expect(aboutBuildingCss).toContain('min-width: 100vw;');
    expect(aboutBuildingCss).toContain('margin-left: calc(50% - 50vw);');
    expect(aboutBuildingCss).toContain('margin-right: calc(50% - 50vw);');
    expect(aboutBuildingCss).toContain('.about-native-building-shot > .native-info-viewport-bleed,');
    expect(aboutBuildingCss).toContain('.native-info-page--about .about-native-building-shot > :is(.ag-panel-rail-wide, .ag-panel-rail) {');
    expect(aboutBuildingCss).toContain('inline-size: 100vw !important;');
    expect(aboutBuildingCss).toContain('width: 100vw !important;');
    expect(aboutBuildingCss).toContain('max-inline-size: 100vw !important;');
    expect(aboutBuildingCss).toContain('max-width: 100vw !important;');
    expect(aboutBuildingCss).toContain('.about-native-building-shot .native-info-section-logo,');
    expect(aboutBuildingCss).toContain('.native-info-page--about .about-native-building-shot .native-info-section-logo {');
    expect(aboutBuildingCss).toContain('inline-size: 100vw;');
    expect(aboutBuildingCss).toContain('width: 100vw;');
    expect(aboutBuildingCss).toContain('height: clamp(430px, 53vw, 760px);');
    expect(aboutBuildingCss).toContain('scale(1.14);');
    expect(aboutBuildingCss).not.toContain('width: min(1280px');
    expect(aboutBuildingCss).not.toContain('calc(100% - (var(--ag-panel-gutter)');

    const nativePageSource = readSource('./NativeContentPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    expect(nativePageSource).not.toContain('function buildAboutBuildingPhotoSection');
    expect(nativePageSource).toContain('railClassName: railClassName || undefined');
    expect(blueprintSource).toContain("railClassName: 'native-info-viewport-bleed'");
    expect(nativePageSource).toContain("section?.querySelector('.native-info-section-logo, .native-columns-media')");
    expect(nativePageSource).toContain('const maxOffset = 52;');
  });

  it('keeps life quote product cards on the active dynamic-grid card shell instead of shared title wells', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types {');
    expect(cssSource).toContain('padding-bottom: clamp(4.4rem, 7.2vw, 6.1rem);');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types > .ag-panel-rail,');
    expect(cssSource).toContain('width: calc(100% - (var(--ag-panel-gutter) * 0.6));');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types .service-native-card {');
    expect(cssSource).toContain('padding: clamp(1.9rem, 2.8vw, 2.7rem);');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('font-size: clamp(1.72rem, 2.7vw, 2.28rem);');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types .service-native-card p {');
    expect(cssSource).toContain('font-size: var(--service-native-intro-body-size);');
    expect(cssSource).toContain('.native-info-page--life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).life-quote-native-types .service-native-card:nth-child(2) h3 {');
    expect(cssSource).toContain('color: var(--ag-color-mango);');
  });

  it('keeps group term life benefit cards on the active dynamic-grid card shell instead of shared title wells', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--group-life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).group-life-native-benefits {');
    expect(cssSource).toContain('padding-top: clamp(2.4rem, 5vw, 4rem);');
    expect(cssSource).toContain('padding-bottom: clamp(2.4rem, 5vw, 4rem);');
    expect(cssSource).toContain('.native-info-page--group-life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).group-life-native-benefits .service-native-card {');
    expect(cssSource).toContain('padding: clamp(1.9rem, 2.8vw, 2.7rem);');
    expect(cssSource).toContain('.native-info-page--group-life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).group-life-native-benefits .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('letter-spacing: var(--ag-letter-spacing-helv-heading);');
    expect(cssSource).toContain('font-size: clamp(1.52rem, 2.28vw, 1.96rem);');
    expect(cssSource).toContain('line-height: 0.98 !important;');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.native-info-page--group-life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).group-life-native-benefits .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('.native-info-page--group-life-quote .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).group-life-native-benefits .service-native-card p {');
    expect(cssSource).toContain('font-size: clamp(1.12rem, 1.75vw, 1.28rem);');
  });

  it('keeps the 403(b) strategy heading and action buttons separated from the strategy cards', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.dynamic-billboard.retirement-403b-native-strategy-heading {');
    expect(cssSource).toContain('padding-top: var(--dynamic-billboard-padding-top, clamp(1.4rem, 3vw, 2.05rem));');
    expect(cssSource).toContain('padding-bottom: var(--dynamic-billboard-padding-bottom, clamp(0.85rem, 1.8vw, 1.25rem));');
    expect(cssSource).toContain('.service-native-section.dynamic-billboard.retirement-403b-native-strategy-heading .native-info-section-copy > h2 {');
    expect(cssSource).toContain('margin-bottom: clamp(0.55rem, 1.25vw, 0.9rem);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options {');
    expect(cssSource).not.toContain('.native-info-page--retirement-403b .retirement-403b-native-strategy-heading');
  });

  it('keeps investment option row content centered in its shared three-column layout', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.is-card-grid-preset-investment-options .service-native-card {');
    expect(cssSource).toContain('align-items: stretch;');
    expect(cssSource).toContain('.is-card-grid-preset-investment-options .service-native-card h3,');
    expect(cssSource).toContain('align-self: center;');
  });

  it('keeps the card-grid sandstone option as the shared gradient surface', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('background: linear-gradient(145deg, var(--ag-color-sandstone) 0%, var(--ag-color-sandstone-dark) 100%);');
  });

  it('keeps the first eligibility card on semantic atlantean instead of the dark endpoint', () => {
    const cssSource = readSource('../styles/service-native.css');
    const firstCardSelector = '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-eligibility-cards .service-native-card:nth-child(1) h3';
    const firstCardRuleStart = cssSource.indexOf(`${firstCardSelector} {`);
    const firstCardRule = firstCardRuleStart >= 0
      ? cssSource.slice(firstCardRuleStart, cssSource.indexOf('}', firstCardRuleStart) + 1)
      : '';

    expect(firstCardRule).toContain('color: var(--ag-color-atlantean);');
    expect(firstCardRule).not.toContain('var(--ag-color-atlantean-dark)');
  });

  it('keeps the 403(b) loan apply card copy vertically centered beside the step numbers', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-loan-apply {');
    expect(cssSource).toContain('padding-top: clamp(1.35rem, 2.6vw, 1.95rem);');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-loan-apply .service-native-card {');
    expect(cssSource).toContain('grid-template-columns: clamp(3.35rem, 5vw, 4.15rem) minmax(0, 1fr);');
    expect(cssSource).toContain('align-content: center;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-loan-apply .service-native-card > div:first-child {');
    expect(cssSource).toContain('display: contents;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-loan-apply .service-native-card p {');
    expect(cssSource).toContain('grid-row: 1;');
    expect(cssSource).toContain('align-self: center;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.retirement-403b-native-loan-apply .service-native-card .service-native-action-row,');
    expect(cssSource).toContain('grid-column: 2;');
    expect(cssSource).toContain('align-self: start;');
    expect(cssSource).toContain('justify-content: flex-start;');
  });

  it('removes the retired raw-HTML 403(b) strategy panel contract', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).not.toContain('ret403b-strategy-feature');
    expect(cssSource).not.toContain('services-breakdown-panel');
  });

  it('keeps 403(b) strategy document links on the shared card-grid link renderer', () => {
    const source = readSource('./NativeContentPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain('card.links.map((item) =>');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options .service-native-card-link-list');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options .service-native-card-link-list .service-native-btn');
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

  it('keeps the retired standalone 403(b) RMHA feature selectors out of service-native styles', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).not.toContain('retirement-ministers-housing-feature');
    expect(cssSource).not.toContain('ret403b-housing-feature-');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-columns, .test-dynamic-columns).is-columns-preset-housing-allowance');
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

  it('keeps the sitemap functional route on the forms card layout with solid internal link buttons', () => {
    const rendererSource = readSource('./nativeFunctionalRouteRenderers.jsx');
    const cssSource = readSource('../styles/service-native.css');
    const sitemapCss = readCssBetween(
      cssSource,
      '.native-sitemap-group .native-info-link-list {',
      '.native-sitemap-empty {',
    );

    expect(rendererSource).toContain('<span className="sr-only">Find page</span>');
    expect(rendererSource).toContain('<span className="sr-only">Section</span>');
    expect(rendererSource).toContain('className="service-native-btn is-tone-atlantean"');
    expect(rendererSource).not.toContain('native-sitemap-results-count');
    expect(rendererSource).not.toContain('pages shown');
    expect(cssSource).toContain('.native-info-page--sitemap .native-functional-page-head--sitemap {');
    expect(cssSource).toContain('border-bottom: 0;');
    expect(cssSource).toContain('.native-info-page--sitemap .native-functional-page-head--sitemap h1 {');
    expect(cssSource).toContain('color: var(--ag-color-atlantean);');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('.native-sitemap-tools input,');
    expect(cssSource).toContain('border-radius: 999px;');
    expect(cssSource).toContain('margin-bottom: clamp(1.7rem, 3vw, 2.35rem);');
    expect(cssSource).toContain('.native-info-page--sitemap .native-sitemap-grid {');
    expect(cssSource).toContain('margin-top: 0;');
    expect(cssSource).toContain('.native-sitemap-grid {');
    expect(cssSource).toContain('column-count: 2;');
    expect(cssSource).toContain('column-gap: 1rem;');
    expect(cssSource).toContain('.native-sitemap-group {');
    expect(cssSource).toContain('display: inline-block;');
    expect(cssSource).toContain('break-inside: avoid;');
    expect(cssSource).toContain('border: 1px solid rgba(65, 64, 66, 0.12);');
    expect(cssSource).toContain('border-radius: 10px;');
    expect(cssSource).toContain('background: #fafafa;');
    expect(cssSource).toContain('padding: 0.9rem 1rem 1rem;');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.native-sitemap-group .native-info-link-list {');
    expect(cssSource).toContain('gap: 0.35rem;');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('margin: 0.65rem 0 0;');
    expect(cssSource).not.toContain('.native-sitemap-group .native-info-link-list a {');
    expect(cssSource).not.toContain('.native-sitemap-group .native-info-link-list a:hover,');
    expect(sitemapCss).not.toContain('padding: 0.46rem 1.1rem;');
    expect(sitemapCss).not.toContain('font-weight: 700;');
    expect(cssSource).not.toContain('.native-sitemap-results-count');
  });

  it('keeps forms library listing cards rounded on the grey group containers', () => {
    const rendererSource = readSource('./nativeFunctionalRouteRenderers.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(rendererSource).toContain('const [topicFilter, setTopicFilter] = useState');
    expect(rendererSource).toContain('className="native-forms-category"');
    expect(rendererSource).toContain('All categories');
    expect(rendererSource).toContain('setTopicFilter(event.target.value)');
    expect(rendererSource).not.toContain('native-forms-count');
    expect(rendererSource).not.toContain('items.length} form');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) minmax(190px, 260px);');
    expect(cssSource).toContain('.native-forms-category select {');
    expect(cssSource).toContain('.native-forms-group {');
    expect(cssSource).toContain('background: #fafafa;');
    expect(cssSource).toContain('border-radius: 10px;');
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
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain("const resolvedPagePath = String(activePath || templatePath || '/').trim() || '/';");
    expect(source).toContain("isBlockOnlyManagedPagePath,");
    expect(source).toContain("toBlockOnlyManagedPageShell,");
    expect(source).toContain("const isBlockOnlyManagedPage = isBlockOnlyManagedPagePath(activePath || templatePath);");
    expect(source).toContain('const baseNativeContent = getNativePageContent(templatePath, page.title);');
    expect(source).toContain('const shouldUseBlockOnlyShell = isBlockOnlyManagedPage');
    expect(source).toContain('const baseContent = shouldUseBlockOnlyShell');
    expect(source).toContain('? toBlockOnlyManagedPageShell(baseNativeContent)');
    expect(source).toContain('const hasBlocksForPath = (pathname) => (');
    expect(source).toContain('&& managedBlocksByPath[pathname].length > 0');
    expect(source).toContain('const hasManagedBlockSource = Boolean(editableBlockPath);');
    expect(source).toContain('preIntroSections: [],');
    expect(source).toContain('sections: [],');
    expect(source).toContain(': (hasManagedBlockSource ? null : heroBase);');
    expect(compositionSource).toContain('const orderedBlocks = composeManagedBlockOrder(blocks);');
    expect(compositionSource).toContain('const renderedBlocks = orderedBlocks');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
    expect(source).not.toContain('const allowTargetedDynamicSections = !isBlockOnlyManagedPage;');
    expect(source).not.toContain('targetedDynamicCtaSections');
    expect(source).not.toContain('mappedSection');
    expect(source).not.toContain('targetSectionKey');
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
