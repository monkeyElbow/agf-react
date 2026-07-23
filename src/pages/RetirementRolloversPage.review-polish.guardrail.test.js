import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('retirement rollovers review polish guardrail', () => {
  it('keeps the start the process panel on branded counters with softened address typography', () => {
    const cssSource = readSource('../styles/service-native.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(blueprintSource).toContain("sectionClassName: 'retirement-rollovers-native-process'");
    expect(blueprintSource).toContain("anchorId: 'start-the-process'");
    expect(blueprintSource).toContain('<h2>Start the process</h2>');
    expect(blueprintSource).toContain('<p>Download and complete the Rollover/Transfer form below.</p>');
    expect(blueprintSource).toContain('<p>Return the completed form, along with the most recent statement(s) from the other account(s) to the address below.</p>');
    expect(blueprintSource).toContain('<p>A confirmation letter will be sent to you when your rollover or transfer is complete.</p>');
    expect(blueprintSource).not.toContain('1) Download and complete the Rollover/Transfer form below.');
    expect(blueprintSource).not.toContain('2) Return the completed form, along with the most recent statement(s) from the other account(s) to the address below.');
    expect(blueprintSource).not.toContain('3) A confirmation letter will be sent to you when your rollover or transfer is complete.');
    expect(blueprintSource).toContain("addressTitle: 'AGFinancial'");
    expect(blueprintSource).toContain("addressLines: 'PO Box 2515\\nSpringfield MO 65801'");
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process {');
    expect(cssSource).toContain('counter-reset: rollover-process-step;');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail > .service-native-copy-wrap > .native-info-rich-html > p::before {');
    expect(cssSource).toContain('content: counter(rollover-process-step, decimal-leading-zero);');
    expect(cssSource).toContain('--rollover-step-accent: var(--ag-color-atlantean);');
    expect(cssSource).toContain('font-family: var(--ag-font-helv);');
    expect(cssSource).toContain('font-weight: 800;');
    expect(cssSource).toContain('font-size: clamp(2.55rem, 4.35vw, 3.2rem);');
    expect(cssSource).toContain('grid-template-columns: clamp(3.35rem, 5vw, 4.15rem) minmax(0, 1fr);');
    expect(cssSource).toContain('align-items: center;');
    expect(cssSource).toContain('border: 2px solid var(--rollover-step-accent);');
    expect(cssSource).toContain('border-radius: 1.75rem;');
    expect(cssSource).toContain('background: #fff;');
    expect(cssSource).toContain('line-height: 1.62;');
    expect(cssSource).toContain('max-width: 82ch;');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail > .service-native-copy-wrap > .native-info-rich-html > p:nth-of-type(1)::before {');
    expect(cssSource).toContain('color: var(--ag-color-atlantean);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail > .service-native-copy-wrap > .native-info-rich-html > p:nth-of-type(2)::before {');
    expect(cssSource).toContain('color: var(--ag-color-mango);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail > .service-native-copy-wrap > .native-info-rich-html > p:nth-of-type(3)::before {');
    expect(cssSource).toContain('color: var(--ag-color-sandstone);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail > .service-native-copy-wrap > .native-info-rich-html > p:nth-of-type(3) {');
    expect(cssSource).toContain('--rollover-step-accent: var(--ag-color-sandstone);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process .rollovers-copy-address .native-info-copy-address-title {');
    expect(cssSource).toContain('color: var(--ag-color-atlantean);');
    expect(cssSource).toContain('font-size: clamp(1.88rem, 3.2vw, 2.6rem);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process .rollovers-copy-address .native-info-copy-address-lines {');
    expect(cssSource).toContain('font-size: clamp(1.16rem, 1.88vw, 1.64rem);');
    expect(cssSource).toContain('margin-top: 1.8rem;');
  });

  it('keeps the follow-up section on the managed request-form path instead of the legacy inline cta shell', () => {
    const cssSource = readSource('../styles/service-native.css');
    const appCssSource = readSource('../styles.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(blueprintSource).toContain("'/services/retirement/rollovers': [");
    expect(blueprintSource).toContain("id: 'request_form'");
    expect(blueprintSource).toContain("kind: 'request_form'");
    expect(blueprintSource).toContain("hidden: false");
    expect(blueprintSource).toContain("title: 'Simple is better.'");
    expect(blueprintSource).toContain(`titleHighlightsJson: '[{"start":0,"end":6,"className":"is-white"}]'`);
    expect(blueprintSource).toContain("body: 'Our rollover specialists are happy to help focus your retirement.'");
    expect(blueprintSource).toContain("bgTone: 'grey'");
    expect(blueprintSource).toContain("textTone: 'white'");
    expect(blueprintSource).toContain("submitLabel: 'Submit'");
    expect(blueprintSource).toContain("sectionClassName: 'retirement-rollovers-native-request'");
    expect(blueprintSource).not.toContain("targetSectionKey: ''");
    expect(blueprintSource).not.toContain("targetSectionClassName: ''");
    expect(cssSource).toContain('.service-native-section.native-dynamic-request.is-request-form-preset-retirement-rollover {');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-retirement-rollover .dynamic-request-layout {');
    expect(cssSource).toContain('width: min(100%, 56rem);');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('grid-template-columns: minmax(320px, 460px) minmax(280px, 24rem);');
    expect(cssSource).toContain('width: min(100%, 24rem);');
    expect(cssSource).toContain('justify-self: center;');
    expect(cssSource).toContain('width: min(100%, 560px);');
    expect(cssSource).toContain('@media (max-width: 768px) {');
    expect(appCssSource).toContain('@media (max-width: 768px) {');
    expect(appCssSource).toContain('.site-layout:has(.native-info-page--retirement-rollovers) {');
    expect(appCssSource).toContain('--ag-panel-effective-gutter: calc(var(--ag-panel-gutter) * 0.275);');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-options > .ag-panel-rail,');
    expect(cssSource).toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-process > .ag-panel-rail,');
    expect(cssSource).toContain('.native-dynamic-request.is-request-form-preset-retirement-rollover > .ag-panel-rail {');
    expect(cssSource).not.toContain('.native-info-page--retirement-rollovers .retirement-rollovers-native-request.native-dynamic-request');
    expect(cssSource).toContain('width: calc(100% - (var(--ag-panel-effective-gutter, var(--ag-panel-gutter)) * 2));');
    expect(cssSource).not.toContain('.native-info-page--retirement-rollovers .service-native-section.retirement-rollovers-native-cta {');
  });
});
