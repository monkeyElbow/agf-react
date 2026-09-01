import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEV_IDENTITY_STORAGE_KEY } from '../lib/devIdentity';
import { ContentAdminProvider, bootstrapSharedContentAdminState, useContentAdmin } from './ContentAdminContext.jsx';

const authorityMocks = vi.hoisted(() => ({
  acquireSharedBlockLock: vi.fn(),
  fetchSharedContentBackups: vi.fn(),
  fetchSharedContentSnapshot: vi.fn(),
  fetchSharedContentRouteSnapshot: vi.fn(),
  fetchSharedPageRevisionHistory: vi.fn(),
  fetchSharedPublishStatus: vi.fn(),
  initializeSharedContentFromSeed: vi.fn(),
  publishSharedPage: vi.fn(),
  promoteSharedContentToSeed: vi.fn(),
  releaseSharedBlockLock: vi.fn(),
  resetSharedContentFromSeed: vi.fn(),
  restoreLatestSharedContentBackup: vi.fn(),
  restoreSharedBlockRevision: vi.fn(),
  restoreSharedContentBackup: vi.fn(),
  restoreSharedPageRevision: vi.fn(),
  saveSharedPageDraft: vi.fn(),
  saveSharedBlockDraft: vi.fn(),
  saveSharedRouteDraft: vi.fn(),
  syncSharedBlockDraft: vi.fn(),
}));

vi.mock('../lib/devContentAuthorityClient', () => ({
  ...authorityMocks,
  isDevContentAuthorityEnabled: () => true,
}));

const PAGE_PATH = '/services/loans';
const CURRENT_ACTOR = {
  userId: 'dev-operator',
  displayName: 'Operator QA',
  initials: 'OQ',
  accentColor: '#00adbb',
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
};
const OTHER_ACTOR = {
  userId: 'dev-other',
  displayName: 'Other Editor',
  initials: 'OE',
  accentColor: '#faa31a',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildState({
  heroText = 'Original hero',
  collaborationByPath = {},
  extraBlocks = [],
} = {}) {
  return {
    pageHierarchy: {
      [PAGE_PATH]: {
        path: PAGE_PATH,
        title: 'Loans',
        breadcrumbLabel: 'Loans',
        parentPath: '/services',
      },
      '/services': {
        path: '/services',
        title: 'Services',
        breadcrumbLabel: 'Services',
        parentPath: '/',
      },
      '/': {
        path: '/',
        title: 'Home',
        breadcrumbLabel: 'Home',
        parentPath: null,
      },
    },
    blocksByPath: {
      [PAGE_PATH]: [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          name: 'Hero',
          settings: {
            line1Text: heroText,
            line2Text: '',
            line3Text: '',
            bgTone: 'white',
            justify: 'left',
          },
          editableFields: [],
        },
        ...extraBlocks.map((block) => clone(block)),
      ],
    },
    pathAliases: {},
    collaborationByPath,
  };
}

function buildBootstrapState(authoringState, publishedState = authoringState, updatedAt = 1710000000000) {
  return {
    ...clone(authoringState),
    __contentAdminBootstrap: {
      authoringState: clone(authoringState),
      publishedState: clone(publishedState),
      updatedAt,
      seedBaseline: null,
    },
  };
}

function OperatorProbe() {
  const admin = useContentAdmin();
  const [result, setResult] = useState('');
  const heroBlock = admin.authoringBlocksByPath?.[PAGE_PATH]?.find((block) => block?.id === 'hero') || {};
  const billboardBlock = admin.authoringBlocksByPath?.[PAGE_PATH]?.find((block) => block?.id === 'billboard') || {};
  const publishedHeroBlock = admin.publishedBlocksByPath?.[PAGE_PATH]?.find((block) => block?.id === 'hero') || {};
  const blockIds = (admin.authoringBlocksByPath?.[PAGE_PATH] || []).map((block) => block?.id).filter(Boolean).join(',');
  const heroText = heroBlock?.settings?.line1Text || '';
  const billboardTitle = billboardBlock?.settings?.title || '';
  const billboardCatalogMetadata = ['templateLookupId', 'createTemplateId', 'isReusableTemplate', 'isAddBlockDefault', 'excludeFromInsertCatalog']
    .filter((key) => Object.prototype.hasOwnProperty.call(billboardBlock, key))
    .join(',');
  const collaboration = admin.getBlockCollaboration(PAGE_PATH, 'hero');
  const changeSummary = admin.getPageChangeSummary(PAGE_PATH);
  const publishSummary = admin.getPagePublishSummary(PAGE_PATH);
  const workflowActivity = admin.getPageWorkflowActivity(PAGE_PATH);

  return (
    <div>
      <output data-testid="hero-text">{heroText}</output>
      <output data-testid="billboard-title">{billboardTitle}</output>
      <output data-testid="billboard-catalog-metadata">{billboardCatalogMetadata}</output>
      <output data-testid="block-ids">{blockIds}</output>
      <output data-testid="published-hero-text">{publishedHeroBlock?.settings?.line1Text || ''}</output>
      <output data-testid="dirty">{String(admin.isPageDirty(PAGE_PATH))}</output>
      <output data-testid="save-result">{admin.lastSharedSaveResult?.error || String(admin.lastSharedSaveResult?.didSave || '')}</output>
      <output data-testid="publish-result">{admin.lastSharedPublishResult?.error || String(admin.lastSharedPublishResult?.didPublish || '')}</output>
      <output data-testid="shared-publish-status">{admin.sharedPublishStatus || ''}</output>
      <output data-testid="change-count">{String(changeSummary.changedBlockCount)}</output>
      <output data-testid="publish-count">{String(publishSummary.changedBlockCount)}</output>
      <output data-testid="workflow-current">{String(workflowActivity.currentActorBlockCount)}</output>
      <output data-testid="workflow-other">{String(workflowActivity.otherActorBlockCount)}</output>
      <output data-testid="lock-owner">{collaboration.lockedBy?.displayName || ''}</output>
      <output data-testid="draft-owner">{collaboration.draftedBy?.displayName || ''}</output>
      <output data-testid="saved-owner">{collaboration.savedBy?.displayName || ''}</output>
      <output data-testid="action-result">{result}</output>
      <button
        type="button"
        onClick={() => {
          admin.updateBlock(PAGE_PATH, 'hero', {
            settings: {
              ...heroBlock.settings,
              line1Text: 'Edited hero',
            },
          });
        }}
      >
        Edit hero
      </button>
      <button
        type="button"
        onClick={() => {
          const template = admin.availableBlockTemplates.find((candidate) => candidate?.templateLookupId === 'billboard')
            || admin.availableBlockTemplates.find((candidate) => candidate?.kind === 'billboard');
          admin.addBlock(PAGE_PATH, template?.createTemplateId || template?.templateId || template?.id, 1);
        }}
      >
        Add billboard
      </button>
      <button
        type="button"
        onClick={() => {
          if (!billboardBlock?.id) {
            return;
          }
          admin.updateBlock(PAGE_PATH, 'billboard', {
            settings: {
              ...billboardBlock.settings,
              title: 'Edited billboard',
            },
          });
        }}
      >
        Edit billboard
      </button>
      <button
        type="button"
        onClick={() => {
          if (!billboardBlock?.id) {
            return;
          }
          admin.removeBlock(PAGE_PATH, billboardBlock.id);
        }}
      >
        Remove billboard
      </button>
      <button
        type="button"
        onClick={() => {
          if (!billboardBlock?.id) {
            return;
          }
          admin.moveBlock(PAGE_PATH, billboardBlock.id, 'up');
        }}
      >
        Move billboard up
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.saveSharedDraftNow('Operator smoke save');
          setResult(nextResult?.ok ? 'draft-saved' : nextResult?.reason);
        }}
      >
        Save draft
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.publishSharedPageNow(PAGE_PATH, 'Operator smoke publish');
          setResult(nextResult?.ok ? 'published' : nextResult?.reason);
        }}
      >
        Publish page
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.restorePageRevision(PAGE_PATH, 'rev-page');
          setResult(nextResult?.ok ? 'page-restored' : nextResult?.reason);
        }}
      >
        Restore page
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.restoreBlockRevision(PAGE_PATH, 'rev-block', 'hero');
          setResult(nextResult?.ok ? 'block-restored' : nextResult?.reason);
        }}
      >
        Restore block
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.restoreLatestSharedContentBackup();
          setResult(nextResult?.ok ? 'backup-restored' : nextResult?.reason);
        }}
      >
        Restore backup
      </button>
      <button
        type="button"
        onClick={() => {
          const nextResult = admin.setActiveBlockLock(PAGE_PATH, 'hero');
          setResult(nextResult?.ok ? 'lock-acquired' : nextResult?.reason);
        }}
      >
        Lock hero
      </button>
      <button
        type="button"
        onClick={() => {
          const nextResult = admin.setActiveBlockLock(PAGE_PATH, 'billboard');
          setResult(nextResult?.ok ? 'billboard-lock-acquired' : nextResult?.reason);
        }}
      >
        Lock billboard
      </button>
      <button
        type="button"
        onClick={() => {
          const nextResult = admin.setActiveBlockLock(PAGE_PATH, 'hero', { force: true });
          setResult(nextResult?.ok ? 'lock-taken' : nextResult?.reason);
        }}
      >
        Take lock
      </button>
    </div>
  );
}

function BufferedBlockSaveProbe() {
  const admin = useContentAdmin();
  const [result, setResult] = useState('');
  const collaboration = admin.getBlockCollaboration(PAGE_PATH, 'hero');

  return (
    <div>
      <button
        type="button"
        onClick={() => admin.updateBlockSetting(PAGE_PATH, 'hero', 'line1Text', 'Buffered hero')}
      >
        Change buffered hero setting
      </button>
      <button
        type="button"
        onClick={async () => {
          const nextResult = await admin.saveSharedBlockDraftNow(PAGE_PATH, 'hero', 'Buffered block save');
          setResult(nextResult?.ok ? 'saved' : nextResult?.reason || 'failed');
        }}
      >
        Save buffered hero block
      </button>
      <output data-testid="buffered-save-result">{result}</output>
      <output data-testid="buffered-saved-owner">{collaboration.savedBy?.displayName || ''}</output>
    </div>
  );
}

function renderOperatorProvider(initialState, publishedState = initialState) {
  return render(
    <ContentAdminProvider initialState={buildBootstrapState(initialState, publishedState)}>
      <OperatorProbe />
    </ContentAdminProvider>,
  );
}

describe('ContentAdminContext operator smoke and recovery', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.values(authorityMocks).forEach((mock) => mock.mockReset());
    window.localStorage.clear();
    window.localStorage.setItem(DEV_IDENTITY_STORAGE_KEY, JSON.stringify(CURRENT_ACTOR));

    const initialState = buildState();
    authorityMocks.fetchSharedContentSnapshot.mockResolvedValue({
      initialized: true,
      state: clone(initialState),
      baseSnapshot: clone(initialState),
      updatedAt: 1710000000000,
    });
    authorityMocks.fetchSharedContentRouteSnapshot.mockResolvedValue({
      initialized: true,
      state: clone(initialState),
      baseSnapshot: clone(initialState),
      updatedAt: 1710000000000,
    });
    authorityMocks.initializeSharedContentFromSeed.mockImplementation((seedState) => Promise.resolve({
      initialized: true,
      state: clone(seedState),
      baseSnapshot: clone(seedState),
      updatedAt: 1710000000000,
    }));
    authorityMocks.saveSharedPageDraft.mockImplementation((nextState) => Promise.resolve({
      ok: true,
      state: clone(nextState),
      baseSnapshot: clone(initialState),
      updatedAt: 1710000001000,
      saveResult: {
        didSave: true,
        savedPaths: [PAGE_PATH],
        savedBlockIdsByPath: {
          [PAGE_PATH]: ['hero'],
        },
      },
    }));
    authorityMocks.publishSharedPage.mockImplementation((_pathname, _actor, _summary, options = {}) => Promise.resolve({
      ok: true,
      operationId: options.operationId,
      pathname: PAGE_PATH,
      scope: 'page',
      state: clone(initialState),
      baseSnapshot: clone(initialState),
      updatedAt: 1710000002000,
      publishResult: {
        didPublish: true,
        publishedPaths: [PAGE_PATH],
        publishedBlockIdsByPath: {
          [PAGE_PATH]: ['hero'],
        },
      },
    }));
    authorityMocks.restoreSharedPageRevision.mockResolvedValue({
      ok: true,
      state: buildState({ heroText: 'Page revision hero' }),
      baseSnapshot: buildState({ heroText: 'Page revision hero' }),
      updatedAt: 1710000003000,
    });
    authorityMocks.restoreSharedBlockRevision.mockResolvedValue({
      ok: true,
      state: buildState({ heroText: 'Block revision hero' }),
      baseSnapshot: buildState({ heroText: 'Block revision hero' }),
      updatedAt: 1710000004000,
    });
    authorityMocks.restoreLatestSharedContentBackup.mockResolvedValue({
      ok: true,
      state: buildState({ heroText: 'Backup hero' }),
      baseSnapshot: buildState({ heroText: 'Backup hero' }),
      restoredBackup: {
        fileName: 'content-admin-shared-20260720-120000.json',
      },
      updatedAt: 1710000005000,
    });
    authorityMocks.saveSharedRouteDraft.mockRejectedValue(new Error('No "saveSharedRouteDraft" export'));
    authorityMocks.acquireSharedBlockLock.mockImplementation((pathname, blockId, actor, options = {}) => Promise.resolve({
      ok: true,
      state: buildState({
        collaborationByPath: {
          [pathname]: {
            blocks: {
              [blockId]: {
                lockedBy: actor,
                lockedAt: 1710000006000,
                draftedBy: options.force ? actor : null,
                draftedAt: options.force ? 1710000006000 : null,
              },
            },
            history: [],
          },
        },
      }),
      baseSnapshot: buildState({ heroText: 'Published hero' }),
      updatedAt: 1710000006000,
    }));
    authorityMocks.releaseSharedBlockLock.mockResolvedValue({
      ok: true,
      state: clone(initialState),
      updatedAt: 1710000007000,
    });
    authorityMocks.syncSharedBlockDraft.mockImplementation((pathname, blockId, block, actor) => Promise.resolve({
      ok: true,
      state: buildState({
        heroText: block?.settings?.line1Text || 'Synced hero',
        collaborationByPath: {
          [pathname]: {
            blocks: {
              [blockId]: {
                draftedBy: actor,
                draftedAt: 1710000008000,
              },
            },
            history: [],
          },
        },
      }),
      updatedAt: 1710000008000,
    }));
  });

  it('edits a block, saves the draft, publishes the page, and rehydrates from shared authority', async () => {
    let lastSavedState = null;
    authorityMocks.saveSharedPageDraft.mockImplementation((nextState, _actor, summary) => {
      lastSavedState = clone(nextState);
      return Promise.resolve({
        ok: true,
        state: clone(nextState),
        baseSnapshot: buildState(),
        updatedAt: 1710000010000,
        saveResult: {
          didSave: true,
          savedPaths: [PAGE_PATH],
          savedBlockIdsByPath: {
            [PAGE_PATH]: ['hero'],
          },
          summary,
        },
      });
    });
    authorityMocks.publishSharedPage.mockImplementation((_pathname, _actor, summary, options = {}) => Promise.resolve({
      ok: true,
      operationId: options.operationId,
      pathname: PAGE_PATH,
      scope: 'page',
      state: clone(lastSavedState),
      baseSnapshot: clone(lastSavedState),
      updatedAt: 1710000011000,
      publishResult: {
        didPublish: true,
        publishedPaths: [PAGE_PATH],
        publishedBlockIdsByPath: {
          [PAGE_PATH]: ['hero'],
        },
        summary,
      },
    }));

    renderOperatorProvider(buildState());

    expect(screen.getByTestId('hero-text').textContent).toBe('Original hero');

    fireEvent.click(screen.getByRole('button', { name: 'Edit hero' }));

    expect(screen.getByTestId('hero-text').textContent).toBe('Edited hero');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    expect(screen.getByTestId('change-count').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(authorityMocks.saveSharedPageDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          blocksByPath: expect.objectContaining({
            [PAGE_PATH]: expect.arrayContaining([
              expect.objectContaining({
                id: 'hero',
                settings: expect.objectContaining({
                  line1Text: 'Edited hero',
                }),
              }),
            ]),
          }),
        }),
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
        'Operator smoke save',
      );
    });
    expect(screen.getByTestId('action-result').textContent).toBe('draft-saved');
    expect(screen.getByTestId('save-result').textContent).toBe('true');
    expect(screen.getByTestId('dirty').textContent).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Publish page' }));

    await waitFor(() => {
      expect(authorityMocks.publishSharedPage).toHaveBeenCalledWith(
        PAGE_PATH,
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
        'Operator smoke publish',
        expect.objectContaining({ operationId: expect.any(String) }),
      );
    });
    expect(screen.getByTestId('action-result').textContent).toBe('published');
    expect(screen.getByTestId('publish-result').textContent).toBe('true');
    expect(screen.getByTestId('publish-count').textContent).toBe('0');

    authorityMocks.fetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: true,
      state: clone(lastSavedState),
      baseSnapshot: clone(lastSavedState),
      updatedAt: 1710000012000,
    });

    const rehydratedState = await bootstrapSharedContentAdminState();
    const rehydratedHero = rehydratedState.blocksByPath[PAGE_PATH].find((block) => block.id === 'hero');
    expect(rehydratedHero.settings.line1Text).toBe('Edited hero');
  }, 15000);

  it('reconciles authoritative ownership metadata after a block save failure without losing local content', async () => {
    const authoritativeState = buildState({
      collaborationByPath: {
        [PAGE_PATH]: {
          blocks: {
            hero: {
              savedBy: OTHER_ACTOR,
              savedAt: 1710000015000,
            },
          },
          history: [],
        },
      },
    });
    authorityMocks.saveSharedBlockDraft.mockRejectedValue(new Error('Request timed out'));
    authorityMocks.fetchSharedContentRouteSnapshot.mockResolvedValue({
      initialized: true,
      state: clone(authoritativeState),
      baseSnapshot: clone(authoritativeState),
      updatedAt: 1710000015000,
    });

    render(
      <ContentAdminProvider initialState={buildBootstrapState(buildState())}>
        <BufferedBlockSaveProbe />
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change buffered hero setting' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save buffered hero block' }));

    await waitFor(() => {
      expect(authorityMocks.saveSharedBlockDraft).toHaveBeenCalled();
      expect(authorityMocks.fetchSharedContentRouteSnapshot).toHaveBeenCalledWith(PAGE_PATH);
      expect(screen.getByTestId('buffered-save-result').textContent).toBe('block-save-failed');
      expect(screen.getByTestId('buffered-saved-owner').textContent).toBe(OTHER_ACTOR.displayName);
    });
  });

  it('flushes the latest buffered setting before a block draft save', async () => {
    authorityMocks.saveSharedBlockDraft.mockImplementation((pathname, blockId, block, actor, summary) => Promise.resolve({
      ok: true,
      state: buildState({ heroText: block?.settings?.line1Text || 'Saved hero' }),
      baseSnapshot: buildState(),
      updatedAt: 1710000010200,
      saveResult: {
        didSave: true,
        changedPaths: [pathname],
        savedPaths: [pathname],
        savedBlockIdsByPath: { [pathname]: [blockId] },
        summary,
        actor,
      },
    }));

    render(
      <ContentAdminProvider initialState={buildBootstrapState(buildState())}>
        <BufferedBlockSaveProbe />
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change buffered hero setting' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save buffered hero block' }));

    await waitFor(() => {
      expect(authorityMocks.saveSharedBlockDraft).toHaveBeenCalledWith(
        PAGE_PATH,
        'hero',
        expect.objectContaining({
          settings: expect.objectContaining({ line1Text: 'Buffered hero' }),
        }),
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
        'Buffered block save',
      );
    });
    expect(screen.getByTestId('buffered-save-result').textContent).toBe('saved');
  });

  it('persists newly added blocks through route draft saves instead of lock-only syncs', async () => {
    authorityMocks.saveSharedRouteDraft.mockImplementation((pathname, routeState, _actor, summary) => Promise.resolve({
      ok: true,
      state: {
        ...buildState(),
        pageHierarchy: {
          ...buildState().pageHierarchy,
          ...(routeState.pageHierarchy || {}),
        },
        blocksByPath: {
          ...buildState().blocksByPath,
          ...(routeState.blocksByPath || {}),
        },
        collaborationByPath: {
          ...(routeState.collaborationByPath || {}),
        },
        pathAliases: routeState.pathAliases || {},
      },
      baseSnapshot: buildState({ heroText: 'Published hero' }),
      updatedAt: 1710000010500,
      saveResult: {
        didSave: true,
        savedPaths: [pathname],
        savedBlockIdsByPath: {
          [pathname]: ['billboard'],
        },
        summary,
      },
    }));

    renderOperatorProvider(buildState());

    fireEvent.click(screen.getByRole('button', { name: 'Add billboard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add billboard' }));

    expect(screen.getByTestId('block-ids').textContent).toContain('billboard');
    expect(screen.getByTestId('block-ids').textContent).toContain('billboard_2');
    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(2);
    });
    const lastRouteState = authorityMocks.saveSharedRouteDraft.mock.calls.at(-1)?.[1] || {};
    expect(lastRouteState.blocksByPath?.[PAGE_PATH]?.map((block) => block.id)).toEqual(
      expect.arrayContaining(['hero', 'billboard', 'billboard_2']),
    );
    expect(lastRouteState.blocksByPath?.[PAGE_PATH]).toHaveLength(3);
    expect(authorityMocks.acquireSharedBlockLock).not.toHaveBeenCalled();
    expect(authorityMocks.syncSharedBlockDraft).not.toHaveBeenCalled();
    expect(screen.getByTestId('block-ids').textContent).toContain('billboard');
    expect(screen.getByTestId('block-ids').textContent).toContain('billboard_2');
  });

  it('persists block reordering through the route draft save path', async () => {
    authorityMocks.saveSharedRouteDraft.mockImplementation((pathname, routeState, _actor, summary) => Promise.resolve({
      ok: true,
      state: {
        ...buildState(),
        blocksByPath: {
          ...buildState().blocksByPath,
          ...(routeState.blocksByPath || {}),
        },
        collaborationByPath: routeState.collaborationByPath || {},
        pathAliases: routeState.pathAliases || {},
      },
      baseSnapshot: buildState(),
      updatedAt: 1710000010550,
      saveResult: {
        didSave: true,
        savedPaths: [pathname],
        savedBlockIdsByPath: { [pathname]: ['billboard'] },
        summary,
      },
    }));

    renderOperatorProvider(buildState());
    fireEvent.click(screen.getByRole('button', { name: 'Add billboard' }));
    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Move billboard up' }));
    await waitFor(() => {
      expect(screen.getByTestId('block-ids').textContent).toBe('billboard,hero');
    });
    expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(2);
    });
    const lastRouteState = authorityMocks.saveSharedRouteDraft.mock.calls.at(-1)?.[1] || {};
    expect(lastRouteState.blocksByPath?.[PAGE_PATH]?.map((block) => block.id)).toEqual(['billboard', 'hero']);
  });

  it('keeps newly added route drafts publishable when draft save omits a live base snapshot', async () => {
    authorityMocks.saveSharedRouteDraft.mockImplementation((pathname, routeState, _actor, summary) => Promise.resolve({
      ok: true,
      state: {
        ...buildState(),
        pageHierarchy: {
          ...buildState().pageHierarchy,
          ...(routeState.pageHierarchy || {}),
        },
        blocksByPath: {
          ...buildState().blocksByPath,
          ...(routeState.blocksByPath || {}),
        },
        collaborationByPath: {
          ...(routeState.collaborationByPath || {}),
        },
        pathAliases: routeState.pathAliases || {},
      },
      updatedAt: 1710000010600,
      saveResult: {
        didSave: true,
        savedPaths: [pathname],
        savedBlockIdsByPath: {
          [pathname]: ['billboard'],
        },
        summary,
      },
    }));

    renderOperatorProvider(buildState());

    fireEvent.click(screen.getByRole('button', { name: 'Add billboard' }));

    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('dirty').textContent).toBe('false');
    expect(screen.getByTestId('publish-count').textContent).toBe('1');
  });

  it('persists removed blocks through route draft saves before later publish work', async () => {
    const billboardBlock = {
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      name: 'Billboard',
      settings: { title: 'Remove me' },
      editableFields: [],
    };
    const initialState = buildState({ extraBlocks: [billboardBlock] });
    authorityMocks.saveSharedRouteDraft.mockImplementation((pathname, routeState, _actor, summary) => Promise.resolve({
      ok: true,
      state: {
        ...initialState,
        pageHierarchy: {
          ...initialState.pageHierarchy,
          ...(routeState.pageHierarchy || {}),
        },
        blocksByPath: {
          ...initialState.blocksByPath,
          ...(routeState.blocksByPath || {}),
        },
        collaborationByPath: {
          ...(routeState.collaborationByPath || {}),
        },
        pathAliases: routeState.pathAliases || {},
      },
      baseSnapshot: clone(initialState),
      updatedAt: 1710000010650,
      saveResult: {
        didSave: true,
        savedPaths: [pathname],
        savedBlockIdsByPath: {
          [pathname]: ['billboard'],
        },
        summary,
      },
    }));

    renderOperatorProvider(initialState);

    expect(screen.getByTestId('block-ids').textContent).toBe('hero,billboard');
    fireEvent.click(screen.getByRole('button', { name: 'Remove billboard' }));

    expect(screen.getByTestId('block-ids').textContent).toBe('hero');
    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(1);
    });
    const routeState = authorityMocks.saveSharedRouteDraft.mock.calls[0]?.[1] || {};
    expect(authorityMocks.saveSharedRouteDraft.mock.calls[0]?.[3]).toBe('Remove block from page draft');
    expect(routeState.blocksByPath?.[PAGE_PATH]?.map((block) => block.id)).toEqual(['hero']);
  });

  it('waits for a queued block removal route save before publishing the page', async () => {
    const billboardBlock = {
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      name: 'Billboard',
      settings: { title: 'Remove me' },
      editableFields: [],
    };
    const initialState = buildState({ extraBlocks: [billboardBlock] });
    let resolveRouteSave;
    let queuedRouteState = null;
    const pendingRouteSave = new Promise((resolve) => {
      resolveRouteSave = resolve;
    });
    authorityMocks.saveSharedRouteDraft.mockImplementation((_pathname, routeState) => {
      queuedRouteState = clone(routeState);
      return pendingRouteSave;
    });

    renderOperatorProvider(initialState);

    fireEvent.click(screen.getByRole('button', { name: 'Remove billboard' }));
    await waitFor(() => {
      expect(authorityMocks.saveSharedRouteDraft).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish page' }));
    expect(authorityMocks.publishSharedPage).not.toHaveBeenCalled();

    await act(async () => {
      resolveRouteSave({
        ok: true,
        state: {
          ...initialState,
          pageHierarchy: {
            ...initialState.pageHierarchy,
            ...(queuedRouteState?.pageHierarchy || {}),
          },
          blocksByPath: {
            ...initialState.blocksByPath,
            ...(queuedRouteState?.blocksByPath || {}),
          },
          collaborationByPath: {
            ...(queuedRouteState?.collaborationByPath || {}),
          },
          pathAliases: queuedRouteState?.pathAliases || {},
        },
        baseSnapshot: clone(initialState),
        updatedAt: 1710000010660,
        saveResult: {
          didSave: true,
          savedPaths: [PAGE_PATH],
          savedBlockIdsByPath: {
            [PAGE_PATH]: ['billboard'],
          },
        },
      });
    });

    await waitFor(() => {
      expect(authorityMocks.publishSharedPage).toHaveBeenCalledTimes(1);
    });
    expect(authorityMocks.saveSharedRouteDraft.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps a newly added billboard in place when a stale lock snapshot arrives during edit', async () => {
    const trailingBlock = {
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      name: 'CTA Form',
      settings: { title: 'Next block' },
      editableFields: [],
    };
    const initialState = buildState({ extraBlocks: [trailingBlock] });
    let resolveRouteSave;
    const pendingRouteSave = new Promise((resolve) => {
      resolveRouteSave = resolve;
    });
    authorityMocks.saveSharedRouteDraft.mockReturnValue(pendingRouteSave);
    authorityMocks.acquireSharedBlockLock.mockImplementation((pathname, blockId, actor) => Promise.resolve({
      ok: true,
      state: buildState({
        collaborationByPath: {
          [pathname]: {
            blocks: {
              [blockId]: {
                lockedBy: actor,
                lockedAt: 1710000010700,
              },
            },
            history: [],
          },
        },
      }),
      baseSnapshot: clone(initialState),
      updatedAt: 1710000010700,
    }));

    renderOperatorProvider(initialState);

    fireEvent.click(screen.getByRole('button', { name: 'Add billboard' }));
    expect(screen.getByTestId('block-ids').textContent).toBe('hero,billboard,cta_form');
    expect(screen.getByTestId('billboard-catalog-metadata').textContent).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Edit billboard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock billboard' }));

    await waitFor(() => {
      expect(authorityMocks.acquireSharedBlockLock).toHaveBeenCalledWith(
        PAGE_PATH,
        'billboard',
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
        { force: false },
      );
    });
    expect(screen.getByTestId('block-ids').textContent).toBe('hero,billboard,cta_form');
    expect(screen.getByTestId('billboard-title').textContent).toBe('Edited billboard');

    await act(async () => {
      resolveRouteSave({
        ok: true,
        state: clone(initialState),
        baseSnapshot: clone(initialState),
        updatedAt: 1710000010800,
        saveResult: {
          didSave: true,
          savedPaths: [PAGE_PATH],
          savedBlockIdsByPath: {
            [PAGE_PATH]: ['billboard'],
          },
        },
      });
    });
  });

  it('restores page revisions, selected block revisions, and the latest backup into authoring state', async () => {
    renderOperatorProvider(buildState());

    fireEvent.click(screen.getByRole('button', { name: 'Restore page' }));
    await waitFor(() => {
      expect(authorityMocks.restoreSharedPageRevision).toHaveBeenCalledWith(
        PAGE_PATH,
        'rev-page',
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('page-restored');
      expect(screen.getByTestId('hero-text').textContent).toBe('Page revision hero');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Restore block' }));
    await waitFor(() => {
      expect(authorityMocks.restoreSharedBlockRevision).toHaveBeenCalledWith(
        PAGE_PATH,
        'rev-block',
        'hero',
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('block-restored');
      expect(screen.getByTestId('hero-text').textContent).toBe('Block revision hero');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));
    await waitFor(() => {
      expect(authorityMocks.restoreLatestSharedContentBackup).toHaveBeenCalledWith(
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('backup-restored');
      expect(screen.getByTestId('hero-text').textContent).toBe('Backup hero');
    });
  }, 15000);

  it('blocks passive foreign edits, allows explicit takeover, and reports workflow ownership', async () => {
    renderOperatorProvider(buildState({
      collaborationByPath: {
        [PAGE_PATH]: {
          blocks: {
            hero: {
              lockedBy: OTHER_ACTOR,
              lockedAt: 1710000000000,
              draftedBy: OTHER_ACTOR,
              draftedAt: 1710000000000,
            },
          },
          history: [],
        },
      },
    }), buildState({ heroText: 'Published hero' }));

    expect(screen.getByTestId('workflow-current').textContent).toBe('0');
    expect(screen.getByTestId('workflow-other').textContent).toBe('1');
    expect(screen.getByTestId('lock-owner').textContent).toBe(OTHER_ACTOR.displayName);
    expect(screen.getByTestId('draft-owner').textContent).toBe(OTHER_ACTOR.displayName);

    fireEvent.click(screen.getByRole('button', { name: 'Lock hero' }));

    expect(screen.getByTestId('action-result').textContent).toBe('locked-by-other');
    expect(authorityMocks.acquireSharedBlockLock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Take lock' }));

    expect(screen.getByTestId('action-result').textContent).toBe('lock-taken');
    await waitFor(() => {
      expect(authorityMocks.acquireSharedBlockLock).toHaveBeenCalledWith(
        PAGE_PATH,
        'hero',
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
        { force: true },
      );
    });
    expect(screen.getByTestId('lock-owner').textContent).toBe(CURRENT_ACTOR.displayName);
    expect(screen.getByTestId('workflow-current').textContent).toBe('1');
  });

  it('reconciles a route-scoped page publish immediately without replacing unrelated published routes', async () => {
    const draftState = buildState({ heroText: 'Route draft hero' });
    const publishedState = buildState({ heroText: 'Route live hero' });
    const unrelatedPath = '/services/investments';
    const unrelatedPage = {
      path: unrelatedPath,
      title: 'Investments',
      breadcrumbLabel: 'Investments',
      parentPath: '/services',
    };
    const unrelatedBlock = {
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      name: 'Hero',
      settings: { line1Text: 'Unrelated live hero' },
      editableFields: [],
    };
    draftState.pageHierarchy[unrelatedPath] = unrelatedPage;
    publishedState.pageHierarchy[unrelatedPath] = unrelatedPage;
    draftState.blocksByPath[unrelatedPath] = [clone(unrelatedBlock)];
    publishedState.blocksByPath[unrelatedPath] = [clone(unrelatedBlock)];

    authorityMocks.fetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: true,
      state: clone(draftState),
      baseSnapshot: clone(publishedState),
      updatedAt: 1710000020000,
    });
    authorityMocks.publishSharedPage.mockImplementation((_pathname, _actor, _summary, options = {}) => Promise.resolve({
      ok: true,
      operationId: options.operationId,
      pathname: PAGE_PATH,
      scope: 'page',
      state: {
        pageHierarchy: { [PAGE_PATH]: clone(draftState.pageHierarchy[PAGE_PATH]) },
        blocksByPath: { [PAGE_PATH]: clone(draftState.blocksByPath[PAGE_PATH]) },
        pathAliases: {},
        collaborationByPath: { [PAGE_PATH]: { blocks: {}, history: [] } },
      },
      baseSnapshot: {
        pageHierarchy: { [PAGE_PATH]: clone(draftState.pageHierarchy[PAGE_PATH]) },
        blocksByPath: { [PAGE_PATH]: clone(draftState.blocksByPath[PAGE_PATH]) },
        pathAliases: {},
        collaborationByPath: {},
      },
      updatedAt: 1710000021000,
      publishResult: { didPublish: true, status: 'published', publishedPaths: [PAGE_PATH] },
    }));

    renderOperatorProvider(draftState, publishedState);

    await waitFor(() => {
      expect(screen.getByTestId('hero-text').textContent).toBe('Route draft hero');
      expect(screen.getByTestId('published-hero-text').textContent).toBe('Route live hero');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish page' }));

    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('published');
      expect(screen.getByTestId('published-hero-text').textContent).toBe('Route draft hero');
    });
    expect(screen.getByTestId('hero-text').textContent).toBe('Route draft hero');
    expect(screen.getByTestId('publish-count').textContent).toBe('0');
  });

  it('verifies a timed-out publish and reconciles the committed route without retrying', async () => {
    const initialState = buildState();
    const publishedState = buildState();
    const committedState = buildState({ heroText: 'Committed after timeout' });
    authorityMocks.publishSharedPage.mockRejectedValueOnce({
      code: 'content-admin-request-timeout',
      message: 'Live publish timed out',
    });
    authorityMocks.fetchSharedPublishStatus.mockImplementation((operationId) => Promise.resolve({
      ok: true,
      operationId,
      pathname: PAGE_PATH,
      scope: 'page',
      status: 'committed',
      committed: true,
      publishedAt: 1710000030000,
      baseSnapshot: {
        pageHierarchy: { [PAGE_PATH]: clone(committedState.pageHierarchy[PAGE_PATH]) },
        blocksByPath: { [PAGE_PATH]: clone(committedState.blocksByPath[PAGE_PATH]) },
        pathAliases: {},
        collaborationByPath: {},
      },
      publishResult: { didPublish: true, status: 'published', publishedPaths: [PAGE_PATH] },
    }));

    renderOperatorProvider(initialState, publishedState);
    fireEvent.click(screen.getByRole('button', { name: 'Publish page' }));

    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('published');
      expect(screen.getByTestId('published-hero-text').textContent).toBe('Committed after timeout');
      expect(screen.getByTestId('shared-publish-status').textContent).toBe('LIVE_CONFIRMED');
    });
    expect(authorityMocks.publishSharedPage).toHaveBeenCalledTimes(1);
    expect(authorityMocks.fetchSharedPublishStatus).toHaveBeenCalledTimes(1);
  });

  it('keeps an unverifiable publish timeout honest', async () => {
    authorityMocks.publishSharedPage.mockRejectedValueOnce({
      code: 'content-admin-request-timeout',
    });
    authorityMocks.fetchSharedPublishStatus.mockResolvedValueOnce({
      ok: true,
      status: 'unknown',
      committed: null,
    });

    renderOperatorProvider(buildState(), buildState());
    fireEvent.click(screen.getByRole('button', { name: 'Publish page' }));

    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('publish-status-unknown');
      expect(screen.getByTestId('shared-publish-status').textContent).toBe('STATUS_UNKNOWN');
    });
  });

  it('keeps the local operator draft visible when the shared save endpoint fails', async () => {
    authorityMocks.saveSharedPageDraft.mockRejectedValueOnce(new Error('network unavailable'));

    renderOperatorProvider(buildState());

    fireEvent.click(screen.getByRole('button', { name: 'Edit hero' }));
    expect(screen.getByTestId('hero-text').textContent).toBe('Edited hero');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });

    await waitFor(() => {
      expect(authorityMocks.saveSharedPageDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('action-result').textContent).toBe('save-failed');
    expect(screen.getByTestId('save-result').textContent).toBe('save-failed');
    expect(screen.getByTestId('hero-text').textContent).toBe('Edited hero');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
  });

  it('keeps the save operation partial when the authority skips a conflicting block', async () => {
    authorityMocks.saveSharedPageDraft.mockImplementation(() => Promise.resolve({
      ok: true,
      state: buildState(),
      baseSnapshot: buildState(),
      updatedAt: 1710000012000,
      saveResult: {
        didSave: true,
        hasConflicts: true,
        changedPaths: [PAGE_PATH],
        savedPaths: [PAGE_PATH],
        savedBlockIdsByPath: { [PAGE_PATH]: ['cta_form'] },
        blockedBlockIdsByPath: { [PAGE_PATH]: ['hero'] },
        blockedBlocks: [{ pathname: PAGE_PATH, blockId: 'hero', reason: 'drafted-by-other' }],
      },
    }));

    renderOperatorProvider(buildState());
    fireEvent.click(screen.getByRole('button', { name: 'Edit hero' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-result').textContent).toBe('partially-saved');
    });
    expect(screen.getByTestId('dirty').textContent).toBe('true');
  });
});
