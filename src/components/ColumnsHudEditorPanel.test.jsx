import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ColumnsHudEditorPanel from './ColumnsHudEditorPanel';

void ColumnsHudEditorPanel;

describe('ColumnsHudEditorPanel', () => {
  it('shows one active column editor at a time and switches slots', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Title: 'Column one title',
          col1Body: 'Column one body',
          col2Title: 'Column two title',
          col2Body: 'Column two body',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    expect(screen.getByText(/editing column 1/i)).toBeTruthy();
    expect(screen.getByLabelText('Title').value).toBe('Column one title');
    expect(screen.queryByRole('button', { name: 'Col 3' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Col 2' }));

    expect(screen.getByText(/editing column 2/i)).toBeTruthy();
    expect(screen.getByLabelText('Title').value).toBe('Column two title');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated column two title' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('col2Title', 'Updated column two title');
  });

  it('adds a third column only when requested', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          columns: 'two',
          col1Title: 'Column one title',
          col2Title: 'Column two title',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Col 3' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add column' }));

    expect(onSettingChange).toHaveBeenCalledWith('columns', 'three');
    expect(onSettingChange).toHaveBeenCalledWith('col3Enabled', true);
  });

  it('defaults the active editor to column 1', () => {
    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Type: 'photo',
          col1ImageUrl: 'housing-photo.jpg',
          col2Type: 'text',
          col2Title: 'Ministers Housing Allowance',
          col2Body: 'This significant tax-saving benefit is available to retired ministers.',
        }}
        onSettingChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/editing column 1/i)).toBeTruthy();
    expect(screen.getByLabelText('Photo URL').value).toBe('housing-photo.jpg');
  });

  it('keeps the section intro fields separate from the column copy', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: 'Retirement tools',
          bodyHtml: '<p>Intro copy above the columns.</p>',
          columnsStyle: 'retirement',
          col1Type: 'photo',
          col1ImageUrl: 'housing-photo.jpg',
          col2Type: 'text',
          col2Title: 'Ministers Housing Allowance',
          col2Body: 'This significant tax-saving benefit is available to retired ministers.',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    expect(screen.getByText('Header + Body')).toBeTruthy();
    expect(screen.getByLabelText('Heading').value).toBe('Retirement tools');
    expect(screen.getByLabelText('Body HTML').value).toContain('Intro copy above the columns.');
    expect(screen.getByRole('radiogroup', { name: 'Columns heading color' })).toBeTruthy();
    expect(screen.queryByLabelText('Line 1')).toBeNull();
    expect(screen.queryByLabelText('Line 2')).toBeNull();

    fireEvent.change(screen.getByLabelText('Heading'), {
      target: { value: 'Updated intro heading' },
    });
    fireEvent.change(screen.getByLabelText('Body HTML'), {
      target: { value: '<p>Updated intro body</p>' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('title', 'Updated intro heading');
    expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Updated intro body</p>');
  });

  it('shows photo geometry controls on the selected photo column', () => {
    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Type: 'photo',
          col1ImageUrl: 'housing-photo.jpg',
          col2Type: 'text',
          col2Title: 'Ministers Housing Allowance',
        }}
        onSettingChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/photo width/i)).toBeTruthy();
    expect(screen.getByText(/photo radius/i)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Photo Shape' })).toBeTruthy();
  });

  it('renames photo-column text controls to label and caption', () => {
    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Type: 'photo',
          col1ImageUrl: 'housing-photo.jpg',
          col1Title: 'Retirement planning',
          col1Body: 'Guidance for long-term savings.',
        }}
        onSettingChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Photo Label').value).toBe('Retirement planning');
    expect(screen.getByLabelText('Photo Caption').value).toBe('Guidance for long-term savings.');
  });

  it('applies full-title color and clears column title spans', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Title: 'Housing allowance',
          col1TitleHighlightsJson: '[{"text":"allowance","className":"is-mango"}]',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Column 1 title color' })).getByRole('radio', { name: 'Blue' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear spans' }).at(-1));

    expect(onSettingChange).toHaveBeenCalledWith('col1TitleClassName', 'is-atlantean');
    expect(onSettingChange).toHaveBeenCalledWith('col1TitleHighlightsJson', '');
  });

  it('applies a selection color to the active column title text range', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Title: 'Housing allowance',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const titleInput = screen.getByLabelText('Title');
    titleInput.focus();
    titleInput.setSelectionRange(8, 17);
    fireEvent.select(titleInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Column 1 title color' }))
        .getByRole('radio', { name: 'Blue' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'col1TitleHighlightsJson',
      '[{"start":8,"end":17,"className":"is-atlantean","text":"allowance"}]',
    );
  });

  it('treats the main title swatch row as a selection color control when title text is selected', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Title: 'Housing allowance',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const titleInput = screen.getByLabelText('Title');
    titleInput.focus();
    titleInput.setSelectionRange(8, 17);
    fireEvent.select(titleInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Column 1 title color' }))
        .getByRole('radio', { name: 'Blue' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'col1TitleHighlightsJson',
      '[{"start":8,"end":17,"className":"is-atlantean","text":"allowance"}]',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('col1TitleClassName', 'is-atlantean');
  });

  it('ignores stale page selection text and applies the core title color when there is no active input selection', () => {
    const onSettingChange = vi.fn();
    const originalGetSelection = window.getSelection;
    const pageTitle = document.createElement('h3');
    pageTitle.setAttribute('data-columns-selection-key', 'col1Title');
    pageTitle.textContent = 'Housing allowance';
    document.body.appendChild(pageTitle);
    const pageTitleTextNode = pageTitle.firstChild;
    window.getSelection = vi.fn(() => ({
      toString: () => 'allowance',
      anchorNode: pageTitleTextNode,
      focusNode: pageTitleTextNode,
    }));

    try {
      render(
        <ColumnsHudEditorPanel
          settings={{
            col1Title: 'Housing allowance',
          }}
          onSettingChange={onSettingChange}
        />,
      );

      fireEvent.click(
        within(screen.getByRole('radiogroup', { name: 'Column 1 title color' }))
          .getByRole('radio', { name: 'Blue' }),
      );

      expect(onSettingChange).toHaveBeenCalledWith('col1TitleClassName', 'is-atlantean');
      expect(onSettingChange).not.toHaveBeenCalledWith(
        'col1TitleHighlightsJson',
        '[{"start":8,"end":17,"className":"is-atlantean","text":"allowance"}]',
      );
    } finally {
      window.getSelection = originalGetSelection;
      pageTitle.remove();
    }
  });

  it('shows heading span chips and clears heading spans', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: 'Ministers Housing Allowance',
          titleHighlightsJson: '[{"text":"Housing","className":"is-atlantean"}]',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    expect(screen.getByRole('button', { name: /“Housing”/i })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear spans' })[0]);

    expect(onSettingChange).toHaveBeenCalledWith('titleHighlightsJson', '');
  });

  it('applies a heading selection color to the selected text range', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: 'Ministers Housing Allowance',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const headingInput = screen.getByLabelText('Heading');
    headingInput.focus();
    headingInput.setSelectionRange(10, 17);
    fireEvent.select(headingInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Columns heading color' }))
        .getByRole('radio', { name: 'Blue' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'titleHighlightsJson',
      '[{"start":10,"end":17,"className":"is-atlantean","text":"Housing"}]',
    );
  });

  it('writes sandstone as the core heading color without remapping it', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: 'Ministers Housing Allowance',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Columns heading color' }))
        .getByRole('radio', { name: 'Sandstone' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('titleClassName', 'is-sandstone');
  });

  it('writes sandstone as the selected heading span color without remapping it', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: 'Ministers Housing Allowance',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const headingInput = screen.getByLabelText('Heading');
    headingInput.focus();
    headingInput.setSelectionRange(10, 17);
    fireEvent.select(headingInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Columns heading color' }))
        .getByRole('radio', { name: 'Sandstone' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'titleHighlightsJson',
      '[{"start":10,"end":17,"className":"is-sandstone","text":"Housing"}]',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('titleClassName', 'is-atlantean');
  });

  it('wires the active column width share control', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          col1Title: 'Column one title',
          col2Title: 'Column two title',
          col1WidthShare: 1.25,
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.change(screen.getAllByRole('spinbutton').at(-1), {
      target: { value: '1.55' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('col1WidthShare', 1.55);
  });
});
