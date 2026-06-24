import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImpactProofStoryFeature from './ImpactProofStoryFeature';

const DEFAULT_PROPS = {
  headline: 'Impact highlights',
  body: '',
  metrics: [
    {
      value: '1,400',
      eyebrow: 'Loans',
      valueTone: 'atlantean',
      label: 'ministries supported by loans.',
      body: 'Over the last 10 years, those ministries represent more than 945,000 people.',
      tone: 'atlantean',
      action: { label: 'Explore loans', to: '/services/loans' },
    },
    {
      value: '$450 million',
      eyebrow: 'Planned Giving',
      label: 'distributed to ministries through AG Foundation.',
      body: 'That’s the power of generous donors using smart strategies.',
      tone: 'mango',
      action: { label: 'Plan with us', to: '/services/planned-giving' },
    },
    {
      value: '5,117',
      eyebrow: 'Insurance',
      valueTone: 'atlantean',
      label: 'mission trips covered and protected.',
      body: 'Peace of mind allows you to focus on what matters at home and abroad: serving others, and sharing the Gospel with confidence.',
      tone: 'super-grey',
      action: { label: 'Cover your ministry', to: '/services/insurance' },
    },
    {
      value: '29,000+',
      eyebrow: 'Retirement',
      valueTone: 'mango',
      labelBreak: 'block',
      label: 'retirements planned.',
      body: 'Your participation helps individuals, churches, ministries—and you—step confidently into the next season.',
      tone: 'atlantean-dark',
      action: { label: 'Start your tomorrow', to: '/services/retirement' },
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
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ImpactProofStoryFeature', () => {
  it('renders all proof items in one editorial reading flow and drops the old kicker label', () => {
    const { container } = renderFeature();
    const shell = container.querySelector('.impact-proof-story-shell');

    expect(shell?.getAttribute('data-proof-layout')).toBe('editorial-stack');
    expect(shell?.getAttribute('data-proof-focus')).toBe('reading-flow');
    expect(screen.queryByText('Impact highlights')).toBeNull();
    expect(container.querySelector('.impact-proof-story-summary')).toBeNull();
    expect(container.querySelector('.impact-proof-story-stage')).toBeNull();
    expect(container.querySelector('.impact-proof-story-proof-rule')).toBeNull();
    expect(container.querySelectorAll('.impact-proof-story-proof')).toHaveLength(4);
    expect(container.querySelectorAll('.impact-proof-story-proof.fade-up')).toHaveLength(0);
    expect(container.querySelectorAll('.impact-proof-story-proof-copy')).toHaveLength(4);
    expect(container.querySelectorAll('.impact-proof-story-proof-action')).toHaveLength(4);
    expect(container.querySelectorAll('.impact-proof-story-proof-eyebrow')).toHaveLength(0);
    expect(container.querySelectorAll('.impact-proof-story-proof.is-left')).toHaveLength(2);
    expect(container.querySelectorAll('.impact-proof-story-proof.is-right')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '1,400 ministries supported by loans.' })).toBeTruthy();
    expect(screen.getByText('Over the last 10 years, those ministries represent more than 945,000 people.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '$450 million distributed to ministries through AG Foundation.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '5,117 mission trips covered and protected.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '29,000+ retirements planned.' })).toBeTruthy();
  });

  it('can render the Impact intro header shell above the proof stack without changing the proof layout', () => {
    const { container } = renderFeature({
      intro: {
        heading: 'Serving you, alongside you.',
        body: 'AGFinancial was created to support churches and ministries, ministers, and individuals by improving financial health while growing God’s kingdom. As a client, you become part of that vision.',
        emphasis: 'We’re ministry allies.',
      },
    });

    expect(screen.getByRole('heading', { name: 'Serving you, alongside you.' })).toBeTruthy();
    expect(screen.getByText(/improving financial health while growing God’s kingdom/i)).toBeTruthy();
    expect(screen.getByText('We’re ministry allies.')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-intro-scroll-cue')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-shell')).toBeTruthy();
    expect(container.querySelectorAll('.impact-proof-story-proof')).toHaveLength(4);
  });

  it('keeps every metric CTA readable in the same static layout across viewports', () => {
    const { container } = renderFeature();

    expect(screen.getByRole('link', { name: 'Explore loans' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Plan with us' }).getAttribute('href')).toBe('/services/planned-giving');
    expect(screen.getByRole('link', { name: 'Cover your ministry' }).getAttribute('href')).toBe('/services/insurance');
    expect(screen.getByRole('link', { name: 'Start your tomorrow' }).getAttribute('href')).toBe('/services/retirement');
    expect(container.querySelectorAll('.impact-proof-story-proof-value.is-value-atlantean')).toHaveLength(2);
    expect(container.querySelector('.impact-proof-story-proof-value.is-value-mango')).toBeTruthy();
    expect(container.querySelector('.impact-proof-story-proof-label.is-break-block')?.textContent).toBe('retirements planned.');
  });

  it('enables scroll-reactive gradient motion variables when reduced motion is off', async () => {
    mockMatchMedia({ reducedMotion: false });
    vi.stubGlobal('requestAnimationFrame', (callback) => window.setTimeout(() => callback(Date.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', (timerId) => window.clearTimeout(timerId));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
      if (this.classList?.contains('impact-proof-story-proof')) {
        const index = Number(this.getAttribute('data-proof-index') || 0);
        const top = 620 - (index * 170);
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 1280,
          bottom: top + 380,
          width: 1280,
          height: 380,
          toJSON() {
            return {};
          },
        };
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 1280,
        bottom: 900,
        width: 1280,
        height: 900,
        toJSON() {
          return {};
        },
      };
    });

    const { container } = renderFeature();
    const shell = container.querySelector('.impact-proof-story-shell');
    const firstPanel = container.querySelector('.impact-proof-story-proof');

    expect(shell?.getAttribute('data-scroll-gradient-motion')).toBe('enabled');
    expect(firstPanel?.getAttribute('data-scroll-gradient-motion')).toBe('enabled');

    await waitFor(() => {
      expect(firstPanel?.style.getPropertyValue('--impact-proof-light-strength')).not.toBe('');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-light-width')).toContain('%');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-panel-opacity')).not.toBe('');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-copy-opacity')).not.toBe('');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-action-opacity')).not.toBe('');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-dark-stop-3')).toContain('%');
      expect(firstPanel?.style.getPropertyValue('--impact-proof-dark-angle')).toContain('deg');
    });
  });

  it('changes proof-panel motion variables across scroll states when reduced motion is off', async () => {
    mockMatchMedia({ reducedMotion: false });
    vi.stubGlobal('requestAnimationFrame', (callback) => window.setTimeout(() => callback(Date.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', (timerId) => window.clearTimeout(timerId));
    let topOffset = 620;

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
      if (this.classList?.contains('impact-proof-story-proof')) {
        const index = Number(this.getAttribute('data-proof-index') || 0);
        const top = topOffset - (index * 170);
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 1280,
          bottom: top + 380,
          width: 1280,
          height: 380,
          toJSON() {
            return {};
          },
        };
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 1280,
        bottom: 900,
        width: 1280,
        height: 900,
        toJSON() {
          return {};
        },
      };
    });

    const { container } = renderFeature();
    const firstPanel = container.querySelector('.impact-proof-story-proof');

    await waitFor(() => {
      expect(firstPanel?.style.getPropertyValue('--impact-proof-light-x')).not.toBe('');
    });

    const initialLightX = firstPanel?.style.getPropertyValue('--impact-proof-light-x');
    const initialPanelOpacity = firstPanel?.style.getPropertyValue('--impact-proof-panel-opacity');
    const initialDarkX = Number.parseFloat(firstPanel?.style.getPropertyValue('--impact-proof-dark-x') || '0');
    const initialActionShiftY = firstPanel?.style.getPropertyValue('--impact-proof-action-shift-y');

    topOffset = 240;
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(firstPanel?.style.getPropertyValue('--impact-proof-light-x')).not.toBe(initialLightX);
      expect(firstPanel?.style.getPropertyValue('--impact-proof-panel-opacity')).not.toBe(initialPanelOpacity);
      expect(Number.parseFloat(firstPanel?.style.getPropertyValue('--impact-proof-dark-x') || '0')).toBeGreaterThan(initialDarkX);
      expect(firstPanel?.style.getPropertyValue('--impact-proof-action-shift-y')).not.toBe(initialActionShiftY);
    });
  });

  it('falls back to static panel gradients when reduced motion is preferred', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = renderFeature();
    const shell = container.querySelector('.impact-proof-story-shell');
    const firstPanel = container.querySelector('.impact-proof-story-proof');

    expect(shell?.getAttribute('data-scroll-gradient-motion')).toBe('reduced');
    expect(firstPanel?.getAttribute('data-scroll-gradient-motion')).toBe('reduced');
    expect(firstPanel?.style.getPropertyValue('--impact-proof-light-strength')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--impact-proof-panel-opacity')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--impact-proof-copy-opacity')).toBe('');
    expect(firstPanel?.style.getPropertyValue('--impact-proof-action-opacity')).toBe('');
  });
});
