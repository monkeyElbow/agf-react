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

export default function InfoTableSheet({
  headers = [],
  rows = [],
  className = '',
  valueAlignment = 'left',
  firstColumnHeader = true,
}) {
  const normalizedHeaders = normalizeHeaders(headers);
  const normalizedRows = normalizeRows(rows, normalizedHeaders.length);
  const useFirstColumnHeader = firstColumnHeader !== false;
  const metricHeaders = useFirstColumnHeader ? normalizedHeaders.slice(1) : normalizedHeaders;
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
                  <th key={`${header}-${index + 1}`} scope="col">{header}</th>
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
                        <td key={`${row[0]}-${metricHeaders[cellIndex]}-${cellIndex + 1}`}>{cell}</td>
                      ))}
                    </>
                  ) : row.map((cell, cellIndex) => (
                    <td key={`${rowIndex + 1}-${metricHeaders[cellIndex]}-${cellIndex + 1}`}>{cell}</td>
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
                >
                  <span className="info-table-sheet__card-label">{metricHeaders[cellIndex]}</span>
                  <span className="info-table-sheet__card-value">{cell}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
