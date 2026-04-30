import { describe, expect, it } from 'vitest';
import {
  applyBufferedBlockSettingEditsToBlocksByPath,
  getSharedBlockDraftSyncDelay,
  getSharedContentPollDelay,
  getSharedContentPollDelayForActivity,
  mergeSharedAuthoringSnapshot,
  mergeSharedCollaborationSnapshot,
  shouldBufferLocalBlockSetting,
} from './ContentAdminContext';

describe('ContentAdminContext shared freshness helpers', () => {
  it('uses restrained visible vs hidden polling intervals for shared dev freshness', () => {
    expect(getSharedContentPollDelay(false)).toBe(1800);
    expect(getSharedContentPollDelay(true)).toBe(10000);
    expect(getSharedContentPollDelayForActivity(false, true)).toBe(650);
  });

  it('classifies text-like block edits more conservatively than discrete toggle-style changes', () => {
    expect(getSharedBlockDraftSyncDelay('line1Text', 'Typed hero')).toBe(140);
    expect(getSharedBlockDraftSyncDelay('titleSizeRem', 3.8)).toBe(140);
    expect(getSharedBlockDraftSyncDelay('justify', 'left')).toBe(90);
    expect(getSharedBlockDraftSyncDelay('buttonOpenInNewWindow', true)).toBe(90);
  });

  it('buffers text-like shared HUD settings locally before canonical commit while leaving discrete toggles immediate', () => {
    expect(shouldBufferLocalBlockSetting('line1Text', 'Typed hero')).toBe(true);
    expect(shouldBufferLocalBlockSetting('titleSizeRem', 3.8)).toBe(true);
    expect(shouldBufferLocalBlockSetting('justify', 'left')).toBe(false);
    expect(shouldBufferLocalBlockSetting('buttonOpenInNewWindow', true)).toBe(false);
  });

  it('merges buffered block setting edits into the rendered block collection without rewriting untouched blocks', () => {
    const untouchedBlock = {
      id: 'cta_form',
      settings: {
        title: 'Keep this',
      },
    };
    const blocksByPath = {
      '/services/loans': [
        {
          id: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Before',
            titleSizeRem: 4,
          },
        },
        untouchedBlock,
      ],
    };

    const mergedBlocksByPath = applyBufferedBlockSettingEditsToBlocksByPath(blocksByPath, {
      '/services/loans': {
        hero: {
          line1Text: 'Buffered after',
        },
      },
    });

    expect(mergedBlocksByPath['/services/loans'][0].settings.line1Text).toBe('Buffered after');
    expect(mergedBlocksByPath['/services/loans'][1]).toBe(untouchedBlock);
  });

  it('merges refreshed collaboration metadata without overwriting local authoring state', () => {
    const currentState = {
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            settings: {
              line1Text: 'Local draft',
            },
          },
        ],
      },
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              lockedBy: null,
              lockedAt: null,
            },
          },
          history: [],
        },
      },
    };

    const remoteSnapshotState = {
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            settings: {
              line1Text: 'Remote overwrite',
            },
          },
        ],
      },
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              lockedBy: {
                userId: 'dev-sarah',
                displayName: 'Sarah MacBook',
              },
              lockedAt: 1710000000000,
            },
          },
          history: [
            {
              id: 'entry-1',
              action: 'block-locked',
            },
          ],
        },
      },
    };

    const mergedState = mergeSharedCollaborationSnapshot(currentState, remoteSnapshotState);

    expect(mergedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Local draft');
    expect(mergedState.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Sarah MacBook');
    expect(mergedState.collaborationByPath['/services/loans'].history[0].action).toBe('block-locked');
  });

  it('merges one remote authoring path while preserving unchanged block references elsewhere', () => {
    const unchangedCtaBlock = {
      id: 'cta_form',
      settings: {
        title: 'Same CTA',
      },
    };
    const currentState = {
      pageHierarchy: {
        '/services/loans': { path: '/services/loans', title: 'Loans' },
      },
      pathAliases: {},
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            settings: {
              line1Text: 'Old hero',
            },
          },
          unchangedCtaBlock,
        ],
      },
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              lockedBy: null,
            },
          },
          history: [],
        },
      },
    };

    const mergedState = mergeSharedAuthoringSnapshot(currentState, {
      pageHierarchy: {
        '/services/loans': { path: '/services/loans', title: 'Loans' },
      },
      pathAliases: {},
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            settings: {
              line1Text: 'New hero',
            },
          },
          {
            id: 'cta_form',
            settings: {
              title: 'Same CTA',
            },
          },
        ],
      },
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              lockedBy: {
                userId: 'dev-sarah',
                displayName: 'Sarah MacBook',
              },
            },
          },
          history: [],
        },
      },
    }, {
      authoringPaths: ['/services/loans'],
      collaborationPaths: ['/services/loans'],
    });

    expect(mergedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('New hero');
    expect(mergedState.blocksByPath['/services/loans'][1]).toBe(unchangedCtaBlock);
    expect(mergedState.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Sarah MacBook');
  });
});
