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
    expect(screen.getByRole('region', { name: 'Page content block preview' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));
    expect(screen.getByLabelText('Body HTML')).toBeTruthy();
  });

  it('loads legacy address copy into HUD HTML editor and promotes it on blur', () => {
    const onSettingChange = vi.fn();
    renderPanel({
      html: '<p></p>',
      addressTitle: 'Mail or fax completed forms to:',
      addressLines: 'AGFinancial Insurance\nPO Box 10263\nSpringfield, MO 65808-0263',
    }, onSettingChange);

    const editor = screen.getByRole('textbox', { name: 'HTML content' });
    expect(editor.textContent).toContain('Mail or fax completed forms to:');
    expect(editor.textContent).toContain('Springfield, MO 65808-0263');

    editor.innerHTML = '<p>Updated mail instructions.</p>';
    fireEvent.input(editor);
    fireEvent.blur(editor);

    expect(onSettingChange).toHaveBeenCalledWith('html', '<p>Updated mail instructions.</p>');
    expect(onSettingChange).toHaveBeenCalledWith('addressTitle', '');
    expect(onSettingChange).toHaveBeenCalledWith('addressLines', '');
  });

  it('loads legacy fineprint copy and promotes it to the editable html source', () => {
    const onSettingChange = vi.fn();
    renderPanel({
      html: '<p></p>',
      fineprint: 'AGFinancial is an equal opportunity employer.',
    }, onSettingChange);

    const editor = screen.getByRole('textbox', { name: 'HTML content' });
    expect(editor.textContent).toContain('AGFinancial is an equal opportunity employer.');

    editor.innerHTML = '<p>Updated careers copy.</p>';
    fireEvent.input(editor);
    fireEvent.blur(editor);

    expect(onSettingChange).toHaveBeenCalledWith('html', '<p>Updated careers copy.</p>');
    expect(onSettingChange).toHaveBeenCalledWith('fineprint', '');
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
    expect(screen.getByRole('slider', { name: 'Space before (rem)' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Content max width (px)' })).toBeTruthy();
    expect(screen.getByLabelText('Space before (rem) value')).toBeTruthy();
  });

  it('keeps Visual and HTML controls compact and maps advanced sliders to settings', () => {
    const onSettingChange = vi.fn();
    renderPanel({}, onSettingChange);

    const modeGroup = screen.getByRole('group', { name: 'Page content editor type' });
    expect(modeGroup.querySelectorAll('button')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Advanced layout' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Padding bottom (rem)' }), {
      target: { value: '3.5' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('paddingBottomRem', 3.5);
  });
});
