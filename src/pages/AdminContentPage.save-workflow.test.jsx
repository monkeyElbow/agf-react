import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminContentPage from './AdminContentPage';

void [MemoryRouter, AdminContentPage];

const mockSaveSharedDraftNow = vi.fn();
const mockPublishSharedPageNow = vi.fn();
const mockGetPageRevisionHistory = vi.fn();
const mockGetSharedContentBackups = vi.fn();
const mockPromoteContentAdminToSeed = vi.fn();
const mockRestorePageRevision = vi.fn();
const mockRestoreBlockRevision = vi.fn();
const mockRestoreLatestSharedContentBackup = vi.fn();
const mockSetActiveBlockLock = vi.fn();
const mockClearActiveBlockLock = vi.fn();
const mockUpdateBlock = vi.fn();
const mockRemoveBlock = vi.fn();
const mockMoveBlock = vi.fn();
const mockResetContentAdmin = vi.fn();
let mockSharedSnapshotUpdatedAt = 0;
let mockLastSharedSaveResult = null;
let mockLastSharedPublishResult = null;
let mockDirtyPaths = ['/services/loans'];
let mockBlockCollaborationById = {};
let mockPageChangeSummary = {
  changedBlockIds: ['hero'],
  changedBlockCount: 1,
  hasOrderChanges: false,
  hasPageMetaChanges: false,
  hasUnsavedChanges: true,
};
let mockPagePublishSummary = {
  changedBlockIds: ['hero'],
  changedBlockCount: 1,
  hasOrderChanges: false,
  hasPageMetaChanges: false,
  hasUnsavedChanges: true,
};
let mockPageWorkflowActivity = {
  hasCurrentActorDraft: true,
  hasOtherActorDraft: false,
  currentActorBlockCount: 1,
  otherActorBlockCount: 0,
};

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext.jsx');
  return {
    ...actual,
    useContentAdmin: () => ({
      devIdentity: {
        userId: 'dev-taylor',
        displayName: 'Taylor QA',
        initials: 'TQ',
        accentColor: '#00adbb',
      },
      pageHierarchy: {
        '/services/loans': {
          path: '/services/loans',
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
        '/services/loans': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            name: 'Hero',
            settings: {
              line1Text: 'Build tomorrow faithfully',
              line2Text: 'with wise stewardship',
              line3Text: '',
              bgTone: 'white',
              justify: 'left',
            },
            editableFields: [],
          },
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            name: 'CTA Form',
            settings: {
              title: 'Talk with our team',
              bodyHtml: '<p>We can help you compare options.</p>',
              submitLabel: 'Start here',
              successMessage: 'Thanks.',
            },
            editableFields: [],
          },
        ],
      },
      pathAliases: {},
      updatePageHierarchy: vi.fn(),
      renamePagePath: vi.fn(() => ({ ok: true, path: '/services/loans' })),
      updateBlock: mockUpdateBlock,
      updateBlockSetting: vi.fn(),
      addBlock: vi.fn(),
      removeBlock: mockRemoveBlock,
      moveBlock: mockMoveBlock,
      moveBlockToIndex: vi.fn(),
      availableBlockTemplates: [],
      getBreadcrumbTrail: () => ([
        { path: '/', label: 'Home' },
        { path: '/services', label: 'Services' },
        { path: '/services/loans', label: 'Loans' },
      ]),
      renameDevIdentity: vi.fn(),
      getBlockCollaboration: (_pathname, blockId) => mockBlockCollaborationById[String(blockId || '').trim()] || {},
      getPageHistory: () => ([]),
      lastSharedSaveResult: mockLastSharedSaveResult,
      lastSharedPublishResult: mockLastSharedPublishResult,
      sharedSnapshotUpdatedAt: mockSharedSnapshotUpdatedAt,
      dirtyPaths: mockDirtyPaths,
      isPageDirty: (pathname) => mockDirtyPaths.includes(pathname),
      getPageChangeSummary: () => mockPageChangeSummary,
      getPagePublishSummary: () => mockPagePublishSummary,
      getPageWorkflowActivity: () => mockPageWorkflowActivity,
      saveSharedDraftNow: mockSaveSharedDraftNow,
      publishSharedPageNow: mockPublishSharedPageNow,
      getPageRevisionHistory: mockGetPageRevisionHistory,
      getSharedContentBackups: mockGetSharedContentBackups,
      promoteContentAdminToSeed: mockPromoteContentAdminToSeed,
      restorePageRevision: mockRestorePageRevision,
      restoreBlockRevision: mockRestoreBlockRevision,
      restoreLatestSharedContentBackup: mockRestoreLatestSharedContentBackup,
      setActiveBlockLock: mockSetActiveBlockLock,
      clearActiveBlockLock: mockClearActiveBlockLock,
      resetContentAdmin: mockResetContentAdmin,
      resolveManagedPath: (pathname) => pathname,
      resolveManagedPathFromRef: (pathRef, fallback = '') => pathRef || fallback,
    }),
  };
});

describe('AdminContentPage shared save workflow', () => {
  beforeEach(() => {
    mockSaveSharedDraftNow.mockReset();
    mockPublishSharedPageNow.mockReset();
    mockGetPageRevisionHistory.mockReset();
    mockGetSharedContentBackups.mockReset();
    mockPromoteContentAdminToSeed.mockReset();
    mockRestorePageRevision.mockReset();
    mockRestoreBlockRevision.mockReset();
    mockRestoreLatestSharedContentBackup.mockReset();
    mockSetActiveBlockLock.mockReset();
    mockClearActiveBlockLock.mockReset();
    mockUpdateBlock.mockReset();
    mockRemoveBlock.mockReset();
    mockMoveBlock.mockReset();
    mockResetContentAdmin.mockReset();
    mockSharedSnapshotUpdatedAt = 0;
    mockLastSharedSaveResult = null;
    mockLastSharedPublishResult = null;
    mockDirtyPaths = ['/services/loans'];
    mockBlockCollaborationById = {};
    mockPageChangeSummary = {
      changedBlockIds: ['hero'],
      changedBlockCount: 1,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockPagePublishSummary = {
      changedBlockIds: ['hero'],
      changedBlockCount: 1,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockPageWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasOtherActorDraft: false,
      currentActorBlockCount: 1,
      otherActorBlockCount: 0,
    };

    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockPublishSharedPageNow.mockResolvedValue({ ok: true });
    mockGetPageRevisionHistory.mockResolvedValue([
      {
        id: 'rev-1',
        pathname: '/services/loans',
        createdAt: Date.now(),
        actor: { displayName: 'Sarah MacBook' },
        summary: 'Refined hero copy',
        blocks: [
          { id: 'hero', kind: 'hero', label: 'Hero' },
          { id: 'cta_form', kind: 'cta_form', label: 'CTA Form' },
        ],
      },
    ]);
    mockGetSharedContentBackups.mockResolvedValue([
      {
        fileName: 'content-admin-shared-20260708-120000.json',
        createdAt: 1720452000000,
        timestamp: '2026-07-08T17:00:00.000Z',
        reason: 'before-reset-from-seed',
        gitCommitHash: 'abc123',
        metadata: {},
      },
    ]);
    mockRestorePageRevision.mockResolvedValue({ ok: true });
    mockRestoreBlockRevision.mockResolvedValue({ ok: true });
    mockRestoreLatestSharedContentBackup.mockResolvedValue({
      ok: true,
      restoredBackup: {
        fileName: 'content-admin-shared-20260708-120000.json',
        createdAt: 1720452000000,
      },
    });
    mockPromoteContentAdminToSeed.mockResolvedValue({
      ok: true,
      promotedSeedBaseline: {
        fileName: 'content-admin-seed-baseline.json',
        createdAt: 1720455600000,
        timestamp: '2026-07-08T18:00:00.000Z',
      },
    });
    mockSetActiveBlockLock.mockReturnValue({ ok: true });
    mockClearActiveBlockLock.mockReturnValue({ ok: true });
    mockResetContentAdmin.mockResolvedValue({ ok: true });
  });

  it('shows the page save bar and revision drawer actions for shared drafting', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'History' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Promote content to seed' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore last backup' })).toBeTruthy();
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(screen.getByText('/services/loans')).toBeTruthy();
    expect(screen.getByText('1 block changed')).toBeTruthy();
    expect(screen.getByText(/Reset from seed replaces saved admin content with code defaults/i)).toBeTruthy();
    expect(screen.getByText(/Promote content to seed updates that reset baseline/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Optional save note'), { target: { value: 'Refined CTA copy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('Refined CTA copy');
    });

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(await screen.findByRole('heading', { name: 'Revision history' })).toBeTruthy();
    expect(await screen.findByText('Sarah MacBook')).toBeTruthy();
    expect(screen.getAllByText(/Refined hero copy/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Restore page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore selected blocks' })).toBeTruthy();
  });

  it('restores the latest shared backup from the save bar', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore last backup' }).disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Restore last backup' }));

    await waitFor(() => {
      expect(mockRestoreLatestSharedContentBackup).toHaveBeenCalledTimes(1);
    });
  });

  it('promotes the current shared content to the reset baseline from the save bar', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Promote content to seed' }));

    await waitFor(() => {
      expect(mockPromoteContentAdminToSeed).toHaveBeenCalledTimes(1);
    });
  });

  it('restores a whole page revision and selected blocks from the history drawer', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    await screen.findByRole('heading', { name: 'Revision history' });

    fireEvent.click(screen.getByRole('button', { name: 'Restore page' }));
    await waitFor(() => {
      expect(mockRestorePageRevision).toHaveBeenCalledWith('/services/loans', 'rev-1');
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Hero/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Restore selected blocks (1)' }));

    await waitFor(() => {
      expect(mockRestoreBlockRevision).toHaveBeenCalledWith('/services/loans', 'rev-1', 'hero');
    });
  });

  it('refreshes revision history when shared freshness changes', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetPageRevisionHistory.mock.calls.length).toBeGreaterThan(0);
    });
    expect(mockGetPageRevisionHistory.mock.calls.length).toBeGreaterThan(0);

    mockGetPageRevisionHistory.mockClear();

    mockSharedSnapshotUpdatedAt = 2;
    view.rerender(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetPageRevisionHistory).toHaveBeenCalledTimes(1);
    });
  });

  it('opens in page management mode without auto-selecting or auto-editing the first block', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    expect(mockSetActiveBlockLock).not.toHaveBeenCalled();
    expect(mockClearActiveBlockLock).not.toHaveBeenCalled();
    expect(screen.getByText('Select a block to inspect it. Editing starts only after you click Edit.')).toBeTruthy();
    expect(screen.queryByText('Hero animation')).toBeNull();
  });

  it('keeps block selection passive and hides live editing controls until Edit is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(mockSetActiveBlockLock).not.toHaveBeenCalled();
    expect(mockClearActiveBlockLock).not.toHaveBeenCalled();
    expect(screen.getByText('Selected block')).toBeTruthy();
    expect(screen.getByText('Inspecting only until you click Edit.')).toBeTruthy();
    expect(screen.queryByText('Hero animation')).toBeNull();
    expect(screen.queryByLabelText('Block mode')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit block' })).toBeTruthy();
  });

  it('enters active edit mode only after the explicit Edit action', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Hero' }));

    expect(mockSetActiveBlockLock).toHaveBeenCalledWith('/services/loans', 'hero');
    expect(screen.queryByLabelText('Block mode')).toBeNull();
    expect(screen.getByText('Hero animation')).toBeTruthy();
  });

  it('can leave active edit mode and return to inspect mode without saving first', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Hero' }));
    expect(screen.getByText('Hero animation')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));

    expect(screen.queryByText('Hero animation')).toBeNull();
    expect(screen.queryByLabelText('Block mode')).toBeNull();
    expect(screen.getByText('Inspecting only until you click Edit.')).toBeTruthy();
  });

  it('keeps structure controls available in inspect mode without exposing edit-only mode switching', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Block mode')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Hero' }));
    expect(mockUpdateBlock).toHaveBeenCalledWith('/services/loans', 'hero', { hidden: true });

    fireEvent.click(screen.getByRole('button', { name: 'Move Hero down' }));
    expect(mockMoveBlock).toHaveBeenCalledWith('/services/loans', 'hero', 'down');

    fireEvent.click(screen.getAllByText('Hero')[0]);
    expect(screen.getByRole('button', { name: 'Remove block' })).toBeTruthy();
    expect(screen.queryByLabelText('Block mode')).toBeNull();
  });

  it('allows moving from editing block A to editing block B without saving block A first', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Hero' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit CTA Form' }));

    expect(mockSetActiveBlockLock).toHaveBeenNthCalledWith(1, '/services/loans', 'hero');
    expect(mockSetActiveBlockLock).toHaveBeenNthCalledWith(2, '/services/loans', 'cta_form');
    expect(mockSaveSharedDraftNow).not.toHaveBeenCalled();
  });

  it('shows saved feedback for the selected block after a successful save clears dirty state', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.getByText('Unsaved changes')).toBeTruthy();

    mockDirtyPaths = [];
    mockPageChangeSummary = {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockLastSharedSaveResult = {
      error: '',
      changedPaths: ['/services/loans'],
      savedBlockIdsByPath: {
        '/services/loans': ['hero'],
      },
      blockedBlocks: [],
      updatedAt: 1710000000000,
    };
    mockBlockCollaborationById = {
      hero: {
        draftedBy: {
          userId: 'dev-taylor',
          displayName: 'Taylor QA',
        },
        draftedAt: 1710000000000,
        savedBy: {
          userId: 'dev-taylor',
          displayName: 'Taylor QA',
        },
        savedAt: 1710000000000,
        lockedBy: null,
        lockedAt: null,
      },
    };

    view.rerender(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Draft saved')).toBeTruthy();
    expect(screen.getByText(/This block is saved\./)).toBeTruthy();
    expect(screen.queryByText(/Last saved by Taylor QA/)).toBeNull();
    expect(screen.queryByText(/Your draft/)).toBeNull();
    expect(screen.queryByText(/Active edit:/i)).toBeNull();
  });

  it('keeps passive foreign draft markers out of inspect mode while preserving continue-draft action', () => {
    mockDirtyPaths = [];
    mockBlockCollaborationById = {
      hero: {
        draftedBy: {
          userId: 'dev-sarah',
          displayName: 'Sarah MacBook',
        },
        draftedAt: 1710000000000,
      },
    };

    const view = render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.queryByText(/Unpublished draft by Sarah MacBook/)).toBeNull();
    expect(view.container.querySelector('.admin-selected-block-lock-banner')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue draft' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Take over edit' })).toBeNull();
    expect(screen.queryByText(/owns the latest saved draft/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Continue draft' }));

    expect(mockSetActiveBlockLock).toHaveBeenCalledWith('/services/loans', 'hero', { force: true });
  });

  it('keeps passive saved ownership markers out of the normal inspect surface', () => {
    mockDirtyPaths = [];
    mockBlockCollaborationById = {
      hero: {
        savedBy: {
          userId: 'dev-sarah',
          displayName: 'Sarah MacBook',
        },
        savedAt: 1710000000000,
      },
    };

    const view = render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.queryByText(/Last saved by Sarah MacBook/)).toBeNull();
    expect(screen.queryByText(/Unpublished draft by Sarah MacBook/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue draft' })).toBeNull();
    expect(view.container.querySelector('.admin-selected-block-lock-banner')).toBeNull();
  });

  it('keeps Save draft distinct from Make live while preserving multiple changed blocks together', async () => {
    mockPageChangeSummary = {
      changedBlockIds: ['hero', 'cta_form'],
      changedBlockCount: 2,
      hasOrderChanges: true,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockPagePublishSummary = {
      changedBlockIds: ['hero', 'cta_form'],
      changedBlockCount: 2,
      hasOrderChanges: true,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };

    render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('2 blocks changed')).toBeTruthy();
    expect(screen.getByText('Order changed')).toBeTruthy();
    expect(screen.getByText('Draft save: 2 blocks, order')).toBeTruthy();
    expect(screen.getByText('Make live: 2 blocks, order')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });
});
