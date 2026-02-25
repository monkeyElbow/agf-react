import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'agf-consultants-admin-v1';
const ConsultantsContext = createContext(null);

const loanConsultantStatesByRegion = {
  northwest: ['AK', 'ID', 'MT', 'ND', 'OR', 'SD', 'UT', 'WA', 'WY'],
  south: ['AL', 'FL', 'GA', 'LA', 'MS', 'SC', 'TN'],
  southCentral: ['AR', 'KS', 'MO', 'NM', 'OK', 'TX'],
  southwest: ['AZ', 'CA', 'CO', 'HI', 'NV'],
  northCentral: ['IA', 'IL', 'IN', 'MI', 'MN', 'NE', 'OH', 'WI'],
  east: ['CT', 'DC', 'DE', 'KY', 'MA', 'MD', 'ME', 'NC', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV'],
};

const retirementConsultantStatesByRegion = {
  west: ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
  central: ['AR', 'IA', 'IL', 'IN', 'KS', 'LA', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'OK', 'SD', 'TX', 'WI'],
  east: ['AL', 'CT', 'DC', 'DE', 'FL', 'GA', 'KY', 'MA', 'MD', 'ME', 'MS', 'NC', 'NH', 'NJ', 'NY', 'PA', 'RI', 'SC', 'TN', 'VA', 'VT', 'WV'],
};

const defaultConsultantsByService = {
  loans: [
    {
      id: 'loan-emily-brinkley',
      name: 'Emily Brinkley',
      region: 'Northwest Region',
      phone: '417.447.2444',
      email: 'ebrinkley@agfinancial.org',
      states: loanConsultantStatesByRegion.northwest,
    },
    {
      id: 'loan-bruce-gibbons',
      name: 'Bruce Gibbons',
      region: 'South Region',
      phone: '417.860.4176',
      email: 'bgibbons@agfinancial.org',
      states: loanConsultantStatesByRegion.south,
    },
    {
      id: 'loan-jason-gibbons',
      name: 'Jason Gibbons',
      region: 'South Central Region',
      phone: '417.860.6842',
      email: 'jgibbons@agfinancial.org',
      states: loanConsultantStatesByRegion.southCentral,
    },
    {
      id: 'loan-jason-hopping',
      name: 'Jason Hopping',
      region: 'Southwest Region',
      phone: '858.349.5728',
      email: 'jhopping@agfinancial.org',
      states: loanConsultantStatesByRegion.southwest,
    },
    {
      id: 'loan-randy-smith',
      name: 'Randy Smith',
      region: 'North Central Region',
      phone: '417.860.8174',
      email: 'rsmith@agfinancial.org',
      states: loanConsultantStatesByRegion.northCentral,
    },
    {
      id: 'loan-pat-williams',
      name: 'Pat Williams',
      region: 'East Region',
      phone: '334.318.6237',
      email: 'pwilliams@agfinancial.org',
      states: loanConsultantStatesByRegion.east,
    },
  ],
  retirement: [
    {
      id: 'retirement-tim-mcdowell',
      name: 'Tim McDowell',
      region: 'West Region',
      phone: '417.379.4274',
      email: 'tmcdowell@agfinancial.org',
      states: retirementConsultantStatesByRegion.west,
    },
    {
      id: 'retirement-jacob-rebert',
      name: 'Jacob Rebert CFP',
      region: 'Central Region',
      phone: '417.350.5480',
      email: 'jrebert@agfinancial.org',
      states: retirementConsultantStatesByRegion.central,
    },
    {
      id: 'retirement-chris-teague',
      name: 'Chris Teague CFP',
      region: 'East Region',
      phone: '417.619.2987',
      email: 'cteague@agfinancial.org',
      states: retirementConsultantStatesByRegion.east,
    },
  ],
};

function makeId(service) {
  return `${service}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeStates(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const next = value
    .map((item) => String(item || '').trim().toUpperCase())
    .filter((item) => /^[A-Z]{2}$/.test(item));
  return Array.from(new Set(next));
}

function normalizeConsultant(service, payload) {
  const item = payload && typeof payload === 'object' ? payload : {};
  return {
    id: String(item.id || makeId(service)),
    name: String(item.name || '').trim(),
    region: String(item.region || '').trim(),
    phone: String(item.phone || '').trim(),
    email: String(item.email || '').trim(),
    states: normalizeStates(item.states),
  };
}

function normalizeServiceList(service, value) {
  const defaultById = Object.fromEntries(
    defaultConsultantsByService[service].map((item) => [item.id, item]),
  );

  if (!Array.isArray(value)) {
    return defaultConsultantsByService[service].map((item) => ({ ...item }));
  }

  return value.map((item) => {
    const normalized = normalizeConsultant(service, item);
    if (!normalized.email) {
      normalized.email = String(defaultById[normalized.id]?.email || '').trim();
    }
    return normalized;
  });
}

function normalizeConsultantsPayload(payload) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  return {
    loans: normalizeServiceList('loans', safe.loans),
    retirement: normalizeServiceList('retirement', safe.retirement),
  };
}

function readInitialConsultants() {
  if (typeof window === 'undefined') {
    return normalizeConsultantsPayload(null);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeConsultantsPayload(null);
    }
    return normalizeConsultantsPayload(JSON.parse(raw));
  } catch {
    return normalizeConsultantsPayload(null);
  }
}

export function ConsultantsProvider({ children }) {
  const [consultantsByService, setConsultantsByService] = useState(readInitialConsultants);

  const value = useMemo(() => {
    const persist = (nextValue) => {
      const normalized = normalizeConsultantsPayload(nextValue);
      setConsultantsByService(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage failures
      }
    };

    return {
      consultantsByService,
      getConsultants: (service) => consultantsByService[service] || [],
      addConsultant: (service) => {
        if (!consultantsByService[service]) {
          return null;
        }
        const nextItem = normalizeConsultant(service, {
          id: makeId(service),
          name: 'New Consultant',
          region: '',
          phone: '',
          email: '',
          states: [],
        });
        persist({
          ...consultantsByService,
          [service]: [...consultantsByService[service], nextItem],
        });
        return nextItem.id;
      },
      updateConsultant: (service, id, patch) => {
        if (!consultantsByService[service]) {
          return;
        }
        const nextList = consultantsByService[service].map((item) => {
          if (item.id !== id) {
            return item;
          }
          const merged = { ...item, ...(patch || {}) };
          return normalizeConsultant(service, merged);
        });
        persist({
          ...consultantsByService,
          [service]: nextList,
        });
      },
      removeConsultant: (service, id) => {
        if (!consultantsByService[service]) {
          return;
        }
        persist({
          ...consultantsByService,
          [service]: consultantsByService[service].filter((item) => item.id !== id),
        });
      },
      resetConsultants: () => persist(defaultConsultantsByService),
    };
  }, [consultantsByService]);

  return <ConsultantsContext.Provider value={value}>{children}</ConsultantsContext.Provider>;
}

export function useConsultants() {
  const context = useContext(ConsultantsContext);
  if (!context) {
    throw new Error('useConsultants must be used within ConsultantsProvider');
  }
  return context;
}
