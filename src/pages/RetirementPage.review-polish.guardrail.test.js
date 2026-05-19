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
});
