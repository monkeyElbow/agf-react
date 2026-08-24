import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FrontHudPageWorkflow from './FrontHudPageWorkflow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockSaveSharedDraftNow = vi.fn();
const mockSaveSharedBlockDraftNow = vi.fn();
const mockDiscardSharedPageDraft = vi.fn();
const mockDiscardSharedBlockDraft = vi.fn();
const mockResetBlockToSavedDraft = vi.fn();
const mockPublishSharedPageNow = vi.fn();
const mockPublishSharedBlockNow = vi.fn();
const mockUpdateBlock = vi.fn();
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
let mockBlocksByPath = {
  '/services/loans': [{ id: 'hero', hidden: false }],
};

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    isPageDirty: () => mockDirty,
    blocksByPath: mockBlocksByPath,
    updateBlock: mockUpdateBlock,
    getPageChangeSummary: () => mockChangeSummary,
    getPagePublishSummary: () => mockPublishSummary,
    getPageWorkflowActivity: () => mockWorkflowActivity,
    lastSharedSaveResult: mockLastSharedSaveResult,
    lastSharedPublishResult: mockLastSharedPublishResult,
    sharedSyncStatus: mockSharedSyncStatus,
    hasPendingExternalDrafts: () => mockHasPendingExternalDrafts,
    saveSharedDraftNow: mockSaveSharedDraftNow,
    saveSharedBlockDraftNow: mockSaveSharedBlockDraftNow,
    discardSharedPageDraft: mockDiscardSharedPageDraft,
    discardSharedBlockDraft: mockDiscardSharedBlockDraft,
    resetBlockToSavedDraft: mockResetBlockToSavedDraft,
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
    mockSaveSharedBlockDraftNow.mockReset();
    mockDiscardSharedPageDraft.mockReset();
    mockDiscardSharedBlockDraft.mockReset();
    mockResetBlockToSavedDraft.mockReset();
    mockPublishSharedPageNow.mockReset();
    mockPublishSharedBlockNow.mockReset();
    mockUpdateBlock.mockReset();
    mockBlocksByPath = {
      '/services/loans': [{ id: 'hero', hidden: false }],
    };
    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockSaveSharedBlockDraftNow.mockResolvedValue({ ok: true });
    mockDiscardSharedPageDraft.mockResolvedValue({ ok: true });
    mockDiscardSharedBlockDraft.mockResolvedValue({ ok: true });
    mockResetBlockToSavedDraft.mockReturnValue({ ok: true, didReset: true });
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
    expect(screen.getByText('Saving draft')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Published site')).toBeTruthy();
    expect(screen.getByText('Draft saves 2 blocks, page details')).toBeTruthy();
    expect(screen.getByText('Make live publishes 2 blocks, page details')).toBeTruthy();
    expect(screen.getByText('Page details changed')).toBeTruthy();
    expect(screen.getByText('Draft sync pending')).toBeTruthy();
    expect(screen.getByText('Live site has not been updated by Make live')).toBeTruthy();
    expect(screen.getAllByText('Saving draft to shared content...').length).toBe(2);
    expect(screen.getByRole('button', { name: 'Save all page drafts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
    expect(screen.getByRole('link', { name: 'Open page admin' }).getAttribute('href')).toBe('/admin/content?page=%2Fservices%2Floans');

    fireEvent.click(screen.getByRole('button', { name: 'Save all page drafts' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Save all page drafts' }));

    await waitFor(() => {
      expect(screen.getByText(/Draft saved/)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Save all page drafts' }).textContent).toBe('Save all page drafts');
  });

  it('blocks block-level Make live after a draft save timeout until saving succeeds', async () => {
    mockSaveSharedBlockDraftNow.mockResolvedValue({
      ok: false,
      reason: 'content-admin-request-timeout',
    });

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        blockId="hero"
        placement="dock-inline"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save block draft' }));

    await waitFor(() => {
      expect(screen.getByText('Save timed out; save again before Make live')).toBeTruthy();
    });
    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(true);
    fireEvent.click(makeLiveButton);
    expect(mockPublishSharedBlockNow).not.toHaveBeenCalled();
  });

  it('keeps Save block draft available to stamp ownership after autosync settles', async () => {
    mockDirty = false;
    mockSharedSyncStatus = {
      ...mockSharedSyncStatus,
      isPending: false,
      hasQueuedDraftSync: false,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasCurrentActorUnsavedSave: true,
      currentActorUnsavedSaveBlockIds: ['hero'],
      hasOtherActorDraft: false,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        placement="dock-inline"
        blockId="hero"
      />,
    );

    expect(screen.getByRole('button', { name: 'Save block draft' }).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Save block draft' }));

    await waitFor(() => {
      expect(mockSaveSharedBlockDraftNow).toHaveBeenCalledWith('/services/loans', 'hero', 'HUD block draft save');
    });
  });

  it('hides the active block through the shared draft path from the HUD command bar', () => {
    mockDirty = false;
    mockChangeSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockPublishSummary = {
      changedBlockCount: 0,
      changedBlockIds: [],
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockSharedSyncStatus = {
      isPending: false,
      pendingMutationCount: 0,
      hasQueuedDraftSync: false,
      lastQueuedAt: 0,
      lastSettledAt: Date.now() - 30_000,
      lastAppliedAt: Date.now() - 30_000,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        blockId="hero"
        placement="dock-inline"
      />,
    );

    const hideButton = screen.getByRole('button', { name: 'Hide block' });
    expect(hideButton.disabled).toBe(false);
    fireEvent.click(hideButton);

    expect(mockUpdateBlock).toHaveBeenCalledWith('/services/loans', 'hero', { hidden: true });
    expect(screen.queryByText('Hidden from visitors')).toBeNull();
  });

  it('labels an already hidden block and offers the matching show action', () => {
    mockDirty = false;
    mockChangeSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockPublishSummary = {
      changedBlockCount: 0,
      changedBlockIds: [],
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockSharedSyncStatus = {
      isPending: false,
      pendingMutationCount: 0,
      hasQueuedDraftSync: false,
      lastQueuedAt: 0,
      lastSettledAt: Date.now() - 30_000,
      lastAppliedAt: Date.now() - 30_000,
    };
    mockBlocksByPath = {
      '/services/loans': [{ id: 'hero', hidden: true }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        blockId="hero"
        placement="dock-inline"
      />,
    );

    expect(screen.getByRole('button', { name: 'Show block' })).toBeTruthy();
    expect(screen.getByText('Hidden from visitors')).toBeTruthy();
  });

  it('uses active HUD block state when shared context map still has older visibility', () => {
    mockBlocksByPath = {
      '/services/loans': [{ id: 'hero', hidden: false }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        blockId="hero"
        block={{ id: 'hero', hidden: true }}
        placement="dock-inline"
      />,
    );

    expect(screen.getByRole('button', { name: 'Show block' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hide block' })).toBeNull();
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

  it('resets only the active block to its last saved draft', async () => {
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

      fireEvent.click(screen.getByRole('button', { name: 'Reset to saved draft' }));

      await waitFor(() => {
        expect(mockResetBlockToSavedDraft).toHaveBeenCalledWith('/services/loans', 'hero');
      });
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('last saved draft'));
      expect(mockDiscardSharedBlockDraft).not.toHaveBeenCalled();
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

    expect(screen.getAllByText('Live').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Live content is current')).toBeTruthy();
    expect(screen.queryByText(/^Draft sync completed/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Save all page drafts' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Discard all page drafts' }).disabled).toBe(true);
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

    const saveButton = screen.getByRole('button', { name: 'Save all page drafts' });
    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });

    expect(saveButton.disabled).toBe(false);
    expect(makeLiveButton.disabled).toBe(false);
    expect(screen.getByText('Editing locally')).toBeTruthy();
    expect(screen.getByText('In browser memory; not saved as a system draft yet.')).toBeTruthy();

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });

    fireEvent.click(makeLiveButton);
    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('keeps the page bar publishable when changes exist without current-owner metadata', async () => {
    mockDirty = false;
    mockChangeSummary = {
      changedBlockCount: 1,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockPublishSummary = {
      changedBlockCount: 1,
      changedBlockIds: ['billboard', 'columns'],
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: false,
      hasOtherActorDraft: true,
      currentActorBlockIds: [],
      otherActorBlockCount: 1,
      otherActorBlocks: [{ blockId: 'columns' }],
    };
    mockSharedSyncStatus = {
      isPending: false,
      pendingMutationCount: 0,
      hasQueuedDraftSync: false,
      lastQueuedAt: 0,
      lastSettledAt: Date.now() - 30_000,
      lastAppliedAt: Date.now() - 30_000,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/test"
        reviewHref="/admin/content?page=%2Ftest"
        placement="bar"
        isVisible
      />,
    );

    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);

    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/test', '');
    });
  });

  it('keeps a deletion-only page publishable while another admin drafts a different block', async () => {
    mockDirty = false;
    mockChangeSummary = {
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
    mockPublishSummary = {
      changedBlockCount: 1,
      changedBlockIds: ['hero'],
      hasOrderChanges: true,
      isDeletionOnlyOrderChange: true,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: false,
      hasOtherActorDraft: true,
      currentActorBlockIds: [],
      otherActorBlockCount: 1,
      otherActorBlocks: [{ blockId: 'cta_form' }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/"
        reviewHref="/admin/content?page=%2F"
        placement="bar"
        isVisible
      />,
    );

    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);

    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/', '');
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

      expect(screen.getByText('Saving draft')).toBeTruthy();
      expect(screen.getAllByText('Saving draft to shared content...').length).toBe(2);

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

      expect(screen.getByText('Confirming draft save')).toBeTruthy();
      expect(screen.getByText('Draft saved to shared content; confirming status...')).toBeTruthy();
      expect(screen.queryByText(/^Last draft save /)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(1401);
      });

      expect(screen.getAllByText('Live').length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText(/^Last draft save /)).toBeNull();
      expect(screen.queryByText(/^Draft sync completed /)).toBeNull();
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

    expect(screen.queryByRole('button', { name: 'Save all page drafts' })).toBeNull();
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
    expect(screen.getByRole('button', { name: 'Save all page drafts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
    expect(screen.getByText('Open admin')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();
    const actions = screen.getByRole('group', { name: 'Page workflow' });
    const actionLabels = [...actions.querySelectorAll('button, a')].map((node) => node.textContent.trim());
    expect(actionLabels.indexOf('Save all page drafts')).toBeLessThan(actionLabels.indexOf('Make live'));
    expect(actionLabels.indexOf('Make live')).toBeLessThan(actionLabels.indexOf('Discard all page drafts'));
    expect(actions.querySelector('.admin-front-hud-page-workflow-overflow')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));
    expect(handleDoneEditing).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save all page drafts' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('toggles Billboard live preview without closing the editor', () => {
    const handleToggleLivePreview = vi.fn();

    const { rerender } = render(
      <FrontHudPageWorkflow
        pathname="/test"
        placement="dock-inline"
        blockId="billboard"
        isBillboardEditor
        onToggleLivePreview={handleToggleLivePreview}
      />,
    );

    const liveButton = screen.getByRole('button', { name: 'Toggle view live' });
    expect(liveButton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(liveButton);
    expect(handleToggleLivePreview).toHaveBeenCalledWith(true);

    rerender(
      <FrontHudPageWorkflow
        pathname="/test"
        placement="dock-inline"
        blockId="billboard"
        isBillboardEditor
        isLivePreview
        onToggleLivePreview={handleToggleLivePreview}
      />
    );
    expect(screen.getByRole('button', { name: 'Toggle view draft' })).toBeTruthy();
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

  it('keeps takeover busy until the shared ownership request settles', async () => {
    let settleTakeover;
    const pendingTakeover = new Promise((resolve) => {
      settleTakeover = resolve;
    });
    const onOwnershipAction = vi.fn(() => ({ ok: true, pending: pendingTakeover }));

    render(
      <FrontHudPageWorkflow
        pathname="/test"
        blockId="hero"
        placement="dock-inline"
        ownership={{ state: 'drafted-other', isOwnedByOther: true }}
        onOwnershipAction={onOwnershipAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Take over draft' }));
    expect(screen.getByRole('button', { name: 'Taking over…' }).disabled).toBe(true);
    expect(onOwnershipAction).toHaveBeenCalledTimes(1);

    settleTakeover({ ok: true });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Take over draft' }).disabled).toBe(false);
    });
  });

  it('keeps a block publishable when only its published position is stale', async () => {
    mockDirty = false;
    mockPublishSummary = {
      changedBlockCount: 0,
      changedBlockIds: [],
      orderChangedBlockIds: ['hero'],
      hasOrderChanges: true,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: false,
      hasOtherActorDraft: false,
    };

    render(
      <FrontHudPageWorkflow
        pathname="/test"
        blockId="hero"
        placement="dock-inline"
      />,
    );

    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);
    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedBlockNow).toHaveBeenCalledWith('/test', 'hero', 'HUD block publish');
    });
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

  it('publishes only this admin’s eligible page draft when another admin owns a different block', async () => {
    mockDirty = false;
    mockPublishSummary = {
      changedBlockCount: 2,
      changedBlockIds: ['hero', 'intro'],
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasOtherActorDraft: true,
      otherActorBlockCount: 1,
      currentActorBlockIds: ['intro'],
      otherActorBlocks: [{ blockId: 'hero', state: 'drafted-other' }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
      />,
    );

    expect(screen.getByText('Make live publishes 1 block')).toBeTruthy();
    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);

    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('publishes eligible page order changes when another admin owns an unmoved block', async () => {
    mockDirty = false;
    mockPublishSummary = {
      changedBlockCount: 3,
      changedBlockIds: ['hero', 'cta_form', 'newsletter'],
      orderChangedBlockIds: ['hero', 'cta_form'],
      hasOrderChanges: true,
      hasPageMetaChanges: false,
      hasUnsavedChanges: true,
    };
    mockWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasOtherActorDraft: true,
      otherActorBlockCount: 1,
      currentActorBlockIds: ['hero', 'cta_form'],
      otherActorBlocks: [{ blockId: 'newsletter', state: 'drafted-other' }],
    };

    render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
      />,
    );

    expect(screen.getByText('Make live publishes 2 blocks, order')).toBeTruthy();
    const makeLiveButton = screen.getByRole('button', { name: 'Make live' });
    expect(makeLiveButton.disabled).toBe(false);

    fireEvent.click(makeLiveButton);

    await waitFor(() => {
      expect(mockPublishSharedPageNow).toHaveBeenCalledWith('/services/loans', '');
    });
  });

  it('applies the reveal animation class on the same render that the HUD becomes visible', () => {
    const { rerender } = render(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
        isVisible={false}
      />,
    );

    rerender(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
        isVisible
      />,
    );

    const workflow = screen.getByRole('region', { name: 'Page workflow' });
    expect(workflow.className).toContain('is-revealing');
    expect(workflow.className).not.toContain('is-hidden');

    mockFrontHudRevealToken = 3;
    rerender(
      <FrontHudPageWorkflow
        pathname="/services/loans"
        reviewHref="/admin/content?page=%2Fservices%2Floans"
        placement="bar"
        isVisible
      />,
    );

    expect(workflow.className).toContain('is-revealing');
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
    expect(cssSource).toContain('"head meta actions"');
    expect(cssSource).toContain('grid-area: actions;');
    expect(cssSource).toContain('min-height: 26px;');
    expect(cssSource).toContain('min-width: 0;');
    expect(cssSource).toContain('padding-left: 0.42rem;');
    expect(cssSource).toContain('border-left: 1px solid rgba(var(--ag-admin-hud-accent-rgb), 0.16);');
    expect(cssSource).toContain('--ag-admin-front-hud-workflow-height');
    expect(cssSource).toContain('bottom: calc(var(--ag-admin-front-hud-workflow-height, 0px) - var(--ag-admin-front-hud-panel-offset-y, 0px));');
    expect(cssSource).toContain('max-height: min(84vh, calc(100vh - var(--ag-admin-front-hud-workflow-height, 0px)));');
    expect(cssSource).not.toContain('.admin-front-hud-page-workflow-head-grid {\n    grid-template-columns: 1fr;');
  });
});
