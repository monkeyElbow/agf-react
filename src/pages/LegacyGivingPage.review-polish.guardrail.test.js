import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('planned giving review polish guardrail', () => {
  it('keeps the route-specific wills spacing and mobile opportunity collapse scoped to planned giving', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-wills {');
    expect(cssSource).toContain('padding-top: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('padding-bottom: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('padding-top: clamp(2.8rem, 7.8vw, 3.5rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card.fade-up[data-fade-state="pending"] {');
    expect(cssSource).toContain('opacity: 0.24;');
    expect(cssSource).toContain('translate: 0 16px;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .native-info-section-copy {');
    expect(cssSource).toContain('margin-bottom: clamp(3.4rem, 6.6vw, 5.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card > div:first-child {');
    expect(cssSource).toContain('flex: 1 1 auto;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .service-native-action-row {');
    expect(cssSource).toContain('margin-top: auto;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-opportunity .service-native-dark-feature-copy {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('min-width: 0;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-joy {');
    expect(cssSource).toContain('padding-top: clamp(3.1rem, 6.2vw, 5.2rem);');
    expect(cssSource).toContain('padding-bottom: clamp(3.1rem, 6.2vw, 5.2rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-joy > .ag-panel-rail > h2,');
    expect(cssSource).toContain('letter-spacing: -0.048em;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta {');
    expect(cssSource).toContain('padding-top: clamp(2.2rem, 5vw, 3.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .native-info-inline-form {');
    expect(cssSource).toContain('width: min(680px, 100%);');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(cssSource).toContain('padding: clamp(2.2rem, 4vw, 3rem) clamp(1.3rem, 2.4vw, 1.85rem) clamp(1.65rem, 2.9vw, 2.3rem);');
    expect(cssSource).toContain('.legacy-giving-cta .dynamic-cta-form-heading {');
    expect(cssSource).toContain('max-width: 30rem;');
    expect(cssSource).toContain('margin: 0 auto clamp(1.95rem, 4vw, 2.6rem);');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.legacy-giving-cta .dynamic-cta-form-subtitle {');
    expect(cssSource).toContain('max-width: 24rem;');
    expect(cssSource).toContain('margin: 0.7rem auto 0;');
  });

  it('keeps the endowments hero breathing room scoped to that compact legacy child route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .service-native-hero {');
    expect(cssSource).toContain('padding-top: clamp(3.7rem, 7vw, 5.8rem);');
    expect(cssSource).toContain('padding-bottom: clamp(3.7rem, 7vw, 5.8rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .service-native-hero h1 + h1 {');
    expect(cssSource).toContain('margin-top: 0.2rem;');
  });

  it('keeps the endowments explainer as a three-step flow with assets on its own content rail', () => {
    const cssSource = readSource('../styles/service-native.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const howItWorksBlock = contentBlockBlueprintsByPath['/services/planned-giving/endowments']
      ?.find((block) => block?.id === 'how_it_works');

    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-endowments-duo'");
    expect(blueprintSource).toContain("button1Label: 'Set up an endowment'");
    expect(blueprintSource).toContain("button1LinkJson: JSON.stringify({ kind: 'anchor', href: '#endowment-request-form', openInNewWindow: false })");
    expect(blueprintSource).toContain("anchorId: 'endowment-request-form'");
    expect(blueprintSource).toContain('The annual earnings from your carefully-invested gift support your chosen ministry or cause.');
    expect(blueprintSource).toContain('createPlannedGivingHowItWorksColumnsBlueprint({');
    expect(blueprintSource).toContain("title: 'How it works'");
    expect(blueprintSource).toContain("columns: 'three'");
    expect(howItWorksBlock).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-endowments-duo',
        columns: 'three',
        col1Type: 'flow-step',
        col1Body: 'Designated assets are invested to ensure their protection and growth.',
        col2Body: 'Payments are made from ongoing interest earned from the gifted asset(s).',
        col3Body: 'An endowment requires that the principal remain intact indefinitely—or until sufficient assets have accumulated to ensure the endowment’s perpetuity.',
        col4Enabled: false,
      },
    });
    expect(blueprintSource).not.toContain("title: 'You give assets'");
    expect(blueprintSource).not.toContain("title: 'Principal stays invested'");
    expect(blueprintSource).not.toContain("title: 'Earnings support ministry'");
    expect(blueprintSource).toContain("id: 'assets_you_may_give'");
    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-endowments-assets'");
    expect(blueprintSource).toContain("contentMaxWidthPx: 1040");
    expect(blueprintSource).toContain("Minimum funding requirements are <strong>$10,000</strong> for cash or securities, and <strong>$100,000</strong> for real estate.");
    expect(blueprintSource).toContain("class=\"endowments-assets-copy\"");
    expect(blueprintSource).toContain("class=\"endowments-asset-badges\"");
    expect(blueprintSource).not.toContain("Endowments may be funded with:");
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo {');
    expect(cssSource).toContain('background: #faf7f1;');
    expect(cssSource).toContain('padding: clamp(3.9rem, 7.4vw, 6.2rem) 0 clamp(2.15rem, 4.6vw, 3.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-info-section-copy > h2 {');
    expect(cssSource).toContain('font-size: clamp(2.25rem, 4.25vw, 3.65rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-grid {');
    expect(cssSource).toContain('counter-reset: endowments-flow;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-flow-step::before {');
    expect(cssSource).toContain('font-size: clamp(3rem, 5.2vw, 4.55rem);');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('margin-bottom: clamp(0.4rem, 0.9vw, 0.65rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-flow-step .native-columns-copy {');
    expect(cssSource).toContain('padding-top: clamp(0.4rem, 0.9vw, 0.65rem);');
    expect(cssSource).toContain('border-top: 0;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets {');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets .native-info-rich-html {');
    expect(cssSource).toContain('grid-template-columns: minmax(19rem, 0.78fr) minmax(0, 1.22fr);');
    expect(cssSource).toContain('width: min(var(--dyn-content-max-width, 1040px), 100%);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets .endowments-assets-copy {');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets .endowments-asset-badges {');
    expect(cssSource).toContain('grid-template-columns: repeat(3, minmax(7.2rem, max-content));');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets .endowments-asset-badges li:nth-child(4) {');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets {');
    expect(cssSource).toContain('padding-top: clamp(1.4rem, 3vw, 2.35rem);');
    expect(cssSource).toContain('background: #faf7f1;');
    expect(cssSource).toContain('font-size: clamp(2.25rem, 4vw, 3.45rem);');
    expect(cssSource).toContain('font-size: clamp(1rem, 1.35vw, 1.2rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-big-cta .native-info-section-copy > h2 {');
    expect(cssSource).toContain('font-size: clamp(3.15rem, 7.8vw, 6.1rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-big-cta .native-info-section-subtitle {');
    expect(cssSource).toContain('letter-spacing: -0.018em;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-big-cta .billboard-scroll-reveal-scale-up {');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-big-cta .billboard-scroll-reveal-scale-up[data-fade-state="pending"] {');
    expect(cssSource).toContain('transform: scale(0.92);');
    expect(cssSource).not.toContain('.legacy-child-native-endowments-big-cta > .ag-panel-rail > h2');
    expect(cssSource).not.toContain('.legacy-child-native-endowments-duo > .native-info-full-bleed > h2');
    expect(cssSource).toContain('@media (max-width: 960px) {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-flow-step {');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-flow-step .native-columns-copy {');
    expect(cssSource).toContain('justify-items: center;');
    expect(cssSource).toContain('margin-inline: auto;');
  });

  it('keeps the planned giving route wired to the comparison widget and the opportunity feature block', () => {
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const cssSource = readSource('../styles/service-native.css');

    expect(blueprintSource).toContain("id: 'joy_billboard'");
    expect(blueprintSource).toContain("titleFontFamily: 'helv'");
    expect(blueprintSource).toContain("sectionClassName: 'legacy-giving-comparison'");
    expect(blueprintSource).toContain("widget: 'giving-comparison-matrix'");
    expect(blueprintSource).not.toContain("widget: 'charitable-giving-table'");
    expect(blueprintSource).not.toContain("sectionClassName: 'legacy-giving-comparison-matrix'");
    expect(blueprintSource).toContain("sectionClassName: 'legacy-giving-opportunity'");
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types .native-info-section-copy {');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-types > .ag-panel-rail-wide,');
    expect(cssSource).toContain('width: min(var(--ag-panel-wide-max), calc(100% - (var(--ag-panel-effective-gutter, var(--ag-panel-gutter)) * 2)));');
    expect(cssSource).toContain('margin-bottom: clamp(3.4rem, 6.6vw, 5.4rem);');
    expect(cssSource).toContain('--legacy-stewardship-final-cta-gap: clamp(0.35rem, 0.75vw, 0.6rem);');
    expect(cssSource).toContain('margin-top: clamp(0.55rem, 1.25vw, 0.95rem);');
    expect(cssSource).toContain('font-family: "helvetica-neue-lt-pro", "Helvetica Neue", Helvetica, Arial, sans-serif;');
  });

  it('keeps the endowments calculator heading and intro copy on the tighter centered rhythm', () => {
    const cssSource = readSource('../styles/service-native.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    const componentSource = readSource('../components/NativeContentPage.jsx');

    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-endowments-calculator'");
    expect(blueprintSource).toContain("title: 'See how your endowment can keep giving.'");
    expect(blueprintSource).toContain("widget: 'endowment-calculator'");
    expect(componentSource).toContain('Enter assets you may gift. We’ll show your <em>annual ministry impact</em> from investment earnings (your principal remains invested).');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-calculator > .ag-panel-rail > h2 {');
    expect(cssSource).toContain('margin-bottom: 0.1rem;');
    expect(cssSource).toContain('letter-spacing: -0.03em;');
    expect(cssSource).toContain('.endowment-calculator {');
    expect(cssSource).toContain('margin-top: 0;');
    expect(cssSource).toContain('gap: 1.35rem;');
    expect(cssSource).toContain('.endowment-calculator-sub {');
    expect(cssSource).toContain('max-width: min(100%, 72rem);');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(cssSource).toContain('padding-inline: 0;');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.endowment-calculator-fineprint {');
    expect(cssSource).toContain('justify-self: stretch;');
    expect(cssSource).toContain('max-width: none;');
  });

  it('keeps the charitable trusts process trigger on the non-filling outline hover pattern', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(cssSource).toContain('.legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-hover-bg: transparent;');
    expect(cssSource).toContain('--btn-hover-text: var(--btn-hover-color);');
    expect(cssSource).toContain('.legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:hover,');
    expect(cssSource).toContain('.legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:focus-visible,');
    expect(cssSource).toContain('.legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:active {');
    expect(cssSource).toContain('background: transparent;');
    expect(contentSource).toContain("pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts'");
    expect(blueprintSource).toContain("id: 'cta_trigger'");
    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-trusts-crt-trigger'");
    expect(blueprintSource).toContain("buttonLabel: 'Start the process'");
    expect(blueprintSource).toContain("buttonAction: 'open_cta_form'");
    expect(blueprintSource).toContain("buttonTargetAnchorId: 'charitable-trusts-inline-form'");
    expect(blueprintSource).toContain("buttonStyle: 'outline'");
    expect(blueprintSource).toContain("buttonTone: 'white'");
  });
});
