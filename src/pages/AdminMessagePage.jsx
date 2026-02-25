import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import {
  announcementBackgroundSwatches,
  announcementTextColors,
  useAnnouncement,
} from '../context/AnnouncementContext';

export default function AdminMessagePage() {
  const {
    announcement,
    setAnnouncementEnabled,
    setAnnouncementMessage,
    setAnnouncementBackground,
    setAnnouncementTextColor,
    setAnnouncementStartDate,
    setAnnouncementEndDate,
    resetAnnouncement,
  } = useAnnouncement();

  const previewBackground = announcementBackgroundSwatches.find((item) => item.id === announcement.backgroundId)
    || announcementBackgroundSwatches[0];
  const previewTextColor = announcementTextColors.find((item) => item.id === announcement.textColorId)
    || announcementTextColors[0];
  const today = new Date();
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const isAfterStart = !announcement.startDate || todayIso >= announcement.startDate;
  const isBeforeEnd = !announcement.endDate || todayIso <= announcement.endDate;
  const isWindowActive = isAfterStart && isBeforeEnd;
  const scheduleSummary = !announcement.startDate && !announcement.endDate
    ? 'Always active when toggled on.'
    : `Active window: ${announcement.startDate || '...'} to ${announcement.endDate || '...'}`;

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Site Message" source={pageByPath['/admin/message']?.source ?? null} showBadge={false}>
        <div className="admin-info-note">
          This slim message bar appears above breadcrumbs across site and admin pages.
        </div>

        <section className="admin-content-section">
          <div className="admin-content-field-list">
            <label>
              <span>Display message bar</span>
              <select
                value={announcement.enabled ? 'on' : 'off'}
                onChange={(event) => setAnnouncementEnabled(event.target.value === 'on')}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </label>

            <label>
              <span>Message</span>
              <textarea
                rows={3}
                value={announcement.message}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                placeholder="Enter message shown above breadcrumbs"
              />
            </label>

            <div className="admin-content-grid-two">
              <label>
                <span>Start Date (optional)</span>
                <input
                  type="date"
                  value={announcement.startDate || ''}
                  onChange={(event) => setAnnouncementStartDate(event.target.value)}
                />
              </label>
              <label>
                <span>End Date (optional)</span>
                <input
                  type="date"
                  value={announcement.endDate || ''}
                  onChange={(event) => setAnnouncementEndDate(event.target.value)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="admin-content-section">
          <h3>Background Color</h3>
          <div className="admin-swatch-row" role="radiogroup" aria-label="Message background color">
            {announcementBackgroundSwatches.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                role="radio"
                aria-checked={announcement.backgroundId === swatch.id}
                title={swatch.label}
                className={`admin-swatch-btn${announcement.backgroundId === swatch.id ? ' is-active' : ''}`}
                style={{ backgroundColor: swatch.color }}
                onClick={() => setAnnouncementBackground(swatch.id)}
              >
                <span className="sr-only">{swatch.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-content-section">
          <h3>Text Color</h3>
          <div className="admin-swatch-row" role="radiogroup" aria-label="Message text color">
            {announcementTextColors.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                role="radio"
                aria-checked={announcement.textColorId === swatch.id}
                className={`admin-text-tone-btn${announcement.textColorId === swatch.id ? ' is-active' : ''}`}
                onClick={() => setAnnouncementTextColor(swatch.id)}
              >
                <span className="admin-text-tone-chip" style={{ backgroundColor: swatch.color }} />
                {swatch.label}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-content-section">
          <h3>Preview</h3>
          <p className="admin-message-status">{scheduleSummary}</p>
          <p className={`admin-message-status${isWindowActive ? ' is-active' : ' is-inactive'}`}>
            {isWindowActive ? 'Current date is inside the selected range.' : 'Current date is outside the selected range.'}
          </p>
          <div
            className="admin-message-preview"
            style={{ backgroundColor: previewBackground.color, color: previewTextColor.color }}
          >
            {announcement.message?.trim() || 'Your message preview appears here.'}
          </div>
        </section>

        <div className="admin-actions">
          <button type="button" className="action-btn action-btn-danger" onClick={resetAnnouncement}>
            Reset Message Settings
          </button>
        </div>
      </PageShell>
    </div>
  );
}
