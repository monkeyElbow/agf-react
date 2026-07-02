import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ANNOUNCEMENT_STORAGE_KEY,
  announcementBackgroundSwatches,
  announcementTextColors,
  areAnnouncementsEqual,
  defaultAnnouncement,
  hasMeaningfulAnnouncementContent,
  normalizeAnnouncement,
  readAnnouncementFromStorage,
  writeAnnouncementToStorage,
} from '../lib/announcementConfig';
import {
  fetchSharedAnnouncement,
  isDevContentAuthorityEnabled,
  saveSharedAnnouncement,
} from '../lib/devContentAuthorityClient';

const AnnouncementContext = createContext(null);

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function readInitialAnnouncement() {
  return readAnnouncementFromStorage(getBrowserStorage());
}

function persistLocalAnnouncement(announcement) {
  return writeAnnouncementToStorage(getBrowserStorage(), announcement);
}

export { ANNOUNCEMENT_STORAGE_KEY, announcementBackgroundSwatches, announcementTextColors };

export function AnnouncementProvider({ children }) {
  const sharedPersistenceEnabled = isDevContentAuthorityEnabled();
  const [announcement, setAnnouncement] = useState(readInitialAnnouncement);
  const [draftAnnouncement, setDraftAnnouncement] = useState(readInitialAnnouncement);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrating, setIsHydrating] = useState(sharedPersistenceEnabled);
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(0);
  const [hasRecoveredLocalDraft, setHasRecoveredLocalDraft] = useState(false);

  useEffect(() => {
    if (!sharedPersistenceEnabled) {
      setIsHydrating(false);
      return undefined;
    }

    let cancelled = false;
    const localAnnouncement = readInitialAnnouncement();

    const hydrateSharedAnnouncement = async () => {
      try {
        const snapshot = await fetchSharedAnnouncement();
        if (cancelled) {
          return;
        }
        const sharedAnnouncement = normalizeAnnouncement(snapshot?.announcement);
        const shouldRecoverLocalDraft = (
          !hasMeaningfulAnnouncementContent(sharedAnnouncement)
          && hasMeaningfulAnnouncementContent(localAnnouncement)
        );

        setAnnouncement(sharedAnnouncement);
        setDraftAnnouncement(shouldRecoverLocalDraft ? localAnnouncement : sharedAnnouncement);
        setHasRecoveredLocalDraft(shouldRecoverLocalDraft);
        setLastSavedAt(Number(snapshot?.updatedAt) || 0);
        persistLocalAnnouncement(sharedAnnouncement);
        setLoadError('');
      } catch {
        if (cancelled) {
          return;
        }
        setLoadError('Shared message settings could not be loaded. Local browser values are shown instead.');
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    hydrateSharedAnnouncement();
    return () => {
      cancelled = true;
    };
  }, [sharedPersistenceEnabled]);

  const hasUnsavedChanges = useMemo(
    () => !areAnnouncementsEqual(draftAnnouncement, announcement),
    [draftAnnouncement, announcement],
  );

  const value = useMemo(() => {
    const updateDraft = (updater) => {
      setDraftAnnouncement((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return normalizeAnnouncement(next);
      });
      setSaveError('');
    };

    const saveAnnouncementDraft = async () => {
      const normalizedDraft = normalizeAnnouncement(draftAnnouncement);
      setIsSaving(true);
      setSaveError('');
      try {
        if (sharedPersistenceEnabled) {
          const snapshot = await saveSharedAnnouncement(normalizedDraft);
          const savedAnnouncement = normalizeAnnouncement(snapshot?.announcement);
          setAnnouncement(savedAnnouncement);
          setDraftAnnouncement(savedAnnouncement);
          setLastSavedAt(Number(snapshot?.updatedAt) || Date.now());
          setHasRecoveredLocalDraft(false);
          persistLocalAnnouncement(savedAnnouncement);
          return { ok: true, announcement: savedAnnouncement };
        }

        const savedAnnouncement = persistLocalAnnouncement(normalizedDraft);
        setAnnouncement(savedAnnouncement);
        setDraftAnnouncement(savedAnnouncement);
        setLastSavedAt(Date.now());
        setHasRecoveredLocalDraft(false);
        return { ok: true, announcement: savedAnnouncement };
      } catch {
        setSaveError('Message settings could not be saved. Try again.');
        return { ok: false };
      } finally {
        setIsSaving(false);
      }
    };

    return {
      announcement,
      draftAnnouncement,
      hasUnsavedChanges,
      isSaving,
      isHydrating,
      saveError,
      loadError,
      lastSavedAt,
      hasRecoveredLocalDraft,
      usesSharedAnnouncementPersistence: sharedPersistenceEnabled,
      setAnnouncementEnabled: (enabled) => updateDraft((prev) => ({ ...prev, enabled: Boolean(enabled) })),
      setAnnouncementMessage: (message) => updateDraft((prev) => ({ ...prev, message: String(message || '') })),
      setAnnouncementBackground: (backgroundId) => updateDraft((prev) => ({ ...prev, backgroundId })),
      setAnnouncementTextColor: (textColorId) => updateDraft((prev) => ({ ...prev, textColorId })),
      setAnnouncementStartDate: (startDate) => updateDraft((prev) => ({ ...prev, startDate })),
      setAnnouncementEndDate: (endDate) => updateDraft((prev) => ({ ...prev, endDate })),
      setAnnouncementLinkEnabled: (linkEnabled) => updateDraft((prev) => ({ ...prev, linkEnabled: Boolean(linkEnabled) })),
      setAnnouncementLinkPath: (linkPath) => updateDraft((prev) => ({ ...prev, linkPath })),
      setAnnouncementLinkPageRef: (linkPageRef) => updateDraft((prev) => ({ ...prev, linkPageRef })),
      saveAnnouncement: saveAnnouncementDraft,
      discardAnnouncementChanges: () => {
        setDraftAnnouncement(announcement);
        setHasRecoveredLocalDraft(false);
        setSaveError('');
      },
      resetAnnouncement: () => {
        setDraftAnnouncement(defaultAnnouncement);
        setHasRecoveredLocalDraft(false);
        setSaveError('');
      },
    };
  }, [
    announcement,
    draftAnnouncement,
    hasUnsavedChanges,
    isSaving,
    isHydrating,
    lastSavedAt,
    loadError,
    saveError,
    hasRecoveredLocalDraft,
    sharedPersistenceEnabled,
  ]);

  return <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>;
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncement must be used within AnnouncementProvider');
  }
  return context;
}
