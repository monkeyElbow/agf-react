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

    expect(catalog).toHaveLength(2);
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
    const homeImpactEntry = getSiteFeatureCatalogEntry('home_impact_story');

    expect(getSiteFeatureOptions()).toEqual([
      { value: 'editorial_spotlight', label: 'Editorial spotlight' },
      { value: 'home_impact_story', label: 'Home impact story' },
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
    expect(getAllowedSiteFeatureEditableFieldIds('home_impact_story')).toEqual(homeImpactEntry?.allowedEditableFieldIds);
    expect(homeImpactEntry?.allowedEditableFieldIds).toEqual([
      'featureId',
      'headline',
      'body',
      'buttonLabel',
      'buttonUrl',
      'buttonPageRef',
    ]);
    expect(entry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(homeImpactEntry?.allowedEditableFieldIds.some((fieldId) => /layout|animation|preset|template/i.test(fieldId))).toBe(false);
    expect(homeImpactEntry?.routeAllowlist).toEqual(['/']);
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
