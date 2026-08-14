import { useEffect, useId, useMemo, useState } from 'react';

function normalizeRouteOption(page) {
  if (!page || typeof page !== 'object') {
    return null;
  }
  const path = String(page.path || page.value || '').trim();
  if (!path) {
    return null;
  }
  const title = String(page.title || page.label || path).trim() || path;
  return {
    ...page,
    path,
    title,
    label: String(page.label || title).trim() || title,
    linkRef: String(page.linkRef || path).trim() || path,
  };
}

function sortRouteOptions(options) {
  return (Array.isArray(options) ? options : [])
    .map(normalizeRouteOption)
    .filter(Boolean)
    .sort((left, right) => left.path.localeCompare(right.path));
}

function resolvePageRef(page) {
  return String(page?.linkRef || page?.path || '').trim();
}

export default function RouteLinkField({
  inputLabel = 'URL/path override',
  value,
  routeRefValue,
  openInNewWindowValue = false,
  showOpenInNewWindow = true,
  openInNewWindowLabel = 'Open in new window',
  onChange,
  onRouteRefChange,
  onRouteLinkChange,
  onOpenInNewWindowChange,
  routeOptions = [],
}) {
  const overrideInputId = useId();
  const resultsId = useId();
  const [routeSearch, setRouteSearch] = useState('');
  const allRouteOptions = useMemo(() => sortRouteOptions(routeOptions), [routeOptions]);
  const filteredRoutes = useMemo(() => {
    const needle = routeSearch.trim().toLowerCase();
    if (!needle) {
      return allRouteOptions;
    }
    return allRouteOptions.filter((page) => `${page.title} ${page.path}`.toLowerCase().includes(needle));
  }, [allRouteOptions, routeSearch]);

  const selectedPage = allRouteOptions.find((page) => (
    (routeRefValue && resolvePageRef(page) === String(routeRefValue).trim())
    || (!routeRefValue && page.path === String(value || '').trim())
  ));

  const applyRoutePage = (page) => {
    if (!page?.path) {
      return;
    }
    const nextRouteRefValue = resolvePageRef(page);
    if (typeof onRouteLinkChange === 'function') {
      onRouteLinkChange(page.path, nextRouteRefValue);
      return;
    }
    onChange?.(page.path);
    onRouteRefChange?.(nextRouteRefValue);
  };

  useEffect(() => {
    if (routeRefValue || typeof onRouteRefChange !== 'function') {
      return;
    }
    const exactPage = allRouteOptions.find((page) => page.path === String(value || '').trim());
    if (exactPage) {
      onRouteRefChange(resolvePageRef(exactPage));
    }
  }, [allRouteOptions, onRouteRefChange, routeRefValue, value]);

  return (
    <div className="admin-route-link-control">
      <div className="admin-route-link-primary">
        <span className="admin-route-link-control-label">Select a page</span>
        <div className="admin-route-link-search">
          <input
            type="search"
            aria-label="Search pages"
            aria-expanded={Boolean(routeSearch.trim())}
            aria-controls={resultsId}
            value={routeSearch}
            placeholder="Search pages"
            onChange={(event) => setRouteSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setRouteSearch('');
                return;
              }
              if (event.key === 'Enter' && filteredRoutes[0]) {
                event.preventDefault();
                applyRoutePage(filteredRoutes[0]);
                setRouteSearch('');
              }
            }}
          />
          {routeSearch.trim() ? (
            <div id={resultsId} className="admin-route-link-results" role="listbox" aria-label="Matching pages">
              {filteredRoutes.slice(0, 8).map((page) => (
                <button
                  key={`route-result-${page.path}`}
                  type="button"
                  role="option"
                  aria-selected={selectedPage?.path === page.path}
                  onClick={() => {
                    applyRoutePage(page);
                    setRouteSearch('');
                  }}
                >
                  <strong>{page.title}</strong>
                  <span>{page.path}</span>
                </button>
              ))}
              {!filteredRoutes.length ? <span className="admin-route-link-no-results">No matching internal pages.</span> : null}
            </div>
          ) : null}
          <select
            aria-label="Select internal page"
            value={selectedPage?.path || ''}
            onChange={(event) => {
              const page = allRouteOptions.find((option) => option.path === event.target.value);
              if (page) {
                applyRoutePage(page);
                setRouteSearch('');
              }
            }}
          >
            <option value="">Choose an internal page…</option>
            {filteredRoutes.map((page) => (
              <option key={`route-link-${page.path}`} value={page.path}>
                {page.path} — {page.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="admin-route-link-override">
        <span className="admin-route-link-control-label">URL/path override</span>
        <input
          id={overrideInputId}
          type="text"
          aria-label={inputLabel}
          value={value ?? ''}
          placeholder="https://… or /path"
          onChange={(event) => {
            const nextValue = event.target.value;
            if (typeof onRouteLinkChange === 'function') {
              onRouteLinkChange(nextValue, '');
              return;
            }
            onChange?.(nextValue);
            onRouteRefChange?.('');
          }}
        />
      </div>
      {showOpenInNewWindow ? (
        <div className="admin-route-link-new-window">
          <input
            type="checkbox"
            aria-label={openInNewWindowLabel}
            checked={Boolean(openInNewWindowValue)}
            onChange={(event) => onOpenInNewWindowChange?.(event.target.checked)}
          />
          <span>{openInNewWindowLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
