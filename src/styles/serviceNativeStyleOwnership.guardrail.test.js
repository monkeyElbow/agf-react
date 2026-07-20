import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLASSIFIED_ROUTE_SCOPED_DYNAMIC_SELECTORS = Object.freeze({});

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
});
