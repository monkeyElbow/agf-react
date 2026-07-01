import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useConsultants } from '../context/ConsultantsContext';
import { useConsultantResponses } from '../context/ConsultantResponsesContext';

function toStatesCsv(states) {
  if (!Array.isArray(states) || !states.length) {
    return '';
  }
  return states.join(', ');
}

function parseStatesCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z]{2}$/.test(item));
}

function formatConsultantLabel(item) {
  const name = String(item?.name || '').trim();
  const credentials = String(item?.credentials || '').trim();
  return `${name || '(unnamed)'}${credentials ? ` ${credentials}` : ''}`;
}

export default function AdminConsultantsPage() {
  const {
    consultantsByService,
    addConsultant,
    updateConsultant,
    removeConsultant,
    resetConsultants,
  } = useConsultants();
  const { responses, clearResponses } = useConsultantResponses();

  const [service, setService] = useState('loans');
  const list = consultantsByService[service] || [];
  const [selectedId, setSelectedId] = useState(list[0]?.id || null);

  useEffect(() => {
    if (!list.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !list.some((item) => item.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  const selected = useMemo(
    () => list.find((item) => item.id === selectedId) || null,
    [list, selectedId],
  );

  const ensureSelected = (nextList, preferredId = null) => {
    if (preferredId && nextList.some((item) => item.id === preferredId)) {
      setSelectedId(preferredId);
      return;
    }
    setSelectedId(nextList[0]?.id || null);
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Consultants" source={pageByPath['/admin/consultants']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Edit consultant directories used on Loans and Retirement consultant pages. Add or remove consultants and update names, region, email, phone, and states.
        </div>

        <div className="admin-content-grid-two admin-consultants-select-row">
          <label>
            <span>Directory</span>
            <select
              value={service}
              onChange={(event) => {
                const nextService = event.target.value;
                setService(nextService);
                const nextList = consultantsByService[nextService] || [];
                ensureSelected(nextList);
              }}
            >
              <option value="loans">Loans Consultants</option>
              <option value="retirement">Retirement Consultants</option>
            </select>
          </label>
          <label>
            <span>Select consultant</span>
            <select
              value={selectedId || ''}
              onChange={(event) => setSelectedId(event.target.value || null)}
            >
              {list.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatConsultantLabel(item)} {item.region ? `- ${item.region}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={() => {
              const newId = addConsultant(service);
              const nextList = [...(consultantsByService[service] || []), { id: newId }];
              ensureSelected(nextList, newId || undefined);
            }}
          >
            Add Consultant
          </button>
          <button
            type="button"
            className="action-btn action-btn-danger"
            disabled={!selected}
            onClick={() => {
              if (!selected) {
                return;
              }
              removeConsultant(service, selected.id);
              const nextList = (consultantsByService[service] || []).filter((item) => item.id !== selected.id);
              ensureSelected(nextList);
            }}
          >
            Remove Consultant
          </button>
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={() => {
              resetConsultants();
              setSelectedId(null);
            }}
          >
            Reset Defaults
          </button>
        </div>

        {selected ? (
          <section className="admin-content-section">
            <div className="admin-content-field-list">
              <label>
                <span>Name</span>
                <input
                  value={selected.name || ''}
                  onChange={(event) => updateConsultant(service, selected.id, { name: event.target.value })}
                />
              </label>
              <label>
                <span>Credentials</span>
                <input
                  value={selected.credentials || ''}
                  onChange={(event) => updateConsultant(service, selected.id, { credentials: event.target.value })}
                  placeholder="CFP"
                />
              </label>
              <label>
                <span>Region label</span>
                <input
                  value={selected.region || ''}
                  onChange={(event) => updateConsultant(service, selected.id, { region: event.target.value })}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  value={selected.email || ''}
                  onChange={(event) => updateConsultant(service, selected.id, { email: event.target.value })}
                />
              </label>
              <label>
                <span>Phone (display format)</span>
                <input
                  value={selected.phone || ''}
                  onChange={(event) => updateConsultant(service, selected.id, { phone: event.target.value })}
                  placeholder="417.555.1212"
                />
              </label>
              <label>
                <span>States (CSV, two-letter codes)</span>
                <input
                  value={toStatesCsv(selected.states)}
                  onChange={(event) => updateConsultant(service, selected.id, { states: parseStatesCsv(event.target.value) })}
                  placeholder="MO, AR, OK"
                />
              </label>
            </div>
          </section>
        ) : (
          <section className="admin-content-section">
            <p className="blank-state-note">No consultant selected. Add one to start editing.</p>
          </section>
        )}

        <section className="admin-content-section">
          <div className="admin-consultant-responses-head">
            <h3>Consultant Responses (Demo Queue)</h3>
            <button
              type="button"
              className="action-btn action-btn-outline"
              disabled={!responses.length}
              onClick={clearResponses}
            >
              Clear Responses
            </button>
          </div>
          <p className="blank-state-note">
            Captured from consultant message forms as temporary local data. Salesforce posting is not wired yet.
          </p>
          {responses.length ? (
            <div className="table-scroll">
              <table className="data-table data-table--inputs">
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th>To</th>
                    <th>From</th>
                    <th>Message</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((item) => {
                    const submittedDate = new Date(item.submittedAt);
                    const submittedLabel = Number.isNaN(submittedDate.getTime())
                      ? item.submittedAt
                      : submittedDate.toLocaleString('en-US');

                    return (
                      <tr key={item.id}>
                        <td>{submittedLabel}</td>
                        <td>
                          <div>{item.consultantName || '-'}</div>
                          {item.consultantEmail ? <small>{item.consultantEmail}</small> : null}
                        </td>
                        <td>
                          <div>{item.fromName || '-'}</div>
                          {item.fromEmail ? <small>{item.fromEmail}</small> : null}
                        </td>
                        <td className="admin-consultant-response-message">{item.message || '-'}</td>
                        <td>{item.pagePath || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="blank-state-note">No consultant responses captured yet.</p>
          )}
        </section>
      </PageShell>
    </div>
  );
}
