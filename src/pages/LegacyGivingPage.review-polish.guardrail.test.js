import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-heading {');
    expect(cssSource).toContain('max-width: 30rem;');
    expect(cssSource).toContain('margin: 0 auto clamp(1.95rem, 4vw, 2.6rem);');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-cta .dynamic-cta-form-subtitle {');
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

  it('keeps the endowments explainer on the native columns system with a three-step flow and supporting asset list', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("className: 'legacy-child-native-endowments-duo'");
    expect(contentSource).toContain("title: 'How it works'");
    expect(contentSource).toContain("columns: 'three'");
    expect(contentSource).toContain("type: 'flow-step'");
    expect(contentSource).not.toContain("title: 'You give assets'");
    expect(contentSource).not.toContain("title: 'Principal stays invested'");
    expect(contentSource).not.toContain("title: 'Earnings support ministry'");
    expect(contentSource).toContain("'Designated assets are invested to ensure their protection and growth.'");
    expect(contentSource).toContain("'Payments are made from ongoing interest earned from the gifted asset(s).'");
    expect(contentSource).toContain("'An endowment requires that the principal remain intact indefinitely—or until sufficient assets have accumulated to ensure the endowment’s perpetuity.'");
    expect(contentSource).toContain("type: 'support'");
    expect(contentSource).toContain("title: 'Assets you may give'");
    expect(contentSource).toContain("Minimum funding requirements are <strong>$10,000</strong> for cash or securities, and <strong>$100,000</strong> for real estate.");
    expect(contentSource).toContain("Endowments may be funded with:");
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo {');
    expect(cssSource).toContain('background: #faf7f1;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-grid {');
    expect(cssSource).toContain('counter-reset: endowments-flow;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-flow-step::before {');
    expect(cssSource).toContain('font-size: clamp(3rem, 5.2vw, 4.55rem);');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain(".native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-support {");
    expect(cssSource).toContain('grid-column: 1 / -1;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-support .native-info-rich-html > ul {');
    expect(cssSource).toContain('width: min(100%, 25rem);');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-endowments .legacy-child-native-endowments-duo .native-columns-item.is-support .native-info-rich-html > ul li + li {');
  });

  it('keeps the planned giving route wired to the comparison widget and the opportunity feature block', () => {
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("className: 'legacy-giving-comparison-matrix'");
    expect(contentSource).toContain("widget: 'giving-comparison-matrix'");
    expect(contentSource).toContain("className: 'legacy-giving-opportunity'");
  });

  it('keeps the charitable trusts process trigger on the non-filling outline hover pattern', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');

    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-trusts .legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline,');
    expect(cssSource).toContain('--btn-hover-bg: transparent;');
    expect(cssSource).toContain('--btn-hover-text: var(--btn-hover-color);');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-trusts .legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:hover,');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-trusts .legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:focus-visible,');
    expect(cssSource).toContain('.native-info-page--legacy-child.native-info-page--legacy-trusts .legacy-child-native-trusts-crt-trigger .service-native-btn.is-outline:active {');
    expect(cssSource).toContain('background: transparent;');
    expect(contentSource).toContain("pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts'");
    expect(contentSource).toContain("className: 'legacy-child-native-trusts-crt-trigger'");
    expect(contentSource).toContain("label: 'Start the process'");
    expect(contentSource).toContain("targetAnchorId: 'charitable-trusts-inline-form'");
    expect(contentSource).toContain("className: 'is-outline is-tone-atlantean'");
  });
});
