import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  HudEditorFooter,
  HudEditorHeader,
  HudEditorMain,
  HudEditorModelLayout,
  HudEditorSection,
  HudEditorSettingsRail,
  HudEditorShell,
  appendHudBlockOptionsSection,
} from './HudEditorShell';

describe('HudEditorShell primitives', () => {
  it('keeps one background page immediately before block options', () => {
    const sections = appendHudBlockOptionsSection([
      { id: 'content', label: 'Content' },
      { id: 'background', label: 'Background' },
      { id: 'content-2', label: 'More content' },
      { id: 'background', label: 'Duplicate background' },
    ], <div />);

    expect(sections.map((section) => section.id)).toEqual([
      'content',
      'content-2',
      'background',
      'block',
    ]);
  });

  it('provides reusable semantic regions for a block editor', () => {
    render(
      <HudEditorShell className="is-pilot">
        <HudEditorHeader>Block name</HudEditorHeader>
        <HudEditorMain>Main content</HudEditorMain>
        <HudEditorSettingsRail>Settings</HudEditorSettingsRail>
        <HudEditorSection label="Advanced settings">Section</HudEditorSection>
        <HudEditorFooter>Save draft</HudEditorFooter>
      </HudEditorShell>,
    );

    expect(document.querySelector('.admin-hud-editor-shell.is-pilot')).toBeTruthy();
    expect(screen.getByText('Block name').className).toContain('admin-hud-editor-header');
    expect(screen.getByText('Main content').className).toContain('admin-hud-editor-main');
    expect(screen.getByText('Settings').className).toContain('admin-hud-editor-settings-rail');
    expect(screen.getByRole('region', { name: 'Advanced settings' })).toBeTruthy();
    expect(screen.getByText('Save draft').className).toContain('admin-hud-editor-footer');
  });

  it('switches editor pages with guarded number shortcuts', () => {
    const onSectionChange = vi.fn();
    render(
      <HudEditorModelLayout
        sections={[
          { id: 'content', label: 'Content', icon: '1' },
          { id: 'appearance', label: 'Appearance', icon: '2' },
          { id: 'cards', label: 'Cards', icon: '3' },
          { id: 'options', label: 'Options', icon: '4' },
          { id: 'advanced', label: 'Advanced', icon: '5' },
        ]}
        activeSection="content"
        onSectionChange={onSectionChange}
      >
        <div>
          <input aria-label="Text field" />
          <textarea aria-label="Text area" />
          <select aria-label="Select field" defaultValue="one">
            <option value="one">One</option>
          </select>
          <input aria-label="Range field" type="range" />
          <button type="button">Editor button</button>
          <div contentEditable aria-label="Rich text field" />
        </div>
      </HudEditorModelLayout>,
    );

    expect(screen.getByRole('button', { name: 'Appearance' }).getAttribute('title')).toBe('Appearance (2)');
    expect(screen.getByRole('button', { name: 'Appearance' }).getAttribute('aria-keyshortcuts')).toBe('2');

    fireEvent.keyDown(document.body, { key: '2' });
    expect(onSectionChange).toHaveBeenLastCalledWith('appearance');

    fireEvent.keyDown(document.body, { key: '5' });
    expect(onSectionChange).toHaveBeenLastCalledWith('advanced');

    onSectionChange.mockClear();
    [
      screen.getByLabelText('Text field'),
      screen.getByLabelText('Text area'),
      screen.getByLabelText('Select field'),
      screen.getByLabelText('Range field'),
      screen.getByRole('button', { name: 'Editor button' }),
      screen.getByLabelText('Rich text field'),
    ].forEach((control) => {
      fireEvent.keyDown(control, { key: '3' });
    });
    fireEvent.keyDown(document.body, { key: '4', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: '0' });
    fireEvent.keyDown(document.body, { key: '6' });

    expect(onSectionChange).not.toHaveBeenCalled();
  });

  it('assigns single-key shortcuts dynamically through page nine', () => {
    const onSectionChange = vi.fn();
    const sections = Array.from({ length: 10 }, (_, index) => ({
      id: `page-${index + 1}`,
      label: `Page ${index + 1}`,
      icon: String(index + 1),
    }));

    render(
      <HudEditorModelLayout
        sections={sections}
        activeSection="page-1"
        onSectionChange={onSectionChange}
      >
        <div />
      </HudEditorModelLayout>,
    );

    expect(screen.getByRole('button', { name: 'Page 9' }).getAttribute('title'))
      .toBe('Page 9 (9)');
    expect(screen.getByRole('button', { name: 'Page 9' }).getAttribute('aria-keyshortcuts'))
      .toBe('9');
    expect(screen.getByRole('button', { name: 'Page 10' }).getAttribute('title'))
      .toBe('Page 10');
    expect(screen.getByRole('button', { name: 'Page 10' }).getAttribute('aria-keyshortcuts'))
      .toBeNull();

    fireEvent.keyDown(document.body, { key: '9' });
    expect(onSectionChange).toHaveBeenCalledWith('page-9');

    onSectionChange.mockClear();
    fireEvent.keyDown(document.body, { key: '0' });
    fireEvent.keyDown(document.body, { key: '9', shiftKey: true });
    expect(onSectionChange).not.toHaveBeenCalled();
  });
});
