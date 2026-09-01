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
    const numberedCardSource = readSource('../styles/service-native-numbered-cards.css');

    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll {');
    expect(cssSource).toContain('--step-card-body-font-size: clamp(1.16rem, 1.75vw, 1.32rem);');
    expect(cssSource).toContain('--step-card-body-line-height: 1.68;');
    expect(cssSource).toContain('padding: clamp(3.9rem, 7.4vw, 6.2rem) 0 clamp(2.15rem, 4.6vw, 3.4rem);');
    expect(cssSource).toContain('background: #ffffff !important;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .native-info-section-subtitle {');
    expect(cssSource).toContain('margin-bottom: clamp(2rem, 4vw, 3rem);');
    expect(numberedCardSource).toContain('.is-numbered-step-cards > :is(.ag-panel-rail, .ag-panel-rail-wide, .native-info-full-bleed) {');
    expect(numberedCardSource).toContain('.is-numbered-step-cards .service-native-grid {');
    expect(numberedCardSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(numberedCardSource).toContain('width: min(100%, 82ch);');
    expect(numberedCardSource).toContain('border-radius: var(--numbered-step-card-radius) !important;');
    expect(numberedCardSource).toContain('font-size: var(--numbered-step-card-number-size) !important;');
    expect(numberedCardSource).toContain('.is-numbered-step-cards .service-native-card:nth-child(3n + 1) {');
    expect(numberedCardSource).toContain('.is-numbered-step-cards .service-native-card:nth-child(3n + 2) {');
    expect(numberedCardSource).toContain('.is-numbered-step-cards .service-native-card:nth-child(3n) {');
    expect(cssSource).not.toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll > .native-info-full-bleed {');
    expect(cssSource).not.toContain('font-size: clamp(2.55rem, 4.35vw, 3.2rem) !important;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-btn.ministers-group-life-step-btn.is-step-mango,');
    expect(cssSource).toContain('--btn-text: var(--ag-color-mango);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .ministers-group-life-copy-address .native-info-copy-address-title {');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('padding: clamp(1.35rem, 2.6vw, 2rem) clamp(1.5rem, 3vw, 2.4rem);');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll-return {');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('padding-bottom: clamp(4.3rem, 9.2vw, 6.8rem);');
    expect(cssSource).toContain('.native-support-library {');
    expect(cssSource).toContain('margin-top: clamp(1.25rem, 2.5vw, 1.85rem);');
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
    expect(cssSource).toContain('font-size: var(--dynamic-grid-card-title-size, clamp(1.4rem, 2.2vw, 1.85rem));');
    expect(cssSource).toContain('text-align: center;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card h3::after {');
    expect(cssSource).toContain('display: none !important;');
    expect(cssSource).toContain('.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).ministers-group-life-native-details .service-native-card .service-native-action-row:last-child {');
    expect(cssSource).toContain('margin-bottom: clamp(0.85rem, 1.6vw, 1.25rem);');
    expect(cssSource).not.toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-details .service-native-card {');
  });
});
