import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDoTheMathBadge } from './PageBlocksRenderer';

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
});
