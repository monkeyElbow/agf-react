import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TopStripHudEditorPanel from './TopStripHudEditorPanel';

const BG_OPTIONS = [
  { value: 'grey', label: 'Grey', swatch: '#414042' },
];

const TEXT_OPTIONS = [
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

const LOGIN_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Grey', swatch: '#414042' },
];

const RATES_TONE_OPTIONS = [
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

function renderPanel(settings = {}, onSettingChange = vi.fn()) {
  return render(
    <TopStripHudEditorPanel
      settings={settings}
      onSettingChange={onSettingChange}
      bgOptions={BG_OPTIONS}
      textOptions={TEXT_OPTIONS}
      loginToneOptions={LOGIN_TONE_OPTIONS}
      ratesToneOptions={RATES_TONE_OPTIONS}
    />,
  );
}

describe('TopStripHudEditorPanel', () => {
  it('exposes the top strip groups through the reference editor rail', () => {
    renderPanel();

    expect(screen.getByRole('navigation', { name: 'Top strip editor sections' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Strip' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Secure Login' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Phone + Rates' })).toBeTruthy();
  });

  it('shows the full shared palette for rates link color', () => {
    renderPanel({
      ratesButtonTone: 'mango',
    });

    const palette = screen.getByRole('radiogroup', { name: 'Top strip rates link color' });
    expect(within(palette).getAllByRole('radio')).toHaveLength(5);
    expect(within(palette).getByRole('radio', { name: 'Melon' })).toBeTruthy();
    expect(within(palette).getByRole('radio', { name: 'Super Grey' })).toBeTruthy();
    expect(within(palette).getByRole('radio', { name: 'White' })).toBeTruthy();
  });

  it('expands login button color choices only when outline is selected', () => {
    const onSettingChange = vi.fn();
    const { rerender } = renderPanel({
      loginButtonStyle: 'solid',
      loginButtonTone: 'atlantean',
    }, onSettingChange);

    let palette = screen.getByRole('radiogroup', { name: 'Top strip login button color' });
    expect(within(palette).getAllByRole('radio')).toHaveLength(2);

    const loginStyleRow = screen.getByText('Login Button Style').closest('.admin-front-hud-row');
    fireEvent.click(within(loginStyleRow).getByRole('button', { name: 'outline' }));
    expect(onSettingChange).toHaveBeenCalledWith('loginButtonStyle', 'outline');

    rerender(
      <TopStripHudEditorPanel
        settings={{
          loginButtonStyle: 'outline',
          loginButtonTone: 'atlantean',
        }}
        onSettingChange={onSettingChange}
        bgOptions={BG_OPTIONS}
        textOptions={TEXT_OPTIONS}
        loginToneOptions={LOGIN_TONE_OPTIONS}
        ratesToneOptions={RATES_TONE_OPTIONS}
      />,
    );

    palette = screen.getByRole('radiogroup', { name: 'Top strip login button color' });
    expect(within(palette).getAllByRole('radio')).toHaveLength(5);
    expect(within(palette).getByRole('radio', { name: 'Mango' })).toBeTruthy();
    expect(within(palette).getByRole('radio', { name: 'Melon' })).toBeTruthy();
  });
});
