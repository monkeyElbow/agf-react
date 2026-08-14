import { describe, expect, it } from 'vitest';
import { normalizeContentAdminAuthorityState } from './contentAdminStateBoundary';

describe('content admin authority state boundary', () => {
  it('preserves the authority block inventory and order', () => {
    const state = {
      pageHierarchy: {
        '/test': { path: '/test', title: 'Test' },
      },
      blocksByPath: {
        '/test': [
          { id: 'intro-added-second', kind: 'intro', mode: 'dynamic', settings: {} },
          { id: 'hero', kind: 'hero', mode: 'dynamic', settings: {} },
          { id: 'intro-added-first', kind: 'intro', mode: 'dynamic', settings: {} },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    };

    const normalized = normalizeContentAdminAuthorityState(state);

    expect(normalized.blocksByPath['/test'].map((block) => block.id)).toEqual([
      'intro-added-second',
      'hero',
      'intro-added-first',
    ]);
  });

  it('does not restore a missing blueprint block', () => {
    const normalized = normalizeContentAdminAuthorityState({
      pageHierarchy: {
        '/test': { path: '/test', title: 'Test' },
      },
      blocksByPath: {
        '/test': [{ id: 'custom', kind: 'intro', mode: 'dynamic', settings: {} }],
      },
      pathAliases: {},
      collaborationByPath: {},
    });

    expect(normalized.blocksByPath['/test']).toHaveLength(1);
    expect(normalized.blocksByPath['/test'][0].id).toBe('custom');
  });
});
