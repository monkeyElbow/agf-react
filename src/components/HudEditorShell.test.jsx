import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  HudEditorFooter,
  HudEditorHeader,
  HudEditorMain,
  HudEditorSection,
  HudEditorSettingsRail,
  HudEditorShell,
} from './HudEditorShell';

describe('HudEditorShell primitives', () => {
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
});
