import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import ColorPalette from '../components/ColorPalette';
import { pageByPath, sitePages, toPageLinkRef } from '../data/siteMap';
import {
  announcementBackgroundSwatches,
  announcementTextColors,
  useAnnouncement,
} from '../context/AnnouncementContext';

function normalizeRouteOption(page) {
  if (!page || typeof page !== 'object') {
    return null;
  }
  const path = String(page.path || page.value || '').trim();
  if (!path) {
    return null;
  }
  const title = String(page.title || page.label || path).trim() || path;
  const linkRef = String(page.linkRef || path).trim() || path;
  return {
    ...page,
    path,
    title,
    label: String(page.label || title).trim() || title,
    value: String(page.value || path).trim() || path,
    linkRef,
  };
}

function sortPages(pages) {
  return [...pages]
    .map(normalizeRouteOption)
    .filter(Boolean)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function findSearchTargetPage(needle, pages) {
  const query = needle.trim().toLowerCase();
  if (!query || !pages.length) {
    return null;
  }

  const exact = pages.find((page) => (
    page.path.toLowerCase() === query
    || page.title.toLowerCase() === query
  ));
  if (exact) {
    return exact;
  }

  const startsWith = pages.find((page) => (
    page.path.toLowerCase().startsWith(query)
    || page.title.toLowerCase().startsWith(query)
  ));
  if (startsWith) {
    return startsWith;
  }

  return pages.find((page) => (
    page.path.toLowerCase().includes(query)
    || page.title.toLowerCase().includes(query)
  )) || null;
}

function RouteLinkField({ value, routeRefValue, onChange, onRouteRefChange, routeOptions = [] }) {
  const [routeSearch, setRouteSearch] = useState('');
  const allRouteOptions = useMemo(
    () => sortPages(Array.isArray(routeOptions) ? routeOptions : []),
    [routeOptions],
  );
  const filteredRoutes = useMemo(() => {
    const needle = routeSearch.trim().toLowerCase();
    if (!needle) {
      return allRouteOptions;
    }
    return allRouteOptions.filter((page) => {
      const haystack = `${page.title} ${page.path}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [routeSearch, allRouteOptions]);

  const applyRoutePage = (page) => {
    if (!page?.path) {
      return;
    }
    onChange(page.path);
    if (typeof onRouteRefChange === 'function') {
      onRouteRefChange(toPageLinkRef(page));
    }
  };

  useEffect(() => {
    if (!routeRefValue) {
      if (typeof onRouteRefChange === 'function') {
        const exactPage = allRouteOptions.find((page) => page.path === String(value || '').trim());
        if (exactPage) {
          onRouteRefChange(toPageLinkRef(exactPage));
        }
      }
      return;
    }
    const matchedPage = allRouteOptions.find((page) => toPageLinkRef(page) === String(routeRefValue).trim());
    if (!matchedPage?.path) {
      return;
    }
    if (String(value || '').trim() === matchedPage.path) {
      return;
    }
    onChange(matchedPage.path);
  }, [routeRefValue, value, onChange, onRouteRefChange, allRouteOptions]);

  return (
    <div className="admin-route-link-control admin-route-link-control--triple">
      <input
        className="admin-route-link-path-input"
        type="text"
        value={value ?? ''}
        placeholder="/about-us/impact"
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          if (typeof onRouteRefChange === 'function') {
            const exactPage = allRouteOptions.find((page) => page.path === nextValue.trim());
            onRouteRefChange(exactPage ? toPageLinkRef(exactPage) : '');
          }
        }}
      />
      <div className="admin-route-link-search admin-route-link-search--inline">
        <input
          className="admin-route-link-search-input"
          type="search"
          value={routeSearch}
          placeholder="Search pages"
          onChange={(event) => setRouteSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }
            const target = findSearchTargetPage(routeSearch, filteredRoutes.length ? filteredRoutes : allRouteOptions);
            if (!target) {
              return;
            }
            event.preventDefault();
            applyRoutePage(target);
            setRouteSearch('');
          }}
        />
        <select
          className="admin-route-link-select"
          value=""
          onChange={(event) => {
            if (!event.target.value) {
              return;
            }
            const selectedPage = allRouteOptions.find((page) => page.path === event.target.value);
            if (!selectedPage) {
              return;
            }
            applyRoutePage(selectedPage);
            setRouteSearch('');
          }}
        >
          <option value="">Pick page route…</option>
          {filteredRoutes.map((page) => (
            <option key={`message-route-link-${page.path}`} value={page.path}>
              {page.path} — {page.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AdminMessagePage() {
  const {
    announcement,
    setAnnouncementEnabled,
    setAnnouncementMessage,
    setAnnouncementBackground,
    setAnnouncementTextColor,
    setAnnouncementStartDate,
    setAnnouncementEndDate,
    setAnnouncementLinkEnabled,
    setAnnouncementLinkPath,
    setAnnouncementLinkPageRef,
    resetAnnouncement,
  } = useAnnouncement();
  const routeLinkOptions = useMemo(
    () => sitePages
      .filter((page) => page && page.path && !page.path.startsWith('/admin/') && page.path !== '/search')
      .sort((a, b) => a.path.localeCompare(b.path)),
    [],
  );

  const announcementMode = !announcement.enabled
    ? 'off'
    : (!announcement.startDate && !announcement.endDate ? 'always' : 'scheduled');

  const applyAnnouncementMode = (mode) => {
    if (mode === 'off') {
      setAnnouncementEnabled(false);
      return;
    }
    if (mode === 'always') {
      setAnnouncementEnabled(true);
      setAnnouncementStartDate('');
      setAnnouncementEndDate('');
      return;
    }
    setAnnouncementEnabled(true);
  };

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
  let scheduleSummary = 'Currently off.';
  if (announcementMode === 'always') {
    scheduleSummary = 'Always active.';
  } else if (announcementMode === 'scheduled') {
    scheduleSummary = `Active window: ${announcement.startDate || '...'} to ${announcement.endDate || '...'}`;
    if (!isWindowActive) {
      scheduleSummary = `Scheduled window: ${announcement.startDate || '...'} to ${announcement.endDate || '...'}`;
    }
  }
  const hasLinkTarget = Boolean(String(announcement.linkPath || '').trim());
  const backgroundPaletteOptions = announcementBackgroundSwatches.map((swatch) => ({
    value: swatch.id,
    label: swatch.label,
    swatch: swatch.color,
  }));
  const textPaletteOptions = announcementTextColors.map((swatch) => ({
    value: swatch.id,
    label: swatch.label,
    swatch: swatch.color,
  }));

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Site Message" source={pageByPath['/admin/message']?.source ?? null} showBadge={false}>
        <p className="admin-message-intro">
          This slim message bar appears above breadcrumbs across site and admin pages.
        </p>

        <section className="admin-message-preview-section">
          <h3>Preview</h3>
          <p className="admin-message-status">{scheduleSummary}</p>
          <div
            className={`admin-message-preview${announcement.linkEnabled && hasLinkTarget ? ' is-link' : ''}`}
            style={{ backgroundColor: previewBackground.color, color: previewTextColor.color }}
          >
            {announcement.message?.trim() || 'Your message preview appears here.'}
          </div>
          {announcement.linkEnabled && hasLinkTarget ? (
            <p className="admin-message-status">Linked to: {announcement.linkPath}</p>
          ) : null}
        </section>

        <div className="admin-message-grid">
          <section className="admin-message-panel">
            <h3>Message</h3>
            <div className="admin-content-field-list admin-message-field-list">
              <label>
                <span>Message</span>
                <textarea
                  rows={3}
                  value={announcement.message}
                  onChange={(event) => setAnnouncementMessage(event.target.value)}
                  placeholder="Enter message shown above breadcrumbs"
                />
              </label>
            </div>
          </section>

          <section className="admin-message-panel">
            <div className="admin-message-panel-head">
              <h3>Status</h3>
              <div className="admin-boolean-pill admin-boolean-pill--triple" role="group" aria-label="Message status">
                <button
                  type="button"
                  className={`admin-boolean-pill-option${announcementMode === 'off' ? ' is-active' : ''}`}
                  onClick={() => applyAnnouncementMode('off')}
                >
                  Off
                </button>
                <button
                  type="button"
                  className={`admin-boolean-pill-option${announcementMode === 'always' ? ' is-active' : ''}`}
                  onClick={() => applyAnnouncementMode('always')}
                >
                  Always On
                </button>
                <button
                  type="button"
                  className={`admin-boolean-pill-option${announcementMode === 'scheduled' ? ' is-active' : ''}`}
                  onClick={() => applyAnnouncementMode('scheduled')}
                >
                  Scheduled
                </button>
              </div>
            </div>
            {announcementMode === 'scheduled' ? (
              <div className="admin-content-grid-two admin-message-date-grid">
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
            ) : (
              <p className="admin-message-status-note">
                {announcementMode === 'off'
                  ? 'The message bar stays hidden until you turn it on.'
                  : 'The message bar stays on until you switch to Scheduled or Off.'}
              </p>
            )}
          </section>

          <section className="admin-message-panel admin-message-panel--full">
            <div className="admin-message-panel-head">
              <h3>Link</h3>
              <div className="admin-boolean-pill" role="group" aria-label="Message link">
                <button
                  type="button"
                  className={`admin-boolean-pill-option${announcement.linkEnabled ? ' is-active' : ''}`}
                  onClick={() => setAnnouncementLinkEnabled(true)}
                >
                  On
                </button>
                <button
                  type="button"
                  className={`admin-boolean-pill-option${!announcement.linkEnabled ? ' is-active' : ''}`}
                  onClick={() => setAnnouncementLinkEnabled(false)}
                >
                  Off
                </button>
              </div>
            </div>
            <div className="admin-content-field-list admin-message-field-list">
              {announcement.linkEnabled ? (
                <label className="admin-message-link-destination">
                  <span>Link Destination</span>
                  <RouteLinkField
                    value={announcement.linkPath}
                    routeRefValue={announcement.linkPageRef}
                    onChange={setAnnouncementLinkPath}
                    onRouteRefChange={setAnnouncementLinkPageRef}
                    routeOptions={routeLinkOptions}
                  />
                </label>
              ) : null}
            </div>
          </section>
        </div>

        <div className="admin-message-grid admin-message-grid--palette">
          <section className="admin-message-panel">
            <h3>Background Color</h3>
            <ColorPalette
              variant="admin"
              className="is-compact is-icon-only admin-swatch-row"
              ariaLabel="Message background color"
              options={backgroundPaletteOptions}
              value={announcement.backgroundId}
              onChange={(nextValue) => setAnnouncementBackground(nextValue)}
              getOptionClassName={(option, state) => `admin-swatch-btn${state.active ? ' is-active' : ''}`}
              getOptionLabel={(option) => option.label}
              getOptionShortLabel={(option) => option.shortLabel || option.label}
            />
          </section>

          <section className="admin-message-panel">
            <h3>Text Color</h3>
            <ColorPalette
              variant="admin"
              className="is-compact is-icon-only admin-swatch-row"
              ariaLabel="Message text color"
              options={textPaletteOptions}
              value={announcement.textColorId}
              onChange={(nextValue) => setAnnouncementTextColor(nextValue)}
              getOptionClassName={(option, state) => `admin-text-tone-btn${state.active ? ' is-active' : ''}`}
              getOptionLabel={(option) => option.label}
              getOptionShortLabel={(option) => option.shortLabel || option.label}
            />
          </section>
        </div>

        <div className="admin-actions">
          <button type="button" className="action-btn action-btn-danger" onClick={resetAnnouncement}>
            Reset Message Settings
          </button>
        </div>
      </PageShell>
    </div>
  );
}
