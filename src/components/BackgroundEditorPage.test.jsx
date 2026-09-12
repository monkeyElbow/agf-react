import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(container.querySelector('[data-editor-field-id="bgTone"]')).not.toBeNull();
    expect(container.querySelector('.admin-background-editor-page__surface > .admin-swatch-list.admin-standard-swatch-palette')).not.toBeNull();
    expect(container.querySelectorAll('.admin-background-editor-page__surface .admin-swatch-option')).toHaveLength(SURFACE_BG_TONE_OPTIONS.length);
    expect(container.querySelectorAll('.admin-background-light-card')).toHaveLength(3);
  });

  it('keeps the universal background label when a block supplies a custom descriptor', () => {
    const { container } = render(
      <BackgroundEditorPage
        backgroundTone="white"
        backgroundToneOptions={[{ value: 'white', label: 'Grid background', swatch: '#fff' }]}
        backgroundToneLabel="Grid background"
        backgroundEffectsJson=""
        onBackgroundToneChange={vi.fn()}
        onBackgroundEffectsChange={vi.fn()}
        paletteVariant="admin"
      />,
    );

    expect(container.querySelector('.admin-background-editor-page__surface > .admin-swatch-list[aria-label="Background color"]')).not.toBeNull();
  });

  it('reactivates a light when turning on a saved effect with no active slots', () => {
    const onBackgroundEffectsChange = vi.fn();
    render(
      <BackgroundEditorPage
        backgroundTone="white"
        backgroundToneOptions={SURFACE_BG_TONE_OPTIONS}
        backgroundEffectsJson={JSON.stringify({
          enabled: false,
          lights: [{ id: 'light-1', enabled: false, tone: 'blue' }],
        })}
        onBackgroundEffectsChange={onBackgroundEffectsChange}
      />,
    );

    fireEvent.click(screen.getByRole('group', { name: 'Enable background lights' }).querySelector('button:last-child'));

    const nextEffects = JSON.parse(onBackgroundEffectsChange.mock.calls[0][0]);
    expect(nextEffects.enabled).toBe(true);
    expect(nextEffects.lights[0].enabled).toBe(true);
  });
});
