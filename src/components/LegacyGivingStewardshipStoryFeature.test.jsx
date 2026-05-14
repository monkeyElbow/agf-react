import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LegacyGivingStewardshipStoryFeature from './LegacyGivingStewardshipStoryFeature';

const DEFAULT_PROPS = {
  headline: 'Smart stewardship—for today and tomorrow.',
  beats: [
    'Receive payments for life.',
    'Transition out of appreciated assets',
    'Leave a legacy for family and ministry',
    'Smart stewardship—for today and tomorrow.',
  ],
  action: {
    label: 'Learn more',
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
    expect(screen.getByText('Transition out of appreciated assets')).toBeTruthy();
    expect(screen.getByText('Leave a legacy for family and ministry')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Smart stewardship—for today and tomorrow.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Learn more' }).getAttribute('href')).toBe('#charitable-giving-plan-comparison');
    expect(container.querySelector('.legacy-stewardship-story-static-beats li[data-tone="atlantean"]')?.textContent).toBe('Receive payments for life.');
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
    expect(shell?.getAttribute('data-release-after')).toBe('final-message-hold');
    expect(shell?.getAttribute('style')).toContain('--legacy-stewardship-runway-vh: 360vh');

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const finalActor = screen.getByText('Smart stewardship—for today and tomorrow.').closest('.legacy-stewardship-story-beat-actor');
    expect(finalActor?.getAttribute('data-motion-state')).toBe('holding');
    expect(finalActor?.getAttribute('data-tone')).toBe('atlantean');
    expect(screen.getByRole('link', { name: 'Learn more' }).getAttribute('href')).toBe('#charitable-giving-plan-comparison');
  });
});
