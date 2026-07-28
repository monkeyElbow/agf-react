import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLASSIFIED_ROUTE_SCOPED_DYNAMIC_SELECTORS = Object.freeze({
  'native-info-page--about': 'About intro heading color needs to override dynamic intro text tone.',
  'native-info-page--calculators': 'Calculators overview cards need route-specific title, body, padding, and hover treatment.',
  'native-info-page--calculator-tool': 'Calculator tool routes need route-specific intro/contact CTA spacing.',
  'native-info-page--group-life-quote': 'Group term life benefit cards need route-specific dynamic grid card title sizing.',
  'native-info-page--insurance': 'Insurance overview keeps route-specific dynamic section art direction.',
  'native-info-page--life-quote': 'Life quote product cards need route-specific dynamic grid card shell sizing.',
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
      '.native-info-page--calculator-tool .service-native-section.calculator-tool-shell + .service-native-section.calculator-tool-contact.native-dynamic-cta {',
      'padding-top: clamp(2.1rem, 4.4vw, 3.4rem);',
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

  it('keeps consultant directory headers aligned with Forms headers and state filters rounded', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--loans-consultant .consultant-native-page-head.native-functional-page-head {',
      'padding: clamp(2.1rem, 4vw, 3rem) 0 clamp(1.15rem, 3vw, 1.9rem);',
      '.native-info-page--loans-consultant .consultant-native-page-head > .ag-panel-rail {',
      'max-width: min(1200px, calc(100% - (var(--ag-panel-gutter) * 2)));',
      '.native-info-page--loans-consultant .consultant-native-page-head .native-info-section-copy {',
      '.native-info-page--loans-consultant .consultant-native-page-head h1 {',
      '--ag-letter-spacing-avenir-heading: var(--ag-letter-spacing-avenir-hero);',
      'font-size: clamp(2.2rem, 6vw, 4rem);',
      'text-align: left;',
      '.native-info-page--loans-consultant .consultant-native-page-head h1 mark {',
      'color: inherit;',
      '.native-info-page--loans-consultant .native-info-location-filter select {',
      'border-radius: 999px;',
      'appearance: none;',
      '.native-info-page--loans-consultant .native-info-location-filter select:focus-visible {',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).not.toContain('.native-info-page--loans-consultant .service-native-hero {');
  });

  it('keeps the contact page hero aligned to the Resources header treatment', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--contact-us .service-native-hero {',
      '--service-native-hero-rail-min-height: 0;',
      'padding: clamp(2.1rem, 4vw, 3rem) 0 clamp(1.2rem, 3.2vw, 2rem);',
      '.native-info-page--contact-us .service-native-hero .ag-panel-rail {',
      'min-height: 0;',
      'justify-items: start;',
      '.native-info-page--contact-us .service-native-hero h1 {',
      'color: var(--ag-color-atlantean);',
      'font-size: clamp(2.2rem, 6vw, 4rem) !important;',
      'line-height: 0.95 !important;',
      'letter-spacing: var(--ag-letter-spacing-avenir-heading) !important;',
      'text-align: left;',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).not.toContain('.native-info-page--contact-us .service-native-hero .ag-panel-rail {\n  justify-items: end;');
    expect(source).not.toContain('.native-info-page--contact-us .service-native-hero h1 {\n  color: var(--ag-color-atlantean);\n  text-align: right;');
  });

  it('keeps the contact details on a centered white address block with left-aligned dark copy', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--contact-us .contact-us-address {',
      'background: #ffffff;',
      'color: var(--ag-color-super-grey);',
      '.native-info-page--contact-us .contact-us-address > .ag-panel-rail {',
      'width: min(42rem, calc(100% - (var(--ag-panel-gutter) * 2)));',
      'margin-inline: auto;',
      '.native-info-page--contact-us .contact-us-address .native-info-section-copy {',
      'width: fit-content;',
      'max-width: min(100%, 32rem);',
      'justify-items: start;',
      '.native-info-page--contact-us .contact-us-address h2 {',
      'color: var(--ag-color-atlantean);',
      'text-align: left;',
      '.native-info-page--contact-us .contact-us-address p {',
      'text-align: left;',
      '.native-info-page--contact-us .contact-us-address > .ag-panel-rail > :is(h2, p, .native-info-rich-html, .native-info-link-list) {',
      'width: min(100%, 32rem);',
      'margin-left: auto;',
      'margin-right: auto;',
      '.native-info-page--contact-us .contact-us-address p:nth-of-type(4) strong,',
      'color: var(--ag-color-mango);',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).not.toContain('.native-info-page--contact-us .contact-us-address {\n  background: var(--ag-color-super-grey);');
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
      '.native-dynamic-request.is-request-form-preset-contact .dynamic-request-layout {',
      '.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-copy > h2,',
      '.native-dynamic-request.is-request-form-preset-consultant-contact .dynamic-request-layout {',
      '.native-dynamic-request.is-request-form-preset-retirement-rollover .dynamic-request-layout {',
      '.calculators-native-billboard.dynamic-billboard > .ag-panel-rail {',
      '.calculators-native-cta.native-dynamic-cta .dynamic-cta-form {',
      '.impact-native-stats .service-native-grid {',
      '.impact-native-billboard.dynamic-billboard .native-info-section-copy {',
      '.legacy-giving-wills.dynamic-billboard .native-info-section-copy > h2 {',
      '.legacy-giving-cta .dynamic-cta-form-heading {',
      '.legacy-giving-cta .dynamic-cta-form-subtitle {',
      '.native-dynamic-request.is-request-form-preset-legacy-cga .dynamic-request-layout {',
      '.native-dynamic-request.is-request-form-preset-legacy-generosity .dynamic-request-layout {',
      '.native-dynamic-request.is-request-form-preset-legacy-endowment .dynamic-request-layout {',
      '.native-dynamic-request.is-request-form-preset-legacy-impact .dynamic-request-layout {',
      '.legacy-child-native-trust-choices--trusts.native-dynamic-grid .service-native-grid {',
      '.tax-guide-content.native-dynamic-page-content .native-info-rich-html {',
      '.service-native-intro.test-dynamic-intro {',
      '.service-native-section.test-dynamic-billboard {',
    ].forEach((ownedSelector) => {
      expect(source).toContain(ownedSelector);
    });
  });

  it('keeps CGA option-card titles centered without divider lines', () => {
    const source = readSource('./service-native.css');

    [
      '.native-info-page--legacy-cga .legacy-child-native-cga-options .service-native-card h3 {',
      'text-align: center;',
      'justify-content: center;',
      '.native-info-page--legacy-cga .legacy-child-native-cga-options .service-native-card h3::after {',
      'display: none;',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).not.toContain('.native-info-page--legacy-cga .legacy-child-native-cga-options .service-native-card h3::after {\n  content: \'\';');
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
      '--dynamic-grid-body-color: var(--ag-color-super-grey);',
      '--dynamic-grid-card-title-color: var(--ag-color-super-grey);',
      'padding-bottom: clamp(1.35rem, 2.9vw, 2.25rem);',
      'box-shadow: 0 20px 46px rgba(0, 0, 0, 0.26);',
      '.native-info-page--retirement-iras .retirement-child-native-ira-types .service-native-card > div {',
      'justify-items: center;',
      '.native-info-page--retirement-iras .retirement-child-native-ira-types .service-native-card > div > p {',
      'justify-self: stretch;',
      'text-align: left;',
      '.native-info-page--retirement-iras .retirement-child-native-ira-types .service-native-card h3 {',
      'display: block;',
      'min-height: 0;',
      'margin: 0 0 0.95rem;',
      'padding-bottom: 0;',
      '.native-info-page--retirement-iras .retirement-child-native-ira-types > :is(.ag-panel-rail, .ag-panel-rail-wide, .native-info-full-bleed) > .service-native-action-row {',
      'margin-top: clamp(2.5rem, 5.6vw, 4rem);',
      'justify-content: center !important;',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).toContain('.service-native-section.native-dynamic-grid.is-bg-grey,');
    expect(source).toContain('background: linear-gradient(145deg, var(--ag-color-super-grey) 0%, #636265 100%);');
    expect(source).not.toContain('background: linear-gradient(145deg, #333335 0%, var(--ag-color-super-grey) 48%, #5f5e61 100%);');
  });

  it('keeps the shared retirement daily billboard treatment available for IRA CTA reuse', () => {
    const source = readSource('./service-native.css');

    [
      '.retirement-daily-billboard .native-info-section-copy {',
      'text-align: center;',
      '.retirement-daily-billboard > .ag-panel-rail {',
      'width: min(var(--dynamic-billboard-max-width, 1480px), calc(100% - (var(--ag-panel-gutter) * 2)));',
      '.retirement-daily-billboard .native-info-section-copy > h2 {',
      'line-height: 0.88;',
      '.service-native-section.dynamic-billboard.retirement-daily-billboard .service-native-action-row,',
      'justify-content: center;',
    ].forEach((expectedSelector) => {
      expect(source).toContain(expectedSelector);
    });

    expect(source).not.toContain('.native-info-page--retirement-iras .retirement-ira-native-cta > .ag-panel-rail {');
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
      '.native-info-viewport-bleed {',
      '.about-native-building-shot,',
      'inline-size: 100vw;',
      'margin-left: calc(50% - 50vw);',
      'margin-right: calc(50% - 50vw);',
      '.about-native-building-shot > .native-info-viewport-bleed,',
      '.native-info-page--about .about-native-building-shot > :is(.ag-panel-rail-wide, .ag-panel-rail) {',
      'inline-size: 100vw !important;',
      'width: 100vw;',
      'max-inline-size: 100vw !important;',
      '.about-native-building-shot .native-info-section-logo,',
      '.native-info-page--about .about-native-building-shot .native-info-section-logo {',
      'height: clamp(430px, 53vw, 760px);',
      'transform: translate3d(0, var(--about-building-parallax-y), 0) scale(1.14);',
      '.native-info-page--about .about-native-strategy {',
      'padding-top: clamp(2.25rem, 4.6vw, 3.65rem);',
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
