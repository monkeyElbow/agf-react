import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroHudEditorPanel, HeroInlineLiveEditor } from './HeroHudEditorShared';

describe('HeroInlineLiveEditor', () => {
  it('keeps focus, select, and mouse-up interaction events available for parent selection sync', () => {
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
    fireEvent.focus(input);
    fireEvent.select(input);
    fireEvent.mouseUp(input);

    expect(onLineInteract.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onLineInteract.mock.calls.every(([lineKey]) => lineKey === 'line1')).toBe(true);

    rafSpy.mockRestore();
  });

  it('ignores generic typing keyup events so parent HUD state does not churn on every character', () => {
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
      onLineInteract,
    }));

    const input = screen.getByLabelText('Line 1');
    fireEvent.keyUp(input, { key: 'a' });

    expect(onLineInteract).not.toHaveBeenCalled();
    expect(rafSpy).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  it('keeps navigation and select-all keyup interaction events available for keyboard selection workflows', () => {
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
      onLineInteract,
    }));

    const input = screen.getByLabelText('Line 1');
    fireEvent.keyUp(input, { key: 'ArrowRight' });
    fireEvent.keyUp(input, { key: 'a', ctrlKey: true });

    expect(onLineInteract).toHaveBeenCalledTimes(2);
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

  it('lets a line-specific font size override the shared hero font size for preview and input sync', () => {
    render(createElement(HeroInlineLiveEditor, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Convenient.',
        className: 'home-native-eyebrow is-atlantean',
        fontSize: '8rem',
        highlights: [],
      }],
      activeLineKey: 'line1',
      fontSize: '5rem',
      lineHeight: 0.9,
    }));

    const heading = document.querySelector('.admin-front-hud-hero-live-line .home-native-eyebrow');
    const input = screen.getByLabelText('Line 1');

    expect(heading?.style.fontSize).toBe('8rem');
    expect(input.style.fontSize).toBe('8rem');
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

  it('keeps front HUD hero drafts local until blur when commit-on-blur mode is enabled', () => {
    vi.useFakeTimers();
    const onLineTextChange = vi.fn();

    try {
      render(createElement(HeroInlineLiveEditor, {
        lines: [{
          key: 'line1',
          label: 'Line 1',
          text: 'Plan ahead.',
          className: 'line1',
          highlights: [],
        }],
        activeLineKey: 'line1',
        lineHeight: 0.9,
        onLineTextChange,
        commitOnBlurOnly: true,
      }));

      const input = screen.getByLabelText('Line 1');
      fireEvent.change(input, {
        target: { value: 'Plan farther ahead.' },
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(input.value).toBe('Plan farther ahead.');
      expect(onLineTextChange).not.toHaveBeenCalled();

      fireEvent.blur(input);

      expect(onLineTextChange).toHaveBeenCalledTimes(1);
      expect(onLineTextChange).toHaveBeenCalledWith('line1', 'Plan farther ahead.');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps foreign-owned inline hero inputs read-only until takeover', () => {
    vi.useFakeTimers();
    const onLineTextChange = vi.fn();

    try {
      render(createElement(HeroInlineLiveEditor, {
        lines: [{
          key: 'line1',
          label: 'Line 1',
          text: 'Plan ahead.',
          className: 'line1',
          highlights: [],
        }],
        activeLineKey: 'line1',
        lineHeight: 0.9,
        onLineTextChange,
        commitOnBlurOnly: true,
        readOnly: true,
      }));

      const input = screen.getByLabelText('Line 1');
      expect(input.readOnly).toBe(true);

      fireEvent.change(input, {
        target: { value: 'Blocked takeover' },
      });
      fireEvent.blur(input);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(input.value).toBe('Plan ahead.');
      expect(onLineTextChange).not.toHaveBeenCalled();
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
