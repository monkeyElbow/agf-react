import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('legacy giving and IRA native page content', () => {
  it('keeps the legacy giving copy and endowments/generosity cleanup in the native seed', () => {
    const legacyContent = getNativePageContent('/services/legacy-giving', '');
    const endowmentsContent = getNativePageContent('/services/legacy-giving/endowments', '');
    const generosityContent = getNativePageContent('/services/legacy-giving/generosity-fund', '');
    const ministryImpactContent = getNativePageContent('/services/legacy-giving/ministry-impact-fund', '');
    const charitableTrustsContent = getNativePageContent('/services/legacy-giving/charitable-trusts', '');

    const legacyCards = legacyContent?.sections?.find((section) => section?.className === 'legacy-giving-types')?.cards || [];
    const stewardshipSection = legacyContent?.sections?.find((section) => section?.className === 'legacy-giving-stewardship');
    const joySection = legacyContent?.sections?.find((section) => String(section?.className || '').includes('legacy-giving-joy'));
    const comparisonSection = legacyContent?.sections?.find((section) => section?.className === 'legacy-giving-comparison');
    const endowmentSections = Array.isArray(endowmentsContent?.sections) ? endowmentsContent.sections : [];
    const generosityHeroActions = Array.isArray(generosityContent?.hero?.actions) ? generosityContent.hero.actions : [];
    const generosityPreIntroSections = Array.isArray(generosityContent?.preIntroSections) ? generosityContent.preIntroSections : [];
    const generosityInlineCta = generosityPreIntroSections.find((section) => section?.className === 'legacy-child-native-generosity-request legacy-child-native-generosity-cta legacy-child-native-generosity-request-inline');
    const generosityRequest = generosityContent?.sections?.find((section) => section?.className === 'legacy-child-native-generosity-request');
    const generosityOutro = generosityContent?.sections?.find((section) => section?.className === 'legacy-child-native-generosity-outro');
    const generosityInlineCtaIndex = generosityPreIntroSections.findIndex((section) => section?.className === 'legacy-child-native-generosity-request legacy-child-native-generosity-cta legacy-child-native-generosity-request-inline');
    const generosityStepsIndex = generosityContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-steps');
    const generosityRequestIndex = generosityContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-generosity-request');
    const generosityOutroIndex = generosityContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-generosity-outro');
    const ministryImpactSections = Array.isArray(ministryImpactContent?.sections) ? ministryImpactContent.sections : [];
    const ministryImpactStockSection = ministryImpactSections.find((section) => section?.className === 'legacy-child-native-stock');
    const ministryImpactRequestSection = ministryImpactSections.find((section) => section?.className === 'legacy-child-native-request');
    const charitableTrustsTypes = charitableTrustsContent?.sections?.find((section) => section?.className === 'legacy-child-native-trusts-crt-types');
    const charitableTrustsTrigger = charitableTrustsContent?.sections?.find((section) => section?.className === 'legacy-child-native-trusts-crt-trigger');
    const charitableTrustsInlineCta = charitableTrustsContent?.sections?.find((section) => section?.className === 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline');
    const charitableTrustsCta = charitableTrustsContent?.sections?.find((section) => section?.className === 'legacy-child-native-cta legacy-child-native-trusts-cta');
    const charitableTrustsTypesIndex = charitableTrustsContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-trusts-crt-types');
    const charitableTrustsTriggerIndex = charitableTrustsContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-trusts-crt-trigger');
    const charitableTrustsInlineCtaIndex = charitableTrustsContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline');
    const charitableTrustsCltIndex = charitableTrustsContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-trusts-clt');
    const charitableTrustsCtaIndex = charitableTrustsContent?.sections?.findIndex((section) => section?.className === 'legacy-child-native-cta legacy-child-native-trusts-cta');

    expect(legacyCards[0]?.body).toContain('Donor Advised Fund');
    expect(legacyCards[2]?.body).toContain('provides payments for you');
    expect(stewardshipSection?.id).toBe('legacy-giving-stewardship-story');
    expect(stewardshipSection?.title).toBe('Smart stewardship—for today and tomorrow.');
    expect(joySection?.className).toContain('fade-out');
    expect(joySection?.copyWrap).toBe(true);
    expect(joySection?.copyClassName).toBe('fade-up');
    expect(comparisonSection?.anchorId).toBe('charitable-giving-plan-comparison');
    expect(comparisonSection?.title).toBe('Which Charitable Giving plan is right for you?');
    expect(endowmentSections.some((section) => section?.className === 'legacy-child-native-endowments-inquiry')).toBe(false);
    expect(endowmentSections.find((section) => section?.className === 'legacy-child-native-endowments-big-cta')?.actions).toEqual([]);
    expect(endowmentSections.find((section) => section?.className === 'legacy-child-native-endowments-legacy-form')?.title).toBe('Begin the Endowment sign up process');
    expect(generosityHeroActions).toEqual([
      expect.objectContaining({ label: 'Open a Generosity Fund®', href: 'https://secure.agfinancial.org/generosityfund/signup' }),
      expect.objectContaining({
        label: 'Open a traditional DAF',
        action: 'open_cta_form',
        targetAnchorId: 'traditional-daf-inline-form',
        className: 'is-outline is-tone-super-grey',
      }),
    ]);
    expect(generosityInlineCta?.anchorId).toBe('traditional-daf-inline-form');
    expect(generosityInlineCta?.form?.displayMode).toBe('inline_reveal');
    expect(generosityInlineCta?.form?.triggerMode).toBe('external');
    expect(generosityInlineCta?.id).toBeUndefined();
    expect(generosityRequest?.id).toBe('traditional-daf-form');
    expect(generosityRequest?.anchorId).toBe('traditional-daf-form');
    expect(generosityRequest?.body).toEqual([]);
    expect(generosityRequest?.form?.subtitle).toBeUndefined();
    expect(generosityRequest?.form?.displayMode).toBeUndefined();
    expect(generosityRequest?.form?.triggerMode).toBeUndefined();
    expect(generosityRequest?.form?.fields).toEqual([
      expect.objectContaining({ id: 'name', label: 'Name*', type: 'text', required: true }),
      expect.objectContaining({ id: 'phone', label: 'Phone*', type: 'tel', required: true }),
      expect.objectContaining({ id: 'email', label: 'Email*', type: 'email', required: true }),
    ]);
    expect(generosityOutro?.title).toBe('Simple, joyful giving.');
    expect(generosityOutro?.subtitle).toBe('Powered by your generosity.');
    expect(generosityOutro?.actions).toEqual([
      expect.objectContaining({ label: 'Open a Generosity Fund®', href: 'https://secure.agfinancial.org/generosityfund/signup' }),
      expect.objectContaining({ label: 'Terms and Conditions', documentId: 'document-planned-giving-terms-and-conditions', ghost: true }),
    ]);
    expect(generosityContent?.intro?.heading).toBe('All your charitable giving in one place.');
    expect(generosityInlineCtaIndex).toBe(0);
    expect(generosityStepsIndex).toBe(0);
    expect(generosityRequestIndex).toBeGreaterThan(generosityStepsIndex);
    expect(generosityOutroIndex).toBeGreaterThan(generosityRequestIndex);
    expect(ministryImpactContent?.intro?.heading).toBe('Most wealth isn’t cash.');
    expect(ministryImpactSections.find((section) => section?.className === 'legacy-child-native-steps')?.cards).toHaveLength(3);
    expect(ministryImpactStockSection?.actions).toHaveLength(3);
    expect(ministryImpactRequestSection?.form?.title).toBe('Talk with planned giving');
    expect(ministryImpactRequestSection?.form?.subtitle).toBe('Let’s map out the best next step.');
    expect(ministryImpactRequestSection?.form?.fields).toEqual([
      expect.objectContaining({ id: 'firstName', label: 'First Name*', type: 'text', required: true }),
      expect.objectContaining({ id: 'lastName', label: 'Last Name*', type: 'text', required: true }),
      expect.objectContaining({ id: 'phone', label: 'Phone*', type: 'tel', required: true }),
      expect.objectContaining({ id: 'email', label: 'Email*', type: 'email', required: true }),
    ]);
    expect(charitableTrustsTypes?.actions).toBeUndefined();
    expect(charitableTrustsTrigger?.justify).toBe('center');
    expect(charitableTrustsTrigger?.hideCopy).toBe(true);
    expect(charitableTrustsTrigger?.actions).toEqual([
      expect.objectContaining({
        label: 'Start the process',
        action: 'open_cta_form',
        targetAnchorId: 'charitable-trusts-inline-form',
        className: 'is-outline is-tone-atlantean',
      }),
    ]);
    expect(charitableTrustsTypes?.cards?.every((card) => !Array.isArray(card?.actions) || card.actions.length === 0)).toBe(true);
    expect(charitableTrustsInlineCta?.anchorId).toBe('charitable-trusts-inline-form');
    expect(charitableTrustsInlineCta?.form?.displayMode).toBe('inline_reveal');
    expect(charitableTrustsInlineCta?.form?.triggerMode).toBe('external');
    expect(charitableTrustsCta?.anchorId).toBe('charitable-trusts-form');
    expect(charitableTrustsCta?.form?.displayMode).toBeUndefined();
    expect(charitableTrustsCta?.form?.triggerMode).toBeUndefined();
    expect(charitableTrustsTypesIndex).toBeGreaterThan(-1);
    expect(charitableTrustsTriggerIndex).toBeGreaterThan(charitableTrustsTypesIndex);
    expect(charitableTrustsInlineCtaIndex).toBeGreaterThan(-1);
    expect(charitableTrustsInlineCtaIndex).toBeGreaterThan(charitableTrustsTriggerIndex);
    expect(charitableTrustsCltIndex).toBeGreaterThan(charitableTrustsInlineCtaIndex);
    expect(charitableTrustsCtaIndex).toBeGreaterThan(charitableTrustsCltIndex);
    expect(charitableTrustsCta?.form?.fields?.map((field) => field.id)).toEqual([
      'firstName',
      'lastName',
      'phone',
      'email',
      'trustProduct',
      'message',
    ]);
  });

  it('uses the shared IRA open button and updated rollover copy', () => {
    const iraContent = getNativePageContent('/services/retirement/iras', '');
    const iraTypes = iraContent?.sections?.find((section) => section?.className === 'retirement-child-native-ira-types');
    const rollover = iraContent?.sections?.find((section) => section?.className === 'retirement-child-native-rollover');

    expect(iraTypes?.cards?.every((card) => !Array.isArray(card?.actions) || card.actions.length === 0)).toBe(true);
    expect(iraTypes?.actions).toEqual([{ label: 'Open IRA', href: 'https://secure.agfinancial.org/invest' }]);
    expect(rollover?.body?.[0]).toContain('single AGFinancial IRA');
  });
});
