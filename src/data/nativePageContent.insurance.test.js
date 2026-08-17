import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

function expectLink(settings, fieldId, expectedLink) {
  expect(JSON.parse(settings?.[fieldId] || '{}')).toEqual(expect.objectContaining(expectedLink));
}

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
    expectLink(coverageBlock?.settings, 'card4ButtonLinkJson', {
      kind: 'external',
      href: 'https://www.orsurety.com/commercial-bonds',
      openInNewWindow: true,
    });
    expect(certificateProofBlock?.settings?.title).toBe('Need proof of insurance?');
    expect(certificateProofBlock?.settings?.titleClassName).toBe('');
    expect(certificateProofBlock?.settings?.bgTone).toBe('grey');
    expect(certificateProofBlock?.settings?.textTone).toBe('white');
    expectLink(certificateProofBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/services/insurance/certificate-request',
      openInNewWindow: false,
    });
    expect(ctaBlock?.settings?.title).toBe('What coverage is best for your ministry?');
    expect(ctaBlock?.settings?.subtitle).toBe('Let’s walk through the options.');
    expect(JSON.parse(ctaBlock?.settings?.fieldsJson || '[]').map((field) => field.id)).toEqual([
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
    expect(requestBlock?.settings?.anchorId).toBe('quote');
    expect(requestBlock?.settings?.spaceBeforeRem).toBe(3.6);
    expect(requestBlock?.settings?.spaceAfterRem).toBe(5.2);
    expect(requestBlock?.settings?.targetSectionKey).toBeUndefined();
    expect(resourcesBlock?.settings?.card1Title).toBe('Additional coverages available');
    expect(resourcesBlock?.settings?.sectionClassName).toBe('insurance-pc-native-resources');
    expect(noticeBlock?.settings?.fineprintDisclosureId).toBe('insurance-property-casualty-coverage-notice');
  });

  it('keeps Mission Assure intro identity and emphasis in the managed block blueprint', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro_pricing');
    const getCoveredBlock = blocks.find((block) => block?.id === 'get_covered_billboard');
    const claimBlock = blocks.find((block) => block?.id === 'report_claim_billboard');

    expect(introBlock?.settings?.logoKey).toBe('mission-assure');
    expect(introBlock?.settings?.titleHighlightsJson).toContain('faith');
    expect(introBlock?.settings?.subtitle).toBe('As low as **$1.25/day**');
    expect(getCoveredBlock?.settings?.sectionClassName).toBe('mission-assure-native-get-covered');
    expect(claimBlock?.settings?.bodyHtml).toBe('<p>Start here.</p>');
  });
});
