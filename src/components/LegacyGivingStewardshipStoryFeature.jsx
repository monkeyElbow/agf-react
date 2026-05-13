import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const LEGACY_STORY_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const LEGACY_STORY_MIN_WIDTH_PX = 1100;
const LEGACY_STORY_DESKTOP_RUNWAY_VH = 360;
const LEGACY_STORY_RELEASE_START = 0.9;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

  const normalizedProgress = clamp((progress - 0.06) / 0.88, 0, 1);
  const beatCount = beats.length;
  const sequencePosition = normalizedProgress * beatCount;
  const activeIndex = Math.min(beatCount - 1, Math.floor(sequencePosition));
  const localProgress = sequencePosition - activeIndex;
  const actors = [];

  const incomingBeat = beats[activeIndex];
  if (incomingBeat) {
    const enterProgress = clamp(localProgress / 0.56, 0, 1);
    const isFinalBeat = activeIndex === beatCount - 1;
    actors.push({
      key: `incoming-${activeIndex}`,
      text: incomingBeat,
      role: isFinalBeat && enterProgress >= 1 ? 'holding' : 'incoming',
      motionState: isFinalBeat && enterProgress >= 1 ? 'holding' : (enterProgress < 1 ? 'entering' : 'holding'),
      opacity: 0.18 + (enterProgress * 0.82),
      translateY: (1 - enterProgress) * 72,
      scale: 0.985 + (enterProgress * 0.015),
    });
  }

  const outgoingBeat = activeIndex > 0 ? beats[activeIndex - 1] : '';
  if (outgoingBeat && localProgress < 0.58) {
    const exitProgress = clamp(localProgress / 0.58, 0, 1);
    actors.unshift({
      key: `outgoing-${activeIndex - 1}`,
      text: outgoingBeat,
      role: 'outgoing',
      motionState: 'exiting',
      opacity: 1 - (exitProgress * 0.94),
      translateY: -(exitProgress * 62),
      scale: 1 - (exitProgress * 0.02),
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
            {leadBeats.map((beat) => (
              <li key={beat} className={reveal ? 'fade-up' : undefined}>{beat}</li>
            ))}
          </ol>
        ) : null}
        {finalBeat ? (
          <div className={`legacy-stewardship-story-static-final${reveal ? ' fade-up' : ''}`}>
            <h2>{finalBeat}</h2>
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
  const finalBeatProgress = clamp((heldProgress - 0.74) / 0.18, 0, 1);
  const ctaOpacity = clamp((heldProgress - 0.84) / 0.08, 0, 1);
  const ctaShift = (1 - ctaOpacity) * 20;
  const accentOpacity = 0.18 + (finalBeatProgress * 0.2);

  return (
    <div
      ref={shellRef}
      className="ag-panel-rail legacy-stewardship-story-shell"
      data-enhanced="true"
      data-hold-contract="desktop-pinned-sequence"
      data-release-after="final-message-hold"
      style={{ '--legacy-stewardship-runway-vh': `${LEGACY_STORY_DESKTOP_RUNWAY_VH}vh` }}
    >
      <div className="legacy-stewardship-story-pin">
        <div className="legacy-stewardship-story-frame">
          <div
            className="legacy-stewardship-story-backdrop"
            aria-hidden="true"
            style={{ opacity: accentOpacity }}
          />
          <div className="legacy-stewardship-story-stage">
            <div className="legacy-stewardship-story-stage-copy">
              <div className="legacy-stewardship-story-beat-stage" data-actor-system="single-message-sequence">
                {actors.map((actor) => (
                  <div
                    key={actor.key}
                    className="legacy-stewardship-story-beat-actor"
                    data-actor-role={actor.role}
                    data-motion-state={actor.motionState}
                    style={{
                      opacity: actor.opacity,
                      transform: `translate3d(0, ${actor.translateY}px, 0) scale(${actor.scale})`,
                      zIndex: actor.role === 'outgoing' ? 1 : 2,
                    }}
                  >
                    <h2>{actor.text}</h2>
                  </div>
                ))}
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
