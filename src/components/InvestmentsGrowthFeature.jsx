import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import BlockOwnershipOverlay from './BlockOwnershipOverlay';
import FrontHudAnchorTag from './FrontHudAnchorTag';
import SafeRichText from './SafeRichText';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const INVESTMENTS_GROWTH_REVEAL_SELECTOR = '[data-investments-growth-reveal]';
const INVESTMENTS_GROWTH_BACKGROUND_PANEL_SELECTOR = '[data-investments-growth-background-panel]';
const INVESTMENTS_GROWTH_BACKGROUND_TONES = Object.freeze(['blue', 'mango', 'white']);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - (2 * t));
}

function clampUnitInterval(value) {
  return clamp(value, 0, 1);
}

function easeInvestmentsScrollProgress(value) {
  return smoothstep(0, 1, clampUnitInterval(value));
}

function interpolateInvestmentsValue(start, end, progress) {
  return start + ((end - start) * progress);
}

function readGrowthRevealNumber(target, attributeName, fallback) {
  const value = target?.getAttribute(attributeName);
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInvestmentsGrowthRevealProgress(target, viewportHeight) {
  if (!target || !viewportHeight) {
    return 1;
  }
  const rect = target.getBoundingClientRect();
  const startVh = readGrowthRevealNumber(target, 'data-investments-growth-start-vh', 1.02);
  const endVh = readGrowthRevealNumber(target, 'data-investments-growth-end-vh', 0.56);
  const anchorOffset = Math.min(
    rect.height * readGrowthRevealNumber(target, 'data-investments-growth-anchor-ratio', 0.32),
    readGrowthRevealNumber(target, 'data-investments-growth-anchor-max-px', 168),
  );
  const anchorY = rect.top + anchorOffset;
  const startY = viewportHeight * startVh;
  const endY = viewportHeight * endVh;
  return smoothstep(0, 1, (startY - anchorY) / Math.max(1, startY - endY));
}

function applyInvestmentsGrowthRevealMotion(target, viewportHeight) {
  if (!target) {
    return;
  }
  const progress = getInvestmentsGrowthRevealProgress(target, viewportHeight);
  const minOpacity = readGrowthRevealNumber(target, 'data-investments-growth-min-opacity', 0.18);
  const baseScale = readGrowthRevealNumber(target, 'data-investments-growth-base-scale', 0.92);
  const shiftY = readGrowthRevealNumber(target, 'data-investments-growth-shift-y', 56);
  const opacity = minOpacity + ((1 - minOpacity) * progress);
  const scale = baseScale + ((1 - baseScale) * progress);
  const translateY = (1 - progress) * shiftY;

  target.style.setProperty('--investments-growth-reveal-opacity', opacity.toFixed(3));
  target.style.setProperty('--investments-growth-reveal-scale', scale.toFixed(3));
  target.style.setProperty('--investments-growth-reveal-shift-y', `${translateY.toFixed(2)}px`);
}

function clearInvestmentsGrowthRevealMotion(target) {
  if (!target) {
    return;
  }
  target.style.setProperty('--investments-growth-reveal-opacity', '1');
  target.style.setProperty('--investments-growth-reveal-scale', '1');
  target.style.setProperty('--investments-growth-reveal-shift-y', '0px');
}

function applyInvestmentsGrowthBackgroundMotion(root, panelNodes, viewportHeight) {
  if (!root || !Array.isArray(panelNodes) || !panelNodes.length || typeof window === 'undefined') {
    return;
  }

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportCenter = scrollY + ((viewportHeight || window.innerHeight || document.documentElement.clientHeight || 1) * 0.5);
  const centers = panelNodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return scrollY + rect.top + (rect.height * 0.5);
  });
  const weights = {
    blue: 0,
    mango: 0,
    white: 0,
  };

  if (viewportCenter <= centers[0]) {
    weights[panelNodes[0].getAttribute('data-investments-growth-background-panel') || 'blue'] = 1;
  } else if (viewportCenter >= centers[centers.length - 1]) {
    weights[panelNodes[panelNodes.length - 1].getAttribute('data-investments-growth-background-panel') || 'white'] = 1;
  } else {
    let activeIndex = 0;
    for (let index = 0; index < centers.length - 1; index += 1) {
      if (viewportCenter >= centers[index] && viewportCenter < centers[index + 1]) {
        activeIndex = index;
        break;
      }
    }

    const currentTone = panelNodes[activeIndex].getAttribute('data-investments-growth-background-panel') || 'blue';
    const nextTone = panelNodes[activeIndex + 1].getAttribute('data-investments-growth-background-panel') || 'white';
    const span = Math.max(1, centers[activeIndex + 1] - centers[activeIndex]);
    const ratio = smoothstep(0, 1, (viewportCenter - centers[activeIndex]) / span);
    weights[currentTone] = 1 - ratio;
    weights[nextTone] = ratio;
  }

  INVESTMENTS_GROWTH_BACKGROUND_TONES.forEach((tone) => {
    root.style.setProperty(`--investments-growth-${tone}-opacity`, (weights[tone] || 0).toFixed(3));
  });
}

function clearInvestmentsGrowthBackgroundMotion(root) {
  if (!root) {
    return;
  }
  root.style.setProperty('--investments-growth-blue-opacity', '1');
  root.style.setProperty('--investments-growth-mango-opacity', '0');
  root.style.setProperty('--investments-growth-white-opacity', '0');
}

function SharedBlockHudAnchor({ hudAnchor }) {
  if (!hudAnchor) {
    return null;
  }

  return (
    <FrontHudAnchorTag
      label={hudAnchor.label}
      isActive={hudAnchor.isActive}
      onClick={hudAnchor.onClick}
      style={hudAnchor.style}
    />
  );
}

function FeatureAction({ action, resolveTo }) {
  if (!action?.label) {
    return null;
  }
  const actionTarget = String(action.to || action.href || '').trim();
  const isInternal = Boolean(action.to || (action.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));
  const className = 'service-native-btn is-outline is-tone-atlantean investments-native-dashboard-action';

  if (isInternal) {
    return (
      <Link
        to={action.to || resolveTo(action.href || actionTarget, actionTarget || '/')}
        className={className}
        target={action.openInNewWindow ? '_blank' : undefined}
        rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
      >
        {action.label}
      </Link>
    );
  }

  return (
    <a
      href={actionTarget || '#'}
      className={className}
      target={action.openInNewWindow ? '_blank' : undefined}
      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
    >
      {action.label}
    </a>
  );
}

export default function InvestmentsGrowthFeature({
  blockId = 'growth_feature',
  runtime,
  resolveTo,
  ownership,
  hudAnchor,
}) {
  const sectionRef = useRef(null);
  const investorPanelRef = useRef(null);
  const investorCopyRef = useRef(null);
  const headlineLines = Array.isArray(runtime?.headlineLines) ? runtime.headlineLines : [];
  const growthPanels = useMemo(
    () => (Array.isArray(runtime?.panels) ? runtime.panels.filter((panel) => panel?.kind !== 'investor') : []),
    [runtime],
  );
  const investorPanel = useMemo(
    () => (Array.isArray(runtime?.panels) ? runtime.panels.find((panel) => panel?.kind === 'investor') || null : null),
    [runtime],
  );

  useEffect(() => {
    const growthRoot = sectionRef.current;
    if (!growthRoot || typeof window === 'undefined') {
      return undefined;
    }

    const revealNodes = Array.from(growthRoot.querySelectorAll(INVESTMENTS_GROWTH_REVEAL_SELECTOR));
    const backgroundPanelNodes = Array.from(growthRoot.querySelectorAll(INVESTMENTS_GROWTH_BACKGROUND_PANEL_SELECTOR));
    if (!revealNodes.length && !backgroundPanelNodes.length) {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.(INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY) || null;
    let frameId = 0;

    const updateInvestmentsGrowthMotion = () => {
      frameId = 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      if (backgroundPanelNodes.length) {
        applyInvestmentsGrowthBackgroundMotion(growthRoot, backgroundPanelNodes, viewportHeight);
      }
      if (mediaQuery?.matches) {
        revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
        return;
      }
      revealNodes.forEach((node) => applyInvestmentsGrowthRevealMotion(node, viewportHeight));
    };

    const requestInvestmentsGrowthMotion = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(updateInvestmentsGrowthMotion);
    };

    const handleMotionPreferenceChange = () => {
      revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
      clearInvestmentsGrowthBackgroundMotion(growthRoot);
      requestInvestmentsGrowthMotion();
    };

    requestInvestmentsGrowthMotion();
    window.addEventListener('scroll', requestInvestmentsGrowthMotion, { passive: true });
    window.addEventListener('resize', requestInvestmentsGrowthMotion);
    mediaQuery?.addEventListener?.('change', handleMotionPreferenceChange);

    return () => {
      window.removeEventListener('scroll', requestInvestmentsGrowthMotion);
      window.removeEventListener('resize', requestInvestmentsGrowthMotion);
      mediaQuery?.removeEventListener?.('change', handleMotionPreferenceChange);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      revealNodes.forEach(clearInvestmentsGrowthRevealMotion);
      clearInvestmentsGrowthBackgroundMotion(growthRoot);
    };
  }, []);

  useEffect(() => {
    const section = investorPanelRef.current;
    const copy = investorCopyRef.current;
    if (!section || !copy || typeof window === 'undefined') {
      return undefined;
    }

    let frameId = 0;
    const reducedMotionMediaQuery = window.matchMedia?.(INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY) || null;

    const applyInvestorPanelScrollProgress = () => {
      frameId = 0;

      if (reducedMotionMediaQuery?.matches) {
        copy.style.opacity = '1';
        copy.style.transform = 'translate3d(0, 0, 0) scale(1)';
        return;
      }

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!viewportHeight) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const entryProgress = clampUnitInterval((viewportHeight * 1.02 - rect.top) / (viewportHeight * 0.62));
      const exitProgress = clampUnitInterval((rect.bottom - viewportHeight * 0.04) / (viewportHeight * 0.48));
      const progress = easeInvestmentsScrollProgress(Math.min(entryProgress, exitProgress));
      const opacity = interpolateInvestmentsValue(0.34, 1, progress);
      const scale = interpolateInvestmentsValue(0.955, 1, progress);
      const translateY = interpolateInvestmentsValue(42, 0, progress);

      copy.style.opacity = opacity.toFixed(3);
      copy.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    };

    const queueInvestorPanelScrollProgressUpdate = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(applyInvestorPanelScrollProgress);
    };

    const handleReducedMotionChange = () => {
      queueInvestorPanelScrollProgressUpdate();
    };

    queueInvestorPanelScrollProgressUpdate();
    window.addEventListener('scroll', queueInvestorPanelScrollProgressUpdate, { passive: true });
    window.addEventListener('resize', queueInvestorPanelScrollProgressUpdate);
    if (typeof reducedMotionMediaQuery?.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotionMediaQuery?.addListener === 'function') {
      reducedMotionMediaQuery.addListener(handleReducedMotionChange);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', queueInvestorPanelScrollProgressUpdate);
      window.removeEventListener('resize', queueInvestorPanelScrollProgressUpdate);
      if (typeof reducedMotionMediaQuery?.removeEventListener === 'function') {
        reducedMotionMediaQuery.removeEventListener('change', handleReducedMotionChange);
      } else if (typeof reducedMotionMediaQuery?.removeListener === 'function') {
        reducedMotionMediaQuery.removeListener(handleReducedMotionChange);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`service-native-section investments-native-growth-feature${ownership?.className || ''}`}
      data-block-id={blockId}
    >
      <BlockOwnershipOverlay ownership={ownership} />
      <SharedBlockHudAnchor hudAnchor={hudAnchor} />
      <div className="investments-native-growth-surface" aria-hidden="true">
        <div className="investments-native-growth-surface-layer is-blue" />
        <div className="investments-native-growth-surface-layer is-mango" />
        <div className="investments-native-growth-surface-layer is-white" />
      </div>
      <div className="ag-panel-rail">
        <h2 className="investments-native-build-title">
          <span
            className="investments-growth-scroll-reveal investments-growth-scroll-reveal-title"
            data-investments-growth-reveal="title"
            data-investments-growth-start-vh="0.98"
            data-investments-growth-end-vh="0.48"
            data-investments-growth-anchor-ratio="0.22"
            data-investments-growth-anchor-max-px="120"
            data-investments-growth-min-opacity="0.24"
            data-investments-growth-base-scale="0.945"
            data-investments-growth-shift-y="34"
          >
            {headlineLines.map((line, lineIndex) => (
              <span key={`headline-line-${lineIndex}`} className="investments-native-build-title-line">
                {line.map((segment, segmentIndex) => (
                  <mark key={`headline-line-${lineIndex}-segment-${segmentIndex}`} className={segment.className}>
                    {segment.text}
                  </mark>
                ))}
              </span>
            ))}
          </span>
        </h2>

        <div className="service-native-grid investments-native-growth-grid">
          {growthPanels.map((panel) => (
            <article
              key={panel.title}
              className="investments-native-growth-card investments-growth-scroll-reveal"
              data-investments-growth-background-panel={panel.surfaceTone}
              data-investments-growth-reveal="card"
              data-investments-growth-start-vh="1.08"
              data-investments-growth-end-vh="0.54"
              data-investments-growth-anchor-ratio="0.28"
              data-investments-growth-anchor-max-px="154"
              data-investments-growth-min-opacity="0.18"
              data-investments-growth-base-scale="0.92"
              data-investments-growth-shift-y="52"
            >
              <h3 className={`is-${panel.tone}`}>{panel.title}</h3>
              <p>{panel.body}</p>
            </article>
          ))}
          {investorPanel ? (
            <article
              ref={investorPanelRef}
              className="investments-native-growth-card investments-native-growth-card--investor investments-native-dashboard-billboard investments-native-dashboard-billboard--final investments-growth-scroll-reveal"
              data-investments-growth-background-panel={investorPanel.surfaceTone || 'white'}
              data-investments-growth-reveal="card"
              data-investments-growth-start-vh="1.08"
              data-investments-growth-end-vh="0.54"
              data-investments-growth-anchor-ratio="0.28"
              data-investments-growth-anchor-max-px="154"
              data-investments-growth-min-opacity="0.18"
              data-investments-growth-base-scale="0.92"
              data-investments-growth-shift-y="52"
            >
              <div
                ref={investorCopyRef}
                className="investments-native-growth-card-copy native-info-section-copy billboard-scroll-progress-copy is-justify-center"
              >
                <h3 className="is-mango investments-native-dashboard-title">{investorPanel.title}</h3>
                {String(runtime?.billboardBodyHtml || '').trim() ? (
                  <SafeRichText
                    as="div"
                    className="native-info-rich-html"
                    html={runtime.billboardBodyHtml}
                  />
                ) : runtime?.body ? (
                  <p>{runtime.body}</p>
                ) : null}
                {runtime?.action ? (
                  <div className="service-native-action-row is-centered">
                    <FeatureAction action={runtime.action} resolveTo={resolveTo} />
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
