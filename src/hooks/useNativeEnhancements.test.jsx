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
      <div data-testid="force-fade-0" className="fade-up fade-up-force-observe fade-up-fail-open">First</div>
      <div data-testid="force-fade-1" className="fade-up fade-up-force-observe fade-up-fail-open">Second</div>
    </div>
  );
}

function RepeatObserveHookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'fade-repeat-test');

  return (
    <div ref={ref} className="service-native-page">
      <div
        data-testid="repeat-fade-0"
        className="fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up"
        data-fade-root-margin="0px 0px -20% 0px"
      >
        Replay
      </div>
    </div>
  );
}

function ExplicitDelayHookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'fade-explicit-delay-test');

  return (
    <div ref={ref} className="service-native-page">
      <div
        data-testid="delay-fade-0"
        className="fade-up fade-up-force-observe fade-up-repeat-observe"
        data-fade-delay-ms="0"
      >
        First
      </div>
      <div
        data-testid="delay-fade-1"
        className="fade-up fade-up-force-observe fade-up-repeat-observe"
        data-fade-delay-ms="240"
      >
        Second
      </div>
    </div>
  );
}

function FadeOutHookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'fade-out-test');

  return (
    <div ref={ref} className="service-native-page">
      <div data-testid="fade-out-default" className="fade-out">Default</div>
      <div
        data-testid="fade-out-custom"
        className="fade-out"
        data-fade-out-start-vh="0.02"
        data-fade-out-end-vh="-0.22"
        data-scroll-enter-start-vh="1.2"
        data-scroll-enter-end-vh="0.8"
      >
        Custom
      </div>
    </div>
  );
}

function CssHeroAnimationHookHarness() {
  const ref = useRef(null);
  useNativeEnhancements(ref, 'css-hero-test');

  return (
    <div ref={ref} className="service-native-page">
      <section className="service-native-hero">
        <h1 data-testid="css-hero-line-1" className="line1 hero-anim-loans-unblur">Your investments.</h1>
        <h1 data-testid="css-hero-line-2" className="line2 hero-anim-loans-slide">Your faith.</h1>
      </section>
    </div>
  );
}

void HookHarness;
void ForceObserveHookHarness;
void RepeatObserveHookHarness;
void FadeOutHookHarness;
void CssHeroAnimationHookHarness;

describe('useNativeEnhancements fade-up reveal', () => {
  let observerCallback = null;
  let observerRootMargins = [];
  let observedTargets = [];
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;
  let originalGetBoundingClientRect;

  beforeEach(() => {
    vi.useFakeTimers();
    observedTargets = [];
    observerCallback = null;
    observerRootMargins = [];
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
      constructor(callback, options = {}) {
        observerCallback = callback;
        observerRootMargins.push(options.rootMargin || '0px');
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

  it('fails open for visible card targets when the observer does not report', () => {
    Element.prototype.getBoundingClientRect = function mockedRect() {
      return {
        top: 40,
        bottom: 140,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: 40,
        toJSON: () => ({}),
      };
    };

    const { getByTestId } = render(<ForceObserveHookHarness />);
    const first = getByTestId('force-fade-0');

    expect(first.getAttribute('data-fade-state')).toBe('pending');
    vi.advanceTimersByTime(500);

    expect(first.classList.contains('is-visible')).toBe(true);
    expect(first.hasAttribute('data-fade-state')).toBe(false);
  });

  it('uses a custom observer root margin when a fade-up node opts into mid-screen billboard reveal timing', () => {
    function CustomRootMarginHookHarness() {
      const ref = useRef(null);
      useNativeEnhancements(ref, 'fade-custom-root-margin-test');

      return (
        <div ref={ref} className="service-native-page">
          <div
            data-testid="custom-fade-0"
            className="fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up"
            data-fade-root-margin="0px 0px -20% 0px"
          >
            First
          </div>
        </div>
      );
    }

    const { getByTestId } = render(<CustomRootMarginHookHarness />);

    expect(getByTestId('custom-fade-0').getAttribute('data-fade-state')).toBe('pending');
    expect(observedTargets).toHaveLength(1);
    expect(observerRootMargins).toContain('0px 0px -20% 0px');
  });

  it('re-arms repeat-observe fade-up nodes after they leave the viewport', () => {
    const { getByTestId } = render(<RepeatObserveHookHarness />);
    const repeatFade = getByTestId('repeat-fade-0');

    expect(repeatFade.classList.contains('is-visible')).toBe(false);
    expect(repeatFade.getAttribute('data-fade-state')).toBe('pending');

    observerCallback([
      {
        target: repeatFade,
        isIntersecting: true,
      },
    ]);

    vi.advanceTimersByTime(300);

    expect(repeatFade.classList.contains('is-visible')).toBe(true);
    expect(repeatFade.hasAttribute('data-fade-state')).toBe(false);

    observerCallback([
      {
        target: repeatFade,
        isIntersecting: false,
      },
    ]);

    expect(repeatFade.classList.contains('is-visible')).toBe(false);
    expect(repeatFade.getAttribute('data-fade-state')).toBe('pending');

    observerCallback([
      {
        target: repeatFade,
        isIntersecting: true,
      },
    ]);

    vi.advanceTimersByTime(300);

    expect(repeatFade.classList.contains('is-visible')).toBe(true);
    expect(repeatFade.hasAttribute('data-fade-state')).toBe(false);
  });

  it('honors explicit fade delays for staggered elements that intersect together', () => {
    const { getByTestId } = render(<ExplicitDelayHookHarness />);
    const first = getByTestId('delay-fade-0');
    const second = getByTestId('delay-fade-1');

    observerCallback([
      { target: first, isIntersecting: true },
      { target: second, isIntersecting: true },
    ]);

    vi.advanceTimersByTime(50);

    expect(first.classList.contains('is-visible')).toBe(true);
    expect(second.classList.contains('is-visible')).toBe(false);

    vi.advanceTimersByTime(240);

    expect(second.classList.contains('is-visible')).toBe(true);
  });
});

describe('useNativeEnhancements fade-out timing', () => {
  let originalInnerHeight;
  let originalGetBoundingClientRect;

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
    window.innerHeight = 1000;
    Element.prototype.getBoundingClientRect = function mockedRect() {
      const isCustom = this.getAttribute('data-testid') === 'fade-out-custom';
      return {
        top: isCustom ? 840 : 60,
        bottom: isCustom ? 1000 : 220,
        left: 0,
        right: 0,
        width: 0,
        height: isCustom ? 160 : 160,
        x: 0,
        y: isCustom ? 840 : 60,
        toJSON: () => ({}),
      };
    };
  });

  afterEach(() => {
    window.innerHeight = originalInnerHeight;
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it('allows opt-in fade-out nodes to stay fully readable longer before dimming', () => {
    const { getByTestId } = render(<FadeOutHookHarness />);
    const defaultFade = getByTestId('fade-out-default');
    const customFade = getByTestId('fade-out-custom');

    expect(defaultFade.style.getPropertyValue('--scroll-opacity')).not.toBe('1.000');
    expect(defaultFade.classList.contains('is-fading')).toBe(true);
    expect(customFade.style.getPropertyValue('--scroll-opacity')).toBe('1.000');
    expect(customFade.style.getPropertyValue('--scroll-entry-progress')).toBe('0.500');
    expect(customFade.classList.contains('is-fading')).toBe(false);
  });
});

describe('useNativeEnhancements hero animation ownership', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
  });

  it('does not inject legacy inline transitions onto CSS-driven hero preset lines', () => {
    const { getByTestId } = render(<CssHeroAnimationHookHarness />);
    const lineOne = getByTestId('css-hero-line-1');
    const lineTwo = getByTestId('css-hero-line-2');

    expect(lineOne.style.transition).toBe('');
    expect(lineOne.style.opacity).toBe('');
    expect(lineOne.style.transform).toBe('');
    expect(lineTwo.style.transition).toBe('');
    expect(lineTwo.style.opacity).toBe('');
    expect(lineTwo.style.transform).toBe('');
  });
});
