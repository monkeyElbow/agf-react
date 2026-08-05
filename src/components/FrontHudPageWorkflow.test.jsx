import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FrontHudPageWorkflow from './FrontHudPageWorkflow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockSaveSharedDraftNow = vi.fn();
const mockDiscardSharedPageDraft = vi.fn();
const mockDiscardSharedBlockDraft = vi.fn();
const mockPublishSharedPageNow = vi.fn();
const mockPublishSharedBlockNow = vi.fn();
let mockDirty = true;
let mockChangeSummary = {
  changedBlockCount: 2,
  hasOrderChanges: false,
  hasPageMetaChanges: true,
  hasUnsavedChanges: true,
};
let mockPublishSummary = {
  changedBlockCount: 2,
  changedBlockIds: ['hero', 'cta_form'],
  hasOrderChanges: false,
  hasPageMetaChanges: true,
  hasUnsavedChanges: true,
};
let mockLastSharedSaveResult = {
  changedPaths: ['/services/loans'],
  savedBlockIdsByPath: {
    '/services/loans': ['hero', 'cta_form'],
  },
  blockedBlocks: [],
  updatedAt: Date.now() - 120_000,
};
let mockLastSharedPublishResult = null;
let mockSharedSyncStatus = {
  isPending: true,
  pendingMutationCount: 1,
  hasQueuedDraftSync: true,
  lastQueuedAt: Date.now() - 5_000,
  lastSettledAt: 0,
  lastAppliedAt: Date.now() - 10_000,
};
let mockHasPendingExternalDrafts = false;
let mockWorkflowActivity = {
  hasCurrentActorDraft: true,
  hasOtherActorDraft: false,
};
let mockFrontHudRevealToken = 0;

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    isPageDirty: () => mockDirty,
    getPageChangeSummary: () => mockChangeSummary,
    getPagePublishSummary: () => mockPublishSummary,
    getPageWorkflowActivity: () => mockWorkflowActivity,
    lastSharedSaveResult: mockLastSharedSaveResult,
    lastSharedPublishResult: mockLastSharedPublishResult,
    sharedSyncStatus: mockSharedSyncStatus,
    hasPendingExternalDrafts: () => mockHasPendingExternalDrafts,
    saveSharedDraftNow: mockSaveSharedDraftNow,
    discardSharedPageDraft: mockDiscardSharedPageDraft,
    discardSharedBlockDraft: mockDiscardSharedBlockDraft,
    publishSharedPageNow: mockPublishSharedPageNow,
    publishSharedBlockNow: mockPublishSharedBlockNow,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({
    enabled: true,
    opacity: 15,
    revealToken: mockFrontHudRevealToken,
    setEnabled: vi.fn(),
    setOpacity: vi.fn(),
  }),
}));

describe('FrontHudPageWorkflow', () => {
  beforeEach(() => {
    mockDirty = true;
    mockChangeSummary = {
      changedBlockCount: 2,
      hasOrderChanges: false,
      hasPageMetaChanges: true,
      hasUnsavedChanges: true,
    };
    mockPublishSummary = {
      changedBlockCount: 2,
      changedBlockIds: ['hero', 'cta_form'],
      hasOrderChanges: false,
      hasPageMetaChanges: true,
      hasUnsavedChanges: true,
    };
    mockLastSharedSaveResult = {
      changedPaths: ['/services/loans'],
      savedBlockIdsByPath: {
        '/services/loans': ['hero', 'cta_form'],
      },
      blockedBlocks: [],
      updatedAt: Date.now() - 120_000,
    };
    mockLastSharedPublishResult = null;
    mockSharedSyncStatus = {
      isPending: true,
      pendingMutationCount: 1,
      hasQueuedDraftSync: true,
      lastQueuedAt: Date.now() - 5_000,
      lastSettledAt: 0,
      lastAppliedAt: Date.now() - 10_000,
    };
    mockHasPendingExternalDrafts = false;
    mockWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasOtherActorDraft: false,
    };
    mockFrontHudRevealToken = 0;
    mockSaveSharedDraftNow.mockReset();
    mockDiscardSharedPageDraft.mockReset();
    mockDiscardSharedBlockDraft.mockReset();
    mockPublishSharedPageNow.mockReset();
    mockPublishSharedBlockNow.mockReset();
    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockDiscardSharedPageDraft.mockResolvedValue({ ok: true });
    mockDiscardSharedBlockDraft.mockResolvedValue({ ok: true });
    mockPublishSharedPageNow.mockResolvedValue({ ok: true });
    mockPublishSharedBlockNow.mockResolvedValue({ ok: true });
  });

  it('surfaces save draft, compact page status, review actions, and a working make-live control', async () => {
    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
      />,
    );

    expect(screen.getByRole('region', { name: 'Page workflow' })).toBeTruthy();
    expect(screen.getByText('Editing draft')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Live sync')).toBeTruthy();
    expect(screen.getByText('Draft saves 2 blocks, page details')).toBeTruthy();
    expect(screen.getByText('Make live publishes 2 blocks, page details')).toBeTruthy();
    expect(screen.getByText('Page details changed')).toBeTruthy();
    expect(screen.getByText('Live sync pending')).toBeTruthy();
    expect(screen.getByText('Not live yet in dev authority')).toBeTruthy();
    expect(screen.getByText('Changes stay local while you type.')).toBeTruthy();
    expect(screen.getByText('Live sync catching up in the background.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
    expect(screen.getByRole('link', { name: 'Open page admin' }).getAttribute('href')).toBe('/admin/content?page=%2Fservices%2Floans');

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('shows an explicit saved acknowledgment after the draft request completes', async () => {
    mockSaveSharedDraftNow.mockResolvedValue({
      ok: true,
      saveResult: {
        status: 'saved',
        updatedAt: Date.now(),
      },
    });

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(screen.getByText(/Draft saved/)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Save draft' }).textContent).toBe('Save draft');
  });

  it('confirms and discards the current page draft without publishing it', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    try {
      render(
        <FrontHudPageWorkflow
          pathname="/services/loans"
          reviewHref="/admin/content?page=%2Fservices%2Floans"
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Discard all page drafts' }));

      await waitFor(() => {
        expect(mockDiscardSharedPageDraft).toHaveBeenCalledWith('/services/loans', 'HUD page draft discard');
      });
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Discard unpublished changes'));
      expect(mockPublishSharedPageNow).not.toHaveBeenCalled();
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it('discards only the active block draft from an inline block workflow', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockPublishSummary = {
      ...mockPublishSummary,
      changedBlockIds: ['hero'],
    };

    try {
      render(
        <FrontHudPageWorkflow
          pathname="/services/loans"
          blockId="hero"
          blockLabel="Hero"
          placement="dock-inline"
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Discard Block Draft' }));

      await waitFor(() => {
        expect(mockDiscardSharedBlockDraft).toHaveBeenCalledWith('/services/loans', 'hero', 'HUD block draft discard');
      });
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('only Hero'));
      expect(mockDiscardSharedPageDraft).not.toHaveBeenCalled();
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it('disables save when the page is already clean while preserving review access', () => {
    mockDirty = false;
    mockChangeSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockPublishSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockSharedSyncStatus = {
      isPending: false,
      pendingMutationCount: 0,
      hasQueuedDraftSync: false,
      lastQueuedAt: Date.now() - 60_000,
      lastSettledAt: Date.now() - 30_000,
      lastAppliedAt: Date.now() - 30_000,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
      />,
    );

    expect(screen.getByText('Draft saved')).toBeTruthy();
    expect(screen.getByText(/Live sync caught up/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save draft' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(true);
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();
  });

  it('enables save and make-live when the page still has pending local HUD drafts', async () => {
    mockDirty = false;
    mockHasPendingExternalDrafts = true;
    mockChangeSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockPublishSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockSharedSyncStatus = {
      isPending: false,
      pendingMutationCount: 0,
      hasQueuedDraftSync: false,
      lastQueuedAt: Date.now() - 60_000,
      lastSettledAt: Date.now() - 30_000,
      lastAppliedAt: Date.now() - 30_000,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Save draft' });
    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });

    expect(saveButton.disabled).toBe(false);
    expect(makeLiveButton.disabled).toBe(false);
    expect(screen.getByText('Editing draft')).toBeTruthy();
    expect(screen.getByText('Changes stay local while you type.')).toBeTruthy();

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });

    fireEvent.click(makeLiveButton);
    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('holds the workflow strip in a calm updating state through quick draft-sync churn before settling', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <FrontHudPageWorkflow
          pathname="/services/loans"
          reviewHref="/admin/content?page=%2Fservices%2Floans"
        />,
      );

      expect(screen.getByText('Editing draft')).toBeTruthy();
      expect(screen.getByText('Changes stay local while you type.')).toBeTruthy();

      mockDirty = false;
      mockChangeSummary = {
        changedBlockCount: 0,
        hasOrderChanges: false,
        hasPageMetaChanges: false,
        hasUnsavedChanges: false,
      };
      mockPublishSummary = {
        changedBlockCount: 0,
        hasOrderChanges: false,
        hasPageMetaChanges: false,
        hasUnsavedChanges: false,
      };
      mockSharedSyncStatus = {
        isPending: false,
        pendingMutationCount: 0,
        hasQueuedDraftSync: false,
        lastQueuedAt: Date.now() - 5_000,
        lastSettledAt: Date.now() - 1_000,
        lastAppliedAt: Date.now() - 2_000,
      };
      mockLastSharedSaveResult = {
        changedPaths: ['/services/loans'],
        savedBlockIdsByPath: {
          '/services/loans': ['hero', 'cta_form'],
        },
        blockedBlocks: [],
        updatedAt: Date.now() - 1_000,
      };

      rerender(
        <FrontHudPageWorkflow
          pathname="/services/loans"
          reviewHref="/admin/content?page=%2Fservices%2Floans"
        />,
      );

      expect(screen.getByText('Updating draft')).toBeTruthy();
      expect(screen.getByText('Draft updates are settling in the background.')).toBeTruthy();
      expect(screen.queryByText(/^Last draft save /)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(1401);
      });

      expect(screen.getByText('Draft saved')).toBeTruthy();
      expect(screen.getByText(/^Last draft save /)).toBeTruthy();
      expect(screen.getByText(/^Live sync caught up /)).toBeTruthy();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps draft controls inside the dock and hides them from other admins while preserving page admin access', () => {
    mockWorkflowActivity = {
      hasCurrentActorDraft: false,
      hasOtherActorDraft: true,
      otherActorBlockCount: 1,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="dock-inline"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Make live' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();
  });

  it('shows compact dock workflow actions for the active drafter', async () => {
    const handleDoneEditing = vi.fn();

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="dock-inline"
        onDoneEditing={handleDoneEditing}
      />,
    );

    expect(screen.getByRole('button', { name: 'Done editing' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View live' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
    expect(screen.getByText('Open admin in new window')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));
    expect(handleDoneEditing).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('publishes only the active block when the HUD workflow is scoped to a block', async () => {
    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        blockId="hero"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="dock-inline"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));

    await waitFor(() => {
      expect(mockPublishSharedBlockNow).toHaveBeenCalledWith('/services/loans', 'hero', 'HUD block publish');
    });
    expect(mockPublishSharedPageNow).not.toHaveBeenCalled();
  });

  it('keeps a saved block publishable when ownership metadata is incomplete and another draft is unrelated', async () => {
    mockDirty = false;
    mockPublishSummary = {
      changedBlockCount: 1,
      changedBlockIds: ['intro'],
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: false,
      hasOtherActorDraft: true,
      otherActorBlockCount: 1,
      currentActorBlockIds: [],
      otherActorBlocks: [{ blockId: 'hero' }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/test"
        blockId="intro"
        blockLabel="Intro"
        placement="dock-inline"
      />,
    );

    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);

    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedBlockNow).toHaveBeenCalledWith('/test', 'intro', 'HUD block publish');
    });
  });

  it('only applies the reveal animation class when the HUD toggle emits a reveal token', async () => {
    mockFrontHudRevealToken = 3;

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Page workflow' }).className.includes('is-revealing')).toBe(true);
    });
  });

  it('keeps the bar mounted for a visible slide-out when the HUD is disabled', () => {
    const { container, rerender } = render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
        isVisible
      />,
    );

    const workflow = screen.getByRole('region', { name: 'Page workflow' });
    expect(workflow.className).not.toContain('is-hidden');

    rerender(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
        isVisible={false}
      />,
    );

    expect(container.querySelector('[aria-label="Page workflow"]').className).toContain('is-hidden');
  });

  it('keeps the mobile workflow bar edge-to-edge and preserves the right-side live sync column', () => {
    const cssSource = readFileSync(path.resolve(__dirname, '../styles/front-hud.css'), 'utf8');

    expect(cssSource).toContain('@media (max-width: 720px) {');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('@media (min-width: 981px) and (max-width: 1100px) {');
    expect(cssSource).toContain('.admin-front-hud-page-workflow.is-bar {');
    expect(cssSource).toContain('bottom: 0;');
    expect(cssSource).toContain('background: var(--ag-color-super-grey);');
    expect(cssSource).toContain('transform: translateY(calc(100% + env(safe-area-inset-bottom, 0px)));');
    expect(cssSource).toContain('.admin-front-hud-page-workflow.is-bar.is-hidden {');
    expect(cssSource).not.toContain('top: env(safe-area-inset-top, 0px);');
    expect(cssSource).toContain('left: 0;');
    expect(cssSource).toContain('right: 0;');
    expect(cssSource).toContain('margin-left: 0;');
    expect(cssSource).toContain('width: auto;');
    expect(cssSource).not.toContain('.admin-front-hud-page-workflow.is-bar {\n  width: 100vw;');
    expect(cssSource).not.toContain('.admin-front-hud-page-workflow.is-bar {\n  min-width: 100vw;');
    expect(cssSource).not.toContain('.admin-front-hud-page-workflow.is-bar {\n  margin-left: -50vw;');
    expect(cssSource).toContain('Keep the tablet bar clear of the right-side dock without narrowing the mobile edge-to-edge bar.');
    expect(cssSource).toContain('width: min(100vw - 88px, 100%);');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.9fr);');
    expect(cssSource).toContain('padding-left: 0.42rem;');
    expect(cssSource).toContain('border-left: 1px solid rgba(var(--ag-admin-hud-accent-rgb), 0.16);');
    expect(cssSource).not.toContain('.admin-front-hud-page-workflow-head-grid {\n    grid-template-columns: 1fr;');
  });
});
