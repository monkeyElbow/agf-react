import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contentBlockBlueprintsByPath } from '../../data/contentBlockBlueprints';
import PageBlocksRenderer, { HomeDoTheMathBadge } from './PageBlocksRenderer';

vi.mock('../../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

describe('HomeDoTheMathBadge', () => {
  let badgeRect;
  let originalInnerHeight;
  let originalGetBoundingClientRect;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    badgeRect = {
      top: 900,
      bottom: 1000,
      height: 100,
      left: 0,
      right: 100,
      width: 100,
    };
    originalInnerHeight = window.innerHeight;
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 1000,
    });
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return this.getAttribute('data-home-math-badge') === 'true'
        ? badgeRect
        : originalGetBoundingClientRect.call(this);
    };
    window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
    window.cancelAnimationFrame = (frameId) => window.clearTimeout(frameId);
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('IntersectionObserver', class MockIntersectionObserver {
      observe() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  function flushBadgeFrames() {
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
  }

  it('re-arms the press animation when scrolling out of and back into the press window', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeDoTheMathBadge />
      </MemoryRouter>,
    );

    const badge = container.querySelector('[data-home-math-badge="true"]');
    expect(badge?.getAttribute('data-home-math-press-cycle')).toBe('0');

    act(() => {
      badgeRect = { ...badgeRect, top: 700, bottom: 800 };
      window.dispatchEvent(new Event('scroll'));
      flushBadgeFrames();
    });

    expect(badge?.getAttribute('data-home-math-press-cycle')).toBe('1');

    act(() => {
      badgeRect = { ...badgeRect, top: 50, bottom: 150 };
      window.dispatchEvent(new Event('scroll'));
      flushBadgeFrames();
    });

    act(() => {
      badgeRect = { ...badgeRect, top: 700, bottom: 800 };
      window.dispatchEvent(new Event('scroll'));
      flushBadgeFrames();
    });

    expect(badge?.getAttribute('data-home-math-press-cycle')).toBe('2');
  });

  it('renders a spawned retirement do-the-math billboard with portable class and badge', () => {
    const sourceBlock = contentBlockBlueprintsByPath['/services/retirement']
      .find((block) => block?.id === 'columns_math');
    const spawnedBlock = {
      ...JSON.parse(JSON.stringify(sourceBlock)),
      id: 'columns_math_2',
    };

    const { container } = render(
      <MemoryRouter>
        <PageBlocksRenderer
          blocks={[spawnedBlock]}
        />
      </MemoryRouter>,
    );

    const section = container.querySelector('[data-block-id="columns_math_2"]');
    expect(section?.className).toContain('retirement-do-the-math-billboard');
    expect(section?.querySelector('[data-home-math-badge="true"]')).toBeTruthy();
  });

  it('renders a spawned loans Vision Fuel billboard with its native billboard spacing classes', () => {
    const sourceBlock = contentBlockBlueprintsByPath['/services/loans']
      .find((block) => block?.id === 'vision_fuel');
    const spawnedBlock = {
      ...JSON.parse(JSON.stringify(sourceBlock)),
      id: 'vision_fuel_2',
    };

    const { container } = render(
      <MemoryRouter>
        <PageBlocksRenderer
          blocks={[spawnedBlock]}
        />
      </MemoryRouter>,
    );

    const section = container.querySelector('[data-block-id="vision_fuel_2"]');
    expect(section?.className).toContain('dynamic-billboard');
    expect(section?.className).toContain('loans-native-vision-fuel');
  });
});
