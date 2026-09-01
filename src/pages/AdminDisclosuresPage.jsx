import { useEffect, useMemo, useState } from 'react';
import AdminHtmlEditor from '../components/AdminHtmlEditor';
import PageShell from '../components/PageShell';
import SafeRichText from '../components/SafeRichText';
import { useDocuments } from '../context/DocumentsContext';
import { useDisclosures } from '../context/DisclosuresContext';
import { useRates } from '../context/RatesContext';
import { buildDefaultDisclosuresLibrary } from '../data/disclosuresLibrarySeed';
import { pageByPath } from '../data/siteMap';
import { replaceDisclosureTokens } from '../lib/disclosures';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../lib/ratesLegalCopyDefaults';

function renderTextWithStrong(source) {
  const text = String(source || '');
  if (!text.includes('**')) {
    return text;
  }

  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((chunk, index) => {
    const isStrong = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
    return isStrong
      ? <strong key={`s-${index}`}>{chunk.slice(2, -2)}</strong>
      : <span key={`t-${index}`}>{chunk}</span>;
  });
}

function formatLinesForEditor(value) {
  return Array.isArray(value) ? value.join('\n\n') : '';
}

function parseLinesFromEditor(value) {
  const normalized = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }
  const paragraphs = normalized.split(/\n{2,}/).map((entry) => entry.trim()).filter(Boolean);
  return paragraphs.length > 1
    ? paragraphs
    : normalized.split('\n').map((entry) => entry.trim()).filter(Boolean);
}

function formatScopeLabel(scope) {
  return String(scope || '').trim().toLowerCase() === 'shared' ? 'Shared' : 'Product-specific';
}

function formatActivityTimestamp(timestamp, actor = null) {
  const time = Number(timestamp) || 0;
  if (!time) {
    return '';
  }
  const formatted = new Date(time).toLocaleString();
  const name = String(actor?.displayName || '').trim();
  return name ? `${formatted} by ${name}` : formatted;
}

export default function AdminDisclosuresPage() {
  const {
    draftDisclosures,
    updateDisclosure,
    resetDisclosures,
    restoreDisclosureDraftFromLive,
    saveDisclosuresLive,
    hasUnpublishedDisclosureChanges,
    publishedAt,
    publishedBy,
  } = useDisclosures();
  const {
    draftLegalCopy,
    ratesMeta,
    setLegalCopy,
    restoreDraftLegalCopyFromLive,
    applyLegalCopySnapshot,
    hasUnpublishedLegalCopyChanges,
    legalCopyPublishedAt,
    legalCopyPublishedBy,
  } = useRates();
  const { resolveDocumentLink } = useDocuments();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [workflowMessage, setWorkflowMessage] = useState('');
  const [workflowError, setWorkflowError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const offeringCircularDoc = resolveDocumentLink('prospectus-prospectus-download-offering-circular')
    || resolveDocumentLink('document-aglf-offering-circular');
  const hasChanges = hasUnpublishedDisclosureChanges || hasUnpublishedLegalCopyChanges;
  const latestPublishedAt = Math.max(Number(publishedAt) || 0, Number(legalCopyPublishedAt) || 0);
  const latestPublishedActor = latestPublishedAt >= (Number(legalCopyPublishedAt) || 0) ? publishedBy : legalCopyPublishedBy;

  const rateEntries = useMemo(() => ([
    {
      id: 'rates-certificates-html',
      title: 'Rates page certificates disclosure',
      group: 'Rates',
      scope: 'shared',
      format: 'html',
      usage: 'Shown on the public Rates page certificate section. Tokens: {{certificatesEffectiveDate}}.',
      tokenHelp: ['{{certificatesEffectiveDate}}'],
      value: String(draftLegalCopy?.certificatesHtml || DEFAULT_RATES_LEGAL_COPY_SETTINGS.certificatesHtml).trim(),
      source: 'rates',
      fieldKey: 'certificatesHtml',
    },
    {
      id: 'rates-ira-html',
      title: 'Rates page IRA disclosure',
      group: 'Rates',
      scope: 'shared',
      format: 'html',
      usage: 'Shown on the public Rates page IRA section. Tokens: {{iraEffectiveDate}}.',
      tokenHelp: ['{{iraEffectiveDate}}'],
      value: String(draftLegalCopy?.iraHtml || DEFAULT_RATES_LEGAL_COPY_SETTINGS.iraHtml).trim(),
      source: 'rates',
      fieldKey: 'iraHtml',
    },
  ]), [draftLegalCopy]);

  const allEntries = useMemo(
    () => [
      ...rateEntries,
      ...draftDisclosures.map((entry) => ({ ...entry, source: 'disclosures' })),
    ],
    [draftDisclosures, rateEntries],
  );

  const groups = useMemo(
    () => ['all', ...Array.from(new Set(allEntries.map((entry) => entry.group))).sort((a, b) => a.localeCompare(b))],
    [allEntries],
  );

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (activeGroup !== 'all' && entry.group !== activeGroup) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [
        entry.title,
        entry.group,
        entry.scope,
        entry.usage,
        entry.id,
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [activeGroup, allEntries, search]);

  useEffect(() => {
    if (!allEntries.length) {
      setSelectedId('');
      return;
    }
    if (selectedId && !allEntries.some((entry) => entry.id === selectedId)) {
      setSelectedId('');
    }
  }, [allEntries, selectedId]);

  const selectedEntry = useMemo(
    () => allEntries.find((entry) => entry.id === selectedId) || null,
    [allEntries, selectedId],
  );

  const handleValueChange = (nextValue) => {
    setWorkflowMessage('');
    setWorkflowError('');
    if (!selectedEntry) {
      return;
    }
    if (selectedEntry.source === 'rates') {
      setLegalCopy({
        [selectedEntry.fieldKey]: String(nextValue || ''),
      });
      return;
    }
    updateDisclosure(
      selectedEntry.id,
      selectedEntry.format === 'lines' ? parseLinesFromEditor(nextValue) : nextValue,
    );
  };

  const resetSelected = () => {
    setWorkflowMessage('');
    setWorkflowError('');
    if (!selectedEntry) {
      return;
    }
    if (selectedEntry.source === 'rates') {
      setLegalCopy({
        [selectedEntry.fieldKey]: DEFAULT_RATES_LEGAL_COPY_SETTINGS[selectedEntry.fieldKey] || '',
      });
      return;
    }
    const defaultEntry = buildDefaultDisclosuresLibrary().find((entry) => entry.id === selectedEntry.id) || null;
    updateDisclosure(selectedEntry.id, defaultEntry?.value ?? '');
  };

  const handleResetAllDefaults = () => {
    setWorkflowMessage('');
    setWorkflowError('');
    resetDisclosures();
    setLegalCopy({ ...DEFAULT_RATES_LEGAL_COPY_SETTINGS });
    setWorkflowMessage('Defaults loaded. Save to publish them.');
  };

  const handleDiscardChanges = async () => {
    setWorkflowMessage('');
    setWorkflowError('');
    try {
      await Promise.all([
        restoreDisclosureDraftFromLive(),
        restoreDraftLegalCopyFromLive(),
      ]);
      setWorkflowMessage('Unsaved changes discarded.');
    } catch {
      setWorkflowError('Unable to discard the current changes right now.');
    }
  };

  const handleSave = async () => {
    setWorkflowMessage('');
    setWorkflowError('');
    setIsSaving(true);
    try {
      const snapshot = await saveDisclosuresLive({ legalCopy: draftLegalCopy });
      applyLegalCopySnapshot(snapshot);
      setWorkflowMessage('Disclosures saved and live.');
    } catch {
      setWorkflowError('Unable to save disclosures right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const editorValue = selectedEntry?.format === 'lines'
    ? formatLinesForEditor(selectedEntry?.value)
    : String(selectedEntry?.value || '');
  const previewHtml = useMemo(() => {
    if (!selectedEntry || selectedEntry.format !== 'html') {
      return '';
    }
    return replaceDisclosureTokens(String(selectedEntry.value || ''), {
      certificatesEffectiveDate: ratesMeta?.certificatesEffectiveDate || 'January 1, 2026',
      iraEffectiveDate: ratesMeta?.iraEffectiveDate || 'January 1, 2026',
      prospectusHref: offeringCircularDoc?.url || '/prospectus',
      offeringCircularHref: offeringCircularDoc?.url || '/prospectus',
    });
  }, [
    offeringCircularDoc?.url,
    ratesMeta?.certificatesEffectiveDate,
    ratesMeta?.iraEffectiveDate,
    selectedEntry,
  ]);

  const resetAllDefaults = () => {
    resetDisclosures();
    setLegalCopy({ ...DEFAULT_RATES_LEGAL_COPY_SETTINGS });
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Disclosures" source={pageByPath['/admin/disclosures']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Compare, edit, and organize the site’s public-facing disclosure copy in one place. Shared disclosures are grouped with product-specific notices so repeated investment and retirement language stays easier to manage.
        </div>

        <section className="admin-content-section admin-testimonials-workbench admin-disclosures-workbench">
          <div className="admin-testimonials-library-panel">
            <div className="admin-testimonials-library-toolbar">
              <label htmlFor="admin-disclosures-search" className="search-page-label">
                Search disclosures
                <input
                  id="admin-disclosures-search"
                  className="search-page-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, group, or usage"
                />
              </label>
              <div className="admin-testimonials-filter-actions admin-disclosures-filter-actions">
                <label htmlFor="admin-disclosures-group" className="search-page-label">
                  Group
                  <select
                    id="admin-disclosures-group"
                    className="search-page-input"
                    value={activeGroup}
                    onChange={(event) => setActiveGroup(event.target.value)}
                  >
                    {groups.map((group) => (
                      <option key={`admin-disclosures-group-${group}`} value={group}>
                        {group === 'all' ? 'All groups' : group}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="action-btn action-btn-outline" onClick={resetSelected} disabled={!selectedEntry}>
                  Reset selected
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={handleDiscardChanges}
                  disabled={!hasChanges || isSaving}
                >
                  Discard changes
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-danger"
                  onClick={handleResetAllDefaults}
                  disabled={isSaving}
                >
                  Reset all defaults
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              <p className="admin-content-note admin-disclosures-toolbar-note">
                Changes stay on this page until you click Save. Save publishes them for every user.
              </p>
              <div className="admin-disclosures-workflow-status">
                <p className="admin-content-note">
                  Updated: {latestPublishedAt ? formatActivityTimestamp(latestPublishedAt, latestPublishedActor) : 'Not saved yet'}
                </p>
                <p className={`admin-content-note ${hasChanges ? 'admin-disclosures-status-draft' : 'admin-disclosures-status-live'}`}>
                  {hasChanges ? 'Unsaved changes are on this page.' : 'Saved changes are live.'}
                </p>
                {workflowMessage ? (
                  <p className="admin-content-note admin-disclosures-status-success">{workflowMessage}</p>
                ) : null}
                {workflowError ? (
                  <p className="admin-content-note admin-disclosures-status-error">{workflowError}</p>
                ) : null}
              </div>
            </div>

            <p className="admin-content-note">
              Showing {filteredEntries.length} of {allEntries.length} managed disclosures.
            </p>

            <div className="admin-testimonials-card-scroller">
              {filteredEntries.length ? (
                <div className="admin-testimonials-page-card-grid admin-disclosures-page-card-grid">
                  {filteredEntries.map((entry) => {
                    const isActive = entry.id === selectedId;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={`admin-testimonials-page-card${isActive ? ' is-active' : ''}`}
                        onClick={() => setSelectedId(entry.id)}
                      >
                        <p className="admin-testimonials-page-card-author">
                          <strong>{entry.group}</strong> · {formatScopeLabel(entry.scope)}
                        </p>
                        <p className="admin-testimonials-page-card-quote">{entry.title}</p>
                        <p className="admin-testimonials-page-card-meta">ID: {entry.id}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="blank-state-note">No disclosures match this search/filter.</p>
              )}
            </div>
          </div>

          <aside className="admin-testimonials-editor-panel">
            {selectedEntry ? (
              <>
                <div className="admin-testimonials-editor-panel-head">
                  <div>
                    <h3>{selectedEntry.title}</h3>
                    <p>{selectedEntry.group} · {formatScopeLabel(selectedEntry.scope)}</p>
                  </div>
                </div>

                <div className="admin-disclosures-editor-note">
                  <strong>Changes stay here until saved.</strong> The fields below are split into reference details and editable public copy. Review the preview, then Save to publish for everyone.
                </div>

                <section className="admin-content-section admin-disclosures-metadata-section">
                  <div className="admin-disclosures-section-head">
                    <h4>Reference details</h4>
                    <p>These fields explain where the disclosure is used. They are read-only.</p>
                  </div>
                  <div className="admin-content-field-list admin-testimonials-page-editor-fields admin-disclosures-editor-fields">
                    <label className="admin-disclosures-editor-field">
                      <span>Usage</span>
                      <textarea rows={3} value={selectedEntry.usage || ''} readOnly />
                    </label>
                    {Array.isArray(selectedEntry.tokenHelp) && selectedEntry.tokenHelp.length ? (
                      <label className="admin-disclosures-editor-field">
                        <span>Tokens</span>
                        <input value={selectedEntry.tokenHelp.join(', ')} readOnly />
                      </label>
                    ) : null}
                    <label className="admin-disclosures-editor-field">
                      <span>Format</span>
                      <input value={selectedEntry.format} readOnly />
                    </label>
                    <label className="admin-disclosures-editor-field">
                      <span>Source</span>
                      <input value={selectedEntry.source === 'rates' ? 'Rates' : 'Disclosure library'} readOnly />
                    </label>
                  </div>
                </section>

                <section className="admin-content-section admin-disclosures-edit-section">
                  <div className="admin-disclosures-section-head">
                    <h4>Editable public copy</h4>
                    <p>
                      {selectedEntry.format === 'html'
                        ? 'Use HTML only when the disclosure needs links or richer formatting.'
                        : selectedEntry.format === 'lines'
                          ? 'Use blank lines to separate fine-print paragraphs.'
                          : 'Edit the public-facing disclosure copy directly here.'}
                    </p>
                  </div>

                  {selectedEntry.format === 'html' ? (
                    <div className="admin-content-section" style={{ padding: 0, border: 0 }}>
                      <AdminHtmlEditor
                        value={editorValue}
                        onChange={handleValueChange}
                      />
                    </div>
                  ) : (
                    <label className="admin-content-field-list admin-disclosures-editor-field">
                      <span>{selectedEntry.format === 'lines' ? 'Paragraphs / lines' : 'Disclosure copy'}</span>
                      <textarea
                        rows={selectedEntry.format === 'lines' ? 12 : 6}
                        value={editorValue}
                        onChange={(event) => handleValueChange(event.target.value)}
                      />
                    </label>
                  )}
                </section>

                <div className="admin-content-section" style={{ padding: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ marginTop: 0 }}>Preview</h4>
                  {selectedEntry.format === 'html' ? (
                    <SafeRichText as="div" html={previewHtml} className="rates-disclaimer" />
                  ) : Array.isArray(selectedEntry.value) ? (
                    selectedEntry.value.map((line, index) => (
                      <p key={`${selectedEntry.id}-preview-${index + 1}`} className="service-native-note">
                        {renderTextWithStrong(line)}
                      </p>
                    ))
                  ) : (
                    <p className="service-native-note">{renderTextWithStrong(selectedEntry.value)}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="admin-disclosures-empty-editor">
                <h3>Select a disclosure to edit</h3>
                <p>The editor stays inactive until you choose an item from the left list. That reduces accidental edits and makes the page feel less noisy.</p>
                <p>Changes stay on this page until saved. Use `text` for plain copy, `lines` for separated fine-print paragraphs, and `html` only when the disclosure needs links or richer formatting.</p>
              </div>
            )}
          </aside>
        </section>
      </PageShell>
    </div>
  );
}
