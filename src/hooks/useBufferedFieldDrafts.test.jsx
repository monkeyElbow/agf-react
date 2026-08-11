import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useBufferedFieldDrafts from './useBufferedFieldDrafts';

function DraftProbe({ value = 'Original', sourceRevision = 0, onCommit }) {
  const { draftValues, updateDraftValue, commitDraftValue } = useBufferedFieldDrafts({
    fields: [{ id: 'title', value, mode: 'blur', commit: onCommit }],
    sourceRevision,
  });

  return (
    <input
      aria-label="Title"
      value={draftValues.title || ''}
      onChange={(event) => updateDraftValue('title', event.target.value)}
      onBlur={() => commitDraftValue('title')}
    />
  );
}

describe('useBufferedFieldDrafts', () => {
  it('commits the final typed value when blur happens immediately', () => {
    const onCommit = vi.fn();
    render(<DraftProbe onCommit={onCommit} />);

    const input = screen.getByLabelText('Title');
    fireEvent.change(input, { target: { value: 'Final character' } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith('Final character', { previousValue: 'Original' });
  });

  it('keeps a local draft through a stale external snapshot', () => {
    const onCommit = vi.fn();
    const { rerender } = render(<DraftProbe onCommit={onCommit} />);
    const input = screen.getByLabelText('Title');

    fireEvent.change(input, { target: { value: 'Buffered title' } });
    rerender(<DraftProbe value="Original" onCommit={onCommit} />);

    expect(screen.getByLabelText('Title').value).toBe('Buffered title');
  });

  it('does not reapply an older snapshot after a newer revision confirms the draft', () => {
    const onCommit = vi.fn();
    const { rerender } = render(<DraftProbe onCommit={onCommit} sourceRevision={10} />);
    const input = screen.getByLabelText('Title');

    fireEvent.change(input, { target: { value: 'Confirmed title' } });
    fireEvent.blur(input);
    rerender(<DraftProbe value="Confirmed title" onCommit={onCommit} sourceRevision={11} />);
    rerender(<DraftProbe value="Original" onCommit={onCommit} sourceRevision={10} />);

    expect(screen.getByLabelText('Title').value).toBe('Confirmed title');
  });
});
