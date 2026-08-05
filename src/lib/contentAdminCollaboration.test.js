import { describe, expect, it } from 'vitest';
import {
  normalizeSharedPublishResult,
  normalizeSharedSaveResult,
} from './contentAdminCollaboration';

describe('content-admin operation result contracts', () => {
  it('distinguishes complete, partial, blocked, and no-op draft saves', () => {
    expect(normalizeSharedSaveResult({ didSave: true }).status).toBe('saved');
    expect(normalizeSharedSaveResult({ didSave: true, hasConflicts: true }).status).toBe('partially-saved');
    expect(normalizeSharedSaveResult({ didSave: false, hasConflicts: true }).status).toBe('blocked');
    expect(normalizeSharedSaveResult({ didSave: false }).status).toBe('no-op');
  });

  it('distinguishes complete, blocked, and already-live publishes', () => {
    expect(normalizeSharedPublishResult({ didPublish: true }).status).toBe('published');
    expect(normalizeSharedPublishResult({ didPublish: false, hasConflicts: true }).status).toBe('blocked');
    expect(normalizeSharedPublishResult({ error: 'already-live' }).status).toBe('already-live');
  });

  it('preserves block-level conflict ownership in the normalized result', () => {
    const result = normalizeSharedSaveResult({
      didSave: true,
      blockedBlocks: [{
        pathname: '/services/loans',
        blockId: 'hero',
        reason: 'drafted-by-other',
        owner: { userId: 'sarah', displayName: 'Sarah' },
      }],
    });

    expect(result.status).toBe('partially-saved');
    expect(result.blockedBlocks[0]).toMatchObject({
      pathname: '/services/loans',
      blockId: 'hero',
      owner: { userId: 'sarah', displayName: 'Sarah' },
    });
  });

  it('preserves a verified publish receipt with route, scope, actor, and block IDs', () => {
    expect(normalizeSharedPublishResult({
      didPublish: true,
      receipt: {
        route: '/services/loans',
        scope: 'block',
        actor: { userId: 'taylor', displayName: 'Taylor QA' },
        publishedBlockIds: ['hero'],
      },
    }).receipt).toMatchObject({
      route: '/services/loans',
      scope: 'block',
      actor: { userId: 'taylor', displayName: 'Taylor QA' },
      publishedBlockIds: ['hero'],
    });
  });
});
