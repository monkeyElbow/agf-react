import './InfoTableSheet.css';

function normalizeHeaders(headers = []) {
  return Array.isArray(headers)
    ? headers.map((header) => String(header || '').trim()).filter(Boolean)
    : [];
}

function normalizeRows(rows = [], columnCount = 0) {
  return Array.isArray(rows)
    ? rows
      .map((row) => (Array.isArray(row) ? row.map((cell) => String(cell || '')) : []))
      .filter((row) => row.length >= Math.max(2, columnCount || 2))
    : [];
}

const INFO_TABLE_TONES = new Set(['atlantean', 'mango', 'melon', 'sandstone', 'super-grey']);

function normalizeColumnTones(columnTones = [], columnCount = 0) {
  const values = Array.isArray(columnTones) ? columnTones : [];
  return Array.from({ length: columnCount }, (_, index) => {
    const token = String(values[index] || '').trim().toLowerCase();
    return INFO_TABLE_TONES.has(token) ? token : '';
  });
}

function renderCellContent(cell, renderList = false) {
  const lines = String(cell || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!renderList || !lines.length) {
    return lines.join('\n');
  }

  return (
    <ul className="info-table-sheet__cell-list">
      {lines.map((line) => <li key={line}>{line}</li>)}
    </ul>
  );
}

export default function InfoTableSheet({
  headers = [],
  rows = [],
  className = '',
  valueAlignment = 'left',
  firstColumnHeader = true,
  columnTones = [],
}) {
  const normalizedHeaders = normalizeHeaders(headers);
  const normalizedRows = normalizeRows(rows, normalizedHeaders.length);
  const useFirstColumnHeader = firstColumnHeader !== false;
  const metricHeaders = useFirstColumnHeader ? normalizedHeaders.slice(1) : normalizedHeaders;
  const normalizedColumnTones = normalizeColumnTones(columnTones, normalizedHeaders.length);
  const compactMobileGrid = metricHeaders.length <= 2;

  if (normalizedHeaders.length < 2 || !normalizedRows.length) {
    return null;
  }

  return (
    <div
      className={`info-table-sheet${className ? ` ${className}` : ''}`.trim()}
      data-info-table-layout="table-and-cards"
      data-info-table-align={valueAlignment === 'right' ? 'right' : 'left'}
      data-info-table-first-column-header={useFirstColumnHeader ? 'true' : 'false'}
    >
      <div className="info-table-sheet__desktop">
        <div className="info-table-sheet__desktop-shell">
          <table className="info-table-sheet__table">
            <thead>
              <tr>
                {normalizedHeaders.map((header, index) => (
                  <th key={`${header}-${index + 1}`} scope="col" className={normalizedColumnTones[index] ? `is-tone-${normalizedColumnTones[index]}` : undefined}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalizedRows.map((row, rowIndex) => (
                <tr key={`${row[0]}-${rowIndex + 1}`}>
                  {useFirstColumnHeader ? (
                    <>
                      <th scope="row">{row[0]}</th>
                      {row.slice(1).map((cell, cellIndex) => (
                        <td key={`${row[0]}-${metricHeaders[cellIndex]}-${cellIndex + 1}`}>
                          {renderCellContent(cell)}
                        </td>
                      ))}
                    </>
                  ) : row.map((cell, cellIndex) => (
                    <td key={`${rowIndex + 1}-${metricHeaders[cellIndex]}-${cellIndex + 1}`} className={normalizedColumnTones[cellIndex] ? `is-tone-${normalizedColumnTones[cellIndex]}` : undefined}>
                      {renderCellContent(cell, true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="info-table-sheet__mobile">
        {normalizedRows.map((row, rowIndex) => (
          <article
            key={`mobile-${row[0]}-${rowIndex + 1}`}
            className="info-table-sheet__card"
          >
            {useFirstColumnHeader ? (
              <header className="info-table-sheet__card-header">
                <h3>{row[0]}</h3>
              </header>
            ) : null}
            <div className={`info-table-sheet__card-grid${compactMobileGrid ? ' is-compact' : ''}`}>
              {(useFirstColumnHeader ? row.slice(1) : row).map((cell, cellIndex) => (
                <div
                  key={`${row[0]}-mobile-${metricHeaders[cellIndex]}-${cellIndex + 1}`}
                  className="info-table-sheet__card-cell"
                  data-info-table-column-tone={normalizedColumnTones[useFirstColumnHeader ? cellIndex + 1 : cellIndex] || undefined}
                >
                  <span className="info-table-sheet__card-label">{metricHeaders[cellIndex]}</span>
                  <div className="info-table-sheet__card-value">
                    {renderCellContent(cell, !useFirstColumnHeader)}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
