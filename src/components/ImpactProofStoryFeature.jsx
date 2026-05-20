import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const IMPACT_PROOF_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMPACT_PROOF_PANEL_MOTION_PRESETS = Object.freeze({
  default: Object.freeze({
    lightStrength: [0.72, 0.16],
    lightX: [42, 10],
    lightY: [64, 32],
    lightWidth: [82, 34],
    lightHeight: [70, 30],
    lightSecondaryX: [70, 88],
    lightSecondaryY: [22, 14],
    lightSecondaryWidth: [30, 14],
    lightSecondaryHeight: [28, 12],
    darkStrength: [0.06, 0.42],
    darkX: [72, 12],
    darkY: [24, 12],
    darkWidth: [56, 110],
    darkHeight: [50, 96],
    darkAngle: [126, 174],
    darkStop1: [18, 8],
    darkStop2: [44, 24],
    darkStop3: [78, 46],
  }),
  0: Object.freeze({
    lightStrength: [0.96, 0.14],
    lightX: [88, 12],
    lightY: [74, 34],
    lightWidth: [106, 34],
    lightHeight: [88, 28],
    lightSecondaryX: [18, 8],
    lightSecondaryY: [28, 14],
    lightSecondaryWidth: [28, 12],
    lightSecondaryHeight: [24, 10],
    darkStrength: [0.08, 0.52],
    darkX: [48, 6],
    darkY: [16, 8],
    darkWidth: [66, 124],
    darkHeight: [58, 108],
    darkAngle: [122, 178],
    darkStop1: [18, 6],
    darkStop2: [46, 20],
    darkStop3: [76, 40],
  }),
  1: Object.freeze({
    lightStrength: [0.62, 0.16],
    lightX: [10, 42],
    lightY: [18, 38],
    lightWidth: [74, 28],
    lightHeight: [62, 24],
    lightSecondaryX: [90, 72],
    lightSecondaryY: [84, 68],
    lightSecondaryWidth: [28, 14],
    lightSecondaryHeight: [24, 12],
    darkStrength: [0.12, 0.34],
    darkX: [70, 28],
    darkY: [26, 18],
    darkWidth: [66, 100],
    darkHeight: [60, 90],
    darkAngle: [134, 168],
    darkStop1: [18, 10],
    darkStop2: [42, 26],
    darkStop3: [74, 48],
  }),
  2: Object.freeze({
    lightStrength: [1, 0.18],
    lightX: [52, 6],
    lightY: [66, 82],
    lightWidth: [102, 36],
    lightHeight: [94, 32],
    lightSecondaryX: [58, 90],
    lightSecondaryY: [24, 16],
    lightSecondaryWidth: [30, 12],
    lightSecondaryHeight: [24, 10],
    darkStrength: [0.06, 0.34],
    darkX: [74, 28],
    darkY: [20, 12],
    darkWidth: [60, 96],
    darkHeight: [52, 84],
    darkAngle: [128, 164],
    darkStop1: [18, 10],
    darkStop2: [42, 22],
    darkStop3: [72, 42],
  }),
  3: Object.freeze({
    lightStrength: [0.56, 0.08],
    lightX: [42, 10],
    lightY: [44, 28],
    lightWidth: [68, 28],
    lightHeight: [58, 24],
    lightSecondaryX: [82, 64],
    lightSecondaryY: [70, 54],
    lightSecondaryWidth: [24, 12],
    lightSecondaryHeight: [22, 10],
    darkStrength: [0.14, 0.56],
    darkX: [66, 14],
    darkY: [40, 18],
    darkWidth: [82, 120],
    darkHeight: [74, 102],
    darkAngle: [140, 178],
    darkStop1: [20, 8],
    darkStop2: [44, 20],
    darkStop3: [70, 36],
  }),
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
    '--impact-proof-dark-strength',
    '--impact-proof-dark-x',
    '--impact-proof-dark-y',
    '--impact-proof-dark-width',
    '--impact-proof-dark-height',
    '--impact-proof-dark-angle',
    '--impact-proof-dark-stop-1',
    '--impact-proof-dark-stop-2',
    '--impact-proof-dark-stop-3',
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

export function ImpactProofStoryEditorialContent({
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
        const viewportProgress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height || 1), 0, 1);
        const panelPreset = resolvePanelMotionPreset(panel);
        const travel = smoothstep(0.18, 0.78, viewportProgress);

        applyRangeProperty(panel, '--impact-proof-light-strength', panelPreset.lightStrength, formatNumber, travel);
        applyRangeProperty(panel, '--impact-proof-light-x', panelPreset.lightX, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-y', panelPreset.lightY, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-width', panelPreset.lightWidth, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-height', panelPreset.lightHeight, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-x', panelPreset.lightSecondaryX, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-y', panelPreset.lightSecondaryY, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-width', panelPreset.lightSecondaryWidth, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-light-secondary-height', panelPreset.lightSecondaryHeight, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-strength', panelPreset.darkStrength, formatNumber, travel);
        applyRangeProperty(panel, '--impact-proof-dark-x', panelPreset.darkX, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-y', panelPreset.darkY, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-width', panelPreset.darkWidth, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-height', panelPreset.darkHeight, formatPercent, travel);
        panel.style.setProperty('--impact-proof-dark-angle', `${lerp(panelPreset.darkAngle[0], panelPreset.darkAngle[1], travel).toFixed(2)}deg`);
        applyRangeProperty(panel, '--impact-proof-dark-stop-1', panelPreset.darkStop1, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-stop-2', panelPreset.darkStop2, formatPercent, travel);
        applyRangeProperty(panel, '--impact-proof-dark-stop-3', panelPreset.darkStop3, formatPercent, travel);
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

  return (
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
            <div
              className="impact-proof-story-proof-content fade-up fade-out"
              data-fade-out-start-vh="0.16"
              data-fade-out-end-vh="-0.08"
              data-fade-out-max-reduction="0.28"
              data-scroll-enter-start-vh="1.12"
              data-scroll-enter-end-vh="0.68"
            >
              {metric.eyebrow ? <p className="impact-proof-story-proof-eyebrow">{metric.eyebrow}</p> : null}
              <h2 className="impact-proof-story-proof-stat">
                <span className={`impact-proof-story-proof-value is-tone-${metric.tone}`}>{metric.value}</span>
                {' '}
                <span className="impact-proof-story-proof-label">{metric.label}</span>
              </h2>
              {metric.body ? <p className="impact-proof-story-proof-body">{metric.body}</p> : null}
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
  );
}

export default function ImpactProofStoryFeature({
  body = '',
  metrics = [],
  action = null,
  resolveTo,
}) {
  return (
    <ImpactProofStoryEditorialContent
      body={body}
      metrics={metrics}
      action={action}
      resolveTo={resolveTo}
    />
  );
}
