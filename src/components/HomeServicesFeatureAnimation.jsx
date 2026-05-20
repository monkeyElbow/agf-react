import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const HOME_SERVICES_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const HOME_SERVICES_PANEL_MOTION_PRESETS = Object.freeze({
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
    lightStrength: [0.88, 0.1],
    lightX: [12, 64],
    lightY: [18, 60],
    lightWidth: [118, 32],
    lightHeight: [98, 28],
    lightSecondaryX: [8, -10],
    lightSecondaryY: [14, 6],
    lightSecondaryWidth: [96, 46],
    lightSecondaryHeight: [70, 28],
    darkStrength: [0.28, 1.18],
    darkX: [78, 18],
    darkY: [22, 12],
    darkWidth: [96, 162],
    darkHeight: [82, 142],
    darkAngle: [132, 194],
    darkStop1: [18, 4],
    darkStop2: [42, 12],
    darkStop3: [70, 22],
  }),
  2: Object.freeze({
    lightStrength: [1.04, 0.14],
    lightX: [6, 54],
    lightY: [14, 54],
    lightWidth: [116, 36],
    lightHeight: [88, 26],
    lightSecondaryX: [96, 58],
    lightSecondaryY: [86, 52],
    lightSecondaryWidth: [58, 22],
    lightSecondaryHeight: [40, 14],
    darkStrength: [0.22, 0.98],
    darkX: [82, 22],
    darkY: [20, 10],
    darkWidth: [84, 136],
    darkHeight: [72, 118],
    darkAngle: [132, 186],
    darkStop1: [18, 4],
    darkStop2: [44, 12],
    darkStop3: [74, 24],
  }),
  3: Object.freeze({
    lightStrength: [0.9, 0.1],
    lightX: [12, 54],
    lightY: [16, 62],
    lightWidth: [122, 36],
    lightHeight: [96, 26],
    lightSecondaryX: [86, 54],
    lightSecondaryY: [74, 40],
    lightSecondaryWidth: [68, 24],
    lightSecondaryHeight: [44, 14],
    darkStrength: [0.26, 1.08],
    darkX: [68, 16],
    darkY: [22, 12],
    darkWidth: [88, 146],
    darkHeight: [74, 128],
    darkAngle: [134, 188],
    darkStop1: [18, 4],
    darkStop2: [44, 12],
    darkStop3: [72, 22],
  }),
  4: Object.freeze({
    lightStrength: [1.24, 0.12],
    lightX: [54, -6],
    lightY: [74, 92],
    lightWidth: [142, 58],
    lightHeight: [122, 54],
    lightSecondaryX: [72, 114],
    lightSecondaryY: [20, 4],
    lightSecondaryWidth: [88, 36],
    lightSecondaryHeight: [62, 28],
    darkStrength: [0.2, 1.02],
    darkX: [80, 26],
    darkY: [16, 10],
    darkWidth: [76, 136],
    darkHeight: [64, 118],
    darkAngle: [124, 182],
    darkStop1: [18, 4],
    darkStop2: [44, 12],
    darkStop3: [74, 22],
  }),
});

const HOME_SERVICES_MOTION_CURVES = Object.freeze({
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
    return HOME_SERVICES_PANEL_MOTION_PRESETS.default;
  }

  const index = panel.getAttribute('data-proof-index') || 'default';
  return HOME_SERVICES_PANEL_MOTION_PRESETS[index] || HOME_SERVICES_PANEL_MOTION_PRESETS.default;
}

function applyRangeProperty(panel, property, values, formatter, amount) {
  if (!Array.isArray(values) || values.length < 2) {
    return;
  }

  panel.style.setProperty(property, formatter(lerp(values[0], values[1], amount)));
}

function clearHomeServicesMotionVars(panel) {
  if (!panel?.style) {
    return;
  }

  [
    '--home-services-light-strength',
    '--home-services-light-x',
    '--home-services-light-y',
    '--home-services-light-width',
    '--home-services-light-height',
    '--home-services-light-secondary-x',
    '--home-services-light-secondary-y',
    '--home-services-light-secondary-width',
    '--home-services-light-secondary-height',
    '--home-services-panel-opacity',
    '--home-services-content-opacity',
    '--home-services-content-scale',
    '--home-services-content-shift-y',
    '--home-services-action-opacity',
    '--home-services-action-scale',
    '--home-services-action-shift-y',
    '--home-services-dark-strength',
    '--home-services-dark-x',
    '--home-services-dark-y',
    '--home-services-dark-width',
    '--home-services-dark-height',
    '--home-services-dark-angle',
    '--home-services-dark-stop-1',
    '--home-services-dark-stop-2',
    '--home-services-dark-stop-3',
  ].forEach((property) => {
    panel.style.removeProperty(property);
  });
}

function normalizePanelAction(action) {
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

function normalizePanels(panels = []) {
  return (Array.isArray(panels) ? panels : [])
    .map((panel) => {
      if (!panel || typeof panel !== 'object') {
        return null;
      }

      const title = String(panel.title || '').trim();
      const body = String(panel.body || '').trim();
      if (!title || !body) {
        return null;
      }

      return {
        title,
        body,
        tone: String(panel.tone || '').trim() || 'atlantean',
        action: normalizePanelAction(panel.action),
      };
    })
    .filter(Boolean);
}

function ActionLink({ action, resolveTo }) {
  if (!action?.label || (!action?.to && !action?.href)) {
    return null;
  }

  const target = action.to
    ? resolveTo(action.to, action.to)
    : action.href;
  const isExternal = isExternalLinkHref(target);
  const sharedProps = {
    className: 'service-native-btn is-outline is-tone-white',
    target: action.openInNewWindow ? '_blank' : undefined,
    rel: action.openInNewWindow ? 'noreferrer noopener' : undefined,
  };

  if (isExternal) {
    return (
      <a href={target} {...sharedProps}>
        {action.label}
      </a>
    );
  }

  return (
    <Link to={target} {...sharedProps}>
      {action.label}
    </Link>
  );
}

export default function HomeServicesFeatureAnimation({
  headline = '',
  panels = [],
  resolveTo = (value) => value,
}) {
  const shellRef = useRef(null);
  const normalizedPanels = useMemo(() => normalizePanels(panels), [panels]);

  useEffect(() => {
    const shell = shellRef.current;
    const panelNodes = shell ? Array.from(shell.querySelectorAll('.home-services-feature-panel')) : [];
    if (!shell || !panelNodes.length) {
      return undefined;
    }

    const mediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(HOME_SERVICES_REDUCED_MOTION_QUERY)
      : null;

    let frameId = 0;

    const applyPanelMotion = () => {
      if (!shellRef.current) {
        return;
      }

      const reduceMotion = Boolean(mediaQuery?.matches);
      if (reduceMotion) {
        shellRef.current.setAttribute('data-scroll-gradient-motion', 'reduced');
        panelNodes.forEach((panel) => {
          panel.setAttribute('data-scroll-gradient-motion', 'reduced');
          clearHomeServicesMotionVars(panel);
        });
        return;
      }

      shellRef.current.setAttribute('data-scroll-gradient-motion', 'active');
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

      panelNodes.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const viewportTravel = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height || 1), 0, 1);
        const panelPreset = resolvePanelMotionPreset(panel);
        const lightTravel = smoothstep(
          HOME_SERVICES_MOTION_CURVES.lightTravelStart,
          HOME_SERVICES_MOTION_CURVES.lightTravelEnd,
          viewportTravel,
        );
        const darkTravel = smoothstep(
          HOME_SERVICES_MOTION_CURVES.darkTravelStart,
          HOME_SERVICES_MOTION_CURVES.darkTravelEnd,
          viewportTravel,
        );
        const fadeIn = smoothstep(
          HOME_SERVICES_MOTION_CURVES.fadeInStart,
          HOME_SERVICES_MOTION_CURVES.fadeInEnd,
          viewportTravel,
        );
        const fadeOut = smoothstep(
          HOME_SERVICES_MOTION_CURVES.fadeOutStart,
          HOME_SERVICES_MOTION_CURVES.fadeOutEnd,
          viewportTravel,
        );
        const visibilityCurve = clamp(fadeIn - (1.08 * fadeOut), 0, 1);
        const panelOpacity = lerp(0.18, 0.96, visibilityCurve);
        const contentOpacity = lerp(0.16, 1, visibilityCurve);
        const contentScale = clamp(1 - ((1 - fadeIn) * 0.08) - (fadeOut * 0.06), 0.9, 1);
        const contentShiftY = lerp(36, 0, fadeIn) + lerp(0, -32, fadeOut);
        const actionReveal = smoothstep(
          HOME_SERVICES_MOTION_CURVES.actionRevealStart,
          HOME_SERVICES_MOTION_CURVES.actionRevealEnd,
          viewportTravel,
        );
        const actionFade = smoothstep(
          HOME_SERVICES_MOTION_CURVES.actionFadeStart,
          HOME_SERVICES_MOTION_CURVES.actionFadeEnd,
          viewportTravel,
        );
        const actionVisibility = clamp(actionReveal - (0.78 * actionFade), 0, 1);
        const actionOpacity = lerp(0.42, 1, actionVisibility);
        const actionScale = clamp(1 - ((1 - actionReveal) * 0.04) - (actionFade * 0.035), 0.94, 1);
        const actionShiftY = lerp(22, 0, actionReveal) + lerp(0, -14, actionFade);

        panel.setAttribute('data-scroll-gradient-motion', 'active');
        applyRangeProperty(panel, '--home-services-light-strength', panelPreset.lightStrength, formatNumber, lightTravel);
        applyRangeProperty(panel, '--home-services-light-x', panelPreset.lightX, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-y', panelPreset.lightY, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-width', panelPreset.lightWidth, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-height', panelPreset.lightHeight, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-secondary-x', panelPreset.lightSecondaryX, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-secondary-y', panelPreset.lightSecondaryY, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-secondary-width', panelPreset.lightSecondaryWidth, formatPercent, lightTravel);
        applyRangeProperty(panel, '--home-services-light-secondary-height', panelPreset.lightSecondaryHeight, formatPercent, lightTravel);
        panel.style.setProperty('--home-services-panel-opacity', panelOpacity.toFixed(3));
        panel.style.setProperty('--home-services-content-opacity', contentOpacity.toFixed(3));
        panel.style.setProperty('--home-services-content-scale', contentScale.toFixed(3));
        panel.style.setProperty('--home-services-content-shift-y', `${contentShiftY.toFixed(2)}px`);
        panel.style.setProperty('--home-services-action-opacity', actionOpacity.toFixed(3));
        panel.style.setProperty('--home-services-action-scale', actionScale.toFixed(3));
        panel.style.setProperty('--home-services-action-shift-y', `${actionShiftY.toFixed(2)}px`);
        applyRangeProperty(panel, '--home-services-dark-strength', panelPreset.darkStrength, formatNumber, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-x', panelPreset.darkX, formatPercent, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-y', panelPreset.darkY, formatPercent, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-width', panelPreset.darkWidth, formatPercent, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-height', panelPreset.darkHeight, formatPercent, darkTravel);
        panel.style.setProperty('--home-services-dark-angle', `${lerp(panelPreset.darkAngle[0], panelPreset.darkAngle[1], darkTravel).toFixed(2)}deg`);
        applyRangeProperty(panel, '--home-services-dark-stop-1', panelPreset.darkStop1, formatPercent, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-stop-2', panelPreset.darkStop2, formatPercent, darkTravel);
        applyRangeProperty(panel, '--home-services-dark-stop-3', panelPreset.darkStop3, formatPercent, darkTravel);
      });
    };

    const requestMotionFrame = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        applyPanelMotion();
      });
    };

    const handleMotionPreferenceChange = () => {
      panelNodes.forEach((panel) => {
        clearHomeServicesMotionVars(panel);
      });
      requestMotionFrame();
    };

    applyPanelMotion();
    window.addEventListener('scroll', requestMotionFrame, { passive: true });
    window.addEventListener('resize', requestMotionFrame);
    mediaQuery?.addEventListener?.('change', handleMotionPreferenceChange);

    return () => {
      window.removeEventListener('scroll', requestMotionFrame);
      window.removeEventListener('resize', requestMotionFrame);
      mediaQuery?.removeEventListener?.('change', handleMotionPreferenceChange);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [normalizedPanels]);

  if (!normalizedPanels.length) {
    return null;
  }

  return (
    <div ref={shellRef} className="home-services-feature-shell">
      {headline ? <h2 className="home-services-feature-heading">{headline}</h2> : null}
      <div className="home-services-feature-list">
        {normalizedPanels.map((panel, index) => (
          <article
            key={`${panel.title}-${index}`}
            className={`home-services-feature-panel is-tone-${panel.tone} ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
            data-proof-index={index}
          >
            <div className="home-services-feature-panel-content">
              <div className="home-services-feature-panel-copy">
                <h3 className="home-services-feature-panel-title">{panel.title}</h3>
                <p className="home-services-feature-panel-body">{panel.body}</p>
              </div>
              {panel.action ? (
                <div className="home-services-feature-panel-action">
                  <ActionLink action={panel.action} resolveTo={resolveTo} />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
