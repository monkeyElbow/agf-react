import { resolvePagePathFromRef } from '../data/siteMap';

export const ANNOUNCEMENT_STORAGE_KEY = 'agf-site-announcement-v1';

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

export const defaultAnnouncement = {
  enabled: false,
  message: '',
  backgroundId: 'brand-blue',
  textColorId: 'white',
  startDate: '',
  endDate: '',
  linkEnabled: false,
  linkPath: '',
  linkPageRef: '',
};

function normalizeDateValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function normalizeLinkPathValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return text.startsWith('/') ? text : '';
}

export function normalizeAnnouncement(payload) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  const backgroundId = announcementBackgroundSwatches.some((item) => item.id === safe.backgroundId)
    ? safe.backgroundId
    : defaultAnnouncement.backgroundId;
  const textColorId = announcementTextColors.some((item) => item.id === safe.textColorId)
    ? safe.textColorId
    : defaultAnnouncement.textColorId;
  const linkPageRef = typeof safe.linkPageRef === 'string' ? safe.linkPageRef.trim() : '';
  const linkPath = resolvePagePathFromRef(linkPageRef, normalizeLinkPathValue(safe.linkPath));

  return {
    enabled: typeof safe.enabled === 'boolean' ? safe.enabled : defaultAnnouncement.enabled,
    message: typeof safe.message === 'string' ? safe.message : defaultAnnouncement.message,
    backgroundId,
    textColorId,
    startDate: normalizeDateValue(safe.startDate),
    endDate: normalizeDateValue(safe.endDate),
    linkEnabled: typeof safe.linkEnabled === 'boolean' ? safe.linkEnabled : defaultAnnouncement.linkEnabled,
    linkPath,
    linkPageRef,
  };
}

export function areAnnouncementsEqual(left, right) {
  return JSON.stringify(normalizeAnnouncement(left)) === JSON.stringify(normalizeAnnouncement(right));
}

export function hasMeaningfulAnnouncementContent(value) {
  const announcement = normalizeAnnouncement(value);
  return Boolean(
    announcement.message.trim()
    || announcement.enabled
    || announcement.startDate
    || announcement.endDate
    || announcement.linkEnabled
    || announcement.linkPath
    || announcement.linkPageRef,
  );
}

export function readAnnouncementFromStorage(storage) {
  if (!storage?.getItem) {
    return defaultAnnouncement;
  }
  try {
    const raw = storage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (!raw) {
      return defaultAnnouncement;
    }
    return normalizeAnnouncement(JSON.parse(raw));
  } catch {
    return defaultAnnouncement;
  }
}

export function writeAnnouncementToStorage(storage, announcement) {
  if (!storage?.setItem) {
    return normalizeAnnouncement(announcement);
  }
  const normalized = normalizeAnnouncement(announcement);
  try {
    storage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore storage failures
  }
  return normalized;
}
