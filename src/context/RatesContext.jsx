import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../lib/ratesLegalCopyDefaults';
import {
  fetchSharedDisclosuresSnapshot,
  fetchPublishedContentRouteSnapshot,
  isDevContentAuthorityEnabled,
  publishSharedDisclosures,
  resetSharedDisclosures,
} from '../lib/devContentAuthorityRuntime';
import { getOrCreateDevIdentity, toDevIdentitySummary } from '../lib/devIdentity';
import { useOptionalContentAdmin } from './ContentAdminContextCore';
import { RATES_CONTENT_PATH, readRatesTablesFromBlocks } from '../lib/ratesBlockData';

const LEGACY_RATES_STORAGE_KEY = 'agf-rates-v2';
const CONTENT_ADMIN_STORAGE_KEY = 'agf-content-admin-v1';
const RatesContext = createContext(null);
const SHARED_POLL_INTERVAL_MS = 1500;
const PUBLISHED_RATES_REFRESH_INTERVAL_MS = 15000;

function readPublishedRouteBlocks(snapshot, pathname) {
  const source = snapshot?.baseSnapshot || snapshot?.state || {};
  const blocks = source?.blocksByPath?.[pathname];
  return Array.isArray(blocks) ? blocks : null;
}

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
  const contentAdmin = useOptionalContentAdmin();
  const contentAdminRateBlocks = contentAdmin?.blocksByPath?.[RATES_CONTENT_PATH];
  // The lightweight public provider deliberately loads only the visible page.
  // Rates are global content, though, so routes such as Investments need their
  // own published /rates feed rather than falling back to code defaults.
  const isLightweightPublicContext = !Array.isArray(
    contentAdmin?.authoringBlocksByPath?.[RATES_CONTENT_PATH],
  );
  const [publishedRateBlocks, setPublishedRateBlocks] = useState(null);
  const rateTables = useMemo(
    () => readRatesTablesFromBlocks(
      isLightweightPublicContext
        ? (publishedRateBlocks || contentAdminRateBlocks)
        : contentAdminRateBlocks,
    ),
    [contentAdminRateBlocks, isLightweightPublicContext, publishedRateBlocks],
  );
  const initialLegalCopy = useMemo(() => {
    try {
      const raw = localStorage.getItem(LEGACY_RATES_STORAGE_KEY);
      return normalizeStoredRatesLegalCopy(raw ? JSON.parse(raw) : null);
    } catch {
      return { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS };
    }
  }, []);
  const [legalCopy, setLegalCopyState] = useState(initialLegalCopy);
  const [draftLegalCopy, setDraftLegalCopyState] = useState(initialLegalCopy);
  const [hasUnpublishedLegalCopyChanges, setHasUnpublishedLegalCopyChanges] = useState(false);
  const [legalCopyDraftUpdatedAt, setLegalCopyDraftUpdatedAt] = useState(0);
  const [legalCopyDraftUpdatedBy, setLegalCopyDraftUpdatedBy] = useState(null);
  const [legalCopyPublishedAt, setLegalCopyPublishedAt] = useState(0);
  const [legalCopyPublishedBy, setLegalCopyPublishedBy] = useState(null);
  const pendingSharedMutationCountRef = useRef(0);
  const hasLocalLegalCopyChangesRef = useRef(false);

  const { rates, iraRates, ratesMeta } = rateTables;

  function applySharedSnapshot(snapshot, { force = false } = {}) {
    if (!snapshot || (!force && (
      pendingSharedMutationCountRef.current > 0 || hasLocalLegalCopyChangesRef.current
    ))) {
      return;
    }
    const normalized = normalizeSharedLegalCopySnapshot(snapshot);
    setLegalCopyState(normalized.publishedLegalCopy);
    setDraftLegalCopyState(normalized.publishedLegalCopy);
    setHasUnpublishedLegalCopyChanges(false);
    hasLocalLegalCopyChangesRef.current = false;
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
      setLegalCopyState(normalizedDraft);
      setHasUnpublishedLegalCopyChanges(false);
      return;
    }

    setHasUnpublishedLegalCopyChanges(JSON.stringify(normalizedDraft) !== JSON.stringify(legalCopy));
    hasLocalLegalCopyChangesRef.current = JSON.stringify(normalizedDraft) !== JSON.stringify(legalCopy);
  }

  useEffect(() => {
    if (!sharedAuthorityEnabled || !isLightweightPublicContext) {
      return undefined;
    }

    let cancelled = false;
    const syncPublishedRates = async () => {
      try {
        const snapshot = await fetchPublishedContentRouteSnapshot(RATES_CONTENT_PATH);
        const blocks = readPublishedRouteBlocks(snapshot, RATES_CONTENT_PATH);
        if (!cancelled && blocks) {
          setPublishedRateBlocks(blocks);
        }
      } catch {
        // Keep the most recent published values if the development authority
        // is briefly unavailable.
      }
    };

    void syncPublishedRates();
    const intervalId = window.setInterval(() => {
      void syncPublishedRates();
    }, PUBLISHED_RATES_REFRESH_INTERVAL_MS);
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncPublishedRates();
      }
    };
    window.addEventListener('focus', syncPublishedRates);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncPublishedRates);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [isLightweightPublicContext, sharedAuthorityEnabled]);

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
      setLegalCopy,
      applyLegalCopySnapshot: (snapshot) => applySharedSnapshot(snapshot, { force: true }),
      resetDraftLegalCopy: async () => {
        if (!sharedAuthorityEnabled) {
          setDraftLegalCopyState({ ...DEFAULT_RATES_LEGAL_COPY_SETTINGS });
          setLegalCopyState({ ...DEFAULT_RATES_LEGAL_COPY_SETTINGS });
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
        setDraftLegalCopyState(legalCopy);
        setHasUnpublishedLegalCopyChanges(false);
        hasLocalLegalCopyChangesRef.current = false;
        return null;
      },
      publishDraftLegalCopy: async () => {
        if (!sharedAuthorityEnabled) {
          setLegalCopyState(draftLegalCopy);
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
