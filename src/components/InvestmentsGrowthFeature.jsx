import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import BlockOwnershipOverlay from './BlockOwnershipOverlay';
import FrontHudAnchorTag from './FrontHudAnchorTag';
import SafeRichText from './SafeRichText';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';
import {
  INVESTMENTS_GROWTH_REDUCED_MOTION_QUERY,
  setupInvestmentsGrowthRevealMotion,
} from '../lib/investmentsGrowthReveal';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampUnitInterval(value) {
  return clamp(value, 0, 1);
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - (2 * t));
}

function easeInvestmentsScrollProgress(value) {
  return smoothstep(0, 1, clampUnitInterval(value));
}

function interpolateInvestmentsValue(start, end, progress) {
  return start + ((end - start) * progress);
}

function SharedBlockHudAnchor({ hudAnchor }) {
  if (!hudAnchor) {
    return null;
  }

  return (
    <FrontHudAnchorTag
      label={hudAnchor.label}
      icon={hudAnchor.icon}
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
  const className = String(action.className || '').trim()
    || 'service-native-btn is-outline is-tone-atlantean investments-native-dashboard-action';

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
  const disableInvestorExitReveal = Boolean(runtime?.disableInvestorExitReveal);
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
    return setupInvestmentsGrowthRevealMotion(growthRoot, { includeBackgroundMotion: true });
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
      const progress = easeInvestmentsScrollProgress(
        disableInvestorExitReveal ? entryProgress : Math.min(entryProgress, exitProgress),
      );
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
  }, [disableInvestorExitReveal]);

  return (
    <section
      ref={sectionRef}
      className={`service-native-section investments-native-growth-feature${runtime?.className ? ` ${runtime.className}` : ''}${ownership?.className || ''}`}
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
              data-investments-growth-base-scale="1"
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
              data-investments-growth-base-scale="1"
              data-investments-growth-shift-y="52"
            >
              <div
                ref={investorCopyRef}
                className="investments-native-growth-card-copy native-info-section-copy billboard-scroll-progress-copy is-justify-center"
              >
                <h3 className="is-super-grey investments-native-dashboard-title">{investorPanel.title}</h3>
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
