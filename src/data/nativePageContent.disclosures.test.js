import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('native page disclosure wiring', () => {
  it('tags key native fineprint sections with centralized disclosure ids', () => {
    const propertyCasualty = getNativePageContent('/services/insurance/property-casualty-insurance', '');
    const charitableGiftAnnuities = getNativePageContent('/services/planned-giving/charitable-gift-annuities', '');
    const retirement403b = getNativePageContent('/services/retirement/403b', '');
    const retirement403bIndividual = getNativePageContent('/services/retirement/403b/403b-individual-enrollment', '');
    const retirement403bGroup = getNativePageContent('/services/retirement/403b/403b-group-enrollment', '');
    const retirementIras = getNativePageContent('/services/retirement/iras', '');

    expect(propertyCasualty.sections.find((section) => section?.className === 'insurance-pc-native-fineprint')?.fineprintDisclosureId).toBe('insurance-property-casualty-coverage-notice');
    expect(charitableGiftAnnuities.sections.find((section) => section?.className === 'legacy-child-native-cga-qcd-fineprint')?.fineprintDisclosureId).toBe('planned-giving-cga-qcd-fineprint');
    expect(charitableGiftAnnuities.sections.find((section) => section?.className === 'legacy-child-native-cga-outro')?.fineprintDisclosureId).toBe('planned-giving-cga-state-notices');
    expect(retirement403b.sections.find((section) => section?.className === 'retirement-child-native-table')?.fineprintDisclosureId).toBe('retirement-403b-contribution-limits-disclosure');
    expect(retirement403bIndividual.sections.find((section) => section?.className === 'retirement-child-native-qualify')?.fineprintDisclosureId).toBe('retirement-403b-501c3-note');
    expect(retirement403bGroup.sections.find((section) => section?.className === 'retirement-child-native-qualify')?.fineprintDisclosureId).toBe('retirement-403b-501c3-note');
    expect(retirementIras.sections.find((section) => section?.className === 'retirement-ira-native-rates')?.fineprintDisclosureId).toBe('retirement-ira-rates-disclosure');
    expect(retirementIras.sections.find((section) => section?.className === 'retirement-ira-native-limits')?.fineprintDisclosureId).toBe('retirement-ira-contribution-limits-disclosure');
  });
});
