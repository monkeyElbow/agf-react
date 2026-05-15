import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isExternalLinkHref } from '../lib/dynamicPageBlocks';

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
  const normalizedMetrics = useMemo(() => normalizeMetrics(metrics), [metrics]);

  return (
    <div
      className="impact-proof-story-shell"
      data-proof-layout="editorial-stack"
      data-proof-focus="reading-flow"
    >
      {body ? <p className="impact-proof-story-body impact-proof-story-body--editorial">{body}</p> : null}
      <div className="impact-proof-story-editorial-list">
        {normalizedMetrics.map((metric, index) => (
          <article
            key={`${metric.value}-${metric.label}`}
            className={`impact-proof-story-proof is-tone-${metric.tone} ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
            data-proof-index={String(index)}
            data-tone={metric.tone}
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
              <h2 className={`impact-proof-story-proof-value is-tone-${metric.tone}`}>{metric.value}</h2>
              <p className="impact-proof-story-proof-label">{metric.label}</p>
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
