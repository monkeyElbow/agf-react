import { describe, expect, it } from 'vitest';
import {
  collectDirtyAuthoringPaths,
  compareAuthoringPageSnapshot,
  summarizeAuthoringPageChanges,
} from './contentAdminPageComparison';

function state(blocks, page = {}) {
  return {
    pageHierarchy: { '/test': { path: '/test', title: 'Test', ...page } },
    blocksByPath: { '/test': blocks },
    pathAliases: {},
  };
}

describe('content admin page comparison', () => {
  it('treats block order and content as separate, explicit changes', () => {
    const persisted = state([
      { id: 'hero', kind: 'hero', settings: { title: 'Alpha' } },
      { id: 'intro', kind: 'intro', settings: { heading: 'Bravo' } },
    ]);
    const reordered = state([
      persisted.blocksByPath['/test'][1],
      persisted.blocksByPath['/test'][0],
    ]);

    expect(compareAuthoringPageSnapshot(reordered, persisted, '/test')).toBe(false);
    expect(summarizeAuthoringPageChanges(reordered, persisted, '/test')).toMatchObject({
      changedBlockIds: [],
      orderChangedBlockIds: ['intro', 'hero'],
      hasOrderChanges: true,
      hasUnsavedChanges: true,
    });
  });

  it('finds content changes without inventing blocks or changing unrelated paths', () => {
    const persisted = state([
      { id: 'intro', kind: 'intro', settings: { heading: 'Alpha' } },
    ]);
    const current = state([
      { id: 'intro', kind: 'intro', settings: { heading: 'Bravo' } },
    ]);
    const currentWithOtherPath = {
      ...current,
      blocksByPath: {
        ...current.blocksByPath,
        '/other': [{ id: 'other', kind: 'intro', settings: { heading: 'Other' } }],
      },
    };

    expect(summarizeAuthoringPageChanges(current, persisted, '/test')).toMatchObject({
      changedBlockIds: ['intro'],
      hasOrderChanges: false,
      hasUnsavedChanges: true,
    });
    expect(collectDirtyAuthoringPaths(currentWithOtherPath, persisted)).toEqual(['/test', '/other']);
  });

  it('does not call unchanged blocks moved by an insertion order changes', () => {
    const persisted = state([
      { id: 'hero', kind: 'hero', settings: { title: 'Alpha' } },
      { id: 'intro', kind: 'intro', settings: { heading: 'Bravo' } },
    ]);
    const current = state([
      { id: 'new-block', kind: 'content', settings: { body: 'New' } },
      ...persisted.blocksByPath['/test'],
    ]);

    expect(summarizeAuthoringPageChanges(current, persisted, '/test')).toMatchObject({
      changedBlockIds: ['new-block'],
      orderChangedBlockIds: [],
      hasOrderChanges: true,
    });
  });
});
