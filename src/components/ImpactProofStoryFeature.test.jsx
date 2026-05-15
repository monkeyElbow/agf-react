import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImpactProofStoryFeature from './ImpactProofStoryFeature';

const IMPACT_PROOF_STEP_MS = 2400;

const DEFAULT_PROPS = {
  headline: 'Impact highlights',
  body: '',
  metrics: [
    {
      value: '4,000',
      eyebrow: 'Loans',
      label: 'Churches and ministries fueled each year.',
      body: 'From first conversation to final funding, we help ministries move from idea to opening day with financing that understands church realities.',
      tone: 'atlantean',
      action: { label: 'Explore Loans', to: '/services/loans' },
    },
    {
      value: '$40 Million',
      eyebrow: 'Legacy Giving',
      label: 'Under trusted care for future ministry.',
      body: 'Legacy plans, charitable tools, and long-horizon stewardship are organized with the kind of discipline that lets generosity keep working for the Kingdom.',
      tone: 'sandstone',
      action: { label: 'Plan with us', to: '/services/legacy-giving' },
    },
    {
      value: '687',
      eyebrow: 'Insurance',
      label: 'Mission trips covered with protection in place.',
      body: 'Teams can travel, serve, and respond quickly because practical coverage is already handled before the wheels ever leave the runway.',
      tone: 'super-grey',
      action: { label: 'Cover your trip', to: '/services/insurance' },
    },
    {
      value: '299',
      eyebrow: 'Retirement',
      label: 'Ministers retired this year with AGFinancial.',
      body: 'Retirement planning that respects decades of calling and helps leaders step into the next season with structure, confidence, and care.',
      tone: 'atlantean-dark',
      action: { label: 'Start your plan', to: '/services/retirement' },
    },
  ],
  action: null,
  resolveTo: (value, fallback = '/') => value || fallback,
};

function renderFeature(overrides = {}) {
  return render(
    <MemoryRouter>
      <ImpactProofStoryFeature
        {...DEFAULT_PROPS}
        {...overrides}
      />
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

describe('ImpactProofStoryFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia({ reducedMotion: false });
    window.innerWidth = 1440;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('falls back to a safe stacked proof layout for reduced motion while preserving all metric copy', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = renderFeature();

    expect(container.querySelector('.impact-proof-story-static')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-shell')).toBeNull();
    expect(container.querySelector('[data-proof-layout="stacked"]')).toBeTruthy();
    expect(screen.getByText('Churches and ministries fueled each year.')).toBeTruthy();
    expect(screen.getByText('Under trusted care for future ministry.')).toBeTruthy();
    expect(screen.getByText('Mission trips covered with protection in place.')).toBeTruthy();
    expect(screen.getByText('Ministers retired this year with AGFinancial.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore Loans' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Start your plan' }).getAttribute('href')).toBe('/services/retirement');
  });

  it('keeps smaller viewports on the safe stacked layout instead of running the desktop sequence', () => {
    window.innerWidth = 820;
    const { container } = renderFeature();

    expect(container.querySelector('.impact-proof-story-static')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-shell')).toBeNull();
  });

  it('renders the enhanced desktop proof stage one metric at a time and holds on the final beat', () => {
    const { container } = renderFeature();
    const shell = container.querySelector('.impact-proof-story-shell');

    expect(shell?.getAttribute('data-proof-layout')).toBe('single-metric-sequence');
    expect(shell?.getAttribute('data-proof-focus')).toBe('single-metric');
    expect(container.querySelectorAll('.impact-proof-story-actor[data-motion-state="active"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Explore Loans' }).getAttribute('href')).toBe('/services/loans');

    act(() => {
      vi.advanceTimersByTime(IMPACT_PROOF_STEP_MS * 3);
    });

    expect(shell?.getAttribute('data-active-index')).toBe('3');
    expect(container.querySelectorAll('.impact-proof-story-actor[data-motion-state="active"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Start your plan' }).getAttribute('href')).toBe('/services/retirement');
  });
});
