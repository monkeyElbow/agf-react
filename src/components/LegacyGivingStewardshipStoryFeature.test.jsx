import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LegacyGivingStewardshipStoryFeature from './LegacyGivingStewardshipStoryFeature';

const DEFAULT_PROPS = {
  headline: 'Smart stewardship for today and tomorrow.',
  beats: [
    'Transition out of appreciated assets.',
    'Receive payments for life.',
    'Leave a legacy for family and ministry.',
    'Smart stewardship for today and tomorrow.',
  ],
  action: {
    label: 'Compare charitable giving ideas',
    to: '#charitable-giving-plan-comparison',
  },
  resolveTo: (value, fallback = '/') => value || fallback,
};

function renderFeature(overrides = {}) {
  const props = {
    ...DEFAULT_PROPS,
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <LegacyGivingStewardshipStoryFeature {...props} />
    </MemoryRouter>,
  );
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

function setEnhancedShellProgress(container, progress) {
  const shell = container.querySelector('.legacy-stewardship-story-shell');
  const viewportHeight = window.innerHeight || 900;
  const shellHeight = 2400;
  const totalScrollable = shellHeight - viewportHeight;
  const top = -progress * totalScrollable;
  shell.getBoundingClientRect = () => ({
    top,
    bottom: top + shellHeight,
    left: 0,
    right: 1200,
    width: 1200,
    height: shellHeight,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
  return shell;
}

function getActorOpacity(actor) {
  return Number.parseFloat(actor?.style.opacity || '0');
}

describe('LegacyGivingStewardshipStoryFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia({ reducedMotion: false });
    window.innerWidth = 1440;
    window.innerHeight = 900;
    vi.stubGlobal('requestAnimationFrame', (callback) => window.setTimeout(() => callback(Date.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (timerId) => window.clearTimeout(timerId));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the static-safe story fallback with all beats and the comparison CTA when reduced motion is preferred', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = renderFeature();

    expect(container.querySelector('.legacy-stewardship-story-static')).toBeTruthy();
    expect(container.querySelector('.legacy-stewardship-story-shell')).toBeNull();
    expect(screen.getByText('Receive payments for life.')).toBeTruthy();
    expect(screen.getByText('Transition out of appreciated assets.')).toBeTruthy();
    expect(screen.getByText('Leave a legacy for family and ministry.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Smart stewardship for today and tomorrow.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).getAttribute('href')).toBe('#charitable-giving-plan-comparison');
    expect(container.querySelector('.legacy-stewardship-story-static-beats li[data-tone="atlantean"]')?.textContent).toBe('Transition out of appreciated assets.');
  });

  it('keeps the smaller-viewport path on the safe static fallback instead of requiring the pinned stage', () => {
    window.innerWidth = 900;
    const { container } = renderFeature();

    expect(container.querySelector('.legacy-stewardship-story-static')).toBeTruthy();
    expect(container.querySelector('.legacy-stewardship-story-shell')).toBeNull();
  });

  it('renders the enhanced desktop story and lands on the final held beat with the comparison CTA', () => {
    const { container } = renderFeature();
    const shell = setEnhancedShellProgress(container, 0.97);

    expect(shell?.getAttribute('data-hold-contract')).toBe('desktop-pinned-sequence');
    expect(shell?.getAttribute('data-scroll-gradient-motion')).toBe('enabled');
    expect(shell?.getAttribute('data-release-after')).toBe('final-message-hold');
    expect(shell?.getAttribute('style')).toContain('--legacy-stewardship-runway-vh: 280vh');

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const finalActor = screen.getByRole('heading', { name: 'Smart stewardship for today and tomorrow.' }).closest('.legacy-stewardship-story-beat-actor');
    expect(finalActor?.getAttribute('data-motion-state')).toBe('holding');
    expect(finalActor?.getAttribute('data-tone')).toBe('atlantean');
    expect(finalActor?.querySelector('.legacy-stewardship-story-final-primary')).toBeNull();
    expect(finalActor?.querySelector('.legacy-stewardship-story-final-secondary')).toBeNull();
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).getAttribute('href')).toBe('#charitable-giving-plan-comparison');
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).className).toContain('is-tone-white');
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).className).not.toContain('is-outline');
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).className).not.toContain('home-impact-story-cta');
  });

  it('makes the first beat readable from the start of the pinned sequence instead of waiting through a faint dead zone', () => {
    const { container } = renderFeature();
    setEnhancedShellProgress(container, 0);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const firstActor = screen.getByText('Transition out of appreciated assets.').closest('.legacy-stewardship-story-beat-actor');
    const firstCue = container.querySelector('.legacy-stewardship-story-first-cue');
    expect(firstActor?.getAttribute('data-motion-state')).toBe('entering');
    expect(getActorOpacity(firstActor)).toBeGreaterThanOrEqual(0.64);
    expect(firstActor?.getAttribute('style')).toContain('translate3d(0, 10px, 0)');
    expect(firstActor?.getAttribute('style')).toContain('scale(0.965)');
    expect(firstCue?.getAttribute('style')).toContain('opacity: 1');

    setEnhancedShellProgress(container, 0.04);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    expect(getActorOpacity(firstActor)).toBeGreaterThan(0.68);
    expect(firstActor?.getAttribute('style')).not.toContain('scale(0.965)');
  });

  it('applies scroll-driven light leak variables that soften back toward white by the final panel', () => {
    const { container } = renderFeature();
    const shell = setEnhancedShellProgress(container, 0);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const initialLeakAX = shell?.style.getPropertyValue('--legacy-light-leak-a-x');
    const initialLeakBX = shell?.style.getPropertyValue('--legacy-light-leak-b-x');
    const initialLeakBScale = shell?.style.getPropertyValue('--legacy-light-leak-b-scale');
    const initialLeakAOpacity = shell?.style.getPropertyValue('--legacy-light-leak-a-opacity');
    const initialLeakFade = Number.parseFloat(shell?.style.getPropertyValue('--legacy-light-leak-fade') || '0');
    expect(initialLeakAX).not.toBe('');
    expect(initialLeakAX).toBe('10.00%');
    expect(initialLeakBX).toBe('92.00%');
    expect(initialLeakBScale).not.toBe('');
    expect(initialLeakAOpacity).toBe('0.220');
    expect(initialLeakFade).toBeGreaterThan(0.9);

    setEnhancedShellProgress(container, 0.5);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    expect(shell?.style.getPropertyValue('--legacy-light-leak-a-x')).not.toBe(initialLeakAX);
    expect(shell?.style.getPropertyValue('--legacy-light-leak-b-x')).not.toBe(initialLeakBX);
    expect(shell?.style.getPropertyValue('--legacy-light-leak-b-scale')).not.toBe(initialLeakBScale);
    expect(Number.parseFloat(shell?.style.getPropertyValue('--legacy-light-leak-a-opacity') || '0')).toBeGreaterThan(Number.parseFloat(initialLeakAOpacity || '0'));

    setEnhancedShellProgress(container, 0.9);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    expect(Number.parseFloat(shell?.style.getPropertyValue('--legacy-light-leak-fade') || '0')).toBeLessThan(initialLeakFade);
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).className).toContain('legacy-stewardship-story-cta');
    expect(screen.getByRole('link', { name: 'Compare charitable giving ideas' }).className).not.toContain('home-impact-story-cta');
  });
});
