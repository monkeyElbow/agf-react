import { useEffect, useMemo, useState } from 'react';
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
    updateArticle,
    createArticle,
    deleteArticle,
    resetArticles,
  } = useResources();

  const [selectedId, setSelectedId] = useState(articles[0]?.id || null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (!articles.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !articles.some((item) => item.id === selectedId)) {
      setSelectedId(articles[0].id);
    }
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
  const [viewMode, setViewMode] = useState('grid');

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
            onClick={resetArticles}
          >
            Reset from seed
          </button>
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-danger"
              onClick={() => {
                deleteArticle(selected.id);
              }}
            >
              Delete selected
            </button>
          ) : null}
        </div>

        <section className="admin-content-section admin-resources-toolbar">
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

        <section className="admin-content-section">
          {sortedFiltered.length ? (
            <div className={`admin-resources-gallery is-${viewMode}`}>
              {sortedFiltered.map((item) => {
                const isActive = item.id === selectedId;
                const publishedLabel = item.isPublished ? 'Published' : 'Draft';
                const backgroundImage = item.mediaUrl ? { backgroundImage: `url(${item.mediaUrl})` } : {};
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-resources-card${isActive ? ' is-active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
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

        {selected ? (
          <section className="admin-content-section">
            <div className="admin-content-field-list">
              <label>
                <span>Title</span>
                <input
                  value={selected.title}
                  onChange={(event) => updateArticle(selected.id, { title: event.target.value })}
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  value={selected.slug}
                  onChange={(event) => updateArticle(selected.id, { slug: event.target.value })}
                />
              </label>

              <p className="blank-state-note">
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
                  <span>Published at</span>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocal(selected.publishedAt)}
                    onChange={(event) => updateArticle(selected.id, { publishedAt: fromDateTimeLocal(event.target.value) })}
                  />
                </label>

                <label>
                  <span>Published status</span>
                  <select
                    value={selected.isPublished ? 'published' : 'draft'}
                    onChange={(event) => updateArticle(selected.id, { isPublished: event.target.value === 'published' })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

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
          <section className="admin-content-section">
            <div className="blank-state">
              <p>No article selected.</p>
              <p className="blank-state-note">Add an article to start editing resources content.</p>
            </div>
          </section>
        )}
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
