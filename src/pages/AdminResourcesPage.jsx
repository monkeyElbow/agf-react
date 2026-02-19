import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
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

  useEffect(() => {
    if (!articles.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !articles.some((item) => item.id === selectedId)) {
      setSelectedId(articles[0].id);
    }
  }, [articles, selectedId]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return articles;
    }

    return articles.filter((item) => [
      item.title,
      item.category,
      item.slug,
    ].join(' ').toLowerCase().includes(needle));
  }, [articles, search]);

  const selected = articles.find((item) => item.id === selectedId) || null;

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

        <section className="admin-content-section">
          <label htmlFor="admin-resources-search" className="search-page-label">Search articles</label>
          <input
            id="admin-resources-search"
            className="search-page-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, category, or slug"
          />
        </section>

        <section className="admin-content-section">
          <label htmlFor="admin-resources-select" className="search-page-label">Select article</label>
          <select
            id="admin-resources-select"
            className="search-page-select"
            value={selectedId || ''}
            onChange={(event) => setSelectedId(event.target.value || null)}
          >
            {filtered.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.category})
              </option>
            ))}
          </select>
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
                <span>Source URL</span>
                <input
                  value={selected.sourceUrl}
                  onChange={(event) => updateArticle(selected.id, { sourceUrl: event.target.value })}
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

              <label>
                <span>Body HTML</span>
                <textarea
                  rows={22}
                  value={selected.bodyHtml}
                  onChange={(event) => updateArticle(selected.id, { bodyHtml: event.target.value })}
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
