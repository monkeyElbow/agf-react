import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, render, screen, within } from '@testing-library/react';
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
      body: 'Your financial decisions can strengthen more than just your future.',
      buttonLabel: "See what we're doing",
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

function getVisualStage(container) {
  const stage = container.querySelector('.home-impact-story-stage');
  expect(stage).toBeTruthy();
  return stage;
}

function getMetricValueNode(root, metricLabel) {
  return within(root).getByText(metricLabel).closest('.home-impact-story-metric')?.querySelector('.home-impact-story-metric-value');
}

function getTranslateY(node) {
  const match = String(node?.style.transform || '').match(/translate3d\(0,\s*(-?\d+(?:\.\d+)?)px,\s*0\)/);
  return match ? Number.parseFloat(match[1]) : null;
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
    expect(screen.getByText('Because your mission is ours, too.')).toBeTruthy();
    expect(staticCopy?.querySelector('a')).toBeNull();
    expect(staticProof?.querySelector('a')).toBeNull();
    expect(screen.queryByRole('link', { name: "See what we're doing" })).toBeNull();
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

    const readerSummary = container.querySelector('.home-impact-story-reader-summary');
    const proof = container.querySelector('.home-impact-story-proof');
    const proofCtaBlock = container.querySelector('.home-impact-story-proof-cta-block');
    const stage = container.querySelector('.home-impact-story-stage');
    const stageQueries = within(getVisualStage(container));

    expect(readerSummary).toBeTruthy();
    expect(readerSummary?.textContent).toContain('What you do here matters.');
    expect(readerSummary?.textContent).toContain('Your financial decisions can strengthen more than just your future.');
    expect(readerSummary?.textContent).toContain('1,400+');
    expect(readerSummary?.textContent).toContain('29,000+');
    expect(readerSummary?.textContent).toContain('$450 million');
    expect(readerSummary?.textContent).toContain('Because your mission is ours, too.');
    expect(stage?.getAttribute('aria-hidden')).toBe('true');
    expect(stageQueries.getByText('Because your mission is ours, too.')).toBeTruthy();
    expect(stageQueries.queryByLabelText('$450 million')).toBeNull();
    expect(stageQueries.queryByText('distributed to ministries through AG Foundation')).toBeNull();
    expect(proof?.getAttribute('style')).toContain('opacity: 0;');
    expect(proofCtaBlock?.getAttribute('style')).toContain('opacity: 1;');
    expect(stageQueries.queryByText('ministries served by loans')).toBeNull();
    expect(stageQueries.queryByText('of minister retirements planned')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Because your mission is ours, too.' })).toBeNull();
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
    const stageQueries = within(getVisualStage(container));
    expect(shell).toBeTruthy();
    expect(stageQueries.getByText('Because your mission is ours, too.')).toBeTruthy();
    expect(stageQueries.queryByText('distributed to ministries through AG Foundation')).toBeNull();
    expect(stageQueries.queryByText('ministries served by loans')).toBeNull();
  });

  it('starts the opening copy slightly above neutral center in the desktop animated path', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    const headingShell = container.querySelector('.home-impact-story-heading-shell');
    expect(headingShell?.getAttribute('style')).toContain('translate3d(0, -34px, 0)');
    expect(copy?.getAttribute('style')).toContain('translate3d(0, -12px, 0)');
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

  it('keeps the intro body drifting upward while it is still fading so the exit does not lock in place', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.2);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    const earlyShift = getTranslateY(copy);
    const earlyOpacity = Number.parseFloat(copy?.style.opacity || '0');

    setEnhancedShellProgress(container, 0.26);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const lateShift = getTranslateY(copy);
    const lateOpacity = Number.parseFloat(copy?.style.opacity || '0');

    expect(earlyShift).not.toBeNull();
    expect(lateShift).not.toBeNull();
    expect(earlyOpacity).toBeGreaterThan(0);
    expect(lateOpacity).toBeGreaterThan(0);
    expect(lateShift).toBeLessThan(earlyShift);
  });

  it('lets stat 1 enter only after the copy has meaningfully started exiting', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.31);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const copy = container.querySelector('.home-impact-story-copy');
    const firstMetric = within(getVisualStage(container)).getByText('ministries served by loans').closest('.home-impact-story-metric');
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
    const firstMetric = within(getVisualStage(container)).getByText('ministries served by loans').closest('.home-impact-story-metric');
    const firstActor = firstMetric?.closest('.home-impact-story-metric-actor');

    expect(proof?.getAttribute('style')).not.toContain('opacity: 0;');
    expect(firstActor?.getAttribute('data-motion-state')).toBe('entering');
    expect(Number.parseFloat(firstActor?.style.opacity || '0')).toBeGreaterThan(0.08);
  });

  it('uses a staged actor sequence and allows the outgoing metric to clear earlier in later transitions', () => {
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
    const headingLock = container.querySelector('.home-impact-story-heading-lock');
    const stageQueries = within(getVisualStage(container));
    const thirdMetric = stageQueries.getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric');

    expect(metricsRoot?.getAttribute('data-animated-layout')).toBe('actor-sequence');
    expect(metricsRoot?.getAttribute('data-stage-center')).toBe('stable');
    expect(copyLayer?.getAttribute('data-stage-layer')).toBe('copy');
    expect(proofLayer?.getAttribute('data-stage-layer')).toBe('proof');
    expect(headingLock).toBeTruthy();
    expect(proof?.getAttribute('style')).not.toContain('transform');
    expect(stageQueries.queryByText('ministries served by loans')).toBeNull();
    expect(stageQueries.queryByText('of minister retirements planned')).toBeNull();
    expect(thirdMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-actor-role')).toBe('incoming');
    expect(thirdMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
    expect(metricsRoot?.querySelectorAll('.home-impact-story-metric-actor')).toHaveLength(1);
    expect(metricsRoot?.querySelectorAll('.home-impact-story-metric')).toHaveLength(1);
  });

  it('keeps the next metric from meaningfully entering too early behind the current one', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.46);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const stageQueries = within(getVisualStage(container));
    const firstMetric = stageQueries.getByText('ministries served by loans').closest('.home-impact-story-metric');
    const secondMetric = stageQueries.getByText('of minister retirements planned').closest('.home-impact-story-metric');
    const secondActor = secondMetric?.closest('.home-impact-story-metric-actor');

    expect(firstMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('exiting');
    expect(secondActor?.getAttribute('data-motion-state')).toBe('entering');
    expect(Number.parseFloat(secondActor?.style.opacity || '0')).toBeLessThanOrEqual(0.05);
    expect(stageQueries.queryByText('distributed to ministries through AG Foundation')).toBeNull();
  });

  it('fades the outgoing metric before it reaches the heading zone', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.46);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const firstMetric = within(getVisualStage(container)).getByText('ministries served by loans').closest('.home-impact-story-metric');
    const firstActor = firstMetric?.closest('.home-impact-story-metric-actor');
    const firstActorOpacity = Number.parseFloat(firstActor?.style.opacity || '0');
    const firstActorShift = getTranslateY(firstActor);

    expect(firstActor?.getAttribute('data-motion-state')).toBe('exiting');
    expect(firstActorOpacity).toBeLessThan(0.12);
    expect(firstActorShift).not.toBeNull();
    expect(firstActorShift).toBeLessThan(36);
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

    const secondMetric = within(getVisualStage(container)).getByText('of minister retirements planned').closest('.home-impact-story-metric');
    expect(secondMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('entering');
  });

  it('counts metric values with scroll progress inside each center window', () => {
    const { container } = renderFeatureBlock();
    const stage = getVisualStage(container);
    setEnhancedShellProgress(container, 0.31);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const firstValue = getMetricValueNode(stage, 'ministries served by loans');
    expect(firstValue?.textContent).not.toBe('0+');
    expect(firstValue?.textContent).not.toBe('1,400+');
    expect(within(stage).queryByText('of minister retirements planned')).toBeNull();

    setEnhancedShellProgress(container, 0.42);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const firstValueLater = getMetricValueNode(stage, 'ministries served by loans');
    expect(firstValueLater?.textContent).toBe('1,400+');

    setEnhancedShellProgress(container, 0.52);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    const secondValue = getMetricValueNode(stage, 'of minister retirements planned');
    expect(secondValue?.textContent).not.toBe('0+');
    expect(secondValue?.textContent).not.toBe('29,000+');
  });

  it('keeps the final metric from completing too early before the section release begins', () => {
    const { container } = renderFeatureBlock();
    setEnhancedShellProgress(container, 0.9);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    const finalMetric = within(getVisualStage(container)).getByText('distributed to ministries through AG Foundation').closest('.home-impact-story-metric');
    const proofCtaBlock = container.querySelector('.home-impact-story-proof-cta-block');

    expect(finalMetric?.closest('.home-impact-story-metric-actor')?.getAttribute('data-motion-state')).toBe('holding');
    expect(Number.parseFloat(proofCtaBlock?.style.opacity || '0')).toBeLessThan(0.2);
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
    const proofCtaBlock = container.querySelector('.home-impact-story-proof-cta-block');
    const stageQueries = within(getVisualStage(container));

    expect(copy?.querySelector('a')).toBeNull();
    expect(proof?.querySelector('a')).toBeNull();
    expect(screen.queryByRole('link', { name: "See what we're doing" })).toBeNull();

    expect(stageQueries.getByText('Because your mission is ours, too.')).toBeTruthy();
    expect(stageQueries.queryByText('distributed to ministries through AG Foundation')).toBeNull();
    expect(proof?.getAttribute('style')).toContain('opacity: 0;');
    expect(proofCtaBlock?.getAttribute('style')).toContain('opacity: 1;');
  });

  it('keeps the impact story backdrop source-contained with an overflow fallback for mobile browsers that do not honor clip reliably', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story {');
    expect(cssSource).toContain('.home-impact-story-frame {');
    expect(cssSource).toContain('overflow: hidden;');
    expect(cssSource).toContain('overflow: clip;');
    expect(cssSource).toContain('inset: -14% -12% auto;');
  });

  it('keeps the final proof intro styling explicit after removing the CTA button', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story-proof-intro {');
    expect(cssSource).toContain('color: #ffffff;');
    expect(cssSource).toContain('font-family: var(--ag-font-heading);');
    expect(cssSource).toContain('max-width: 18ch;');
    expect(cssSource).toContain('font-size: clamp(5.8rem, 12.4vw, 11.1rem);');
    expect(cssSource).toContain('.home-impact-story-proof-cta-block {');
    expect(cssSource).toContain('.home-impact-story-proof-layer .home-impact-story-proof-cta-block {');
    expect(cssSource).toContain('@media (min-width: 1040px) {');
    expect(cssSource).toContain('transform: scale(1.26);');
    expect(cssSource).not.toContain('.home-impact-story-cta {');
  });

  it('keeps the metric presentation framed and bounded after reducing the number scale', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story-metric-frame {');
    expect(cssSource).toContain('width: min(100%, 60rem);');
    expect(cssSource).toContain('border-radius: clamp(1.35rem, 2.4vw, 1.85rem);');
    expect(cssSource).toContain('border: 2px solid var(--ag-color-sandstone);');
    expect(cssSource).toContain('background: transparent;');
    expect(cssSource).toContain('box-shadow: none;');
    expect(cssSource).toContain('.home-native-impact .home-impact-story-metric-value {');
    expect(cssSource).toContain('font-size: clamp(4rem, 7.5vw, 7rem);');
    expect(cssSource).toContain('white-space: nowrap;');
    expect(cssSource).toContain('--home-impact-metric-bottom: #ded3c3;');
  });

  it('keeps the impact feature frame square and settles the ending line into the lower proof area', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-impact-story {');
    expect(cssSource).toContain('padding: 0;');
    expect(cssSource).toContain('.home-impact-story-pin {');
    expect(cssSource).toContain('align-items: stretch;');
    expect(cssSource).toContain('.home-impact-story-frame {');
    expect(cssSource).toContain('min-height: 100vh;');
    expect(cssSource).toContain('border-radius: 0;');
    expect(cssSource).toContain('border: 0;');
    expect(cssSource).toContain('.home-impact-story-stage {');
    expect(cssSource).toContain('min-height: 100vh;');
    expect(cssSource).toContain('.home-impact-story-proof-layer .home-impact-story-proof-cta-block {');
    expect(cssSource).toContain('inset: 0;');
    expect(cssSource).toContain('z-index: 2;');
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
    expect(source).toContain('const HOME_IMPACT_STORY_OUTGOING_WINDOW = 0.44;');
    expect(source).toContain('const HOME_IMPACT_STORY_COPY_SHIFT_START = 0.04;');
    expect(source).toContain('const HOME_IMPACT_STORY_COPY_SHIFT_DURATION = 0.3;');
    expect(source).toContain('const HOME_IMPACT_STORY_FINAL_METRIC_SETTLE_POINT = 0.8;');
    expect(source).toContain('const HOME_IMPACT_STORY_FINAL_METRIC_COUNT_START = 0.2;');
    expect(source).toContain('const HOME_IMPACT_STORY_FINAL_METRIC_COUNT_DURATION = 0.5;');
    expect(source).toContain('const HOME_IMPACT_STORY_END_PANEL_START = 0.95;');
    expect(source).toContain('const HOME_IMPACT_STORY_END_PANEL_DURATION = 0.035;');
    expect(source).toContain('const HOME_IMPACT_STORY_END_PANEL_METRIC_CLEAR_LEAD = 0.012;');
    expect(source).toContain('const HOME_IMPACT_STORY_END_PANEL_LOCK_START = 0.985;');
    expect(source).toContain('const HOME_IMPACT_STORY_HEADING_EXIT_TRAVEL_PX = 118;');
    expect(source).toContain("const HOME_IMPACT_STORY_ENDING_LINE = 'Because your mission is ours, too.';");
    expect(source).toContain('const HOME_IMPACT_STORY_METRIC_EXIT_TRAVEL_PX = 192;');
    expect(source).toContain('const HOME_IMPACT_STORY_METRIC_EXIT_FADE_CUTOFF = 0.48;');
    expect(source).toContain('const HOME_IMPACT_STORY_METRIC_EXIT_OPACITY_EXPONENT = 0.82;');
    expect(source).toContain('const shouldShowIncoming = true;');
  });
});
