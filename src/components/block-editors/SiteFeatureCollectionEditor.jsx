import { parseLinkValueJson, linkValueToEditableHref } from '../../lib/linkValue';

const COLLECTION_MODELS = Object.freeze({
  home_services_feature_animation: {
    fieldId: 'panelsJson',
    title: 'Feature panels',
    itemLabel: 'Panel',
    fields: [
      { id: 'title', label: 'Panel title', type: 'text' },
      { id: 'body', label: 'Panel copy', type: 'textarea', rows: 3 },
      { id: 'buttonLabel', label: 'Button label', type: 'text' },
      { id: 'buttonPath', label: 'Button page / URL', type: 'text' },
    ],
    mapFallbackItem: (item) => ({
      title: item?.title || '',
      body: item?.body || '',
      tone: item?.tone || '',
      buttonLabel: item?.action?.label || '',
      buttonPath: item?.action?.to || item?.action?.href || '',
      buttonOpenInNewWindow: Boolean(item?.action?.openInNewWindow),
    }),
  },
  home_impact_story: {
    fieldId: 'metricsJson',
    title: 'Impact metrics',
    itemLabel: 'Metric',
    fields: [
      { id: 'value', label: 'Metric value', type: 'text' },
      { id: 'label', label: 'Metric label', type: 'text' },
      { id: 'buttonLabel', label: 'Button label', type: 'text' },
      { id: 'buttonPath', label: 'Button page / URL', type: 'text' },
    ],
    mapFallbackItem: (item) => ({
      value: item?.value || '',
      label: item?.label || '',
      valueTone: item?.valueTone || '',
      labelBreak: item?.labelBreak || '',
      tone: item?.tone || '',
      buttonLabel: item?.action?.label || '',
      buttonPath: item?.action?.to || item?.action?.href || '',
    }),
  },
  impact_proof_story: {
    fieldId: 'metricsJson',
    title: 'Impact proof cards',
    itemLabel: 'Proof card',
    fields: [
      { id: 'value', label: 'Metric value', type: 'text' },
      { id: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { id: 'label', label: 'Metric label', type: 'text' },
      { id: 'body', label: 'Card copy', type: 'textarea', rows: 3 },
      { id: 'buttonLabel', label: 'Button label', type: 'text' },
      { id: 'buttonPath', label: 'Button page / URL', type: 'text' },
    ],
    mapFallbackItem: (item) => ({
      value: item?.value || '',
      eyebrow: item?.eyebrow || '',
      label: item?.label || '',
      body: item?.body || '',
      valueTone: item?.valueTone || '',
      labelBreak: item?.labelBreak || '',
      tone: item?.tone || '',
      nativeCardClass: item?.nativeCardClass || '',
      buttonLabel: item?.action?.label || '',
      buttonPath: item?.action?.to || item?.action?.href || '',
    }),
  },
  about_history_feature: {
    fieldId: 'cardsJson',
    title: 'History Gallery cards',
    itemLabel: 'History card',
    fields: [
      { id: 'title', label: 'Card title', type: 'text' },
      { id: 'body', label: 'Card copy', type: 'textarea', rows: 4 },
    ],
    mapFallbackItem: (item) => ({
      title: item?.title || '',
      body: item?.body || '',
      titleClassName: item?.titleClassName || '',
      panelTone: item?.panelTone || '',
      cardClass: item?.cardClass || '',
    }),
  },
  legacy_giving_stewardship_story: {
    fieldId: 'beatsJson',
    title: 'Story beats',
    itemLabel: 'Story beat',
    fields: [
      { id: 'copy', label: 'Story copy', type: 'textarea', rows: 2 },
    ],
    mapFallbackItem: (item) => ({ copy: typeof item === 'string' ? item : item?.copy || '' }),
  },
  retirement_plan_feature: {
    fieldId: 'panelsJson',
    title: 'Feature panels',
    itemLabel: 'Panel',
    fields: [
      { id: 'title', label: 'Panel title', type: 'textarea', rows: 3 },
      { id: 'body', label: 'Panel copy', type: 'textarea', rows: 3 },
    ],
    mapFallbackItem: (item) => ({
      kind: item?.kind || '',
      title: item?.title || '',
      body: item?.body || '',
      tone: item?.tone || '',
      surfaceTone: item?.surfaceTone || '',
    }),
  },
  investments_growth_feature: {
    fieldId: 'panelsJson',
    title: 'Investment growth panels',
    itemLabel: 'Panel',
    fields: [
      { id: 'title', label: 'Panel title', type: 'text' },
      { id: 'body', label: 'Panel copy', type: 'textarea', rows: 3 },
    ],
    mapFallbackItem: (item) => ({
      kind: item?.kind || '',
      title: item?.title || '',
      body: item?.body || '',
      tone: item?.tone || '',
      surfaceTone: item?.surfaceTone || '',
    }),
  },
});

function parseCollection(rawValue, fallbackItems, mapFallbackItem) {
  if (typeof rawValue === 'string' && rawValue.trim()) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Older snapshots may contain no collection payload. Use the catalog fallback.
    }
  }
  return (Array.isArray(fallbackItems) ? fallbackItems : []).map(mapFallbackItem);
}

function createEmptyItem(model) {
  return model.fields.reduce((item, field) => {
    item[field.id] = '';
    return item;
  }, {});
}

function controlId(featureId, index, fieldId) {
  return `site-feature-${featureId}-${index}-${fieldId}`;
}

export function getSiteFeatureCollectionModel(featureId) {
  return COLLECTION_MODELS[String(featureId || '').trim()] || null;
}

export function getSiteFeatureCollectionItems(featureId, rawValue, fallbackItems) {
  const model = getSiteFeatureCollectionModel(featureId);
  if (!model) {
    return [];
  }
  return parseCollection(rawValue, fallbackItems, model.mapFallbackItem);
}

export function SiteFeatureCollectionEditor({
  featureId,
  value,
  fallbackItems = [],
  onChange,
  className = '',
}) {
  const model = getSiteFeatureCollectionModel(featureId);
  if (!model) {
    return null;
  }

  const items = parseCollection(value, fallbackItems, model.mapFallbackItem);
  const updateItems = (nextItems) => onChange(JSON.stringify(nextItems));
  const itemCountClassName = items.length >= 3
    ? 'is-three-or-more'
    : `is-${items.length}`;

  return (
    <section
      className={`admin-site-feature-collection admin-site-feature-collection--flat${className ? ` ${className}` : ''}`}
      data-site-feature-collection={featureId}
    >
      <div className="admin-site-feature-collection-header">
        <div>
          <h4>{model.title}</h4>
        </div>
        <button
          type="button"
          className="admin-cta-slot-add"
          onClick={() => updateItems([...items, createEmptyItem(model)])}
        >
          Add {model.itemLabel.toLowerCase()}
        </button>
      </div>
      <div className={`admin-site-feature-collection-list ${itemCountClassName}`}>
        {items.length ? items.map((item, index) => (
          <article className="admin-site-feature-collection-item" key={`${featureId}-${index}`}>
            <div className="admin-site-feature-collection-item-header">
              <strong>{model.itemLabel} {String(index + 1).padStart(2, '0')}</strong>
              <button
                type="button"
                className="admin-cta-slot-remove"
                onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
            <div className="admin-site-feature-collection-fields">
              {model.fields.map((field) => {
                const id = controlId(featureId, index, field.id);
                const valueForField = item?.[field.id] ?? '';
                return (
                  <label key={field.id} htmlFor={id}>
                    <span>{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={id}
                        rows={field.rows || 3}
                        value={valueForField}
                        onChange={(event) => {
                          const nextItems = items.map((currentItem, itemIndex) => (
                            itemIndex === index
                              ? { ...currentItem, [field.id]: event.target.value }
                              : currentItem
                          ));
                          updateItems(nextItems);
                        }}
                      />
                    ) : (
                      <input
                        id={id}
                        type="text"
                        value={valueForField}
                        onChange={(event) => {
                          const nextItems = items.map((currentItem, itemIndex) => (
                            itemIndex === index
                              ? { ...currentItem, [field.id]: event.target.value }
                              : currentItem
                          ));
                          updateItems(nextItems);
                        }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </article>
        )) : (
          <p className="admin-site-feature-collection-empty">No items yet. Add one when this feature needs new content.</p>
        )}
      </div>
    </section>
  );
}

export function normalizeCollectionAction(item, fallbackAction = null) {
  const source = item && typeof item === 'object' ? item : {};
  const labelPresent = Object.prototype.hasOwnProperty.call(source, 'buttonLabel');
  const label = String(source.buttonLabel ?? fallbackAction?.label ?? '').trim();
  const path = String(source.buttonPath ?? '').trim();
  if (labelPresent && !label) {
    return null;
  }
  if (!path && !labelPresent) {
    return fallbackAction || null;
  }
  if (!label || !path) {
    return null;
  }
  const parsedPath = parseLinkValueJson(path);
  const editablePath = parsedPath ? linkValueToEditableHref(parsedPath) : path;
  const isExternal = /^https?:\/\//i.test(editablePath);
  return {
    label,
    ...(isExternal ? { href: editablePath } : { to: editablePath }),
    openInNewWindow: Boolean(source.buttonOpenInNewWindow),
  };
}
