import { useState } from 'react';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';

function TestimonialsHudEditorPanel({
  limit,
  onLimitChange,
  library,
  selectedIds,
  onToggleSelectedId,
  onSetSelectedIds,
  availableTags,
  filterTags,
  onToggleFilterTag,
  previewItems,
  formatAttribution,
  adminTestimonialsHref = '/admin/testimonials',
  blockOptions = null,
}) {
  const safeLibrary = Array.isArray(library) ? library : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds.map((entry) => String(entry)) : [];
  const selectedIdSet = new Set(safeSelectedIds);
  const excludedUiTags = new Set(['archive']);
  const safeAvailableTags = (Array.isArray(availableTags) ? availableTags : []).filter((tag) => !excludedUiTags.has(tag));
  const safeFilterTags = (Array.isArray(filterTags) ? filterTags : []).filter((tag) => !excludedUiTags.has(tag));
  const safePreviewItems = Array.isArray(previewItems) ? previewItems : [];
  const activeTagSet = new Set(safeFilterTags);
  const [isSelectorFilterActive, setIsSelectorFilterActive] = useState(false);
  const selectorLibrary = isSelectorFilterActive && safeFilterTags.length
    ? safeLibrary.filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags : [];
      return tags.some((tag) => activeTagSet.has(tag));
    })
    : safeLibrary;
  const normalizedLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.round(Number(limit))) : 0;
  const emptyPreviewSlots = Math.max(0, normalizedLimit - safePreviewItems.length);

  const handleClearSelected = () => {
    if (typeof onSetSelectedIds !== 'function') {
      return;
    }
    onSetSelectedIds([]);
  };

  const handleToggleFilterTag = (tag) => {
    setIsSelectorFilterActive(true);
    onToggleFilterTag?.(tag);
  };

  const handleClearFilters = () => {
    if (!safeFilterTags.length) {
      setIsSelectorFilterActive(false);
      return;
    }
    setIsSelectorFilterActive(true);
    safeFilterTags.forEach((tag) => onToggleFilterTag?.(tag));
  };

  const handleShowAllSelector = () => {
    setIsSelectorFilterActive(false);
  };

  const [activeEditorSection, setActiveEditorSection] = useState('selection');

  const editorSections = appendHudBlockOptionsSection([
    { id: 'selection', label: 'Select', icon: '✓' },
    { id: 'preview', label: 'Preview', icon: '▣' },
  ], blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-front-hud-testimonials-editor"
      sections={editorSections}
      activeSection={activeEditorSection}
      onSectionChange={setActiveEditorSection}
      label="Testimonials editor sections"
    >
      <div className="admin-front-hud-testimonials-head">
        <p className="admin-front-hud-note">Pick quotes from the shared library. IDs and tags are managed automatically.</p>
        <a
          className="admin-front-hud-mode-toggle admin-front-hud-testimonials-admin-link"
          href={adminTestimonialsHref}
          target="_blank"
          rel="noreferrer noopener"
        >
          Edit testimonials ↗
        </a>
      </div>
      <div className="admin-front-hud-testimonials-layout">
        <div className="admin-front-hud-testimonials-col is-selection">
          <div className="admin-front-hud-testimonials-selection-head">
            <p className="admin-front-hud-testimonials-col-title">Selector</p>
            <div className="admin-front-hud-testimonials-filter-bar">
              <div className="admin-front-hud-testimonial-tag-list is-top">
                <button
                  type="button"
                  className={`admin-front-hud-testimonial-tag${(!isSelectorFilterActive || !safeFilterTags.length) ? ' is-active' : ''}`}
                  onClick={handleShowAllSelector}
                >
                  All
                </button>
                {safeAvailableTags.map((tag) => {
                  const isSelected = safeFilterTags.includes(tag);
                  return (
                    <button
                      key={`hud-testimonial-tag-${tag}`}
                      type="button"
                      className={`admin-front-hud-testimonial-tag${isSelected && isSelectorFilterActive ? ' is-active' : ''}`}
                      onClick={() => handleToggleFilterTag(tag)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="admin-front-hud-testimonials-filter-clear"
                onClick={handleClearFilters}
                title="Clear filters"
                aria-label="Clear filters"
              >
                ×
              </button>
            </div>
            <p className="admin-front-hud-note">
              {isSelectorFilterActive && safeFilterTags.length
                ? `Showing ${selectorLibrary.length} filtered testimonials`
                : `Showing all ${selectorLibrary.length} testimonials`}
            </p>
            <p className="admin-front-hud-testimonials-help">Selected: {safeSelectedIds.length}. Click cards to add/remove.</p>
          </div>
          <div
            className="admin-front-hud-testimonials-list"
            role="listbox"
            aria-label="Choose testimonials"
          >
            {selectorLibrary.map((item) => {
              const itemId = String(item.id || '');
              const isSelected = selectedIdSet.has(itemId);
              return (
                <button
                  key={`hud-testimonial-${itemId}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`admin-front-hud-testimonial-card${isSelected ? ' is-selected' : ''}`}
                  onClick={() => onToggleSelectedId?.(itemId)}
                >
                  <div className="admin-front-hud-testimonial-card-head">
                    <span className={`admin-front-hud-testimonial-card-check${isSelected ? ' is-selected' : ''}`} aria-hidden="true" />
                    <span className={`admin-front-hud-testimonial-card-state${isSelected ? ' is-selected' : ''}`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                  <span className="admin-front-hud-testimonial-card-quote">{item.quote}</span>
                  <span className="admin-front-hud-testimonial-card-author">{formatAttribution?.(item)}</span>
                  {Array.isArray(item.tags) && item.tags.length ? (
                    <span className="admin-front-hud-testimonial-card-tags">{item.tags.join(' • ')}</span>
                  ) : null}
                </button>
              );
            })}
            {!selectorLibrary.length ? (
              <p className="admin-front-hud-note">No testimonials match current filters.</p>
            ) : null}
          </div>
        </div>

        <div className="admin-front-hud-testimonials-col is-preview">
          <div className="admin-front-hud-testimonials-col-head">
            <div className="admin-front-hud-testimonials-col-head-top">
              <p className="admin-front-hud-testimonials-col-title">Selected quotes</p>
              <label className="admin-front-hud-field admin-front-hud-testimonials-limit">
                <span>Quotes</span>
                <input
                  className="admin-front-hud-testimonials-limit-input"
                  type="number"
                  min={0}
                  max={99}
                  step={1}
                  value={String(limit ?? 0)}
                  onChange={(event) => onLimitChange?.(Number(event.target.value))}
                />
              </label>
            </div>
          </div>
          <div className="admin-front-hud-testimonials-preview-frame">
            <div className="admin-front-hud-testimonials-preview">
              {safePreviewItems.length ? safePreviewItems.map((item, index) => {
                const itemId = String(item?.id || '');
                const canRemove = Boolean(itemId);
                return (
                  <button
                    key={`hud-testimonial-preview-${itemId || index + 1}`}
                    type="button"
                    className={`admin-front-hud-testimonial-preview-item${canRemove ? ' is-clickable' : ' is-static'}`}
                    onClick={() => {
                      if (!canRemove) {
                        return;
                      }
                      if (typeof onSetSelectedIds === 'function') {
                        onSetSelectedIds(safeSelectedIds.filter((id) => id !== itemId));
                        return;
                      }
                      if (selectedIdSet.has(itemId)) {
                        onToggleSelectedId?.(itemId);
                      }
                    }}
                    disabled={!canRemove}
                  >
                    <p>{item?.quote}</p>
                    <p>{formatAttribution?.(item)}</p>
                    {canRemove ? (
                      <span className="admin-front-hud-testimonial-preview-remove">Remove</span>
                    ) : null}
                  </button>
                );
              }) : emptyPreviewSlots ? null : (
                <p className="admin-front-hud-note">No testimonials selected yet.</p>
              )}
              {Array.from({ length: emptyPreviewSlots }).map((_, index) => (
                <div
                  key={`hud-testimonial-empty-slot-${index + 1}`}
                  className="admin-front-hud-testimonial-preview-item is-empty-slot"
                  aria-hidden="true"
                >
                  <p>Empty slot {safePreviewItems.length + index + 1}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-front-hud-testimonials-preview-controls">
            <span className="admin-front-hud-note">0 uses all available.</span>
            <div className="admin-front-hud-testimonials-toolbar">
              <button
                type="button"
                className="admin-front-hud-mode-toggle"
                onClick={handleClearSelected}
              >
                Clear all
              </button>
            </div>
            <p className="admin-front-hud-note">Edit fineprint in the admin content page.</p>
          </div>
        </div>
      </div>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}

export default TestimonialsHudEditorPanel;
