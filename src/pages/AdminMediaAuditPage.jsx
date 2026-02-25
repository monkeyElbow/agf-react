import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';

export default function AdminMediaAuditPage() {
  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Media Audit" source={pageByPath['/admin/media-audit']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          Planning-only placeholder for future media file checks. This page is not wired to the server yet.
        </div>

        <section className="admin-content-section">
          <h3>Purpose</h3>
          <p>
            Compare article records in the database against media folders/files on the server so we can catch missing
            social images, broken references, and orphaned files before publishing.
          </p>
        </section>

        <section className="admin-content-section">
          <h3>Planned Checks (Future)</h3>
          <ul className="native-info-link-list">
            <li>DB article records vs article media folder presence</li>
            <li>`mediaUrl` / `socialImageUrl` existence and readable file checks</li>
            <li>Duplicate filenames across article folders</li>
            <li>Orphaned files on server not referenced by any article</li>
            <li>Missing social image metadata (URL, alt text)</li>
            <li>Social image guidance validation: 1200 x 630px target, under 300kb (report only)</li>
            <li>Dry-run report export for IT/content review before any cleanup action</li>
          </ul>
        </section>

        <section className="admin-content-section">
          <h3>Expected Inputs (Future)</h3>
          <div className="admin-content-field-list">
            <label>
              <span>Media root path (server)</span>
              <input value="/media/articles" readOnly />
            </label>
            <label>
              <span>Scope</span>
              <select value="resources-articles" disabled>
                <option value="resources-articles">Resources articles</option>
              </select>
            </label>
            <label>
              <span>Mode</span>
              <select value="dry-run" disabled>
                <option value="dry-run">Dry run (report only)</option>
              </select>
            </label>
          </div>
        </section>

        <section className="admin-content-section">
          <h3>Notes</h3>
          <p className="blank-state-note">
            Build this after server storage conventions are finalized (folder naming, write location, and DB schema for
            article media fields).
          </p>
        </section>
      </PageShell>
    </div>
  );
}
