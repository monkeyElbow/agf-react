import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultIraRates, defaultRates, defaultRatesMeta } from '../data/ratesDefault';

const STORAGE_KEY = 'agf-rates-v2';
const RatesContext = createContext(null);

function normalizeStoredRates(payload) {
  if (!payload) {
    return { rates: defaultRates, iraRates: defaultIraRates, ratesMeta: defaultRatesMeta };
  }

  if (Array.isArray(payload)) {
    // v1 storage fallback (single table only)
    return { rates: payload, iraRates: defaultIraRates, ratesMeta: defaultRatesMeta };
  }

  if (Array.isArray(payload.rates) && Array.isArray(payload.iraRates)) {
    return {
      rates: payload.rates,
      iraRates: payload.iraRates,
      ratesMeta: { ...defaultRatesMeta, ...(payload.ratesMeta || {}) },
    };
  }

  return { rates: defaultRates, iraRates: defaultIraRates, ratesMeta: defaultRatesMeta };
}

export function RatesProvider({ children }) {
  const [rateTables, setRateTables] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeStoredRates(raw ? JSON.parse(raw) : null);
    } catch {
      return { rates: defaultRates, iraRates: defaultIraRates, ratesMeta: defaultRatesMeta };
    }
  });

  const { rates, iraRates, ratesMeta } = rateTables;

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateTables));
  }, [rateTables]);

  const value = useMemo(
    () => ({
      rates,
      iraRates,
      ratesMeta,
      setRates,
      setIraRates,
      setRatesMeta,
    }),
    [rates, iraRates, ratesMeta],
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
