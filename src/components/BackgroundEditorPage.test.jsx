import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackgroundEditorPage from './BackgroundEditorPage';
import { SURFACE_BG_TONE_OPTIONS } from '../lib/colorSystem';

describe('BackgroundEditorPage', () => {
  it('keeps surface controls flat and uses standard circular background swatches', () => {
    const { container } = render(
      <BackgroundEditorPage
        backgroundTone="white"
        backgroundToneOptions={SURFACE_BG_TONE_OPTIONS}
        backgroundEffectsJson=""
        onBackgroundToneChange={vi.fn()}
        onBackgroundEffectsChange={vi.fn()}
        paletteVariant="admin"
      />,
    );

    expect(screen.queryByText('Choose the base color for this block.')).toBeNull();
    expect(container.querySelector('.admin-background-editor-page__surface > .admin-swatch-list.admin-standard-swatch-palette')).not.toBeNull();
    expect(container.querySelectorAll('.admin-background-editor-page__surface .admin-swatch-option')).toHaveLength(SURFACE_BG_TONE_OPTIONS.length);
    expect(container.querySelectorAll('.admin-background-light-card')).toHaveLength(3);
  });
});
