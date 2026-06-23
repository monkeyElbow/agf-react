import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const HOME_IMPACT_STORY_PINNED_ENABLED = true;
const HOME_IMPACT_STORY_MIN_WIDTH_PX = 1040;
const HOME_IMPACT_STORY_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const HOME_IMPACT_STORY_DESKTOP_RUNWAY_VH = 400;
const HOME_IMPACT_STORY_RELEASE_START = 0.96;
const HOME_IMPACT_STORY_METRIC_ENTRY_DELAYS = [0, 0.08, 0.14];
const HOME_IMPACT_STORY_METRIC_SETTLE_POINTS = [0.78, 0.78, 0.88];
const HOME_IMPACT_STORY_OUTGOING_WINDOW = 0.44;
const HOME_IMPACT_STORY_COPY_SHIFT_START = 0.04;
const HOME_IMPACT_STORY_COPY_SHIFT_DURATION = 0.3;
const HOME_IMPACT_STORY_COPY_OPACITY_START = 0.04;
const HOME_IMPACT_STORY_COPY_OPACITY_DURATION = 0.24;
const HOME_IMPACT_STORY_HEADING_LOCK_DURATION = 0.28;
const HOME_IMPACT_STORY_HEADING_TRAVEL_PX = 132;
const HOME_IMPACT_STORY_SEQUENCE_START = 0.18;
const HOME_IMPACT_STORY_SEQUENCE_END = 0.94;
const HOME_IMPACT_STORY_PROOF_FADE_START = 0.14;
const HOME_IMPACT_STORY_PROOF_FADE_DURATION = 0.12;
const HOME_IMPACT_STORY_FIRST_METRIC_OPACITY_EXPONENT = 1.35;
const HOME_IMPACT_STORY_METRIC_COUNT_START = 0.24;
const HOME_IMPACT_STORY_METRIC_COUNT_DURATION = 0.5;
const HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX = 104;
const HOME_IMPACT_STORY_METRIC_ENTRY_TRAVEL_PX = 324;
const HOME_IMPACT_STORY_METRIC_EXIT_TRAVEL_PX = 192;
const HOME_IMPACT_STORY_METRIC_EXIT_FADE_CUTOFF = 0.48;
const HOME_IMPACT_STORY_METRIC_EXIT_OPACITY_EXPONENT = 0.82;
const HOME_IMPACT_STORY_FINAL_METRIC_SETTLE_POINT = 0.8;
const HOME_IMPACT_STORY_FINAL_METRIC_COUNT_START = 0.2;
const HOME_IMPACT_STORY_FINAL_METRIC_COUNT_DURATION = 0.5;
const HOME_IMPACT_STORY_END_PANEL_START = 0.95;
const HOME_IMPACT_STORY_END_PANEL_DURATION = 0.035;
const HOME_IMPACT_STORY_END_PANEL_METRIC_CLEAR_LEAD = 0.012;
const HOME_IMPACT_STORY_END_PANEL_LOCK_START = 0.985;
const HOME_IMPACT_STORY_HEADING_EXIT_TRAVEL_PX = 118;
const HOME_IMPACT_STORY_END_PANEL_SHIFT_PX = 28;
const HOME_IMPACT_STORY_ENDING_LINE = 'Because your mission is ours too.';
const HOME_IMPACT_STORY_PALETTE_HANDOFF_CURVES = Object.freeze({
  start: 0.16,
  end: 0.78,
});
const HOME_IMPACT_STORY_TONE_PALETTES = Object.freeze({
  mango: Object.freeze({
    base: Object.freeze([246, 177, 70]),
    secondary: Object.freeze([255, 205, 118]),
    light: Object.freeze([255, 233, 188]),
    dark: Object.freeze([176, 114, 24]),
    accent: Object.freeze([255, 246, 224]),
  }),
  atlantean: Object.freeze({
    base: Object.freeze([0, 138, 171]),
    secondary: Object.freeze([94, 218, 227]),
    light: Object.freeze([216, 251, 255]),
    dark: Object.freeze([0, 95, 118]),
    accent: Object.freeze([239, 254, 255]),
  }),
  sandstone: Object.freeze({
    base: Object.freeze([218, 215, 208]),
    secondary: Object.freeze([235, 231, 225]),
    light: Object.freeze([247, 244, 240]),
    dark: Object.freeze([166, 160, 151]),
    accent: Object.freeze([255, 252, 247]),
  }),
});
const HOME_IMPACT_STORY_GRADIENT_PROFILES = Object.freeze({
  intro: Object.freeze({
    lightX: 18,
    lightY: 16,
    lightWidth: 88,
    lightHeight: 80,
    secondaryX: 84,
    secondaryY: 76,
    secondaryWidth: 66,
    secondaryHeight: 62,
    baseX: 52,
    baseY: 108,
    baseWidth: 142,
    baseHeight: 114,
    angle: 144,
  }),
  mango: Object.freeze({
    lightX: 82,
    lightY: 20,
    lightWidth: 86,
    lightHeight: 76,
    secondaryX: 18,
    secondaryY: 82,
    secondaryWidth: 66,
    secondaryHeight: 60,
    baseX: 60,
    baseY: 110,
    baseWidth: 148,
    baseHeight: 118,
    angle: 158,
  }),
  atlanteanMetric: Object.freeze({
    lightX: 18,
    lightY: 20,
    lightWidth: 82,
    lightHeight: 72,
    secondaryX: 84,
    secondaryY: 16,
    secondaryWidth: 62,
    secondaryHeight: 54,
    baseX: 88,
    baseY: 112,
    baseWidth: 176,
    baseHeight: 148,
    angle: 126,
  }),
  sandstone: Object.freeze({
    lightX: 84,
    lightY: 18,
    lightWidth: 88,
    lightHeight: 78,
    secondaryX: 28,
    secondaryY: 84,
    secondaryWidth: 68,
    secondaryHeight: 62,
    baseX: 58,
    baseY: 110,
    baseWidth: 146,
    baseHeight: 118,
    angle: 166,
  }),
});
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

function getMetricSettlePoint(index) {
  return HOME_IMPACT_STORY_METRIC_SETTLE_POINTS[index]
    ?? HOME_IMPACT_STORY_METRIC_SETTLE_POINTS[HOME_IMPACT_STORY_METRIC_SETTLE_POINTS.length - 1]
    ?? 0.78;
}

function resolveImpactStoryPalette(tone = '') {
  return HOME_IMPACT_STORY_TONE_PALETTES[String(tone || '').trim()]
    || HOME_IMPACT_STORY_TONE_PALETTES.atlantean;
}

function resolveImpactStoryGradientProfile(key = '') {
  return HOME_IMPACT_STORY_GRADIENT_PROFILES[String(key || '').trim()]
    || HOME_IMPACT_STORY_GRADIENT_PROFILES.intro;
}

function buildImpactStoryPaletteVars({ current, next, currentProfile, nextProfile, handoff }) {
  return {
    '--home-impact-story-base-rgb': current.base.join(', '),
    '--home-impact-story-secondary-rgb': current.secondary.join(', '),
    '--home-impact-story-light-rgb': current.light.join(', '),
    '--home-impact-story-dark-rgb': current.dark.join(', '),
    '--home-impact-story-accent-rgb': current.accent.join(', '),
    '--home-impact-story-next-base-rgb': next.base.join(', '),
    '--home-impact-story-next-secondary-rgb': next.secondary.join(', '),
    '--home-impact-story-next-light-rgb': next.light.join(', '),
    '--home-impact-story-next-dark-rgb': next.dark.join(', '),
    '--home-impact-story-next-accent-rgb': next.accent.join(', '),
    '--home-impact-story-light-x': `${currentProfile.lightX}%`,
    '--home-impact-story-light-y': `${currentProfile.lightY}%`,
    '--home-impact-story-light-width': `${currentProfile.lightWidth}%`,
    '--home-impact-story-light-height': `${currentProfile.lightHeight}%`,
    '--home-impact-story-secondary-x': `${currentProfile.secondaryX}%`,
    '--home-impact-story-secondary-y': `${currentProfile.secondaryY}%`,
    '--home-impact-story-secondary-width': `${currentProfile.secondaryWidth}%`,
    '--home-impact-story-secondary-height': `${currentProfile.secondaryHeight}%`,
    '--home-impact-story-base-x': `${currentProfile.baseX}%`,
    '--home-impact-story-base-y': `${currentProfile.baseY}%`,
    '--home-impact-story-base-width': `${currentProfile.baseWidth}%`,
    '--home-impact-story-base-height': `${currentProfile.baseHeight}%`,
    '--home-impact-story-angle': `${currentProfile.angle}deg`,
    '--home-impact-story-next-light-x': `${nextProfile.lightX}%`,
    '--home-impact-story-next-light-y': `${nextProfile.lightY}%`,
    '--home-impact-story-next-light-width': `${nextProfile.lightWidth}%`,
    '--home-impact-story-next-light-height': `${nextProfile.lightHeight}%`,
    '--home-impact-story-next-secondary-x': `${nextProfile.secondaryX}%`,
    '--home-impact-story-next-secondary-y': `${nextProfile.secondaryY}%`,
    '--home-impact-story-next-secondary-width': `${nextProfile.secondaryWidth}%`,
    '--home-impact-story-next-secondary-height': `${nextProfile.secondaryHeight}%`,
    '--home-impact-story-next-base-x': `${nextProfile.baseX}%`,
    '--home-impact-story-next-base-y': `${nextProfile.baseY}%`,
    '--home-impact-story-next-base-width': `${nextProfile.baseWidth}%`,
    '--home-impact-story-next-base-height': `${nextProfile.baseHeight}%`,
    '--home-impact-story-next-angle': `${nextProfile.angle}deg`,
    '--home-impact-story-palette-handoff': handoff.toFixed(3),
  };
}

function resolveImpactStoryPaletteState(metrics = [], progress = 0, animated = false) {
  const normalizedMetrics = Array.isArray(metrics) ? metrics.filter(Boolean) : [];
  const introPalette = resolveImpactStoryPalette('atlantean');
  const introProfile = resolveImpactStoryGradientProfile('intro');
  const firstPalette = resolveImpactStoryPalette(normalizedMetrics[0]?.tone);
  const firstProfile = resolveImpactStoryGradientProfile('mango');

  if (!animated || normalizedMetrics.length <= 1) {
    return {
      current: introPalette,
      next: firstPalette,
      currentProfile: introProfile,
      nextProfile: firstProfile,
      handoff: 0,
    };
  }

  if (progress < HOME_IMPACT_STORY_SEQUENCE_START) {
    return {
      current: introPalette,
      next: firstPalette,
      currentProfile: introProfile,
      nextProfile: firstProfile,
      handoff: clamp(
        (progress - HOME_IMPACT_STORY_PROOF_FADE_START)
          / (HOME_IMPACT_STORY_SEQUENCE_START - HOME_IMPACT_STORY_PROOF_FADE_START || 1),
        0,
        1,
      ),
    };
  }

  const metricCount = normalizedMetrics.length;
  const sequenceProgress = clamp(
    (progress - HOME_IMPACT_STORY_SEQUENCE_START)
      / (HOME_IMPACT_STORY_SEQUENCE_END - HOME_IMPACT_STORY_SEQUENCE_START),
    0,
    1,
  );
  const scaledProgress = sequenceProgress * metricCount;
  const activeIndex = Math.min(metricCount - 1, Math.floor(scaledProgress));
  const activeLocalProgress = scaledProgress - activeIndex;
  const profileKeys = ['mango', 'atlanteanMetric', 'sandstone'];
  const previousIndex = activeIndex - 1;
  const shouldBlendFromPrevious = previousIndex >= 0
    && activeLocalProgress < HOME_IMPACT_STORY_OUTGOING_WINDOW;

  if (shouldBlendFromPrevious) {
    const overlapProgress = clamp(
      activeLocalProgress / HOME_IMPACT_STORY_OUTGOING_WINDOW,
      0,
      1,
    );

    return {
      current: resolveImpactStoryPalette(normalizedMetrics[previousIndex]?.tone),
      next: resolveImpactStoryPalette(normalizedMetrics[activeIndex]?.tone),
      currentProfile: resolveImpactStoryGradientProfile(profileKeys[previousIndex]),
      nextProfile: resolveImpactStoryGradientProfile(profileKeys[activeIndex]),
      handoff: clamp(
        (overlapProgress - HOME_IMPACT_STORY_PALETTE_HANDOFF_CURVES.start)
          / (HOME_IMPACT_STORY_PALETTE_HANDOFF_CURVES.end - HOME_IMPACT_STORY_PALETTE_HANDOFF_CURVES.start),
        0,
        1,
      ),
    };
  }

  return {
    current: resolveImpactStoryPalette(normalizedMetrics[activeIndex]?.tone),
    next: resolveImpactStoryPalette(normalizedMetrics[activeIndex]?.tone),
    currentProfile: resolveImpactStoryGradientProfile(profileKeys[activeIndex]),
    nextProfile: resolveImpactStoryGradientProfile(profileKeys[activeIndex]),
    handoff: 0,
  };
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

function ImpactStoryBrandMark() {
  return (
    <div className="home-impact-story-brand-mark-wrap" aria-hidden="true">
      <svg
        className="home-impact-story-brand-mark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 145.87 144.22"
      >
        <path
          d="M145.87 0H0v144.22h145.87z M121.19 111.98c-4.5-.12-5.75-.24-9.54-.24s-2.83.13-9.35.24v-1.03c2.79 0-1.29-6.54-1.86-7.85L74.4 56.29h-.75S49 100.7 48.04 102.34c-1.99 3.57-4.77 8.69-2.3 8.69v.95c-4.86-.12-4.87-.24-9.61-.24s-5.39.12-9.42.24v-.95c1.95 0 3.38-4.11 6.62-9.36 1.64-2.9 40.33-71.75 40.33-71.75h.76l41.29 73.69c2.41 4.16 3.85 7.42 5.48 7.42z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

function ImpactStoryEndingLine({ children = HOME_IMPACT_STORY_ENDING_LINE }) {
  return (
    <h2
      className="home-impact-story-proof-intro"
      style={{
        color: '#ffffff',
        WebkitTextFillColor: '#ffffff',
      }}
    >
      {children}
    </h2>
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
    const settlePoint = isFinalMetric
      ? Math.min(getMetricSettlePoint(index), HOME_IMPACT_STORY_FINAL_METRIC_SETTLE_POINT)
      : getMetricSettlePoint(index);
    const enterDuration = Math.max(0.26, settlePoint - incomingDelay);
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
      translateY = HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX
        + ((1 - enterProgress) * HOME_IMPACT_STORY_METRIC_ENTRY_TRAVEL_PX);
      metricOpacity = Math.pow(enterProgress, enterOpacityExponent);
      scale = 0.992 + (enterProgress * 0.008);
      const countStart = isFinalMetric
        ? HOME_IMPACT_STORY_FINAL_METRIC_COUNT_START
        : HOME_IMPACT_STORY_METRIC_COUNT_START + incomingDelay;
      const countDuration = isFinalMetric
        ? HOME_IMPACT_STORY_FINAL_METRIC_COUNT_DURATION
        : HOME_IMPACT_STORY_METRIC_COUNT_DURATION;
      countProgress = clamp(
        (activeLocalProgress - countStart) / countDuration,
        0,
        1,
      );
      if (enterProgress >= 1) {
        translateY = HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX;
        metricOpacity = 1;
        scale = 1;
        if (isFinalMetric) {
          countProgress = 1;
        }
      }
    } else if (kind === 'active') {
      if (isFinalMetric) {
        motionState = 'holding';
        translateY = HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX;
        metricOpacity = 1;
        scale = 1;
      } else {
        motionState = 'centered';
        translateY = HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX;
        metricOpacity = 1;
        scale = 1;
        countProgress = 1;
      }
    } else if (kind === 'outgoing') {
      const exitProgress = clamp(activeLocalProgress / HOME_IMPACT_STORY_OUTGOING_WINDOW, 0, 1);
      const exitFadeProgress = clamp(
        exitProgress / HOME_IMPACT_STORY_METRIC_EXIT_FADE_CUTOFF,
        0,
        1,
      );
      motionState = 'exiting';
      translateY = HOME_IMPACT_STORY_METRIC_BASE_OFFSET_PX
        - (exitProgress * HOME_IMPACT_STORY_METRIC_EXIT_TRAVEL_PX);
      metricOpacity = 1 - Math.pow(
        exitFadeProgress,
        HOME_IMPACT_STORY_METRIC_EXIT_OPACITY_EXPONENT,
      );
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
    const shouldShowOutgoing = Boolean(previousMetric) && activeLocalProgress < HOME_IMPACT_STORY_OUTGOING_WINDOW;
    const shouldShowIncoming = true;

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
                  <div className="home-impact-story-metric-frame">
                    <p className={`home-native-stat-value home-impact-story-metric-value${countUp ? ' countup' : ''} is-${actor.metric.tone || 'mango'}${actor.index === metrics.length - 1 ? ' is-final-metric' : ''}`}>
                      <AnimatedMetricValue value={actor.metric.value} progress={actor.countProgress} />
                    </p>
                    <p className="home-native-stat-label home-impact-story-metric-label"><strong>{actor.metric.label}</strong></p>
                  </div>
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
          <div className="home-impact-story-metric-frame">
            <p className={`home-native-stat-value home-impact-story-metric-value${countUp ? ' countup' : ''} is-${metric.tone || 'mango'}${index === metrics.length - 1 ? ' is-final-metric' : ''}`}>
              {metric.value}
            </p>
            <p className="home-native-stat-label home-impact-story-metric-label"><strong>{metric.label}</strong></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeImpactStoryStaticContent({
  headline,
  highlightedWord = '',
  body,
  metrics = [],
  countUp = false,
  reveal = false,
}) {
  const paletteVars = useMemo(
    () => buildImpactStoryPaletteVars(resolveImpactStoryPaletteState(metrics, 0, false)),
    [metrics],
  );

  return (
    <div className="home-impact-story">
      <div className="home-impact-story-surface" style={paletteVars}>
        <div className="ag-panel-rail home-impact-story-static-grid">
          <div className={`home-impact-story-static-copy${reveal ? ' fade-up' : ''}`}>
            <ImpactStoryBrandMark />
            <ImpactStoryHeadline
              headline={headline}
              highlightedWord={highlightedWord}
              className="home-impact-story-heading"
            />
            {body ? <p className="home-impact-story-body">{body}</p> : null}
          </div>
          <div className={`home-impact-story-static-proof${reveal ? ' fade-up' : ''}`}>
            <ImpactStoryMetrics metrics={metrics} countUp={countUp} />
            <div className="home-impact-story-proof-cta-block">
              <ImpactStoryEndingLine />
            </div>
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
  metrics = [],
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
        metrics={metrics}
        countUp={supportsFallbackReveal}
        reveal={supportsFallbackReveal}
      />
    );
  }

  const heldProgress = clamp(progress / HOME_IMPACT_STORY_RELEASE_START, 0, 1);
  const paletteVars = buildImpactStoryPaletteVars(
    resolveImpactStoryPaletteState(metrics, heldProgress, true),
  );
  const supportOpacity = 1 - clamp(
    (heldProgress - HOME_IMPACT_STORY_COPY_OPACITY_START) / HOME_IMPACT_STORY_COPY_OPACITY_DURATION,
    0,
    1,
  );
  const supportShift = -12 + (
    clamp(
      (heldProgress - HOME_IMPACT_STORY_COPY_SHIFT_START) / HOME_IMPACT_STORY_COPY_SHIFT_DURATION,
      0,
      1,
    ) * -148
  );
  const headingShift = -34 + (
    clamp(heldProgress / HOME_IMPACT_STORY_HEADING_LOCK_DURATION, 0, 1)
      * -HOME_IMPACT_STORY_HEADING_TRAVEL_PX
  );
  const metricsOpacity = clamp(
    (heldProgress - HOME_IMPACT_STORY_PROOF_FADE_START) / HOME_IMPACT_STORY_PROOF_FADE_DURATION,
    0,
    1,
  );
  const endPanelProgress = clamp(
    (heldProgress - HOME_IMPACT_STORY_END_PANEL_START) / HOME_IMPACT_STORY_END_PANEL_DURATION,
    0,
    1,
  );
  const endPanelMetricClearProgress = clamp(
    (heldProgress - (HOME_IMPACT_STORY_END_PANEL_START - HOME_IMPACT_STORY_END_PANEL_METRIC_CLEAR_LEAD))
      / HOME_IMPACT_STORY_END_PANEL_METRIC_CLEAR_LEAD,
    0,
    1,
  );
  const isEndPanelLocked = heldProgress >= HOME_IMPACT_STORY_END_PANEL_LOCK_START;
  const finalSupportOpacity = isEndPanelLocked ? 0 : supportOpacity;
  const headingOpacity = isEndPanelLocked ? 0 : (1 - endPanelProgress);
  const headingExitShift = headingShift - (endPanelProgress * HOME_IMPACT_STORY_HEADING_EXIT_TRAVEL_PX);
  const backgroundOffset = 8 - (heldProgress * 16);
  const stageGlowOpacity = 0.26 + (metricsOpacity * 0.18);
  const endPanelOpacity = isEndPanelLocked ? 1 : endPanelProgress;
  const endPanelShift = (1 - endPanelOpacity) * HOME_IMPACT_STORY_END_PANEL_SHIFT_PX;

  return (
    <div className="home-impact-story">
      <div className="home-impact-story-surface" style={paletteVars}>
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
                  <div className="home-impact-story-heading-lock">
                    <div
                      className="home-impact-story-heading-shell"
                      style={{
                        opacity: headingOpacity,
                        transform: `translate3d(0, ${headingExitShift}px, 0)`,
                      }}
                    >
                      <div
                        className="home-impact-story-heading-brand"
                        style={{
                          opacity: finalSupportOpacity,
                          transform: `translate3d(0, ${supportShift}px, 0)`,
                        }}
                      >
                        <ImpactStoryBrandMark />
                      </div>
                      <ImpactStoryHeadline
                        headline={headline}
                        highlightedWord={highlightedWord}
                        className="home-impact-story-heading"
                      />
                    </div>
                  </div>
                  <div
                    className="home-impact-story-copy"
                    style={{
                      opacity: finalSupportOpacity,
                      transform: `translate3d(0, ${supportShift}px, 0)`,
                    }}
                  >
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
                      opacity: isEndPanelLocked ? 0 : (metricsOpacity * (1 - endPanelMetricClearProgress)),
                    }}
                  >
                    {isEndPanelLocked ? null : (
                      <ImpactStoryMetrics
                        metrics={metrics}
                        animated
                        progress={heldProgress}
                      />
                    )}
                  </div>
                  <div
                    className="home-impact-story-proof-cta-block"
                    style={{
                      opacity: endPanelOpacity,
                      transform: `translate3d(0, ${endPanelShift}px, 0)`,
                    }}
                  >
                    <ImpactStoryEndingLine />
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
