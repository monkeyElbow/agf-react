import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminContentPage from './AdminContentPage';

const mockUpdateBlock = vi.fn();

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
        '/': {
          path: '/',
          title: 'Home',
          breadcrumbLabel: 'Home',
          parentPath: null,
        },
      },
      blocksByPath: {
        '/': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'static',
            name: 'Hero',
            settings: {
              line1Text: 'Static hero',
            },
            editableFields: [],
          },
        ],
      },
      pathAliases: {},
      updatePageHierarchy: vi.fn(),
      renamePagePath: vi.fn(() => ({ ok: true, path: '/' })),
      updateBlock: mockUpdateBlock,
      updateBlockSetting: vi.fn(),
      addBlock: vi.fn(),
      removeBlock: vi.fn(),
      moveBlock: vi.fn(),
      moveBlockToIndex: vi.fn(),
      availableBlockTemplates: [],
      getBreadcrumbTrail: () => [{ path: '/', label: 'Home' }],
      renameDevIdentity: vi.fn(),
      getBlockCollaboration: () => ({}),
      getPageHistory: () => [],
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
      saveSharedDraftNow: vi.fn(),
      publishSharedPageNow: vi.fn(),
      registerExternalDraftFlushHandler: vi.fn(() => () => {}),
      getPageRevisionHistory: vi.fn(async () => []),
      setActiveBlockLock: vi.fn(() => ({ ok: true })),
      clearActiveBlockLock: vi.fn(() => ({ ok: true })),
      restorePageRevision: vi.fn(async () => ({ ok: true })),
      restoreBlockRevision: vi.fn(async () => ({ ok: true })),
      resetContentAdmin: vi.fn(async () => ({ ok: true })),
      resolveManagedPath: (pathname) => pathname,
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

describe('AdminContentPage static hero recovery', () => {
  it('keeps a switch-back path to dynamic mode for the static home hero', () => {
    render(
      <MemoryRouter initialEntries={['/admin/content?page=/']}>
        <AdminContentPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.getByText('This block is static and not currently editable.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Use dynamic block' }));

    expect(mockUpdateBlock).toHaveBeenCalledWith('/', 'hero', { mode: 'dynamic' });
  });
});
