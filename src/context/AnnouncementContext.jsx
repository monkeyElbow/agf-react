import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'agf-site-announcement-v1';
const AnnouncementContext = createContext(null);

export const announcementBackgroundSwatches = [
  { id: 'brand-blue', label: 'Brand Blue', color: '#00adbb' },
  { id: 'atlantean-dark', label: 'Atlantean Dark', color: '#008aab' },
  { id: 'super-grey', label: 'Super Grey', color: '#414042' },
  { id: 'sandstone', label: 'Sandstone', color: '#d7d3cc' },
  { id: 'melon', label: 'Melon', color: '#f68c1f' },
];

export const announcementTextColors = [
  { id: 'super-grey', label: 'Super Grey', color: '#414042' },
  { id: 'white', label: 'White', color: '#ffffff' },
];

const defaultAnnouncement = {
  enabled: false,
  message: '',
  backgroundId: 'brand-blue',
  textColorId: 'white',
  startDate: '',
  endDate: '',
};

function normalizeDateValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function normalizeAnnouncement(payload) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  const backgroundId = announcementBackgroundSwatches.some((item) => item.id === safe.backgroundId)
    ? safe.backgroundId
    : defaultAnnouncement.backgroundId;
  const textColorId = announcementTextColors.some((item) => item.id === safe.textColorId)
    ? safe.textColorId
    : defaultAnnouncement.textColorId;

  return {
    enabled: typeof safe.enabled === 'boolean' ? safe.enabled : defaultAnnouncement.enabled,
    message: typeof safe.message === 'string' ? safe.message : defaultAnnouncement.message,
    backgroundId,
    textColorId,
    startDate: normalizeDateValue(safe.startDate),
    endDate: normalizeDateValue(safe.endDate),
  };
}

function readInitialAnnouncement() {
  if (typeof window === 'undefined') {
    return defaultAnnouncement;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultAnnouncement;
    }
    return normalizeAnnouncement(JSON.parse(raw));
  } catch {
    return defaultAnnouncement;
  }
}

export function AnnouncementProvider({ children }) {
  const [announcement, setAnnouncement] = useState(readInitialAnnouncement);

  const value = useMemo(() => {
    const persist = (nextAnnouncement) => {
      const normalized = normalizeAnnouncement(nextAnnouncement);
      setAnnouncement(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage failures
      }
    };

    return {
      announcement,
      setAnnouncementEnabled: (enabled) => persist({ ...announcement, enabled: Boolean(enabled) }),
      setAnnouncementMessage: (message) => persist({ ...announcement, message: String(message || '') }),
      setAnnouncementBackground: (backgroundId) => persist({ ...announcement, backgroundId }),
      setAnnouncementTextColor: (textColorId) => persist({ ...announcement, textColorId }),
      setAnnouncementStartDate: (startDate) => persist({ ...announcement, startDate }),
      setAnnouncementEndDate: (endDate) => persist({ ...announcement, endDate }),
      resetAnnouncement: () => persist(defaultAnnouncement),
    };
  }, [announcement]);

  return <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>;
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncement must be used within AnnouncementProvider');
  }
  return context;
}
