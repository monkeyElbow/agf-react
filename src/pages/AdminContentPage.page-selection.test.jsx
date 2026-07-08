import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminContentPage from './AdminContentPage';

const mockUpdatePageHierarchy = vi.fn();
const mockRenamePagePath = vi.fn();
const mockUpdateBlock = vi.fn();
const mockUpdateBlockSetting = vi.fn();
const mockAddBlock = vi.fn();
const mockRemoveBlock = vi.fn();
const mockMoveBlock = vi.fn();
const mockMoveBlockToIndex = vi.fn();
const mockSaveSharedDraftNow = vi.fn();
const mockPublishSharedPageNow = vi.fn();
const mockGetPageRevisionHistory = vi.fn();
const mockGetSharedContentBackups = vi.fn();
const mockRestorePageRevision = vi.fn();
const mockRestoreBlockRevision = vi.fn();
const mockRestoreLatestSharedContentBackup = vi.fn();
const mockSetActiveBlockLock = vi.fn();
const mockClearActiveBlockLock = vi.fn();
const mockResetContentAdmin = vi.fn();

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
        userId: 'dev-jordan',
        displayName: 'Jordan QA',
        initials: 'JQ',
        accentColor: '#00adbb',
      },
      pageHierarchy: {
        '/services/loans': {
          path: '/services/loans',
          title: 'Loans',
          breadcrumbLabel: 'Loans',
          parentPath: '/services',
        },
        '/services/investments': {
          path: '/services/investments',
          title: 'Investments',
          breadcrumbLabel: 'Investments',
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
              line1Text: 'Loans hero',
              line2Text: 'Build faithfully',
              line3Text: '',
              bgTone: 'white',
              justify: 'left',
            },
            editableFields: [],
          },
        ],
        '/services/investments': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            name: 'Hero',
            settings: {
              line1Text: 'Investments hero',
              line2Text: 'Grow faithfully',
              line3Text: '',
              bgTone: 'white',
              justify: 'left',
            },
            editableFields: [],
          },
        ],
      },
      pathAliases: {},
      updatePageHierarchy: mockUpdatePageHierarchy,
      renamePagePath: mockRenamePagePath,
      updateBlock: mockUpdateBlock,
      updateBlockSetting: mockUpdateBlockSetting,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      moveBlock: mockMoveBlock,
      moveBlockToIndex: mockMoveBlockToIndex,
      availableBlockTemplates: [],
      getBreadcrumbTrail: (pathname) => {
        if (pathname === '/services/investments') {
          return [
            { path: '/', label: 'Home' },
            { path: '/services', label: 'Services' },
            { path: '/services/investments', label: 'Investments' },
          ];
        }
        return [
          { path: '/', label: 'Home' },
          { path: '/services', label: 'Services' },
          { path: '/services/loans', label: 'Loans' },
        ];
      },
      renameDevIdentity: vi.fn(),
      getBlockCollaboration: () => ({}),
      getPageHistory: () => ([]),
      lastSharedSaveResult: null,
      lastSharedPublishResult: null,
      sharedSnapshotUpdatedAt: 0,
      dirtyPaths: [],
      isPageDirty: () => false,
      getPageChangeSummary: () => ({
        changedBlockIds: [],
        changedBlockCount: 0,
        hasOrderChanges: false,
        hasPageMetaChanges: false,
        hasUnsavedChanges: false,
      }),
      getPagePublishSummary: () => ({
        changedBlockIds: [],
        changedBlockCount: 0,
        hasOrderChanges: false,
        hasPageMetaChanges: false,
        hasUnsavedChanges: false,
      }),
      getPageWorkflowActivity: () => ({
        hasCurrentActorDraft: false,
        hasOtherActorDraft: false,
        currentActorBlockCount: 0,
        otherActorBlockCount: 0,
      }),
      saveSharedDraftNow: mockSaveSharedDraftNow,
      publishSharedPageNow: mockPublishSharedPageNow,
      getPageRevisionHistory: mockGetPageRevisionHistory,
      getSharedContentBackups: mockGetSharedContentBackups,
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

describe('AdminContentPage page selection', () => {
  beforeEach(() => {
    mockUpdatePageHierarchy.mockReset();
    mockRenamePagePath.mockReset();
    mockUpdateBlock.mockReset();
    mockUpdateBlockSetting.mockReset();
    mockAddBlock.mockReset();
    mockRemoveBlock.mockReset();
    mockMoveBlock.mockReset();
    mockMoveBlockToIndex.mockReset();
    mockSaveSharedDraftNow.mockReset();
    mockPublishSharedPageNow.mockReset();
    mockGetPageRevisionHistory.mockReset();
    mockGetSharedContentBackups.mockReset();
    mockRestorePageRevision.mockReset();
    mockRestoreBlockRevision.mockReset();
    mockRestoreLatestSharedContentBackup.mockReset();
    mockSetActiveBlockLock.mockReset();
    mockClearActiveBlockLock.mockReset();
    mockResetContentAdmin.mockReset();
    mockRenamePagePath.mockImplementation((pathname, nextPath) => ({ ok: true, path: nextPath || pathname }));
    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockPublishSharedPageNow.mockResolvedValue({ ok: true });
    mockGetPageRevisionHistory.mockResolvedValue([]);
    mockGetSharedContentBackups.mockResolvedValue([]);
    mockRestorePageRevision.mockResolvedValue({ ok: true });
    mockRestoreBlockRevision.mockResolvedValue({ ok: true });
    mockRestoreLatestSharedContentBackup.mockResolvedValue({ ok: true });
    mockSetActiveBlockLock.mockReturnValue({ ok: true });
    mockClearActiveBlockLock.mockReturnValue({ ok: true });
  });

  it('lets admin switch pages after entering from a deep-linked page URL', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
        <LocationProbe />
        <AdminContentPage />
      </MemoryRouter>,
    );

    const pageSelect = await screen.findByLabelText('Page route');

    await waitFor(() => {
      expect(pageSelect.value).toBe('/services/loans');
    });
    expect(screen.getByTestId('location-search').textContent).toBe('?page=/services/loans');
    expect(container.querySelector('.admin-page-save-bar-context strong')?.textContent).toBe('Loans');

    fireEvent.change(pageSelect, { target: { value: '/services/investments' } });

    await waitFor(() => {
      expect(pageSelect.value).toBe('/services/investments');
    });
    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('?page=%2Fservices%2Finvestments');
    });
    expect(container.querySelector('.admin-page-save-bar-context strong')?.textContent).toBe('Investments');
    expect(container.querySelector('.admin-page-save-bar-context span')?.textContent).toBe('/services/investments');
  });
});
