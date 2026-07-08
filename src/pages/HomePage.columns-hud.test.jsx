import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockBlocksByPath = {};
let mockUpdateBlockSetting = vi.fn();
let mockUpdateBlock = vi.fn();
let mockMoveBlock = vi.fn();
let mockRemoveBlock = vi.fn();
let mockMobileFrontHud = false;

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext');
  return {
    ...actual,
    inspectDynamicHeroSettings: () => ({ hasDrift: false, issues: [], normalizedSettings: {} }),
    normalizeDynamicHeroSettings: (_pathname, settings) => settings || {},
    useContentAdmin: () => ({
      blocksByPath: mockBlocksByPath,
      updateBlockSetting: mockUpdateBlockSetting,
      updateBlock: mockUpdateBlock,
      moveBlock: mockMoveBlock,
      removeBlock: mockRemoveBlock,
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: true, opacity: 15 }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../hooks/useLocalBlockDrafts', () => ({
  default: ({ blocks }) => ({
    blocks,
    stageLocalBlockSetting: (blockId, settingKey, nextValue) => {
      mockUpdateBlockSetting('/', blockId, settingKey, nextValue);
    },
    stageLocalBlockSettings: (blockId, settingsPatch) => {
      Object.entries(settingsPatch || {}).forEach(([settingKey, nextValue]) => {
        mockUpdateBlockSetting('/', blockId, settingKey, nextValue);
      });
    },
  }),
}));

vi.mock('../lib/heroDriftWarnings', () => ({
  logHeroDriftWarningOnce: () => {},
}));

vi.mock('../lib/heroRenderGuardrails', () => ({
  inspectHeroRender: () => ({ hasDrift: false, issues: [] }),
  logHeroRenderWarningOnce: () => {},
}));

vi.mock('../lib/heroHudMode', () => ({
  shouldRenderHeroInlineEditor: () => false,
}));

import HomePage from './HomePage';

void [MemoryRouter, HomePage];

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage columns HUD', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    mockBlocksByPath = {};
    mockUpdateBlockSetting = vi.fn();
    mockUpdateBlock = vi.fn();
    mockMoveBlock = vi.fn();
    mockRemoveBlock = vi.fn();
    mockMobileFrontHud = false;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 760px)' ? mockMobileFrontHud : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: query,
      onchange: null,
    }));
  });

  it('loads and updates the housing section intro separately from the column copy', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Housing intro heading',
            bodyHtml: '<p>Housing intro body</p>',
          },
        },
      ],
    };

    const { container } = renderHomePage();

    expect(screen.getByText('Housing intro heading')).toBeTruthy();
    expect(screen.getByText('Housing intro body')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Housing HUD panel' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open Housing HUD panel' }));

    expect(screen.getByLabelText('Title').value).toBe('Housing intro heading');
    expect(screen.getByLabelText('Body HTML (optional rich copy)').value).toContain('Housing intro body');
    expect(screen.getByLabelText('Lead Copy').value).toBe('');
    expect(screen.queryByLabelText('Line 1')).toBeNull();
    expect(screen.queryByLabelText('Line 2')).toBeNull();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated intro heading' },
    });
    fireEvent.blur(screen.getByLabelText('Title'));
    fireEvent.change(screen.getByLabelText('Body HTML (optional rich copy)'), {
      target: { value: '<p>Updated intro body</p>' },
    });
    fireEvent.blur(screen.getByLabelText('Body HTML (optional rich copy)'));
    expect(mockUpdateBlockSetting).toHaveBeenCalledWith('/', 'home_ministry_allies', 'title', 'Updated intro heading');
    expect(mockUpdateBlockSetting).toHaveBeenCalledWith('/', 'home_ministry_allies', 'bodyHtml', '<p>Updated intro body</p>');
  });

  it('keeps the desktop home HUD dock and per-block anchor behavior unchanged', () => {
    mockBlocksByPath = {
      '/': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Welcome',
            line2Text: 'Home',
          },
        },
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Housing intro heading',
            bodyHtml: '<p>Housing intro body</p>',
          },
        },
      ],
    };

    renderHomePage();

    expect(screen.getByLabelText('Front HUD editor panels')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Hero HUD panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Housing HUD panel' })).toBeTruthy();
    expect(screen.queryByLabelText('Hero mobile HUD actions')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open Hero HUD panel' }));

    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();
  });

  it('uses a selection-based mobile home HUD tray instead of the old anchor clutter', async () => {
    mockMobileFrontHud = true;
    mockBlocksByPath = {
      '/': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Welcome',
            line2Text: 'Home',
          },
        },
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Housing intro heading',
            bodyHtml: '<p>Housing intro body</p>',
          },
        },
      ],
    };

    const { container } = renderHomePage();

    expect(screen.queryByLabelText('Front HUD editor panels')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Hero HUD panel' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Housing HUD panel' })).toBeNull();
    expect(screen.queryByLabelText('Hero mobile HUD actions')).toBeNull();

    fireEvent.click(container.querySelector('[data-block-id="hero"]'));

    await waitFor(() => {
      expect(screen.getByLabelText('Hero mobile HUD actions')).toBeTruthy();
    });
    expect(container.querySelector('[data-block-id="hero"]')?.getAttribute('data-mobile-front-hud-selected')).toBe('');

    fireEvent.click(container.querySelector('[data-block-id="home_ministry_allies"]'));

    await waitFor(() => {
      expect(screen.getByLabelText('Housing mobile HUD actions')).toBeTruthy();
    });
    expect(container.querySelector('[data-block-id="home_ministry_allies"]')?.getAttribute('data-mobile-front-hud-selected')).toBe('');
    expect(container.querySelector('[data-block-id="hero"]')?.hasAttribute('data-mobile-front-hud-selected')).toBe(false);
  });

  it('keeps edit reachable from the mobile home HUD tray and reuses block actions', async () => {
    mockMobileFrontHud = true;
    mockBlocksByPath = {
      '/': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Welcome',
            line2Text: 'Home',
          },
        },
        {
          id: 'home_ministry_allies',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: 'Housing intro heading',
            bodyHtml: '<p>Housing intro body</p>',
          },
        },
      ],
    };

    const { container } = renderHomePage();

    fireEvent.click(container.querySelector('[data-block-id="hero"]'));
    await waitFor(() => {
      expect(screen.getByLabelText('Hero mobile HUD actions')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Hero mobile HUD actions')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Move Hero down' }));
    expect(mockMoveBlock).toHaveBeenCalledWith('/', 'hero', 'down');

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide block' }));
    expect(mockUpdateBlock).toHaveBeenCalledWith('/', 'hero', { hidden: true });

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete block' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(mockRemoveBlock).toHaveBeenCalledWith('/', 'hero');
  });
});
