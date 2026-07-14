import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useLocalBlockDrafts from './useLocalBlockDrafts';
import { LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS } from '../context/ContentAdminContext';

function LocalBlockDraftsProbe({
  blocks,
  claimBufferedBlockEdit = () => false,
  commitBlockSettingsPatch = () => false,
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
    });
  });
});
