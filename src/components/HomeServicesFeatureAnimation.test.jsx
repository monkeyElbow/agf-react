import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext.jsx');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
      getBlockCollaboration: () => null,
      devIdentity: null,
    }),
  };
});

import PageBlocksRenderer from './blocks/PageBlocksRenderer';

function createBlock() {
  return {
    id: 'home_services_feature_animation',
    kind: 'site_feature',
    mode: 'dynamic',
    settings: {
      featureId: 'home_services_feature_animation',
      headline: 'Bold, smart steps.',
    },
  };
}

function mockMatchMedia({ reducedMotion = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

describe('HomeServicesFeatureAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia({ reducedMotion: false });
    window.innerHeight = 1200;
    vi.stubGlobal('requestAnimationFrame', (callback) => window.setTimeout(() => callback(Date.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (timerId) => window.clearTimeout(timerId));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the five home service panels with the expected buttons and no eyebrow labels', async () => {
    const { container } = render(
      <MemoryRouter>
        <PageBlocksRenderer blocks={[createBlock()]} />
      </MemoryRouter>,
    );

    const panels = Array.from(container.querySelectorAll('.home-services-feature-panel'));
    panels.forEach((panel, index) => {
      const topOffset = 740 + (index * 180);
      panel.getBoundingClientRect = () => ({
        top: topOffset,
        bottom: topOffset + 620,
        left: 0,
        right: 1280,
        width: 1280,
        height: 620,
        x: 0,
        y: topOffset,
        toJSON: () => ({}),
      });
    });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(80);
    });

    expect(screen.getByRole('heading', { name: 'Bold, smart steps.' })).toBeTruthy();
    expect(screen.getByText("Let's connect your faith & finances.")).toBeTruthy();
    expect(panels).toHaveLength(5);
    expect(panels.map((panel) => panel.querySelector('.home-services-feature-panel-title')?.textContent)).toEqual([
      'Loans',
      'Investments',
      'Retirement',
      'Legacy Giving',
      'Insurance',
    ]);
    expect(screen.getByRole('heading', { name: 'Loans' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Retirement' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Investments' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Legacy Giving' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore options' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Learn & strategize' }).getAttribute('href')).toBe('/services/legacy-giving');
    expect(screen.getByRole('link', { name: 'Start here' }).getAttribute('href')).toBe('/services/insurance');
    expect(container.querySelector('.home-services-feature-panel-eyebrow')).toBeNull();

    expect(panels[1]?.querySelector('.home-services-feature-panel-title')?.textContent).toBe('Investments');
    expect(panels[1]?.querySelector('.home-services-feature-panel-body')?.textContent).toContain('Your returns grow while supporting ministries.');
    expect(panels[1]?.querySelector('.home-services-feature-panel-action a')?.getAttribute('href')).toBe('/services/investments');
    expect(panels[1]?.querySelector('.home-services-feature-panel-action a')?.textContent).toBe('See rates');

    expect(panels[2]?.querySelector('.home-services-feature-panel-title')?.textContent).toBe('Retirement');
    expect(panels[2]?.querySelector('.home-services-feature-panel-body')?.textContent).toContain('Time is your ally.');
    expect(panels[2]?.querySelector('.home-services-feature-panel-action a')?.getAttribute('href')).toBe('/services/retirement');
    expect(panels[2]?.querySelector('.home-services-feature-panel-action a')?.textContent).toBe('Get started');

    expect(panels[0]?.style.getPropertyValue('--home-services-light-strength')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-panel-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-content-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-content-scale')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-action-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-action-scale')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-base-rgb')).toBe('0, 30, 48');
    expect(panels[0]?.style.getPropertyValue('--home-services-secondary-rgb')).toBe('0, 138, 171');
    expect(panels[0]?.style.getPropertyValue('--home-services-light-rgb')).toBe('0, 173, 187');
    expect(panels[0]?.style.getPropertyValue('--home-services-accent-rgb')).toBe('216, 251, 255');
    expect(panels[0]?.style.getPropertyValue('--home-services-next-base-rgb')).toBe('0, 57, 70');
    expect(panels[0]?.style.getPropertyValue('--home-services-next-secondary-rgb')).toBe('0, 173, 187');
    expect(panels[0]?.style.getPropertyValue('--home-services-next-light-rgb')).toBe('75, 199, 212');
    expect(panels[0]?.style.getPropertyValue('--home-services-palette-handoff')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-dark-angle')).toContain('deg');
  });

  it('clears scroll-driven vars when reduced motion is preferred', () => {
    mockMatchMedia({ reducedMotion: true });

    const { container } = render(
      <MemoryRouter>
        <PageBlocksRenderer blocks={[createBlock()]} />
      </MemoryRouter>,
    );

    const shell = container.querySelector('.home-services-feature-shell');
    const firstPanel = container.querySelector('.home-services-feature-panel');

    expect(shell?.getAttribute('data-scroll-gradient-motion')).toBe('reduced');
    expect(firstPanel?.getAttribute('data-scroll-gradient-motion')).toBe('reduced');
    expect(firstPanel?.style.getPropertyValue('--home-services-light-strength')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-panel-opacity')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-content-opacity')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-content-scale')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-action-opacity')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-action-scale')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--home-services-base-rgb')).toBe('0, 30, 48');
    expect(firstPanel?.style.getPropertyValue('--home-services-secondary-rgb')).toBe('0, 138, 171');
    expect(firstPanel?.style.getPropertyValue('--home-services-light-rgb')).toBe('0, 173, 187');
    expect(firstPanel?.style.getPropertyValue('--home-services-dark-rgb')).toBe('0, 20, 30');
    expect(firstPanel?.style.getPropertyValue('--home-services-accent-rgb')).toBe('216, 251, 255');
    expect(firstPanel?.style.getPropertyValue('--home-services-next-base-rgb')).toBe('0, 57, 70');
    expect(firstPanel?.style.getPropertyValue('--home-services-next-secondary-rgb')).toBe('0, 173, 187');
    expect(firstPanel?.style.getPropertyValue('--home-services-next-light-rgb')).toBe('75, 199, 212');
    expect(firstPanel?.style.getPropertyValue('--home-services-next-dark-rgb')).toBe('7, 19, 27');
    expect(firstPanel?.style.getPropertyValue('--home-services-next-accent-rgb')).toBe('216, 251, 255');
    expect(firstPanel?.style.getPropertyValue('--home-services-palette-handoff')).toBe('0');
  });

  it('drives panel and content opacity from entrance to peak and back down on exit', () => {
    const rectState = { top: window.innerHeight, height: 620 };

    const { container } = render(
      <MemoryRouter>
        <PageBlocksRenderer blocks={[createBlock()]} />
      </MemoryRouter>,
    );

    const firstPanel = container.querySelector('.home-services-feature-panel');
    expect(firstPanel).toBeTruthy();

    firstPanel.getBoundingClientRect = () => ({
      top: rectState.top,
      bottom: rectState.top + rectState.height,
      left: 0,
      right: 1280,
      width: 1280,
      height: rectState.height,
      x: 0,
      y: rectState.top,
      toJSON: () => ({}),
    });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(80);
    });

    expect(firstPanel?.style.getPropertyValue('--home-services-panel-opacity')).toBe('0.180');
    expect(firstPanel?.style.getPropertyValue('--home-services-content-opacity')).toBe('0.160');
    expect(firstPanel?.style.getPropertyValue('--home-services-action-opacity')).toBe('0.420');

    rectState.top = 320;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(80);
    });

    expect(firstPanel?.style.getPropertyValue('--home-services-panel-opacity')).toBe('1.000');
    expect(firstPanel?.style.getPropertyValue('--home-services-content-opacity')).toBe('1.000');
    expect(firstPanel?.style.getPropertyValue('--home-services-action-opacity')).toBe('1.000');

    rectState.top = -rectState.height;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(80);
    });

    expect(firstPanel?.style.getPropertyValue('--home-services-panel-opacity')).toBe('0.180');
    expect(firstPanel?.style.getPropertyValue('--home-services-content-opacity')).toBe('0.160');
    expect(firstPanel?.style.getPropertyValue('--home-services-action-opacity')).toBe('0.548');
  });
});
