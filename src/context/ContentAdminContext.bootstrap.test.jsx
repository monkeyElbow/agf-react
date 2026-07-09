import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
