import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const LEGACY_STORY_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const LEGACY_STORY_MIN_WIDTH_PX = 1100;
const LEGACY_STORY_DESKTOP_RUNWAY_VH = 280;
const LEGACY_STORY_RELEASE_START = 0.9;
const LEGACY_STORY_SEQUENCE_START = 0;
const LEGACY_STORY_SEQUENCE_SPAN = 0.9;
const LEGACY_STORY_ENTER_DELAY = 0.03;
const LEGACY_STORY_ENTER_SPAN = 0.28;
const LEGACY_STORY_FIRST_ENTER_DELAY = 0;
const LEGACY_STORY_FIRST_ENTER_SPAN = 0.12;
const LEGACY_STORY_BASE_OPACITY = 0.18;
const LEGACY_STORY_FIRST_BASE_OPACITY = 0.64;
const LEGACY_STORY_TRANSLATE_Y = 92;
const LEGACY_STORY_FIRST_TRANSLATE_Y = 10;
const LEGACY_STORY_ENTER_START_SCALE = 0.9;
const LEGACY_STORY_ENTER_END_SCALE = 1.035;
const LEGACY_STORY_FIRST_ENTER_START_SCALE = 0.965;
const LEGACY_STORY_FIRST_ENTER_END_SCALE = 1.04;
const LEGACY_STORY_EXIT_END_SCALE = 0.94;
const LEGACY_STORY_EXIT_WINDOW = 0.32;
const LEGACY_STORY_EXIT_INITIAL_TRANSLATE_Y = 18;
const LEGACY_STORY_EXIT_TRANSLATE_Y = 104;
const LEGACY_STORY_LIGHT_LEAK_ENTER_START = 0;
const LEGACY_STORY_LIGHT_LEAK_ENTER_END = 0.12;
const LEGACY_STORY_LIGHT_LEAK_PEAK_START = 0.18;
const LEGACY_STORY_LIGHT_LEAK_PEAK_END = 0.62;
const LEGACY_STORY_LIGHT_LEAK_FADE_START = 0.76;
const LEGACY_STORY_LIGHT_LEAK_FADE_END = 0.96;
const LEGACY_STORY_TONE_SEQUENCE = Object.freeze(['atlantean', 'super-grey', 'atlantean-dark']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + ((end - start) * amount);
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - (2 * t));
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function formatNumber(value) {
  return value.toFixed(3);
}

function normalizeBeats(beats = [], headline = '') {
  const normalized = (Array.isArray(beats) ? beats : [])
    .map((beat) => String(beat || '').trim())
    .filter(Boolean);
  const finalBeat = String(headline || normalized[normalized.length - 1] || '').trim();

  if (!normalized.length && finalBeat) {
    return [finalBeat];
  }
  if (!finalBeat) {
    return normalized;
  }
  if (normalized[normalized.length - 1] === finalBeat) {
    return normalized;
  }
  return [...normalized, finalBeat];
}

function getStoryTone(index, beatCount) {
  if (index < 0 || !beatCount) {
    return 'super-grey';
  }
  if (index === beatCount - 1) {
    return 'atlantean';
  }
  return LEGACY_STORY_TONE_SEQUENCE[index % LEGACY_STORY_TONE_SEQUENCE.length];
}

function splitFinalHeadline(text) {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('—');
  if (parts.length < 2) {
    return null;
  }

  const primary = String(parts.shift() || '').trim();
  const secondary = String(parts.join('—') || '').trim();
  if (!primary || !secondary) {
    return null;
  }

  return { primary, secondary };
}

function renderLegacyBeatHeading(text, { final = false } = {}) {
  const normalized = String(text || '').trim();
  if (!final) {
    return normalized;
  }

  const parts = splitFinalHeadline(normalized);
  if (!parts) {
    return normalized;
  }

  return (
    <>
      <span className="legacy-stewardship-story-final-primary">{parts.primary}</span>
      <span className="legacy-stewardship-story-final-divider" aria-hidden="true">—</span>
      <span className="legacy-stewardship-story-final-secondary">{parts.secondary}</span>
    </>
  );
}

function StoryAction({ action, resolveTo, className = 'service-native-btn is-outline is-tone-atlantean' }) {
  if (!action?.label) {
    return null;
  }

  const actionTarget = String(action.to || '').trim();
  const actionHref = String(action.href || actionTarget || '').trim();
  if (!actionHref) {
    return null;
  }

  if (actionHref.startsWith('#')) {
    return <a href={actionHref} className={className}>{action.label}</a>;
  }

  if (isExternalLinkHref(actionHref)) {
    return (
      <a
        href={actionHref}
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
      to={resolveTo(actionTarget, actionHref)}
      className={className}
      target={action.openInNewWindow ? '_blank' : undefined}
      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
    >
      {action.label}
    </Link>
  );
}

function getStoryActors(beats, progress) {
  if (!beats.length) {
    return [];
  }

  const normalizedProgress = clamp((progress - LEGACY_STORY_SEQUENCE_START) / LEGACY_STORY_SEQUENCE_SPAN, 0, 1);
  const beatCount = beats.length;
  const sequencePosition = normalizedProgress * beatCount;
  const activeIndex = Math.min(beatCount - 1, Math.floor(sequencePosition));
  const localProgress = sequencePosition - activeIndex;
  const actors = [];

  const incomingBeat = beats[activeIndex];
  if (incomingBeat) {
    const isFirstBeat = activeIndex === 0;
    const enterDelay = isFirstBeat ? LEGACY_STORY_FIRST_ENTER_DELAY : LEGACY_STORY_ENTER_DELAY;
    const enterSpan = isFirstBeat ? LEGACY_STORY_FIRST_ENTER_SPAN : LEGACY_STORY_ENTER_SPAN;
    const baseOpacity = isFirstBeat ? LEGACY_STORY_FIRST_BASE_OPACITY : LEGACY_STORY_BASE_OPACITY;
    const initialTranslateY = isFirstBeat ? LEGACY_STORY_FIRST_TRANSLATE_Y : LEGACY_STORY_TRANSLATE_Y;
    const startScale = isFirstBeat ? LEGACY_STORY_FIRST_ENTER_START_SCALE : LEGACY_STORY_ENTER_START_SCALE;
    const endScale = isFirstBeat ? LEGACY_STORY_FIRST_ENTER_END_SCALE : LEGACY_STORY_ENTER_END_SCALE;
    const enterProgress = clamp((localProgress - enterDelay) / enterSpan, 0, 1);
    const scaleProgress = smoothstep(0, 0.92, localProgress);
    const isFinalBeat = activeIndex === beatCount - 1;
    actors.push({
      key: `incoming-${activeIndex}`,
      text: incomingBeat,
      tone: getStoryTone(activeIndex, beatCount),
      role: isFinalBeat && enterProgress >= 1 ? 'holding' : 'incoming',
      motionState: isFinalBeat && enterProgress >= 1 ? 'holding' : (enterProgress < 1 ? 'entering' : 'holding'),
      opacity: baseOpacity + (enterProgress * (1 - baseOpacity)),
      translateY: (1 - enterProgress) * initialTranslateY,
      scale: lerp(startScale, endScale, scaleProgress),
    });
  }

  const outgoingBeat = activeIndex > 0 ? beats[activeIndex - 1] : '';
  if (outgoingBeat && localProgress < LEGACY_STORY_EXIT_WINDOW) {
    const exitProgress = clamp(localProgress / LEGACY_STORY_EXIT_WINDOW, 0, 1);
    actors.unshift({
      key: `outgoing-${activeIndex - 1}`,
      text: outgoingBeat,
      tone: getStoryTone(activeIndex - 1, beatCount),
      role: 'outgoing',
      motionState: 'exiting',
      opacity: 1 - (exitProgress * 0.94),
      translateY: -lerp(LEGACY_STORY_EXIT_INITIAL_TRANSLATE_Y, LEGACY_STORY_EXIT_TRANSLATE_Y, exitProgress),
      scale: 1 - (exitProgress * (1 - LEGACY_STORY_EXIT_END_SCALE)),
    });
  }

  return actors;
}

export function LegacyGivingStewardshipStoryStaticContent({
  headline,
  beats = [],
  action,
  resolveTo,
  reveal = false,
}) {
  const normalizedBeats = normalizeBeats(beats, headline);
  const leadBeats = normalizedBeats.slice(0, -1);
  const finalBeat = normalizedBeats[normalizedBeats.length - 1] || String(headline || '').trim();

  return (
    <div className={`ag-panel-rail legacy-stewardship-story-static${reveal ? ' has-reveal' : ''}`}>
      <div className="legacy-stewardship-story-static-shell">
        {leadBeats.length ? (
          <ol className="legacy-stewardship-story-static-beats">
            {leadBeats.map((beat, index) => (
              <li
                key={beat}
                className={reveal ? 'fade-up' : undefined}
                data-tone={getStoryTone(index, normalizedBeats.length)}
              >
                {beat}
              </li>
            ))}
          </ol>
        ) : null}
        {finalBeat ? (
          <div
            className={`legacy-stewardship-story-static-final${reveal ? ' fade-up' : ''}`}
            data-tone={getStoryTone(normalizedBeats.length - 1, normalizedBeats.length)}
          >
            <h2 aria-label={finalBeat}>{renderLegacyBeatHeading(finalBeat, { final: true })}</h2>
            <div className="legacy-stewardship-story-cta-wrap">
              <StoryAction action={action} resolveTo={resolveTo} className="service-native-btn is-outline is-tone-atlantean legacy-stewardship-story-cta" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LegacyGivingStewardshipStoryFeature({
  headline,
  beats = [],
  action,
  resolveTo,
}) {
  const shellRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 0 : window.innerWidth
  ));
  const [progress, setProgress] = useState(0);
  const normalizedBeats = useMemo(
    () => normalizeBeats(beats, headline),
    [beats, headline],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia(LEGACY_STORY_REDUCED_MOTION_QUERY)
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

  const supportsPinnedStory = !prefersReducedMotion && viewportWidth >= LEGACY_STORY_MIN_WIDTH_PX;
  const supportsRevealFallback = !prefersReducedMotion && !supportsPinnedStory;

  useEffect(() => {
    if (!supportsPinnedStory || typeof window === 'undefined') {
      setProgress(0);
      return undefined;
    }

    let frameId = 0;
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

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [supportsPinnedStory]);

  if (!supportsPinnedStory) {
    return (
      <LegacyGivingStewardshipStoryStaticContent
        headline={headline}
        beats={normalizedBeats}
        action={action}
        resolveTo={resolveTo}
        reveal={supportsRevealFallback}
      />
    );
  }

  const heldProgress = clamp(progress / LEGACY_STORY_RELEASE_START, 0, 1);
  const actors = getStoryActors(normalizedBeats, heldProgress);
  const ctaOpacity = clamp((heldProgress - 0.68) / 0.09, 0, 1);
  const ctaShift = (1 - ctaOpacity) * 8;
  const firstCueOpacity = 1 - smoothstep(0.04, 0.16, heldProgress);
  const firstCueShift = (1 - firstCueOpacity) * 8;
  const leakAppear = smoothstep(LEGACY_STORY_LIGHT_LEAK_ENTER_START, LEGACY_STORY_LIGHT_LEAK_ENTER_END, heldProgress);
  const leakBloom = smoothstep(LEGACY_STORY_LIGHT_LEAK_PEAK_START, LEGACY_STORY_LIGHT_LEAK_PEAK_END, heldProgress);
  const leakFade = 1 - smoothstep(LEGACY_STORY_LIGHT_LEAK_FADE_START, LEGACY_STORY_LIGHT_LEAK_FADE_END, heldProgress);
  const leakStrength = leakAppear * leakFade;
  const accentOpacity = 0.24 + (0.46 * leakStrength);
  const shellStyle = {
    '--legacy-stewardship-runway-vh': `${LEGACY_STORY_DESKTOP_RUNWAY_VH}vh`,
    '--legacy-light-leak-a-x': formatPercent(lerp(10, 24, leakBloom)),
    '--legacy-light-leak-a-y': formatPercent(lerp(22, 10, leakBloom)),
    '--legacy-light-leak-a-scale': formatNumber(lerp(1, 1.38, leakBloom)),
    '--legacy-light-leak-a-opacity': formatNumber(lerp(0.22, 0.46, leakStrength)),
    '--legacy-light-leak-b-x': formatPercent(lerp(92, 74, leakBloom)),
    '--legacy-light-leak-b-y': formatPercent(lerp(74, 56, leakBloom)),
    '--legacy-light-leak-b-scale': formatNumber(lerp(1.02, 1.46, leakBloom)),
    '--legacy-light-leak-b-opacity': formatNumber(lerp(0.18, 0.38, leakStrength)),
    '--legacy-light-leak-c-x': formatPercent(lerp(50, 84, leakBloom)),
    '--legacy-light-leak-c-y': formatPercent(lerp(12, 34, leakBloom)),
    '--legacy-light-leak-c-scale': formatNumber(lerp(0.92, 1.32, leakBloom)),
    '--legacy-light-leak-c-opacity': formatNumber(lerp(0.14, 0.3, leakStrength)),
    '--legacy-light-leak-fade': formatNumber(leakFade),
  };

  return (
    <div
      ref={shellRef}
      className="ag-panel-rail legacy-stewardship-story-shell"
      data-enhanced="true"
      data-scroll-gradient-motion="enabled"
      data-hold-contract="desktop-pinned-sequence"
      data-release-after="final-message-hold"
      style={shellStyle}
    >
      <div className="legacy-stewardship-story-pin">
        <div className="legacy-stewardship-story-frame">
          <div className="legacy-stewardship-story-light-leaks" aria-hidden="true">
            <div className="legacy-stewardship-story-light-leak is-a" />
            <div className="legacy-stewardship-story-light-leak is-b" />
            <div className="legacy-stewardship-story-light-leak is-c" />
          </div>
          <div
            className="legacy-stewardship-story-backdrop"
            aria-hidden="true"
            style={{ opacity: accentOpacity }}
          />
          <div className="legacy-stewardship-story-stage">
            <div className="legacy-stewardship-story-stage-copy">
              <div className="legacy-stewardship-story-beat-stage" data-actor-system="single-message-sequence">
                {actors.map((actor) => (
                  (() => {
                    const isFinalBeat = actor.tone === 'atlantean' && actor.text === headline;
                    return (
                      <div
                        key={actor.key}
                        className="legacy-stewardship-story-beat-actor"
                        data-actor-role={actor.role}
                        data-motion-state={actor.motionState}
                        data-tone={actor.tone}
                        style={{
                          opacity: actor.opacity,
                          transform: `translate3d(0, ${actor.translateY}px, 0) scale(${actor.scale})`,
                          zIndex: actor.role === 'outgoing' ? 1 : 2,
                        }}
                      >
                        <h2 aria-label={isFinalBeat ? actor.text : undefined}>
                          {renderLegacyBeatHeading(actor.text, { final: isFinalBeat })}
                        </h2>
                      </div>
                    );
                  })()
                ))}
              </div>
              <div
                className="legacy-stewardship-story-first-cue"
                aria-hidden="true"
                style={{
                  opacity: firstCueOpacity,
                  transform: `translate3d(0, ${firstCueShift}px, 0)`,
                }}
              >
                <span className="legacy-stewardship-story-first-cue-mark" />
              </div>
            </div>
            <div
              className="legacy-stewardship-story-stage-action"
              style={{
                opacity: ctaOpacity,
                transform: `translate3d(0, ${ctaShift}px, 0)`,
              }}
            >
              <StoryAction action={action} resolveTo={resolveTo} className="service-native-btn is-outline is-tone-atlantean legacy-stewardship-story-cta" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
