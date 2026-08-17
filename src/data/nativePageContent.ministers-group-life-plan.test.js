import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';
import { parseCtaFormFieldsJson } from '../blocks/foundation/forms';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('ministers group life native page content', () => {
  it('keeps native content shell-only and owns visible sections in blocks', () => {
    const content = getNativePageContent('/services/insurance/ministers-group-life-plan', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance/ministers-group-life-plan'] || [];
    const detailsBlock = blocks.find((block) => block?.id === 'plan_details');
    const enrollBlock = blocks.find((block) => block?.id === 'enroll_steps');
    const supportBlock = blocks.find((block) => block?.id === 'support');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(content?.hideIntro).toBe(true);
    expect(content?.hero).toBeUndefined();
    expect(content?.sections).toBeUndefined();
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(detailsBlock?.settings?.card1ButtonLabel).toBe('Plan details (527a PDF)');
    expect(detailsBlock?.settings?.card2ButtonLabel).toBe('Plan details (524a PDF)');
    expect(enrollBlock?.settings?.card1ButtonLabel).toBe('Minister enrollment form');
    expect(enrollBlock?.presetId).toBe('step-cards');
    expect(enrollBlock?.settings?.card1Button2Label).toBe('Missionary enrollment form');
    expect(enrollBlock?.settings?.card3ButtonClassName).toContain('is-step-sandstone');
    expect(String(supportBlock?.settings?.html || '')).toContain('800.447.0446');
    expect(supportBlock?.settings?.supportGroupsExpanded).toBe(true);
    expect(supportBlock?.settings?.supportGroupsCollapsible).toBe(false);
    expect(supportBlock?.settings?.supportGroupsJson).toContain('Ministers enrolled before March 1, 2005 (PDF)');
    expect(supportBlock?.settings?.supportGroupsJson).toContain('Life Services Toolkit');
    expect(ctaBlock?.settings?.anchorId).toBe('form');
    expect(ctaBlock?.settings?.title).toBe('Still need help?');
    expect(parseCtaFormFieldsJson(ctaBlock?.settings?.fieldsJson)[3]?.placeholder).toBe('How can we help?');
  });

  it('keeps the enrollment steps on the shared MIF-style sand and white step-card contract', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll {');
    expect(cssSource).toContain('--step-card-body-font-size: clamp(1.16rem, 1.75vw, 1.32rem);');
    expect(cssSource).toContain('--step-card-body-line-height: 1.68;');
    expect(cssSource).toContain('padding: clamp(3.9rem, 7.4vw, 6.2rem) 0 clamp(2.15rem, 4.6vw, 3.4rem);');
    expect(cssSource).toContain('background: #faf7f1;');
    expect(cssSource).toContain('width: min(calc(100% - (var(--ag-panel-gutter) * 1.4)), 68rem) !important;');
    expect(cssSource).toContain('max-width: 68rem !important;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .native-info-section-subtitle {');
    expect(cssSource).toContain('margin-bottom: clamp(2rem, 4vw, 3rem);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('width: min(100%, 82ch) !important;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('margin: clamp(2rem, 4vw, 3rem) auto 0;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card h3 {');
    expect(cssSource).toContain('display: flex;');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('align-items: start;');
    expect(cssSource).toContain('row-gap: clamp(0.35rem, 0.8vw, 0.65rem);');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('padding-bottom: 0 !important;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('font-size: clamp(3rem, 5.2vw, 4.55rem) !important;');
    expect(cssSource).toContain('color: var(--ministers-group-life-step-accent) !important;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card p {');
    expect(cssSource).toContain('font-size: clamp(1.08rem, 1.75vw, 1.24rem);');
    expect(cssSource).toContain('line-height: 1.58;');
    expect(cssSource).toContain('background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 251, 252, 0.98) 100%);');
    expect(cssSource).toContain('box-shadow: 0 18px 36px rgba(12, 42, 61, 0.08);');
    expect(cssSource).toContain('padding: clamp(1.85rem, 3.2vw, 2.55rem) clamp(2.25rem, 4.1vw, 3.25rem);');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-step-cards .service-native-card:not(.investments-native-cert-card):not(.retirement-account-card--certificate) p {');
    expect(cssSource).toContain('font-size: var(--step-card-body-font-size, clamp(1.18rem, 1.95vw, 1.42rem));');
    expect(cssSource).toContain('line-height: var(--step-card-body-line-height, 1.42);');
    expect(cssSource).toContain('border: 2px solid var(--ministers-group-life-step-accent);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card:hover {');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-btn.ministers-group-life-step-btn.is-step-mango,');
    expect(cssSource).toContain('--btn-text: var(--ag-color-mango);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .ministers-group-life-copy-address .native-info-copy-address-title {');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('padding: clamp(1.35rem, 2.6vw, 2rem) clamp(1.5rem, 3vw, 2.4rem);');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll-return {');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('row-gap: clamp(0.25rem, 0.55vw, 0.45rem);');
    expect(cssSource).toContain('padding: clamp(2rem, 3.4vw, 2.75rem) clamp(2rem, 3.8vw, 3rem);');
    expect(cssSource).toContain('margin-top: 0;');
    expect(cssSource).toContain('margin-top: clamp(1rem, 2vw, 1.5rem);');
    expect(cssSource).toContain('margin-bottom: clamp(0.55rem, 1vw, 0.8rem);');
    expect(cssSource).toContain('row-gap: 0.55rem;');
    expect(cssSource).toContain('padding: clamp(1.6rem, 5vw, 2.1rem) clamp(1.35rem, 4vw, 2.1rem);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-note {');
    expect(cssSource).toContain('margin-top: 0.6rem;');
    expect(cssSource).toContain('.native-support-library-group {');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).not.toContain('background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 244, 240, 0.94) 100%);');
  });

  it('keeps plan detail cards centered on the dynamic grid block instead of the page wrapper', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card {');
    expect(cssSource).toContain('align-content: start;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card h3 {');
    expect(cssSource).toContain('--dynamic-grid-card-title-color: var(--ag-color-super-grey);');
    expect(cssSource).toContain('color: var(--ag-color-super-grey) !important;');
    expect(cssSource).toContain('min-height: 0 !important;');
    expect(cssSource).toContain('display: block;');
    expect(cssSource).toContain('padding-bottom: 0 !important;');
    expect(cssSource).toContain('--dynamic-grid-card-title-size: clamp(2.26rem, 3.55vw, 2.85rem);');
    expect(cssSource).toContain('font-size: clamp(2.26rem, 3.55vw, 2.85rem) !important;');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card .service-native-action-row:last-child {');
    expect(cssSource).toContain('margin-bottom: clamp(0.85rem, 1.6vw, 1.25rem);');
    expect(cssSource).not.toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-details .service-native-card {');
  });
});
