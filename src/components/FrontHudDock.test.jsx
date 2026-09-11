import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FrontHudDock from './FrontHudDock';

const panels = [
  { id: 'hero', label: 'Hero', icon: '/hero.svg' },
  { id: 'draft', label: 'Draft block', isHidden: true },
];

describe('FrontHudDock', () => {
  it('owns shared dock chrome while delegating route behavior to callbacks', () => {
    const onPanelOpen = vi.fn();
    const onPanelClose = vi.fn();
    const onToggleIconsOnly = vi.fn();
    const onClose = vi.fn();
    const getDockTabDragProps = vi.fn((panelId) => ({ 'data-drag-panel': panelId }));

    render(
      <FrontHudDock
        panels={panels}
        activePanelId="hero"
        isCollapsed={false}
        isIconsOnly
        panelAriaLabelPrefix="Edit "
        panelTitlePrefix="Edit "
        onPanelOpen={onPanelOpen}
        onPanelClose={onPanelClose}
        onToggleIconsOnly={onToggleIconsOnly}
        onClose={onClose}
        getDockTabDragProps={getDockTabDragProps}
      />,
    );

    const heroTab = screen.getByRole('button', { name: 'Edit Hero' });
    const hiddenTab = screen.getByRole('button', { name: 'Edit Draft block (hidden from visitors)' });
    expect(heroTab.className).toContain('is-active');
    expect(heroTab.getAttribute('title')).toBe('Edit Hero');
    expect(hiddenTab.getAttribute('title')).toBe('Edit Draft block — hidden from visitors');
    expect(heroTab.getAttribute('data-drag-panel')).toBe('hero');

    fireEvent.click(heroTab);
    expect(onPanelClose).toHaveBeenCalledWith(panels[0]);

    fireEvent.click(hiddenTab);
    expect(onPanelOpen).toHaveBeenCalledWith(panels[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Show HUD panel names' }));
    expect(onToggleIconsOnly).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Hide panels' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(getDockTabDragProps).toHaveBeenCalledWith('hero');
    expect(getDockTabDragProps).toHaveBeenCalledWith('draft');
  });

  it('renders icon fallback and hover label only for icon-only docks', () => {
    const onDockHoverLabelChange = vi.fn();
    render(
      <FrontHudDock
        panels={[{ id: 'cta', label: 'CTA form' }]}
        isIconsOnly
        onDockHoverLabelChange={onDockHoverLabelChange}
        dockHoverLabel={{ id: 'cta', top: 42, label: 'CTA form' }}
      />,
    );

    expect(screen.getByText('C')).toBeTruthy();
    const hoverLabel = screen.getAllByText('CTA form').find((element) => element.className === 'admin-front-hud-dock-hover-label');
    expect(hoverLabel?.style.top).toBe('42px');
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'CTA form' }));
    expect(onDockHoverLabelChange).toHaveBeenCalledWith(null);
  });
});
