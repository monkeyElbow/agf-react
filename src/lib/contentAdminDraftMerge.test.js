import { describe, expect, it } from 'vitest';
import {
  preserveBlockedDraftContent,
  summarizePageWorkflowActivity,
} from './contentAdminDraftMerge';

const pageState = (blocks) => ({
  pageHierarchy: { '/test': { path: '/test', title: 'Test' } },
  blocksByPath: { '/test': blocks },
  pathAliases: {},
});

describe('content admin draft merge', () => {
  it('keeps blocked local block content while applying shared siblings and order', () => {
    const shared = {
      ...pageState([
        { id: 'intro', kind: 'intro', settings: { heading: 'Shared intro' } },
        { id: 'hero', kind: 'hero', settings: { title: 'Shared hero' } },
      ]),
      collaborationByPath: {},
    };
    const local = {
      ...pageState([
        { id: 'intro', kind: 'intro', settings: { heading: 'Local intro' } },
      ]),
      collaborationByPath: {},
    };

    const merged = preserveBlockedDraftContent(shared, local, [{ pathname: '/test', blockId: 'intro' }]);

    expect(merged.blocksByPath['/test']).toEqual([
      local.blocksByPath['/test'][0],
      shared.blocksByPath['/test'][1],
    ]);
  });

  it('reports ownership only for blocks that differ from published state', () => {
    const current = pageState([
      { id: 'intro', kind: 'intro', settings: { heading: 'Draft' } },
      { id: 'hero', kind: 'hero', settings: { title: 'Same' } },
    ]);
    const published = pageState([
      { id: 'intro', kind: 'intro', settings: { heading: 'Live' } },
      { id: 'hero', kind: 'hero', settings: { title: 'Same' } },
    ]);
    const activity = summarizePageWorkflowActivity(
      {
        '/test': {
          blocks: {
            intro: {
              draftedBy: { userId: 'admin-2', displayName: 'Admin 2' },
              savedBy: { userId: 'admin-2', displayName: 'Admin 2' },
              draftedAt: 2,
              savedAt: 1,
            },
            hero: {
              draftedBy: { userId: 'admin-2', displayName: 'Admin 2' },
              savedBy: { userId: 'admin-2', displayName: 'Admin 2' },
              draftedAt: 2,
              savedAt: 2,
            },
          },
        },
      },
      '/test',
      { userId: 'admin-2', displayName: 'Admin 2' },
      current,
      published,
    );

    expect(activity.currentActorBlockIds).toEqual(['intro']);
    expect(activity.currentActorUnsavedSaveBlockIds).toEqual(['intro']);
    expect(activity.hasOtherActorDraft).toBe(false);
  });

  it('keeps an optimistic moved-block lock saveable even when its content is unchanged', () => {
    const current = pageState([
      { id: 'cta', kind: 'cta_form', settings: { title: 'Same' } },
      { id: 'hero', kind: 'hero', settings: { heading: 'Same' } },
    ]);
    const published = pageState([
      { id: 'hero', kind: 'hero', settings: { heading: 'Same' } },
      { id: 'cta', kind: 'cta_form', settings: { title: 'Same' } },
    ]);

    const activity = summarizePageWorkflowActivity(
      {
        '/test': {
          blocks: {
            cta: {
              draftedBy: null,
              savedBy: null,
              lockedBy: { userId: 'admin-2', displayName: 'Admin 2' },
            },
          },
        },
      },
      '/test',
      { userId: 'admin-2', displayName: 'Admin 2' },
      current,
      published,
    );

    expect(activity.currentActorBlockIds).toEqual(['cta']);
    expect(activity.currentActorUnsavedSaveBlockIds).toEqual(['cta']);
  });
});
