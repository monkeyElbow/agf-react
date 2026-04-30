import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContentAdminProvider, useContentAdmin } from './ContentAdminContext';

void [ContentAdminProvider, ContextProbe];

const STORAGE_KEY = 'agf-content-admin-v1';

function ContextProbe() {
  const {
    devIdentity,
    renameDevIdentity,
    updateBlockSetting,
    moveBlock,
    getBlockCollaboration,
    getPageHistory,
    getPageChangeSummary,
    setActiveBlockLock,
  } = useContentAdmin();

  const pathname = '/services/loans';
  const blockId = 'hero';
  const meta = getBlockCollaboration(pathname, blockId);
  const history = getPageHistory(pathname);
  const changeSummary = getPageChangeSummary(pathname);

  return (
    <div>
      <p data-testid="dev-name">{devIdentity?.displayName || ''}</p>
      <p data-testid="dev-id">{devIdentity?.userId || ''}</p>
      <p data-testid="drafted-by">{meta?.draftedBy?.displayName || ''}</p>
      <p data-testid="saved-by">{meta?.savedBy?.displayName || ''}</p>
      <p data-testid="locked-by">{meta?.lockedBy?.displayName || ''}</p>
      <p data-testid="history-action">{history[0]?.action || ''}</p>
      <p data-testid="changed-block-count">{String(changeSummary?.changedBlockCount || 0)}</p>
      <p data-testid="has-order-changes">{changeSummary?.hasOrderChanges ? 'yes' : 'no'}</p>
      <button type="button" onClick={() => renameDevIdentity('Taylor QA')}>Rename</button>
      <button
        type="button"
        onClick={() => updateBlockSetting(pathname, blockId, 'line1Text', 'Updated hero line')}
      >
        Save block
      </button>
      <button type="button" onClick={() => moveBlock(pathname, blockId, 'down')}>Move block</button>
      <button
        type="button"
        onClick={() => setActiveBlockLock(pathname, blockId, { force: true })}
      >
        Force lock block
      </button>
      <button type="button" onClick={() => setActiveBlockLock(pathname, blockId)}>
        Lock block
      </button>
    </div>
  );
}

describe('ContentAdminContext dev identity metadata', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates a developer identity and records active edit metadata without claiming a draft', () => {
    render(
      <ContentAdminProvider>
        <ContextProbe />
      </ContentAdminProvider>,
    );

    expect(screen.getByTestId('dev-name').textContent).not.toBe('');
    expect(screen.getByTestId('dev-id').textContent).toContain('dev-');

    fireEvent.click(screen.getByRole('button', { name: 'Save block' }));

    expect(screen.getByTestId('drafted-by').textContent).toBe('');
    expect(screen.getByTestId('saved-by').textContent).toBe('');
    expect(screen.getByTestId('locked-by').textContent).toBe(screen.getByTestId('dev-name').textContent);
    expect(screen.getByTestId('history-action').textContent).toBe('block-setting-updated');

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
    expect(stored.collaborationByPath['/services/loans'].blocks.hero.savedBy).toBe(null);
    expect(stored.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe(screen.getByTestId('dev-name').textContent);
  });

  it('renames the local dev identity without changing the same author id', () => {
    render(
      <ContentAdminProvider>
        <ContextProbe />
      </ContentAdminProvider>,
    );

    const beforeId = screen.getByTestId('dev-id').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(screen.getByTestId('dev-name').textContent).toBe('Taylor QA');
    expect(screen.getByTestId('dev-id').textContent).toBe(beforeId);
  });

  it('can take over an existing active block lock without rewriting saved draft ownership', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              draftedBy: {
                userId: 'dev-other',
                displayName: 'Other Dev',
                initials: 'OD',
                accentColor: '#111111',
              },
              draftedAt: 1710000000000,
              lockedBy: {
                userId: 'dev-other',
                displayName: 'Other Dev',
                initials: 'OD',
                accentColor: '#111111',
              },
              lockedAt: 1710000000000,
            },
          },
          history: [],
        },
      },
    }));

    render(
      <ContentAdminProvider>
        <ContextProbe />
      </ContentAdminProvider>,
    );

    expect(screen.getByTestId('locked-by').textContent).toBe('Other Dev');

    fireEvent.click(screen.getByRole('button', { name: 'Force lock block' }));

    expect(screen.getByTestId('locked-by').textContent).toBe(screen.getByTestId('dev-name').textContent);
    expect(screen.getByTestId('drafted-by').textContent).toBe('Other Dev');
    expect(screen.getByTestId('history-action').textContent).toBe('block-edit-taken-over');
  });

  it('blocks passive foreign draft ownership until the user explicitly claims it', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              draftedBy: {
                userId: 'dev-other',
                displayName: 'Other Dev',
                initials: 'OD',
                accentColor: '#111111',
              },
              draftedAt: 1710000000000,
            },
          },
          history: [],
        },
      },
    }));

    render(
      <ContentAdminProvider>
        <ContextProbe />
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lock block' }));

    expect(screen.getByTestId('locked-by').textContent).toBe('');
    expect(screen.getByTestId('drafted-by').textContent).toBe('Other Dev');

    fireEvent.click(screen.getByRole('button', { name: 'Force lock block' }));

    expect(screen.getByTestId('locked-by').textContent).toBe(screen.getByTestId('dev-name').textContent);
    expect(screen.getByTestId('drafted-by').textContent).toBe('Other Dev');
    expect(screen.getByTestId('history-action').textContent).toBe('block-draft-claimed');
  });

  it('summarizes changed blocks and order changes for page-level workflow UI', () => {
    render(
      <ContentAdminProvider>
        <ContextProbe />
      </ContentAdminProvider>,
    );

    expect(screen.getByTestId('changed-block-count').textContent).toBe('0');
    expect(screen.getByTestId('has-order-changes').textContent).toBe('no');

    fireEvent.click(screen.getByRole('button', { name: 'Save block' }));

    expect(screen.getByTestId('changed-block-count').textContent).toBe('1');
    expect(screen.getByTestId('has-order-changes').textContent).toBe('no');

    fireEvent.click(screen.getByRole('button', { name: 'Move block' }));

    expect(screen.getByTestId('changed-block-count').textContent).toBe('1');
    expect(screen.getByTestId('has-order-changes').textContent).toBe('yes');
  });
});
