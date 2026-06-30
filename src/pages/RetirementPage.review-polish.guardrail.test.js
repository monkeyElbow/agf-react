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
  it('keeps the 403(b) landing section copy aligned with the WP reference phrasing', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain('Smart benefits, strong advantages');
    expect(source).toContain('The AGFinancial flagship retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA. Choose from a variety of strategies.');
    expect(source).toContain('Includes <mark className="is-mango">minister&apos;s housing allowance</mark>, higher contribution limits than IRAs, and more.');
    expect(source).toContain('>Explore the 403(b)<');
  });

  it('keeps the section on the dark-shell hierarchy with reversed title and lead copy', () => {
    const cssSource = readSource('../styles/service-native.css');
    const introRule = readRuleBlock(cssSource, '.retirement-plan-intro {');
    const headingRule = readRuleBlock(cssSource, '.retirement-plan-heading {');
    const leadRule = readRuleBlock(cssSource, '.retirement-plan-lead {');

    expect(cssSource).toContain('.retirement-plan-section {');
    expect(cssSource).toContain('background: linear-gradient(145deg, var(--ag-color-super-grey) 0%, #5d5c60 100%);');
    expect(cssSource).toContain('.retirement-plan-intro {');
    expect(introRule).not.toContain('background: #ffffff;');
    expect(headingRule).toContain('color: #ffffff;');
    expect(cssSource).toContain('.retirement-plan-subheading {');
    expect(cssSource).toContain('color: var(--ag-color-mango);');
    expect(leadRule).toContain('color: #ffffff;');
    expect(cssSource).toContain('.retirement-plan-footer mark {');
  });

  it('keeps housing and do the math on the shared columns-family path with retirement HUD coverage', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain("contentBlockBlueprintsByPath['/services/retirement']");
    expect(source).toContain('function buildRetirementCanonicalBlocks(blocks) {');
    expect(source).toContain("columns_mha: RETIREMENT_COLUMNS_MHA_HUD_PANEL_ID");
    expect(source).toContain("columns_math: RETIREMENT_COLUMNS_MATH_HUD_PANEL_ID");
    expect(source).toContain("columns_math: '.native-dynamic-columns[data-block-id=\"columns_math\"]'");
    expect(source).toContain("block?.id === 'columns_mha'");
    expect(source).toContain("block?.id === 'columns_math'");
    expect(source).toContain("ownership={getOwnershipVisualForBlockId('columns_mha')}");
    expect(source).toContain("ownership={getOwnershipVisualForBlockId('columns_math')}");
    expect(source).toContain("hudAnchor={renderHudAnchor('columns_mha')}");
    expect(source).toContain("hudAnchor={renderHudAnchor('columns_math')}");
    expect(source).not.toContain('HousingBlock');
    expect(source).not.toContain('DoTheMathBlock');
  });

  it('keeps the retirement everyday billboard reveal as an opt-in shared billboard feature', () => {
    const retirementSource = readSource('./RetirementPage.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const nativePageSource = readSource('../components/NativeContentPage.jsx');

    expect(retirementSource).toContain("scrollReveal: 'scale-up'");
    expect(retirementSource).toContain("copyClassName: 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up'");
    expect(retirementSource).toContain("const billboardCopyUsesScrollProgress = renderedBillboard?.scrollReveal === 'scale-up';");
    expect(retirementSource).toContain("'billboard-scroll-progress-copy'");
    expect(retirementSource).toContain('data-fade-root-margin={billboardCopyUsesScrollProgress ? undefined : (renderedBillboard.copyFadeRootMargin || undefined)}');
    expect(runtimeSource).toContain('const scrollReveal = normalizeBillboardScrollReveal(settings.scrollReveal);');
    expect(runtimeSource).toContain("copyClassName: scrollReveal === 'scale-up' ? 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up' : ''");
    expect(runtimeSource).toContain("copyFadeRootMargin: scrollReveal === 'scale-up' ? '0px 0px -40% 0px' : ''");
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

  it('keeps the daily billboard restored above the managed rollover billboard and CTA form', () => {
    const pageSource = readSource('./RetirementPage.jsx');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(pageSource).toContain("title: 'Retire a little every day.'");
    expect(pageSource).toContain("bodyHtml: '<h3>Starting now.</h3>'");
    expect(pageSource).toContain("buttonUrl: '/services/retirement/retirement-consultants'");
    expect(pageSource).toContain("buttonLabel: 'Reach my consultant'");
    expect(pageSource).toContain("title: 'A rollover is easy. Smart, too.'");
    expect(pageSource).toContain('Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple...and undeniably smart. One account. One login.');
    expect(pageSource).toContain("buttonUrl: '/services/retirement/rollovers'");
    expect(pageSource).toContain("buttonLabel: 'Start a rollover'");
    expect(pageSource).toContain("rollover_billboard: RETIREMENT_ROLLOVER_BILLBOARD_HUD_PANEL_ID");
    expect(pageSource).toContain("rollover_billboard: '.retirement-rollover-billboard'");
    expect(pageSource).toContain("block?.id === 'rollover_billboard'");
    expect(blueprintSource).toContain("title: 'Retire a little every day.'");
    expect(blueprintSource).toContain("titleHighlightsJson: '[{\"text\":\"every day\",\"className\":\"is-mango\"}]'");
    expect(blueprintSource).toContain("href: '/services/retirement/retirement-consultants'");
    expect(blueprintSource).toContain("id: 'rollover_billboard'");
    expect(blueprintSource).toContain("title: 'A rollover is easy. Smart, too.'");
    expect(blueprintSource).toContain("titleHighlightsJson: '[{\"text\":\"Smart, too.\",\"className\":\"is-melon\"}]'");
    expect(blueprintSource).toContain("contentMaxWidthPx: 1080");
    expect(blueprintSource).toContain("label: 'Start a rollover'");
    expect(blueprintSource).toContain("href: '/services/retirement/rollovers'");
    expect(cssSource).toContain('.retirement-everyday .native-info-rich-html {');
    expect(cssSource).toContain('width: min(860px, 100%);');
    expect(cssSource).toContain('.retirement-everyday .native-info-rich-html p {');
    expect(cssSource).toContain('font-size: clamp(1.18rem, 1.85vw, 1.42rem);');

    const billboardIndex = pageSource.indexOf('data-block-id="billboard"');
    const rolloverBillboardIndex = pageSource.indexOf('data-block-id="rollover_billboard"');
    const ctaIndex = pageSource.indexOf('<DynamicCtaSection');
    expect(billboardIndex).toBeGreaterThan(-1);
    expect(rolloverBillboardIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(-1);
    expect(billboardIndex).toBeLessThan(rolloverBillboardIndex);
    expect(rolloverBillboardIndex).toBeLessThan(ctaIndex);
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
