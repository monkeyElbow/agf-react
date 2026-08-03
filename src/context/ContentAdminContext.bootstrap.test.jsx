import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeContentAdminState } from '../lib/contentAdminNormalization';

const mockFetchSharedContentSnapshot = vi.fn();
const mockInitializeSharedContentFromSeed = vi.fn();
const mockResetSharedContentFromSeed = vi.fn();
const mockFetchSharedContentBackups = vi.fn();
const mockRestoreLatestSharedContentBackup = vi.fn();
const mockPromoteSharedContentToSeed = vi.fn();

vi.mock('../lib/devContentAuthorityClient', () => ({
  acquireSharedBlockLock: vi.fn(),
  fetchSharedContentBackups: mockFetchSharedContentBackups,
  fetchSharedContentSnapshot: mockFetchSharedContentSnapshot,
  fetchSharedPageRevisionHistory: vi.fn(),
  initializeSharedContentFromSeed: mockInitializeSharedContentFromSeed,
  isDevContentAuthorityEnabled: () => true,
  publishSharedPage: vi.fn(),
  promoteSharedContentToSeed: mockPromoteSharedContentToSeed,
  releaseSharedBlockLock: vi.fn(),
  resetSharedContentFromSeed: mockResetSharedContentFromSeed,
  restoreLatestSharedContentBackup: mockRestoreLatestSharedContentBackup,
  restoreSharedBlockRevision: vi.fn(),
  restoreSharedContentBackup: vi.fn(),
  restoreSharedPageRevision: vi.fn(),
  saveSharedPageDraft: vi.fn(),
  syncSharedBlockDraft: vi.fn(),
}));

describe('ContentAdminContext shared bootstrap', () => {
  beforeEach(() => {
    mockFetchSharedContentSnapshot.mockReset();
    mockInitializeSharedContentFromSeed.mockReset();
    mockResetSharedContentFromSeed.mockReset();
    mockFetchSharedContentBackups.mockReset();
    mockRestoreLatestSharedContentBackup.mockReset();
    mockPromoteSharedContentToSeed.mockReset();
  });

  it('prefers the shared authority snapshot over the local seed on first render', async () => {
    mockFetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: true,
      state: {
        pageHierarchy: {},
        blocksByPath: {
          '/': [
            {
              id: 'hero',
              kind: 'hero',
              mode: 'dynamic',
              settings: {
                line1Text: 'Managed.',
                line2Text: 'First render.',
              },
            },
          ],
        },
        pathAliases: {},
        collaborationByPath: {},
      },
    });

    const { bootstrapSharedContentAdminState } = await import('./ContentAdminContext.jsx');
    const state = await bootstrapSharedContentAdminState();
    const heroBlock = (state?.blocksByPath?.['/'] || []).find((block) => block?.id === 'hero');

    expect(heroBlock?.settings?.line1Text).toBe('Managed.');
    expect(mockInitializeSharedContentFromSeed).not.toHaveBeenCalled();
  });

  it('falls back to the code seed when shared bootstrap returns an empty uninitialized snapshot', async () => {
    mockFetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: false,
      state: {
        pageHierarchy: {},
        blocksByPath: {},
        pathAliases: {
          '/services/planned-giving/generosity-fund': '/services/planned-giving/donor-advised-fund',
        },
        collaborationByPath: {},
      },
    });
    mockInitializeSharedContentFromSeed.mockResolvedValueOnce({
      initialized: false,
      state: {
        pageHierarchy: {},
        blocksByPath: {},
        pathAliases: {
          '/services/planned-giving/generosity-fund': '/services/planned-giving/donor-advised-fund',
        },
        collaborationByPath: {},
      },
    });

    const { bootstrapSharedContentAdminState } = await import('./ContentAdminContext.jsx');
    const state = await bootstrapSharedContentAdminState();

    expect(mockInitializeSharedContentFromSeed).toHaveBeenCalledTimes(1);
    expect(Object.keys(state?.pageHierarchy || {}).length).toBeGreaterThan(0);
    expect(Object.keys(state?.blocksByPath || {}).length).toBeGreaterThan(0);
    expect(state?.blocksByPath?.['/services/planned-giving/donor-advised-fund']?.length).toBeGreaterThan(0);
  });

  it('uses shared normalization without rewriting canonical managed inventory', async () => {
    const sharedState = {
      pageHierarchy: {},
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<p>Stale page content.</p>',
            },
          },
          {
            id: 'hero',
            kind: 'hero',
            mode: 'static',
            settings: {
              line1Text: 'Property and casualty',
              targetSectionKey: 'class:legacy-hero',
            },
            editableFields: [],
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    };
    const baseSnapshot = {
      pageHierarchy: {},
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'static',
            settings: {
              targetSectionClassName: 'legacy-intro',
            },
            editableFields: [],
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    };

    mockFetchSharedContentSnapshot.mockResolvedValueOnce({
      initialized: true,
      updatedAt: 1710000000000,
      state: sharedState,
      baseSnapshot,
    });

    const { bootstrapSharedContentAdminState } = await import('./ContentAdminContext.jsx');
    const state = await bootstrapSharedContentAdminState();
    const authoringBlocks = state?.blocksByPath?.['/services/insurance/property-casualty-insurance'] || [];
    const publishedBlocks = state?.__contentAdminBootstrap?.publishedState?.blocksByPath?.['/services/insurance/property-casualty-insurance'] || [];
    const authoringHero = authoringBlocks.find((block) => block?.id === 'hero');
    const publishedIntro = publishedBlocks.find((block) => block?.id === 'intro');

    expect(authoringBlocks).toEqual(
      normalizeContentAdminState(sharedState).blocksByPath['/services/insurance/property-casualty-insurance'],
    );
    expect(publishedBlocks).toEqual(
      normalizeContentAdminState(baseSnapshot).blocksByPath['/services/insurance/property-casualty-insurance'],
    );
    expect(authoringBlocks.some((block) => block?.id === 'page_content')).toBe(true);
    expect(authoringHero?.mode).toBe('static');
    expect(authoringHero?.settings?.targetSectionKey).toBe('class:legacy-hero');
    expect(authoringHero?.editableFields).toEqual([]);
    expect(publishedIntro?.mode).toBe('static');
    expect(publishedIntro?.settings?.targetSectionClassName).toBe('legacy-intro');
    expect(publishedIntro?.editableFields).toEqual([]);
  });

  it('returns a failed shared reset result when backup creation blocks the reset', async () => {
    mockFetchSharedContentSnapshot.mockResolvedValue({
      initialized: true,
      updatedAt: 1710000000000,
      state: {
        pageHierarchy: {
          '/services/loans': { path: '/services/loans', title: 'Loans' },
        },
        blocksByPath: {
          '/services/loans': [
            {
              id: 'hero',
              kind: 'hero',
              mode: 'dynamic',
              settings: {
                line1Text: 'Managed.',
              },
            },
          ],
        },
        pathAliases: {},
        collaborationByPath: {},
      },
    });
    mockFetchSharedContentBackups.mockResolvedValue({ backups: [] });
    mockResetSharedContentFromSeed.mockRejectedValue({
      payload: {
        ok: false,
        error: 'backup-failed',
        details: 'Backup directory is not writable.',
        state: {
          pageHierarchy: {
            '/services/loans': { path: '/services/loans', title: 'Loans' },
          },
          blocksByPath: {
            '/services/loans': [
              {
                id: 'hero',
                kind: 'hero',
                mode: 'dynamic',
                settings: {
                  line1Text: 'Managed.',
                },
              },
            ],
          },
          pathAliases: {},
          collaborationByPath: {},
        },
      },
    });

    const { ContentAdminProvider, useContentAdmin } = await import('./ContentAdminContext.jsx');

    function ResetProbe() {
      const { resetContentAdmin } = useContentAdmin();
      const [resultText, setResultText] = useState('');
      return (
        <div>
          <button
            type="button"
            onClick={async () => {
              const result = await resetContentAdmin();
              setResultText(String(result?.details || result?.reason || result?.ok));
            }}
          >
            Reset
          </button>
          <output data-testid="reset-result">{resultText}</output>
        </div>
      );
    }

    render(
      <ContentAdminProvider>
        <ResetProbe />
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => {
      expect(screen.getByTestId('reset-result').textContent).toBe('Backup directory is not writable.');
    });
  });
});
