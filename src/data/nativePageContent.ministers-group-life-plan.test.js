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

  it('keeps the enrollment steps on a white, full-content-width single-column stack with tighter copy and spaced subtitle rhythm', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll {');
    expect(cssSource).toContain('background: #fff;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .native-info-section-subtitle {');
    expect(cssSource).toContain('margin-bottom: clamp(2.4rem, 4.4vw, 3.5rem);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-grid {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card p {');
    expect(cssSource).toContain('line-height: 1.42;');
    expect(cssSource).toContain('border: 2px solid var(--ministers-group-life-step-accent);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-card:hover {');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-btn.ministers-group-life-step-btn.is-step-mango,');
    expect(cssSource).toContain('--btn-text: var(--ag-color-mango);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .ministers-group-life-copy-address .native-info-copy-address-title {');
    expect(cssSource).toContain('margin-bottom: clamp(0.55rem, 1vw, 0.8rem);');
    expect(cssSource).toContain('.native-info-page--ministers-group-life-plan .ministers-group-life-native-enroll .service-native-note {');
    expect(cssSource).toContain('margin-top: 0.6rem;');
  });
});
