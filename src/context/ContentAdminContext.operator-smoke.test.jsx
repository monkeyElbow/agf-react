import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEV_IDENTITY_STORAGE_KEY } from '../lib/devIdentity';
import { ContentAdminProvider, bootstrapSharedContentAdminState, useContentAdmin } from './ContentAdminContext.jsx';

const authorityMocks = vi.hoisted(() => ({
  acquireSharedBlockLock: vi.fn(),
  fetchSharedContentBackups: vi.fn(),
  fetchSharedContentSnapshot: vi.fn(),
  fetchSharedPageRevisionHistory: vi.fn(),
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
  const heroText = heroBlock?.settings?.line1Text || '';
  const collaboration = admin.getBlockCollaboration(PAGE_PATH, 'hero');
  const changeSummary = admin.getPageChangeSummary(PAGE_PATH);
  const publishSummary = admin.getPagePublishSummary(PAGE_PATH);
  const workflowActivity = admin.getPageWorkflowActivity(PAGE_PATH);

  return (
    <div>
      <output data-testid="hero-text">{heroText}</output>
      <output data-testid="dirty">{String(admin.isPageDirty(PAGE_PATH))}</output>
      <output data-testid="save-result">{admin.lastSharedSaveResult?.error || String(admin.lastSharedSaveResult?.didSave || '')}</output>
      <output data-testid="publish-result">{admin.lastSharedPublishResult?.error || String(admin.lastSharedPublishResult?.didPublish || '')}</output>
      <output data-testid="change-count">{String(changeSummary.changedBlockCount)}</output>
      <output data-testid="publish-count">{String(publishSummary.changedBlockCount)}</output>
      <output data-testid="workflow-current">{String(workflowActivity.currentActorBlockCount)}</output>
      <output data-testid="workflow-other">{String(workflowActivity.otherActorBlockCount)}</output>
      <output data-testid="lock-owner">{collaboration.lockedBy?.displayName || ''}</output>
      <output data-testid="draft-owner">{collaboration.draftedBy?.displayName || ''}</output>
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
          const nextResult = admin.setActiveBlockLock(PAGE_PATH, 'hero', { force: true });
          setResult(nextResult?.ok ? 'lock-taken' : nextResult?.reason);
        }}
      >
        Take lock
      </button>
    </div>
  );
}

function renderOperatorProvider(initialState) {
  return render(
    <ContentAdminProvider initialState={buildBootstrapState(initialState)}>
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
    authorityMocks.publishSharedPage.mockImplementation(() => Promise.resolve({
      ok: true,
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
    authorityMocks.publishSharedPage.mockImplementation((_pathname, _actor, summary) => Promise.resolve({
      ok: true,
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
    expect(screen.getByTestId('action-result').textContent).toBe('page-restored');
    expect(screen.getByTestId('hero-text').textContent).toBe('Page revision hero');

    fireEvent.click(screen.getByRole('button', { name: 'Restore block' }));
    await waitFor(() => {
      expect(authorityMocks.restoreSharedBlockRevision).toHaveBeenCalledWith(
        PAGE_PATH,
        'rev-block',
        'hero',
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
      );
    });
    expect(screen.getByTestId('action-result').textContent).toBe('block-restored');
    expect(screen.getByTestId('hero-text').textContent).toBe('Block revision hero');

    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));
    await waitFor(() => {
      expect(authorityMocks.restoreLatestSharedContentBackup).toHaveBeenCalledWith(
        expect.objectContaining({ userId: CURRENT_ACTOR.userId }),
      );
    });
    expect(screen.getByTestId('action-result').textContent).toBe('backup-restored');
    expect(screen.getByTestId('hero-text').textContent).toBe('Backup hero');
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
    }));

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
});
