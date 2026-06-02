import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const HOME_IMPACT_STORY_PINNED_ENABLED = true;
const HOME_IMPACT_STORY_MIN_WIDTH_PX = 1040;
const HOME_IMPACT_STORY_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const HOME_IMPACT_STORY_DESKTOP_RUNWAY_VH = 400;
const HOME_IMPACT_STORY_RELEASE_START = 0.96;
const HOME_IMPACT_STORY_METRIC_ENTRY_DELAYS = [0, 0.08, 0.14];
const HOME_IMPACT_STORY_COPY_SHIFT_START = 0;
const HOME_IMPACT_STORY_COPY_SHIFT_DURATION = 0.24;
const HOME_IMPACT_STORY_COPY_OPACITY_START = 0.04;
const HOME_IMPACT_STORY_COPY_OPACITY_DURATION = 0.2;
const HOME_IMPACT_STORY_SEQUENCE_START = 0.22;
const HOME_IMPACT_STORY_SEQUENCE_END = 0.94;
const HOME_IMPACT_STORY_PROOF_FADE_START = 0.2;
const HOME_IMPACT_STORY_PROOF_FADE_DURATION = 0.1;
const HOME_IMPACT_STORY_FIRST_METRIC_ENTER_DURATION = 0.46;
const HOME_IMPACT_STORY_FIRST_METRIC_OPACITY_EXPONENT = 1.35;
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readHeadlineParts(headline, highlightedWord = '') {
  const rawHeadline = String(headline || '').trim();
  if (!rawHeadline) {
    return { lead: '', accent: '', punctuation: '' };
  }

  const punctuationMatch = rawHeadline.match(/([.!?])$/);
  const punctuation = punctuationMatch?.[1] || '';
  const baseHeadline = punctuation ? rawHeadline.slice(0, -1).trim() : rawHeadline;
  const explicitAccent = String(highlightedWord || '').trim().replace(/[.!?]$/, '');
  const accent = explicitAccent || baseHeadline.split(/\s+/).filter(Boolean).pop() || '';

  if (!accent) {
    return { lead: rawHeadline, accent: '', punctuation: '' };
  }

  const lowerBase = baseHeadline.toLowerCase();
  const lowerAccent = accent.toLowerCase();
  if (!lowerBase.endsWith(lowerAccent) || lowerBase.length <= lowerAccent.length) {
    return { lead: rawHeadline, accent: '', punctuation: '' };
  }

  const lead = baseHeadline.slice(0, baseHeadline.length - accent.length).trim();
  if (!lead) {
    return { lead: rawHeadline, accent: '', punctuation: '' };
  }

  return { lead, accent, punctuation };
}

function parseMetricValue(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/-?[\d,.]+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const numericText = match[0].replace(/,/g, '');
  const value = Number.parseFloat(numericText);
  if (Number.isNaN(value)) {
    return null;
  }

  const decimals = (numericText.split('.')[1] || '').length;
  const prefix = trimmed.slice(0, match.index || 0);
  const suffix = trimmed.slice((match.index || 0) + match[0].length);
  return { value, decimals, prefix, suffix };
}

function formatMetricValue(value, decimals) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

function getMetricEntryDelay(index) {
  return HOME_IMPACT_STORY_METRIC_ENTRY_DELAYS[index] || 0;
}

function ImpactStoryHeadline({ headline, highlightedWord = '', className = '' }) {
  const parts = useMemo(
    () => readHeadlineParts(headline, highlightedWord),
    [headline, highlightedWord],
  );

  if (!parts.accent) {
    return <h2 className={className || undefined}>{headline}</h2>;
  }

  return (
    <h2 className={className || undefined}>
      {parts.lead}
      {' '}
      <span className="home-impact-story-accent">{parts.accent}</span>
      {parts.punctuation}
    </h2>
  );
}

function ImpactStoryAction({ action, resolveTo, className = 'home-native-cta' }) {
  if (!action?.label) {
    return null;
  }

  const actionTarget = String(action.to || '').trim();
  const actionHref = String(action.href || actionTarget || '').trim();
  const isExternal = isExternalLinkHref(actionHref);
  const resolvedHref = isExternal ? actionHref : resolveTo(actionTarget, '/about-us/impact');

  if (!resolvedHref) {
    return null;
  }

  if (isExternal) {
    return (
      <a
        href={resolvedHref}
        className={className}
        target={action.openInNewWindow ? '_blank' : undefined}
        rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
      >
        {action.label}
      </a>
    );
  }

  return (
    <Link
      to={resolvedHref}
      className={className}
      target={action.openInNewWindow ? '_blank' : undefined}
      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
    >
      {action.label}
    </Link>
  );
}

function AnimatedMetricValue({ value, progress = 0 }) {
  const parsed = useMemo(() => parseMetricValue(value), [value]);
  if (!parsed) {
    return <span aria-label={String(value || '')}>{String(value || '')}</span>;
  }

  const clampedProgress = clamp(progress, 0, 1);
  const easedProgress = 1 - Math.pow(1 - clampedProgress, 3);
  const nextValue = parsed.value * easedProgress;
  const displayValue = `${parsed.prefix}${formatMetricValue(nextValue, parsed.decimals)}${parsed.suffix}`;

  return <span aria-label={String(value || '')}>{displayValue}</span>;
}

function ImpactStoryMetrics({
  metrics = [],
  animated = false,
  progress = 0,
  countUp = false,
}) {
  const metricCount = Math.max(metrics.length, 1);
  const sequenceProgress = animated
    ? clamp(
      (progress - HOME_IMPACT_STORY_SEQUENCE_START)
        / (HOME_IMPACT_STORY_SEQUENCE_END - HOME_IMPACT_STORY_SEQUENCE_START),
      0,
      1,
    )
    : 0;
  const slotSize = 1 / metricCount;
  const activeIndex = animated
    ? Math.min(metrics.length - 1, Math.floor(sequenceProgress * metricCount))
    : -1;
  const activeLocalProgress = animated
    ? ((sequenceProgress * metricCount) - activeIndex)
    : 0;

  const buildActorState = (metric, index, kind) => {
    const isFinalMetric = index === metrics.length - 1;
    const incomingDelay = getMetricEntryDelay(index);
    const enterDuration = index === 0
      ? HOME_IMPACT_STORY_FIRST_METRIC_ENTER_DURATION
      : Math.max(0.24, 0.54 - incomingDelay);
    const enterOpacityExponent = index === 0
      ? HOME_IMPACT_STORY_FIRST_METRIC_OPACITY_EXPONENT
      : 1.75;
    let motionState = 'static';
    let translateY = 0;
    let metricOpacity = 1;
    let scale = 1;
    let countProgress = 1;

    if (kind === 'incoming') {
      const enterProgress = clamp((activeLocalProgress - incomingDelay) / enterDuration, 0, 1);
      motionState = enterProgress < 1 ? 'entering' : (isFinalMetric ? 'holding' : 'centered');
      translateY = (1 - enterProgress) * 232;
      metricOpacity = Math.pow(enterProgress, enterOpacityExponent);
      scale = 0.992 + (enterProgress * 0.008);
      countProgress = clamp((activeLocalProgress - (0.16 + incomingDelay)) / 0.42, 0, 1);
      if (enterProgress >= 1) {
        translateY = 0;
        metricOpacity = 1;
        scale = 1;
      }
    } else if (kind === 'active') {
      if (isFinalMetric) {
        motionState = 'holding';
        translateY = 0;
        metricOpacity = 1;
        scale = 1;
      } else {
        motionState = 'centered';
        translateY = 0;
        metricOpacity = 1;
        scale = 1;
        countProgress = 1;
      }
    } else if (kind === 'outgoing') {
      const exitProgress = clamp(activeLocalProgress / 0.54, 0, 1);
      motionState = 'exiting';
      translateY = -(exitProgress * 186);
      metricOpacity = 1 - (exitProgress * 0.92);
      scale = 1 - (exitProgress * 0.016);
      countProgress = 1;
    }

    return {
      key: `${metric.value}-${metric.label}-${index}`,
      metric,
      index,
      kind,
      motionState,
      translateY,
      metricOpacity,
      scale,
      countProgress,
    };
  };

  let animatedActors = [];
  if (animated && metrics.length) {
    const currentMetric = metrics[activeIndex];
    const previousMetric = activeIndex > 0 ? metrics[activeIndex - 1] : null;
    const shouldShowOutgoing = Boolean(previousMetric) && activeLocalProgress < 0.54;
    const shouldShowIncoming = activeLocalProgress < 0.54;

    if (shouldShowOutgoing && previousMetric) {
      animatedActors.push(buildActorState(previousMetric, activeIndex - 1, 'outgoing'));
    }

    if (currentMetric) {
      animatedActors.push(buildActorState(
        currentMetric,
        activeIndex,
        shouldShowIncoming ? 'incoming' : 'active',
      ));
    }
  }

  return (
    <div
      className={`home-impact-story-metrics${animated ? ' is-animated' : ''}`}
      data-animated-layout={animated ? 'actor-sequence' : 'static'}
      data-stage-center={animated ? 'stable' : undefined}
    >
      {animated ? (
        <div
          className="home-impact-story-metric-stage"
          data-actor-system="single-metric-sequence"
        >
          {animatedActors.map((actor) => {
            return (
              <div
                key={actor.key}
                className="home-impact-story-metric-actor"
                data-actor-role={actor.kind}
                data-motion-state={actor.motionState}
                style={{
                  opacity: actor.metricOpacity,
                  transform: `translate3d(0, ${actor.translateY}px, 0) scale(${actor.scale})`,
                  zIndex: actor.motionState === 'centered' || actor.motionState === 'holding' ? 3 : 2,
                }}
              >
                <div className="home-impact-story-metric">
                  <p className={`home-native-stat-value home-impact-story-metric-value${countUp ? ' countup' : ''} is-${actor.metric.tone || 'mango'}`}>
                    <AnimatedMetricValue value={actor.metric.value} progress={actor.countProgress} />
                  </p>
                  <p className="home-native-stat-label home-impact-story-metric-label"><strong>{actor.metric.label}</strong></p>
                </div>
              </div>
            );
          })}
        </div>
      ) : metrics.map((metric, index) => (
        <div
          key={`static-${metric.value}-${metric.label}-${index}`}
          className="home-impact-story-metric"
          data-motion-state="static"
        >
          <p className={`home-native-stat-value home-impact-story-metric-value${countUp ? ' countup' : ''} is-${metric.tone || 'mango'}`}>
            {metric.value}
          </p>
          <p className="home-native-stat-label home-impact-story-metric-label"><strong>{metric.label}</strong></p>
        </div>
      ))}
    </div>
  );
}

export function HomeImpactStoryStaticContent({
  headline,
  highlightedWord = '',
  body,
  action,
  metrics = [],
  resolveTo,
  countUp = false,
  reveal = false,
}) {
  return (
    <div className="ag-panel-rail home-impact-story-static-grid">
      <div className={`home-impact-story-static-copy${reveal ? ' fade-up' : ''}`}>
        <ImpactStoryHeadline
          headline={headline}
          highlightedWord={highlightedWord}
          className="home-impact-story-heading"
        />
        {body ? <p className="home-impact-story-body">{body}</p> : null}
      </div>
      <div className={`home-impact-story-static-proof${reveal ? ' fade-up' : ''}`}>
        <ImpactStoryMetrics metrics={metrics} countUp={countUp} />
        <div className="home-native-impact-cta-wrap home-impact-story-cta-wrap home-impact-story-proof-cta-wrap">
          <ImpactStoryAction action={action} resolveTo={resolveTo} className="home-native-cta home-impact-story-cta" />
          <div className="home-impact-story-cta-cue" aria-hidden="true">
            <span className="home-impact-story-scroll-cue-mark" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeImpactStoryFeature({
  headline,
  highlightedWord = '',
  body,
  action,
  metrics = [],
  resolveTo,
}) {
  const shellRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 0 : window.innerWidth
  ));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia(HOME_IMPACT_STORY_REDUCED_MOTION_QUERY)
      : null;
    const syncMotionPreferences = () => {
      setPrefersReducedMotion(Boolean(media?.matches));
      setViewportWidth(window.innerWidth || 0);
    };

    syncMotionPreferences();
    window.addEventListener('resize', syncMotionPreferences);
    media?.addEventListener?.('change', syncMotionPreferences);
    media?.addListener?.(syncMotionPreferences);

    return () => {
      window.removeEventListener('resize', syncMotionPreferences);
      media?.removeEventListener?.('change', syncMotionPreferences);
      media?.removeListener?.(syncMotionPreferences);
    };
  }, []);

  const supportsPinnedStory = HOME_IMPACT_STORY_PINNED_ENABLED
    && !prefersReducedMotion
    && viewportWidth >= HOME_IMPACT_STORY_MIN_WIDTH_PX;
  const supportsFallbackReveal = !prefersReducedMotion && !supportsPinnedStory;

  useClientLayoutEffect(() => {
    if (!supportsPinnedStory || typeof window === 'undefined') {
      setProgress(0);
      return undefined;
    }

    let frameId = 0;
    let settleFrameId = 0;
    let lateSettleFrameId = 0;
    let fontsCancelled = false;
    const updateProgress = () => {
      frameId = 0;
      const shell = shellRef.current;
      if (!shell) {
        return;
      }
      const rect = shell.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const totalScrollable = Math.max(1, rect.height - viewportHeight);
      const nextProgress = clamp((-rect.top) / totalScrollable, 0, 1);
      setProgress((current) => (Math.abs(current - nextProgress) < 0.005 ? current : nextProgress));
    };

    const requestUpdate = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    requestUpdate();
    settleFrameId = window.requestAnimationFrame(() => {
      settleFrameId = 0;
      requestUpdate();
      lateSettleFrameId = window.requestAnimationFrame(() => {
        lateSettleFrameId = 0;
        requestUpdate();
      });
    });

    const handleLoad = () => {
      updateProgress();
      requestUpdate();
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    if (document.fonts?.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(() => {
        if (fontsCancelled) {
          return;
        }
        updateProgress();
        requestUpdate();
      });
    }

    return () => {
      fontsCancelled = true;
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(settleFrameId);
      window.cancelAnimationFrame(lateSettleFrameId);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [supportsPinnedStory]);

  if (!supportsPinnedStory) {
    return (
      <HomeImpactStoryStaticContent
        headline={headline}
        highlightedWord={highlightedWord}
        body={body}
        action={action}
        metrics={metrics}
        resolveTo={resolveTo}
        countUp={supportsFallbackReveal}
        reveal={supportsFallbackReveal}
      />
    );
  }

  const heldProgress = clamp(progress / HOME_IMPACT_STORY_RELEASE_START, 0, 1);
  const copyBaseShift = -34;
  const copyOpacity = 1 - clamp(
    (heldProgress - HOME_IMPACT_STORY_COPY_OPACITY_START) / HOME_IMPACT_STORY_COPY_OPACITY_DURATION,
    0,
    1,
  );
  const copyShift = copyBaseShift + (
    clamp(
      (heldProgress - HOME_IMPACT_STORY_COPY_SHIFT_START) / HOME_IMPACT_STORY_COPY_SHIFT_DURATION,
      0,
      1,
    ) * -148
  );
  const metricsOpacity = clamp(
    (heldProgress - HOME_IMPACT_STORY_PROOF_FADE_START) / HOME_IMPACT_STORY_PROOF_FADE_DURATION,
    0,
    1,
  );
  const finalCtaOpacity = clamp((heldProgress - 0.86) / 0.08, 0, 1);
  const finalCtaShift = (1 - finalCtaOpacity) * 26;
  const backgroundOffset = 8 - (heldProgress * 16);
  const stageGlowOpacity = 0.26 + (metricsOpacity * 0.18);

  return (
    <div
      ref={shellRef}
      className="ag-panel-rail home-impact-story-shell"
      data-enhanced="true"
      data-hold-contract="desktop-pinned-sequence"
      data-release-after="final-metric-hold"
      style={{ '--home-impact-story-runway-vh': `${HOME_IMPACT_STORY_DESKTOP_RUNWAY_VH}vh` }}
    >
      <div className="home-impact-story-pin">
        <div className="home-impact-story-frame">
          <div
            className="home-impact-story-backdrop"
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${backgroundOffset}px, 0)`,
              opacity: stageGlowOpacity,
            }}
          />
          <div className="home-impact-story-stage">
            <div className="home-impact-story-copy-layer" data-stage-layer="copy">
              <div
                className="home-impact-story-copy"
                style={{
                  opacity: copyOpacity,
                  transform: `translate3d(0, ${copyShift}px, 0)`,
                }}
              >
                <ImpactStoryHeadline
                  headline={headline}
                  highlightedWord={highlightedWord}
                  className="home-impact-story-heading"
                />
                {body ? <p className="home-impact-story-body">{body}</p> : null}
                <div className="home-impact-story-scroll-cue" aria-hidden="true">
                  <span className="home-impact-story-scroll-cue-mark" />
                </div>
              </div>
            </div>

            <div
              className="home-impact-story-proof-layer"
              data-stage-layer="proof"
            >
              <div
                className="home-impact-story-proof"
                style={{
                  opacity: metricsOpacity,
                }}
              >
                <ImpactStoryMetrics
                  metrics={metrics}
                  animated
                  progress={heldProgress}
                />
                <div
                  className="home-native-impact-cta-wrap home-impact-story-cta-wrap home-impact-story-proof-cta-wrap"
                  style={{
                    opacity: finalCtaOpacity,
                    transform: `translate3d(0, ${finalCtaShift}px, 0)`,
                  }}
                >
                  <ImpactStoryAction
                    action={action}
                    resolveTo={resolveTo}
                    className="home-native-cta home-impact-story-cta"
                  />
                  <div className="home-impact-story-cta-cue" aria-hidden="true">
                    <span className="home-impact-story-scroll-cue-mark" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
