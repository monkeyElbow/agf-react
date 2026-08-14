import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useLocalBlockDrafts from './useLocalBlockDrafts';
import {
  EDITOR_DRAFT_PUBLISHED_EVENT,
  LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS,
} from '../lib/contentAdminTiming';

const noopFalse = () => false;

function LocalBlockDraftsProbe({
  blocks,
  claimBufferedBlockEdit = noopFalse,
  commitBlockSettingsPatch = noopFalse,
  registerExternalDraftStatusHandler = null,
}) {
  const { blocks: managedBlocks, stageLocalBlockSetting } = useLocalBlockDrafts({
    pathname: '/services/loans',
    blocks,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftStatusHandler,
  });
  const heroBlock = managedBlocks.find((block) => block?.id === 'hero') || { settings: {} };

  return (
    <label>
      Hero text
      <input
        aria-label="Hero text"
        value={String(heroBlock.settings?.line1Text || '')}
        onChange={(event) => stageLocalBlockSetting('hero', 'line1Text', event.target.value)}
      />
    </label>
  );
}

describe('useLocalBlockDrafts', () => {
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('updates the visible field immediately while batching a single debounced commit and lock claim', () => {
    vi.useFakeTimers();
    const claimBufferedBlockEdit = vi.fn(() => true);
    const commitBlockSettingsPatch = vi.fn(() => true);
    const blocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Before',
        },
      },
    ];

    render(
      <LocalBlockDraftsProbe
        blocks={blocks}
        claimBufferedBlockEdit={claimBufferedBlockEdit}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    const input = screen.getByLabelText('Hero text');

    fireEvent.change(input, { target: { value: 'B' } });
    expect(screen.getByLabelText('Hero text').value).toBe('B');

    fireEvent.change(input, { target: { value: 'Bo' } });
    expect(screen.getByLabelText('Hero text').value).toBe('Bo');

    fireEvent.change(input, { target: { value: 'Borrow wisely' } });
    expect(screen.getByLabelText('Hero text').value).toBe('Borrow wisely');

    expect(claimBufferedBlockEdit).toHaveBeenCalledTimes(1);
    expect(claimBufferedBlockEdit).toHaveBeenCalledWith('/services/loans', 'hero');
    expect(commitBlockSettingsPatch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS - 1);
    });

    expect(commitBlockSettingsPatch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(commitBlockSettingsPatch).toHaveBeenCalledTimes(1);
    expect(commitBlockSettingsPatch).toHaveBeenCalledWith('/services/loans', 'hero', {
      line1Text: 'Borrow wisely',
    });
  });

  it('clears local editor buffers when the block is published', () => {
    vi.useFakeTimers();
    const commitBlockSettingsPatch = vi.fn(() => true);
    const blocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Live title',
        },
      },
    ];

    render(
      <LocalBlockDraftsProbe
        blocks={blocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    fireEvent.change(screen.getByLabelText('Hero text'), { target: { value: 'Draft title' } });
    expect(screen.getByLabelText('Hero text').value).toBe('Draft title');

    act(() => {
      window.dispatchEvent(new CustomEvent(EDITOR_DRAFT_PUBLISHED_EVENT, {
        detail: {
          pathname: '/services/loans',
          blockIds: ['hero'],
        },
      }));
    });

    expect(screen.getByLabelText('Hero text').value).toBe('Live title');
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });
    expect(commitBlockSettingsPatch).not.toHaveBeenCalled();
  });

  it('reports pending local drafts through the external status handler', () => {
    vi.useFakeTimers();
    const statusHandlers = new Map();
    const registerExternalDraftStatusHandler = vi.fn((handlerId, getStatus) => {
      statusHandlers.set(handlerId, getStatus);
      return () => {
        statusHandlers.delete(handlerId);
      };
    });

    const blocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Before',
        },
      },
    ];

    render(
      <LocalBlockDraftsProbe
        blocks={blocks}
        registerExternalDraftStatusHandler={registerExternalDraftStatusHandler}
      />,
    );

    const [statusReader] = [...statusHandlers.values()];
    expect(typeof statusReader).toBe('function');

    fireEvent.change(screen.getByLabelText('Hero text'), { target: { value: 'Borrow wisely' } });

    expect(statusReader()).toEqual({
      pathname: '/services/loans',
      hasPendingDrafts: true,
      pendingBlockIds: ['hero'],
    });
  });

  it('keeps committed local drafts visible when a stale block snapshot arrives later', () => {
    vi.useFakeTimers();
    const claimBufferedBlockEdit = vi.fn(() => true);
    const commitBlockSettingsPatch = vi.fn(() => true);
    const statusHandlers = new Map();
    const registerExternalDraftStatusHandler = vi.fn((handlerId, getStatus) => {
      statusHandlers.set(handlerId, getStatus);
      return () => {
        statusHandlers.delete(handlerId);
      };
    });
    const staleBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Before',
        },
      },
    ];
    const committedBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Borrow wisely',
        },
      },
    ];

    const { rerender } = render(
      <LocalBlockDraftsProbe
        blocks={staleBlocks}
        claimBufferedBlockEdit={claimBufferedBlockEdit}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
        registerExternalDraftStatusHandler={registerExternalDraftStatusHandler}
      />,
    );

    fireEvent.change(screen.getByLabelText('Hero text'), { target: { value: 'Borrow wisely' } });

    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    expect(commitBlockSettingsPatch).toHaveBeenCalledWith('/services/loans', 'hero', {
      line1Text: 'Borrow wisely',
    });

    rerender(
      <LocalBlockDraftsProbe
        blocks={committedBlocks}
        claimBufferedBlockEdit={claimBufferedBlockEdit}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
        registerExternalDraftStatusHandler={registerExternalDraftStatusHandler}
      />,
    );

    expect(screen.getByLabelText('Hero text').value).toBe('Borrow wisely');
    const [statusReader] = [...statusHandlers.values()];
    expect(statusReader()).toEqual({
      pathname: '/services/loans',
      hasPendingDrafts: false,
      pendingBlockIds: [],
    });

    rerender(
      <LocalBlockDraftsProbe
        blocks={staleBlocks}
        claimBufferedBlockEdit={claimBufferedBlockEdit}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
        registerExternalDraftStatusHandler={registerExternalDraftStatusHandler}
      />,
    );

    expect(screen.getByLabelText('Hero text').value).toBe('Borrow wisely');
    expect(commitBlockSettingsPatch).toHaveBeenCalledTimes(1);
  });

  it('releases a settled draft when source changes to a different newer value', () => {
    vi.useFakeTimers();
    const commitBlockSettingsPatch = vi.fn(() => true);
    const staleBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Before',
        },
      },
    ];
    const committedBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Borrow wisely',
        },
      },
    ];
    const externalBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'External update',
        },
      },
    ];

    const { rerender } = render(
      <LocalBlockDraftsProbe
        blocks={staleBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    fireEvent.change(screen.getByLabelText('Hero text'), { target: { value: 'Borrow wisely' } });
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    rerender(
      <LocalBlockDraftsProbe
        blocks={committedBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );
    rerender(
      <LocalBlockDraftsProbe
        blocks={externalBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    expect(screen.getByLabelText('Hero text').value).toBe('External update');
  });

  it('keeps the caret stable when stale snapshots arrive after multiple local edits', () => {
    vi.useFakeTimers();
    const commitBlockSettingsPatch = vi.fn(() => true);
    const initialBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Before',
        },
      },
    ];
    const firstCommitBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Borrow wisely',
        },
      },
    ];
    const secondCommitBlocks = [
      {
        id: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Borrow very wisely',
        },
      },
    ];

    const { rerender } = render(
      <LocalBlockDraftsProbe
        blocks={initialBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    const input = screen.getByLabelText('Hero text');
    fireEvent.change(input, { target: { value: 'Borrow wisely' } });
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    rerender(
      <LocalBlockDraftsProbe
        blocks={firstCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    fireEvent.change(screen.getByLabelText('Hero text'), { target: { value: 'Borrow very wisely' } });
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    rerender(
      <LocalBlockDraftsProbe
        blocks={secondCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    const editedInput = screen.getByLabelText('Hero text');
    editedInput.focus();
    editedInput.setSelectionRange(11, 11);

    rerender(
      <LocalBlockDraftsProbe
        blocks={firstCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    expect(screen.getByLabelText('Hero text').value).toBe('Borrow very wisely');
    expect(screen.getByLabelText('Hero text').selectionStart).toBe(11);
    expect(screen.getByLabelText('Hero text').selectionEnd).toBe(11);
  });
});
