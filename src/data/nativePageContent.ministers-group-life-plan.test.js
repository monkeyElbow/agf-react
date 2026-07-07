import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('ministers group life native page content', () => {
  it('restores the about-the-plan section, keeps support resources, and retains the support CTA form', () => {
    const content = getNativePageContent('/services/insurance/ministers-group-life-plan', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const detailsSection = sections.find((section) => section?.className === 'ministers-group-life-native-details');
    const enrollSection = sections.find((section) => section?.className === 'ministers-group-life-native-enroll');
    const supportSection = sections.find((section) => section?.className === 'ministers-group-life-native-support');
    const ctaSection = sections.find((section) => section?.className === 'ministers-group-life-native-cta insurance-native-cta');

    expect(content?.hideIntro).toBe(true);
    expect(content?.hero?.bgTone).toBe('white');
    expect(sections[0]?.className).toBe('ministers-group-life-native-details');
    expect(detailsSection?.title).toBe('About the plan');
    expect(detailsSection?.subtitle).toBe('Learn about eligibility requirements, coverage amounts, rates, and more.');
    expect(Array.isArray(detailsSection?.cards) ? detailsSection.cards : []).toHaveLength(2);
    expect(detailsSection?.cards?.map((card) => card.title)).toEqual(['Ministers', 'Missionaries']);
    expect(detailsSection?.cards?.[0]?.stretchedLink?.label).toBe('Plan details (527a PDF)');
    expect(detailsSection?.cards?.[1]?.stretchedLink?.label).toBe('Plan details (524a PDF)');
    expect(enrollSection?.subtitle).toBe('Three steps. One clear path.');
    expect(Array.isArray(enrollSection?.cards) ? enrollSection.cards : []).toHaveLength(3);
    expect(enrollSection?.cards?.map((card) => card.title)).toEqual(['01', '02', '03']);
    expect(enrollSection?.cards?.[0]?.body).toContain('Start with the enrollment form.');
    expect(enrollSection?.cards?.[0]?.actions?.map((item) => item.label)).toEqual([
      'Minister enrollment form',
      'Missionary enrollment form',
    ]);
    expect(enrollSection?.cards?.[0]?.actions?.[0]?.className).toContain('is-outline');
    expect(enrollSection?.cards?.[1]?.body).toContain('Add medical history if required.');
    expect(enrollSection?.cards?.[1]?.actions?.[0]?.label).toBe('Medical history form');
    expect(enrollSection?.cards?.[2]?.body).toContain('Complete Electronic Funds Transfer.');
    expect(enrollSection?.cards?.[2]?.actions?.[0]?.className).toContain('is-step-sandstone');
    expect(enrollSection?.addressBlock?.title).toBe('Mail or fax completed forms to:');
    expect(enrollSection?.actions).toBeUndefined();
    expect(enrollSection?.fineprint).toContain('417.447.7475');
    expect(String(supportSection?.html || '')).toContain('800.447.0446');
    expect(String(supportSection?.html || '')).toContain('#form');
    expect(supportSection?.supportGroupsExpanded).toBe(true);
    expect(supportSection?.supportGroupsCollapsible).toBe(false);
    expect(Array.isArray(supportSection?.supportGroups) ? supportSection.supportGroups.length : 0).toBeGreaterThan(0);
    expect((supportSection?.supportGroups || []).map((group) => group.title)).toEqual([
      'Plan details',
      'Changes and billing',
      'Standard Life certificates',
      'Travel Assistance (Assist America, Inc)',
      'Life Services Toolkit',
    ]);
    expect(Array.isArray(supportSection?.supportGroups?.[0]?.links)).toBe(true);
    expect(supportSection?.supportGroups?.[0]?.links?.map((item) => item.label)).toContain('Ministers enrolled before March 1, 2005 (PDF)');
    expect((supportSection?.supportGroups || []).some((group) => String(group?.title || '').includes('Direct help'))).toBe(false);
    expect(supportSection?.cards).toBeUndefined();
    expect(ctaSection?.anchorId).toBe('form');
    expect(ctaSection?.hideCopy).toBe(true);
    expect(ctaSection?.form?.title).toBe('Still need help?');
    expect(ctaSection?.form?.subtitle).toBe('');
    expect(ctaSection?.form?.fields?.map((field) => field.id)).toEqual(['name', 'email', 'phone', 'message']);
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
