import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

void [MemoryRouter, PageBlocksRenderer];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function createSiteFeatureBlock() {
  return {
    id: 'home_impact_story',
    kind: 'site_feature',
    mode: 'dynamic',
    settings: {
      featureId: 'home_impact_story',
      headline: 'What you do here matters.',
      body: 'As an AGFinancial client, you are also our ministry ally. Together, we improve financial health while fueling Kingdom growth and support.',
      buttonLabel: 'Make an impact',
      buttonPageRef: '/about-us/impact',
    },
  };
}

function renderFeatureBlock() {
  return render(
    <MemoryRouter>
      <PageBlocksRenderer blocks={[createSiteFeatureBlock()]} />
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
  const shell = container.querySelector('.home-impact-story-shell');
  const viewportHeight = window.innerHeight || 900;
  const shellHeight = 2600;
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

function getMetricValueNode(metricLabel) {
  return screen.getByText(metricLabel).closest('.home-impact-story-metric')?.querySelector('.home-impact-story-metric-value');
}

describe('HomeImpactStoryFeature', () => {
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

  it('renders the shared static-safe impact section when reduced motion is preferred', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = renderFeatureBlock();
    const staticCopy = container.querySelector('.home-impact-story-static-copy');
    const staticProof = container.querySelector('.home-impact-story-static-proof');

    expect(container.querySelector('.home-impact-story-static-grid')).toBeTruthy();
    expect(container.querySelector('.home-impact-story-shell')).toBeNull();
    expect(screen.getByRole('heading', { name: /What you do here matters/i })).toBeTruthy();
    expect(screen.getByText('distributed to ministries through AG Foundation')).toBeTruthy();
    expect(staticCopy?.querySelector('a')).toBeNull();
    expect(staticProof?.querySelector('a')?.textContent).toBe('Make an impact');
    expect(screen.getByRole('link', { name: 'Make an impact' }).getAttribute('href')).toBe('/about-us/impact');
  });

  it('renders the enhanced pinned desktop story and lands on the expected metric content', () => {
    const { container } = renderFeatureBlock();
    const shell = setEnhancedShellProgress(container, 0.95);

    expect(shell).toBeTruthy();
    expect(shell?.getAttribute('data-hold-contract')).toBe('desktop-pinned-sequence');
    expect(shell?.getAttribute('data-release-after')).toBe('final-metric-hold');
    expect(shell?.getAttribute('style')).toContain('--home-impact-story-runway-vh: 400vh');

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('holding');
    expect(screen.getByLabelText('$450 million')).toBeTruthy();
    expect(screen.getByText('distributed to ministries through AG Foundation')).toBeTruthy();
    expect(screen.queryByText('assets under management')).toBeNull();
    expect(screen.queryByText('(and growing) clients')).toBeNull();
  });

  it('measures the pinned story on mount before the first scroll event so the correct metric is ready immediately', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
      if (this.classList?.contains('home-impact-story-shell')) {
        const viewportHeight = window.innerHeight || 900;
        const shellHeight = 2600;
        const totalScrollable = shellHeight - viewportHeight;
        const top = -0.95 * totalScrollable;
        return {
          top,
          bottom: top + shellHeight,
          left: 0,
          right: 1200,
          width: 1200,
          height: shellHeight,
          x: 0,
          y: top,
          toJSON: () => ({}),
        };
      }

      return {
        top: 0,
        bottom: 900,
        left: 0,
        right: 1200,
        width: 1200,
        height: 900,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });

    const { container } = renderFeatureBlock();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const shell = container.querySelector('.home-impact-story-shell');
    expect(shell).toBeTruthy();
    expect(screen.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('holding');
    expect(screen.queryByText('assets under management')).toBeNull();
  });

  it('starts the opening copy slightly above neutral center in the desktop animated path', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    expect(copy?.getAttribute('style')).toContain('translate3d(0, -34px, 0)');
    expect(copy?.querySelector('a')).toBeNull();
  });

  it('starts moving the intro copy as soon as the pinned section begins consuming scroll', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.04);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    expect(copy?.getAttribute('style')).not.toContain('translate3d(0, -34px, 0)');
    expect(copy?.getAttribute('style')).not.toContain('opacity: 1;');
  });

  it('lets the intro begin yielding sooner than before the first stat enters', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.16);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    expect(copy?.getAttribute('style')).not.toContain('translate3d(0, -34px, 0)');
    expect(copy?.getAttribute('style')).not.toContain('opacity: 1;');
  });

  it('lets stat 1 enter only after the copy has meaningfully started exiting', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.31);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    const firstMetric = screen.getByText('assets under management').closest('.home-impact-story-metric');
    const actorStage = container.querySelector('.home-impact-story-metric-stage');

    expect(copy?.getAttribute('style')).toContain('opacity:');
    expect(actorStage?.getAttribute('data-actor-system')).toBe('single-metric-sequence');
    expect(firstMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
  });

  it('brings the first stat in sooner so the section does not sit blank after the intro', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.24);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const proof = container.querySelector('.home-impact-story-proof');
    const firstMetric = screen.getByText('assets under management').closest('.home-impact-story-metric');
    const firstActor = firstMetric?.closest('.home-impact-story-metric-actor');

    expect(proof?.getAttribute('style')).not.toContain('opacity: 0;');
    expect(firstActor?.getAttribute('data-motion-state')).toBe('entering');
    expect(Number.parseFloat(firstActor?.style.opacity || '0')).toBeGreaterThan(0.08);
  });

  it('uses a staged actor sequence instead of mounting a permanent three-metric centered row', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.78);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const metricsRoot = container.querySelector('.home-impact-story-metrics');
    const proof = container.querySelector('.home-impact-story-proof');
    const copyLayer = container.querySelector('.home-impact-story-copy-layer');
    const proofLayer = container.querySelector('.home-impact-story-proof-layer');
    const secondMetric = screen.getByText('(and growing) clients').closest('.home-impact-story-metric');
    const thirdMetric = screen.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric');

    expect(metricsRoot?.getAttribute('data-animated-layout')).toBe('actor-sequence');
    expect(metricsRoot?.getAttribute('data-stage-center')).toBe('stable');
    expect(copyLayer?.getAttribute('data-stage-layer')).toBe('copy');
    expect(proofLayer?.getAttribute('data-stage-layer')).toBe('proof');
    expect(proof?.getAttribute('style')).not.toContain('transform');
    expect(screen.queryByText('assets under management')).toBeNull();
    expect(secondMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-actor-role')).toBe('outgoing');
    expect(secondMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('exiting');
    expect(thirdMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-actor-role')).toBe('incoming');
    expect(thirdMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
    expect(metricsRoot?.querySelectorAll('.home-impact-story-metric-actor')).toHaveLength(2);
    expect(metricsRoot?.querySelectorAll('.home-impact-story-metric')).toHaveLength(2);
  });

  it('keeps the next metric from meaningfully entering too early behind the current one', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.46);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const firstMetric = screen.getByText('assets under management').closest('.home-impact-story-metric');
    const secondMetric = screen.getByText('(and growing) clients').closest('.home-impact-story-metric');
    const secondActor = secondMetric?.closest('.home-impact-story-metric-actor');

    expect(firstMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('exiting');
    expect(secondActor?.getAttribute('data-motion-state')).toBe('entering');
    expect(Number.parseFloat(secondActor?.style.opacity || '0')).toBeLessThanOrEqual(0.05);
    expect(screen.queryByText('distributed to ministries through AG Foundation')).toBeNull();
  });

  it('fully clears the copy by the time later metric phases are active', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.76);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    expect(copy?.getAttribute('style')).toContain('opacity: 0');
  });

  it('keeps the middle metric visibly settling deeper into its slot instead of plateauing early', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.6);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const secondMetric = screen.getByText('(and growing) clients').closest('.home-impact-story-metric');
    expect(secondMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
  });

  it('counts metric values with scroll progress inside each center window', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.31);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const firstValue = getMetricValueNode('assets under management');
    expect(firstValue?.textContent).not.toBe('$0 billion');
    expect(firstValue?.textContent).not.toBe('$12 billion');
    expect(screen.queryByText('(and growing) clients')).toBeNull();

    setEnhancedShellProgress(container, 0.42);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const firstValueLater = getMetricValueNode('assets under management');
    expect(firstValueLater?.textContent).toBe('$12 billion');

    setEnhancedShellProgress(container, 0.52);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const secondValue = getMetricValueNode('(and growing) clients');
    expect(secondValue?.textContent).not.toBe('0');
    expect(secondValue?.textContent).not.toBe('38,654');
  });

  it('keeps the final metric from completing too early before the section release begins', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.85);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const finalMetric = screen.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric');
    const proofCtaWrap = container.querySelector('.home-impact-story-proof-cta-wrap');

    expect(finalMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
    expect(Number.parseFloat(proofCtaWrap?.style.opacity || '0')).toBeLessThan(0.2);
  });

  it('renders the CTA with the final held metric instead of in the intro copy phase', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.95);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(1200);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    const proof = container.querySelector('.home-impact-story-proof');
    const ctaLink = screen.getByRole('link', { name: 'Make an impact' });

    expect(copy?.querySelector('a')).toBeNull();
    expect(proof?.querySelector('a')).toBe(ctaLink);
    expect(screen.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('holding');
  });

  it('keeps the impact story backdrop source-contained with an overflow fallback for mobile browsers that do not honor clip reliably', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story {');
    expect(cssSource).toContain('.home-impact-story-frame {');
    expect(cssSource).toContain('overflow: hidden;');
    expect(cssSource).toContain('overflow: clip;');
    expect(cssSource).toContain('inset: -14% -12% auto;');
  });

  it('keeps the proof CTA spacing and button centering contract explicit so cue tweaks do not drift into another loop', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story-cta-wrap {');
    expect(cssSource).toContain('--home-impact-story-button-expand-inline: 0.125rem;');
    expect(cssSource).toContain('grid-template-rows: 52px auto;');
    expect(cssSource).toContain('--home-impact-story-cta-top-gap: clamp(1.8rem, 3vw, 2.6rem);');
    expect(cssSource).toContain('--home-impact-story-cta-cue-gap: var(--home-impact-story-cta-top-gap);');
    expect(cssSource).toContain('row-gap: var(--home-impact-story-cta-cue-gap);');
    expect(cssSource).toContain('margin-top: var(--home-impact-story-cta-top-gap);');
    expect(cssSource).toContain('.home-impact-story-proof-cta-wrap {');
    expect(cssSource).toContain('--home-impact-story-cta-top-gap: clamp(0.7rem, 1.4vw, 0.95rem);');
    expect(cssSource).toContain('--home-impact-story-cta-cue-gap: clamp(3.75rem, 6vw, 5.5rem);');
    expect(cssSource).toContain('.home-impact-story-cta {');
    expect(cssSource).toContain('--home-impact-cta-expand-inline: var(--home-impact-story-button-expand-inline);');
    expect(cssSource).toContain('display: inline-flex;');
    expect(cssSource).toContain('align-items: center;');
    expect(cssSource).toContain('align-self: center;');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('line-height: 1;');
    expect(cssSource).toContain('margin: 0 calc(-1 * var(--home-impact-cta-expand-inline));');
  });

  it('keeps the mobile proof stack gap explicit so the first metric stays separated from the copy block', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('@media (max-width: 640px) {');
    expect(cssSource).toContain('.home-impact-story-static-grid {');
    expect(cssSource).toContain('gap: 5rem;');
  });

  it('keeps the home impact story timing contract biased toward continuous motion instead of early plateau holds', () => {
    const source = readSource('./HomeImpactStoryFeature.jsx');

    expect(source).toContain('const HOME_IMPACT_STORY_METRIC_SETTLE_POINTS = [0.78, 0.78, 0.88];');
    expect(source).toContain('const HOME_IMPACT_STORY_OUTGOING_WINDOW = 0.5;');
    expect(source).toContain('const HOME_IMPACT_STORY_FINAL_CTA_START = 0.88;');
    expect(source).toContain('const HOME_IMPACT_STORY_FINAL_CTA_DURATION = 0.1;');
    expect(source).toContain('const shouldShowIncoming = true;');
  });
});
