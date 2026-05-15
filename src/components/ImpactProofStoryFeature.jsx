import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

const IMPACT_PROOF_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IMPACT_PROOF_MIN_WIDTH_PX = 980;
const IMPACT_PROOF_STEP_MS = 2400;

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

export function ImpactProofStoryStaticContent({
  headline = '',
  body = '',
  metrics = [],
  action = null,
  resolveTo,
  reveal = false,
}) {
  const normalizedMetrics = useMemo(() => normalizeMetrics(metrics), [metrics]);

  return (
    <div className={`ag-panel-rail impact-proof-story-static${reveal ? ' has-reveal' : ''}`}>
      {headline ? <p className={`impact-proof-story-kicker${reveal ? ' fade-up' : ''}`}>{headline}</p> : null}
      {body ? <p className={`impact-proof-story-body impact-proof-story-body--static${reveal ? ' fade-up' : ''}`}>{body}</p> : null}
      <div className="impact-proof-story-static-grid" data-proof-layout="stacked">
        {normalizedMetrics.map((metric) => (
          <article
            key={`${metric.value}-${metric.label}`}
            className={`impact-proof-story-card is-tone-${metric.tone}${reveal ? ' fade-up' : ''}`}
            data-tone={metric.tone}
          >
            {metric.eyebrow ? <p className="impact-proof-story-card-eyebrow">{metric.eyebrow}</p> : null}
            <h2 className={`impact-proof-story-card-value is-tone-${metric.tone}`}>{metric.value}</h2>
            <p className="impact-proof-story-card-label">{metric.label}</p>
            {metric.body ? <p className="impact-proof-story-card-body">{metric.body}</p> : null}
            {metric.action ? (
              <div className="impact-proof-story-card-action">
                <ImpactProofAction
                  action={metric.action}
                  resolveTo={resolveTo}
                  className={`service-native-btn is-outline is-tone-${metric.tone}`}
                />
              </div>
            ) : null}
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
  headline = '',
  body = '',
  metrics = [],
  action = null,
  resolveTo,
}) {
  const normalizedMetrics = useMemo(() => normalizeMetrics(metrics), [metrics]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 0 : window.innerWidth
  ));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia(IMPACT_PROOF_REDUCED_MOTION_QUERY)
      : null;
    const syncEnvironment = () => {
      setPrefersReducedMotion(Boolean(media?.matches));
      setViewportWidth(window.innerWidth || 0);
    };

    syncEnvironment();
    window.addEventListener('resize', syncEnvironment);
    media?.addEventListener?.('change', syncEnvironment);
    media?.addListener?.(syncEnvironment);

    return () => {
      window.removeEventListener('resize', syncEnvironment);
      media?.removeEventListener?.('change', syncEnvironment);
      media?.removeListener?.(syncEnvironment);
    };
  }, []);

  const supportsEnhancedDesktop = !prefersReducedMotion
    && viewportWidth >= IMPACT_PROOF_MIN_WIDTH_PX
    && normalizedMetrics.length > 1;
  const supportsRevealFallback = !prefersReducedMotion && !supportsEnhancedDesktop;

  useEffect(() => {
    if (!supportsEnhancedDesktop) {
      setActiveIndex(0);
      return undefined;
    }

    setActiveIndex(0);
    let timerId = 0;
    timerId = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= normalizedMetrics.length - 1) {
          window.clearInterval(timerId);
          return current;
        }
        return current + 1;
      });
    }, IMPACT_PROOF_STEP_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [normalizedMetrics.length, supportsEnhancedDesktop]);

  if (!supportsEnhancedDesktop) {
    return (
      <ImpactProofStoryStaticContent
        headline={headline}
        body={body}
        metrics={normalizedMetrics}
        action={action}
        resolveTo={resolveTo}
        reveal={supportsRevealFallback}
      />
    );
  }

  return (
    <div
      className="ag-panel-rail impact-proof-story-shell"
      data-enhanced="true"
      data-proof-layout="single-metric-sequence"
      data-active-index={String(activeIndex)}
      data-proof-focus="single-metric"
    >
      <div className="impact-proof-story-frame">
        {headline ? <p className="impact-proof-story-kicker">{headline}</p> : null}
        {body ? <p className="impact-proof-story-body">{body}</p> : null}
        <div className="impact-proof-story-stage" aria-live="polite">
          {normalizedMetrics.map((metric, index) => {
            const motionState = index === activeIndex
              ? 'active'
              : (index < activeIndex ? 'complete' : 'pending');
            return (
              <article
                key={`${metric.value}-${metric.label}`}
                className={`impact-proof-story-actor is-tone-${metric.tone} is-${motionState}`}
                data-motion-state={motionState}
                data-tone={metric.tone}
                aria-hidden={index === activeIndex ? undefined : 'true'}
              >
                {metric.eyebrow ? <p className="impact-proof-story-actor-eyebrow">{metric.eyebrow}</p> : null}
                <h2 className={`impact-proof-story-actor-value is-tone-${metric.tone}`}>{metric.value}</h2>
                <p className="impact-proof-story-actor-label">{metric.label}</p>
                {metric.body ? <p className="impact-proof-story-actor-body">{metric.body}</p> : null}
                {metric.action ? (
                  <div className="impact-proof-story-actor-action">
                    <ImpactProofAction
                      action={metric.action}
                      resolveTo={resolveTo}
                      className={`service-native-btn is-outline is-tone-${metric.tone}`}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <ol className="impact-proof-story-summary" aria-label="Impact proof sequence">
          {normalizedMetrics.map((metric, index) => (
            <li
              key={`${metric.value}-${metric.eyebrow || metric.label}`}
              className={index === activeIndex ? 'is-active' : (index < activeIndex ? 'is-complete' : '')}
              data-tone={metric.tone}
            >
              <span className="impact-proof-story-summary-value">{metric.value}</span>
              <span className="impact-proof-story-summary-label">{metric.eyebrow || metric.label}</span>
            </li>
          ))}
        </ol>
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
    </div>
  );
}
