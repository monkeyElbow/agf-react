import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useDocuments } from '../context/DocumentsContext';

function tagsToCsv(tags) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

function csvToTags(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLikelyExternalUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function formatDocumentKind(kind) {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'zip') return 'ZIP';
  if (kind === 'web-form') return 'Web Form';
  if (kind === 'external-page') return 'Web URL';
  return 'Unassigned';
}

export default function AdminDocumentsPage() {
  const {
    documents,
    lastDeletedDocument,
    missingSeedDocumentsCount,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreLastDeletedDocument,
    restoreMissingSeedDocuments,
    resetDocuments,
  } = useDocuments();

  const [selectedId, setSelectedId] = useState(documents[0]?.id || null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [deleteArmedId, setDeleteArmedId] = useState(null);

  useEffect(() => {
    if (!documents.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(documents[0].id);
    }
  }, [documents, selectedId]);

  useEffect(() => {
    if (deleteArmedId && deleteArmedId !== selectedId) {
      setDeleteArmedId(null);
    }
  }, [deleteArmedId, selectedId]);

  const categories = useMemo(
    () => Array.from(new Set(documents.map((doc) => doc.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [documents],
  );

  const topics = useMemo(
    () => Array.from(new Set(documents.map((doc) => doc.topic).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [documents],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
      if (topicFilter !== 'all' && (doc.topic || '') !== topicFilter) return false;
      if (!needle) return true;
      return [
        doc.title,
        doc.id,
        doc.category,
        doc.topic,
        doc.kind,
        doc.url,
        ...(doc.tags || []),
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [documents, categoryFilter, search, topicFilter]);

  const selected = documents.find((doc) => doc.id === selectedId) || null;
  const duplicateIds = useMemo(() => {
    const counts = new Map();
    documents.forEach((doc) => {
      counts.set(doc.id, (counts.get(doc.id) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([id]) => id));
  }, [documents]);

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Documents" source={pageByPath['/admin/documents']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Source-of-truth document library for PDFs and web forms. Pages can later reference these records by <strong>documentId</strong>.
        </div>

        <div className="admin-content-top-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={() => {
              const newId = createDocument({
                title: 'New Document',
                category: 'form',
                topic: '',
                url: '',
                active: false,
              });
              if (newId) setSelectedId(newId);
            }}
          >
            Add document
          </button>
          {lastDeletedDocument ? (
            <button
              type="button"
              className="action-btn action-btn-outline"
              onClick={() => {
                const restoredId = restoreLastDeletedDocument();
                if (restoredId) {
                  setSelectedId(restoredId);
                  setDeleteArmedId(null);
                }
              }}
            >
              Restore last deleted
            </button>
          ) : null}
          {missingSeedDocumentsCount > 0 ? (
            <button
              type="button"
              className="action-btn action-btn-outline"
              onClick={() => {
                restoreMissingSeedDocuments();
                if (!selectedId && documents[0]?.id) {
                  setSelectedId(documents[0].id);
                }
                setDeleteArmedId(null);
              }}
            >
              Restore missing seed docs ({missingSeedDocumentsCount})
            </button>
          ) : null}
          <button type="button" className="action-btn action-btn-outline" onClick={resetDocuments}>
            Reset from seed
          </button>
          {selected ? (
            deleteArmedId === selected.id ? (
              <>
                <button
                  type="button"
                  className="action-btn action-btn-danger"
                  onClick={() => {
                    deleteDocument(selected.id);
                    setDeleteArmedId(null);
                  }}
                >
                  Confirm delete selected
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={() => setDeleteArmedId(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="action-btn action-btn-danger"
                onClick={() => setDeleteArmedId(selected.id)}
              >
                Delete selected
              </button>
            )
          ) : null}
        </div>
        {selected && deleteArmedId === selected.id ? (
          <p className="blank-state-note" style={{ color: '#a23d00', marginTop: '0.75rem' }}>
            Confirm delete to remove <strong>{selected.title || selected.id}</strong>. Use restore if this was accidental.
          </p>
        ) : null}

        <section className="admin-content-section">
          <div className="admin-content-grid-two">
            <div>
              <label htmlFor="admin-documents-search" className="search-page-label">Search documents</label>
              <input
                id="admin-documents-search"
                className="search-page-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, ID, topic, category, URL"
              />
            </div>
            <div>
              <label htmlFor="admin-documents-category" className="search-page-label">Category</label>
              <select
                id="admin-documents-category"
                className="search-page-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-content-grid-two" style={{ marginTop: '0.9rem' }}>
            <div>
              <label htmlFor="admin-documents-topic" className="search-page-label">Topic</label>
              <select
                id="admin-documents-topic"
                className="search-page-select"
                value={topicFilter}
                onChange={(event) => setTopicFilter(event.target.value)}
              >
                <option value="all">All topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin-documents-select" className="search-page-label">Select document</label>
              <select
                id="admin-documents-select"
                className="search-page-select"
                value={selectedId || ''}
                onChange={(event) => setSelectedId(event.target.value || null)}
              >
                {filtered.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.category}{doc.topic ? ` / ${doc.topic}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="admin-content-section admin-documents-list-section">
          <h3>Documents ({documents.length})</h3>
          {documents.length ? (
            <div className="table-scroll admin-documents-table-scroll">
              <table className="data-table data-table--inputs admin-documents-table">
                <thead>
                  <tr>
                    <th>Active</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Topic</th>
                    <th>Kind</th>
                    <th className="admin-documents-url-col">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={`row-${doc.id}-${doc.url}`}
                      className={`admin-documents-row${doc.id === selectedId ? ' is-selected' : ''}`}
                      onClick={() => setSelectedId(doc.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedId(doc.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select document ${doc.title || doc.id}`}
                    >
                      <td>{doc.active ? 'On' : 'Off'}</td>
                      <td className="admin-documents-title-cell">{doc.title || '(untitled)'}</td>
                      <td>{doc.category}</td>
                      <td>{doc.topic || '—'}</td>
                      <td>{formatDocumentKind(doc.kind)}</td>
                      <td className="admin-documents-url-col">
                        <span className="admin-documents-url-text" title={doc.url || ''}>
                          {doc.url || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="blank-state-note">No documents match the current filters.</p>
          )}
        </section>

        {selected ? (
          <section className="admin-content-section">
            <h3>Edit Selected Document</h3>
            {duplicateIds.has(selected.id) ? (
              <p className="blank-state-note" style={{ color: '#a23d00' }}>
                Duplicate ID detected. IDs should be unique for reliable document references.
              </p>
            ) : null}
            <div className="admin-content-field-list">
              <div className="admin-content-grid-two">
                <label>
                  <span>Title</span>
                  <input
                    value={selected.title}
                    onChange={(event) => updateDocument(selected.id, { title: event.target.value })}
                  />
                </label>
                <label>
                  <span>ID (stable reference key)</span>
                  <input
                    value={selected.id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      updateDocument(selected.id, { id: nextId });
                      setSelectedId(nextId);
                    }}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Category</span>
                  <input
                    value={selected.category}
                    onChange={(event) => updateDocument(selected.id, { category: event.target.value })}
                    placeholder="form"
                  />
                </label>
                <label>
                  <span>Topic</span>
                  <input
                    value={selected.topic}
                    onChange={(event) => updateDocument(selected.id, { topic: event.target.value })}
                    placeholder="Retirement"
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Type (auto from URL)</span>
                  <input value={formatDocumentKind(selected.kind)} readOnly />
                </label>
                <label>
                  <span>Active</span>
                  <select
                    value={selected.active ? 'on' : 'off'}
                    onChange={(event) => updateDocument(selected.id, { active: event.target.value === 'on' })}
                  >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                </label>
              </div>

              <label>
                <span>URL</span>
                <input
                  value={selected.url}
                  onChange={(event) => {
                    const nextUrl = event.target.value;
                    updateDocument(selected.id, { url: nextUrl });
                  }}
                  placeholder="https://files.agfinancial.org/..."
                />
              </label>

              <div className="admin-content-grid-two">
                <label>
                  <span>Tags (comma-separated)</span>
                  <input
                    value={tagsToCsv(selected.tags)}
                    onChange={(event) => updateDocument(selected.id, { tags: csvToTags(event.target.value) })}
                    placeholder="retirement, enrollment"
                  />
                </label>
                <label>
                  <span>Sort order</span>
                  <input
                    type="number"
                    value={selected.sortOrder}
                    onChange={(event) => updateDocument(selected.id, { sortOrder: Number(event.target.value) || 0 })}
                  />
                </label>
              </div>

              <label>
                <span>Notes (internal)</span>
                <input
                  value={selected.notes}
                  onChange={(event) => updateDocument(selected.id, { notes: event.target.value })}
                  placeholder="Optional admin note"
                />
              </label>

              <p className="blank-state-note">
                Link preview:{' '}
                {selected.url ? (
                  isLikelyExternalUrl(selected.url) ? (
                    <a href={selected.url} target="_blank" rel="noreferrer noopener">{selected.url}</a>
                  ) : (
                    <code>{selected.url}</code>
                  )
                ) : (
                  <span>None</span>
                )}
              </p>
            </div>
          </section>
        ) : null}
      </PageShell>
    </div>
  );
}
