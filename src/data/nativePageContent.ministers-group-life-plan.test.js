import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

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
    expect(enrollSection?.cards?.[0]?.actions?.map((item) => item.label)).toEqual([
      'Minister enrollment form',
      'Missionary enrollment form',
    ]);
    expect(enrollSection?.cards?.[1]?.actions?.[0]?.label).toBe('Medical history form');
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
});
