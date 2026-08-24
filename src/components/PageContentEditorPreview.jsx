import SafeRichText from './SafeRichText';

function normalizePreviewTone(value) {
  const token = String(value || '').trim();
  return ['is-atlantean', 'is-mango', 'is-melon', 'is-super-grey', 'is-sandstone', 'is-white'].includes(token)
    ? token
    : '';
}

export default function PageContentEditorPreview({ settings = {}, html = '' }) {
  const title = String(settings.title || '').trim();
  const subtitle = String(settings.subtitle || '').trim();
  const bodyHtml = String(html || '').trim();
  const toneClassName = normalizePreviewTone(settings.bodyColorClassName);

  return (
    <section className="admin-page-content-editor-preview" aria-label="Page content block preview">
      <span className="admin-page-content-editor-preview-label">Block preview</span>
      <div className={`admin-page-content-editor-preview-surface${toneClassName ? ` ${toneClassName}` : ''}`}>
        {title ? <h3>{title}</h3> : null}
        {subtitle ? <p className="admin-page-content-editor-preview-subtitle">{subtitle}</p> : null}
        {bodyHtml ? (
          <SafeRichText as="div" className="native-info-rich-html" html={bodyHtml} />
        ) : (
          <p className="admin-page-content-editor-preview-empty">No page content yet.</p>
        )}
      </div>
    </section>
  );
}
