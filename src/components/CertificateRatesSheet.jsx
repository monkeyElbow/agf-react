import { useState } from 'react';
import './CertificateRatesSheet.css';
import { formatRateProductLabel } from './ratesSheetFormat';

function isRateUnavailable(value) {
  return String(value || '').trim().toUpperCase() === 'N/A';
}

function renderValue(value, className = '') {
  const unavailable = isRateUnavailable(value);
  return (
    <span className={`certificate-rates-sheet__value${className ? ` ${className}` : ''}${unavailable ? ' is-unavailable' : ''}`}>
      {value}
    </span>
  );
}

export default function CertificateRatesSheet({ rates = [], className = '' }) {
  const [mobileMetric, setMobileMetric] = useState('apy');
  const normalizedRates = Array.isArray(rates)
    ? rates.map((row) => ({
      ...row,
      displayProduct: formatRateProductLabel(row?.product),
    }))
    : [];

  const isApyMode = mobileMetric === 'apy';

  return (
    <div className={`certificate-rates-sheet${className ? ` ${className}` : ''}`.trim()} data-rates-layout="bands-and-cards">
      <div className="certificate-rates-sheet__desktop" data-rates-desktop="bands">
        <section className="certificate-rates-sheet__band certificate-rates-sheet__band--standard" aria-labelledby="certificate-rates-standard-heading">
          <div className="certificate-rates-sheet__band-chrome">
            <h3 id="certificate-rates-standard-heading" className="certificate-rates-sheet__band-title">Standard</h3>
          </div>
          <table className="certificate-rates-sheet__table certificate-rates-sheet__table--standard">
            <thead>
              <tr>
                <th scope="col">Investment Type</th>
                <th scope="col">Rate</th>
                <th scope="col">APY*</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRates.map((row) => (
                <tr key={`standard-${row.id}`}>
                  <th scope="row">{row.displayProduct}</th>
                  <td>{renderValue(row.standardRate, 'is-rate')}</td>
                  <td>{renderValue(row.standardApy, 'is-apy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="certificate-rates-sheet__band certificate-rates-sheet__band--premium" aria-labelledby="certificate-rates-premium-heading">
          <div className="certificate-rates-sheet__band-chrome">
            <h3 id="certificate-rates-premium-heading" className="certificate-rates-sheet__band-title">Premium*</h3>
          </div>
          <table className="certificate-rates-sheet__table certificate-rates-sheet__table--premium">
            <thead>
              <tr>
                <th scope="col">Rate</th>
                <th scope="col">APY*</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRates.map((row) => (
                <tr key={`premium-${row.id}`}>
                  <td>{renderValue(row.premiumRate, 'is-rate')}</td>
                  <td>{renderValue(row.premiumApy, 'is-apy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="certificate-rates-sheet__mobile" data-rates-mobile="term-cards">
        <div className="certificate-rates-sheet__mobile-toolbar">
          <div className="certificate-rates-sheet__mobile-toggle" role="group" aria-label="Display certificate values as APY or rate">
            <button
              type="button"
              className={`certificate-rates-sheet__mobile-toggle-button${isApyMode ? ' is-active' : ''}`}
              aria-pressed={isApyMode}
              onClick={() => setMobileMetric('apy')}
            >
              APY*
            </button>
            <button
              type="button"
              className={`certificate-rates-sheet__mobile-toggle-button${!isApyMode ? ' is-active' : ''}`}
              aria-pressed={!isApyMode}
              onClick={() => setMobileMetric('rate')}
            >
              Rate
            </button>
          </div>
        </div>
        {normalizedRates.map((row) => (
          <article key={`mobile-${row.id}`} className="certificate-rates-sheet__term-card">
            <header className="certificate-rates-sheet__term-header">
              <h3>{row.displayProduct}</h3>
            </header>
            <div className="certificate-rates-sheet__term-compare">
              <section className="certificate-rates-sheet__term-side certificate-rates-sheet__term-side--standard" aria-label={`${row.displayProduct} Standard rates`}>
                <p className="certificate-rates-sheet__term-side-label">Standard</p>
                <div className="certificate-rates-sheet__term-metric">
                  <span className="certificate-rates-sheet__term-metric-label">{isApyMode ? 'APY*' : 'Rate'}</span>
                  {renderValue(isApyMode ? row.standardApy : row.standardRate, isApyMode ? 'is-apy' : 'is-rate is-mobile-rate')}
                </div>
              </section>

              <section className="certificate-rates-sheet__term-side certificate-rates-sheet__term-side--premium" aria-label={`${row.displayProduct} Premium rates`}>
                <p className="certificate-rates-sheet__term-side-label">Premium*</p>
                <div className="certificate-rates-sheet__term-metric">
                  <span className="certificate-rates-sheet__term-metric-label">{isApyMode ? 'APY*' : 'Rate'}</span>
                  {renderValue(isApyMode ? row.premiumApy : row.premiumRate, isApyMode ? 'is-apy' : 'is-rate is-mobile-rate')}
                </div>
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
