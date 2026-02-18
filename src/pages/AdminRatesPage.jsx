import { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { useRates } from '../context/RatesContext';

export default function AdminRatesPage() {
  const { rates, iraRates, ratesMeta, setRates, setIraRates, setRatesMeta } = useRates();
  const [draft, setDraft] = useState({ rates, iraRates, ratesMeta });

  const hasChanges = useMemo(
    () => (
      JSON.stringify(draft.rates) !== JSON.stringify(rates)
      || JSON.stringify(draft.iraRates) !== JSON.stringify(iraRates)
      || JSON.stringify(draft.ratesMeta) !== JSON.stringify(ratesMeta)
    ),
    [draft, rates, iraRates, ratesMeta],
  );

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
    <div className="wp-page-wrap">
      <PageShell title="Admin: Rates" source={pageByPath['/rates'].source}>
        <div className="admin-info-note">
          Edit both public rate tables here. Changes update the Rates page and the Investments rates section.
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

        <div className="admin-actions">
          <button type="button" onClick={saveChanges} disabled={!hasChanges} className="action-btn action-btn-primary">Save</button>
          <button type="button" onClick={resetChanges} disabled={!hasChanges} className="action-btn action-btn-outline">Discard</button>
          <button type="button" onClick={resetDefaults} className="action-btn action-btn-danger">Reset Defaults</button>
        </div>
      </PageShell>
    </div>
  );
}
