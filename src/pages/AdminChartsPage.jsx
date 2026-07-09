import { useEffect, useMemo, useState } from 'react';
import InfoTableSheet from '../components/InfoTableSheet';
import PageShell from '../components/PageShell';
import { useCharts } from '../context/ChartsContext';
import { buildDefaultChartsLibrary } from '../data/chartsLibrarySeed';
import { pageByPath } from '../data/siteMap';

function cloneRows(rows = []) {
  return rows.map((row) => (Array.isArray(row) ? [...row] : []));
}

export default function AdminChartsPage() {
  const { charts, updateChart, resetCharts } = useCharts();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');

  const filteredCharts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return charts;
    }
    return charts.filter((entry) => [
      entry.title,
      entry.group,
      entry.scope,
      entry.usage,
      entry.id,
    ].join(' ').toLowerCase().includes(needle));
  }, [charts, search]);

  useEffect(() => {
    if (!charts.length) {
      setSelectedId('');
      return;
    }
    if (!selectedId || !charts.some((entry) => entry.id === selectedId)) {
      setSelectedId(charts[0].id);
    }
  }, [charts, selectedId]);

  const selectedChart = useMemo(
    () => charts.find((entry) => entry.id === selectedId) || null,
    [charts, selectedId],
  );

  const resetSelected = () => {
    if (!selectedChart) {
      return;
    }
    const defaultEntry = buildDefaultChartsLibrary().find((entry) => entry.id === selectedChart.id) || null;
    if (!defaultEntry) {
      return;
    }
    updateChart(selectedChart.id, defaultEntry);
  };

  const updateHeaderCell = (index, value) => {
    if (!selectedChart) {
      return;
    }
    const nextHeaders = [...selectedChart.headers];
    nextHeaders[index] = value;
    updateChart(selectedChart.id, { headers: nextHeaders });
  };

  const updateRowCell = (rowIndex, cellIndex, value) => {
    if (!selectedChart) {
      return;
    }
    const nextRows = cloneRows(selectedChart.rows);
    nextRows[rowIndex][cellIndex] = value;
    updateChart(selectedChart.id, { rows: nextRows });
  };

  const addRow = () => {
    if (!selectedChart) {
      return;
    }
    updateChart(selectedChart.id, {
      rows: [
        ...cloneRows(selectedChart.rows),
        Array.from({ length: selectedChart.headers.length }, () => ''),
      ],
    });
  };

  const removeRow = (rowIndex) => {
    if (!selectedChart) {
      return;
    }
    updateChart(selectedChart.id, {
      rows: cloneRows(selectedChart.rows).filter((_, index) => index !== rowIndex),
    });
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Charts" source={pageByPath['/admin/charts']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Manage shared public chart data here. Use this for structured tables that should stay editable without burying values in page copy.
        </div>

        <section className="admin-content-section admin-testimonials-workbench">
          <div className="admin-testimonials-library-panel">
            <div className="admin-testimonials-library-toolbar">
              <label htmlFor="admin-charts-search" className="search-page-label">
                Search charts
                <input
                  id="admin-charts-search"
                  className="search-page-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, group, or usage"
                />
              </label>
              <div className="admin-testimonials-filter-actions">
                <button type="button" className="action-btn action-btn-outline" onClick={resetSelected} disabled={!selectedChart}>
                  Reset selected
                </button>
                <button type="button" className="action-btn action-btn-danger" onClick={resetCharts}>
                  Reset all defaults
                </button>
              </div>
            </div>

            <p className="admin-content-note">
              Showing {filteredCharts.length} of {charts.length} managed charts.
            </p>

            <div className="admin-testimonials-card-scroller">
              {filteredCharts.length ? (
                <div className="admin-testimonials-page-card-grid">
                  {filteredCharts.map((entry) => {
                    const isActive = entry.id === selectedId;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={`admin-testimonials-page-card${isActive ? ' is-active' : ''}`}
                        onClick={() => setSelectedId(entry.id)}
                      >
                        <p className="admin-testimonials-page-card-author">
                          <strong>{entry.group}</strong> · {entry.scope}
                        </p>
                        <p className="admin-testimonials-page-card-quote">{entry.title}</p>
                        <p className="admin-testimonials-page-card-meta">ID: {entry.id}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="blank-state-note">No charts match this search.</p>
              )}
            </div>
          </div>

          <div className="admin-testimonials-editor-panel">
            {selectedChart ? (
              <>
                <div className="admin-testimonials-editor-header">
                  <div>
                    <h3>{selectedChart.title}</h3>
                    <p>{selectedChart.usage}</p>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="data-table data-table--inputs">
                    <thead>
                      <tr>
                        {selectedChart.headers.map((header, index) => (
                          <th key={`${selectedChart.id}-header-${index + 1}`}>
                            <label className="search-page-label" style={{ gap: '0.4rem' }}>
                              <span>{index === 0 ? 'Header label' : `Column ${index + 1}`}</span>
                              <input
                                className="search-page-input"
                                value={header}
                                onChange={(event) => updateHeaderCell(index, event.target.value)}
                              />
                            </label>
                          </th>
                        ))}
                        <th>Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChart.rows.map((row, rowIndex) => (
                        <tr key={`${selectedChart.id}-row-${rowIndex + 1}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${selectedChart.id}-row-${rowIndex + 1}-cell-${cellIndex + 1}`}>
                              <textarea
                                className="search-page-input"
                                value={cell}
                                onChange={(event) => updateRowCell(rowIndex, cellIndex, event.target.value)}
                                rows={cellIndex === 0 ? 3 : 2}
                              />
                            </td>
                          ))}
                          <td>
                            <button type="button" className="action-btn action-btn-outline" onClick={() => removeRow(rowIndex)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-testimonials-filter-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="action-btn action-btn-outline" onClick={addRow}>
                    Add row
                  </button>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.85rem' }}>Preview</h4>
                  <InfoTableSheet
                    headers={selectedChart.headers}
                    rows={selectedChart.rows}
                    valueAlignment={selectedChart.valueAlignment}
                  />
                </div>
              </>
            ) : (
              <p className="blank-state-note">Select a chart to edit.</p>
            )}
          </div>
        </section>
      </PageShell>
    </div>
  );
}
