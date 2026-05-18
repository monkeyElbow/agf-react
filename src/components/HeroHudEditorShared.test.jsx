import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroHudEditorPanel, HeroInlineLiveEditor } from './HeroHudEditorShared';

describe('HeroInlineLiveEditor', () => {
  it('defers selection interaction events so selection state can be captured after browser updates', () => {
    const onLineInteract = vi.fn();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    render(createElement(HeroInlineLiveEditor, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: "Today's investment.",
        className: 'home-native-eyebrow',
        highlights: [],
      }],
      activeLineKey: 'line1',
      lineHeight: 0.9,
      lineGap: 0,
      onLineInteract,
    }));

    const input = screen.getByLabelText('Line 1');
    fireEvent.select(input);
    fireEvent.mouseUp(input);
    fireEvent.keyUp(input, { key: 'ArrowRight' });

    expect(onLineInteract.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onLineInteract.mock.calls.every(([lineKey]) => lineKey === 'line1')).toBe(true);

    rafSpy.mockRestore();
  });

  it('renders sandstone highlight spans in the shared hero live preview', () => {
    const { container } = render(createElement(HeroInlineLiveEditor, {
      lines: [{
        key: 'line3',
        label: 'Line 3',
        text: 'Better together.',
        className: 'line3',
        highlights: [{ start: 7, end: 15, className: 'is-sandstone', text: 'together' }],
      }],
      activeLineKey: 'line3',
      lineHeight: 0.9,
      lineGap: 0,
      renderLineContent: (line) => line.highlights?.length
        ? [
          'Better ',
          createElement('mark', { key: 'sand', className: 'is-sandstone' }, 'together'),
          '.',
        ]
        : line.text,
    }));

    expect(container.querySelector('.admin-front-hud-hero-live-line mark.is-sandstone')?.textContent).toBe('together');
  });

  it('applies clamped headline tracking to both preview text and the live input', () => {
    render(createElement(HeroInlineLiveEditor, {
      lines: [{
        key: 'line2',
        label: 'Line 2',
        text: 'Plan ahead.',
        className: 'line2',
        highlights: [],
      }],
      activeLineKey: 'line2',
      lineHeight: 0.9,
      letterSpacing: -0.12,
    }));

    const heading = document.querySelector('.admin-front-hud-hero-live-line .line2');
    const input = screen.getByLabelText('Line 2');

    expect(heading?.style.letterSpacing).toBe('-0.08em');
    expect(input.style.letterSpacing).toBe('-0.08em');
  });

  it('keeps hero line text drafts stable through stale external prop rerenders and commits on debounce', () => {
    vi.useFakeTimers();
    const onLineTextChange = vi.fn();

    try {
      const lines = [{
        key: 'line1',
        label: 'Line 1',
        text: "Today's investment.",
        className: 'home-native-eyebrow',
        highlights: [],
      }];
      const { rerender } = render(createElement(HeroInlineLiveEditor, {
        lines,
        activeLineKey: 'line1',
        lineHeight: 0.9,
        onLineTextChange,
      }));

      const input = screen.getByLabelText('Line 1');
      fireEvent.change(input, {
        target: { value: 'Buffered hero draft' },
      });

      expect(input.value).toBe('Buffered hero draft');
      expect(onLineTextChange).not.toHaveBeenCalledWith('line1', 'Buffered hero draft');

      rerender(createElement(HeroInlineLiveEditor, {
        lines,
        activeLineKey: 'line1',
        lineHeight: 0.9,
        onLineTextChange,
      }));

      expect(screen.getByLabelText('Line 1').value).toBe('Buffered hero draft');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onLineTextChange).toHaveBeenCalledWith('line1', 'Buffered hero draft');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits hero line text on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onLineTextChange = vi.fn();

    try {
      render(createElement(HeroInlineLiveEditor, {
        lines: [{
          key: 'line2',
          label: 'Line 2',
          text: 'Plan ahead.',
          className: 'line2',
          highlights: [],
        }],
        activeLineKey: 'line2',
        lineHeight: 0.9,
        onLineTextChange,
      }));

      const input = screen.getByLabelText('Line 2');
      fireEvent.change(input, {
        target: { value: 'Plan farther ahead.' },
      });

      expect(onLineTextChange).not.toHaveBeenCalledWith('line2', 'Plan farther ahead.');

      fireEvent.blur(input);

      expect(onLineTextChange).toHaveBeenCalledTimes(1);
      expect(onLineTextChange).toHaveBeenCalledWith('line2', 'Plan farther ahead.');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onLineTextChange).toHaveBeenCalledTimes(1);
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });
});

describe('HeroHudEditorPanel', () => {
  it('surfaces headline tracking controls with hero guardrails', () => {
    const onTitleLetterSpacingChange = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0.052,
      lineHeight: 0.9,
      onTitleLetterSpacingChange,
    }));

    expect(screen.getByText('Headline Tracking 0.040em')).toBeTruthy();

    const range = screen.getAllByRole('slider')[2];
    fireEvent.change(range, { target: { value: '-0.03' } });
    expect(onTitleLetterSpacingChange).toHaveBeenCalledWith(-0.03);
  });
});
