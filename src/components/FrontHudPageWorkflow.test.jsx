import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FrontHudPageWorkflow from './FrontHudPageWorkflow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockSaveSharedDraftNow = vi.fn();
const mockPublishSharedPageNow = vi.fn();
let mockDirty = true;
let mockChangeSummary = {
  changedBlockCount: 2,
  hasOrderChanges: false,
  hasPageMetaChanges: true,
  hasUnsavedChanges: true,
};
let mockPublishSummary = {
  changedBlockCount: 2,
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
let mockWorkflowActivity = {
  hasCurrentActorDraft: true,
  hasOtherActorDraft: false,
};
let mockFrontHudRevealToken = 0;

vi.mock('../context/ContentAdminContext', () => ({
  useContentAdmin: () => ({
    isPageDirty: () => mockDirty,
    getPageChangeSummary: () => mockChangeSummary,
    getPagePublishSummary: () => mockPublishSummary,
    getPageWorkflowActivity: () => mockWorkflowActivity,
    lastSharedSaveResult: mockLastSharedSaveResult,
    lastSharedPublishResult: mockLastSharedPublishResult,
    sharedSyncStatus: mockSharedSyncStatus,
    saveSharedDraftNow: mockSaveSharedDraftNow,
    publishSharedPageNow: mockPublishSharedPageNow,
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
    mockWorkflowActivity = {
      hasCurrentActorDraft: true,
      hasOtherActorDraft: false,
    };
    mockFrontHudRevealToken = 0;
    mockSaveSharedDraftNow.mockReset();
    mockPublishSharedPageNow.mockReset();
    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockPublishSharedPageNow.mockResolvedValue({ ok: true });
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
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make live' }).disabled).toBe(false);
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

  it('preserves workflow height across quick bar remounts during route changes', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <FrontHudPageWorkflow
          pathname="/services/loans"
          reviewHref="/admin/content?page=%2Fservices%2Floans"
          placement="bar"
        />,
      );

      expect(document.documentElement.style.getPropertyValue('--ag-front-hud-page-workflow-height')).not.toBe('');

      rerender(
        <FrontHudPageWorkflow
          pathname="/services/investments"
          reviewHref="/admin/content?page=%2Fservices%2Finvestments"
          placement="bar"
        />,
      );

      vi.advanceTimersByTime(181);

      expect(document.documentElement.style.getPropertyValue('--ag-front-hud-page-workflow-height')).not.toBe('');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      document.documentElement.style.removeProperty('--ag-front-hud-page-workflow-height');
    }
  });

  it('keeps the mobile workflow bar edge-to-edge and preserves the right-side live sync column', () => {
    const cssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');

    expect(cssSource).toContain('@media (max-width: 720px) {');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('@media (min-width: 981px) and (max-width: 1100px) {');
    expect(cssSource).toContain('.admin-front-hud-page-workflow.is-bar {');
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
