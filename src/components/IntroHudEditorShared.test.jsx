import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IntroHudEditorPanel from './IntroHudEditorShared';

function renderPanel(props = {}) {
  return render(IntroHudEditorPanel({
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
      IntroHudEditorPanel({
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

    const selectionPalette = screen.getByRole('radiogroup', { name: 'Selection Color "se it d"' });
    expect(within(selectionPalette).getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(within(selectionPalette).getByRole('radio', { name: 'Sandstone' })).toBeTruthy();
    expect(within(selectionPalette).getByRole('radio', { name: 'Blue' }).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps sandstone available as an explicit intro heading preview color', () => {
    const { container } = renderPanel({ headingColor: 'is-sandstone' });

    const previewHeading = container.querySelector('.admin-intro-hud-live-heading');
    expect(previewHeading?.className).toContain('is-sandstone');
  });

  it('renders the intro heading as a live preview editor instead of a plain text input only', () => {
    renderPanel();

    expect(screen.getByLabelText('Heading')).toBeTruthy();
    expect(document.querySelector('.admin-intro-hud-live-heading')).toBeTruthy();
  });

  it('applies the selected intro background tone behind the heading preview', () => {
    const { container } = renderPanel({ bgTone: 'blue', textTone: 'white', justify: 'left' });

    expect(container.querySelector('.admin-intro-hud-heading-preview.is-bg-blue.is-text-white.is-justify-left')).toBeTruthy();
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
});
