import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroHudEditorPanel, HeroInlineLiveEditor } from './HeroHudEditorShared';
import { HeroBlockEditor } from './block-editors/migratedBlockEditors';

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

  it('can provide only the transparent interaction surface without rendering a second heading', () => {
    const { container } = render(createElement(HeroInlineLiveEditor, {
      interactionOnly: true,
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Visible Hero.',
        className: 'is-super-grey',
        highlights: [{ start: 8, end: 12, className: 'is-melon', text: 'Hero' }],
      }],
      activeLineKey: 'line1',
      lineHeight: 0.9,
      lineGap: 0,
    }));

    expect(container.querySelector('.admin-front-hud-hero-live-editor.is-interaction-layer')).toBeTruthy();
    expect(container.querySelector('.admin-front-hud-hero-live-line > h1')).toBeNull();
    expect(container.querySelector('textarea[data-hero-line-key="line1"]')).toBeTruthy();
    expect(container.querySelector('mark')).toBeNull();
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

  it('applies line gap to stacked hero preview lines', () => {
    const { container } = render(createElement(HeroInlineLiveEditor, {
      lines: [
        {
          key: 'line1',
          label: 'Line 1',
          text: 'Impressive coverage',
          className: 'line1',
          highlights: [],
        },
        {
          key: 'line2',
          label: 'Line 2',
          text: 'Built for churches & ministries.',
          className: 'line2',
          highlights: [],
        },
      ],
      activeLineKey: 'line2',
      lineHeight: 0.9,
      lineGap: 0.08,
    }));

    const stackedLines = container.querySelectorAll('.admin-front-hud-hero-live-line');
    expect(stackedLines).toHaveLength(2);
    expect(stackedLines[1].style.marginTop).toBe('0.08em');
  });

  it('applies negative line gap to stacked hero preview lines so HUD matches the page render', () => {
    const { container } = render(createElement(HeroInlineLiveEditor, {
      lines: [
        {
          key: 'line1',
          label: 'Line 1',
          text: 'Faith and finance',
          className: 'line1',
          highlights: [],
        },
        {
          key: 'line2',
          label: 'Line 2',
          text: 'Better together.',
          className: 'line2',
          highlights: [],
        },
      ],
      activeLineKey: 'line2',
      lineHeight: 0.9,
      lineGap: -0.08,
    }));

    const stackedLines = container.querySelectorAll('.admin-front-hud-hero-live-line');
    expect(stackedLines).toHaveLength(2);
    expect(stackedLines[1].style.marginTop).toBe('-0.08em');
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

  it('replaces a select-all range on the first input event without waiting for parent reconciliation', () => {
    const onLineTextChange = vi.fn();

    render(createElement(HeroInlineLiveEditor, {
      lines: [{
        key: 'line2',
        label: 'Line 2',
        text: 'Original line two.',
        className: 'line2',
        highlights: [],
      }],
      activeLineKey: 'line2',
      lineHeight: 0.9,
      onLineTextChange,
    }));

    const input = screen.getByLabelText('Line 2');
    input.focus();
    input.setSelectionRange(0, input.value.length);
    fireEvent.select(input);
    fireEvent.change(input, { target: { value: 'R' } });

    expect(input.value).toBe('R');
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
  it('keeps the HUD Hero preview surface tied to the selected background', () => {
    const { rerender } = render(createElement(HeroHudEditorPanel, {
      lines: [{ key: 'line1', label: 'Line 1', text: 'Hero surface.', lineColor: '', highlights: [] }],
      activeLineKey: 'line1',
      bgTone: 'blue',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
    }));

    expect(document.querySelector('.admin-hero-hud-card--controls.is-bg-blue')).toBeTruthy();

    rerender(createElement(HeroHudEditorPanel, {
      lines: [{ key: 'line1', label: 'Line 1', text: 'Hero surface.', lineColor: '', highlights: [] }],
      activeLineKey: 'line1',
      bgTone: 'grey',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
    }));

    expect(document.querySelector('.admin-hero-hud-card--controls.is-bg-grey')).toBeTruthy();
    expect(document.querySelector('.admin-hero-hud-card--controls.is-bg-blue')).toBeNull();
  });

  it('propagates a selected color through the real Hero block editor callback', () => {
    const onSettingChange = vi.fn();

    render(createElement(HeroBlockEditor, {
      block: {
        id: 'hero',
        kind: 'hero',
        settings: {
          line1Text: 'Hero copy.',
          line1ClassName: 'is-super-grey',
          line1HighlightsJson: '',
          line2Text: 'Second line.',
          line2ClassName: 'is-super-grey',
          line2HighlightsJson: '',
        },
        editableFields: [],
      },
      selection: { line: 'line1', start: 0, end: 4, text: 'Hero' },
      onSettingChange,
    }));

    fireEvent.click(screen.getByRole('radio', { name: /Mango \(apply to selection\)/ }));

    expect(onSettingChange).toHaveBeenCalledWith('line1HighlightsJson', '[{"start":0,"end":4,"className":"is-mango","text":"Hero"}]');
  });

  it('uses the valid canonical padding default and keeps top and bottom sliders independent', () => {
    const onPaddingTopRemChange = vi.fn();
    const onPaddingBottomRemChange = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{ key: 'line1', label: 'Line 1', text: 'Canonical padding.', lineColor: '', highlights: [] }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      onPaddingTopRemChange,
      onPaddingBottomRemChange,
    }));

    const top = screen.getByLabelText('Hero top padding');
    const bottom = screen.getByLabelText('Hero bottom padding');
    expect(top.value).toBe('2.5');
    expect(bottom.value).toBe('2.5');
    expect(top.step).toBe('0.25');
    expect(bottom.step).toBe('0.25');
    expect(top.closest('label')?.textContent).toContain('2.50rem');
    expect(bottom.closest('label')?.textContent).toContain('2.50rem');

    fireEvent.change(top, { target: { value: '2.75' } });
    expect(onPaddingTopRemChange).toHaveBeenCalledWith(2.75);
    expect(onPaddingBottomRemChange).not.toHaveBeenCalled();

    fireEvent.change(bottom, { target: { value: '2.25' } });
    expect(onPaddingBottomRemChange).toHaveBeenCalledWith(2.25);
    expect(onPaddingTopRemChange).toHaveBeenCalledTimes(1);
  });

  it('renders stored highlight colors in the visible line mirror', () => {
    const { container } = render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [{ start: 24, end: 29, className: 'is-mango' }],
      }],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
    }));

    expect(container.querySelector('.admin-hero-hud-live-heading mark.is-mango')?.textContent).toBe('faith');
  });

  it('keeps the hero line preview visible and applies the stored full-line color', () => {
    const onPaddingTopRemChange = vi.fn();
    const onPaddingBottomRemChange = vi.fn();
    const { container } = render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Visible hero text.',
        lineColor: 'is-mango',
        displayClassName: 'is-mango',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      paddingTopRem: 2.5,
      paddingBottomRem: 2.5,
      onPaddingTopRemChange,
      onPaddingBottomRemChange,
    }));

    const preview = container.querySelector('.admin-hero-hud-live-heading');
    expect(preview?.textContent).toBe('Visible hero text.');
    expect(preview?.classList.contains('admin-hero-inline-line-mirror')).toBe(false);
    expect(preview?.classList.contains('is-mango')).toBe(true);

    fireEvent.change(screen.getByLabelText('Hero top padding'), { target: { value: '4.5' } });
    fireEvent.change(screen.getByLabelText('Hero bottom padding'), { target: { value: '5.5' } });
    expect(onPaddingTopRemChange).toHaveBeenCalledWith(4.5);
    expect(onPaddingBottomRemChange).toHaveBeenCalledWith(5.5);
  });

  it('uses the line color fallback in the preview without forcing public headline size', () => {
    const { container } = render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Compact hero preview.',
        lineColor: 'is-mango',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 9,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
    }));

    const preview = container.querySelector('.admin-hero-hud-live-heading');
    expect(preview?.classList.contains('is-mango')).toBe(true);
    expect(preview?.getAttribute('style') || '').not.toContain('font-size');
  });

  it('passes the current highlighted input range to the color callback', () => {
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-atlantean', label: 'Atlantean', swatch: '#00adbb' },
      ],
      onApplySelectionColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);

    const swatch = screen.getByRole('radio', { name: /Atlantean/ });
    fireEvent.mouseDown(swatch);
    fireEvent.click(swatch);

    expect(onApplySelectionColor).toHaveBeenCalledWith(
      'line1',
      'is-atlantean',
      expect.objectContaining({ start: 24, end: 29, text: 'faith' }),
    );
  });

  it('uses a selection captured by the inline hero preview when the HUD editor opens', () => {
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: { line: 'line1', start: 24, end: 29, text: 'faith' },
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-mango', label: 'Mango', swatch: '#faa31a' },
      ],
      onApplySelectionColor,
    }));

    fireEvent.click(screen.getByRole('radio', { name: /Mango \(apply to selection\)/ }));

    expect(onApplySelectionColor).toHaveBeenCalledWith(
      'line1',
      'is-mango',
      expect.objectContaining({ start: 24, end: 29, text: 'faith' }),
    );
  });

  it('keeps a highlighted range when the browser collapses it before palette mousedown', () => {
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-mango', label: 'Mango', swatch: '#faa31a' },
      ],
      onApplySelectionColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);
    fireEvent.mouseUp(input);
    input.setSelectionRange(0, 0);

    const swatch = screen.getByRole('radio', { name: /Mango/ });
    fireEvent.mouseDown(swatch);
    fireEvent.click(swatch);

    expect(onApplySelectionColor).toHaveBeenCalledWith(
      'line1',
      'is-mango',
      expect.objectContaining({ start: 24, end: 29, text: 'faith' }),
    );
  });

  it('keeps a highlighted range when palette mousedown is skipped', () => {
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-mango', label: 'Mango', swatch: '#faa31a' },
      ],
      onApplySelectionColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);
    fireEvent.mouseUp(input);
    input.setSelectionRange(0, 0);

    fireEvent.click(screen.getByRole('radio', { name: /Mango/ }));

    expect(onApplySelectionColor).toHaveBeenCalledWith(
      'line1',
      'is-mango',
      expect.objectContaining({ start: 24, end: 29, text: 'faith' }),
    );
  });

  it('clears the selection transaction after applying a selection color', () => {
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-melon', label: 'Melon', swatch: '#f26660' },
      ],
      onApplySelectionColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);
    fireEvent.mouseUp(input);
    fireEvent.click(screen.getByRole('radio', { name: /Melon \(apply to selection\)/ }));

    expect(onApplySelectionColor).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('radio', { name: /Melon \(apply to selection\)/ })).toBeNull();
    expect(screen.getByRole('radio', { name: /Melon \(apply to Line 1\)/ })).toBeTruthy();
  });

  it('clears a selection on outside click so a core color affects the whole line', () => {
    const onApplyLineColor = vi.fn();
    const onApplySelectionColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-atlantean', label: 'Atlantean', swatch: '#00adbb' },
      ],
      onApplyLineColor,
      onApplySelectionColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);
    fireEvent.mouseUp(input);
    fireEvent.pointerDown(document.body);

    const coreColor = screen.getByRole('radio', { name: /Atlantean \(apply to Line 1\)/ });
    fireEvent.click(coreColor);

    expect(onApplyLineColor).toHaveBeenCalledWith('line1', 'is-atlantean');
    expect(onApplySelectionColor).not.toHaveBeenCalled();
  });

  it('clears a selection when the line text is edited', () => {
    const onApplyLineColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Every trip is a step of faith.',
        lineColor: 'is-super-grey',
        highlights: [],
      }],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-atlantean', label: 'Atlantean', swatch: '#00adbb' },
      ],
      onApplyLineColor,
    }));

    const input = screen.getByLabelText('Line 1 text');
    input.focus();
    input.setSelectionRange(24, 29);
    fireEvent.select(input);
    fireEvent.change(input, { target: { value: 'Edited line text.' } });

    fireEvent.click(screen.getByRole('radio', { name: /Atlantean \(apply to Line 1\)/ }));

    expect(onApplyLineColor).toHaveBeenCalledWith('line1', 'is-atlantean');
  });

  it('clears a selection when focus moves to another Hero line', () => {
    const onApplyLineColor = vi.fn();

    render(createElement(HeroHudEditorPanel, {
      lines: [
        { key: 'line1', label: 'Line 1', text: 'First line.', lineColor: 'is-super-grey', highlights: [] },
        { key: 'line2', label: 'Line 2', text: 'Second line.', lineColor: 'is-super-grey', highlights: [] },
      ],
      activeLineKey: 'line1',
      selection: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [
        { value: 'is-atlantean', label: 'Atlantean', swatch: '#00adbb' },
      ],
      onApplyLineColor,
    }));

    const lineOne = screen.getByLabelText('Line 1 text');
    lineOne.focus();
    lineOne.setSelectionRange(0, 5);
    fireEvent.select(lineOne);
    fireEvent.focus(screen.getByLabelText('Line 2 text'));

    fireEvent.click(screen.getByRole('radio', { name: /Atlantean \(apply to Line 1\)/ }));

    expect(onApplyLineColor).toHaveBeenCalledWith('line1', 'is-atlantean');
  });

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

    expect(screen.getByText('Headline Tracking')).toBeTruthy();
    expect(screen.getByText('0.040em')).toBeTruthy();
    expect(document.querySelectorAll('.admin-billboard-editor-slider strong')).toHaveLength(5);
    expect(document.querySelectorAll('.admin-front-hud-range-controls > input:not([type="range"])')).toHaveLength(0);

    const range = screen.getAllByRole('slider')[2];
    fireEvent.change(range, { target: { value: '-0.03' } });
    expect(onTitleLetterSpacingChange).toHaveBeenCalledWith(-0.03);
  });

  it('shows color selection badges and clear spans without line navigation controls', () => {
    render(createElement(HeroHudEditorPanel, {
      lines: [{
        key: 'line1',
        label: 'Line 1',
        text: 'Plan ahead',
        lineColor: 'is-atlantean',
        highlights: [{ start: 0, end: 4, className: 'is-mango' }],
      }],
      activeLineKey: 'line1',
      selection: null,
      driftReport: null,
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
    }));

    const lineColorControls = document.querySelector('.admin-hero-hud-line-color-controls');
    expect(lineColorControls).toBeTruthy();
    expect(lineColorControls?.querySelector('.admin-front-hud-hero-span-chip-list')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show span details' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Go to .*spans/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Line 1 \(1 spans\)/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear spans' })).toBeTruthy();
  });

  it('keeps line one and line two color palettes mounted when the active line changes', () => {
    const { rerender } = render(createElement(HeroHudEditorPanel, {
      lines: [
        { key: 'line1', label: 'Line 1', text: 'Faith and finance', lineColor: 'is-atlantean', highlights: [] },
        { key: 'line2', label: 'Line 2', text: 'Plan ahead', lineColor: 'is-mango', highlights: [] },
      ],
      activeLineKey: 'line1',
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [{ value: 'is-mango', label: 'Mango', swatch: '#faa31a' }],
    }));

    expect(screen.getByLabelText('Hero color controls')).toBeTruthy();
    expect(screen.getByLabelText('Line 2 color controls')).toBeTruthy();

    rerender(createElement(HeroHudEditorPanel, {
      lines: [
        { key: 'line1', label: 'Line 1', text: 'Faith and finance', lineColor: 'is-atlantean', highlights: [] },
        { key: 'line2', label: 'Line 2', text: 'Plan ahead', lineColor: 'is-mango', highlights: [] },
      ],
      activeLineKey: 'line2',
      bgTone: 'white',
      justify: 'center',
      titleSizeRem: 7,
      titleLetterSpacingEm: 0,
      lineHeight: 0.9,
      lineColorOptions: [{ value: 'is-mango', label: 'Mango', swatch: '#faa31a' }],
    }));

    expect(screen.getByLabelText('Hero color controls')).toBeTruthy();
    expect(screen.getByLabelText('Line 2 color controls')).toBeTruthy();
    expect(screen.queryByText('Heading')).toBeNull();
    expect(screen.queryByText('Appearance')).toBeNull();
  });
});
