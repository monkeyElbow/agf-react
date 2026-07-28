import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function splitSelectorList(selectorList) {
  const selectors = [];
  let current = '';
  let depth = 0;

  for (const char of selectorList) {
    if (char === '(' || char === '[') {
      depth += 1;
    } else if ((char === ')' || char === ']') && depth > 0) {
      depth -= 1;
    }

    if (char === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    selectors.push(current.trim());
  }

  return selectors;
}

function extractCssSelectors(source) {
  const selectors = [];
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{}]+)\{/g;
  let match;

  while ((match = rulePattern.exec(withoutComments))) {
    const selectorList = match[1].trim();
    if (!selectorList || selectorList.startsWith('@')) {
      continue;
    }
    selectors.push(...splitSelectorList(selectorList));
  }

  return selectors;
}

const REQUEST_FORM_INTERNAL_SELECTOR_PARTS = [
  '.dynamic-request-layout',
  '.dynamic-request-shell',
  '.dynamic-request-copy',
  '.dynamic-request-copy-shell',
  '.dynamic-request-form',
  '.dynamic-request-panel',
  '.dynamic-request-grid',
  '.dynamic-request-field',
  '.dynamic-request-fieldset',
  '.dynamic-request-choice-row',
  '.dynamic-request-help',
  '.dynamic-request-error',
  '.dynamic-request-step-meta',
  '.dynamic-request-progress',
  '.native-info-inline-form',
  '.native-info-inline-form-step-actions',
  '.native-info-inline-form-progress',
  '.native-info-inline-form-dot',
  '.native-info-section-copy',
];

const REQUEST_FORM_ROUTE_SECTION_CLASSES = [
  '.certificate-request-native-section',
  '.certificate-request-form',
  '.contact-us-request',
  '.group-life-native-quote',
  '.insurance-pc-native-quote',
  '.legacy-child-native-cga-request',
  '.legacy-child-native-endowments-legacy-form',
  '.legacy-child-native-generosity-request',
  '.legacy-child-native-request',
  '.loans-native-inquiry',
  '.retirement-rollovers-native-request',
];

describe('request form renderer guardrail', () => {
  it('keeps the shared request-form renderer in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("import DynamicRequestFormSection from './DynamicRequestFormSection';");
    expect(source).toContain('buildDynamicRequestFormFromBlock');
    expect(source).toContain('const runtime = buildDynamicRequestFormFromBlock(block);');
    expect(source).toContain("if (config.variant === 'dynamic-request') {");
    expect(source).toContain('return <DynamicRequestFormSection config={config} />;');
  });

  it('keeps the shared request-form renderer in the block renderer path', () => {
    const source = readSource('./blocks/PageBlocksRenderer.jsx');

    expect(source).toContain("import DynamicRequestFormSection from '../DynamicRequestFormSection';");
    expect(source).toContain('buildDynamicRequestFormFromBlock');
    expect(source).toContain('<DynamicRequestFormSection');
    expect(source).toContain("className={`service-native-section ${runtime.sectionClassName}${ownership?.className || ''}`}");
    expect(source).toContain('style={runtime.sectionStyle}');
  });

  it('keeps LoansPage on the shared request-form renderer instead of a bespoke request_form implementation', () => {
    const source = readSource('../pages/LoansPage.jsx');

    expect(source).toContain("import DynamicRequestFormSection from '../components/DynamicRequestFormSection';");
    expect(source).toContain('<DynamicRequestFormSection config={inquiryConfig} />');
    expect(source).not.toContain('loans-native-inquiry-form');
    expect(source).not.toContain('onInquirySubmit');
    expect(source).not.toContain('renderInquiryField(');
  });

  it('renders dynamic request blocks directly instead of targeting native sections', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'request_form') {");
    expect(source).toContain('const requestSection = buildDynamicRequestFormSection(block, activePath);');
    expect(source).toContain('acc.push(requestSection);');
    expect(source).toContain('return <DynamicRequestFormSection config={config} />;');
    expect(source).not.toContain('const targetedDynamicRequestSections = new Map();');
    expect(source).not.toContain("const targetKey = String(mappedSection?.targetSectionKey || '').trim();");
    expect(source).not.toContain("targetedDynamicRequestSections.set(targetKey, { block, mappedSection });");
    expect(source).not.toContain('normalizeTargetSectionKey(block?.settings?.targetSectionKey)');
  });

  it('normalizes legacy native multistep next labels to the shared request copy', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const nextLabelRaw = String(currentStep?.nextLabel || '').trim();");
    expect(source).toContain("nextLabelRaw === 'Next'");
    expect(source).toContain("'Go to next step'");
  });

  it('keeps shared request shell selectors low-specificity for static inline request shells', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail)');
    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail > .native-info-section-copy)');
    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail > .native-info-inline-form)');
  });

  it('prevents route section classes from owning shared request-form internals', () => {
    const source = readSource('../styles/service-native.css');
    const offenders = extractCssSelectors(source).filter((selector) => {
      const targetsRequestInternal = REQUEST_FORM_INTERNAL_SELECTOR_PARTS.some((part) => selector.includes(part));
      const usesRouteSectionClass = REQUEST_FORM_ROUTE_SECTION_CLASSES.some((className) => selector.includes(className));
      const isStaticLegacyException = selector.includes(':not(.native-dynamic-request)');

      return targetsRequestInternal && usesRouteSectionClass && !isStaticLegacyException;
    });

    expect(offenders).toEqual([]);
  });

  it('marks native CTA copy-plus-form sections with the shared inline CTA shell class', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("has-inline-cta-shell");
  });

  it('does not reintroduce route-specific request owner rules for Group Life once the shared dynamic-request contract is in charge', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).not.toContain('.native-info-page.native-info-page--group-life-quote .service-native-section.group-life-native-quote.has-inline-request-shell > .ag-panel-rail');
    expect(source).not.toContain('.native-info-page.native-info-page--group-life-quote .service-native-section.group-life-native-quote.native-dynamic-request .dynamic-request-layout');
    expect(source).not.toContain('.native-info-page.native-info-page--group-life-quote .service-native-section.group-life-native-quote.native-dynamic-request .dynamic-request-form');
    expect(source).not.toContain('.native-info-page--group-life-quote .group-life-native-quote > .ag-panel-rail {');
  });

  it('does not keep the retired life-quote request shell once the explicit request_form block owns that route', () => {
    const nativeSource = readSource('../data/nativePageContent.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(nativeSource).not.toContain("className: 'insurance-native-life-quote'");
    expect(cssSource).not.toContain('.native-info-page--life-quote .insurance-native-life-quote > .ag-panel-rail {');
    expect(cssSource).not.toContain('.native-info-page--life-quote .insurance-native-life-quote .native-info-inline-form {');
  });

  it('scopes stabilized request shell hooks to the shared request-form shell', () => {
    const componentSource = readSource('./DynamicRequestFormSection.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(componentSource).toContain('dynamic-request-shell');
    expect(componentSource).toContain('dynamic-request-panel');
    expect(componentSource).toContain('dynamic-request-step-meta');
    expect(componentSource).toContain('dynamic-request-progress');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-shell');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-panel');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-step-meta');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-progress');
  });

  it('keeps the shared dynamic request shell on a simple wide rail plus a vanilla two-column grid contract', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-request > .ag-panel-rail,');
    expect(cssSource).toContain('width: min(var(--ag-panel-content-max), calc(100% - (var(--ag-panel-gutter) * 2)));');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-layout {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(cssSource).toContain('grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);');
    expect(cssSource).not.toContain('grid-template-columns: minmax(430px, 0.9fr) minmax(0, 1.55fr);');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-form {');
    expect(cssSource).toContain('max-width: none;');
  });

  it('keeps sandstone heading support in the shared request runtime CSS', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-copy h2.is-sandstone,');
    expect(cssSource).toContain('.native-dynamic-request .dynamic-request-copy h2 mark.is-sandstone {');
  });

  it('keeps the Group Life request heading on dark core copy with white highlighted words in the dynamic request path', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-copy > h2,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-copy > h2.is-white,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-copy > h2.is-super-grey {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-copy > h2 mark.is-white {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-panel {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-group-life-quote .dynamic-request-step-meta {');
    expect(cssSource).toContain('border-bottom: 0;');
    expect(cssSource).not.toContain('.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request');
  });

  it('keeps request text-tone swatches wired to shared runtime copy color classes', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-dynamic-request.is-text-dark .dynamic-request-copy h2 {');
    expect(cssSource).toContain('.native-dynamic-request.is-text-dark .dynamic-request-copy :is(p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
    expect(cssSource).toContain('.native-dynamic-request.is-text-white .dynamic-request-copy h2 {');
    expect(cssSource).toContain('.native-dynamic-request.is-text-white .dynamic-request-copy :is(p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
    expect(cssSource).toContain('.native-dynamic-request.is-text-blue .dynamic-request-copy h2 {');
    expect(cssSource).toContain('.native-dynamic-request.is-text-blue .dynamic-request-copy :is(p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
  });

  it('forces the endowments dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-endowment > .ag-panel-rail,');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-endowment .dynamic-request-layout {');
    expect(cssSource).toContain('grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-endowment .dynamic-request-copy {');
    expect(cssSource).toContain('justify-self: stretch;');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-endowment .dynamic-request-copy > h2 {');
    expect(cssSource).toContain('text-wrap: wrap;');
    expect(cssSource).not.toContain('.legacy-child-native-endowments-legacy-form > .ag-panel-rail {');
  });

  it('forces the generosity-fund dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-generosity-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-generosity > .ag-panel-rail,');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-generosity .dynamic-request-layout {');
    expect(cssSource).toContain('grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-generosity .dynamic-request-copy {');
    expect(cssSource).toContain('justify-self: stretch;');
    expect(cssSource).not.toContain('.legacy-child-native-generosity-request > .ag-panel-rail {');
  });

  it('forces the charitable-gift-annuities dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-cga-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-cga > .ag-panel-rail,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-cga .dynamic-request-layout {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-cga .dynamic-request-copy {');
    expect(cssSource).toContain('.legacy-child-native-cga-request:not(.native-dynamic-request) .native-info-inline-form h5,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-cga .dynamic-request-copy > h2 {');
  });

  it('forces the ministry-impact-fund dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-impact > .ag-panel-rail,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-impact .dynamic-request-layout {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-impact .dynamic-request-copy {');
    expect(cssSource).toContain('.legacy-child-native-request:not(.native-dynamic-request) .native-info-inline-form h5 {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-legacy-impact .dynamic-request-copy > h2 {');
  });

  it('forces contact-us back onto the shared dynamic request rail instead of a rogue outer two-column grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.contact-us-request > .ag-panel-rail {');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-contact .dynamic-request-layout {');
    expect(cssSource).toContain('max-width: 980px;');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-contact .dynamic-request-copy {');
    expect(cssSource).toContain('align-self: stretch;');
    expect(cssSource).not.toContain('.native-info-page--contact-us .native-dynamic-request.contact-us-request');
    expect(cssSource).not.toContain('.contact-us-request .native-info-section-copy {\n  grid-column: 2;');
    expect(cssSource).not.toContain('.native-dynamic-request.contact-us-request .dynamic-request-layout {\n  width: min(100%, 980px);');
  });

  it('keeps a late shared mobile stack override so request blocks always place copy above form on small screens', () => {
    const cssSource = readSource('../styles/service-native.css');
    const mobileSafetySlice = cssSource.slice(
      cssSource.indexOf('/* Request blocks must stack copy above form on mobile, even when desktop route styles reorder the shell. */'),
      cssSource.length,
    );

    expect(mobileSafetySlice).toContain('@media (max-width: 1024px) {');
    expect(mobileSafetySlice).toContain('.native-info-page .service-native-section.native-dynamic-request .dynamic-request-layout {');
    expect(mobileSafetySlice).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(mobileSafetySlice).toContain('gap: clamp(1.6rem, 5vw, 2.35rem);');
    expect(mobileSafetySlice).toContain('.native-info-page .service-native-section.native-dynamic-request .dynamic-request-copy {');
    expect(mobileSafetySlice).toContain('order: -1;');
    expect(mobileSafetySlice).toContain('.native-info-page .service-native-section.native-dynamic-request .dynamic-request-form {');
    expect(mobileSafetySlice).toContain('order: 0;');
  });
});
