import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.queryByRole('region', { name: 'Page content block preview' })).toBeNull();
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

  it('shows the numeric Page Content controls as sliders', () => {
    const onSettingChange = vi.fn();

    renderPanel({}, onSettingChange);

    expect(screen.getByRole('slider', { name: 'Body font size (rem)' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Content max width (px)' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Space before (rem)' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Advanced layout' })).toBeNull();
  });

  it('maps the body font-size slider into the saved setting', () => {
    const onSettingChange = vi.fn();

    renderPanel({}, onSettingChange);

    fireEvent.change(screen.getByRole('slider', { name: 'Body font size (rem)' }), {
      target: { value: '1.45' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('bodyFontSizeRem', 1.45);
  });

  it('keeps slider number inputs available for precise values', () => {
    renderPanel();

    expect(screen.getByLabelText('Space before (rem) value')).toBeTruthy();
  });

  it('keeps Visual and HTML controls compact and maps advanced sliders to settings', () => {
    const onSettingChange = vi.fn();
    renderPanel({}, onSettingChange);

    const modeGroup = screen.getByRole('group', { name: 'Page content editor type' });
    expect(modeGroup.querySelectorAll('button')).toHaveLength(2);

    fireEvent.change(screen.getByRole('slider', { name: 'Padding bottom (rem)' }), {
      target: { value: '3.5' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('paddingBottomRem', 3.5);
  });
});
