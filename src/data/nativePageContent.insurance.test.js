import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('insurance native page content', () => {
  it('keeps insurance overview native content shell-only with visible sections owned by blocks', () => {
    const content = getNativePageContent('/services/insurance', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance'] || [];
    const coverageBlock = blocks.find((block) => block?.id === 'coverage_solutions');
    const certificateProofBlock = blocks.find((block) => block?.id === 'certificate_proof');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');
    const missionAssureBlock = blocks.find((block) => block?.id === 'mission_assure');

    expect(content?.pageClass).toBe('native-info-page--insurance');
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(content?.sections).toBeUndefined();
    expect(coverageBlock?.settings?.cardStyle).toBe('card1');
    expect([
      coverageBlock?.settings?.card1Title,
      coverageBlock?.settings?.card2Title,
      coverageBlock?.settings?.card3Title,
      coverageBlock?.settings?.card4Title,
    ]).toEqual([
      'Property & Casualty',
      'Life Insurance',
      'Mission Assure',
      'Bonds',
    ]);
    expect(coverageBlock?.settings?.card1Body).toBe('Our specialty is helping protect churches, schools, ministries, and other nonprofits, as well as businesses.');
    expect(coverageBlock?.settings?.card3Body).toContain('Mission Assure® offers superior protection at minimum cost.');
    expect(coverageBlock?.settings?.card4Body).toContain('We partner with Old Republic Surety');
    expect(coverageBlock?.settings?.card4ButtonUrl).toBe('https://www.orsurety.com/commercial-bonds');
    expect(certificateProofBlock?.settings?.title).toBe('Need proof of insurance?');
    expect(certificateProofBlock?.settings?.titleClassName).toBe('is-mango');
    expect(certificateProofBlock?.settings?.buttonPageRef).toBe('/services/insurance/certificate-request');
    expect(ctaBlock?.settings?.title).toBe('What coverage is best for your ministry?');
    expect(ctaBlock?.settings?.subtitle).toBe('Let’s walk through the options.');
    expect(JSON.parse(ctaBlock?.settings?.step1FieldsJson || '[]').map((field) => field.id)).toEqual([
      'name',
      'email',
      'phone',
      'organization',
      'coverageFocus',
    ]);
    expect(missionAssureBlock?.settings?.sectionClassName).toBe('insurance-native-mission-assure');
    expect(missionAssureBlock?.settings?.targetSectionKey).toBeUndefined();
  });

  it('keeps property and casualty native content shell-only with visible sections owned by blocks', () => {
    const content = getNativePageContent('/services/insurance/property-casualty-insurance', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance/property-casualty-insurance'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');
    const resourcesBlock = blocks.find((block) => block?.id === 'resources');
    const noticeBlock = blocks.find((block) => block?.id === 'coverage_notice');

    expect(content?.pageClass).toBe('native-info-page--insurance-pc');
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(content?.sections).toBeUndefined();
    expect(requestBlock?.settings?.sectionClassName).toBe('insurance-pc-native-quote');
    expect(requestBlock?.settings?.targetSectionKey).toBeUndefined();
    expect(resourcesBlock?.settings?.card1Title).toBe('Additional coverages available');
    expect(noticeBlock?.settings?.fineprintDisclosureId).toBe('insurance-property-casualty-coverage-notice');
  });
});
