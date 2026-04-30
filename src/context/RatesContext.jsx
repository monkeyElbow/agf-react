import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../lib/dynamicPageBlocks';

const STORAGE_KEY = 'agf-rates-v2';
const CONTENT_ADMIN_STORAGE_KEY = 'agf-content-admin-v1';
const RatesContext = createContext(null);

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
    // v1 storage fallback (single table only)
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

export function RatesProvider({ children }) {
  const [rateTables, setRateTables] = useState(() => {
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
  });

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

  function setLegalCopy(nextLegalCopy) {
    setRateTables((current) => ({
      ...current,
      legalCopy: {
        ...DEFAULT_RATES_LEGAL_COPY_SETTINGS,
        ...(current.legalCopy || {}),
        ...(nextLegalCopy && typeof nextLegalCopy === 'object' ? nextLegalCopy : {}),
      },
    }));
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateTables));
  }, [rateTables]);

  const value = useMemo(
    () => ({
      rates,
      iraRates,
      ratesMeta,
      legalCopy,
      setRates,
      setIraRates,
      setRatesMeta,
      setLegalCopy,
    }),
    [rates, iraRates, ratesMeta, legalCopy],
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
