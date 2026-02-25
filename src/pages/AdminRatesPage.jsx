import { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { useRates } from '../context/RatesContext';
import { parseRatesPdf } from '../utils/ratesPdfImport';

export default function AdminRatesPage() {
  const { rates, iraRates, ratesMeta, setRates, setIraRates, setRatesMeta } = useRates();
  const [draft, setDraft] = useState({ rates, iraRates, ratesMeta });

    // PDF import
    const [importReport, setImportReport] = useState(null);
    const [isParsingPdf, setIsParsingPdf] = useState(false);
    const [importError, setImportError] = useState('');
  
    async function handleRatesPdfSelected(file) {
      if (!file) return;
      setIsParsingPdf(true);
      setImportError('');
    
      try {
        const report = await parseRatesPdf(file, draft);
        setImportReport(report); // preview only
      } catch (err) {
        console.error(err);
        setImportError(err?.message || 'Failed to parse PDF.');
      } finally {
        setIsParsingPdf(false);
      }
    }
  
    function applyImportReport() {
      if (!importReport) return;
  
      setDraft((curr) => {
        const nextRates = curr.rates.map((row) => {
          const match = importReport.certificates.find((r) => r.matchedId === row.id);
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
  
        const nextIraRates = curr.iraRates.map((row) => {
          const match = importReport.ira.find((r) => r.matchedId === row.id);
          return match
            ? {
                ...row,
                rate: match.rate ?? row.rate,
                apy: match.apy ?? row.apy,
              }
            : row;
        });
  
        const nextMeta = { ...curr.ratesMeta };
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
          ...curr,
          rates: nextRates,
          iraRates: nextIraRates,
          ratesMeta: nextMeta,
        };
      });
    }
  
    // -----

  const hasChanges = useMemo(
    () => (
      JSON.stringify(draft.rates) !== JSON.stringify(rates)
      || JSON.stringify(draft.iraRates) !== JSON.stringify(iraRates)
      || JSON.stringify(draft.ratesMeta) !== JSON.stringify(ratesMeta)
    ),
    [draft, rates, iraRates, ratesMeta],
  );

  const certificateRowTotal = draft.rates.length;
  const iraRowTotal = draft.iraRates.length;

  function updateCertificateCell(id, key, value) {
    setDraft((curr) => ({
      ...curr,
      rates: curr.rates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function updateIraCell(id, key, value) {
    setDraft((curr) => ({
      ...curr,
      iraRates: curr.iraRates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function saveChanges() {
    setRates(draft.rates);
    setIraRates(draft.iraRates);
    setRatesMeta(draft.ratesMeta);
  }

  function resetChanges() {
    setDraft({ rates, iraRates, ratesMeta });
  }

  function resetDefaults() {
    const next = { rates: defaultRates, iraRates: defaultIraRates, ratesMeta: defaultRatesMeta };
    setDraft(next);
    setRates(defaultRates);
    setIraRates(defaultIraRates);
    setRatesMeta(defaultRatesMeta);
  }

  function updateMeta(key, value) {
    setDraft((curr) => ({
      ...curr,
      ratesMeta: {
        ...curr.ratesMeta,
        [key]: value,
      },
    }));
  }

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Rates" source={pageByPath['/rates'].source} showBadge={false}>
        <div className="admin-info-note">
          Edit both public rate tables here. Changes update the Rates page and the Investments rates section.
        </div>
        <div className="admin-import-panel" style={{ marginBottom: '1rem' }}>
  <h3>Import Rates PDF</h3>
  <p style={{ marginTop: 0 }}>
    Upload the internal rates PDF. The importer will match rows by product name (not order), fill the draft fields,
    and let you review before saving.
  </p>

  <label className="action-btn action-btn-outline" style={{ display: 'inline-block', cursor: 'pointer' }}>
    {isParsingPdf ? 'Parsing…' : 'Choose PDF'}
    <input
      type="file"
      accept="application/pdf"
      style={{ display: 'none' }}
      onChange={(e) => handleRatesPdfSelected(e.target.files?.[0])}
      disabled={isParsingPdf}
    />
  </label>

  {importError ? (
    <div style={{ marginTop: '.75rem', color: '#b00020' }}>{importError}</div>
  ) : null}

  {importReport ? (
    <div style={{ marginTop: '.75rem', border: '1px solid #ddd', padding: '.75rem', borderRadius: 8 }}>
      <div><strong>Effective date:</strong> {importReport.effectiveDate || 'Not found'}</div>
      <div><strong>Certificates matched:</strong> {importReport.certificates.length}/{certificateRowTotal}</div>
      <div><strong>IRA matched:</strong> {importReport.ira.length}/{iraRowTotal}</div>
      <div><strong>403(b) MBA Income Fund matched:</strong> {importReport.retirement403bMbaRate && importReport.retirement403bMbaApy ? '1/1' : '0/1'}</div>
      <div><strong>Warnings:</strong> {importReport.warnings.length}</div>
      <div><strong>Ignored / not mapped rows:</strong> {importReport.unmatchedPdfRows.length}</div>

      {!!importReport.warnings.length && (
        <ul style={{ marginTop: '.5rem' }}>
          {importReport.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}

      {(importReport.unmatchedPdfRows.length || importReport.missingCertificateRows.length || importReport.missingIraRows.length) ? (
        <details style={{ marginTop: '.75rem' }}>
          <summary style={{ cursor: 'pointer', color: '#0b6f8a', fontWeight: 700 }}>
            More
          </summary>
          <div style={{ marginTop: '.5rem' }}>
            {importReport.unmatchedPdfRows.length ? (
              <div>
                <strong>Ignored / not mapped rows (sample):</strong>
                <ul>
                  {importReport.unmatchedPdfRows.slice(0, 10).map((r, i) => (
                    <li key={i}>
                      [{r.section}] {r.label || '(no label)'} — {(r.values || []).join(', ')}
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

      <div style={{ marginTop: '.75rem' }}>
        <button type="button" className="action-btn action-btn-primary" onClick={applyImportReport}>
          Apply Parsed Values to Draft
        </button>
      </div>
    </div>
  ) : null}
</div>
        <h3>AGFinancial Investment Certificates Rates</h3>
        <div className="table-scroll">
          <table className="ag-table ag-table-inputs has-fixed-layout">
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
                  <input value={row.product} onChange={(e) => updateCertificateCell(row.id, 'product', e.target.value)} />
                </td>
                <td>
                  <input value={row.standardRate} onChange={(e) => updateCertificateCell(row.id, 'standardRate', e.target.value)} />
                </td>
                <td>
                  <input value={row.standardApy} onChange={(e) => updateCertificateCell(row.id, 'standardApy', e.target.value)} />
                </td>
                <td>
                  <input value={row.premiumRate} onChange={(e) => updateCertificateCell(row.id, 'premiumRate', e.target.value)} />
                </td>
                <td>
                  <input value={row.premiumApy} onChange={(e) => updateCertificateCell(row.id, 'premiumApy', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: '1.2rem' }}>IRA Investment Rates</h3>
        <div className="table-scroll">
          <table className="ag-table ag-table-inputs has-fixed-layout">
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
                  <input value={row.product} onChange={(e) => updateIraCell(row.id, 'product', e.target.value)} />
                </td>
                <td>
                  <input value={row.rate} onChange={(e) => updateIraCell(row.id, 'rate', e.target.value)} />
                </td>
                <td>
                  <input value={row.apy} onChange={(e) => updateIraCell(row.id, 'apy', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: '1.2rem' }}>Disclaimer Dates</h3>
        <div className="admin-content-field-list">
          <label>
            <span>Certificates effective date</span>
            <input
              value={draft.ratesMeta?.certificatesEffectiveDate || ''}
              onChange={(e) => updateMeta('certificatesEffectiveDate', e.target.value)}
            />
          </label>
          <label>
            <span>IRA effective date</span>
            <input
              value={draft.ratesMeta?.iraEffectiveDate || ''}
              onChange={(e) => updateMeta('iraEffectiveDate', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ marginTop: '1.2rem' }}>403(b) Investment Rate (MBA Fixed Income Fund - Select 403(b))</h3>
        <div className="admin-content-field-list">
          <label>
            <span>Rate</span>
            <input
              value={draft.ratesMeta?.retirement403bMbaRate || ''}
              onChange={(e) => updateMeta('retirement403bMbaRate', e.target.value)}
            />
          </label>
          <label>
            <span>APY*</span>
            <input
              value={draft.ratesMeta?.retirement403bMbaApy || ''}
              onChange={(e) => updateMeta('retirement403bMbaApy', e.target.value)}
            />
          </label>
        </div>

        <div className="admin-actions">
          <button type="button" onClick={saveChanges} disabled={!hasChanges} className="action-btn action-btn-primary">Save</button>
          <button type="button" onClick={resetChanges} disabled={!hasChanges} className="action-btn action-btn-outline">Discard</button>
          <button type="button" onClick={resetDefaults} className="action-btn action-btn-danger">Reset Defaults</button>
        </div>
      </PageShell>
    </div>
  );
}
