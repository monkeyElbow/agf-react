import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readRuleBlock(source, selector) {
  const start = source.indexOf(selector);
  if (start === -1) {
    return '';
  }
  const nextRule = source.indexOf('\n\n.', start);
  return nextRule === -1 ? source.slice(start) : source.slice(start, nextRule);
}

describe('retirement 403(b) review polish guardrail', () => {
  it('keeps the 403(b) landing section copy aligned with the scroll-feature rebuild', () => {
    const source = readSource('./RetirementPage.jsx');
    const catalogSource = readSource('../data/siteFeatureCatalog.js');

    expect(source).toContain("import InvestmentsGrowthFeature from '../components/InvestmentsGrowthFeature';");
    expect(source).toContain('buildDynamicSiteFeatureFromBlock');
    expect(catalogSource).toContain("featureId: 'retirement_plan_feature'");
    expect(catalogSource).toContain("className: 'retirement-plan-feature'");
    expect(catalogSource).toContain("text: 'AGFinancial 403(b) Retirement Plan', className: 'is-white'");
    expect(catalogSource).toContain('Smart benefits, strong advantages');
    expect(catalogSource).toContain("body: 'The AGFinancial retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA.'");
    expect(catalogSource).toContain("title: 'Includes minister\\'s housing allowance, and a variety of investment strategies.'");
    expect(catalogSource).toContain("label: 'Explore the 403(b)'");
    expect(source).toContain('blockId="retirement_plan_feature"');
  });

  it('keeps the retirement hero wired to shared dynamic headline size and tracking controls', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain("import { heroTitleSizeRemToRuntimeCss, normalizeHeroTitleLetterSpacingEm } from '../lib/heroTitleSize';");
    expect(source).toContain('const heroHudTitleSize = heroTitleSizeRemToRuntimeCss(heroHudSettings.titleSizeRem);');
    expect(source).toContain('const heroHudLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(heroHudSettings.titleLetterSpacingEm);');
    expect(source).toContain('fontSize={heroHudTitleSize}');
    expect(source).toContain('letterSpacing={heroHudLetterSpacingEm}');
    expect(source).toContain('fontSize: heroHudTitleSize,');
    expect(source).toContain('letterSpacing: `${heroHudLetterSpacingEm}em`,');
  });

  it('keeps retirement hero spacing driven by shared HUD line-gap logic instead of a route-only css gap', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.retirement-native-hero-line {');
    expect(cssSource).not.toContain('.retirement-native-hero-line + .retirement-native-hero-line {');
  });

  it('keeps the rebuilt section on the shared investments reveal path with retirement dark-shell styling', () => {
    const cssSource = readSource('../styles/service-native.css');
    const shellRule = readRuleBlock(cssSource, '.investments-native-growth-feature.retirement-plan-feature {');
    const headingRule = readRuleBlock(cssSource, '.service-native-section.retirement-plan-feature h2.investments-native-build-title {');
    const leadRule = readRuleBlock(cssSource, '.retirement-plan-feature .investments-native-growth-card p {');

    expect(cssSource).toContain('.investments-native-growth-feature.retirement-plan-feature {');
    expect(shellRule).toContain('margin-top: -1px;');
    expect(shellRule).toContain('background: #4a484b;');
    expect(cssSource).toContain('.investments-native-growth-feature.retirement-plan-feature .investments-native-growth-surface {');
    expect(headingRule).toContain('color: #ffffff;');
    expect(headingRule).toContain('font-weight: 700;');
    expect(cssSource).toContain('.service-native-section.retirement-plan-feature h2.investments-native-build-title mark.is-white {');
    expect(cssSource).toContain('.retirement-plan-feature .investments-native-growth-card h3 {');
    expect(leadRule).toContain('color: rgba(255, 255, 255, 0.9);');
    expect(cssSource).toContain('.retirement-plan-feature .investments-native-growth-card--investor .service-native-action-row {');
    expect(cssSource).toContain('.retirement-plan-feature-action {');
    expect(cssSource).toContain('.retirement-account-card--certificate .service-native-action-row .service-native-btn.is-tone-mango,');
  });

  it('keeps the retirement do-the-math section on a retirement-specific render with billboard data and HUD coverage', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).not.toContain("contentBlockBlueprintsByPath['/services/retirement']");
    expect(source).not.toContain('function buildRetirementCanonicalBlocks(blocks) {');
    expect(source).toContain("columns_math: RETIREMENT_COLUMNS_MATH_HUD_PANEL_ID");
    expect(source).toContain("columns_math: '.retirement-do-the-math-billboard'");
    expect(source).toContain("block?.id === 'columns_math'");
    expect(source).toContain("block?.kind === 'billboard'");
    expect(source).toContain("import { HomeDoTheMathBadge } from '../components/blocks/PageBlocksRenderer';");
    expect(source).toContain("managedBlocksByPath['/services/retirement'].filter((block) => block && typeof block === 'object')");
    expect(source).not.toContain('HOME_COLUMNS_MATH_BILLBOARD_DEFAULTS');
    expect(source).not.toContain('const columnsMathBillboardBlock = useMemo(() => {');
    expect(source).not.toContain('buildRetirementHousingFeatureRuntime');
    expect(source).not.toContain('setupInvestmentsGrowthRevealMotion');
    expect(source).not.toContain('data-block-id="housing_feature"');
    expect(source).toContain('function buildRetirementDoTheMathRuntime(block) {');
    expect(source).toContain("const runtime = buildDynamicBillboardFromBlock(block);");
    expect(source).toContain("const RETIREMENT_SCALE_REVEAL_CLASS_NAME = 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up';");
    expect(source).toContain("const RETIREMENT_SCALE_REVEAL_ROOT_MARGIN = '0px 0px -20% 0px';");
    expect(source).toContain('copyClassName: appendRetirementScaleRevealClassName(runtime.copyClassName),');
    expect(source).toContain('data-fade-root-margin={retirementDoTheMathRuntime.copyFadeRootMargin || RETIREMENT_SCALE_REVEAL_ROOT_MARGIN}');
    expect(source).toContain('<HomeDoTheMathBadge');
    expect(source).not.toContain("id: 'home_do_the_math'");
    expect(source).toContain('className={`service-native-section retirement-do-the-math-billboard');
    expect(source).toContain("{renderHudAnchor('columns_math')}");
  });

  it('keeps the retirement everyday billboard reveal as an opt-in shared billboard feature', () => {
    const retirementSource = readSource('./RetirementPage.jsx');
    const seedSource = readSource('../data/retirementOverviewSeed.js');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const nativePageSource = readSource('../components/NativeContentPage.jsx');

    expect(seedSource).toContain("scrollReveal: 'scale-up'");
    expect(retirementSource).toContain("const billboardCopyUsesScrollProgress = renderedBillboard?.scrollReveal === 'scale-up';");
    expect(retirementSource).toContain("'billboard-scroll-progress-copy'");
    expect(retirementSource).toContain('data-fade-root-margin={billboardCopyUsesScrollProgress ? undefined : (renderedBillboard.copyFadeRootMargin || undefined)}');
    expect(runtimeSource).toContain('const scrollReveal = normalizeBillboardScrollReveal(settings.scrollReveal);');
    expect(runtimeSource).toContain("copyClassName: sanitizeClassName(settings.copyClassName || '')");
    expect(runtimeSource).toContain("|| (scrollReveal === 'scale-up' ? 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up' : '')");
    expect(runtimeSource).toContain("copyFadeRootMargin: scrollReveal === 'scale-up' ? '0px 0px -20% 0px' : ''");
    expect(nativePageSource).toContain("data-fade-root-margin={section.copyFadeRootMargin || undefined}");
  });

  it('keeps the retirement everyday billboard reveal route-scoped with reduced-motion fallback', () => {
    const source = readSource('./RetirementPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain("const RETIREMENT_BILLBOARD_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';");
    expect(source).toContain('const entryProgress = clampUnitInterval((viewportHeight * 0.94 - rect.top) / (viewportHeight * 0.46));');
    expect(source).toContain('const exitProgress = clampUnitInterval((rect.bottom - viewportHeight * 0.06) / (viewportHeight * 0.46));');
    expect(source).toContain("copy.style.opacity = opacity.toFixed(3);");
    expect(source).toContain("copy.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;");
    expect(cssSource).toContain('.retirement-everyday .native-info-section-copy.billboard-scroll-progress-copy,');
    expect(cssSource).toContain('transform-origin: 50% 50%;');
    expect(cssSource).toContain('will-change: opacity, transform;');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('transition: none;');
  });

  it('keeps rollover, daily, do-the-math, calculator, and CTA in the retirement order requested for the custom page', () => {
    const pageSource = readSource('./RetirementPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain("from '../data/retirementOverviewSeed'");
    expect(pageSource).toContain('buildDefaultRetirementBillboardRuntime');
    expect(pageSource).toContain('buildDefaultRetirementRolloverBillboardRuntime');
    expect(pageSource).toContain('defaultRetirementBillboardSettings');
    expect(pageSource).toContain('defaultRetirementRolloverBillboardSettings');
    expect(pageSource).toContain('const renderedBillboard = dynamicBillboard || DEFAULT_RETIREMENT_BILLBOARD;');
    expect(pageSource).toContain('? Math.max(Number(renderedBillboard.contentMaxWidthPx), 1480)');
    expect(pageSource).toContain("const renderedBillboardJustify = 'center';");
    expect(pageSource).toContain('const renderedRolloverBillboard = dynamicRolloverBillboard || DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD;');
    expect(pageSource).toContain("rollover_billboard: RETIREMENT_ROLLOVER_BILLBOARD_HUD_PANEL_ID");
    expect(pageSource).toContain("rollover_billboard: '.retirement-rollover-billboard'");
    expect(pageSource).toContain("block?.id === 'rollover_billboard'");
    expect(blueprintSource).toContain("from './retirementOverviewSeed'");
    expect(blueprintSource).toContain('defaultRetirementBillboardSettings');
    expect(blueprintSource).toContain('defaultRetirementRolloverBillboardSettings');
    expect(blueprintSource).toContain("id: 'rollover_billboard'");
    expect(cssSource).toContain('.retirement-everyday .native-info-rich-html {');
    expect(cssSource).toContain('width: min(860px, 100%);');
    expect(cssSource).toContain('.retirement-everyday .native-info-rich-html p {');
    expect(cssSource).toContain('font-size: clamp(1.18rem, 1.85vw, 1.42rem);');
    expect(cssSource).toContain('.retirement-daily-billboard > .ag-panel-rail {');
    expect(cssSource).toContain('width: min(var(--dynamic-billboard-max-width, 1480px), calc(100% - (var(--ag-panel-gutter) * 2)));');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('justify-self: center;');

    const billboardIndex = pageSource.indexOf('data-block-id="billboard"');
    const rolloverBillboardIndex = pageSource.indexOf('data-block-id="rollover_billboard"');
    const doTheMathIndex = pageSource.indexOf('data-block-id="columns_math"');
    const calculatorIndex = pageSource.indexOf('id="retirement-savings-calculator"');
    const ctaIndex = pageSource.indexOf('<DynamicCtaSection');
    expect(billboardIndex).toBeGreaterThan(-1);
    expect(rolloverBillboardIndex).toBeGreaterThan(-1);
    expect(doTheMathIndex).toBeGreaterThan(-1);
    expect(calculatorIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(-1);
    expect(rolloverBillboardIndex).toBeLessThan(billboardIndex);
    expect(billboardIndex).toBeLessThan(doTheMathIndex);
    expect(doTheMathIndex).toBeLessThan(calculatorIndex);
    expect(calculatorIndex).toBeLessThan(ctaIndex);
  });

  it('keeps the retirement calculator on the shared calculator system while preserving the svg chart structure', () => {
    const source = readSource('./RetirementPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain('Retirement Savings Calculator');
    expect(source).toContain('aria-label="Retirement projection chart"');
    expect(source).toContain('Current Age');
    expect(source).toContain('Expected Annual Return (%): <strong>{calcResults.growthPercent}</strong>');
    expect(source).toContain('Projected balance');
    expect(source).toContain('Target at retirement');
    expect(source).toContain('className="financial-tool-metrics retirement-calc-metrics"');
    expect(source).toContain('className="retirement-calc-chart financial-tool-chart-surface"');
    expect(cssSource).toContain('.retirement-calc-section {');
    expect(cssSource).toContain('background: linear-gradient(180deg, #fbf9f6 0%, #ffffff 100%);');
    expect(cssSource).toContain('.retirement-calc-box {');
    expect(cssSource).toContain('padding: clamp(1.1rem, 2.35vw, 1.75rem);');
    expect(cssSource).toContain('.native-financial-tool {');
    expect(cssSource).toContain('border-radius: 24px;');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('.retirement-calc-grid label {');
    expect(cssSource).toContain('text-transform: none;');
    expect(cssSource).toContain('.retirement-calc-grid label strong {');
    expect(cssSource).toContain('.retirement-calc-grid :is(input, select) {');
    expect(cssSource).toContain('min-height: 48px;');
    expect(cssSource).toContain('.retirement-calc-grid :is(input, select):focus-visible {');
    expect(cssSource).not.toContain('.retirement-calc-result-row {');
    expect(cssSource).toContain('.financial-tool-metric {');
    expect(cssSource).toContain('.retirement-calc-chart {');
    expect(cssSource).toContain('.financial-tool-chart-surface');
    expect(cssSource).toContain('.retirement-lead-form form {');
    expect(cssSource).toContain('border-radius: 20px;');
    expect(cssSource).toContain('background: rgba(255, 255, 255, 0.94);');
  });
});
