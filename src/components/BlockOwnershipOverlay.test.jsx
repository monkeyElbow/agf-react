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

  it('shows last saved and draft saved badges together when a draft follows an earlier save', () => {
    const ownership = getBlockOwnershipVisual({
      draftedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah',
      },
      draftedAt: 1710000120000,
      savedBy: {
        userId: 'dev-admin',
        displayName: 'Admin',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000240000);

    expect(ownership.overlayLabel).toBe('Last saved by Admin');
    expect(ownership.overlayDetail).toBe('Saved 4 min ago');
    expect(ownership.overlaySecondaryLabel).toBe('Draft saved by Sarah');
    expect(ownership.overlaySecondaryDetail).toBe('Draft saved 2 min ago');
    expect(ownership.overlayActor.displayName).toBe('Admin');
    expect(ownership.overlaySecondaryActor.displayName).toBe('Sarah');
  });

  it('keeps both badges visible when the current admin owns the draft over an older save', () => {
    const ownership = getBlockOwnershipVisual({
      draftedBy: {
        userId: 'dev-james',
        displayName: 'James',
      },
      draftedAt: 1710000120000,
      savedBy: {
        userId: 'dev-admin',
        displayName: 'Admin',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000240000);

    expect(ownership.state).toBe('owned-self');
    expect(ownership.overlayLabel).toBe('Last saved by Admin');
    expect(ownership.overlaySecondaryLabel).toBe('Draft saved by James');
    expect(ownership.overlayActor.displayName).toBe('Admin');
    expect(ownership.overlaySecondaryActor.displayName).toBe('James');
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

  it('does not show stale passive saved ownership when the block is already live', () => {
    const ownership = getBlockOwnershipVisual({
      isPublishedEquivalent: true,
      savedBy: {
        userId: 'dev-sarah',
        displayName: 'Sarah',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000120000);

    expect(ownership.state).toBe('none');
    expect(ownership.className).toBe('');
    expect(ownership.overlayLabel).toBe('');
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

  it('shows a draft-saved overlay for the current admin after saving a draft', () => {
    const ownership = getBlockOwnershipVisual({
      draftedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      draftedAt: 1710000000000,
      savedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000060000);

    expect(ownership.state).toBe('owned-self');
    expect(ownership.className).toContain('is-admin-owned-self');
    expect(ownership.overlayLabel).toBe('Last saved by James Laptop');
    expect(ownership.overlayDetail).toBe('Saved 1 min ago');
    expect(ownership.overlaySecondaryLabel).toBe('Draft saved by James Laptop');
    expect(ownership.overlaySecondaryDetail).toBe('Draft saved 1 min ago');
  });

  it('labels a newly added block as draft instead of implying it was already live', () => {
    const ownership = getBlockOwnershipVisual({
      isNewBlock: true,
      draftedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      draftedAt: 1710000000000,
      savedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000060000);

    expect(ownership.state).toBe('owned-self');
    expect(ownership.overlayLabel).toBe('Draft saved by James Laptop');
    expect(ownership.overlayDetail).toBe('Draft saved 1 min ago');
    expect(ownership.overlaySecondaryLabel).toBe('');
  });

  it('shows a live confirmation for the current admin after publishing', () => {
    const ownership = getBlockOwnershipVisual({
      isPublishedEquivalent: true,
      savedBy: {
        userId: 'dev-james',
        displayName: 'James Laptop',
      },
      savedAt: 1710000000000,
    }, 'dev-james', 1710000060000);

    expect(ownership.state).toBe('owned-self');
    expect(ownership.overlayLabel).toBe('Published by James Laptop');
    expect(ownership.overlayDetail).toBe('Published 1 min ago');
  });
});
