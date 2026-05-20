import { describe, expect, it, vi } from 'vitest';

const mockFetchSharedContentSnapshot = vi.fn();
const mockInitializeSharedContentFromSeed = vi.fn();

vi.mock('../lib/devContentAuthorityClient', () => ({
  acquireSharedBlockLock: vi.fn(),
  fetchSharedContentSnapshot: mockFetchSharedContentSnapshot,
  fetchSharedPageRevisionHistory: vi.fn(),
  initializeSharedContentFromSeed: mockInitializeSharedContentFromSeed,
  isDevContentAuthorityEnabled: () => true,
  publishSharedPage: vi.fn(),
  releaseSharedBlockLock: vi.fn(),
  resetSharedContentFromSeed: vi.fn(),
  restoreSharedBlockRevision: vi.fn(),
  restoreSharedPageRevision: vi.fn(),
  saveSharedPageDraft: vi.fn(),
  syncSharedBlockDraft: vi.fn(),
}));

describe('ContentAdminContext shared bootstrap', () => {
  it('prefers the shared authority snapshot over the local seed on first render', async () => {
    mockFetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: true,
      state: {
        pageHierarchy: {},
        blocksByPath: {
          '/': [
            {
              id: 'hero',
              kind: 'hero',
              mode: 'dynamic',
              settings: {
                line1Text: 'Managed.',
                line2Text: 'First render.',
              },
            },
          ],
        },
        pathAliases: {},
        collaborationByPath: {},
      },
    });

    const { bootstrapSharedContentAdminState } = await import('./ContentAdminContext.jsx');
    const state = await bootstrapSharedContentAdminState();
    const heroBlock = (state?.blocksByPath?.['/'] || []).find((block) => block?.id === 'hero');

    expect(heroBlock?.settings?.line1Text).toBe('Managed.');
    expect(mockInitializeSharedContentFromSeed).not.toHaveBeenCalled();
  });
});
