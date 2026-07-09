import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildDefaultDisclosuresLibrary } from '../data/disclosuresLibrarySeed';

const STORAGE_KEY = 'agf-disclosures-library-v1';

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeDisclosureValue(format, value, fallbackValue) {
  if (format === 'lines') {
    if (Array.isArray(value)) {
      const normalized = value.map((entry) => String(entry || '').trim()).filter(Boolean);
      return normalized.length ? normalized : (Array.isArray(fallbackValue) ? [...fallbackValue] : []);
    }
    const source = String(value || '').trim();
    return source ? [source] : (Array.isArray(fallbackValue) ? [...fallbackValue] : []);
  }
  const normalized = String(value || '').trim();
  if (normalized) {
    return normalized;
  }
  return typeof fallbackValue === 'string' ? fallbackValue : '';
}

function normalizeDisclosureEntry(rawEntry, defaultEntry = null) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const fallback = defaultEntry && typeof defaultEntry === 'object' ? defaultEntry : {};
  const format = ['html', 'lines', 'text'].includes(String(source.format || fallback.format || '').trim())
    ? String(source.format || fallback.format || '').trim()
    : 'text';
  return {
    id: normalizeString(source.id || fallback.id),
    title: normalizeString(source.title || fallback.title),
    group: normalizeString(source.group || fallback.group) || 'General',
    scope: normalizeString(source.scope || fallback.scope) || 'product',
    format,
    usage: normalizeString(source.usage || fallback.usage),
    tokenHelp: Array.isArray(source.tokenHelp)
      ? source.tokenHelp.map((entry) => String(entry || '').trim()).filter(Boolean)
      : (Array.isArray(fallback.tokenHelp) ? [...fallback.tokenHelp] : []),
    value: normalizeDisclosureValue(format, source.value, fallback.value),
  };
}

function normalizeDisclosureLibrary(payload) {
  const defaults = buildDefaultDisclosuresLibrary();
  const source = Array.isArray(payload) ? payload : [];
  const sourceById = new Map(
    source
      .map((entry) => normalizeDisclosureEntry(entry))
      .filter((entry) => entry.id)
      .map((entry) => [entry.id, entry]),
  );
  return defaults.map((defaultEntry) => normalizeDisclosureEntry(sourceById.get(defaultEntry.id), defaultEntry));
}

function readInitialDisclosures() {
  if (typeof window === 'undefined') {
    return buildDefaultDisclosuresLibrary();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildDefaultDisclosuresLibrary();
    }
    return normalizeDisclosureLibrary(JSON.parse(raw));
  } catch {
    return buildDefaultDisclosuresLibrary();
  }
}

const defaultDisclosureLibrary = buildDefaultDisclosuresLibrary();
const defaultDisclosuresValue = {
  disclosures: defaultDisclosureLibrary,
  getDisclosure: (id) => defaultDisclosureLibrary.find((entry) => entry.id === String(id || '').trim()) || null,
  getDisclosureValue: (id, fallback = null) => {
    const entry = defaultDisclosureLibrary.find((item) => item.id === String(id || '').trim()) || null;
    return entry ? cloneValue(entry.value) : cloneValue(fallback);
  },
  updateDisclosure: () => {},
  resetDisclosures: () => {},
};

const DisclosuresContext = createContext(defaultDisclosuresValue);

export function DisclosuresProvider({ children }) {
  const [disclosures, setDisclosures] = useState(readInitialDisclosures);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(disclosures));
    } catch {
      // ignore storage write failures
    }
  }, [disclosures]);

  const value = useMemo(() => {
    const byId = new Map(disclosures.map((entry) => [entry.id, entry]));
    return {
      disclosures,
      getDisclosure: (id) => byId.get(String(id || '').trim()) || null,
      getDisclosureValue: (id, fallback = null) => {
        const entry = byId.get(String(id || '').trim()) || null;
        return entry ? cloneValue(entry.value) : cloneValue(fallback);
      },
      updateDisclosure: (id, nextValue) => {
        const token = String(id || '').trim();
        if (!token) {
          return;
        }
        setDisclosures((current) => current.map((entry) => (
          entry.id !== token
            ? entry
            : {
                ...entry,
                value: normalizeDisclosureValue(entry.format, nextValue, entry.value),
              }
        )));
      },
      resetDisclosures: () => {
        setDisclosures(buildDefaultDisclosuresLibrary());
      },
    };
  }, [disclosures]);

  return (
    <DisclosuresContext.Provider value={value}>
      {children}
    </DisclosuresContext.Provider>
  );
}

export function useDisclosures() {
  return useContext(DisclosuresContext);
}
