import { describe, expect, it } from 'vitest';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
  isBlockOnlyManagedPagePath,
  isBlocklessManagedPagePath,
  shouldSeedBlocksFromNativePageContent,
  toBlockOnlyManagedPageShell,
} from './managedPageShells';

describe('managed page shells', () => {
  it('keeps the block-only rollout behind an explicit allowlist', () => {
    expect(BLOCK_ONLY_MANAGED_PAGE_PATHS).toBeInstanceOf(Set);
    expect(isBlockOnlyManagedPagePath('/')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-individual-enrollment')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b/403b-individual-enrollment')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-group-enrollment')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b/403b-group-enrollment')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-terms-definitions')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b/403b-terms-definitions')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/online-contributions')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/online-contributions')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/resources')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/resources')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/calculators')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/calculators')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/contact-us')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/contact-us')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/about-us/impact')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/about-us/impact')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/loans')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/loans')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/409a')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/409a')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/iras')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/iras')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/iras/fund-an-ira')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/iras/fund-an-ira')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/rollovers')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/rollovers')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/retirement-consultants')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/retirement-consultants')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/loans/loan-consultants')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/loans/loan-consultants')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/investments')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/investments')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/about-us')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/about-us')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/charitable-gift-annuities')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving/charitable-gift-annuities')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/charitable-trusts')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving/charitable-trusts')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/endowments')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving/endowments')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/generosity-fund')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving/generosity-fund')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/planned-giving/ministry-impact-fund')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/planned-giving/ministry-impact-fund')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/certificate-request')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/certificate-request')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/group-term-life-insurance')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/group-term-life-insurance')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/life-insurance-quote')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/life-insurance-quote')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/ministers-group-life-plan')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/ministers-group-life-plan')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/mission-assure')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/mission-assure')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/mission-assure/report-a-claim')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/mission-assure/report-a-claim')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/insurance/property-casualty-insurance')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/insurance/property-casualty-insurance')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/accessibility')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/accessibility')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/privacy-policy')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/privacy-policy')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/subscribe')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/subscribe')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/terms-of-service')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/terms-of-service')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/vineyard')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/vineyard')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/yourplan')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/yourplan')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/investments/invest-by-mail')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/investments/invest-by-mail')).toBe(false);
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
      expect(shouldSeedBlocksFromNativePageContent(pathname)).toBe(false);
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
