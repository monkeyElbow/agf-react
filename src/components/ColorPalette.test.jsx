import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ColorPalette from './ColorPalette';
import { STANDARD_ADMIN_PALETTE_CLASS, STANDARD_HUD_PALETTE_CLASS } from '../lib/paletteStandards';

describe('ColorPalette standard palette contract', () => {
  it('automatically tags hud palettes with the standard palette class', () => {
    render(ColorPalette({
      variant: 'hud',
      ariaLabel: 'HUD colors',
      options: [{ value: 'blue', label: 'Blue', swatch: '#00adbb' }],
      value: 'blue',
      onChange: vi.fn(),
    }));

    expect(screen.getByRole('radiogroup', { name: 'HUD colors' }).className).toContain(STANDARD_HUD_PALETTE_CLASS);
  });

  it('automatically tags icon-only admin palettes with the standard palette class', () => {
    render(ColorPalette({
      variant: 'admin',
      ariaLabel: 'Admin colors',
      className: 'is-compact is-icon-only',
      showLabels: false,
      options: [{ value: 'blue', label: 'Blue', swatch: '#00adbb' }],
      value: 'blue',
      onChange: vi.fn(),
    }));

    expect(screen.getByRole('radiogroup', { name: 'Admin colors' }).className).toContain(STANDARD_ADMIN_PALETTE_CLASS);
  });

  it('marks explicit clear options for the shared X treatment without treating defaults as clear', () => {
    render(ColorPalette({
      variant: 'hud',
      ariaLabel: 'Text colors',
      options: [
        { value: '', label: 'Default', swatch: '#fff' },
        { value: '', label: 'Clear marked spans', hideSwatch: true, isClear: true },
      ],
    }));

    const palette = screen.getByRole('radiogroup', { name: 'Text colors' });
    expect(palette.querySelectorAll('.is-clear')).toHaveLength(1);
    expect(palette.querySelector('.is-clear')?.getAttribute('aria-label')).toBe('Clear marked spans');
  });
});
