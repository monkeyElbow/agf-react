import { createElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IntroHudEditorPanel from './IntroHudEditorShared';

function renderPanel(props = {}) {
  return render(createElement(IntroHudEditorPanel, {
    heading: 'Invest like it matters. Because it does.',
    headingSelection: { start: 0, end: 0, text: '' },
    headingColor: '',
    textTone: 'dark',
    bgTone: 'sand',
    justify: 'center',
    lineSpacing: 1.04,
    ...props,
  }));
}

describe('IntroHudEditorPanel', () => {
  it('uses the same heading palette for core and selected text states', () => {
    const { rerender } = renderPanel();

    const corePalette = screen.getByRole('radiogroup', { name: 'Core Color' });
    expect(within(corePalette).getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(within(corePalette).getByRole('radio', { name: 'Sandstone' })).toBeTruthy();

    rerender(
      createElement(IntroHudEditorPanel, {
        heading: 'Invest like it matters. Because it does.',
        headingSelection: { start: 28, end: 35, text: 'se it d' },
        headingHighlightsJson: '[{"start":24,"end":39,"className":"is-atlantean","text":"Because it does"}]',
        headingColor: '',
        textTone: 'dark',
        bgTone: 'sand',
        justify: 'center',
        lineSpacing: 1.04,
      }),
    );

    const selectionPalette = screen.getByRole('radiogroup', { name: 'Selected Color "se it d"' });
    expect(within(selectionPalette).getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(within(selectionPalette).getByRole('radio', { name: 'Sandstone' })).toBeTruthy();
    expect(within(selectionPalette).getByRole('radio', { name: 'Blue' }).getAttribute('aria-checked')).toBe('true');
  });

  it('applies the first swatch click to the live selected letter, not the core heading', () => {
    const headingInputRef = { current: null };
    const onHeadingColorChange = vi.fn();
    const onHeadingSelectionColorChange = vi.fn();
    renderPanel({
      headingInputRef,
      onHeadingColorChange,
      onHeadingSelectionColorChange,
    });

    const headingInput = screen.getByRole('textbox', { name: 'Heading' });
    headingInputRef.current = headingInput;
    headingInput.selectionStart = 8;
    headingInput.selectionEnd = 9;

    const blueSwatch = within(screen.getByRole('radiogroup', { name: 'Core Color' }))
      .getByRole('radio', { name: 'Blue' });
    fireEvent.mouseDown(blueSwatch);
    fireEvent.click(blueSwatch);

    expect(onHeadingSelectionColorChange).toHaveBeenCalledWith('is-atlantean', {
      start: 8,
      end: 9,
      text: 'i',
    });
    expect(onHeadingColorChange).not.toHaveBeenCalled();
  });

  it('keeps sandstone available as an explicit intro heading preview color', () => {
    const { container } = renderPanel({ headingColor: 'is-sandstone' });

    const previewHeading = container.querySelector('.admin-intro-hud-live-heading');
    expect(previewHeading?.className).toContain('is-sandstone');
  });

  it('renders the intro heading as a live preview editor instead of a plain text input only', () => {
    renderPanel();

    expect(screen.getByRole('textbox', { name: 'Heading' })).toBeTruthy();
    expect(document.querySelector('.admin-intro-hud-live-heading')).toBeTruthy();
  });

  it('applies the selected intro background tone behind the heading preview', () => {
    const { container } = renderPanel({ bgTone: 'blue', textTone: 'white', justify: 'left' });

    expect(container.querySelector('.admin-intro-hud-heading-preview.is-bg-blue.is-text-white.is-justify-left')).toBeTruthy();
    expect(container.querySelector('.admin-front-hud-intro-body-editor.is-bg-blue.is-text-white')).toBeTruthy();
    expect(container.querySelector('.admin-intro-hud-card--body')?.className).not.toContain('is-bg-blue');
  });

  it('matches the preview heading color to the selected intro text tone when no swatch override is set', () => {
    const { container } = renderPanel({ textTone: 'white', headingColor: '' });

    expect(container.querySelector('.admin-intro-hud-live-heading')?.className).toContain('is-white');
  });

  it('matches the preview heading color to the blue intro text tone when no swatch override is set', () => {
    const { container } = renderPanel({ textTone: 'blue', headingColor: '' });

    expect(container.querySelector('.admin-intro-hud-live-heading')?.className).toContain('is-atlantean');
  });

  it('keeps an explicit heading swatch color over the intro text tone in preview', () => {
    const { container } = renderPanel({ textTone: 'white', headingColor: 'is-atlantean' });

    const previewHeading = container.querySelector('.admin-intro-hud-live-heading');
    expect(previewHeading.className).toContain('is-atlantean');
    expect(previewHeading.className).not.toContain('is-white');
  });

  it('exposes accent line typography controls and forwards slider changes', () => {
    const onSizeChange = vi.fn();
    const onSpaceBeforeChange = vi.fn();
    const onLineHeightChange = vi.fn();
    renderPanel({
      extraLine: 'What you do here truly matters.',
      extraLineSizeRem: 4.15,
      extraLineSpaceBeforeRem: 2.4,
      extraLineLineHeight: 0.94,
      onExtraLineSizeChange: onSizeChange,
      onExtraLineSpaceBeforeChange: onSpaceBeforeChange,
      onExtraLineLineHeightChange: onLineHeightChange,
    });

    fireEvent.change(screen.getByRole('slider', { name: 'Accent line size (rem)' }), {
      target: { value: '3.6' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Accent line space above (rem)' }), {
      target: { value: '1.8' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Accent line line height' }), {
      target: { value: '1.1' },
    });

    expect(onSizeChange).toHaveBeenCalledWith(3.6);
    expect(onSpaceBeforeChange).toHaveBeenCalledWith(1.8);
    expect(onLineHeightChange).toHaveBeenCalledWith(1.1);
    expect(screen.getByLabelText('Accent line size (rem) value')).toBeTruthy();
  });

  it('keeps the pilot compact by removing redundant section headers and notes', () => {
    const { container } = renderPanel();

    const sectionRail = screen.getByRole('navigation', { name: 'Intro editor sections' });
    expect(within(sectionRail).getByRole('button', { name: 'Heading' })).toBeTruthy();
    expect(within(sectionRail).getByRole('button', { name: 'Body' })).toBeTruthy();
    expect(within(sectionRail).queryByRole('button', { name: 'Layout' })).toBeNull();
    expect(within(sectionRail).queryByRole('button', { name: 'Actions' })).toBeNull();
    expect(screen.queryByText('Click body copy on page to jump here.')).toBeNull();
    expect(screen.queryByText('Optional line beneath the heading.')).toBeNull();
    expect(container.querySelector('.admin-intro-hud-heading-group')?.parentElement?.className).toContain('admin-intro-hud-heading-preview-column');
    expect(container.querySelector('.admin-intro-hud-accent-group')?.parentElement?.className).toContain('admin-intro-hud-heading-controls');
  });

  it('keeps the Intro color control free of redundant highlight guidance', () => {
    const { container } = renderPanel();

    expect(container.querySelector('.admin-front-hud-text-highlight-inline')).toBeNull();
    expect(container.querySelector('.admin-front-hud-note')).toBeNull();
  });

  it('places layout controls above heading text and keeps actions in the settings rail', () => {
    const { container } = renderPanel({ actionsSlot: <div data-testid="intro-actions-slot" /> });
    const actions = screen.getByTestId('intro-actions-slot');
    const layout = container.querySelector('.admin-intro-hud-layout-control-grid');
    const heading = container.querySelector('.admin-intro-hud-heading-group');

    expect(actions.parentElement?.className).toContain('admin-hud-editor-settings-rail');
    expect(layout?.parentElement?.parentElement?.className).toContain('admin-intro-hud-heading-controls');
    expect(heading?.compareDocumentPosition(layout)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the heading preview on the left and heading controls on the right', () => {
    const { container } = renderPanel();

    expect(container.querySelector('.admin-intro-hud-heading-page')).toBeTruthy();
    expect(container.querySelector('.admin-intro-hud-heading-preview-column')).toBeTruthy();
    expect(container.querySelector('.admin-intro-hud-heading-controls')).toBeTruthy();
  });

  it('keeps the actions page as one HUD group instead of nesting a second card', () => {
    const { container } = renderPanel({
      actionsSlot: (
        <>
          <div className="admin-intro-hud-action-groups">
            <section className="admin-intro-hud-action-group"><h4>Button 1</h4></section>
          </div>
        </>
      ),
    });

    const actionsPage = container.querySelector('.admin-hud-editor-actions-page');
    expect(actionsPage?.querySelector('.admin-front-hud-card')).toBeNull();
    expect(actionsPage?.querySelector('.admin-intro-hud-action-group')).toBeTruthy();
  });
});
