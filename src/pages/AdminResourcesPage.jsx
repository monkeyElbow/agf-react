import { useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import AdminHtmlEditor from '../components/AdminHtmlEditor';
import { pageByPath } from '../data/siteMap';
import { ResourcesProvider, useResources } from '../context/ResourcesContext';

function toDateTimeLocal(isoDate) {
  if (!isoDate) {
    return '';
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const adjusted = new Date(parsed.getTime() - (parsed.getTimezoneOffset() * 60000));
  return adjusted.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString();
}

function toPathSegment(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function AdminResourcesPageContent() {
  const {
    articles,
    isLoading,
    updateArticle,
    saveArticle,
    publishArticle,
    discardArticleDraft,
    scheduleArticle,
    cancelScheduledArticle,
    getArticleStatus,
    hasDraftChanges,
    createArticle,
    deleteArticle,
    resetArticles,
  } = useResources();

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saveMessage, setSaveMessage] = useState('');
  const [scheduleValue, setScheduleValue] = useState('');
  const titleBeforeEditRef = useRef('');

  useEffect(() => {
    if (!articles.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId && !articles.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [articles, selectedId]);

  useEffect(() => {
    setSaveMessage('');
  }, [selectedId]);

  useEffect(() => {
    const nextArticle = articles.find((item) => item.id === selectedId);
    setScheduleValue(toDateTimeLocal(nextArticle?.scheduledPublishAt));
  }, [articles, selectedId]);

  const availableCategories = useMemo(
    () => Array.from(new Set(articles.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [articles],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return articles.filter((item) => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      if (!categoryMatch) return false;
      if (!needle) return true;
      return [
        item.title,
        item.category,
        item.slug,
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [articles, categoryFilter, search]);

  const [sortOrder, setSortOrder] = useState('recent');
  const [viewMode, setViewMode] = useState('list');
  const editorSectionRef = useRef(null);

  const selectArticle = (articleId) => {
    setSelectedId(articleId);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const sortedFiltered = useMemo(() => {
    const compareDate = (a, b) => {
      const aTime = new Date(a.publishedAt || '').getTime() || 0;
      const bTime = new Date(b.publishedAt || '').getTime() || 0;
      if (sortOrder === 'oldest') {
        return aTime - bTime;
      }
      return bTime - aTime;
    };
    return [...filtered].sort(compareDate);
  }, [filtered, sortOrder]);

  const selected = articles.find((item) => item.id === selectedId) || null;
  const selectedStatus = selected ? getArticleStatus(selected) : null;
  const selectedHasDraftChanges = selected ? hasDraftChanges(selected) : false;
  const articleUrlPreview = selected
    ? `https://www.agfinancial.org/resources/${toPathSegment(selected.category) || 'article'}/${toPathSegment(selected.slug)}`
    : '';

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Resources" source={pageByPath['/resources']?.source} showBadge={false}>
        <p>Edit article title, category, published date, media URL, and HTML body content for the React resources library.</p>

        <div className="admin-content-top-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            disabled={isLoading}
            onClick={() => {
              const newId = createArticle();
              if (newId) {
                setSelectedId(newId);
              }
            }}
          >
            Add article
          </button>
          <button
            type="button"
            className="action-btn action-btn-outline"
            disabled={isLoading}
            onClick={resetArticles}
          >
            Reset from seed
          </button>
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-primary"
              disabled={isLoading}
              onClick={() => {
                setSaveMessage(saveArticle(selected.id)
                  ? 'Article draft saved.'
                  : 'Article could not be saved.');
              }}
            >
              Save article draft
            </button>
          ) : null}
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-primary"
              disabled={isLoading || !selectedHasDraftChanges}
              onClick={() => {
                setSaveMessage(publishArticle(selected.id)
                  ? 'Article is live.'
                  : 'Article could not be made live.');
              }}
            >
              Make live
            </button>
          ) : null}
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-outline"
              disabled={isLoading || !selectedHasDraftChanges || !selected.publishedSnapshot}
              onClick={() => {
                setSaveMessage(discardArticleDraft(selected.id)
                  ? 'Draft discarded. Live article restored.'
                  : 'Draft could not be discarded.');
              }}
            >
              Discard draft
            </button>
          ) : null}
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-danger"
              disabled={isLoading}
              onClick={() => {
                deleteArticle(selected.id);
              }}
            >
              Delete selected
            </button>
          ) : null}
        </div>

        <div className="admin-resources-master-detail">
          <div className="admin-resources-library-column">
            <section className="admin-content-section admin-resources-toolbar">
              <div className="admin-resources-library-heading">
                <div>
                  <p className="admin-resources-eyebrow">Article library</p>
                  <h2>Choose an article to edit</h2>
                </div>
                <span>{articles.length} total</span>
              </div>
          <div className="admin-resources-toolbar-grid">
            <label htmlFor="admin-resources-search" className="search-page-label">
              Search articles
              <input
                id="admin-resources-search"
                className="search-page-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, category, or slug"
              />
            </label>
            <label htmlFor="admin-resources-category-filter" className="search-page-label">
              Filter by category
              <select
                id="admin-resources-category-filter"
                className="search-page-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label htmlFor="admin-resources-sort-order" className="search-page-label">
              Sort
              <select
                id="admin-resources-sort-order"
                className="search-page-select"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="recent">Most recent first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
          <div className="admin-resources-toolbar-actions">
            <div className="admin-resources-view-toggle" role="group" aria-label="Article view mode">
              <button
                type="button"
                className={viewMode === 'grid' ? 'is-active' : ''}
                onClick={() => setViewMode('grid')}
              >
                Grid cards
              </button>
              <button
                type="button"
                className={viewMode === 'list' ? 'is-active' : ''}
                onClick={() => setViewMode('list')}
              >
                Compact list
              </button>
            </div>
          </div>
            </section>

            <section className="admin-content-section admin-resources-library-list">
          {sortedFiltered.length ? (
            <div className={`admin-resources-gallery is-${viewMode}`}>
              {sortedFiltered.map((item) => {
                const isActive = item.id === selectedId;
                const status = getArticleStatus(item);
                const publishedLabel = status === 'live'
                  ? 'Live'
                  : status === 'scheduled' ? 'Scheduled' : 'Draft';
                const backgroundImage = item.mediaUrl ? { backgroundImage: `url(${item.mediaUrl})` } : {};
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-resources-card${isActive ? ' is-active' : ''}`}
                    onClick={() => selectArticle(item.id)}
                    aria-pressed={isActive}
                  >
                    <div className="admin-resources-card-media" style={backgroundImage}>
                      {!item.mediaUrl ? <span>No media</span> : null}
                    </div>
                    <div className="admin-resources-card-body">
                      <p className="admin-resources-card-title">{item.title || 'Untitled article'}</p>
                      <p className="admin-resources-card-meta">
                        {item.category || 'Uncategorized'} · {publishedLabel}
                      </p>
                      {item.publishedAt ? (
                        <p className="admin-resources-card-meta">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="blank-state">
              <p>No articles match the filters.</p>
              <p className="blank-state-note">Try adjusting the search or category selection.</p>
            </div>
          )}
            </section>
          </div>

          <div className="admin-resources-editor-column">
            {isLoading ? (
              <section className="admin-content-section admin-resources-editor-panel" aria-live="polite">
                <p className="admin-resources-eyebrow">Article editor</p>
                <h2>Preparing article details…</h2>
                <p className="blank-state-note">The library is ready. Full editing details are loading in the background.</p>
              </section>
            ) : selected ? (
              <section className="admin-content-section admin-resources-editor-panel" ref={editorSectionRef}>
                <div className="admin-resources-editor-heading">
                  <div>
                    <p className="admin-resources-eyebrow">Article editor</p>
                    <h2>{selected.title || 'Untitled article'}</h2>
                    <p>Make changes here; the library stays visible so you always know which article you are editing.</p>
                  </div>
                  <div className="admin-resources-editor-status-stack">
                    <span className={`admin-resources-editor-status is-${selectedStatus}`}>
                      {selectedStatus === 'live'
                        ? 'Live'
                        : selectedStatus === 'scheduled' ? 'Scheduled' : 'Draft'}
                    </span>
                    {selectedStatus === 'draft' && selected.publishedSnapshot ? (
                      <span className="admin-resources-status-note">Draft differs from live</span>
                    ) : null}
                    {selectedStatus === 'scheduled' ? (
                      <span className="admin-resources-status-note">
                        Live on {new Date(selected.scheduledPublishAt).toLocaleString()}
                      </span>
                    ) : null}
                    {saveMessage ? <span className="admin-resources-save-message" role="status">{saveMessage}</span> : null}
                  </div>
                </div>
            <div className="admin-content-field-list">
              <label>
                <span>Title</span>
                <input
                  value={selected.title}
                  onChange={(event) => updateArticle(selected.id, { title: event.target.value })}
                  onFocus={() => {
                    titleBeforeEditRef.current = selected.title;
                  }}
                  onBlur={(event) => {
                    const nextTitle = event.target.value;
                    const nextSlug = toPathSegment(nextTitle);
                    const previousAutoSlug = toPathSegment(titleBeforeEditRef.current);
                    const canAutoSlug = !selected.slug || selected.slug === previousAutoSlug;
                    if (canAutoSlug && nextSlug) {
                      updateArticle(selected.id, { title: nextTitle, slug: nextSlug });
                    }
                  }}
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  value={selected.slug}
                  onChange={(event) => updateArticle(selected.id, { slug: event.target.value })}
                />
              </label>

              <p className="blank-state-note admin-resources-public-url">
                Public URL preview:&nbsp;
                {articleUrlPreview ? (
                  <a href={articleUrlPreview} target="_blank" rel="noreferrer">{articleUrlPreview}</a>
                ) : (
                  <span>adjust the slug or category to build a preview</span>
                )}
              </p>

              <div className="admin-content-grid-two">
                <label>
                  <span>Category</span>
                  <input
                    value={selected.category}
                    onChange={(event) => updateArticle(selected.id, { category: event.target.value })}
                  />
                </label>

                <label>
                  <span>Type</span>
                  <input
                    value={selected.type}
                    onChange={(event) => updateArticle(selected.id, { type: event.target.value })}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Article date</span>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocal(selected.publishedAt)}
                    onChange={(event) => updateArticle(selected.id, { publishedAt: fromDateTimeLocal(event.target.value) })}
                  />
                </label>

                <div className="admin-resources-schedule-field">
                  <label htmlFor="admin-resources-schedule-at">
                    <span>Schedule make live</span>
                    <input
                      id="admin-resources-schedule-at"
                      type="datetime-local"
                      value={scheduleValue}
                      min={toDateTimeLocal(new Date(Date.now() + 60000).toISOString())}
                      onChange={(event) => setScheduleValue(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    disabled={isLoading || !selectedHasDraftChanges || !scheduleValue}
                    onClick={() => {
                      const scheduled = scheduleArticle(selected.id, fromDateTimeLocal(scheduleValue));
                      setSaveMessage(scheduled
                        ? 'Article scheduled to make live.'
                        : 'Choose a future time before scheduling.');
                    }}
                  >
                    Schedule
                  </button>
                  {selected.scheduledPublishAt ? (
                    <button
                      type="button"
                      className="action-btn action-btn-quiet"
                      disabled={isLoading}
                      onClick={() => {
                        setSaveMessage(cancelScheduledArticle(selected.id)
                          ? 'Scheduled publish cancelled.'
                          : 'Scheduled publish could not be cancelled.');
                        setScheduleValue('');
                      }}
                    >
                      Cancel schedule
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="blank-state-note admin-resources-publish-note">
                Editing changes the saved draft only. Make live publishes this exact draft; in current dev mode, a scheduled publish activates when the app checks the schedule.
              </p>

              <label>
                <span>Media URL</span>
                <input
                  value={selected.mediaUrl}
                  onChange={(event) => updateArticle(selected.id, { mediaUrl: event.target.value })}
                />
              </label>

              <label>
                <span>Excerpt</span>
                <textarea
                  rows={4}
                  value={selected.excerpt}
                  onChange={(event) => updateArticle(selected.id, { excerpt: event.target.value })}
                />
              </label>

              <div className="admin-content-grid-two">
                <label>
                  <span>Social media image URL (1200 x 630px, under 300kb)</span>
                  <input
                    value={selected.socialImageUrl || ''}
                    onChange={(event) => updateArticle(selected.id, { socialImageUrl: event.target.value })}
                    placeholder="https://media.agfinancial.org/.../social-image.jpg"
                  />
                  <p className="admin-content-note">
                    Point to the shared social media folder so these cards align with the media plan.
                  </p>
                </label>

                <label>
                  <span>Social image alt text (optional)</span>
                  <input
                    value={selected.socialImageAlt || ''}
                    onChange={(event) => updateArticle(selected.id, { socialImageAlt: event.target.value })}
                    placeholder="Describe the social image for accessibility"
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Social title (optional if different than article title)</span>
                  <input
                    value={selected.socialTitle || ''}
                    onChange={(event) => updateArticle(selected.id, { socialTitle: event.target.value })}
                    placeholder={selected.title || 'Article title'}
                  />
                </label>

                <label>
                  <span>Social description (optional; leave blank to use excerpt)</span>
                  <textarea
                    rows={3}
                    value={selected.socialDescription || ''}
                    onChange={(event) => updateArticle(selected.id, { socialDescription: event.target.value })}
                    placeholder={selected.excerpt || 'Will use excerpt if empty'}
                  />
                </label>
              </div>

              <label>
                <span>Body content</span>
                <AdminHtmlEditor
                  value={selected.bodyHtml}
                  onChange={(nextHtml) => updateArticle(selected.id, { bodyHtml: nextHtml })}
                  placeholder="Write the article body here..."
                />
              </label>
            </div>
              </section>
            ) : (
              <section className="admin-content-section admin-resources-editor-panel">
                <div className="admin-resources-empty-editor">
                  <div className="admin-resources-empty-shape" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="admin-resources-eyebrow">Article editor</p>
                  <h2>Select or create an article</h2>
                  <p className="blank-state-note">
                    Choose an article from the library to edit its details, or use Add article above to start a new one.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
}

export default function AdminResourcesPage() {
  return (
    <ResourcesProvider>
      <AdminResourcesPageContent />
    </ResourcesProvider>
  );
}
