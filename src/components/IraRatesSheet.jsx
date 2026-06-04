import './IraRatesSheet.css';
import { formatRateProductLabel } from './ratesSheetFormat';

export default function IraRatesSheet({ rates = [], className = '' }) {
  const normalizedRates = Array.isArray(rates)
    ? rates.map((row) => ({
      ...row,
      displayProduct: formatRateProductLabel(row?.product),
    }))
    : [];

  return (
    <div className={`ira-rates-sheet${className ? ` ${className}` : ''}`.trim()} data-ira-rates-layout="table-and-cards">
      <div className="ira-rates-sheet__desktop" data-ira-rates-desktop="table">
        <div className="ira-rates-sheet__desktop-shell">
          <table className="ira-rates-sheet__table">
            <thead>
              <tr>
                <th scope="col">Investment Type</th>
                <th scope="col">Rate</th>
                <th scope="col">APY*</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRates.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.displayProduct}</th>
                  <td>{row.rate}</td>
                  <td className="is-apy">{row.apy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ira-rates-sheet__mobile" data-ira-rates-mobile="cards">
        {normalizedRates.map((row) => (
          <article key={`mobile-${row.id}`} className="ira-rates-sheet__card">
            <header className="ira-rates-sheet__card-header">
              <h3>{row.displayProduct}</h3>
            </header>
            <div className="ira-rates-sheet__card-grid">
              <div className="ira-rates-sheet__card-cell ira-rates-sheet__card-cell--rate">
                <span className="ira-rates-sheet__card-label">Rate</span>
                <span className="ira-rates-sheet__card-value">{row.rate}</span>
              </div>
              <div className="ira-rates-sheet__card-cell ira-rates-sheet__card-cell--apy">
                <span className="ira-rates-sheet__card-label">APY*</span>
                <span className="ira-rates-sheet__card-value is-apy">{row.apy}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
