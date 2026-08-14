import { describe, expect, it, vi } from 'vitest';
import {
  buildFastInitialContentAdminState,
  hasContentAdminSnapshotStateContent,
  parseInitialContentAdminBootstrapState,
} from './contentAdminBootstrapState';

describe('content admin bootstrap state', () => {
  it('builds a fast hierarchy and aliases without block content', () => {
    const result = buildFastInitialContentAdminState({
      sitePages: [
        { path: '/', title: 'Home' },
        { path: '/services', title: 'Services', linkRefAliases: ['/what-we-do'] },
        { path: '/services/loans', title: 'Loans' },
      ],
      defaultPathAliases: { '/old-home': '/' },
    });

    expect(result.pageHierarchy['/services/loans'].parentPath).toBe('/services');
    expect(result.pathAliases).toEqual({
      '/old-home': '/',
      '/what-we-do': '/services',
    });
    expect(result.blocksByPath).toEqual({});
    expect(result.collaborationByPath).toEqual({});
  });

  it('recognizes only snapshots with authoring content', () => {
    expect(hasContentAdminSnapshotStateContent(null)).toBe(false);
    expect(hasContentAdminSnapshotStateContent({ initialized: true })).toBe(false);
    expect(hasContentAdminSnapshotStateContent({ state: { pageHierarchy: { '/': {} } } })).toBe(true);
    expect(hasContentAdminSnapshotStateContent({ payload: { state: { blocksByPath: { '/': [] } } } })).toBe(true);
  });

  it('normalizes bootstrap authoring and published states independently', () => {
    const normalizeAuthorityState = vi.fn((state) => ({ normalized: state.value }));
    const result = parseInitialContentAdminBootstrapState({
      initialState: {
        value: 'initial',
        __contentAdminBootstrap: {
          authoringState: { value: 'draft' },
          publishedState: { value: 'live' },
          updatedAt: '42',
          seedBaseline: { value: 'seed' },
          publishedRevisionsByPath: { '/': 'r7' },
        },
      },
      normalizeAuthorityState,
    });

    expect(result).toEqual({
      authoringState: { normalized: 'draft' },
      publishedState: { normalized: 'live' },
      updatedAt: 42,
      seedBaseline: { value: 'seed' },
      publishedRevisionsByPath: { '/': 'r7' },
    });
    expect(normalizeAuthorityState).toHaveBeenCalledTimes(2);
  });

  it('uses normalized local state when no shared bootstrap exists', () => {
    const normalizeStoredConfig = vi.fn((state) => ({ normalized: state || 'seed' }));
    const readInitialState = vi.fn(() => ({ normalized: 'local' }));

    expect(parseInitialContentAdminBootstrapState({
      initialState: { value: 'stored' },
      normalizeStoredConfig,
      readInitialState,
      normalizeAuthorityState: (state) => state,
    }).authoringState).toEqual({ normalized: { value: 'stored' } });
    expect(parseInitialContentAdminBootstrapState({
      normalizeStoredConfig,
      readInitialState,
      normalizeAuthorityState: (state) => state,
    }).authoringState).toEqual({ normalized: 'local' });
    expect(readInitialState).toHaveBeenCalledTimes(1);
  });
});
