import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useTestimonials } from '../context/TestimonialsContext';
import { parseTokenList } from '../lib/testimonials';

const FILTER_CATALOG_STORAGE_KEY = 'agf-testimonials-filter-catalog-v1';
const ADD_CATEGORY_FILTER_VALUE = '__add_category__';

function normalizeTagList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap((entry) => parseTokenList(entry)))).sort((a, b) => a.localeCompare(b));
  }
  return parseTokenList(value);
}

function readStoredFilterCatalog() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(FILTER_CATALOG_STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeTagList(parsed);
  } catch {
    return [];
  }
}

function toTitleSuffix(item) {
  const author = String(item?.author || '').trim();
  const quote = String(item?.quote || '').trim();
  if (!author && !quote) {
    return '(empty)';
  }
  if (!author) {
    return quote.slice(0, 48);
  }
  return author;
}

function toTagLabel(tag) {
  return String(tag || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AdminTestimonialsPage() {
  const {
    testimonials,
    addTestimonial,
    updateTestimonial,
    removeTestimonial,
    bulkUpdateTestimonials,
    resetTestimonials,
  } = useTestimonials();

  const [selectedId, setSelectedId] = useState(testimonials[0]?.id || null);
  const [search, setSearch] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState('all');
  const [filterCatalog, setFilterCatalog] = useState(readStoredFilterCatalog);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState('');
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  useEffect(() => {
    if (!testimonials.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !testimonials.some((item) => item.id === selectedId)) {
      setSelectedId(testimonials[0].id);
    }
  }, [selectedId, testimonials]);

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_CATALOG_STORAGE_KEY, JSON.stringify(filterCatalog));
    } catch {
      // ignore storage write failures
    }
  }, [filterCatalog]);

  const selected = useMemo(
    () => testimonials.find((item) => item.id === selectedId) || null,
    [selectedId, testimonials],
  );

  const derivedTags = useMemo(() => {
    const tags = new Set();
    testimonials.forEach((item) => {
      (Array.isArray(item?.tags) ? item.tags : []).forEach((tag) => {
        const token = parseTokenList(tag)[0];
        if (token) {
          tags.add(token);
        }
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [testimonials]);

  const allTags = useMemo(
    () => Array.from(new Set([...derivedTags, ...filterCatalog])).sort((a, b) => a.localeCompare(b)),
    [derivedTags, filterCatalog],
  );

  const filteredTestimonials = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return testimonials.filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags : [];
      const matchesFilter = activeFilterTag === 'all' || tags.includes(activeFilterTag);
      if (!matchesFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [
        item.id,
        item.quote,
        item.author,
        item.authorTitle,
        tags.join(' '),
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [activeFilterTag, search, testimonials]);

  const tagCounts = useMemo(() => {
    const counts = new Map();
    testimonials.forEach((item) => {
      (Array.isArray(item?.tags) ? item.tags : []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
  }, [testimonials]);

  const selectedTagSet = useMemo(
    () => new Set(Array.isArray(selected?.tags) ? selected.tags : []),
    [selected?.tags],
  );

  const addCategory = (rawValue) => {
    const token = parseTokenList(rawValue)[0];
    if (!token) {
      return null;
    }
    setFilterCatalog((previous) => {
      if (previous.includes(token)) {
        return previous;
      }
      return [...previous, token].sort((a, b) => a.localeCompare(b));
    });
    return token;
  };

  const handleFilterSelection = (nextValue) => {
    if (nextValue === ADD_CATEGORY_FILTER_VALUE) {
      setShowAddCategory(true);
      return;
    }
    setActiveFilterTag(nextValue);
    setShowAddCategory(false);
  };

  const toggleCategoryOnSelected = (tag) => {
    if (!selected) {
      return;
    }
    const token = parseTokenList(tag)[0];
    if (!token) {
      return;
    }
    const current = normalizeTagList(selected.tags || []);
    const nextTags = current.includes(token)
      ? current.filter((entry) => entry !== token)
      : [...current, token].sort((a, b) => a.localeCompare(b));
    updateTestimonial(selected.id, { tags: nextTags });
  };

  const removeCategoryEverywhere = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token || typeof bulkUpdateTestimonials !== 'function') {
      return;
    }
    bulkUpdateTestimonials((items) => items.map((item) => {
      const current = normalizeTagList(item.tags || []);
      if (!current.includes(token)) {
        return item;
      }
      return {
        ...item,
        tags: current.filter((entry) => entry !== token),
      };
    }));
    setFilterCatalog((previous) => previous.filter((entry) => entry !== token));
    if (activeFilterTag === token) {
      setActiveFilterTag('all');
    }
    if (editingCategory === token) {
      setEditingCategory('');
      setEditingCategoryValue('');
    }
  };

  const startCategoryRename = (tag) => {
    setIsCategoryManagerOpen(true);
    setEditingCategory(tag);
    setEditingCategoryValue(tag);
  };

  const applyCategoryRename = () => {
    if (!editingCategory || typeof bulkUpdateTestimonials !== 'function') {
      return;
    }
    const oldToken = parseTokenList(editingCategory)[0];
    const newToken = parseTokenList(editingCategoryValue)[0];
    if (!oldToken || !newToken) {
      return;
    }
    if (oldToken === newToken) {
      setEditingCategory('');
      setEditingCategoryValue('');
      return;
    }

    bulkUpdateTestimonials((items) => items.map((item) => {
      const current = normalizeTagList(item.tags || []);
      if (!current.includes(oldToken)) {
        return item;
      }
      return {
        ...item,
        tags: normalizeTagList(current.map((tag) => (tag === oldToken ? newToken : tag))),
      };
    }));

    setFilterCatalog((previous) => normalizeTagList(previous.map((tag) => (tag === oldToken ? newToken : tag))));

    if (activeFilterTag === oldToken) {
      setActiveFilterTag(newToken);
    }

    setEditingCategory('');
    setEditingCategoryValue('');
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Testimonials" source={pageByPath['/admin/testimonials']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Select a testimonial card and edit instantly on the right. Categories are managed in one place and reused everywhere.
        </div>

        <div className="admin-content-top-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={() => {
              const nextId = addTestimonial();
              if (nextId) {
                setSelectedId(nextId);
              }
            }}
          >
            Add testimonial
          </button>
          <button
            type="button"
            className="action-btn action-btn-danger"
            disabled={!selected}
            onClick={() => {
              if (!selected) {
                return;
              }
              removeTestimonial(selected.id);
            }}
          >
            Delete selected
          </button>
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={() => {
              resetTestimonials();
              setSelectedId(null);
            }}
          >
            Reset defaults
          </button>
        </div>

        <section className="admin-content-section admin-testimonials-workbench">
          <div className="admin-testimonials-library-panel">
            <div className="admin-testimonials-library-toolbar">
              <label htmlFor="admin-testimonials-search" className="search-page-label">
                Search
                <input
                  id="admin-testimonials-search"
                  className="search-page-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search quote, author, ID, category"
                />
              </label>

              <div className="admin-testimonials-filter-actions">
                <label htmlFor="admin-testimonials-filter-tag" className="search-page-label">
                  Category filter
                  <select
                    id="admin-testimonials-filter-tag"
                    className="search-page-select"
                    value={activeFilterTag}
                    onChange={(event) => handleFilterSelection(event.target.value)}
                  >
                    <option value="all">All categories</option>
                    {allTags.map((tag) => (
                      <option key={`admin-testimonials-filter-${tag}`} value={tag}>
                        {toTagLabel(tag)}
                      </option>
                    ))}
                    <option value={ADD_CATEGORY_FILTER_VALUE}>+ Add category…</option>
                  </select>
                </label>

                <button
                  type="button"
                  className={`action-btn action-btn-outline admin-testimonials-manage-btn${isCategoryManagerOpen ? ' is-active' : ''}`}
                  onClick={() => {
                    setIsCategoryManagerOpen((value) => !value);
                    setEditingCategory('');
                    setEditingCategoryValue('');
                  }}
                >
                  {isCategoryManagerOpen ? 'Close categories' : 'Manage categories'}
                </button>
              </div>

              <p className="admin-content-note">
                Showing {filteredTestimonials.length} of {testimonials.length} testimonials.
              </p>

              {showAddCategory ? (
                <div className="admin-testimonials-category-add-inline">
                  <input
                    value={newCategoryValue}
                    onChange={(event) => setNewCategoryValue(event.target.value)}
                    placeholder="New category"
                  />
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    onClick={() => {
                      const token = addCategory(newCategoryValue);
                      if (!token) {
                        return;
                      }
                      setActiveFilterTag(token);
                      setNewCategoryValue('');
                      setShowAddCategory(false);
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryValue('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>

            {isCategoryManagerOpen ? (
              <div className="admin-testimonials-category-strip">
                <p className="admin-testimonials-category-strip-title">Manage categories</p>
                <div className="admin-testimonials-category-chip-list">
                  {allTags.length ? allTags.map((tag) => (
                    <span key={`admin-testimonials-tag-${tag}`} className="admin-testimonials-category-chip">
                      <button
                        type="button"
                        className={`admin-testimonials-category-chip-main${activeFilterTag === tag ? ' is-active' : ''}`}
                        onClick={() => setActiveFilterTag(tag)}
                      >
                        {toTagLabel(tag)}
                        <small>{tagCounts.get(tag) || 0}</small>
                      </button>
                      <button
                        type="button"
                        className="admin-testimonials-category-chip-action is-icon"
                        onClick={() => startCategoryRename(tag)}
                        title={`Rename ${tag}`}
                        aria-label={`Rename ${tag}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path fill="currentColor" d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.95 1.95 3.75 3.75 2.11-2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="admin-testimonials-category-chip-action is-icon is-danger"
                        onClick={() => removeCategoryEverywhere(tag)}
                        title={`Delete ${tag}`}
                        aria-label={`Delete ${tag}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2h4v2H4V6h4l1-2z" />
                        </svg>
                      </button>
                    </span>
                  )) : (
                    <p className="blank-state-note">No categories yet.</p>
                  )}
                </div>

                {editingCategory ? (
                  <div className="admin-testimonials-category-rename-inline">
                    <input
                      value={editingCategoryValue}
                      onChange={(event) => setEditingCategoryValue(event.target.value)}
                      placeholder="Rename category"
                    />
                    <button
                      type="button"
                      className="action-btn action-btn-outline"
                      onClick={applyCategoryRename}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn-outline"
                      onClick={() => {
                        setEditingCategory('');
                        setEditingCategoryValue('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="admin-testimonials-card-scroller">
              {filteredTestimonials.length ? (
                <div className="admin-testimonials-page-card-grid">
                  {filteredTestimonials.map((item) => {
                    const isActive = item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`admin-testimonials-page-card${isActive ? ' is-active' : ''}`}
                        onClick={() => setSelectedId(item.id)}
                        aria-pressed={isActive}
                      >
                        <p className="admin-testimonials-page-card-quote">{item.quote || 'No quote yet'}</p>
                        <p className="admin-testimonials-page-card-author">
                          {toTitleSuffix(item)}
                          {item.authorTitle ? ` · ${item.authorTitle}` : ''}
                        </p>
                        <p className="admin-testimonials-page-card-meta">ID: {item.id}</p>
                        <div className="admin-testimonials-page-card-tags">
                          {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (
                            <span key={`${item.id}-${tag}`}>{toTagLabel(tag)}</span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="blank-state-note">No testimonials match this search/filter.</p>
              )}
            </div>
          </div>

          <aside className="admin-testimonials-editor-panel">
            {selected ? (
              <>
                <div className="admin-testimonials-editor-panel-head">
                  <h3>{toTitleSuffix(selected)}</h3>
                  <p>ID: {selected.id}</p>
                </div>

                <div className="admin-content-field-list admin-testimonials-page-editor-fields">
                  <label>
                    <span>Quote</span>
                    <textarea
                      rows={6}
                      value={selected.quote || ''}
                      onChange={(event) => updateTestimonial(selected.id, { quote: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Author</span>
                    <input
                      value={selected.author || ''}
                      onChange={(event) => updateTestimonial(selected.id, { author: event.target.value })}
                      placeholder="Name, Organization"
                    />
                  </label>
                  <label>
                    <span>Author title (optional)</span>
                    <input
                      value={selected.authorTitle || ''}
                      onChange={(event) => updateTestimonial(selected.id, { authorTitle: event.target.value })}
                      placeholder="Title"
                    />
                  </label>
                  <div className="admin-testimonials-page-editor-tags">
                    <span>Categories</span>
                    <div className="admin-testimonials-page-editor-tag-choices">
                      {allTags.map((tag) => (
                        <button
                          key={`admin-testimonials-select-tag-${tag}`}
                          type="button"
                          className={`admin-testimonials-page-editor-tag-choice${selectedTagSet.has(tag) ? ' is-active' : ''}`}
                          onClick={() => toggleCategoryOnSelected(tag)}
                        >
                          {toTagLabel(tag)}
                        </button>
                      ))}
                    </div>
                    <p className="admin-content-note">Click a category to add/remove it from this testimonial.</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="blank-state-note">Select a testimonial card to edit.</p>
            )}
          </aside>
        </section>
      </PageShell>
    </div>
  );
}
