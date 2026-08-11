import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentAdminContext } from '../context/ContentAdminContext';
import FrontHudStructureControls from './FrontHudStructureControls';

describe('FrontHudStructureControls', () => {
  it('adds above or below the anchored block and moves that block in page order', () => {
    const addBlock = vi.fn();
    const moveBlock = vi.fn();

    render(
      <ContentAdminContext.Provider value={{
        availableBlockTemplates: [{
          templateId: 'intro',
          kind: 'intro',
          mode: 'dynamic',
          name: 'Intro',
          description: 'Intro content',
          settings: {},
        }],
        authoringBlocksByPath: {
          '/test': [{ id: 'hero' }, { id: 'billboard' }, { id: 'cta_form' }],
        },
        addBlock,
        moveBlock,
        getBlockCollaboration: () => null,
        devIdentity: { userId: 'admin' },
      }}>
        <FrontHudStructureControls pathname="/test" blockId="billboard" />
      </ContentAdminContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add block above billboard' }));
    const picker = screen.getByRole('listbox', { name: 'Choose a block to add' });
    fireEvent.click(within(picker).getByRole('option', { name: /Intro/ }));
    expect(addBlock).toHaveBeenCalledWith('/test', 'intro', 1);

    fireEvent.click(screen.getByRole('button', { name: 'Add block below billboard' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Choose a block to add' })).getByRole('option', { name: /Intro/ }));
    expect(addBlock).toHaveBeenCalledWith('/test', 'intro', 2);

    fireEvent.click(screen.getByRole('button', { name: 'Move billboard up' }));
    expect(moveBlock).toHaveBeenCalledWith('/test', 'billboard', 'up');
  });

  it('toggles the add picker closed when the active add button is clicked again', () => {
    render(
      <ContentAdminContext.Provider value={{
        availableBlockTemplates: [{
          templateId: 'intro',
          kind: 'intro',
          mode: 'dynamic',
          name: 'Intro',
          description: 'Intro content',
          settings: {},
        }],
        authoringBlocksByPath: {
          '/test': [{ id: 'hero' }, { id: 'billboard' }, { id: 'cta_form' }],
        },
        addBlock: vi.fn(),
        moveBlock: vi.fn(),
        getBlockCollaboration: () => null,
        devIdentity: { userId: 'admin' },
      }}>
        <FrontHudStructureControls pathname="/test" blockId="billboard" />
      </ContentAdminContext.Provider>,
    );

    const addAbove = screen.getByRole('button', { name: 'Add block above billboard' });
    const addBelow = screen.getByRole('button', { name: 'Add block below billboard' });

    fireEvent.click(addAbove);
    expect(screen.getByRole('listbox', { name: 'Choose a block to add' })).toBeTruthy();
    expect(addAbove.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(addAbove);
    expect(screen.queryByRole('listbox', { name: 'Choose a block to add' })).toBeNull();
    expect(addAbove.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(addAbove);
    fireEvent.click(addBelow);
    expect(screen.getByRole('listbox', { name: 'Choose a block to add' })).toBeTruthy();
    expect(addAbove.getAttribute('aria-expanded')).toBe('false');
    expect(addBelow.getAttribute('aria-expanded')).toBe('true');
  });
});
