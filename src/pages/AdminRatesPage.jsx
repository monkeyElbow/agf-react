import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SafeRichText from '../components/SafeRichText';
import { pageByPath } from '../data/siteMap';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { useRates } from '../context/RatesContext';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { buildDynamicLegalCopyFromBlock } from '../lib/dynamicPageBlocks';
import {
  CERTIFICATES_RATES_BLOCK_ID,
  IRA_RATES_BLOCK_ID,
  RATES_CONTENT_PATH,
  buildRatesBlockSettingsPatch,
} from '../lib/ratesBlockData';
import { RUNTIME_BUILD_ID } from '../lib/runtimeBuild';
import { parseRatesPdf, resolveRatesPdfWorkerUrl } from '../utils/ratesPdfImport';

const PDF_IMPORT_STAGE_LABELS = {
  FILE_SELECTED: 'Preparing selected file…',
  FILE_ARRAY_BUFFER_STARTED: 'Reading selected file…',
  FILE_ARRAY_BUFFER_COMPLETE: 'File read. Starting PDF engine…',
  PDFJS_GET_DOCUMENT_STARTED: 'Starting PDF engine…',
  PDFJS_DOCUMENT_LOADED: 'PDF loaded. Extracting text…',
  PAGE_EXTRACTION_STARTED: 'Extracting PDF page text…',
  PAGE_EXTRACTION_COMPLETE: 'Page text extracted…',
  ROW_NORMALIZATION_STARTED: 'Matching PDF rows…',
  IMPORT_COMPLETE: 'Import complete.',
  IMPORT_TIMEOUT: 'PDF import timed out.',
  IMPORT_FAILED: 'PDF import failed.',
};

function formatAdminUpdatedTimestamp(entry) {
  const timestamp = Number(entry?.createdAt) || 0;
  if (!timestamp) {
    return 'Not yet saved';
  }
  const savedBy = String(entry?.actor?.displayName || '').trim();
  const formatted = new Date(timestamp).toLocaleString();
  return savedBy ? `${formatted} by ${savedBy}` : formatted;
}

export default function AdminRatesPage() {
  const {
    rates,
    iraRates,
    ratesMeta,
    legalCopy,
  } = useRates();
  const {
    blocksByPath = {},
    updateBlock = () => {},
    getPageHistory = () => [],
    publishSharedPageNow = async () => ({ ok: false, reason: 'content-admin-unavailable' }),
  } = useContentAdmin();
  const [draft, setDraft] = useState({ rates, iraRates, ratesMeta });
  const [importReport, setImportReport] = useState(null);
  const [hasAppliedImport, setHasAppliedImport] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [importError, setImportError] = useState('');
  const [importStage, setImportStage] = useState('');
  const [importDiagnostics, setImportDiagnostics] = useState([]);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [saveError, setSaveError] = useState('');

  const hasChanges = useMemo(
    () => (
      JSON.stringify(draft.rates) !== JSON.stringify(rates)
      || JSON.stringify(draft.iraRates) !== JSON.stringify(iraRates)
      || JSON.stringify(draft.ratesMeta) !== JSON.stringify(ratesMeta)
    ),
    [draft, rates, iraRates, ratesMeta],
  );

  useEffect(() => {
    if (!isEditingDraft) {
      setDraft({ rates, iraRates, ratesMeta });
    }
  }, [isEditingDraft, iraRates, rates, ratesMeta]);

  const disclosurePreview = useMemo(
    () => buildDynamicLegalCopyFromBlock(
      {
        id: 'disclaimer',
        kind: 'legal_copy',
        mode: 'dynamic',
        settings: legalCopy,
      },
      {
        certificatesEffectiveDate: draft.ratesMeta?.certificatesEffectiveDate,
        iraEffectiveDate: draft.ratesMeta?.iraEffectiveDate,
      },
    ),
    [
      legalCopy,
      draft.ratesMeta?.certificatesEffectiveDate,
      draft.ratesMeta?.iraEffectiveDate,
    ],
  );

  const certificateRowTotal = draft.rates.length;
  const iraRowTotal = draft.iraRates.length;
  const mbaMatched = Boolean(importReport?.retirement403bMbaRate && importReport?.retirement403bMbaApy);
  const lastAdminUpdate = useMemo(() => (
    getPageHistory(RATES_CONTENT_PATH)
      .filter((entry) => entry?.action === 'page-published')
      .sort((first, second) => (Number(second?.createdAt) || 0) - (Number(first?.createdAt) || 0))[0] || null
  ), [getPageHistory]);

  async function handleRatesPdfSelected(file) {
    if (!file) {
      return;
    }

    setIsParsingPdf(true);
    setImportError('');
    setImportStage('FILE_SELECTED');
    setImportDiagnostics([]);
    setHasAppliedImport(false);

    try {
      const report = await parseRatesPdf(file, draft, {
        onStage: (entry) => {
          setImportStage(entry.stage);
          setImportDiagnostics((current) => [...current, entry]);
        },
      });
      setImportReport(report);
    } catch (error) {
      console.error(error);
      setImportStage('IMPORT_FAILED');
      if (Array.isArray(error?.pdfImportDiagnostics)) {
        setImportDiagnostics(error.pdfImportDiagnostics);
      }
      setImportError(error?.message || 'Failed to parse PDF.');
    } finally {
      setIsParsingPdf(false);
    }
  }

  function applyImportReport() {
    if (!importReport) {
      return;
    }

    setSaveState('');
    setIsEditingDraft(true);
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
    setHasAppliedImport(true);
  }

  function updateCertificateCell(id, key, value) {
    setSaveState('');
    setIsEditingDraft(true);
    setDraft((current) => ({
      ...current,
      rates: current.rates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function updateIraCell(id, key, value) {
    setSaveState('');
    setIsEditingDraft(true);
    setDraft((current) => ({
      ...current,
      iraRates: current.iraRates.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function writeDraftToRateBlocks() {
    const rateBlocks = Array.isArray(blocksByPath[RATES_CONTENT_PATH])
      ? blocksByPath[RATES_CONTENT_PATH]
      : [];
    const certificatesBlock = rateBlocks.find((block) => block?.id === CERTIFICATES_RATES_BLOCK_ID);
    const iraBlock = rateBlocks.find((block) => block?.id === IRA_RATES_BLOCK_ID);
    if (!certificatesBlock || !iraBlock) {
      throw new Error('The Certificates and IRA rate blocks must both exist before rates can be saved.');
    }

    const nextRateTables = {
      rates: draft.rates,
      iraRates: draft.iraRates,
      ratesMeta: draft.ratesMeta,
    };
    updateBlock(RATES_CONTENT_PATH, certificatesBlock.id, {
      settings: buildRatesBlockSettingsPatch(certificatesBlock, nextRateTables),
    });
    updateBlock(RATES_CONTENT_PATH, iraBlock.id, {
      settings: buildRatesBlockSettingsPatch(iraBlock, nextRateTables),
    });
  }

  async function saveChanges() {
    setSaveState('saving');
    setSaveError('');
    try {
      writeDraftToRateBlocks();
      // Rates are operational data, not an editorial review surface. Keep
      // their single-button admin action, while using the normal block
      // authority's save-and-publish transaction underneath.
      const result = await publishSharedPageNow(RATES_CONTENT_PATH, 'Rates admin save');
      if (!result?.ok) {
        throw new Error(result?.reason || 'The rates could not be saved.');
      }
      setIsEditingDraft(false);
      setSaveState('published');
    } catch (error) {
      setSaveState('');
      setSaveError(error?.message || 'The rates could not be saved.');
    }
  }

  function resetChanges() {
    setDraft({ rates, iraRates, ratesMeta });
    setIsEditingDraft(false);
    setImportReport(null);
    setImportError('');
    setSaveState('');
    setSaveError('');
  }

  function resetDefaults() {
    const next = {
      rates: defaultRates,
      iraRates: defaultIraRates,
      ratesMeta: defaultRatesMeta,
    };
    setDraft(next);
    setIsEditingDraft(true);
    setImportReport(null);
    setImportError('');
    setSaveState('');
    setSaveError('');
  }

  function updateMeta(key, value) {
    setSaveState('');
    setIsEditingDraft(true);
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
        <div className="admin-rates-page-meta">
          <span className="admin-rates-updated-badge" title="Last successful Rates admin save">
            Updated: {formatAdminUpdatedTimestamp(lastAdminUpdate)}
          </span>
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
              {isParsingPdf ? (PDF_IMPORT_STAGE_LABELS[importStage] || 'Parsing PDF…') : 'Choose PDF'}
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => handleRatesPdfSelected(event.target.files?.[0])}
                disabled={isParsingPdf}
              />
            </label>
          </div>

          {importError ? <p className="admin-rates-import-error">{importError}</p> : null}
          {importDiagnostics.length ? (
            <details className="admin-rates-import-diagnostics" open={Boolean(importError)}>
              <summary>PDF import diagnostics</summary>
              <dl>
                <div><dt>Runtime build</dt><dd>{RUNTIME_BUILD_ID}</dd></div>
                <div><dt>Resolved worker URL</dt><dd>{resolveRatesPdfWorkerUrl()}</dd></div>
                {importDiagnostics.map((entry, index) => (
                  <div key={`${entry.stage}-${entry.elapsedMs}-${index}`}>
                    <dt>{entry.stage}</dt>
                    <dd>{entry.elapsedMs} ms{entry.pageNum ? ` · page ${entry.pageNum}` : ''}{entry.failureStage ? ` · failed at ${entry.failureStage}` : ''}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}

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
                <button
                  type="button"
                  className="action-btn action-btn-primary"
                  onClick={applyImportReport}
                  disabled={hasAppliedImport}
                >
                  {hasAppliedImport ? 'Updated' : 'Update fields'}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="admin-actions admin-rates-actions">
          <button type="button" onClick={saveChanges} disabled={!hasChanges || saveState === 'saving' || saveState === 'published'} className="action-btn action-btn-primary">
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={resetChanges} disabled={!hasChanges} className="action-btn action-btn-outline">Discard</button>
          <button type="button" onClick={resetDefaults} className="action-btn action-btn-danger">Reset Defaults</button>
        </div>
        {saveError ? <p className="admin-rates-import-error" role="alert">{saveError}</p> : null}
        {saveState === 'published' ? <p className="admin-info-note">Rates saved and live.</p> : null}

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
                  <th>Rate</th>
                  <th>APY*</th>
                  <th>Rate</th>
                  <th>APY*</th>
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

        <div className="admin-actions admin-rates-actions">
          <button type="button" onClick={saveChanges} disabled={!hasChanges || saveState === 'saving' || saveState === 'published'} className="action-btn action-btn-primary">
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={resetChanges} disabled={!hasChanges} className="action-btn action-btn-outline">Discard</button>
          <button type="button" onClick={resetDefaults} className="action-btn action-btn-danger">Reset Defaults</button>
        </div>
      </PageShell>
    </div>
  );
}
