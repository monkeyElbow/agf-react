import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const HOME_SERVICES_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const HOME_SERVICES_PANEL_MOTION_PRESETS = Object.freeze({
  default: Object.freeze({
    lightStrength: [1.02, 0.16],
    lightX: [54, 8],
    lightY: [72, 22],
    lightWidth: [116, 30],
    lightHeight: [94, 24],
    lightSecondaryX: [72, 102],
    lightSecondaryY: [18, 10],
    lightSecondaryWidth: [56, 18],
    lightSecondaryHeight: [42, 12],
    darkStrength: [0.14, 0.84],
    darkX: [88, 8],
    darkY: [18, 8],
    darkWidth: [66, 132],
    darkHeight: [56, 118],
    darkAngle: [124, 184],
    darkStop1: [24, 4],
    darkStop2: [52, 16],
    darkStop3: [82, 30],
  }),
  0: Object.freeze({
    lightStrength: [1.12, 0.16],
    lightX: [96, 6],
    lightY: [80, 28],
    lightWidth: [128, 32],
    lightHeight: [98, 22],
    lightSecondaryX: [18, -6],
    lightSecondaryY: [18, 8],
    lightSecondaryWidth: [72, 34],
    lightSecondaryHeight: [54, 24],
    darkStrength: [0.16, 0.94],
    darkX: [56, 0],
    darkY: [16, 6],
    darkWidth: [72, 148],
    darkHeight: [60, 126],
    darkAngle: [120, 194],
    darkStop1: [22, 2],
    darkStop2: [50, 12],
    darkStop3: [80, 24],
  }),
  1: Object.freeze({
    lightStrength: [0.76, 0.1],
    lightX: [18, 56],
    lightY: [20, 48],
    lightWidth: [96, 28],
    lightHeight: [86, 22],
    lightSecondaryX: [14, -2],
    lightSecondaryY: [18, 8],
    lightSecondaryWidth: [88, 38],
    lightSecondaryHeight: [62, 24],
    darkStrength: [0.24, 0.92],
    darkX: [76, 12],
    darkY: [28, 10],
    darkWidth: [88, 142],
    darkHeight: [74, 122],
    darkAngle: [140, 194],
    darkStop1: [22, 4],
    darkStop2: [48, 14],
    darkStop3: [74, 26],
  }),
  2: Object.freeze({
    lightStrength: [0.92, 0.16],
    lightX: [10, 46],
    lightY: [18, 44],
    lightWidth: [98, 30],
    lightHeight: [76, 22],
    lightSecondaryX: [88, 64],
    lightSecondaryY: [84, 58],
    lightSecondaryWidth: [48, 18],
    lightSecondaryHeight: [34, 12],
    darkStrength: [0.18, 0.74],
    darkX: [76, 18],
    darkY: [26, 12],
    darkWidth: [72, 112],
    darkHeight: [64, 96],
    darkAngle: [138, 180],
    darkStop1: [20, 6],
    darkStop2: [44, 18],
    darkStop3: [76, 34],
  }),
  3: Object.freeze({
    lightStrength: [0.78, 0.12],
    lightX: [16, 42],
    lightY: [18, 52],
    lightWidth: [104, 32],
    lightHeight: [86, 22],
    lightSecondaryX: [82, 60],
    lightSecondaryY: [76, 46],
    lightSecondaryWidth: [58, 18],
    lightSecondaryHeight: [40, 12],
    darkStrength: [0.22, 0.84],
    darkX: [70, 14],
    darkY: [24, 10],
    darkWidth: [78, 124],
    darkHeight: [68, 106],
    darkAngle: [136, 186],
    darkStop1: [20, 4],
    darkStop2: [46, 16],
    darkStop3: [76, 30],
  }),
  4: Object.freeze({
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
        const lightTravel = smoothstep(0, 0.68, viewportTravel);
        const darkTravel = smoothstep(0.18, 1, viewportTravel);
        const fadeIn = smoothstep(0, 0.22, viewportTravel);
        const fadeOut = smoothstep(0.72, 1, viewportTravel);
        const visibilityCurve = clamp(fadeIn - fadeOut, 0, 1);
        const panelOpacity = lerp(0.25, 0.95, visibilityCurve);
        const contentOpacity = lerp(0.25, 0.95, visibilityCurve);
        const contentScale = lerp(0.94, 1, visibilityCurve);
        const contentShiftY = lerp(32, 0, fadeIn) + lerp(0, -16, fadeOut);

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
              <h3 className="home-services-feature-panel-title">{panel.title}</h3>
              <p className="home-services-feature-panel-body">{panel.body}</p>
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
