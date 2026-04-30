import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import useNativeEnhancements from './useNativeEnhancements';

function HookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'fade-test');

  return (
    <div ref={ref} className="service-native-page">
      <div data-testid="fade-0" className="fade-up">First</div>
      <div data-testid="fade-1" className="fade-up">Second</div>
    </div>
  );
}

function ForceObserveHookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'fade-force-test');

  return (
    <div ref={ref} className="service-native-page">
      <div data-testid="force-fade-0" className="fade-up fade-up-force-observe">First</div>
      <div data-testid="force-fade-1" className="fade-up fade-up-force-observe">Second</div>
    </div>
  );
}

void HookHarness;
void ForceObserveHookHarness;

describe('useNativeEnhancements fade-up reveal', () => {
  let observerCallback = null;
  let observedTargets = [];
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;
  let originalGetBoundingClientRect;

  beforeEach(() => {
    vi.useFakeTimers();
    observedTargets = [];
    observerCallback = null;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    window.requestAnimationFrame = (cb) => window.setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return {
        top: this.getAttribute('data-testid') === 'fade-0' ? 1200 : 1320,
        bottom: this.getAttribute('data-testid') === 'fade-0' ? 1300 : 1420,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: this.getAttribute('data-testid') === 'fade-0' ? 1200 : 1320,
        toJSON: () => ({}),
      };
    };

    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }

      observe(target) {
        observedTargets.push(target);
      }

      unobserve() {}

      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    vi.useRealTimers();
  });

  it('reveals intersecting fade-up nodes without waiting for earlier unseen siblings', () => {
    const { getByTestId } = render(<HookHarness />);
    const first = getByTestId('fade-0');
    const second = getByTestId('fade-1');

    expect(first.classList.contains('is-visible')).toBe(false);
    expect(second.classList.contains('is-visible')).toBe(false);
    expect(first.getAttribute('data-fade-state')).toBe('pending');
    expect(second.getAttribute('data-fade-state')).toBe('pending');
    expect(typeof observerCallback).toBe('function');
    expect(observedTargets).toHaveLength(2);

    observerCallback([
      {
        target: second,
        isIntersecting: true,
      },
    ]);

    vi.advanceTimersByTime(500);

    expect(second.classList.contains('is-visible')).toBe(true);
    expect(second.hasAttribute('data-fade-state')).toBe(false);
    expect(first.classList.contains('is-visible')).toBe(false);
  });

  it('shows initially visible fade-up nodes immediately on load', () => {
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return {
        top: this.getAttribute('data-testid') === 'fade-0' ? 40 : 120,
        bottom: this.getAttribute('data-testid') === 'fade-0' ? 140 : 220,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: this.getAttribute('data-testid') === 'fade-0' ? 40 : 120,
        toJSON: () => ({}),
      };
    };

    const { getByTestId } = render(<HookHarness />);

    expect(getByTestId('fade-0').classList.contains('is-visible')).toBe(true);
    expect(getByTestId('fade-1').classList.contains('is-visible')).toBe(true);
    expect(getByTestId('fade-0').hasAttribute('data-fade-state')).toBe(false);
    expect(getByTestId('fade-1').hasAttribute('data-fade-state')).toBe(false);
    expect(observedTargets).toHaveLength(0);
  });

  it('shows near-fold fade-up nodes immediately on load instead of leaving them queued', () => {
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return {
        top: this.getAttribute('data-testid') === 'fade-0' ? 760 : 840,
        bottom: this.getAttribute('data-testid') === 'fade-0' ? 900 : 980,
        left: 0,
        right: 0,
        width: 0,
        height: 140,
        x: 0,
        y: this.getAttribute('data-testid') === 'fade-0' ? 760 : 840,
        toJSON: () => ({}),
      };
    };

    const { getByTestId } = render(<HookHarness />);

    expect(getByTestId('fade-0').classList.contains('is-visible')).toBe(true);
    expect(getByTestId('fade-1').classList.contains('is-visible')).toBe(true);
    expect(getByTestId('fade-0').hasAttribute('data-fade-state')).toBe(false);
    expect(getByTestId('fade-1').hasAttribute('data-fade-state')).toBe(false);
    expect(observedTargets).toHaveLength(0);
  });

  it('keeps forced-observe fade-up nodes on the staggered reveal path even when initially visible', () => {
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return {
        top: this.getAttribute('data-testid') === 'force-fade-0' ? 40 : 120,
        bottom: this.getAttribute('data-testid') === 'force-fade-0' ? 140 : 220,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: this.getAttribute('data-testid') === 'force-fade-0' ? 40 : 120,
        toJSON: () => ({}),
      };
    };

    const { getByTestId } = render(<ForceObserveHookHarness />);
    const first = getByTestId('force-fade-0');
    const second = getByTestId('force-fade-1');

    expect(first.classList.contains('is-visible')).toBe(false);
    expect(second.classList.contains('is-visible')).toBe(false);
    expect(first.getAttribute('data-fade-state')).toBe('pending');
    expect(second.getAttribute('data-fade-state')).toBe('pending');
    expect(observedTargets).toHaveLength(2);
  });
});
