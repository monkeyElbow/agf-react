import { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { normalizeRedirectPath, useRedirects } from '../context/RedirectsContext';

function buildWarnings(redirects) {
  const warnings = [];
  const seenByFrom = new Map();

  redirects.forEach((rule) => {
    if (!rule.enabled) return;
    const from = normalizeRedirectPath(rule.from);
    const to = normalizeRedirectPath(rule.to);
    if (!from || !to) return;

    if (from === to) {
      warnings.push({ id: `${rule.id}-self`, text: `Rule "${from}" redirects to itself.` });
    }

    const existing = seenByFrom.get(from) || [];
    existing.push(rule.id);
    seenByFrom.set(from, existing);
  });

  for (const [from, ids] of seenByFrom.entries()) {
    if (ids.length > 1) {
      warnings.push({ id: `${from}-duplicate`, text: `Multiple enabled rules share the same source path: ${from}` });
    }
  }

  redirects.forEach((a) => {
    if (!a.enabled) return;
    const aFrom = normalizeRedirectPath(a.from);
    const aTo = normalizeRedirectPath(a.to);
    if (!aFrom || !aTo || /^https?:\/\//i.test(aTo)) return;

    redirects.forEach((b) => {
      if (!b.enabled || a.id === b.id) return;
      const bFrom = normalizeRedirectPath(b.from);
      const bTo = normalizeRedirectPath(b.to);
      if (!bFrom || !bTo || /^https?:\/\//i.test(bTo)) return;

      if (aFrom === bTo && aTo === bFrom) {
        warnings.push({ id: `${a.id}-${b.id}-loop`, text: `Loop risk: ${aFrom} <-> ${aTo}` });
      }
    });
  });

  return warnings;
}

export default function AdminRedirectsPage() {
  const {
    redirects,
    createRedirect,
    updateRedirect,
    deleteRedirect,
    resetRedirects,
  } = useRedirects();
  const [newRule, setNewRule] = useState({
    from: '',
    to: '',
    matchType: 'exact',
    statusCode: '302',
    preserveQuery: true,
    notes: '',
  });

  const warnings = useMemo(() => buildWarnings(redirects), [redirects]);

  const sortedRedirects = redirects;

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Redirects" source={pageByPath['/admin/redirects']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Phase 1: local browser redirects for React navigation. These are <strong>SPA redirects only</strong> and do not create server-side 301/302 rules.
        </div>

        <section className="admin-content-section">
          <h3>Add Redirect Rule</h3>
          <div className="admin-content-field-list">
            <div className="admin-content-grid-two">
              <label>
                <span>From path</span>
                <input
                  type="text"
                  value={newRule.from}
                  placeholder="/old-path"
                  onChange={(event) => setNewRule((prev) => ({ ...prev, from: event.target.value }))}
                />
              </label>
              <label>
                <span>To destination (path or https URL)</span>
                <input
                  type="text"
                  value={newRule.to}
                  placeholder="/new-path"
                  onChange={(event) => setNewRule((prev) => ({ ...prev, to: event.target.value }))}
                />
              </label>
            </div>

            <div className="admin-content-grid-two">
              <label>
                <span>Match type</span>
                <select
                  value={newRule.matchType}
                  onChange={(event) => setNewRule((prev) => ({ ...prev, matchType: event.target.value }))}
                >
                  <option value="exact">Exact (path only)</option>
                  <option value="prefix">Prefix (path + children)</option>
                </select>
              </label>
              <label>
                <span>Status code (metadata/export)</span>
                <select
                  value={newRule.statusCode}
                  onChange={(event) => setNewRule((prev) => ({ ...prev, statusCode: event.target.value }))}
                >
                  <option value="302">302 (temporary)</option>
                  <option value="301">301 (permanent)</option>
                </select>
              </label>
            </div>

            <div className="admin-content-grid-two">
              <label>
                <span>Preserve query string</span>
                <select
                  value={newRule.preserveQuery ? 'yes' : 'no'}
                  onChange={(event) => setNewRule((prev) => ({ ...prev, preserveQuery: event.target.value === 'yes' }))}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>
                <span>Notes (optional)</span>
                <input
                  type="text"
                  value={newRule.notes}
                  onChange={(event) => setNewRule((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Why this redirect exists"
                />
              </label>
            </div>
          </div>

          <div className="admin-actions">
            <button
              type="button"
              className="action-btn action-btn-primary"
              onClick={() => {
                if (!newRule.from.trim() || !newRule.to.trim()) return;
                createRedirect(newRule);
                setNewRule({
                  from: '',
                  to: '',
                  matchType: 'exact',
                  statusCode: '302',
                  preserveQuery: true,
                  notes: '',
                });
              }}
              disabled={!newRule.from.trim() || !newRule.to.trim()}
            >
              Add Redirect
            </button>
          </div>
        </section>

        {warnings.length ? (
          <section className="admin-content-section">
            <h3>Warnings</h3>
            <ul className="blank-state-note" style={{ marginTop: 0 }}>
              {warnings.map((warning) => (
                <li key={warning.id}>{warning.text}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="admin-content-section">
          <h3>Redirect Rules ({sortedRedirects.length})</h3>
          {sortedRedirects.length ? (
            <div className="table-scroll">
              <table className="data-table data-table--inputs">
                <thead>
                  <tr>
                    <th>Enabled</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Match</th>
                    <th>Code</th>
                    <th>Query</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRedirects.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <select
                          value={rule.enabled ? 'on' : 'off'}
                          onChange={(event) => updateRedirect(rule.id, { enabled: event.target.value === 'on' })}
                        >
                          <option value="on">On</option>
                          <option value="off">Off</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={rule.from}
                          placeholder="/from"
                          onChange={(event) => updateRedirect(rule.id, { from: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={rule.to}
                          placeholder="/to or https://..."
                          onChange={(event) => updateRedirect(rule.id, { to: event.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          value={rule.matchType}
                          onChange={(event) => updateRedirect(rule.id, { matchType: event.target.value })}
                        >
                          <option value="exact">exact</option>
                          <option value="prefix">prefix</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={rule.statusCode}
                          onChange={(event) => updateRedirect(rule.id, { statusCode: event.target.value })}
                        >
                          <option value="302">302</option>
                          <option value="301">301</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={rule.preserveQuery ? 'yes' : 'no'}
                          onChange={(event) => updateRedirect(rule.id, { preserveQuery: event.target.value === 'yes' })}
                        >
                          <option value="yes">keep</option>
                          <option value="no">drop</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={rule.notes}
                          placeholder="Notes"
                          onChange={(event) => updateRedirect(rule.id, { notes: event.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="action-btn action-btn-danger"
                          onClick={() => deleteRedirect(rule.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="blank-state-note">No redirect rules yet.</p>
          )}
        </section>

        <div className="admin-actions">
          <button type="button" className="action-btn action-btn-danger" onClick={resetRedirects}>
            Reset All Redirect Rules
          </button>
        </div>
      </PageShell>
    </div>
  );
}
