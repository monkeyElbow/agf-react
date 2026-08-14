import { describe, expect, it, vi } from 'vitest';
import {
  CONTENT_DRAFT_INTENT,
  CONTENT_DRAFT_SCOPE,
  createContentAdminDraftCoordinator,
} from './contentAdminDraftCoordinator';

function createHarness() {
  const request = vi.fn(async () => ({ ok: true }));
  const coordinator = createContentAdminDraftCoordinator({ request });
  return { coordinator, request };
}

describe('content admin draft coordinator', () => {
  it('routes a page draft through the page save contract', async () => {
    const { coordinator, request } = createHarness();
    const state = { blocksByPath: { '/test': [{ id: 'intro' }] } };
    const actor = { userId: 'admin-1' };

    await coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.PAGE,
      state,
      actor,
      summary: 'Save page drafts',
    });

    expect(request).toHaveBeenCalledWith('/save-draft', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ state, actor, summary: 'Save page drafts' }),
    }));
  });

  it('routes a route draft through the route save contract', async () => {
    const { coordinator, request } = createHarness();
    const state = { blocksByPath: { '/test': [{ id: 'intro' }] } };

    await coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.ROUTE,
      pathname: '/test',
      state,
      actor: { userId: 'admin-1' },
    });

    expect(request).toHaveBeenCalledWith('/save-route-draft', expect.objectContaining({
      body: JSON.stringify({
        pathname: '/test',
        state,
        actor: { userId: 'admin-1' },
        summary: '',
      }),
    }));
  });

  it('keeps explicit block save separate from background block sync', async () => {
    const { coordinator, request } = createHarness();
    const block = { id: 'intro', settings: { heading: 'Updated' } };
    const actor = { userId: 'admin-1' };

    await coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.BLOCK,
      intent: CONTENT_DRAFT_INTENT.EXPLICIT,
      pathname: '/test',
      blockId: 'intro',
      block,
      actor,
      summary: 'Save block draft',
    });
    await coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.BLOCK,
      intent: CONTENT_DRAFT_INTENT.SYNC,
      pathname: '/test',
      blockId: 'intro',
      block,
      actor,
      expectedPublishedRevision: 'published-4',
    });

    expect(request.mock.calls[0][0]).toBe('/save-block-draft');
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({
      pathname: '/test',
      blockId: 'intro',
      block,
      actor,
      summary: 'Save block draft',
    });
    expect(request.mock.calls[1][0]).toBe('/blocks/sync-draft');
    expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({
      pathname: '/test',
      blockId: 'intro',
      block,
      actor,
      expectedPublishedRevision: 'published-4',
    });
  });

  it('rejects invalid scope, intent, and targets before making a request', async () => {
    const { coordinator, request } = createHarness();

    await expect(coordinator.saveDraft({ scope: 'unknown' })).resolves.toEqual({
      ok: false,
      error: 'invalid-draft-scope',
    });
    await expect(coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.PAGE,
      intent: CONTENT_DRAFT_INTENT.SYNC,
    })).resolves.toEqual({
      ok: false,
      error: 'invalid-draft-intent-for-scope',
    });
    await expect(coordinator.saveDraft({
      scope: CONTENT_DRAFT_SCOPE.BLOCK,
      blockId: 'intro',
    })).resolves.toEqual({
      ok: false,
      error: 'invalid-block-draft-request',
    });
    expect(request).not.toHaveBeenCalled();
  });
});
