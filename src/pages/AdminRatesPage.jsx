import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SafeRichText from '../components/SafeRichText';
import { pageByPath } from '../data/siteMap';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { useRates } from '../context/RatesContext';
import { buildDynamicLegalCopyFromBlock } from '../lib/dynamicPageBlocks';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../lib/ratesLegalCopyDefaults';
import { parseRatesPdf } from '../utils/ratesPdfImport';

export default function AdminRatesPage() {
  const {
    rates,
    iraRates,
    ratesMeta,
    legalCopy,
    setRates,
    setIraRates,
    setRatesMeta,
    setLegalCopy,
  } = useRates();
  const [draft, setDraft] = useState({ rates, iraRates, ratesMeta, legalCopy });
  const [importReport, setImportReport] = useState(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [importError, setImportError] = useState('');

  const hasChanges = useMemo(
    () => (
      JSON.stringify(draft.rates) !== JSON.stringify(rates)
      || JSON.stringify(draft.iraRates) !== JSON.stringify(iraRates)
      || JSON.stringify(draft.ratesMeta) !== JSON.stringify(ratesMeta)
      || JSON.stringify(draft.legalCopy) !== JSON.stringify(legalCopy)
    ),
    [draft, rates, iraRates, ratesMeta, legalCopy],
  );

  const disclosurePreview = useMemo(
    () => buildDynamicLegalCopyFromBlock(
      {
        id: 'disclaimer',
        kind: 'legal_copy',
        mode: 'dynamic',
        settings: draft.legalCopy,
      },
      {
        certificatesEffectiveDate: draft.ratesMeta?.certificatesEffectiveDate,
        iraEffectiveDate: draft.ratesMeta?.iraEffectiveDate,
      },
    ),
    [
      draft.legalCopy,
      draft.ratesMeta?.certificatesEffectiveDate,
      draft.ratesMeta?.iraEffectiveDate,
    ],
  );

  const certificateRowTotal = draft.rates.length;
  const iraRowTotal = draft.iraRates.length;
  const mbaMatched = Boolean(importReport?.retirement403bMbaRate && importReport?.retirement403bMbaApy);

  async function handleRatesPdfSelected(file) {
    if (!file) {
      return;
    }

    setIsParsingPdf(true);
    setImportError('');

    try {
      const report = await parseRatesPdf(file, draft);
      setImportReport(report);
    } catch (error) {
      console.error(error);
      setImportError(error?.message || 'Failed to parse PDF.');
    } finally {
      setIsParsingPdf(false);
    }
  }

  function applyImportReport() {
    if (!importReport) {
      return;
    }

    setDraft((current) => {
      const nextRates = current.rates.map((row) => {
        const match = importReport.certificates.find((item) => item.matchedId === row.id);
        return match
          ? {
              ...row,
              standardRate: match.standardRate ?? row.standardRate,
              standardApy: match.standardApy ?? row.standardApy,
              premiumRate: match.premiumRate ?? row.premiumRate,
              premiumApy: match.premiumApy ?? row.premiumApy,
            }
          : row;
      });

      const nextIraRates = current.iraRates.map((row) => {
        const match = importReport.ira.find((item) => item.matchedId === row.id);
        return match
          ? {
              ...row,
              rate: match.rate ?? row.rate,
              apy: match.apy ?? row.apy,
            }
          : row;
      });

      const nextMeta = { ...current.ratesMeta };
      if (importReport.effectiveDate) {
        nextMeta.certificatesEffectiveDate = importReport.effectiveDate;
        nextMeta.iraEffectiveDate = importReport.effectiveDate;
      }
      if (importReport.retirement403bMbaRate) {
        nextMeta.retirement403bMbaRate = importReport.retirement403bMbaRate;
      }
      if (importReport.retirement403bMbaApy) {
        nextMeta.retirement403bMbaApy = importReport.retirement403bMbaApy;
      }

      return {
        ...current,
        rates: nextRates,
        iraRates: nextIraRates,
        ratesMeta: nextMeta,
      };
    });
  }

  function updateCertificateCell(id, key, value) {
    setDraft((current) => ({
      ...current,
      rates: current.rates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function updateIraCell(id, key, value) {
    setDraft((current) => ({
      ...current,
      iraRates: current.iraRates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function saveChanges() {
    setRates(draft.rates);
    setIraRates(draft.iraRates);
    setRatesMeta(draft.ratesMeta);
    setLegalCopy(draft.legalCopy);
  }

  function resetChanges() {
    setDraft({ rates, iraRates, ratesMeta, legalCopy });
    setImportReport(null);
    setImportError('');
  }

  function resetDefaults() {
    const next = {
      rates: defaultRates,
      iraRates: defaultIraRates,
      ratesMeta: defaultRatesMeta,
      legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
    };
    setDraft(next);
    setImportReport(null);
    setImportError('');
    setRates(defaultRates);
    setIraRates(defaultIraRates);
    setRatesMeta(defaultRatesMeta);
    setLegalCopy(DEFAULT_RATES_LEGAL_COPY_SETTINGS);
  }

  function updateMeta(key, value) {
    setDraft((current) => ({
      ...current,
      ratesMeta: {
        ...current.ratesMeta,
        [key]: value,
      },
    }));
  }

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Rates" source={pageByPath['/rates'].source} showBadge={false}>
        <div className="admin-info-note">
          Edit the public rate tables and effective dates here. Public disclosure copy is now centralized in the disclosures manager.
        </div>

        <section className="admin-rates-chart-panel">
          <div className="admin-rates-chart-header">
            <div>
              <h3>Import Rates PDF</h3>
              <p>
                Upload the internal rates PDF. The importer will match rows by product name, fill the draft fields, and let you review before saving.
              </p>
            </div>
            <label className="action-btn action-btn-outline admin-rates-import-trigger">
              {isParsingPdf ? 'Parsing…' : 'Choose PDF'}
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => handleRatesPdfSelected(event.target.files?.[0])}
                disabled={isParsingPdf}
              />
            </label>
          </div>

          {importError ? <p className="admin-rates-import-error">{importError}</p> : null}

          {importReport ? (
            <div className="admin-rates-import-report">
              <div className="admin-rates-import-stats">
                <div className="admin-rates-import-stat">
                  <strong>Effective date</strong>
                  <span>{importReport.effectiveDate || 'Not found'}</span>
                </div>
                <div className="admin-rates-import-stat">
                  <strong>Certificates matched</strong>
                  <span>{importReport.certificates.length}/{certificateRowTotal}</span>
                </div>
                <div className="admin-rates-import-stat">
                  <strong>IRA matched</strong>
                  <span>{importReport.ira.length}/{iraRowTotal}</span>
                </div>
                <div className="admin-rates-import-stat">
                  <strong>403(b) MBA matched</strong>
                  <span>{mbaMatched ? '1/1' : '0/1'}</span>
                </div>
                <div className="admin-rates-import-stat">
                  <strong>Warnings</strong>
                  <span>{importReport.warnings.length}</span>
                </div>
                <div className="admin-rates-import-stat">
                  <strong>Ignored rows</strong>
                  <span>{importReport.unmatchedPdfRows.length}</span>
                </div>
              </div>

              {importReport.warnings.length ? (
                <ul className="admin-rates-import-list">
                  {importReport.warnings.map((warning, index) => (
                    <li key={`warning-${index + 1}`}>{warning}</li>
                  ))}
                </ul>
              ) : null}

              {(importReport.unmatchedPdfRows.length || importReport.missingCertificateRows.length || importReport.missingIraRows.length) ? (
                <details className="admin-rates-import-details">
                  <summary>More</summary>
                  <div className="admin-rates-import-details-body">
                    {importReport.unmatchedPdfRows.length ? (
                      <div>
                        <strong>Ignored / not mapped rows (sample):</strong>
                        <ul className="admin-rates-import-list">
                          {importReport.unmatchedPdfRows.slice(0, 10).map((row, index) => (
                            <li key={`${row.section}-${row.label}-${index + 1}`}>
                              [{row.section}] {row.label || '(no label)'} - {(row.values || []).join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {importReport.missingCertificateRows.length ? (
                      <div><strong>Missing certificate rows:</strong> {importReport.missingCertificateRows.join(' | ')}</div>
                    ) : null}
                    {importReport.missingIraRows.length ? (
                      <div><strong>Missing IRA rows:</strong> {importReport.missingIraRows.join(' | ')}</div>
                    ) : null}
                  </div>
                </details>
              ) : null}

              <div>
                <button type="button" className="action-btn action-btn-primary" onClick={applyImportReport}>
                  Apply Parsed Values to Draft
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-rates-chart-panel">
          <div className="admin-rates-chart-header">
            <div>
              <h3>AGFinancial Investment Certificates Rates</h3>
              <p>Edit product names, standard rates, and premium rates shown on the public rates page.</p>
            </div>
            <div className="admin-rates-chart-tags">
              <span>{draft.ratesMeta?.certificatesEffectiveDate || 'No effective date'}</span>
              <span>{certificateRowTotal} rows</span>
            </div>
          </div>
          <div className="table-scroll admin-rates-chart-table-shell">
            <table className="data-table data-table--inputs data-table--fixed admin-rates-chart-table admin-rates-chart-table--certificates">
              <thead>
                <tr>
                  <th>Investment Type</th>
                  <th>Standard Rate</th>
                  <th>Standard APY*</th>
                  <th>Premium Rate**</th>
                  <th>Premium APY*</th>
                </tr>
              </thead>
              <tbody>
                {draft.rates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input value={row.product} onChange={(event) => updateCertificateCell(row.id, 'product', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.standardRate} onChange={(event) => updateCertificateCell(row.id, 'standardRate', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.standardApy} onChange={(event) => updateCertificateCell(row.id, 'standardApy', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.premiumRate} onChange={(event) => updateCertificateCell(row.id, 'premiumRate', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.premiumApy} onChange={(event) => updateCertificateCell(row.id, 'premiumApy', event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-rates-chart-panel">
          <div className="admin-rates-chart-header">
            <div>
              <h3>IRA Investment Rates</h3>
              <p>Edit IRA product names, rates, and APY values shown on the public rates page.</p>
            </div>
            <div className="admin-rates-chart-tags">
              <span>{draft.ratesMeta?.iraEffectiveDate || 'No effective date'}</span>
              <span>{iraRowTotal} rows</span>
            </div>
          </div>
          <div className="table-scroll admin-rates-chart-table-shell">
            <table className="data-table data-table--inputs data-table--fixed admin-rates-chart-table admin-rates-chart-table--ira">
              <thead>
                <tr>
                  <th>Investment Type</th>
                  <th>Rate</th>
                  <th>APY*</th>
                </tr>
              </thead>
              <tbody>
                {draft.iraRates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input value={row.product} onChange={(event) => updateIraCell(row.id, 'product', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.rate} onChange={(event) => updateIraCell(row.id, 'rate', event.target.value)} />
                    </td>
                    <td>
                      <input value={row.apy} onChange={(event) => updateIraCell(row.id, 'apy', event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-rates-lower-grid">
          <section className="admin-rates-section-card">
            <div className="admin-rates-chart-header">
              <div>
                <h3>Disclaimer Dates</h3>
                <p>Set the effective dates injected into the shared certificates and IRA disclosure copy.</p>
              </div>
            </div>
            <div className="admin-content-field-list admin-rates-wide-fields">
              <label className="is-half">
                <span>Certificates effective date</span>
                <input
                  value={draft.ratesMeta?.certificatesEffectiveDate || ''}
                  onChange={(event) => updateMeta('certificatesEffectiveDate', event.target.value)}
                />
              </label>
              <label className="is-half">
                <span>IRA effective date</span>
                <input
                  value={draft.ratesMeta?.iraEffectiveDate || ''}
                  onChange={(event) => updateMeta('iraEffectiveDate', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="admin-rates-section-card">
            <div className="admin-rates-chart-header">
              <div>
                <h3>403(b) Investment Rate (MBA Fixed Income Fund)</h3>
                <p>Manage the MBA Fixed Income Fund rate values used on the retirement route.</p>
              </div>
            </div>
            <div className="admin-content-field-list admin-rates-wide-fields">
              <label className="is-half">
                <span>Rate</span>
                <input
                  value={draft.ratesMeta?.retirement403bMbaRate || ''}
                  onChange={(event) => updateMeta('retirement403bMbaRate', event.target.value)}
                />
              </label>
              <label className="is-half">
                <span>APY*</span>
                <input
                  value={draft.ratesMeta?.retirement403bMbaApy || ''}
                  onChange={(event) => updateMeta('retirement403bMbaApy', event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="admin-rates-chart-panel">
          <div className="admin-rates-chart-header">
            <div>
              <h3>Disclosure Copy</h3>
              <p>Review the shared disclosure output generated for the certificates and IRA rate tables.</p>
            </div>
          </div>
          <div className="admin-info-note admin-rates-disclosure-note">
            Manage all site disclosures from one place.
            {' '}
            <Link to="/admin/disclosures">Open disclosure manager</Link>
            .
          </div>
          <div className="admin-content-field-list admin-rates-wide-fields admin-rates-disclosure-grid">
            <div className="admin-rates-disclosure-panel">
              <div className="admin-rates-disclosure-panel-head">
                <span>Certificates disclosure preview</span>
              </div>
              <div className="admin-rates-disclosure-preview">
                <SafeRichText
                  as="div"
                  html={disclosurePreview?.certificatesHtml || ''}
                  className="rates-disclaimer"
                />
              </div>
            </div>
            <div className="admin-rates-disclosure-panel">
              <div className="admin-rates-disclosure-panel-head">
                <span>IRA disclosure preview</span>
              </div>
              <div className="admin-rates-disclosure-preview">
                <SafeRichText
                  as="div"
                  html={disclosurePreview?.iraHtml || ''}
                  className="rates-disclaimer"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="admin-actions">
          <button type="button" onClick={saveChanges} disabled={!hasChanges} className="action-btn action-btn-primary">Save</button>
          <button type="button" onClick={resetChanges} disabled={!hasChanges} className="action-btn action-btn-outline">Discard</button>
          <button type="button" onClick={resetDefaults} className="action-btn action-btn-danger">Reset Defaults</button>
        </div>
      </PageShell>
    </div>
  );
}
