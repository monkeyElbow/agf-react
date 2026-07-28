import { describe, expect, it } from 'vitest';
import { genericPageBlockBlueprint } from './contentBlockBlueprints';
import {
  getAllowedSiteFeatureEditableFieldIds,
  getDefaultSiteFeatureCatalogEntry,
  getSiteFeatureCatalog,
  getSiteFeatureCatalogEntry,
  getSiteFeatureOptions,
  resolveSiteFeatureCatalogEntry,
} from './siteFeatureCatalog';

describe('site feature catalog', () => {
  it('keeps site-feature ids, admin metadata, and runtime bindings on one reviewed surface', () => {
    const catalog = getSiteFeatureCatalog();
    const defaultEntry = getDefaultSiteFeatureCatalogEntry();

    expect(catalog).toHaveLength(10);
    expect(defaultEntry).toMatchObject({
      featureId: 'editorial_spotlight',
      label: 'Editorial spotlight',
      runtimeKey: 'editorial_spotlight',
      experimental: false,
      internalOnly: false,
    });
    expect(typeof defaultEntry?.buildRuntime).toBe('function');
    expect(defaultEntry?.routeAllowlist).toEqual([]);
  });

  it('keeps option values and editable field governance aligned to the catalog entry', () => {
    const entry = getSiteFeatureCatalogEntry('editorial_spotlight');
    const homeServicesEntry = getSiteFeatureCatalogEntry('home_services_feature_animation');
    const homeImpactEntry = getSiteFeatureCatalogEntry('home_impact_story');
    const servicesBreakdownEntry = getSiteFeatureCatalogEntry('services_breakdown');
    const servicesMattersEntry = getSiteFeatureCatalogEntry('services_matters_band');
    const retirementPlanEntry = getSiteFeatureCatalogEntry('retirement_plan_feature');
    const legacyGivingEntry = getSiteFeatureCatalogEntry('legacy_giving_stewardship_story');
    const impactProofEntry = getSiteFeatureCatalogEntry('impact_proof_story');
    const aboutHistoryEntry = getSiteFeatureCatalogEntry('about_history_feature');
    const investmentsGrowthEntry = getSiteFeatureCatalogEntry('investments_growth_feature');

    expect(getSiteFeatureOptions()).toEqual([
      { value: 'editorial_spotlight', label: 'Editorial spotlight' },
      { value: 'home_services_feature_animation', label: 'Home services feature animation' },
      { value: 'home_impact_story', label: 'Home impact story' },
      { value: 'services_breakdown', label: 'Services breakdown' },
      { value: 'services_matters_band', label: 'Services matters band' },
      { value: 'retirement_plan_feature', label: 'Retirement plan feature' },
      { value: 'legacy_giving_stewardship_story', label: 'Planned Giving stewardship story' },
      { value: 'impact_proof_story', label: 'Impact proof story' },
      { value: 'about_history_feature', label: 'About history feature' },
      { value: 'investments_growth_feature', label: 'Investments growth feature' },
    ]);
    expect(getAllowedSiteFeatureEditableFieldIds('editorial_spotlight')).toEqual(entry?.allowedEditableFieldIds);
    expect(entry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'headline',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
      'buttonOpenInNewWindow',
    ]);
    expect(getAllowedSiteFeatureEditableFieldIds('home_services_feature_animation')).toEqual(homeServicesEntry?.allowedEditableFieldIds);
    expect(homeServicesEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
    ]);
    expect(getAllowedSiteFeatureEditableFieldIds('home_impact_story')).toEqual(homeImpactEntry?.allowedEditableFieldIds);
    expect(homeImpactEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'headline',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
    ]);
    expect(getAllowedSiteFeatureEditableFieldIds('legacy_giving_stewardship_story')).toEqual(legacyGivingEntry?.allowedEditableFieldIds);
    expect(legacyGivingEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'headline',
    ]);
    expect(entry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(homeServicesEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(homeImpactEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(legacyGivingEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(homeServicesEntry?.routeAllowlist).toEqual(['/']);
    expect(homeImpactEntry?.routeAllowlist).toEqual(['/']);
    expect(getAllowedSiteFeatureEditableFieldIds('services_breakdown')).toEqual(servicesBreakdownEntry?.allowedEditableFieldIds);
    expect(servicesBreakdownEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
    ]);
    expect(getAllowedSiteFeatureEditableFieldIds('services_matters_band')).toEqual(servicesMattersEntry?.allowedEditableFieldIds);
    expect(servicesMattersEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
    ]);
    expect(servicesBreakdownEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(servicesMattersEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(servicesBreakdownEntry?.routeAllowlist).toEqual(['/services']);
    expect(servicesMattersEntry?.routeAllowlist).toEqual(['/services']);
    expect(getAllowedSiteFeatureEditableFieldIds('retirement_plan_feature')).toEqual(retirementPlanEntry?.allowedEditableFieldIds);
    expect(retirementPlanEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
    ]);
    expect(retirementPlanEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(retirementPlanEntry?.routeAllowlist).toEqual(['/services/retirement']);
    expect(legacyGivingEntry?.routeAllowlist).toEqual(['/services/planned-giving']);
    expect(getAllowedSiteFeatureEditableFieldIds('impact_proof_story')).toEqual(impactProofEntry?.allowedEditableFieldIds);
    expect(impactProofEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
    ]);
    expect(impactProofEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(impactProofEntry?.routeAllowlist).toEqual(['/about-us/impact']);
    expect(getAllowedSiteFeatureEditableFieldIds('about_history_feature')).toEqual(aboutHistoryEntry?.allowedEditableFieldIds);
    expect(aboutHistoryEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
    ]);
    expect(aboutHistoryEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(aboutHistoryEntry?.routeAllowlist).toEqual(['/about-us']);
    expect(aboutHistoryEntry?.buildRuntime?.({ settings: {} })?.cards).toHaveLength(6);
    expect(getAllowedSiteFeatureEditableFieldIds('investments_growth_feature')).toEqual(investmentsGrowthEntry?.allowedEditableFieldIds);
    expect(investmentsGrowthEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
      'buttonOpenInNewWindow',
    ]);
    expect(investmentsGrowthEntry?.routeAllowlist).toEqual(['/services/investments']);

    const homeServicesRuntime = homeServicesEntry?.buildRuntime?.({ settings: {} });
    expect(homeServicesRuntime?.panels).toHaveLength(5);
    expect(homeServicesRuntime?.panels?.map((panel) => panel.title)).toEqual([
      'Loans',
      'Investments',
      'Retirement',
      'Planned Giving',
      'Insurance',
    ]);
    expect(servicesBreakdownEntry?.buildRuntime?.({ settings: {} })?.rows).toHaveLength(5);
    expect(servicesMattersEntry?.buildRuntime?.({ settings: {} })?.action?.to).toBe('/about-us/impact');
    expect(servicesMattersEntry?.buildRuntime?.({ settings: {} })?.action?.label).toBe("See what we're doing together");
  });

  it('falls back unknown ids to the default reviewed entry', () => {
    expect(resolveSiteFeatureCatalogEntry('unknown-feature')?.featureId).toBe('editorial_spotlight');
  });

  it('seeds the generic site-feature insert template from the default catalog entry', () => {
    const defaultEntry = getDefaultSiteFeatureCatalogEntry();
    const blueprint = genericPageBlockBlueprint().find((block) => block?.kind === 'site_feature');

    expect(blueprint).toMatchObject({
      id: 'site_feature',
      kind: 'site_feature',
      name: `Site Feature · ${defaultEntry?.label}`,
      description: defaultEntry?.description,
    });
    expect(blueprint?.settings?.featureId).toBe(defaultEntry?.featureId);
  });
});
