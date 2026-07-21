import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ColumnsHudEditorPanel from './ColumnsHudEditorPanel';

function BufferedColumnsHarness({ initialSettings = {}, onSettingChange = vi.fn() }) {
  const [settings, setSettings] = useState(initialSettings);
  const [rerenderCount, setRerenderCount] = useState(0);

  const handleSettingChange = (key, value) => {
    onSettingChange(key, value);
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div>
      <button type="button" onClick={() => setRerenderCount((current) => current + 1)}>
        Force rerender
      </button>
      <span data-testid="rerender-count">{rerenderCount}</span>
      <ColumnsHudEditorPanel
        settings={settings}
        onSettingChange={handleSettingChange}
      />
    </div>
  );
}

describe('ColumnsHudEditorPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
    fireEvent.blur(screen.getByLabelText('Title'));

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
          col2Title: "Ministers' Housing Allowance.",
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
          col2Title: "Ministers' Housing Allowance.",
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
    fireEvent.blur(screen.getByLabelText('Heading'));
    fireEvent.blur(screen.getByLabelText('Body HTML'));

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
          col2Title: "Ministers' Housing Allowance.",
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
          title: "Ministers' Housing Allowance.",
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
          title: "Ministers' Housing Allowance.",
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const headingInput = screen.getByLabelText('Heading');
    headingInput.focus();
    headingInput.setSelectionRange(11, 18);
    fireEvent.select(headingInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Columns heading color' }))
        .getByRole('radio', { name: 'Blue' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'titleHighlightsJson',
      '[{"start":11,"end":18,"className":"is-atlantean","text":"Housing"}]',
    );
  });

  it('writes sandstone as the core heading color without remapping it', () => {
    const onSettingChange = vi.fn();

    render(
      <ColumnsHudEditorPanel
        settings={{
          title: "Ministers' Housing Allowance.",
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
          title: "Ministers' Housing Allowance.",
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const headingInput = screen.getByLabelText('Heading');
    headingInput.focus();
    headingInput.setSelectionRange(11, 18);
    fireEvent.select(headingInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Columns heading color' }))
        .getByRole('radio', { name: 'Sandstone' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'titleHighlightsJson',
      '[{"start":11,"end":18,"className":"is-sandstone","text":"Housing"}]',
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

  it('keeps text-like column fields stable across rerenders and commits them on blur', () => {
    const onSettingChange = vi.fn();

    render(
      <BufferedColumnsHarness
        initialSettings={{
          col1Title: 'Column one title',
          col1Body: 'Column one body',
          col1ImageUrl: '/images/original.jpg',
          col1ImageAlt: 'Original alt',
          col1ButtonLabel: 'Original button',
          col1ButtonUrl: '/original-path',
          col1ButtonPageRef: '/original-path',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    const titleInput = screen.getByLabelText('Title');
    const bodyInput = screen.getByLabelText('Body');

    fireEvent.change(titleInput, { target: { value: 'Draft title value' } });
    fireEvent.change(bodyInput, { target: { value: 'Draft body value' } });
    fireEvent.click(screen.getByText('Image'));
    fireEvent.change(screen.getByLabelText('Photo URL'), { target: { value: '/images/draft.jpg' } });
    fireEvent.change(screen.getByLabelText('Alt text'), { target: { value: 'Draft alt text' } });
    fireEvent.click(screen.getByText('Button'));
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Draft button' } });
    fireEvent.change(screen.getByLabelText('URL / path'), { target: { value: '/draft-path' } });
    fireEvent.click(screen.getByRole('button', { name: 'Force rerender' }));

    expect(screen.getByLabelText('Title').value).toBe('Draft title value');
    expect(screen.getByLabelText('Body').value).toBe('Draft body value');
    fireEvent.click(screen.getByText('Image'));
    expect(screen.getByLabelText('Photo URL').value).toBe('/images/draft.jpg');
    expect(screen.getByLabelText('Alt text').value).toBe('Draft alt text');
    fireEvent.click(screen.getByText('Button'));
    expect(screen.getByLabelText('Label').value).toBe('Draft button');
    expect(screen.getByLabelText('URL / path').value).toBe('/draft-path');
    expect(onSettingChange).not.toHaveBeenCalledWith('col1Title', 'Draft title value');

    fireEvent.blur(screen.getByLabelText('Title'));
    fireEvent.blur(screen.getByLabelText('Body'));
    fireEvent.click(screen.getByText('Image'));
    fireEvent.blur(screen.getByLabelText('Photo URL'));
    fireEvent.blur(screen.getByLabelText('Alt text'));
    fireEvent.click(screen.getByText('Button'));
    fireEvent.blur(screen.getByLabelText('Label'));
    fireEvent.blur(screen.getByLabelText('URL / path'));

    expect(onSettingChange).toHaveBeenCalledWith('col1Title', 'Draft title value');
    expect(onSettingChange).toHaveBeenCalledWith('col1Body', 'Draft body value');
    expect(onSettingChange).toHaveBeenCalledWith('col1ImageUrl', '/images/draft.jpg');
    expect(onSettingChange).toHaveBeenCalledWith('col1ImageAlt', 'Draft alt text');
    expect(onSettingChange).toHaveBeenCalledWith('col1ButtonLabel', 'Draft button');
    expect(onSettingChange).toHaveBeenCalledWith(
      'col1ButtonLinkJson',
      '{"kind":"internal","openInNewWindow":false,"to":"/draft-path"}',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonUrl', '/draft-path');
    expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonPageRef', '/draft-path');
  });

  it('clears column button page refs for manual external URLs', () => {
    const onSettingChange = vi.fn();

    render(
      <BufferedColumnsHarness
        initialSettings={{
          col1Title: 'Column one title',
          col1Body: 'Column one body',
          col1ButtonLabel: 'Original button',
          col1ButtonUrl: '/original-path',
          col1ButtonPageRef: '/original-path',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.click(screen.getByText('Button'));
    fireEvent.change(screen.getByLabelText('URL / path'), {
      target: { value: 'https://example.com/resource' },
    });
    fireEvent.blur(screen.getByLabelText('URL / path'));

    expect(onSettingChange).toHaveBeenCalledWith(
      'col1ButtonLinkJson',
      '{"kind":"external","openInNewWindow":false,"href":"https://example.com/resource"}',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonPageRef', '');
    expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonUrl', 'https://example.com/resource');
  });

  it('keeps section heading and body drafts stable and commits them on blur without debounce commits', () => {
    const onSettingChange = vi.fn();

    render(
      <BufferedColumnsHarness
        initialSettings={{
          title: 'Retirement tools',
          bodyHtml: '<p>Intro copy above the columns.</p>',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Heading'), {
      target: { value: 'Draft intro heading' },
    });
    fireEvent.change(screen.getByLabelText('Body HTML'), {
      target: { value: '<p>Draft intro body</p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Force rerender' }));

    expect(screen.getByLabelText('Heading').value).toBe('Draft intro heading');
    expect(screen.getByLabelText('Body HTML').value).toBe('<p>Draft intro body</p>');
    expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft intro heading');
    expect(onSettingChange).not.toHaveBeenCalledWith('bodyHtml', '<p>Draft intro body</p>');

    vi.runAllTimers();

    expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft intro heading');
    expect(onSettingChange).not.toHaveBeenCalledWith('bodyHtml', '<p>Draft intro body</p>');

    fireEvent.blur(screen.getByLabelText('Heading'));
    fireEvent.blur(screen.getByLabelText('Body HTML'));

    expect(onSettingChange).toHaveBeenCalledWith('title', 'Draft intro heading');
    expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Draft intro body</p>');
  });

  it('keeps discrete controls immediate while text inputs stay buffered', () => {
    const onSettingChange = vi.fn();

    render(
      <BufferedColumnsHarness
        initialSettings={{
          col1Title: 'Column one title',
          col1ButtonLabel: 'Original button',
          col1ButtonStyle: 'blue',
        }}
        onSettingChange={onSettingChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Buffered title draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Photo' }));

    expect(onSettingChange).toHaveBeenCalledWith('col1Type', 'photo');
    expect(onSettingChange).not.toHaveBeenCalledWith('col1Title', 'Buffered title draft');
  });
});
