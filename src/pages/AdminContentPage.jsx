import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useContentAdmin } from '../context/ContentAdminContext';
import { pageByPath, sitePages } from '../data/siteMap';

function sortPages(pages) {
  return [...pages].sort((a, b) => a.path.localeCompare(b.path));
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

function renderFieldControl(field, value, onChange) {
  if (field.type === 'boolean') {
    return (
      <select value={String(toBoolean(value))} onChange={(event) => onChange(event.target.value === 'true')}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      />
    );
  }

  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

export default function AdminContentPage() {
  const editablePages = useMemo(
    () => sortPages(sitePages.filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search')),
    [],
  );

  const [selectedPath, setSelectedPath] = useState(editablePages[0]?.path || '/');
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const {
    pageHierarchy,
    blocksByPath,
    updatePageHierarchy,
    updateBlock,
    updateBlockSetting,
    getBreadcrumbTrail,
    resetContentAdmin,
  } = useContentAdmin();

  const selectedPage = pageHierarchy[selectedPath] || null;
  const selectedBlocks = blocksByPath[selectedPath] || [];
  const selectedBlock = selectedBlocks.find((block) => block.id === selectedBlockId) || selectedBlocks[0] || null;
  const breadcrumbTrail = getBreadcrumbTrail(selectedPath);

  const parentOptions = editablePages.filter((page) => page.path !== selectedPath);

  return (
    <div className="wp-page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Content Blocks" source={pageByPath['/admin/content']?.source ?? null}>
        <div className="admin-info-note">
          Static-to-dynamic migration control center. Keep blocks `static` by default, then switch each block to
          `dynamic` when its admin editor is ready.
        </div>

        <div className="admin-content-top-actions">
          <Link to="/admin/rates" className="action-btn action-btn-outline">Open rates admin</Link>
          <button type="button" onClick={resetContentAdmin} className="action-btn action-btn-danger">Reset content admin state</button>
        </div>

        <section className="admin-content-section">
          <h3>1. Select Page</h3>
          <label htmlFor="admin-content-page-select" className="search-page-label">Page route</label>
          <select
            id="admin-content-page-select"
            className="search-page-input"
            value={selectedPath}
            onChange={(event) => {
              setSelectedPath(event.target.value);
              setSelectedBlockId(null);
            }}
          >
            {editablePages.map((page) => (
              <option key={page.path} value={page.path}>{page.path} — {page.title}</option>
            ))}
          </select>
        </section>

        <section className="admin-content-section">
          <h3>2. Breadcrumb Hierarchy</h3>
          {selectedPage ? (
            <>
              <div className="admin-content-grid-two">
                <div>
                  <label htmlFor="admin-breadcrumb-label" className="search-page-label">Breadcrumb label</label>
                  <input
                    id="admin-breadcrumb-label"
                    className="search-page-input"
                    value={selectedPage.breadcrumbLabel}
                    onChange={(event) => updatePageHierarchy(selectedPath, { breadcrumbLabel: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="admin-breadcrumb-parent" className="search-page-label">Parent route</label>
                  <select
                    id="admin-breadcrumb-parent"
                    className="search-page-input"
                    value={selectedPage.parentPath || ''}
                    onChange={(event) => updatePageHierarchy(selectedPath, { parentPath: event.target.value || null })}
                  >
                    <option value="">No parent</option>
                    {parentOptions.map((page) => (
                      <option key={page.path} value={page.path}>{page.path} — {page.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-breadcrumb-preview">
                <strong>Preview:</strong>
                {' '}
                {breadcrumbTrail.map((item, index) => (
                  <span key={item.path}>
                    {index > 0 ? ' > ' : ''}
                    {item.label}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="admin-content-section">
          <h3>3. Block Migration Status</h3>
          <div className="table-scroll">
            <table className="ag-table ag-table-inputs">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedBlocks.map((block) => (
                  <tr key={block.id} onClick={() => setSelectedBlockId(block.id)} className={selectedBlock?.id === block.id ? 'admin-block-selected-row' : ''}>
                    <td>{block.name}</td>
                    <td>{block.kind}</td>
                    <td>
                      <select
                        value={block.mode}
                        onChange={(event) => updateBlock(selectedPath, block.id, { mode: event.target.value })}
                      >
                        <option value="static">static</option>
                        <option value="dynamic">dynamic</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-content-section">
          <h3>4. Block-Specific Fields</h3>
          {selectedBlock ? (
            <>
              <p>
                Editing block:
                {' '}
                <strong>{selectedBlock.name}</strong>
                {' '}
                (`{selectedBlock.mode}`)
              </p>
              {(selectedBlock.editableFields || []).length ? (
                <div className="admin-content-field-list">
                  {selectedBlock.editableFields.map((field) => (
                    <label key={field.id}>
                      <span>{field.label}</span>
                      {renderFieldControl(field, selectedBlock.settings?.[field.id], (nextValue) => {
                        updateBlockSetting(selectedPath, selectedBlock.id, field.id, nextValue);
                      })}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="blank-state-note">
                  This block does not have custom fields yet. Keep it `static` until its editor schema is defined.
                </p>
              )}
            </>
          ) : (
            <p className="blank-state-note">No blocks found for this page yet.</p>
          )}
        </section>
      </PageShell>
    </div>
  );
}
