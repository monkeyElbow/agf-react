import { describe, expect, it } from 'vitest';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
  SPECIAL_MANAGED_PAGE_CLASSIFICATIONS,
  getManagedPageRouteClassification,
  getSpecialManagedPageClassification,
  isBlockOnlyManagedPagePath,
  isBlocklessManagedPagePath,
  toBlockOnlyManagedPageShell,
} from './managedPageShells';

describe('managed page shells', () => {
  it('keeps the block-only rollout behind an explicit allowlist', () => {
    expect(BLOCK_ONLY_MANAGED_PAGE_PATHS).toBeInstanceOf(Set);
    expect(isBlockOnlyManagedPagePath('/')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-individual-enrollment')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-group-enrollment')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-terms-definitions')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/online-contributions')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/resources')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/calculators')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/contact-us')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/about-us/impact')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/loans')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/409a')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/iras')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/iras/fund-an-ira')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/rollovers')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/retirement/retirement-consultants')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/loans/loan-consultants')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/investments')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/about-us')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/charitable-gift-annuities')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/charitable-trusts')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/endowments')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/generosity-fund')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/ministry-impact-fund')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/certificate-request')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/group-term-life-insurance')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/life-insurance-quote')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/ministers-group-life-plan')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/mission-assure')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/mission-assure/report-a-claim')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/insurance/property-casualty-insurance')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/accessibility')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/privacy-policy')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/subscribe')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/terms-of-service')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/vineyard')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/yourplan')).toBe(true);
    expect(isBlockOnlyManagedPagePath('/services/investments/invest-by-mail')).toBe(true);
  });

  it('keeps functional routes blockless instead of seeding empty page-content fallbacks', () => {
    expect(BLOCKLESS_MANAGED_PAGE_PATHS).toBeInstanceOf(Set);

    [
      '/about-us/careers',
      '/forms',
      '/prospectus',
      '/search',
      '/sitemap',
    ].forEach((pathname) => {
      expect(isBlocklessManagedPagePath(pathname)).toBe(true);
      expect(isBlockOnlyManagedPagePath(pathname)).toBe(false);
    });
  });

  it('classifies special routes outside the block-only marketing inventory', () => {
    expect(SPECIAL_MANAGED_PAGE_CLASSIFICATIONS).toEqual({
      '/brand': 'functional-brand-kit',
      '/rates': 'functional-rates-admin',
      '/taxguide': 'legacy-page-content',
      '/test': 'development-sandbox',
    });

    Object.keys(SPECIAL_MANAGED_PAGE_CLASSIFICATIONS).forEach((pathname) => {
      expect(isBlockOnlyManagedPagePath(pathname)).toBe(false);
      expect(isBlocklessManagedPagePath(pathname)).toBe(false);
      expect(getSpecialManagedPageClassification(pathname)).toBe(SPECIAL_MANAGED_PAGE_CLASSIFICATIONS[pathname]);
    });
  });

  it('reports one explicit route classification for system checks', () => {
    expect(getManagedPageRouteClassification('/services/loans')).toEqual({
      type: 'block-only',
      id: 'block-only',
    });
    expect(getManagedPageRouteClassification('/forms')).toEqual({
      type: 'blockless',
      id: 'blockless-functional',
    });
    expect(getManagedPageRouteClassification('/taxguide')).toEqual({
      type: 'special',
      id: 'legacy-page-content',
    });
    expect(getManagedPageRouteClassification('/unclassified-route')).toEqual({
      type: 'unclassified',
      id: '',
    });
  });

  it('strips visible native content down to a route shell for block-only pages', () => {
    const shell = toBlockOnlyManagedPageShell({
      pageClass: 'native-info-page--retirement-403b',
      compact: true,
      hero: { title: 'Legacy hero' },
      intro: { heading: 'Legacy intro' },
      preIntroSections: [{ title: 'Top section' }],
      sections: [{ title: 'Visible section' }],
      actions: [{ label: 'Legacy action', to: '/legacy' }],
      forms: [{ id: 'legacy-form' }],
    });

    expect(shell).toMatchObject({
      pageClass: 'native-info-page--retirement-403b',
      compact: true,
      hero: null,
      intro: null,
      preIntroSections: [],
      sections: [],
      actions: [],
      forms: [],
    });
  });
});
