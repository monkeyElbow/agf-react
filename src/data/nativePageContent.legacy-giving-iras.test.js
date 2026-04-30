import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('legacy giving and IRA native page content', () => {
  it('keeps the legacy giving copy and endowments/generosity cleanup in the native seed', () => {
    const legacyContent = getNativePageContent('/services/legacy-giving', '');
    const endowmentsContent = getNativePageContent('/services/legacy-giving/endowments', '');
    const generosityContent = getNativePageContent('/services/legacy-giving/generosity-fund', '');

    const legacyCards = legacyContent?.sections?.find((section) => section?.className === 'legacy-giving-types')?.cards || [];
    const endowmentSections = Array.isArray(endowmentsContent?.sections) ? endowmentsContent.sections : [];
    const generosityRequest = generosityContent?.sections?.find((section) => section?.className === 'legacy-child-native-generosity-request');

    expect(legacyCards[0]?.body).toContain('Donor Advised Fund');
    expect(legacyCards[2]?.body).toContain('provides payments for you');
    expect(endowmentSections.some((section) => section?.className === 'legacy-child-native-endowments-inquiry')).toBe(false);
    expect(endowmentSections.find((section) => section?.className === 'legacy-child-native-endowments-big-cta')?.actions).toEqual([]);
    expect(endowmentSections.find((section) => section?.className === 'legacy-child-native-endowments-legacy-form')?.title).toBe('Begin the Endowment sign up process');
    expect(generosityRequest?.body).toEqual([]);
    expect(generosityRequest?.form?.subtitle).toBeUndefined();
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
