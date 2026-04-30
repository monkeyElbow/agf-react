import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminHtmlEditor, { HTML_EDITOR_COLOR_SWATCHES, normalizeHtmlEditorSemanticColors } from './AdminHtmlEditor';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminHtmlEditor', () => {
  it('uses the standard brand token hex values for html text colors', () => {
    const byId = new Map(HTML_EDITOR_COLOR_SWATCHES.map((swatch) => [swatch.id, swatch.value]));

    expect(byId.get('atlantean')).toBe('#00adbb');
    expect(byId.get('mango')).toBe('#faa31a');
    expect(byId.get('melon')).toBe('#f26660');
    expect(byId.get('super-grey')).toBe('#414042');
    expect(byId.get('white')).toBe('#ffffff');
  });

  it('applies text color with css-inline styling before foreColor', () => {
    const execCommand = vi.fn();
    document.execCommand = execCommand;

    render(createElement(AdminHtmlEditor, {
      value: '<p>Newsletter copy</p>',
      onChange: () => {},
      compact: true,
    }));

    fireEvent.click(screen.getByRole('radio', { name: 'Melon' }));

    expect(execCommand).toHaveBeenCalledWith('styleWithCSS', false, true);
    expect(execCommand).toHaveBeenCalledWith('foreColor', false, '#f26660');
  });

  it('normalizes supported html color markup into semantic classes that survive runtime sanitizing', () => {
    expect(
      normalizeHtmlEditorSemanticColors('<p><span style="color: rgb(0, 173, 187);">Blue</span> <font color="#f26660">Melon</font></p>'),
    ).toBe('<p><span class="is-atlantean">Blue</span> <span class="is-melon">Melon</span></p>');
  });

  it('keeps only the supported left, center, and right alignment controls', () => {
    const execCommand = vi.fn();
    document.execCommand = execCommand;

    render(createElement(AdminHtmlEditor, {
      value: '<p>Newsletter copy</p>',
      onChange: () => {},
      compact: true,
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Center' }));
    fireEvent.click(screen.getByRole('button', { name: 'Right' }));

    expect(screen.queryByRole('button', { name: 'Justify' })).toBeNull();
    expect(execCommand).toHaveBeenCalledWith('justifyLeft', false, null);
    expect(execCommand).toHaveBeenCalledWith('justifyCenter', false, null);
    expect(execCommand).toHaveBeenCalledWith('justifyRight', false, null);
  });

  it('does not resync the visual editor innerHTML while the contenteditable surface is focused', () => {
    const view = render(createElement(AdminHtmlEditor, {
      value: '<p>Alpha</p>',
      onChange: () => {},
      compact: true,
    }));

    const editorSurface = view.container.querySelector('.admin-html-editor-surface');
    expect(editorSurface).toBeTruthy();

    editorSurface.focus();
    expect(document.activeElement).toBe(editorSurface);

    view.rerender(createElement(AdminHtmlEditor, {
      value: '<p>Beta</p>',
      onChange: () => {},
      compact: true,
    }));

    expect(editorSurface.innerHTML).toBe('<p>Alpha</p>');
  });

  it('normalizes visual editor input with a single DOM parse pass', () => {
    const parseSpy = vi.spyOn(DOMParser.prototype, 'parseFromString');
    const onChange = vi.fn();
    const view = render(createElement(AdminHtmlEditor, {
      value: '<p>Alpha</p>',
      onChange,
      compact: true,
    }));

    const editorSurface = view.container.querySelector('.admin-html-editor-surface');
    expect(editorSurface).toBeTruthy();

    editorSurface.innerHTML = '<p><span style="color: rgb(0, 173, 187);">Blue</span></p>';
    fireEvent.input(editorSurface);

    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('<p><span class="is-atlantean">Blue</span></p>');
  });
});
