import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('native page disclosure wiring', () => {
  it('tags key native fineprint sections with centralized disclosure ids', () => {
    const propertyCasualty = getNativePageContent('/services/insurance/property-casualty-insurance', '');
    const charitableGiftAnnuities = getNativePageContent('/services/planned-giving/charitable-gift-annuities', '');
    const retirement403b = getNativePageContent('/services/retirement/403b', '');
    const retirement403bGroup = getNativePageContent('/services/retirement/403b/403b-group-enrollment', '');
    const retirementIras = getNativePageContent('/services/retirement/iras', '');
    const propertyCasualtyBlocks = contentBlockBlueprintsByPath['/services/insurance/property-casualty-insurance'] || [];
    const charitableGiftAnnuitiesBlocks = contentBlockBlueprintsByPath['/services/planned-giving/charitable-gift-annuities'] || [];
    const iraBlocks = contentBlockBlueprintsByPath['/services/retirement/iras'] || [];

    expect(Array.isArray(propertyCasualty.sections) ? propertyCasualty.sections : []).toEqual([]);
    expect(propertyCasualtyBlocks.find((block) => block?.id === 'coverage_notice')?.settings?.fineprintDisclosureId).toBe('insurance-property-casualty-coverage-notice');
    expect(Array.isArray(charitableGiftAnnuities.sections) ? charitableGiftAnnuities.sections : []).toEqual([]);
    expect(charitableGiftAnnuitiesBlocks.find((block) => block?.id === 'qcd_fineprint')?.settings?.fineprintDisclosureId).toBe('planned-giving-cga-qcd-fineprint');
    expect(charitableGiftAnnuitiesBlocks.find((block) => block?.id === 'outro')?.settings?.fineprintDisclosureId).toBe('planned-giving-cga-state-notices');
    expect(Array.isArray(retirement403b.sections) ? retirement403b.sections : []).toEqual([]);
    expect(Array.isArray(retirement403bGroup.sections) ? retirement403bGroup.sections : []).toEqual([]);
    expect(Array.isArray(retirementIras.sections) ? retirementIras.sections : []).toEqual([]);
    expect(iraBlocks.find((block) => block?.id === 'rate_table')?.settings?.fineprintDisclosureId).toBe('retirement-ira-rates-disclosure');
    expect(iraBlocks.find((block) => block?.id === 'contribution_limits')?.settings?.fineprintDisclosureId).toBe('retirement-ira-contribution-limits-disclosure');
  });
});
