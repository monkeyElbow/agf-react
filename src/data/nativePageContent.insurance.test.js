import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('insurance native page content', () => {
  it('uses card1 coverage cards and keeps the insurance CTA on the shared CTA form config', () => {
    const content = getNativePageContent('/services/insurance', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const coverageSection = sections.find((section) => section?.className === 'insurance-native-coverage');
    const ctaSection = sections.find((section) => section?.className === 'insurance-native-cta');
    const missionAssureFeatureSection = sections.find((section) => section?.className === 'insurance-native-mission-assure');

    expect(content?.pageClass).toBe('native-info-page--insurance');
    expect(Array.isArray(coverageSection?.cards) ? coverageSection.cards : []).toHaveLength(4);
    expect(coverageSection?.cards?.every((card) => card?.cardClass === 'card1')).toBe(true);
    expect(coverageSection?.cards?.map((card) => card?.title)).toEqual([
      'Property & Casualty',
      'Life Insurance',
      'Mission Assure',
      'Bonds',
    ]);
    expect(coverageSection?.actions).toEqual([
      expect.objectContaining({
        label: 'Certificate request',
        to: '/services/insurance/certificate-request',
        className: 'is-outline is-tone-white',
      }),
    ]);
    expect(ctaSection?.title).toBe('Ready to protect your ministry?');
    expect(ctaSection?.form?.title).toBe('What coverage is best for your ministry?');
    expect(ctaSection?.form?.subtitle).toBe('Let’s walk through the options.');
    expect(ctaSection?.form?.fields?.map((field) => field.id)).toEqual([
      'name',
      'email',
      'phone',
      'organization',
      'coverageFocus',
    ]);
    expect(typeof missionAssureFeatureSection?.feature?.logoComponent).toBe('function');
    expect(missionAssureFeatureSection?.feature?.logoImage).toBeUndefined();
  });
});
