import { describe, expect, it } from 'vitest';
import { getBlockOwnershipVisual } from './BlockOwnershipOverlay';

describe('getBlockOwnershipVisual', () => {
  it('marks actively edited blocks from another admin with the stronger ownership state', () => {
    const ownership = getBlockOwnershipVisual({
      lockedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah MacBook',
      },
      savedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah MacBook',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000300000);

    expect(ownership.state).toBe('editing-other');
    expect(ownership.className).toContain('is-admin-owned-editing-other');
    expect(ownership.overlayLabel).toBe('Sarah MacBook is editing this block');
    expect(ownership.overlayDetail).toBe('Saved 5 min ago');
  });

  it('marks passive drafts from another admin with the blue drafted state', () => {
    const ownership = getBlockOwnershipVisual({
      draftedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah',
      },
      draftedAt: 1710000000000,
    }, 'dev-james', 1710000120000);

    expect(ownership.state).toBe('drafted-other');
    expect(ownership.className).toContain('is-admin-owned-drafted-other');
    expect(ownership.overlayLabel).toBe('Unpublished draft by Sarah');
    expect(ownership.overlayDetail).toBe('Draft saved 2 min ago');
  });

  it('keeps passive saved ownership distinct from drafted ownership', () => {
    const ownership = getBlockOwnershipVisual({
      savedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000120000);

    expect(ownership.state).toBe('saved-other');
    expect(ownership.className).toContain('is-admin-owned-saved-other');
    expect(ownership.overlayLabel).toBe('Last saved by Sarah');
    expect(ownership.overlayDetail).toBe('Saved 2 min ago');
  });

  it('marks active self locks as editing-self instead of generic ownership', () => {
    const ownership = getBlockOwnershipVisual({
      lockedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      lockedAt: 1710000000000,
    }, 'dev-james', 1710000060000);

    expect(ownership.state).toBe('editing-self');
    expect(ownership.className).toContain('is-admin-owned-editing-self');
    expect(ownership.overlayLabel).toBe('');
  });

  it('uses a lighter self-owned state without a blocking overlay', () => {
    const ownership = getBlockOwnershipVisual({
      savedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000060000);

    expect(ownership.state).toBe('owned-self');
    expect(ownership.className).toContain('is-admin-owned-self');
    expect(ownership.overlayLabel).toBe('');
  });
});
