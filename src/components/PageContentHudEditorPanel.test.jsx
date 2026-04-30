import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PageContentHudEditorPanel from './PageContentHudEditorPanel';

function renderPanel(settings = {}, onSettingChange = vi.fn()) {
  return render(
    <PageContentHudEditorPanel
      block={{
        id: 'page_content',
        kind: 'content',
        settings,
      }}
      onSettingChange={onSettingChange}
    />,
  );
}

describe('PageContentHudEditorPanel', () => {
  it('opens in the visual editor by default and keeps html mode available', () => {
    renderPanel({ html: '<p>Page content body.</p>' });

    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));
    expect(screen.getByLabelText('Body HTML')).toBeTruthy();
  });

  it('maps width presets onto the existing max-width field', () => {
    const onSettingChange = vi.fn();

    renderPanel({}, onSettingChange);

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Page content width presets' }))
        .getByRole('button', { name: 'Wide' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('contentMaxWidthPx', 1200);
  });

  it('maps spacing presets onto the existing spacing and padding fields', () => {
    const onSettingChange = vi.fn();

    renderPanel({}, onSettingChange);

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Page content spacing presets' }))
        .getByRole('button', { name: 'Relaxed' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('spaceBeforeRem', 1);
    expect(onSettingChange).toHaveBeenCalledWith('spaceAfterRem', 1);
    expect(onSettingChange).toHaveBeenCalledWith('paddingTopRem', 3.25);
    expect(onSettingChange).toHaveBeenCalledWith('paddingBottomRem', 3.25);
  });

  it('keeps advanced raw controls available without showing them by default', () => {
    renderPanel();

    expect(screen.queryByLabelText('Space before (rem)')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Advanced layout' }));
    expect(screen.getByLabelText('Space before (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Content max width (px)')).toBeTruthy();
  });
});
