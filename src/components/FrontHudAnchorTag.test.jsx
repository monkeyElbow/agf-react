import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import FrontHudAnchorTag from './FrontHudAnchorTag';

const serviceNativeCss = readFileSync(
  path.resolve(__dirname, '../styles/front-hud.css'),
  'utf8',
);

describe('FrontHudAnchorTag', () => {
  it('renders the block icon and name together in one compact control', () => {
    const onClick = vi.fn();
    render(
      <FrontHudAnchorTag
        label="Request Form"
        icon="/icons/request-form.svg"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole('button', { name: 'Open Request Form HUD panel' });
    expect(button.querySelector('.admin-front-hud-anchor-icon-image')?.getAttribute('src')).toBe('/icons/request-form.svg');
    expect(button.querySelector('.admin-front-hud-anchor-name')?.textContent).toBe('Request Form');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders structure controls below the block name badge', () => {
    render(
      <FrontHudAnchorTag
        label="Billboard"
        onClick={() => {}}
        structureControls={<div data-testid="block-structure-controls">controls</div>}
      />,
    );

    const anchor = screen.getByRole('button', { name: 'Open Billboard HUD panel' }).parentElement;
    expect(anchor?.querySelector('[data-testid="block-structure-controls"]')).not.toBeNull();
  });

  it('keeps block name badges above ownership and dimming overlays', () => {
    expect(serviceNativeCss).toContain('/* Keep block names visible and clickable above every block overlay. */');
    expect(serviceNativeCss).toMatch(/\.admin-front-hud-layer\s*\{[\s\S]*?z-index: 1000;/);
    expect(serviceNativeCss).toMatch(/\.admin-front-hud-anchor\s*\{[\s\S]*?z-index: 1001;/);
  });

  it('keeps the Intro workflow action row explicitly above the editor', () => {
    expect(serviceNativeCss).toMatch(
      /\.admin-front-hud-tool-content:has\(\.admin-hud-editor-shell--intro\) > \.admin-front-hud-page-workflow\.is-dock-inline \{[\s\S]*?order: -10;[\s\S]*?position: static;/,
    );
  });
});
