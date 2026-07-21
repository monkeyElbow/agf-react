import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLASSIFIED_ROUTE_SCOPED_DYNAMIC_SELECTORS = Object.freeze({
  'native-info-page--calculator-tool': 'Calculator tool routes need route-specific intro/contact CTA spacing.',
  'native-info-page--insurance': 'Insurance overview keeps route-specific dynamic section art direction.',
});

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function splitSelectorList(selector) {
  const selectors = [];
  let depth = 0;
  let current = '';

  for (const char of selector) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (char === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    selectors.push(current.trim());
  }

  return selectors;
}

function getRouteScopedDynamicSelectorClasses(source) {
  const selectorPattern = /([^{}@][^{}]*)\{/g;
  const routeClasses = new Set();
  let match = selectorPattern.exec(source);

  while (match) {
    const selector = String(match[1] || '').trim();
    splitSelectorList(selector).forEach((selectorArm) => {
      const isRouteScoped = selectorArm.includes('.native-info-page--');
      const touchesDynamicBlockSurface = /\b(?:native-dynamic-|test-dynamic-|dynamic-(?:request|cta|newsletter|billboard|intro))/.test(selectorArm);

      if (isRouteScoped && touchesDynamicBlockSurface) {
        [...selectorArm.matchAll(/\.native-info-page--[a-z0-9-]+/g)]
          .map((routeMatch) => routeMatch[0].slice(1))
          .forEach((routeClass) => routeClasses.add(routeClass));
      }
    });

    match = selectorPattern.exec(source);
  }

  return [...routeClasses].sort();
}

describe('service-native style ownership', () => {
  it('keeps route-scoped dynamic block styling explicitly classified', () => {
    const source = readSource('./service-native.css');

    expect(getRouteScopedDynamicSelectorClasses(source)).toEqual(
      Object.keys(CLASSIFIED_ROUTE_SCOPED_DYNAMIC_SELECTORS).sort(),
    );
  });

  it('keeps calculator tool content shells from inheriting default blank content-block spacing', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--calculator-tool .service-native-section.calculator-tool-shell {',
      'padding-block: clamp(0.7rem, 1.2vw, 1rem);',
      '.native-info-page--calculator-tool .service-native-section.calculator-tool-shell + .service-native-section.calculator-tool-shell {',
      'padding-top: 0;',
      '.native-info-page--calculator-increased-contribution .service-native-section.calculator-tool-shell {',
      'padding-block: clamp(0.52rem, 0.9vw, 0.78rem);',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    [
      '.native-info-page--calculator-tool .calculator-tool-shell {',
      '.native-info-page--calculator-tool .calculator-tool-shell + .calculator-tool-shell {',
      '.native-info-page--calculator-increased-contribution .calculator-tool-shell {',
    ].forEach((weakSelector) => {
      expect(source).not.toContain(weakSelector);
    });
  });

  it('keeps migrated dynamic block style hooks block-owned instead of page-prefixed', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--contact-us .native-dynamic-request.contact-us-request',
      '.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request',
      '.native-info-page--loans-consultant .native-dynamic-request.loans-consultant-native-contact',
      '.native-info-page--retirement-rollovers .retirement-rollovers-native-request.native-dynamic-request',
      '.native-info-page--calculators .calculators-native-billboard.dynamic-billboard',
      '.native-info-page--calculators .calculators-native-cta.native-dynamic-cta',
      '.native-info-page--impact .impact-native-stats',
      '.native-info-page--impact .service-native-section.dynamic-billboard',
      '.native-info-page--legacy-giving .legacy-giving-wills.dynamic-billboard',
      '.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-heading',
      '.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-subtitle',
      '.native-info-page--legacy-cga .legacy-child-native-cga-request.native-dynamic-request',
      '.native-info-page--legacy-generosity-fund .legacy-child-native-generosity-request.native-dynamic-request',
      '.native-info-page--legacy-endowments .legacy-child-native-endowments-legacy-form.native-dynamic-request',
      '.native-info-page--legacy-ministry-impact .legacy-child-native-request.native-dynamic-request',
      '.native-info-page--legacy-trusts .legacy-child-native-trust-choices--trusts.native-dynamic-grid',
      '.native-info-page--tax-guide .service-native-section.native-dynamic-page-content',
      '.native-info-page--test .service-native-intro.test-dynamic-intro',
      '.native-info-page--test .service-native-section.test-dynamic-',
    ].forEach((retiredSelector) => {
      expect(source).not.toContain(retiredSelector);
    });

    [
      '.native-dynamic-request.contact-us-request .dynamic-request-layout {',
      '.group-life-native-quote.native-dynamic-request .dynamic-request-copy > h2,',
      '.native-dynamic-request.loans-consultant-native-contact .dynamic-request-layout {',
      '.retirement-rollovers-native-request.native-dynamic-request .dynamic-request-layout {',
      '.calculators-native-billboard.dynamic-billboard > .ag-panel-rail {',
      '.calculators-native-cta.native-dynamic-cta .dynamic-cta-form {',
      '.impact-native-stats .service-native-grid {',
      '.impact-native-billboard.dynamic-billboard .native-info-section-copy {',
      '.legacy-giving-wills.dynamic-billboard .native-info-section-copy > h2 {',
      '.legacy-giving-cta .dynamic-cta-form-heading {',
      '.legacy-giving-cta .dynamic-cta-form-subtitle {',
      '.legacy-child-native-cga-request.native-dynamic-request .dynamic-request-layout {',
      '.legacy-child-native-generosity-request.native-dynamic-request .dynamic-request-layout {',
      '.legacy-child-native-endowments-legacy-form.native-dynamic-request .dynamic-request-layout {',
      '.legacy-child-native-request.native-dynamic-request .dynamic-request-layout {',
      '.legacy-child-native-trust-choices--trusts.native-dynamic-grid .service-native-grid {',
      '.tax-guide-content.native-dynamic-page-content .native-info-rich-html {',
      '.service-native-intro.test-dynamic-intro {',
      '.service-native-section.test-dynamic-billboard {',
    ].forEach((ownedSelector) => {
      expect(source).toContain(ownedSelector);
    });
  });

  it('keeps retired 403b section selectors out of service-native CSS', () => {
    const source = readSource('./service-native.css');

    [
      'retirement-403b-native-quickcheck',
      'retirement-403b-native-cta',
      'retirement-403b-native-apply',
      'retirement-403b-native-housing',
      'ret403b-housing-feature-',
    ].forEach((retiredSelectorToken) => {
      expect(source).not.toContain(retiredSelectorToken);
    });
  });

  it('keeps the ministers housing quick check calculator widget styled as a functional surface', () => {
    const source = readSource('./service-native.css');

    [
      '.retirement-403b-quickcheck-widget {',
      '.ret403b-qc-stepper {',
      '.ret403b-qc-card {',
      '.ret403b-qc-fields {',
      '.ret403b-qc-nav {',
    ].forEach((ownedSelector) => {
      expect(source).toContain(ownedSelector);
    });
  });

  it('keeps the IRA comparison table on the live InfoTableSheet styling instead of retired data-table selectors', () => {
    const source = readSource('./service-native.css');
    const infoTableSource = readSource('../components/InfoTableSheet.css');

    [
      '.retirement-child-native-comparison .native-info-table-wrap .data-table',
      '.retirement-child-native-comparison .native-info-table-wrap .data-table thead th:nth-child(3)',
      '.retirement-child-native-comparison .native-info-table-wrap .data-table tbody td:nth-child(3)',
      '.retirement-child-native-comparison .info-table-sheet__cell-kicker',
    ].forEach((retiredSelector) => {
      expect(source).not.toContain(retiredSelector);
    });

    [
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__table thead th:nth-child(1) {',
      'border-radius: 14px 14px 0 0;',
      'background: linear-gradient(135deg, var(--ag-color-atlantean-dark) 0%, var(--ag-color-atlantean) 100%);',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__table thead th:nth-child(2) {',
      'background: linear-gradient(135deg, #f7b229 0%, var(--ag-color-mango) 100%);',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__table tbody td:nth-child(1) {',
      'background: #eef8fa;',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__table tbody td:nth-child(2) {',
      'background: #fff6e8;',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__table tbody tr:last-child td:nth-child(1),',
      'border-radius: 0 0 14px 14px;',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__cell-list li + li {',
    ].forEach((ownedSelector) => {
      expect(source).toContain(ownedSelector);
    });

    expect(infoTableSource).not.toContain(
      '.info-table-sheet[data-info-table-first-column-header="false"] .info-table-sheet__table tbody td,\n'
        + '.info-table-sheet[data-info-table-first-column-header="false"] .info-table-sheet__card-value',
    );
    expect(infoTableSource).toContain(
      '.info-table-sheet[data-info-table-first-column-header="false"] .info-table-sheet__card-value {',
    );
  });

  it('keeps the IRA type cards free from shared card title top spacing', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--retirement-iras .retirement-child-native-ira-types {',
      'padding-bottom: clamp(1.35rem, 2.9vw, 2.25rem);',
      'box-shadow: 0 20px 46px rgba(0, 0, 0, 0.26);',
      '.native-info-page--retirement-iras .retirement-child-native-ira-types .service-native-card h3 {',
      'display: block;',
      'min-height: 0;',
      'margin: 0 0 0.95rem;',
      'padding-bottom: 0;',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).toContain('.service-native-section.native-dynamic-grid.is-bg-grey,');
    expect(source).toContain('background: linear-gradient(145deg, var(--ag-color-super-grey) 0%, #636265 100%);');
    expect(source).not.toContain('background: linear-gradient(145deg, #333335 0%, var(--ag-color-super-grey) 48%, #5f5e61 100%);');
  });

  it('keeps the IRA comparison section on the light card treatment', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--retirement-iras .retirement-child-native-comparison {',
      'background: #fff;',
      '.native-info-page--retirement-iras .retirement-child-native-comparison > .native-info-full-bleed > h2 {',
      'color: var(--ag-color-super-grey);',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .native-info-table-wrap {',
      '--ira-comparison-shadow-gutter: clamp(1.1rem, 2.2vw, 1.6rem);',
      'overflow: visible;',
      'filter: drop-shadow(0 18px 34px rgba(65, 64, 66, 0.18));',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .info-table-sheet__card {',
      'box-shadow: 0 16px 34px rgba(65, 64, 66, 0.16);',
      '.native-info-page--retirement-iras .retirement-child-native-comparison .service-native-note {',
      'color: rgba(65, 64, 66, 0.76);',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });
  });

  it('keeps About one-off visual restorations on named section surfaces', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--about .about-native-building-shot .native-columns-media-wrap {',
      'min-height: clamp(430px, 53vw, 760px);',
      '.native-info-page--about .about-native-values {',
      '--investments-growth-display-size: clamp(3.8rem, 8.2vw, 6.35rem);',
      '.native-info-page--about .about-native-values .investments-native-growth-grid {',
      'grid-template-columns: minmax(0, 1fr);',
      '.native-info-page--about .about-native-values .investments-native-growth-card h3 {',
      'width: max-content;',
      'white-space: nowrap;',
      '.native-info-page--about .about-native-strategy .service-native-action-row {',
      '.native-info-page--about .about-native-allies .service-native-action-row {',
      '.native-info-page--about .about-native-history .service-native-action-row {',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });
  });
});
