import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildDefaultChartsLibrary } from '../data/chartsLibrarySeed';

const STORAGE_KEY = 'agf-charts-library-v1';

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeHeaders(headers, fallbackHeaders = []) {
  const source = Array.isArray(headers) ? headers : fallbackHeaders;
  const normalized = source.map((entry) => normalizeString(entry));
  return normalized.length >= 2 ? normalized : [...fallbackHeaders];
}

function normalizeRows(rows, fallbackRows = [], columnCount = 0) {
  const source = Array.isArray(rows) ? rows : fallbackRows;
  const normalized = source
    .map((row) => (Array.isArray(row) ? row.map((cell) => String(cell || '')) : []))
    .filter((row) => row.length >= Math.max(2, columnCount || 2));

  return normalized.length
    ? normalized
    : fallbackRows.map((row) => (Array.isArray(row) ? [...row] : []));
}

function normalizeChartEntry(rawEntry, defaultEntry = null) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const fallback = defaultEntry && typeof defaultEntry === 'object' ? defaultEntry : {};
  const headers = normalizeHeaders(source.headers, fallback.headers || []);
  return {
    id: normalizeString(source.id || fallback.id),
    title: normalizeString(source.title || fallback.title),
    group: normalizeString(source.group || fallback.group) || 'General',
    scope: normalizeString(source.scope || fallback.scope) || 'product',
    usage: normalizeString(source.usage || fallback.usage),
    valueAlignment: normalizeString(source.valueAlignment || fallback.valueAlignment || 'left') === 'right' ? 'right' : 'left',
    headers,
    rows: normalizeRows(source.rows, fallback.rows || [], headers.length),
  };
}

function normalizeChartsLibrary(payload) {
  const defaults = buildDefaultChartsLibrary();
  const source = Array.isArray(payload) ? payload : [];
  const sourceById = new Map(
    source
      .map((entry) => normalizeChartEntry(entry))
      .filter((entry) => entry.id)
      .map((entry) => [entry.id, entry]),
  );

  return defaults.map((defaultEntry) => normalizeChartEntry(sourceById.get(defaultEntry.id), defaultEntry));
}

function readInitialCharts() {
  if (typeof window === 'undefined') {
    return buildDefaultChartsLibrary();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildDefaultChartsLibrary();
    }
    return normalizeChartsLibrary(JSON.parse(raw));
  } catch {
    return buildDefaultChartsLibrary();
  }
}

const defaultChartsLibrary = buildDefaultChartsLibrary();
const defaultChartsValue = {
  charts: defaultChartsLibrary,
  getChart: (id) => defaultChartsLibrary.find((entry) => entry.id === normalizeString(id)) || null,
  getChartValue: (id, fallback = null) => {
    const entry = defaultChartsLibrary.find((item) => item.id === normalizeString(id)) || null;
    return entry ? cloneValue(entry) : cloneValue(fallback);
  },
  updateChart: () => {},
  resetCharts: () => {},
};

const ChartsContext = createContext(defaultChartsValue);

export function ChartsProvider({ children }) {
  const [charts, setCharts] = useState(readInitialCharts);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    } catch {
      // ignore storage write failures
    }
  }, [charts]);

  const value = useMemo(() => {
    const byId = new Map(charts.map((entry) => [entry.id, entry]));
    return {
      charts,
      getChart: (id) => byId.get(normalizeString(id)) || null,
      getChartValue: (id, fallback = null) => {
        const entry = byId.get(normalizeString(id)) || null;
        return entry ? cloneValue(entry) : cloneValue(fallback);
      },
      updateChart: (id, patch = {}) => {
        const token = normalizeString(id);
        if (!token || !patch || typeof patch !== 'object') {
          return;
        }
        setCharts((current) => current.map((entry) => (
          entry.id !== token
            ? entry
            : normalizeChartEntry(
                {
                  ...entry,
                  ...patch,
                },
                entry,
              )
        )));
      },
      resetCharts: () => {
        setCharts(buildDefaultChartsLibrary());
      },
    };
  }, [charts]);

  return (
    <ChartsContext.Provider value={value}>
      {children}
    </ChartsContext.Provider>
  );
}

export function useCharts() {
  return useContext(ChartsContext);
}
