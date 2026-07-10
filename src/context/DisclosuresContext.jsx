import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildDefaultDisclosuresLibrary } from '../data/disclosuresLibrarySeed';
import {
  fetchSharedDisclosuresSnapshot,
  isDevContentAuthorityEnabled,
  publishSharedDisclosures,
  resetSharedDisclosures,
  restoreSharedDisclosuresDraftFromLive,
  saveSharedDisclosures,
} from '../lib/devContentAuthorityClient';
import { getOrCreateDevIdentity, toDevIdentitySummary } from '../lib/devIdentity';

const STORAGE_KEY = 'agf-disclosures-library-v1';
const SHARED_POLL_INTERVAL_MS = 1500;

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

function readCurrentActorSummary() {
  if (typeof window === 'undefined') {
    return null;
  }
  return toDevIdentitySummary(getOrCreateDevIdentity({
    storage: window.localStorage,
  }));
}

function areDisclosureSetsEqual(left, right) {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function normalizeSharedSnapshot(snapshot) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const legacy = normalizeDisclosureLibrary(source.disclosures);
  const publishedDisclosures = normalizeDisclosureLibrary(source.published?.disclosures || legacy);
  const draftDisclosures = normalizeDisclosureLibrary(source.draft?.disclosures || legacy);
  return {
    publishedDisclosures,
    draftDisclosures,
    hasUnpublishedChanges: typeof source.hasUnpublishedChanges === 'boolean'
      ? source.hasUnpublishedChanges
      : !areDisclosureSetsEqual(draftDisclosures, publishedDisclosures),
    draftUpdatedAt: Number.isFinite(Number(source.draftUpdatedAt)) ? Number(source.draftUpdatedAt) : 0,
    draftUpdatedBy: source.draftUpdatedBy || null,
    publishedAt: Number.isFinite(Number(source.publishedAt)) ? Number(source.publishedAt) : 0,
    publishedBy: source.publishedBy || null,
  };
}

const defaultDisclosureLibrary = buildDefaultDisclosuresLibrary();
const defaultDisclosuresValue = {
  disclosures: defaultDisclosureLibrary,
  draftDisclosures: defaultDisclosureLibrary,
  getDisclosure: (id) => defaultDisclosureLibrary.find((entry) => entry.id === String(id || '').trim()) || null,
  getDisclosureValue: (id, fallback = null) => {
    const entry = defaultDisclosureLibrary.find((item) => item.id === String(id || '').trim()) || null;
    return entry ? cloneValue(entry.value) : cloneValue(fallback);
  },
  updateDisclosure: () => {},
  resetDisclosures: () => {},
  restoreDisclosureDraftFromLive: async () => null,
  publishDisclosures: async () => null,
  hasUnpublishedDisclosureChanges: false,
  draftUpdatedAt: 0,
  draftUpdatedBy: null,
  publishedAt: 0,
  publishedBy: null,
};

const DisclosuresContext = createContext(defaultDisclosuresValue);

export function DisclosuresProvider({ children }) {
  const sharedAuthorityEnabled = isDevContentAuthorityEnabled();
  const initialDisclosures = useMemo(readInitialDisclosures, []);
  const [publishedDisclosures, setPublishedDisclosures] = useState(initialDisclosures);
  const [draftDisclosures, setDraftDisclosures] = useState(initialDisclosures);
  const [hasUnpublishedDisclosureChanges, setHasUnpublishedDisclosureChanges] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState(0);
  const [draftUpdatedBy, setDraftUpdatedBy] = useState(null);
  const [publishedAt, setPublishedAt] = useState(0);
  const [publishedBy, setPublishedBy] = useState(null);
  const pendingSharedMutationCountRef = useRef(0);

  useEffect(() => {
    if (sharedAuthorityEnabled) {
      return undefined;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftDisclosures));
    } catch {
      // ignore storage write failures
    }
    return undefined;
  }, [draftDisclosures, sharedAuthorityEnabled]);

  useEffect(() => {
    if (!sharedAuthorityEnabled) {
      return undefined;
    }

    let cancelled = false;

    const applySnapshot = (snapshot, { force = false } = {}) => {
      if (cancelled || !snapshot) {
        return;
      }
      if (!force && pendingSharedMutationCountRef.current > 0) {
        return;
      }
      const normalized = normalizeSharedSnapshot(snapshot);
      setPublishedDisclosures(normalized.publishedDisclosures);
      setDraftDisclosures(normalized.draftDisclosures);
      setHasUnpublishedDisclosureChanges(normalized.hasUnpublishedChanges);
      setDraftUpdatedAt(normalized.draftUpdatedAt);
      setDraftUpdatedBy(normalized.draftUpdatedBy);
      setPublishedAt(normalized.publishedAt);
      setPublishedBy(normalized.publishedBy);
    };

    const syncSnapshot = async ({ force = false } = {}) => {
      try {
        const snapshot = await fetchSharedDisclosuresSnapshot();
        applySnapshot(snapshot, { force });
      } catch {
        // ignore dev sync failures and keep the last known snapshot
      }
    };

    void syncSnapshot({ force: true });
    const intervalId = window.setInterval(() => {
      void syncSnapshot();
    }, SHARED_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [sharedAuthorityEnabled]);

  const value = useMemo(() => {
    const publishedById = new Map(publishedDisclosures.map((entry) => [entry.id, entry]));
    return {
      disclosures: publishedDisclosures,
      draftDisclosures,
      getDisclosure: (id) => publishedById.get(String(id || '').trim()) || null,
      getDisclosureValue: (id, fallback = null) => {
        const entry = publishedById.get(String(id || '').trim()) || null;
        return entry ? cloneValue(entry.value) : cloneValue(fallback);
      },
      updateDisclosure: (id, nextValue) => {
        const token = String(id || '').trim();
        if (!token) {
          return;
        }
        const nextDraftEntries = draftDisclosures.map((entry) => (
          entry.id !== token
            ? entry
            : {
                ...entry,
                value: normalizeDisclosureValue(entry.format, nextValue, entry.value),
              }
        ));
        setDraftDisclosures(nextDraftEntries);
        if (!sharedAuthorityEnabled) {
          setPublishedDisclosures(nextDraftEntries);
          setHasUnpublishedDisclosureChanges(false);
          return;
        }
        setHasUnpublishedDisclosureChanges(!areDisclosureSetsEqual(nextDraftEntries, publishedDisclosures));
        pendingSharedMutationCountRef.current += 1;
        void saveSharedDisclosures(
          { disclosures: nextDraftEntries },
          readCurrentActorSummary(),
        )
          .then((snapshot) => {
            const normalized = normalizeSharedSnapshot(snapshot);
            setPublishedDisclosures(normalized.publishedDisclosures);
            setDraftDisclosures(normalized.draftDisclosures);
            setHasUnpublishedDisclosureChanges(normalized.hasUnpublishedChanges);
            setDraftUpdatedAt(normalized.draftUpdatedAt);
            setDraftUpdatedBy(normalized.draftUpdatedBy);
            setPublishedAt(normalized.publishedAt);
            setPublishedBy(normalized.publishedBy);
          })
          .catch(() => {
            // keep optimistic draft state; polling will reconcile once the shared store is reachable again
          })
          .finally(() => {
            pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
          });
      },
      resetDisclosures: () => {
        const defaults = buildDefaultDisclosuresLibrary();
        setDraftDisclosures(defaults);
        if (!sharedAuthorityEnabled) {
          setPublishedDisclosures(defaults);
          setHasUnpublishedDisclosureChanges(false);
          return;
        }
        setHasUnpublishedDisclosureChanges(!areDisclosureSetsEqual(defaults, publishedDisclosures));
        pendingSharedMutationCountRef.current += 1;
        void resetSharedDisclosures(readCurrentActorSummary())
          .then((snapshot) => {
            const normalized = normalizeSharedSnapshot(snapshot);
            setPublishedDisclosures(normalized.publishedDisclosures);
            setDraftDisclosures(normalized.draftDisclosures);
            setHasUnpublishedDisclosureChanges(normalized.hasUnpublishedChanges);
            setDraftUpdatedAt(normalized.draftUpdatedAt);
            setDraftUpdatedBy(normalized.draftUpdatedBy);
            setPublishedAt(normalized.publishedAt);
            setPublishedBy(normalized.publishedBy);
          })
          .catch(() => {
            // keep optimistic draft state; polling will reconcile once the shared store is reachable again
          })
          .finally(() => {
            pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
          });
      },
      restoreDisclosureDraftFromLive: async () => {
        if (!sharedAuthorityEnabled) {
          setDraftDisclosures(publishedDisclosures);
          setHasUnpublishedDisclosureChanges(false);
          return null;
        }
        pendingSharedMutationCountRef.current += 1;
        try {
          const snapshot = await restoreSharedDisclosuresDraftFromLive(readCurrentActorSummary());
          const normalized = normalizeSharedSnapshot(snapshot);
          setPublishedDisclosures(normalized.publishedDisclosures);
          setDraftDisclosures(normalized.draftDisclosures);
          setHasUnpublishedDisclosureChanges(normalized.hasUnpublishedChanges);
          setDraftUpdatedAt(normalized.draftUpdatedAt);
          setDraftUpdatedBy(normalized.draftUpdatedBy);
          setPublishedAt(normalized.publishedAt);
          setPublishedBy(normalized.publishedBy);
          return snapshot;
        } finally {
          pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
        }
      },
      publishDisclosures: async () => {
        if (!sharedAuthorityEnabled) {
          setPublishedDisclosures(draftDisclosures);
          setHasUnpublishedDisclosureChanges(false);
          return null;
        }
        pendingSharedMutationCountRef.current += 1;
        try {
          const snapshot = await publishSharedDisclosures(readCurrentActorSummary());
          const normalized = normalizeSharedSnapshot(snapshot);
          setPublishedDisclosures(normalized.publishedDisclosures);
          setDraftDisclosures(normalized.draftDisclosures);
          setHasUnpublishedDisclosureChanges(normalized.hasUnpublishedChanges);
          setDraftUpdatedAt(normalized.draftUpdatedAt);
          setDraftUpdatedBy(normalized.draftUpdatedBy);
          setPublishedAt(normalized.publishedAt);
          setPublishedBy(normalized.publishedBy);
          return snapshot;
        } finally {
          pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
        }
      },
      hasUnpublishedDisclosureChanges,
      draftUpdatedAt,
      draftUpdatedBy,
      publishedAt,
      publishedBy,
    };
  }, [
    draftDisclosures,
    draftUpdatedAt,
    draftUpdatedBy,
    hasUnpublishedDisclosureChanges,
    publishedAt,
    publishedBy,
    publishedDisclosures,
    sharedAuthorityEnabled,
  ]);

  return (
    <DisclosuresContext.Provider value={value}>
      {children}
    </DisclosuresContext.Provider>
  );
}

export function useDisclosures() {
  return useContext(DisclosuresContext);
}
