import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'agf-careers-jobs-v1';
const DEFAULT_APPLY_URL = 'https://workforcenow.adp.com/mascsr/default/mdf/recruitment/recruitment.html?cid=8c8cb88c-f3c9-4ceb-ae10-05cce7cdd3f7&ccId=19000101_000001&jobId=969925&source=CC2&lang=en_US';

const defaultJobs = [
  {
    id: 'job-accounting-clerk',
    title: 'Accounting Clerk',
    location: '',
    summary: 'The Accounting Clerk will perform a variety of retirement plan accounting tasks including processing distributions and retirement loans. The desired candidate will be skilled in maintaining accurate records and preparing reports, while providing exceptional support to both clients and internal teams.',
    note: 'This position is responsible to and reports directly to the Retirement Accounting Manager.',
    applyUrl: DEFAULT_APPLY_URL,
    buttonLabel: 'Apply Online',
    postedDate: '2026-02-01',
    publishAt: '2026-02-01',
    expireAt: '',
    isPublished: true,
    displayOrder: 10,
  },
  {
    id: 'job-maintenance-expert',
    title: 'Maintenance Expert',
    location: '',
    summary: 'The Accounting Clerk will perform a variety of retirement plan accounting tasks including processing distributions and retirement loans. The desired candidate will be skilled in maintaining accurate records and preparing reports, while providing exceptional support to both clients and internal teams.',
    note: 'This position is responsible to and reports directly to the Retirement Accounting Manager.',
    applyUrl: DEFAULT_APPLY_URL,
    buttonLabel: 'Apply Online',
    postedDate: '2026-02-01',
    publishAt: '2026-02-01',
    expireAt: '',
    isPublished: true,
    displayOrder: 20,
  },
];

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function toBool(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  return fallback;
}

function normalizeJob(item, index = 0) {
  const payload = item && typeof item === 'object' ? item : {};
  return {
    id: String(payload.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    title: String(payload.title || 'New Role').trim(),
    location: String(payload.location || '').trim(),
    summary: String(payload.summary || '').trim(),
    note: String(payload.note || '').trim(),
    applyUrl: String(payload.applyUrl || '').trim(),
    buttonLabel: String(payload.buttonLabel || 'Apply Online').trim() || 'Apply Online',
    postedDate: normalizeDate(payload.postedDate),
    publishAt: normalizeDate(payload.publishAt),
    expireAt: normalizeDate(payload.expireAt),
    isPublished: toBool(payload.isPublished, true),
    displayOrder: Number.isFinite(Number(payload.displayOrder)) ? Number(payload.displayOrder) : (index + 1) * 10,
  };
}

function sortJobs(jobs) {
  return [...jobs].sort((a, b) => {
    const orderDelta = (a.displayOrder || 0) - (b.displayOrder || 0);
    if (orderDelta !== 0) {
      return orderDelta;
    }
    return a.title.localeCompare(b.title);
  });
}

function normalizePayload(payload) {
  const list = Array.isArray(payload) ? payload : defaultJobs;
  return sortJobs(list.map((item, index) => normalizeJob(item, index)));
}

function readInitialJobs() {
  if (typeof window === 'undefined') {
    return normalizePayload(null);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizePayload(null);
    }
    return normalizePayload(JSON.parse(raw));
  } catch {
    return normalizePayload(null);
  }
}

function isVisibleNow(job, now = new Date()) {
  if (!job.isPublished) {
    return false;
  }

  const nowTime = now.getTime();

  if (job.publishAt) {
    const publishTime = Date.parse(`${job.publishAt}T00:00:00`);
    if (!Number.isNaN(publishTime) && nowTime < publishTime) {
      return false;
    }
  }

  if (job.expireAt) {
    const expireTime = Date.parse(`${job.expireAt}T23:59:59`);
    if (!Number.isNaN(expireTime) && nowTime > expireTime) {
      return false;
    }
  }

  return true;
}

const defaultCareersJobsValue = {
  jobs: defaultJobs,
  addJob: () => null,
  updateJob: () => {},
  deleteJob: () => {},
  duplicateJob: () => null,
  resetJobs: () => {},
  getVisibleJobs: (now = new Date()) => sortJobs(defaultJobs.filter((item) => isVisibleNow(item, now))),
  isVisibleNow,
};

const CareersJobsContext = createContext(defaultCareersJobsValue);

export function CareersJobsProvider({ children }) {
  const [jobs, setJobs] = useState(readInitialJobs);

  const value = useMemo(() => {
    const persist = (updater) => {
      setJobs((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const normalized = normalizePayload(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch {
          // ignore storage write failures
        }
        return normalized;
      });
    };

    return {
      jobs,
      addJob: () => {
        const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        persist((prev) => {
          const nextOrder = prev.length ? Math.max(...prev.map((item) => item.displayOrder || 0)) + 10 : 10;
          const nextJob = normalizeJob({
            id,
            title: 'New Role',
            location: '',
            summary: '',
            note: '',
            applyUrl: DEFAULT_APPLY_URL,
            buttonLabel: 'Apply Online',
            postedDate: normalizeDate(new Date().toISOString()),
            publishAt: '',
            expireAt: '',
            isPublished: false,
            displayOrder: nextOrder,
          }, prev.length);
          return [...prev, nextJob];
        });
        return id;
      },
      updateJob: (id, patch) => {
        if (!id) {
          return;
        }
        persist((prev) => prev.map((item) =>
          item.id !== id
            ? item
            : normalizeJob({ ...item, ...(patch || {}) }),
        ));
      },
      deleteJob: (id) => {
        if (!id) {
          return;
        }
        persist((prev) => prev.filter((item) => item.id !== id));
      },
      duplicateJob: (id) => {
        const source = jobs.find((item) => item.id === id);
        if (!source) {
          return null;
        }
        const cloneId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        persist((prev) => {
          const clone = normalizeJob({
            ...source,
            id: cloneId,
            title: `${source.title} (Copy)`,
            isPublished: false,
            publishAt: '',
            expireAt: '',
            displayOrder: (source.displayOrder || 0) + 1,
          });
          return [...prev, clone];
        });
        return cloneId;
      },
      resetJobs: () => persist(defaultJobs),
      getVisibleJobs: (now = new Date()) => sortJobs(jobs.filter((item) => isVisibleNow(item, now))),
      isVisibleNow,
    };
  }, [jobs]);

  return (
    <CareersJobsContext.Provider value={value}>
      {children}
    </CareersJobsContext.Provider>
  );
}

export function useCareersJobs() {
  return useContext(CareersJobsContext);
}
