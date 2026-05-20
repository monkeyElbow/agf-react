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
      headline: 'Bold, smart steps. Together.',
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

    expect(screen.getByRole('heading', { name: 'Bold, smart steps. Together.' })).toBeTruthy();
    expect(panels).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Loans' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Retirement' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Investments' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Legacy Giving' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore options' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('/services/retirement');
    expect(screen.getByRole('link', { name: 'See rates' }).getAttribute('href')).toBe('/services/investments');
    expect(screen.getByRole('link', { name: 'Learn & strategize' }).getAttribute('href')).toBe('/services/legacy-giving');
    expect(screen.getByRole('link', { name: 'Start here' }).getAttribute('href')).toBe('/services/insurance');
    expect(container.querySelector('.home-services-feature-panel-eyebrow')).toBeNull();

    expect(panels[0]?.style.getPropertyValue('--home-services-light-strength')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-panel-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-content-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-content-scale')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-action-opacity')).not.toBe('');
    expect(panels[0]?.style.getPropertyValue('--home-services-action-scale')).not.toBe('');
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

    expect(firstPanel?.style.getPropertyValue('--home-services-panel-opacity')).toBe('0.960');
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
