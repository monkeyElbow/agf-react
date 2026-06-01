import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const IMPACT_PROOF_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMPACT_PROOF_PANEL_MOTION_PRESETS = Object.freeze({
  default: Object.freeze({
    lightStrength: [1.18, 0.12],
    lightX: [58, -8],
    lightY: [78, 14],
    lightWidth: [136, 34],
    lightHeight: [112, 26],
    lightSecondaryX: [72, 106],
    lightSecondaryY: [14, 4],
    lightSecondaryWidth: [62, 18],
    lightSecondaryHeight: [46, 14],
    darkStrength: [0.24, 1.18],
    darkX: [82, 18],
    darkY: [18, 10],
    darkWidth: [78, 164],
    darkHeight: [66, 146],
    darkAngle: [118, 194],
    darkStop1: [18, 4],
    darkStop2: [44, 12],
    darkStop3: [74, 20],
  }),
  0: Object.freeze({
    lightStrength: [1.2, 0.08],
    lightX: [104, 12],
    lightY: [84, 24],
    lightWidth: [146, 40],
    lightHeight: [118, 30],
    lightSecondaryX: [10, -12],
    lightSecondaryY: [14, 4],
    lightSecondaryWidth: [84, 44],
    lightSecondaryHeight: [62, 28],
    darkStrength: [0.22, 1.24],
    darkX: [18, 90],
    darkY: [12, 18],
    darkWidth: [92, 192],
    darkHeight: [78, 172],
    darkAngle: [108, 202],
    darkStop1: [18, 2],
    darkStop2: [44, 10],
    darkStop3: [74, 18],
  }),
  1: Object.freeze({
    lightStrength: [0.92, 0.08],
    lightX: [4, 62],
    lightY: [12, 56],
    lightWidth: [112, 30],
    lightHeight: [88, 24],
    lightSecondaryX: [108, 60],
    lightSecondaryY: [88, 54],
    lightSecondaryWidth: [42, 14],
    lightSecondaryHeight: [26, 10],
    darkStrength: [0.28, 1.04],
    darkX: [84, 24],
    darkY: [26, 14],
    darkWidth: [86, 142],
    darkHeight: [72, 128],
    darkAngle: [136, 190],
    darkStop1: [18, 4],
    darkStop2: [42, 12],
    darkStop3: [72, 22],
  }),
  2: Object.freeze({
    lightStrength: [1.24, 0.12],
    lightX: [54, -6],
    lightY: [76, 92],
    lightWidth: [140, 58],
    lightHeight: [118, 54],
    lightSecondaryX: [76, 116],
    lightSecondaryY: [20, 4],
    lightSecondaryWidth: [86, 34],
    lightSecondaryHeight: [62, 28],
    darkStrength: [0.22, 1.06],
    darkX: [78, 28],
    darkY: [16, 12],
    darkWidth: [78, 144],
    darkHeight: [64, 126],
    darkAngle: [122, 184],
    darkStop1: [18, 4],
    darkStop2: [44, 12],
    darkStop3: [74, 22],
  }),
  3: Object.freeze({
    lightStrength: [0.84, 0.06],
    lightX: [48, 8],
    lightY: [44, 18],
    lightWidth: [96, 28],
    lightHeight: [74, 20],
    lightSecondaryX: [96, 54],
    lightSecondaryY: [70, 40],
    lightSecondaryWidth: [34, 14],
    lightSecondaryHeight: [24, 10],
    darkStrength: [0.32, 1.18],
    darkX: [70, 12],
    darkY: [38, 12],
    darkWidth: [104, 168],
    darkHeight: [88, 146],
    darkAngle: [140, 198],
    darkStop1: [20, 4],
    darkStop2: [44, 12],
    darkStop3: [70, 20],
  }),
});

const IMPACT_PROOF_MOTION_CURVES = Object.freeze({
  lightTravelStart: 0,
  lightTravelEnd: 0.62,
  darkTravelStart: 0.08,
  darkTravelEnd: 0.86,
  fadeInStart: 0,
  fadeInEnd: 0.22,
  fadeOutStart: 0.6,
  fadeOutEnd: 0.92,
  actionRevealStart: 0.1,
  actionRevealEnd: 0.34,
  actionFadeStart: 0.68,
  actionFadeEnd: 0.96,
});

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

function resolvePanelMotionPreset(panel) {
  if (!panel) {
    return IMPACT_PROOF_PANEL_MOTION_PRESETS.default;
  }

  const index = panel.getAttribute('data-proof-index') || 'default';
  return IMPACT_PROOF_PANEL_MOTION_PRESETS[index] || IMPACT_PROOF_PANEL_MOTION_PRESETS.default;
}

function applyRangeProperty(panel, property, values, formatter, amount) {
  if (!Array.isArray(values) || values.length < 2) {
    return;
  }

  panel.style.setProperty(property, formatter(lerp(values[0], values[1], amount)));
}

function clearImpactProofMotionVars(panel) {
  if (!panel?.style) {
    return;
  }

  [
    '--impact-proof-light-strength',
    '--impact-proof-light-x',
    '--impact-proof-light-y',
    '--impact-proof-light-width',
    '--impact-proof-light-height',
    '--impact-proof-light-secondary-x',
    '--impact-proof-light-secondary-y',
    '--impact-proof-light-secondary-width',
    '--impact-proof-light-secondary-height',
    '--impact-proof-panel-opacity',
    '--impact-proof-dark-strength',
    '--impact-proof-dark-x',
    '--impact-proof-dark-y',
    '--impact-proof-dark-width',
    '--impact-proof-dark-height',
    '--impact-proof-dark-angle',
    '--impact-proof-dark-stop-1',
    '--impact-proof-dark-stop-2',
    '--impact-proof-dark-stop-3',
    '--impact-proof-copy-opacity',
    '--impact-proof-copy-scale',
    '--impact-proof-copy-shift-y',
    '--impact-proof-action-opacity',
    '--impact-proof-action-scale',
    '--impact-proof-action-shift-y',
  ].forEach((property) => {
    panel.style.removeProperty(property);
  });
}

function normalizeMetricAction(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const label = String(action.label || '').trim();
  const to = String(action.to || '').trim();
  const href = String(action.href || '').trim();
  const openInNewWindow = Boolean(action.openInNewWindow);
  if (!label || (!to && !href)) {
    return null;
  }

  return {
    label,
    to,
    href,
    openInNewWindow,
  };
}

function normalizeMetrics(metrics = []) {
  return (Array.isArray(metrics) ? metrics : [])
    .map((metric) => {
      if (!metric || typeof metric !== 'object') {
        return null;
      }

      const value = String(metric.value || '').trim();
      const label = String(metric.label || '').trim();
      if (!value || !label) {
        return null;
      }

      return {
        value,
        label,
        body: String(metric.body || '').trim(),
        eyebrow: String(metric.eyebrow || '').trim(),
        tone: String(metric.tone || '').trim() || 'atlantean',
        valueTone: String(metric.valueTone || '').trim(),
        labelBreak: String(metric.labelBreak || '').trim(),
        action: normalizeMetricAction(metric.action),
      };
    })
    .filter(Boolean);
}

function ImpactProofAction({ action, resolveTo, className }) {
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

function renderImpactIntroHeading(heading) {
  const normalizedHeading = String(heading || '').trim();
  if (!normalizedHeading) {
    return null;
  }

  if (normalizedHeading === 'Serving you, alongside you.') {
    return (
      <>
        Serving you,
        <br />
        alongside you.
      </>
    );
  }

  return normalizedHeading;
}

export function ImpactProofStoryEditorialContent({
  intro = null,
  body = '',
  metrics = [],
  action = null,
  resolveTo,
}) {
  const shellRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const normalizedMetrics = useMemo(() => normalizeMetrics(metrics), [metrics]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia(IMPACT_PROOF_REDUCED_MOTION_QUERY)
      : null;
    const syncMotionPreference = () => {
      setPrefersReducedMotion(Boolean(media?.matches));
    };

    syncMotionPreference();
    media?.addEventListener?.('change', syncMotionPreference);
    media?.addListener?.(syncMotionPreference);

    return () => {
      media?.removeEventListener?.('change', syncMotionPreference);
      media?.removeListener?.(syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const shell = shellRef.current;
    const panels = shell ? Array.from(shell.querySelectorAll('.impact-proof-story-proof')) : [];
    if (!panels.length) {
      return undefined;
    }

    if (prefersReducedMotion) {
      panels.forEach(clearImpactProofMotionVars);
      return undefined;
    }

    let frameId = 0;
    const applyPanelMotion = () => {
      frameId = 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

      panels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const viewportTravel = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height || 1), 0, 1);
        const panelPreset = resolvePanelMotionPreset(panel);
        const lightTravel = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.lightTravelStart,
          IMPACT_PROOF_MOTION_CURVES.lightTravelEnd,
          viewportTravel,
        );
        const darkTravel = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.darkTravelStart,
          IMPACT_PROOF_MOTION_CURVES.darkTravelEnd,
          viewportTravel,
        );
        const fadeIn = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.fadeInStart,
          IMPACT_PROOF_MOTION_CURVES.fadeInEnd,
          viewportTravel,
        );
        const fadeOut = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.fadeOutStart,
          IMPACT_PROOF_MOTION_CURVES.fadeOutEnd,
          viewportTravel,
        );
        const visibilityCurve = clamp(fadeIn - (1.08 * fadeOut), 0, 1);
        const panelOpacity = lerp(0.18, 0.96, visibilityCurve);
        const copyOpacity = lerp(0.16, 1, visibilityCurve);
        const copyScale = clamp(1 - ((1 - fadeIn) * 0.08) - (fadeOut * 0.06), 0.9, 1);
        const copyShiftY = lerp(36, 0, fadeIn) + lerp(0, -32, fadeOut);
        const actionReveal = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.actionRevealStart,
          IMPACT_PROOF_MOTION_CURVES.actionRevealEnd,
          viewportTravel,
        );
        const actionFade = smoothstep(
          IMPACT_PROOF_MOTION_CURVES.actionFadeStart,
          IMPACT_PROOF_MOTION_CURVES.actionFadeEnd,
          viewportTravel,
        );
        const actionVisibility = clamp(actionReveal - (0.78 * actionFade), 0, 1);
        const actionOpacity = lerp(0.42, 1, actionVisibility);
        const actionScale = clamp(1 - ((1 - actionReveal) * 0.04) - (actionFade * 0.035), 0.94, 1);
        const actionShiftY = lerp(22, 0, actionReveal) + lerp(0, -14, actionFade);

        applyRangeProperty(panel, '--impact-proof-light-strength', panelPreset.lightStrength, formatNumber, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-x', panelPreset.lightX, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-y', panelPreset.lightY, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-width', panelPreset.lightWidth, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-height', panelPreset.lightHeight, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-x', panelPreset.lightSecondaryX, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-y', panelPreset.lightSecondaryY, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-width', panelPreset.lightSecondaryWidth, formatPercent, lightTravel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-height', panelPreset.lightSecondaryHeight, formatPercent, lightTravel);
        panel.style.setProperty('--impact-proof-panel-opacity', panelOpacity.toFixed(3));
        panel.style.setProperty('--impact-proof-copy-opacity', copyOpacity.toFixed(3));
        panel.style.setProperty('--impact-proof-copy-scale', copyScale.toFixed(3));
        panel.style.setProperty('--impact-proof-copy-shift-y', `${copyShiftY.toFixed(2)}px`);
        panel.style.setProperty('--impact-proof-action-opacity', actionOpacity.toFixed(3));
        panel.style.setProperty('--impact-proof-action-scale', actionScale.toFixed(3));
        panel.style.setProperty('--impact-proof-action-shift-y', `${actionShiftY.toFixed(2)}px`);
        applyRangeProperty(panel, '--impact-proof-dark-strength', panelPreset.darkStrength, formatNumber, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-x', panelPreset.darkX, formatPercent, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-y', panelPreset.darkY, formatPercent, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-width', panelPreset.darkWidth, formatPercent, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-height', panelPreset.darkHeight, formatPercent, darkTravel);
        panel.style.setProperty('--impact-proof-dark-angle', `${lerp(panelPreset.darkAngle[0], panelPreset.darkAngle[1], darkTravel).toFixed(2)}deg`);
        applyRangeProperty(panel, '--impact-proof-dark-stop-1', panelPreset.darkStop1, formatPercent, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-stop-2', panelPreset.darkStop2, formatPercent, darkTravel);
        applyRangeProperty(panel, '--impact-proof-dark-stop-3', panelPreset.darkStop3, formatPercent, darkTravel);
      });
    };

    const queuePanelMotion = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(applyPanelMotion);
    };

    applyPanelMotion();
    window.addEventListener('scroll', queuePanelMotion, { passive: true });
    window.addEventListener('resize', queuePanelMotion);

    return () => {
      window.removeEventListener('scroll', queuePanelMotion);
      window.removeEventListener('resize', queuePanelMotion);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      panels.forEach(clearImpactProofMotionVars);
    };
  }, [normalizedMetrics.length, prefersReducedMotion]);

  const introHeading = String(intro?.heading || '').trim();
  const introBody = String(intro?.body || '').trim();
  const introEmphasis = String(intro?.emphasis || '').trim();
  const showIntro = Boolean(introHeading || introBody || introEmphasis);

  return (
    <>
      {showIntro ? (
        <div className="impact-proof-story-intro-shell">
          <div className="ag-panel-rail impact-proof-story-intro-rail">
            <div className="impact-proof-story-intro">
              {introHeading ? (
                <h2 className="impact-proof-story-intro-heading" aria-label={introHeading}>
                  {renderImpactIntroHeading(introHeading)}
                </h2>
              ) : null}
              {introBody ? <p className="impact-proof-story-intro-body">{introBody}</p> : null}
              {introEmphasis ? <p className="impact-proof-story-intro-emphasis">{introEmphasis}</p> : null}
              <div className="impact-proof-story-intro-scroll-cue" aria-hidden="true">
                <span className="impact-proof-story-intro-scroll-cue-mark" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div
        ref={shellRef}
        className="impact-proof-story-shell"
        data-proof-layout="editorial-stack"
        data-proof-focus="reading-flow"
        data-scroll-gradient-motion={prefersReducedMotion ? 'reduced' : 'enabled'}
      >
        {body ? <p className="impact-proof-story-body impact-proof-story-body--editorial">{body}</p> : null}
        <div className="impact-proof-story-editorial-list">
          {normalizedMetrics.map((metric, index) => (
            <article
              key={`${metric.value}-${metric.label}`}
              className={`impact-proof-story-proof is-tone-${metric.tone} ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
              data-proof-index={String(index)}
              data-tone={metric.tone}
              data-scroll-gradient-motion={prefersReducedMotion ? 'reduced' : 'enabled'}
            >
              <div className="impact-proof-story-proof-content">
                <div className="impact-proof-story-proof-copy">
                  <h2 className="impact-proof-story-proof-stat" aria-label={`${metric.value} ${metric.label}`}>
                    <span
                      className={[
                        'impact-proof-story-proof-value',
                        `is-tone-${metric.tone}`,
                        metric.valueTone ? `is-value-${metric.valueTone}` : null,
                      ].filter(Boolean).join(' ')}
                    >
                      {metric.value}
                    </span>
                    {metric.labelBreak === 'block'
                      ? <span className="impact-proof-story-proof-label is-break-block">{metric.label}</span>
                      : (
                        <>
                          {' '}
                          <span className="impact-proof-story-proof-label">{metric.label}</span>
                        </>
                      )}
                  </h2>
                  {metric.body ? <p className="impact-proof-story-proof-body">{metric.body}</p> : null}
                </div>
                {metric.action ? (
                  <div className="impact-proof-story-proof-action">
                    <ImpactProofAction
                      action={metric.action}
                      resolveTo={resolveTo}
                      className={`service-native-btn is-outline is-tone-${metric.tone}`}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {action ? (
          <div className="impact-proof-story-footer-action">
            <ImpactProofAction
              action={action}
              resolveTo={resolveTo}
              className="service-native-btn is-outline is-tone-super-grey"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default function ImpactProofStoryFeature({
  intro = null,
  body = '',
  metrics = [],
  action = null,
  resolveTo,
}) {
  return (
    <ImpactProofStoryEditorialContent
      intro={intro}
      body={body}
      metrics={metrics}
      action={action}
      resolveTo={resolveTo}
    />
  );
}
