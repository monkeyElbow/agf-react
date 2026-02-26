import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { detectDocumentKind, useDocuments } from '../context/DocumentsContext';

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

export default function AdminDocumentsPage() {
  const {
    documents,
    createDocument,
    updateDocument,
    deleteDocument,
    resetDocuments,
  } = useDocuments();

  const [selectedId, setSelectedId] = useState(documents[0]?.id || null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  useEffect(() => {
    if (!documents.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(documents[0].id);
    }
  }, [documents, selectedId]);

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
                kind: 'pdf',
                url: '',
                active: false,
              });
              if (newId) setSelectedId(newId);
            }}
          >
            Add document
          </button>
          <button type="button" className="action-btn action-btn-outline" onClick={resetDocuments}>
            Reset from seed
          </button>
          {selected ? (
            <button
              type="button"
              className="action-btn action-btn-danger"
              onClick={() => deleteDocument(selected.id)}
            >
              Delete selected
            </button>
          ) : null}
        </div>

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

        <section className="admin-content-section">
          <h3>Documents ({documents.length})</h3>
          {documents.length ? (
            <div className="table-scroll">
              <table className="ag-table ag-table-inputs">
                <thead>
                  <tr>
                    <th>Active</th>
                    <th>Title</th>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Topic</th>
                    <th>Kind</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={`row-${doc.id}-${doc.url}`}
                      style={doc.id === selectedId ? { background: 'rgba(0, 172, 187, 0.06)' } : undefined}
                    >
                      <td>{doc.active ? 'On' : 'Off'}</td>
                      <td>
                        <button
                          type="button"
                          className="action-btn action-btn-outline"
                          onClick={() => setSelectedId(doc.id)}
                        >
                          {doc.title || '(untitled)'}
                        </button>
                      </td>
                      <td><code>{doc.id}</code></td>
                      <td>{doc.category}</td>
                      <td>{doc.topic || '—'}</td>
                      <td>{doc.kind}</td>
                      <td style={{ maxWidth: 320, overflowWrap: 'anywhere' }}>{doc.url || '—'}</td>
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
                  <span>Kind</span>
                  <select
                    value={selected.kind}
                    onChange={(event) => updateDocument(selected.id, { kind: event.target.value })}
                  >
                    <option value="pdf">pdf</option>
                    <option value="web-form">web-form</option>
                    <option value="external-page">external-page</option>
                  </select>
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
                    updateDocument(selected.id, {
                      url: nextUrl,
                      kind: detectDocumentKind(nextUrl),
                    });
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

