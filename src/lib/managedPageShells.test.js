import { describe, expect, it } from 'vitest';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  isBlockOnlyManagedPagePath,
  shouldSeedBlocksFromNativePageContent,
  toBlockOnlyManagedPageShell,
} from './managedPageShells';

describe('managed page shells', () => {
  it('keeps the block-only rollout behind an explicit allowlist', () => {
    expect(BLOCK_ONLY_MANAGED_PAGE_PATHS).toBeInstanceOf(Set);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/403b/403b-individual-enrollment')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/403b/403b-individual-enrollment')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/409a')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/409a')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/rollovers')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/rollovers')).toBe(false);
    expect(isBlockOnlyManagedPagePath('/services/retirement/retirement-consultants')).toBe(true);
    expect(shouldSeedBlocksFromNativePageContent('/services/retirement/retirement-consultants')).toBe(false);
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
