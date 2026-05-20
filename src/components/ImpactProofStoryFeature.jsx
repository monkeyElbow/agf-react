import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const IMPACT_PROOF_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMPACT_PROOF_PANEL_MOTION_PRESETS = Object.freeze({
  default: Object.freeze({
    lightStrength: [1.08, 0.18],
    lightX: [52, 2],
    lightY: [74, 20],
    lightWidth: [118, 28],
    lightHeight: [96, 24],
    lightSecondaryX: [68, 96],
    lightSecondaryY: [18, 10],
    lightSecondaryWidth: [44, 10],
    lightSecondaryHeight: [32, 8],
    darkStrength: [0.12, 0.88],
    darkX: [92, 6],
    darkY: [18, 8],
    darkWidth: [62, 136],
    darkHeight: [54, 120],
    darkAngle: [124, 186],
    darkStop1: [24, 4],
    darkStop2: [52, 16],
    darkStop3: [82, 30],
  }),
  0: Object.freeze({
    lightStrength: [1.12, 0.14],
    lightX: [96, 6],
    lightY: [80, 28],
    lightWidth: [128, 30],
    lightHeight: [98, 22],
    lightSecondaryX: [18, -6],
    lightSecondaryY: [18, 8],
    lightSecondaryWidth: [72, 34],
    lightSecondaryHeight: [54, 24],
    darkStrength: [0.14, 0.94],
    darkX: [56, 0],
    darkY: [16, 6],
    darkWidth: [70, 148],
    darkHeight: [60, 126],
    darkAngle: [120, 194],
    darkStop1: [22, 2],
    darkStop2: [50, 12],
    darkStop3: [80, 24],
  }),
  1: Object.freeze({
    lightStrength: [0.82, 0.14],
    lightX: [8, 48],
    lightY: [16, 42],
    lightWidth: [88, 24],
    lightHeight: [70, 20],
    lightSecondaryX: [94, 70],
    lightSecondaryY: [86, 60],
    lightSecondaryWidth: [32, 10],
    lightSecondaryHeight: [22, 8],
    darkStrength: [0.18, 0.76],
    darkX: [76, 18],
    darkY: [28, 12],
    darkWidth: [72, 116],
    darkHeight: [64, 102],
    darkAngle: [138, 180],
    darkStop1: [20, 6],
    darkStop2: [44, 18],
    darkStop3: [76, 34],
  }),
  2: Object.freeze({
    lightStrength: [1.18, 0.16],
    lightX: [50, 4],
    lightY: [68, 84],
    lightWidth: [122, 44],
    lightHeight: [106, 40],
    lightSecondaryX: [70, 108],
    lightSecondaryY: [24, 10],
    lightSecondaryWidth: [78, 30],
    lightSecondaryHeight: [56, 22],
    darkStrength: [0.12, 0.78],
    darkX: [82, 24],
    darkY: [18, 10],
    darkWidth: [66, 112],
    darkHeight: [56, 98],
    darkAngle: [128, 176],
    darkStop1: [20, 6],
    darkStop2: [46, 16],
    darkStop3: [76, 30],
  }),
  3: Object.freeze({
    lightStrength: [0.72, 0.08],
    lightX: [44, 10],
    lightY: [46, 24],
    lightWidth: [82, 24],
    lightHeight: [66, 18],
    lightSecondaryX: [88, 58],
    lightSecondaryY: [68, 44],
    lightSecondaryWidth: [28, 10],
    lightSecondaryHeight: [20, 8],
    darkStrength: [0.22, 0.88],
    darkX: [74, 8],
    darkY: [42, 10],
    darkWidth: [90, 138],
    darkHeight: [78, 118],
    darkAngle: [144, 190],
    darkStop1: [22, 4],
    darkStop2: [46, 14],
    darkStop3: [72, 28],
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
        const viewportTravel = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height || 1), 0, 1);
        const panelPreset = resolvePanelMotionPreset(panel);
        const lightTravel = smoothstep(0, 0.68, viewportTravel);
        const darkTravel = smoothstep(0.18, 1, viewportTravel);
        const fadeIn = smoothstep(0, 0.22, viewportTravel);
        const fadeOut = smoothstep(0.72, 1, viewportTravel);
        const panelOpacity = clamp(0.25 + (0.7 * fadeIn) - (0.55 * fadeOut), 0.25, 0.95);

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
