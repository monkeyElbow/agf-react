import { describe, expect, it } from 'vitest';
import {
  getBlockCatalogMetadata,
  getManagedPageFamily,
  isBlockCatalogChoiceAllowed,
} from './blockCatalog';

describe('block catalog', () => {
  it('classifies standard, contextual, internal, and hidden kinds', () => {
    expect(getBlockCatalogMetadata({ kind: 'intro' })).toMatchObject({
      catalogVisibility: 'standard',
      architectureType: 'standard-block',
      category: 'content',
    });
    expect(getBlockCatalogMetadata({ kind: 'request_form' })).toMatchObject({
      catalogVisibility: 'contextual',
      architectureType: 'standard-block',
      allowedPageFamilies: expect.arrayContaining(['loans']),
    });
    expect(getBlockCatalogMetadata({ kind: 'hero' })).toMatchObject({
      catalogVisibility: 'internal',
    });
    expect(getBlockCatalogMetadata({ kind: 'content' })).toMatchObject({
      catalogVisibility: 'hidden',
      architectureType: 'migration-only',
    });
  });

  it('allows standard blocks and filters contextual blocks by route family', () => {
    expect(getManagedPageFamily('/services/planned-giving/endowments')).toBe('planned-giving');
    expect(isBlockCatalogChoiceAllowed({ kind: 'intro' }, { pathname: '/about-us' })).toBe(true);
    expect(isBlockCatalogChoiceAllowed({ kind: 'request_form' }, { pathname: '/services/loans' })).toBe(true);
    expect(isBlockCatalogChoiceAllowed({ kind: 'request_form' }, { pathname: '/about-us' })).toBe(false);
  });

  it('keeps specialized site features route-limited and out of unrelated pages', () => {
    const feature = { kind: 'site_feature', settings: { featureId: 'home_impact_story' } };

    expect(getBlockCatalogMetadata(feature)).toMatchObject({
      architectureType: 'site-feature',
      catalogVisibility: 'contextual',
      allowedRoutes: ['/'],
      featureId: 'home_impact_story',
    });
    expect(isBlockCatalogChoiceAllowed(feature, { pathname: '/' })).toBe(true);
    expect(isBlockCatalogChoiceAllowed(feature, { pathname: '/services' })).toBe(false);
  });
});
