import fs from 'node:fs';
import path from 'node:path';
import { buildDefaultDisclosuresLibrary } from '../src/data/disclosuresLibrarySeed.js';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from '../src/lib/ratesLegalCopyDefaults.js';

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeDisclosureValue(format, value, fallbackValue) {
  if (format === 'lines') {
    if (Array.isArray(value)) {
      const normalized = value.map((entry) => String(entry || '').trim()).filter(Boolean);
      return normalized.length ? normalized : (Array.isArray(fallbackValue) ? [...fallbackValue] : []);
    }
    const source = String(value || '').trim();
    return source ? [source] : (Array.isArray(fallbackValue) ? [...fallbackValue] : []);
  }

  const normalized = String(value || '').trim();
  if (normalized) {
    return normalized;
  }

  return typeof fallbackValue === 'string' ? fallbackValue : '';
}

function normalizeDisclosureEntry(rawEntry, defaultEntry = null) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const fallback = defaultEntry && typeof defaultEntry === 'object' ? defaultEntry : {};
  const format = ['html', 'lines', 'text'].includes(String(source.format || fallback.format || '').trim())
    ? String(source.format || fallback.format || '').trim()
    : 'text';

  return {
    id: normalizeString(source.id || fallback.id),
    title: normalizeString(source.title || fallback.title),
    group: normalizeString(source.group || fallback.group) || 'General',
    scope: normalizeString(source.scope || fallback.scope) || 'product',
    format,
    usage: normalizeString(source.usage || fallback.usage),
    tokenHelp: Array.isArray(source.tokenHelp)
      ? source.tokenHelp.map((entry) => String(entry || '').trim()).filter(Boolean)
      : (Array.isArray(fallback.tokenHelp) ? [...fallback.tokenHelp] : []),
    value: normalizeDisclosureValue(format, source.value, fallback.value),
  };
}

function normalizeDisclosures(payload) {
  const defaults = buildDefaultDisclosuresLibrary();
  const source = Array.isArray(payload) ? payload : [];
  const sourceById = new Map(
    source
      .map((entry) => normalizeDisclosureEntry(entry))
      .filter((entry) => entry.id)
      .map((entry) => [entry.id, entry]),
  );

  return defaults.map((defaultEntry) => normalizeDisclosureEntry(sourceById.get(defaultEntry.id), defaultEntry));
}

function normalizeLegalCopy(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    ...DEFAULT_RATES_LEGAL_COPY_SETTINGS,
    ...(source && typeof source === 'object' ? source : {}),
  };
}

function normalizeActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) {
    return null;
  }

  const userId = normalizeString(source.userId || source.id);
  const displayName = normalizeString(source.displayName || source.name);
  if (!userId || !displayName) {
    return null;
  }

  return {
    userId,
    displayName,
    initials: normalizeString(source.initials) || displayName.slice(0, 2).toUpperCase(),
    accentColor: normalizeString(source.accentColor) || '#00adbb',
  };
}

function createDefaultRecord() {
  return {
    version: 1,
    draftUpdatedAt: 0,
    draftUpdatedBy: null,
    publishedAt: 0,
    publishedBy: null,
    draft: {
      disclosures: buildDefaultDisclosuresLibrary(),
      legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
    },
    published: {
      disclosures: buildDefaultDisclosuresLibrary(),
      legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
    },
  };
}

function normalizeRecord(rawRecord) {
  const source = rawRecord && typeof rawRecord === 'object' ? rawRecord : {};
  const legacyDisclosures = normalizeDisclosures(source.disclosures);
  const legacyLegalCopy = normalizeLegalCopy(source.legalCopy);
  const normalizedDraft = {
    disclosures: normalizeDisclosures(source.draft?.disclosures || legacyDisclosures),
    legalCopy: normalizeLegalCopy(source.draft?.legalCopy || legacyLegalCopy),
  };
  const normalizedPublished = {
    disclosures: normalizeDisclosures(source.published?.disclosures || legacyDisclosures),
    legalCopy: normalizeLegalCopy(source.published?.legalCopy || legacyLegalCopy),
  };
  return {
    version: 1,
    draftUpdatedAt: Number.isFinite(Number(source.draftUpdatedAt || source.updatedAt)) ? Number(source.draftUpdatedAt || source.updatedAt) : 0,
    draftUpdatedBy: normalizeActor(source.draftUpdatedBy || source.updatedBy),
    publishedAt: Number.isFinite(Number(source.publishedAt || source.updatedAt)) ? Number(source.publishedAt || source.updatedAt) : 0,
    publishedBy: normalizeActor(source.publishedBy || source.updatedBy),
    draft: normalizedDraft,
    published: normalizedPublished,
  };
}

export function createSharedDisclosuresStore({ persistenceFile }) {
  const targetFile = path.resolve(String(persistenceFile || ''));

  function readRecord() {
    try {
      const raw = fs.readFileSync(targetFile, 'utf8');
      return normalizeRecord(JSON.parse(raw));
    } catch {
      return createDefaultRecord();
    }
  }

  let record = readRecord();

  function persist() {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, JSON.stringify(record, null, 2));
  }

  function publishSnapshot() {
    const snapshot = cloneJson(record);
    snapshot.hasUnpublishedChanges = JSON.stringify(snapshot.draft) !== JSON.stringify(snapshot.published);
    return snapshot;
  }

  return {
    getSnapshot() {
      return publishSnapshot();
    },

    saveDraftPatch(patch, actor = null) {
      const source = patch && typeof patch === 'object' ? patch : {};
      record = {
        ...record,
        draftUpdatedAt: Date.now(),
        draftUpdatedBy: normalizeActor(actor),
        draft: {
          disclosures: Object.prototype.hasOwnProperty.call(source, 'disclosures')
            ? normalizeDisclosures(source.disclosures)
            : record.draft.disclosures,
          legalCopy: Object.prototype.hasOwnProperty.call(source, 'legalCopy')
            ? normalizeLegalCopy(source.legalCopy)
            : record.draft.legalCopy,
        },
      };
      persist();
      return publishSnapshot();
    },

    resetDraftToDefaults(actor = null) {
      record = {
        ...record,
        draftUpdatedAt: Date.now(),
        draftUpdatedBy: normalizeActor(actor),
        draft: {
          disclosures: buildDefaultDisclosuresLibrary(),
          legalCopy: { ...DEFAULT_RATES_LEGAL_COPY_SETTINGS },
        },
      };
      persist();
      return publishSnapshot();
    },

    restoreDraftFromPublished(actor = null) {
      record = {
        ...record,
        draftUpdatedAt: Date.now(),
        draftUpdatedBy: normalizeActor(actor),
        draft: cloneJson(record.published),
      };
      persist();
      return publishSnapshot();
    },

    publishDraft(actor = null) {
      record = {
        ...record,
        publishedAt: Date.now(),
        publishedBy: normalizeActor(actor),
        published: cloneJson(record.draft),
      };
      persist();
      return publishSnapshot();
    },
  };
}
