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
    expect(cssSource).toContain('.native-info-page--legacy-giving .service-native-section.native-dynamic-grid.legacy-giving-types .service-native-card:not(.investments-native-cert-card) h3 {');
    expect(cssSource).toContain('font-size: var(--dynamic-grid-card-title-size, clamp(1.55rem, 2.35vw, 1.9rem));');
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
    expect(cssSource).toContain('display: flex;\n  justify-content: center;');
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
    expect(cssSource).not.toContain('grid-template-columns: minmax(360px, 0.92fr) minmax(0, 1.08fr);');
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
    expect(blueprintSource).toContain("button1LinkJson: JSON.stringify({ kind: 'anchor', href: '#endowment-request-form', openInNewWindow: false })");
    expect(blueprintSource).toContain("anchorId: 'endowment-request-form'");
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
        col4Enabled: false,
      },
    });
    expect(blueprintSource).toContain("id: 'assets_you_may_give'");
    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-assets legacy-child-native-give-assets legacy-child-native-endowments-assets'");
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
    expect(cssSource).toContain('grid-column: 1;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-assets .endowments-asset-badges {');
    expect(cssSource).toContain('grid-template-columns: repeat(3, minmax(7.2rem, max-content));');
    expect(cssSource).toContain('grid-row: 1 / span 2;');
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
    expect(cssSource).toContain('--service-native-hero-rail-min-height: clamp(250px, 24vw, 320px);');
    expect(cssSource).toContain('padding-block: clamp(3.8rem, 7.2vw, 5.2rem);');
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
    expect(blueprintSource).toContain("widget: 'endowment-calculator'");
    expect(componentSource).toContain('annual ministry impact');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-calculator {');
    expect(cssSource).toContain('padding-top: clamp(3.4rem, 6.8vw, 5.2rem);');
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

  it('keeps the removed charitable trusts process trigger out of source-owned blocks', () => {
    const contentSource = readSource('../data/nativePageContent.js');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(contentSource).toContain("pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts'");
    expect(blueprintSource).not.toContain("id: 'cta_trigger'");
    expect(blueprintSource).not.toContain("sectionClassName: 'legacy-child-native-trusts-crt-trigger'");
    expect(blueprintSource).not.toContain("buttonTargetAnchorId: 'charitable-trusts-inline-form'");
  });

  it('keeps charitable trusts CRT and CLT choice cards aligned to the investments certificate card treatment', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts .service-native-card {');
    expect(cssSource).toContain('--dynamic-grid-card-body-size: 1.08rem;');
    expect(cssSource).toContain('--dynamic-grid-card-body-line-height: 1.65;');
    expect(cssSource).toContain('border-radius: 16px;');
    expect(cssSource).toContain('padding: 0;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trust-choices--trusts .charitable-trusts-native-choice-card p,');
    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts.native-dynamic-grid .charitable-trusts-native-choice-card > .investments-native-cert-card__cap {');
    expect(cssSource).toContain('padding-bottom: clamp(0.31rem, 0.66vw, 0.39rem);');
    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts.native-dynamic-grid .charitable-trusts-native-choice-card > .investments-native-cert-card__body {');
    expect(cssSource).toContain('padding-top: clamp(0.675rem, 1.4vw, 0.875rem);');
    expect(cssSource).toContain('--investments-cert-body-padding-bottom: clamp(1.8rem, 3.3vw, 2.2rem);');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trust-choices--trusts .charitable-trusts-native-choice-card h3,');
    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts.native-dynamic-grid .service-native-card h3 {');
    expect(cssSource).toContain('font-size: clamp(1.9rem, 3.35vw, 2.45rem);');
    expect(cssSource).toContain('line-height: 1.02;');
    expect(cssSource).toContain('margin: 0 0 0.2rem;');
    expect(cssSource).toContain('@media (max-width: 1024px) {');
    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts.native-dynamic-grid .charitable-trusts-native-choice-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('clamp(2.4rem, 5.2vw, 3.1rem)');
    expect(cssSource).toContain('.legacy-child-native-trust-choices--trusts.native-dynamic-grid .service-native-card h3::after {');
    expect(cssSource).toContain('display: none;');
  });

  it('keeps charitable trusts difference columns aligned to the Ministry Impact how-it-works spacing and type scale', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.is-card-none .service-native-card.card-none,');
    expect(cssSource).toContain('padding: var(--dynamic-grid-card-padding, var(--native-card-shell-padding));');
    expect(cssSource).toContain('padding-bottom: calc(var(--dynamic-grid-card-padding, var(--native-card-shell-padding)) * 1.35);');
    expect(cssSource).toContain('.legacy-child-native-trusts-differences > :is(.ag-panel-rail, .ag-panel-rail-wide) {');
    expect(cssSource).toContain('width: min(calc(100% - (var(--ag-panel-gutter) * 1.4)), 76rem);');
    expect(cssSource).toContain('.legacy-child-native-trusts-differences.native-dynamic-grid .service-native-grid {');
    expect(cssSource).toContain('margin-top: clamp(2rem, 4vw, 3rem);');
    expect(cssSource).toContain('width: min(100%, 21rem);');
    expect(cssSource).toContain('font-size: clamp(2.55rem, 4.8vw, 4.1rem);');
    expect(cssSource).toContain('.legacy-child-native-trusts-differences.native-dynamic-grid .service-native-card:nth-child(1) h3 {');
    expect(cssSource).toContain('color: var(--ag-color-atlantean);');
    expect(cssSource).toContain('font-size: clamp(1.28rem, 1.95vw, 1.48rem);');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trusts-differences .service-native-card .service-native-card-bullet-list li {');
    expect(cssSource).toContain('line-height: 1.68;');
  });

  it('justifies Charitable Lead and Remainder Trust body copy', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-trusts-crt.dynamic-billboard .native-info-rich-html p {');
    expect(cssSource).toContain('.legacy-child-native-trusts-clt.dynamic-billboard .native-info-section-copy.is-justify-center .native-info-rich-html p {');
    expect(cssSource).toContain('text-align: justify;');
    expect(cssSource).toContain('text-justify: distribute;');

    const blueprintSource = readSource('../data/contentBlockBlueprints.js');
    expect(blueprintSource).toContain('the ministry you’ve selected.</p>');
  });

  it('keeps charitable trusts type card bullets aligned to the Ministry Impact donor gift bullet scale', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-trusts-crt-types.native-dynamic-grid .service-native-card.card2 .service-native-card-bullet-list {');
    expect(cssSource).toContain('.legacy-child-native-trusts-crt-types.native-dynamic-grid .service-native-card.card2 .service-native-card-bullet-list li {');
    expect(cssSource).toContain('.legacy-child-native-trusts-clt-types.native-dynamic-grid .service-native-card.card2 .service-native-card-bullet-list {');
    expect(cssSource).toContain('.legacy-child-native-trusts-clt-types.native-dynamic-grid .service-native-card.card2 .service-native-card-bullet-list li {');
    expect(cssSource).toContain('font-size: clamp(1.1rem, 2vw, 1.35rem);');
    expect(cssSource).toContain('line-height: 1.32;');
    expect(cssSource).toContain('margin-top: 0.42rem;');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
  });

  it('keeps charitable trusts funding-card bullets aligned to the Ministry Impact donor gift bullet scale', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-trusts-funding .service-native-card-bullet-list li {');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trusts-funding .service-native-card-bullet-list li {');
    expect(cssSource).toContain('font-size: clamp(1.1rem, 2vw, 1.35rem);');
    expect(cssSource).toContain('line-height: 1.32;');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trusts-funding .service-native-card-bullet-list li + li {');
    expect(cssSource).toContain('margin-top: 0.42rem;');
    expect(cssSource).toContain('.legacy-child-native-trusts-funding .service-native-card .service-native-action-row:last-child {');
    expect(cssSource).toContain('justify-content: center;');
  });

  it('keeps donor advised fund asset-card bullets aligned to the Ministry Impact donor gift bullet scale', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-generosity-fund .service-native-section.native-dynamic-grid.legacy-child-native-generosity-assets {');
    expect(cssSource).toContain('padding-top: clamp(0.9rem, 2vw, 1.5rem);');
    expect(cssSource).toContain('padding-bottom: clamp(4.5rem, 8vw, 6.2rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-generosity-fund .service-native-section.native-dynamic-grid.legacy-child-native-generosity-assets {');
    expect(cssSource).toContain('padding-top: clamp(4.5rem, 8vw, 6.2rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-generosity-fund .legacy-child-native-generosity-assets .service-native-card-bullet-list li {');
    expect(cssSource).toContain('font-size: clamp(1.1rem, 2vw, 1.35rem);');
    expect(cssSource).toContain('line-height: 1.32;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-generosity-fund .legacy-child-native-generosity-assets .service-native-card-bullet-list li + li {');
    expect(cssSource).toContain('margin-top: 0.42rem;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-generosity-fund .legacy-child-native-generosity-assets .service-native-card-bullet-list strong {');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
  });

  it('keeps charitable trusts funding-card action spacing balanced', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-grid.legacy-child-native-trusts-funding {');
    expect(cssSource).toContain('padding-top: clamp(3.9rem, 7.4vw, 6.2rem);');
    expect(cssSource).toContain('padding-bottom: clamp(4.5rem, 8vw, 6.2rem);');
  });

  it('keeps trust type sections tighter above titles than below bullets', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-child-native-trusts-crt-types,\n.legacy-child-native-trusts-clt-types {');
    expect(cssSource).toContain('padding: clamp(1.6rem, 3.5vw, 2.7rem) 0 clamp(2.6rem, 5vw, 4.2rem);');
  });

  it('keeps CGA options and outro on the planned-giving billboard/card rhythm', () => {
    const cssSource = readSource('../styles/service-native.css');
    const blueprintSource = readSource('../data/contentBlockBlueprints.js');

    expect(blueprintSource).toContain("sectionClassName: 'legacy-child-native-options legacy-child-native-cga-options'");
    expect(blueprintSource).toContain("title: 'Plenty of options.'");
    expect(cssSource).toContain('.native-info-page--legacy-cga .legacy-child-native-cga-options .service-native-grid {');
    expect(cssSource).toContain('margin-top: clamp(2rem, 4vw, 3rem);');
    expect(cssSource).toContain('.native-info-page--legacy-cga .legacy-child-native-cga-options .investments-native-cert-card {');
    expect(cssSource).toContain('box-shadow: 0 10px 22px rgba(12, 42, 61, 0.1);');
    expect(cssSource).toContain('.native-info-page--legacy-cga .legacy-child-native-cga-outro {');
    expect(cssSource).toContain('padding: clamp(3rem, 6vw, 5rem) 0;');
    expect(cssSource).toContain('font-size: clamp(3.2rem, 7.4vw, 5.6rem);');
  });

  it('keeps Ministry Impact Fund step icons aligned on a shared rail', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-child .legacy-child-native-ministry-impact-steps .planned-giving-step-icon {');
    expect(cssSource).toContain('align-items: end;');
    expect(cssSource).toContain('justify-items: start;');
    expect(cssSource).toContain('.native-info-page--legacy-child .legacy-child-native-ministry-impact-steps .planned-giving-step-icon svg {');
    expect(cssSource).toContain('height: auto;');
    expect(cssSource).toContain('max-height: 100%;');
    expect(cssSource).toContain('.native-info-page--legacy-child .legacy-child-native-ministry-impact-steps .native-columns-item.is-flow-step:nth-child(n + 2)::before {');
    expect(cssSource).toContain('margin-top: clamp(1.35rem, 2vw, 1.9rem);');
  });

  it('keeps Ministry Impact Fund stock-transfer card content vertically centered', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-ministry-impact .legacy-child-native-stock .native-info-section-copy > h2 {');
    expect(cssSource).toContain('margin-bottom: clamp(0.9rem, 1.8vw, 1.35rem);');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-ministry-impact .legacy-child-native-stock .service-native-card {');
    expect(cssSource).toContain('border-radius: 1.75rem !important;');
    expect(cssSource).toContain('align-content: center;');
    expect(cssSource).toContain('padding-block-start: clamp(3rem, 4.8vw, 3.8rem);');
    expect(cssSource).toContain('padding-block-end: clamp(2.2rem, 3.9vw, 3.1rem);');
    expect(cssSource).toContain('padding-inline: clamp(1.35rem, 2.7vw, 2rem);');
  });

  it('keeps QCD asset-card spacing aligned to the DAF card treatment', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-qcd .service-native-section.native-dynamic-grid.is-card-grid-style-planned-giving-centered > .ag-panel-rail > .native-info-section-copy > h2 {');
    expect(cssSource).toContain('margin-bottom: clamp(0.9rem, 1.8vw, 1.35rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-qcd .service-native-section.native-dynamic-grid.is-card-grid-style-planned-giving-centered .service-native-grid {');
    expect(cssSource).toContain('margin-top: clamp(2.4rem, 4.8vw, 3.6rem);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-qcd .service-native-section.native-dynamic-grid.is-card-grid-style-planned-giving-centered .service-native-card {');
    expect(cssSource).toContain('padding: clamp(2rem, 4vw, 3rem);');
  });
});
