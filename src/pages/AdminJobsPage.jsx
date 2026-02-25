import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useCareersJobs } from '../context/CareersJobsContext';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatPostedDate(value) {
  const iso = String(value || '').trim();
  if (!iso) {
    return 'Not set';
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminJobsPage() {
  const {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    duplicateJob,
    resetJobs,
    isVisibleNow,
  } = useCareersJobs();

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!jobs.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId && !jobs.some((job) => job.id === selectedId)) {
      setSelectedId(null);
    }
  }, [jobs, selectedId]);

  const selected = useMemo(
    () => jobs.find((job) => job.id === selectedId) || null,
    [jobs, selectedId],
  );

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Careers Jobs" source={pageByPath['/admin/jobs']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Create and manage job postings for the Careers page. Select a job to open its editor.
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={() => {
              const newId = addJob();
              if (newId) {
                setSelectedId(newId);
              }
            }}
          >
            Add Job
          </button>
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={resetJobs}
          >
            Reset Defaults
          </button>
        </div>

        <section className="admin-content-section">
          <h3>Jobs list</h3>
          <div className="admin-jobs-list" role="list">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                role="listitem"
                className={`admin-jobs-item${job.id === selectedId ? ' is-active' : ''}`}
                onClick={() => setSelectedId(job.id)}
              >
                <span className="admin-jobs-item-title">{job.title}</span>
                <span className="admin-jobs-item-meta">
                  {job.isPublished ? 'Published' : 'Draft'}
                  {' · '}
                  {isVisibleNow(job) ? 'Visible now' : 'Hidden now'}
                  {' · '}
                  Posted {formatPostedDate(job.postedDate || todayIso())}
                </span>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="admin-content-section">
            <h3>Selected job</h3>
            <p className="blank-state-note">
              <strong>{selected.title}</strong>
              {' · '}
              {selected.isPublished ? 'Published' : 'Draft'}
              {' · '}
              {isVisibleNow(selected) ? 'Visible on Careers page' : 'Hidden on Careers page'}
            </p>

            <div className="admin-actions">
              <button
                type="button"
                className="action-btn action-btn-outline"
                onClick={() => {
                  const newId = duplicateJob(selected.id);
                  if (newId) {
                    setSelectedId(newId);
                  }
                }}
              >
                Duplicate job
              </button>

              <button
                type="button"
                className="action-btn action-btn-danger"
                onClick={() => {
                  deleteJob(selected.id);
                  setSelectedId(null);
                }}
              >
                Delete job
              </button>
            </div>

            <div className="admin-content-field-list">
              <label>
                <span>Job title</span>
                <input
                  value={selected.title}
                  onChange={(event) => updateJob(selected.id, { title: event.target.value })}
                />
              </label>

              <label>
                <span>Location label (optional)</span>
                <input
                  value={selected.location || ''}
                  onChange={(event) => updateJob(selected.id, { location: event.target.value })}
                  placeholder="Springfield, MO"
                />
              </label>

              <label>
                <span>Summary</span>
                <textarea
                  rows={5}
                  value={selected.summary || ''}
                  onChange={(event) => updateJob(selected.id, { summary: event.target.value })}
                />
              </label>

              <label>
                <span>Detail note (italic line under summary)</span>
                <textarea
                  rows={3}
                  value={selected.note || ''}
                  onChange={(event) => updateJob(selected.id, { note: event.target.value })}
                />
              </label>

              <div className="admin-content-grid-two">
                <label>
                  <span>Apply URL</span>
                  <input
                    value={selected.applyUrl || ''}
                    onChange={(event) => updateJob(selected.id, { applyUrl: event.target.value })}
                  />
                </label>
                <label>
                  <span>Button label</span>
                  <input
                    value={selected.buttonLabel || 'Apply Online'}
                    onChange={(event) => updateJob(selected.id, { buttonLabel: event.target.value })}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Posted date (shown on page)</span>
                  <input
                    type="date"
                    value={selected.postedDate || ''}
                    onChange={(event) => updateJob(selected.id, { postedDate: event.target.value })}
                  />
                </label>
                <label>
                  <span>Display order</span>
                  <input
                    type="number"
                    value={selected.displayOrder || 0}
                    onChange={(event) => updateJob(selected.id, { displayOrder: Number(event.target.value || 0) })}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Start showing on</span>
                  <input
                    type="date"
                    value={selected.publishAt || ''}
                    onChange={(event) => updateJob(selected.id, { publishAt: event.target.value })}
                  />
                </label>
                <label>
                  <span>Stop showing after</span>
                  <input
                    type="date"
                    value={selected.expireAt || ''}
                    onChange={(event) => updateJob(selected.id, { expireAt: event.target.value })}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Publishing status</span>
                  <select
                    value={selected.isPublished ? 'published' : 'draft'}
                    onChange={(event) => updateJob(selected.id, { isPublished: event.target.value === 'published' })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
                <label>
                  <span>Visibility right now</span>
                  <input value={isVisibleNow(selected) ? 'Visible on Careers page' : 'Hidden on Careers page'} readOnly />
                </label>
              </div>

              <p className="blank-state-note">
                Posted display: <strong>{formatPostedDate(selected.postedDate || todayIso())}</strong>
              </p>
            </div>
          </section>
        ) : (
          <section className="admin-content-section">
            <div className="blank-state">
              <p>No job selected.</p>
              <p className="blank-state-note">Add a job to start editing the careers listings.</p>
            </div>
          </section>
        )}
      </PageShell>
    </div>
  );
}
