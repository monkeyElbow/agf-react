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

  it('keeps the retirement everyday billboard reveal as an opt-in shared billboard feature', () => {
    const retirementSource = readSource('./RetirementPage.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const nativePageSource = readSource('../components/NativeContentPage.jsx');

    expect(retirementSource).toContain("scrollReveal: 'scale-up'");
    expect(retirementSource).toContain("copyClassName: 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up'");
    expect(retirementSource).toContain("data-fade-root-margin={renderedBillboard.copyFadeRootMargin || undefined}");
    expect(runtimeSource).toContain('const scrollReveal = normalizeBillboardScrollReveal(settings.scrollReveal);');
    expect(runtimeSource).toContain("copyClassName: scrollReveal === 'scale-up' ? 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up' : ''");
    expect(runtimeSource).toContain("copyFadeRootMargin: scrollReveal === 'scale-up' ? '0px 0px -40% 0px' : ''");
    expect(nativePageSource).toContain("data-fade-root-margin={section.copyFadeRootMargin || undefined}");
  });

  it('keeps the retirement everyday billboard reveal route-scoped with reduced-motion fallback', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.retirement-everyday .native-info-section-copy.fade-up.billboard-scroll-reveal-scale-up,');
    expect(cssSource).toContain('transform-origin: 50% 50%;');
    expect(cssSource).toContain('.retirement-everyday .native-info-section-copy.fade-up.billboard-scroll-reveal-scale-up[data-fade-state="pending"],');
    expect(cssSource).toContain('opacity: 0.18;');
    expect(cssSource).toContain('transform: translate3d(0, 58px, 0) scale(0.92);');
    expect(cssSource).toContain('.retirement-everyday .native-info-section-copy.fade-up.billboard-scroll-reveal-scale-up.is-visible,');
    expect(cssSource).toContain('transform: translate3d(0, 0, 0) scale(1);');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(cssSource).toContain('transition: none;');
  });

  it('keeps the retirement calculator on a branded sheet while preserving the svg chart structure', () => {
    const source = readSource('./RetirementPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain('Retirement Savings Calculator');
    expect(source).toContain('aria-label="Retirement projection chart"');
    expect(source).toContain('Current Age');
    expect(source).toContain('Expected Annual Return (%): <strong>{calcResults.growthPercent}</strong>');
    expect(source).toContain('Projected balance');
    expect(source).toContain('Target at retirement');
    expect(cssSource).toContain('.retirement-calc-section {');
    expect(cssSource).toContain('background: linear-gradient(180deg, #fbf9f6 0%, #ffffff 100%);');
    expect(cssSource).toContain('.retirement-calc-box {');
    expect(cssSource).toContain('border: 1px solid rgba(17, 53, 75, 0.12);');
    expect(cssSource).toContain('border-radius: 24px;');
    expect(cssSource).toContain('background: linear-gradient(180deg, rgba(250, 249, 247, 0.96) 0%, rgba(255, 255, 255, 0.985) 100%);');
    expect(cssSource).toContain('.retirement-calc-grid label {');
    expect(cssSource).toContain('text-transform: uppercase;');
    expect(cssSource).toContain('.retirement-calc-grid label strong {');
    expect(cssSource).toContain('.retirement-calc-grid :is(input, select) {');
    expect(cssSource).toContain('min-height: 52px;');
    expect(cssSource).toContain('.retirement-calc-grid :is(input, select):focus-visible {');
    expect(cssSource).toContain('.retirement-calc-result-row {');
    expect(cssSource).toContain('border-radius: 16px;');
    expect(cssSource).toContain('background: rgba(255, 255, 255, 0.97);');
    expect(cssSource).toContain('.retirement-calc-result-row:first-of-type {');
    expect(cssSource).toContain('.retirement-calc-chart {');
    expect(cssSource).toContain('border-radius: 20px;');
    expect(cssSource).toContain('background: rgba(255, 255, 255, 0.98);');
    expect(cssSource).toContain('.retirement-lead-form form {');
    expect(cssSource).toContain('border-radius: 20px;');
    expect(cssSource).toContain('background: rgba(255, 255, 255, 0.94);');
  });
});
