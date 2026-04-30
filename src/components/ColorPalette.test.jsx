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
});
