import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('request form renderer guardrail', () => {
  it('keeps the shared request-form renderer in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("import DynamicRequestFormSection from './DynamicRequestFormSection';");
    expect(source).toContain('buildDynamicRequestFormFromBlock');
    expect(source).toContain("const runtime = buildDynamicRequestFormFromBlock(block, { pathname });");
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

  it('marks native copy-plus-form sections with the shared inline request shell class', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("has-inline-request-shell");
    expect(source).toContain("has-managed-request-shell");
    expect(source).toContain('return <DynamicRequestFormSection config={config} />;');
    expect(source).toContain('const targetedDynamicRequestSections = new Map();');
    expect(source).toContain("const targetKey = String(mappedSection?.targetSectionKey || '').trim();");
    expect(source).toContain("targetedDynamicRequestSections.set(targetKey, { block, mappedSection });");
    expect(source).not.toContain('normalizeTargetSectionKey(block?.settings?.targetSectionKey)');
  });

  it('normalizes legacy native multistep next labels to the shared request copy', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain("const nextLabelRaw = String(currentStep?.nextLabel || '').trim();");
    expect(source).toContain("nextLabelRaw === 'Next'");
    expect(source).toContain("'Go to next step'");
  });

  it('keeps shared request shell selectors low-specificity so page-specific request layouts can override them', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail)');
    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail > .native-info-section-copy)');
    expect(source).toContain(':where(.native-info-page .service-native-section.has-inline-request-shell > .ag-panel-rail > .native-info-inline-form)');
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

    expect(cssSource).toContain('.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request .dynamic-request-copy > h2,');
    expect(cssSource).toContain('.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request .dynamic-request-copy > h2.is-white,');
    expect(cssSource).toContain('.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request .dynamic-request-copy > h2.is-super-grey {');
    expect(cssSource).toContain('.native-info-page--group-life-quote .group-life-native-quote.native-dynamic-request .dynamic-request-copy > h2 mark.is-white {');
  });

  it('keeps request text-tone swatches wired to shared runtime copy color classes', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-dynamic-request.is-text-dark .dynamic-request-copy :is(h2, p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
    expect(cssSource).toContain('.native-dynamic-request.is-text-white .dynamic-request-copy :is(h2, p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
    expect(cssSource).toContain('.native-dynamic-request.is-text-blue .dynamic-request-copy :is(h2, p, .dynamic-request-subtitle, .dynamic-request-body, .native-info-rich-html),');
  });

  it('forces the endowments dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form.native-dynamic-request > .ag-panel-rail,');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form.native-dynamic-request .dynamic-request-layout {');
    expect(cssSource).toContain('grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);');
    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form.native-dynamic-request .dynamic-request-copy {');
    expect(cssSource).toContain('justify-self: stretch;');
    expect(cssSource).toContain('.legacy-child-native-endowments-legacy-form.native-dynamic-request .dynamic-request-copy > h2 {');
    expect(cssSource).toContain('text-wrap: wrap;');
    expect(cssSource).not.toContain('.legacy-child-native-endowments-legacy-form > .ag-panel-rail {');
  });

  it('forces the generosity-fund dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-generosity-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.legacy-child-native-generosity-request.native-dynamic-request > .ag-panel-rail,');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('.legacy-child-native-generosity-request.native-dynamic-request .dynamic-request-layout {');
    expect(cssSource).toContain('grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);');
    expect(cssSource).toContain('.legacy-child-native-generosity-request.native-dynamic-request .dynamic-request-copy {');
    expect(cssSource).toContain('justify-self: stretch;');
    expect(cssSource).not.toContain('.legacy-child-native-generosity-request > .ag-panel-rail {');
  });

  it('forces the charitable-gift-annuities dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-cga-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.legacy-child-native-cga-request.native-dynamic-request > .ag-panel-rail,');
    expect(cssSource).toContain('.legacy-child-native-cga-request.native-dynamic-request .dynamic-request-layout {');
    expect(cssSource).toContain('.legacy-child-native-cga-request.native-dynamic-request .dynamic-request-copy {');
    expect(cssSource).toContain('.legacy-child-native-cga-request:not(.native-dynamic-request) .native-info-inline-form h5,');
    expect(cssSource).toContain('.legacy-child-native-cga-request.native-dynamic-request .dynamic-request-copy > h2 {');
  });

  it('forces the ministry-impact-fund dynamic request section back onto the shared layout contract instead of the retired static outer grid', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-request:not(.native-dynamic-request) > .ag-panel-rail {');
    expect(cssSource).toContain('.legacy-child-native-request.native-dynamic-request > .ag-panel-rail,');
    expect(cssSource).toContain('.legacy-child-native-request.native-dynamic-request .dynamic-request-layout {');
    expect(cssSource).toContain('.legacy-child-native-request.native-dynamic-request .dynamic-request-copy {');
    expect(cssSource).toContain('.legacy-child-native-request:not(.native-dynamic-request) .native-info-inline-form h5 {');
    expect(cssSource).toContain('.legacy-child-native-request.native-dynamic-request .dynamic-request-copy > h2 {');
  });
});
