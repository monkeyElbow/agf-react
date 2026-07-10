import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../lib/ratesLegalCopyDefaults';
import {
  fetchSharedDisclosuresSnapshot,
  isDevContentAuthorityEnabled,
  publishSharedDisclosures,
  resetSharedDisclosures,
  restoreSharedDisclosuresDraftFromLive,
  saveSharedDisclosures,
} from '../lib/devContentAuthorityClient';
import { getOrCreateDevIdentity, toDevIdentitySummary } from '../lib/devIdentity';

const STORAGE_KEY = 'agf-rates-v2';
const CONTENT_ADMIN_STORAGE_KEY = 'agf-content-admin-v1';
const RatesContext = createContext(null);
const SHARED_POLL_INTERVAL_MS = 1500;

function readLegacyRatesLegalCopyFromContentAdminStorage() {
  try {
    const raw = localStorage.getItem(CONTENT_ADMIN_STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : null;
    const ratesBlocks = Array.isArray(payload?.blocksByPath?.['/rates']) ? payload.blocksByPath['/rates'] : [];
    const legacyBlock = ratesBlocks.find((block) => (
      block
      && typeof block === 'object'
      && block.id === 'disclaimer'
      && String(block.kind || '').trim().toLowerCase() === 'legal_copy'
    ));
    const legacySettings = legacyBlock?.settings && typeof legacyBlock.settings === 'object'
      ? legacyBlock.settings
      : null;

    return legacySettings
      ? {
          certificatesHtml: legacySettings.certificatesHtml,
          iraHtml: legacySettings.iraHtml,
        }
      : null;
  } catch {
    return null;
  }
}

function normalizeStoredRatesLegalCopy(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      ...DEFAULT_RATES_LEGAL_COPY_SETTINGS,
      ...(readLegacyRatesLegalCopyFromContentAdminStorage() || {}),
    };
  }

  const legacyLegalCopy = readLegacyRatesLegalCopyFromContentAdminStorage();
  return {
    ...DEFAULT_RATES_LEGAL_COPY_SETTINGS,
    ...(legacyLegalCopy || {}),
    ...(payload.legalCopy && typeof payload.legalCopy === 'object' ? payload.legalCopy : {}),
  };
}

function normalizeStoredRates(payload) {
  if (!payload) {
    return {
      rates: defaultRates,
      iraRates: defaultIraRates,
      ratesMeta: defaultRatesMeta,
      legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
    };
  }

  if (Array.isArray(payload)) {
    return {
      rates: payload,
      iraRates: defaultIraRates,
      ratesMeta: defaultRatesMeta,
      legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
    };
  }

  if (Array.isArray(payload.rates) && Array.isArray(payload.iraRates)) {
    return {
      rates: payload.rates,
      iraRates: payload.iraRates,
      ratesMeta: { ...defaultRatesMeta, ...(payload.ratesMeta || {}) },
      legalCopy: normalizeStoredRatesLegalCopy(payload),
    };
  }

  return {
    rates: defaultRates,
    iraRates: defaultIraRates,
    ratesMeta: defaultRatesMeta,
    legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
  };
}

function readCurrentActorSummary() {
  if (typeof window === 'undefined') {
    return null;
  }
  return toDevIdentitySummary(getOrCreateDevIdentity({
    storage: window.localStorage,
  }));
}

function normalizeSharedLegalCopySnapshot(snapshot) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const legacyLegalCopy = normalizeStoredRatesLegalCopy(source);
  const publishedLegalCopy = normalizeStoredRatesLegalCopy(source.published?.legalCopy || legacyLegalCopy);
  const draftLegalCopy = normalizeStoredRatesLegalCopy(source.draft?.legalCopy || legacyLegalCopy);
  return {
    publishedLegalCopy,
    draftLegalCopy,
    hasUnpublishedChanges: typeof source.hasUnpublishedChanges === 'boolean'
      ? source.hasUnpublishedChanges
      : JSON.stringify(publishedLegalCopy) !== JSON.stringify(draftLegalCopy),
    draftUpdatedAt: Number.isFinite(Number(source.draftUpdatedAt)) ? Number(source.draftUpdatedAt) : 0,
    draftUpdatedBy: source.draftUpdatedBy || null,
    publishedAt: Number.isFinite(Number(source.publishedAt)) ? Number(source.publishedAt) : 0,
    publishedBy: source.publishedBy || null,
  };
}

export function RatesProvider({ children }) {
  const sharedAuthorityEnabled = isDevContentAuthorityEnabled();
  const initialRateTables = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeStoredRates(raw ? JSON.parse(raw) : null);
    } catch {
      return {
        rates: defaultRates,
        iraRates: defaultIraRates,
        ratesMeta: defaultRatesMeta,
        legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
      };
    }
  }, []);
  const [rateTables, setRateTables] = useState(initialRateTables);
  const [draftLegalCopy, setDraftLegalCopyState] = useState(initialRateTables.legalCopy);
  const [hasUnpublishedLegalCopyChanges, setHasUnpublishedLegalCopyChanges] = useState(false);
  const [legalCopyDraftUpdatedAt, setLegalCopyDraftUpdatedAt] = useState(0);
  const [legalCopyDraftUpdatedBy, setLegalCopyDraftUpdatedBy] = useState(null);
  const [legalCopyPublishedAt, setLegalCopyPublishedAt] = useState(0);
  const [legalCopyPublishedBy, setLegalCopyPublishedBy] = useState(null);
  const pendingSharedMutationCountRef = useRef(0);

  const { rates, iraRates, ratesMeta, legalCopy } = rateTables;

  function setRates(nextRates) {
    setRateTables((current) => ({ ...current, rates: nextRates }));
  }

  function setIraRates(nextIraRates) {
    setRateTables((current) => ({ ...current, iraRates: nextIraRates }));
  }

  function setRatesMeta(nextRatesMeta) {
    setRateTables((current) => ({
      ...current,
      ratesMeta: { ...current.ratesMeta, ...nextRatesMeta },
    }));
  }

  function applySharedSnapshot(snapshot, { force = false } = {}) {
    if (!snapshot || (!force && pendingSharedMutationCountRef.current > 0)) {
      return;
    }
    const normalized = normalizeSharedLegalCopySnapshot(snapshot);
    setRateTables((current) => ({
      ...current,
      legalCopy: normalized.publishedLegalCopy,
    }));
    setDraftLegalCopyState(normalized.draftLegalCopy);
    setHasUnpublishedLegalCopyChanges(normalized.hasUnpublishedChanges);
    setLegalCopyDraftUpdatedAt(normalized.draftUpdatedAt);
    setLegalCopyDraftUpdatedBy(normalized.draftUpdatedBy);
    setLegalCopyPublishedAt(normalized.publishedAt);
    setLegalCopyPublishedBy(normalized.publishedBy);
  }

  function setLegalCopy(nextLegalCopy) {
    const normalizedDraft = {
      ...DEFAULT_RATES_LEGAL_COPY_SETTINGS,
      ...(draftLegalCopy || {}),
      ...(nextLegalCopy && typeof nextLegalCopy === 'object' ? nextLegalCopy : {}),
    };
    setDraftLegalCopyState(normalizedDraft);

    if (!sharedAuthorityEnabled) {
      setRateTables((current) => ({
        ...current,
        legalCopy: normalizedDraft,
      }));
      setHasUnpublishedLegalCopyChanges(false);
      return;
    }

    setHasUnpublishedLegalCopyChanges(JSON.stringify(normalizedDraft) !== JSON.stringify(legalCopy));
    pendingSharedMutationCountRef.current += 1;
    void saveSharedDisclosures(
      { legalCopy: normalizedDraft },
      readCurrentActorSummary(),
    )
      .then((snapshot) => {
        applySharedSnapshot(snapshot, { force: true });
      })
      .catch(() => {
        // keep optimistic draft state; polling will reconcile once the shared store is reachable again
      })
      .finally(() => {
        pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
      });
  }

  useEffect(() => {
    if (sharedAuthorityEnabled) {
      return undefined;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateTables));
    return undefined;
  }, [rateTables, sharedAuthorityEnabled]);

  useEffect(() => {
    if (!sharedAuthorityEnabled) {
      return undefined;
    }

    let cancelled = false;

    const syncSnapshot = async ({ force = false } = {}) => {
      try {
        const snapshot = await fetchSharedDisclosuresSnapshot();
        if (cancelled) {
          return;
        }
        applySharedSnapshot(snapshot, { force });
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

  const value = useMemo(
    () => ({
      rates,
      iraRates,
      ratesMeta,
      legalCopy,
      draftLegalCopy,
      setRates,
      setIraRates,
      setRatesMeta,
      setLegalCopy,
      resetDraftLegalCopy: async () => {
        if (!sharedAuthorityEnabled) {
          setDraftLegalCopyState({ ...DEFAULT_RATES_LEGAL_COPY_SETTINGS });
          setRateTables((current) => ({
            ...current,
            legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
          }));
          setHasUnpublishedLegalCopyChanges(false);
          return null;
        }
        pendingSharedMutationCountRef.current += 1;
        try {
          const snapshot = await resetSharedDisclosures(readCurrentActorSummary());
          applySharedSnapshot(snapshot, { force: true });
          return snapshot;
        } finally {
          pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
        }
      },
      restoreDraftLegalCopyFromLive: async () => {
        if (!sharedAuthorityEnabled) {
          setDraftLegalCopyState(legalCopy);
          setHasUnpublishedLegalCopyChanges(false);
          return null;
        }
        pendingSharedMutationCountRef.current += 1;
        try {
          const snapshot = await restoreSharedDisclosuresDraftFromLive(readCurrentActorSummary());
          applySharedSnapshot(snapshot, { force: true });
          return snapshot;
        } finally {
          pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
        }
      },
      publishDraftLegalCopy: async () => {
        if (!sharedAuthorityEnabled) {
          setRateTables((current) => ({
            ...current,
            legalCopy: draftLegalCopy,
          }));
          setHasUnpublishedLegalCopyChanges(false);
          return null;
        }
        pendingSharedMutationCountRef.current += 1;
        try {
          const snapshot = await publishSharedDisclosures(readCurrentActorSummary());
          applySharedSnapshot(snapshot, { force: true });
          return snapshot;
        } finally {
          pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current - 1);
        }
      },
      hasUnpublishedLegalCopyChanges,
      legalCopyDraftUpdatedAt,
      legalCopyDraftUpdatedBy,
      legalCopyPublishedAt,
      legalCopyPublishedBy,
    }),
    [
      draftLegalCopy,
      hasUnpublishedLegalCopyChanges,
      iraRates,
      legalCopy,
      legalCopyDraftUpdatedAt,
      legalCopyDraftUpdatedBy,
      legalCopyPublishedAt,
      legalCopyPublishedBy,
      rates,
      ratesMeta,
      sharedAuthorityEnabled,
    ],
  );
  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export function useRates() {
  const ctx = useContext(RatesContext);
  if (!ctx) {
    throw new Error('useRates must be used inside RatesProvider');
  }
  return ctx;
}
