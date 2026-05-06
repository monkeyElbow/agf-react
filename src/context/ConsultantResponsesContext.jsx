import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'agf-consultant-responses-demo-v1';
const MAX_ITEMS = 250;
const ConsultantResponsesContext = createContext(null);

function normalizeResponseItem(item) {
  const source = item && typeof item === 'object' ? item : {};
  const submittedAt = String(source.submittedAt || '').trim();
  const normalizedAt = submittedAt || new Date().toISOString();
  return {
    id: String(source.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    submittedAt: normalizedAt,
    pagePath: String(source.pagePath || '').trim(),
    service: String(source.service || '').trim(),
    inquiryLabel: String(source.inquiryLabel || '').trim(),
    consultantName: String(source.consultantName || '').trim(),
    consultantEmail: String(source.consultantEmail || '').trim(),
    fromName: String(source.fromName || '').trim(),
    fromEmail: String(source.fromEmail || '').trim(),
    message: String(source.message || '').trim(),
    salesforceUrl: String(source.salesforceUrl || '').trim(),
  };
}

function normalizeResponseList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeResponseItem(item))
    .filter((item) => item.consultantName || item.fromName || item.message)
    .slice(0, MAX_ITEMS);
}

function readInitialState() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return normalizeResponseList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function ConsultantResponsesProvider({ children }) {
  const [responses, setResponses] = useState(readInitialState);

  const value = useMemo(() => {
    const persist = (updater) => {
      setResponses((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const normalized = normalizeResponseList(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch {
          // ignore local storage failures
        }
        return normalized;
      });
    };

    return {
      responses,
      addResponse: (payload) => {
        const normalized = normalizeResponseItem(payload);
        persist((prev) => [normalized, ...prev].slice(0, MAX_ITEMS));
      },
      clearResponses: () => persist([]),
    };
  }, [responses]);

  return (
    <ConsultantResponsesContext.Provider value={value}>
      {children}
    </ConsultantResponsesContext.Provider>
  );
}

export function useConsultantResponses() {
  const context = useContext(ConsultantResponsesContext);
  if (!context) {
    throw new Error('useConsultantResponses must be used within ConsultantResponsesProvider');
  }
  return context;
}
