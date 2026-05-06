import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { formsLibraryLinks } from '../data/formsLibraryLinks';
import { documentLibrarySeedExtras } from '../data/documentLibrarySeedExtras';

const STORAGE_KEY = 'agf-documents-admin-v1';
export const DocumentsContext = createContext(null);

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function inferKindFromUrl(url) {
  const value = String(url || '').trim();
  if (!value) return 'unassigned';
  if (/\.pdf(?:[?#].*)?$/i.test(value)) return 'pdf';
  if (/\.zip(?:[?#].*)?$/i.test(value)) return 'zip';
  if (/formsite\.com|secure\.agfinancial\.org\/public\/forms/i.test(value)) return 'web-form';
  return isExternalUrl(value) ? 'external-page' : 'external-page';
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag || '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function normalizeDocument(record) {
  const safe = record && typeof record === 'object' ? record : {};
  const category = String(safe.category || 'form').trim() || 'form';
  const topic = String(safe.topic || '').trim();
  const title = String(safe.title || safe.label || '').trim();
  const fallbackIdParts = [category, topic, title].map(toSlug).filter(Boolean);
  const fallbackId = fallbackIdParts.length ? fallbackIdParts.join('-') : `document-${Date.now()}`;
  const url = String(safe.url || safe.href || '').trim();
  const explicitKind = String(safe.kind || '').trim();
  const inferredKind = inferKindFromUrl(url);
  const kind = !url
    ? (explicitKind || inferredKind)
    : (inferredKind === 'external-page' && explicitKind === 'web-form' ? 'web-form' : inferredKind);

  return {
    id: String(safe.id || fallbackId),
    title,
    url,
    kind,
    category,
    topic,
    tags: normalizeTags(safe.tags),
    active: safe.active !== false,
    sortOrder: Number.isFinite(Number(safe.sortOrder)) ? Number(safe.sortOrder) : 0,
    notes: String(safe.notes || ''),
    seedSource: String(safe.seedSource || ''),
  };
}

function makeUniqueId(base, usedIds) {
  let candidate = base || `document-${Date.now()}`;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function buildSeedDocuments() {
  const usedIds = new Set();
  const rows = Array.isArray(formsLibraryLinks) ? formsLibraryLinks : [];
  const formDocs = rows.map((item) => {
    const baseId = [
      'form',
      toSlug(item.topic),
      toSlug(item.label),
    ].filter(Boolean).join('-');

    return normalizeDocument({
      id: makeUniqueId(baseId, usedIds),
      title: item.label,
      url: item.href,
      kind: inferKindFromUrl(item.href),
      category: 'form',
      topic: item.topic,
      active: true,
      sortOrder: 0,
      notes: '',
      seedSource: 'forms-library',
    });
  });

  const extras = (Array.isArray(documentLibrarySeedExtras) ? documentLibrarySeedExtras : []).map((item) => {
    const normalized = normalizeDocument(item);
    const uniqueId = makeUniqueId(normalized.id || toSlug(normalized.title) || 'document', usedIds);
    return {
      ...normalized,
      id: uniqueId,
    };
  });

  const mergedByUrl = new Map();
  [...formDocs, ...extras].forEach((doc) => {
    const key = String(doc.url || '').trim().toLowerCase();
    if (!key) return;
    if (!mergedByUrl.has(key)) {
      mergedByUrl.set(key, doc);
    }
  });

  return sortDocuments(Array.from(mergedByUrl.values()));
}

function sortDocuments(items) {
  return [...items].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare) return categoryCompare;
    const topicCompare = (a.topic || '').localeCompare(b.topic || '');
    if (topicCompare) return topicCompare;
    const sortCompare = (a.sortOrder || 0) - (b.sortOrder || 0);
    if (sortCompare) return sortCompare;
    return a.title.localeCompare(b.title);
  });
}

function mergeSeedDocuments(stored) {
  const normalizedStored = Array.isArray(stored) ? stored.map(normalizeDocument) : [];
  const byId = new Map(normalizedStored.map((doc) => [doc.id, doc]));
  const byUrl = new Map(normalizedStored.map((doc) => [String(doc.url || '').trim().toLowerCase(), doc]));

  buildSeedDocuments().forEach((seedDoc) => {
    const urlKey = String(seedDoc.url || '').trim().toLowerCase();
    if (byId.has(seedDoc.id) || (urlKey && byUrl.has(urlKey))) {
      return;
    }
    if (!byId.has(seedDoc.id)) {
      byId.set(seedDoc.id, seedDoc);
    }
  });

  return sortDocuments(Array.from(byId.values()));
}

function readInitialDocuments() {
  if (typeof window === 'undefined') {
    return buildSeedDocuments();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildSeedDocuments();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return buildSeedDocuments();
    }
    return mergeSeedDocuments(parsed);
  } catch {
    return buildSeedDocuments();
  }
}

function normalizePatch(patch) {
  if (!patch || typeof patch !== 'object') return {};
  const hasUrl = Object.prototype.hasOwnProperty.call(patch, 'url');
  const nextUrl = hasUrl ? String(patch.url || '').trim() : '';
  return {
    ...patch,
    ...(hasUrl ? { kind: inferKindFromUrl(nextUrl) } : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, 'tags') ? { tags: normalizeTags(patch.tags) } : {}),
  };
}

export function DocumentsProvider({ children }) {
  const [documentsState, setDocumentsState] = useState(readInitialDocuments);
  const documentsStateRef = useRef(documentsState);
  documentsStateRef.current = documentsState;

  const value = useMemo(() => {
    const save = (nextOrUpdater) => {
      const next = typeof nextOrUpdater === 'function'
        ? nextOrUpdater(documentsStateRef.current)
        : nextOrUpdater;
      const normalized = sortDocuments((Array.isArray(next) ? next : []).map(normalizeDocument));
      documentsStateRef.current = normalized;
      setDocumentsState(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage failures
      }
      return normalized;
    };

    const createDocument = (seed = {}) => {
      const timestamp = Date.now();
      const baseId = toSlug(seed.id || seed.title || `document-${timestamp}`) || `document-${timestamp}`;
      const usedIds = new Set(documentsStateRef.current.map((doc) => doc.id));
      const id = makeUniqueId(baseId, usedIds);
      const created = normalizeDocument({
        id,
        title: seed.title || 'New Document',
        url: seed.url || '',
        kind: seed.kind || inferKindFromUrl(seed.url || ''),
        category: seed.category || 'form',
        topic: seed.topic || '',
        tags: seed.tags || [],
        active: seed.active !== false,
        sortOrder: seed.sortOrder || 0,
        notes: seed.notes || '',
        seedSource: seed.seedSource || '',
      });
      save((current) => [...current, created]);
      return created.id;
    };

    const updateDocument = (id, patch) => {
      if (!id) return null;
      const safePatch = normalizePatch(patch);
      const requestedId = Object.prototype.hasOwnProperty.call(safePatch, 'id')
        ? String(safePatch.id || '').trim()
        : null;
      const nextId = requestedId
        && !documentsStateRef.current.some((doc) => doc.id === requestedId && doc.id !== id)
        ? requestedId
        : id;
      save((current) => current.map((doc) => {
        if (doc.id !== id) return doc;
        const next = normalizeDocument({
          ...doc,
          ...safePatch,
          id: nextId,
        });
        return next;
      }));
      return nextId;
    };

    const deleteDocument = (id) => {
      if (!id) return;
      save((current) => current.filter((doc) => doc.id !== id));
    };

    const resetDocuments = () => {
      const defaults = buildSeedDocuments();
      documentsStateRef.current = defaults;
      setDocumentsState(defaults);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
    };

    const getDocumentById = (id) => documentsState.find((doc) => doc.id === id) || null;

    const resolveDocumentLink = (id) => {
      const doc = getDocumentById(id);
      if (!doc || !doc.active || !doc.url) return null;
      return {
        ...doc,
        external: isExternalUrl(doc.url),
      };
    };

    return {
      documents: documentsState,
      createDocument,
      updateDocument,
      deleteDocument,
      resetDocuments,
      getDocumentById,
      resolveDocumentLink,
    };
  }, [documentsState]);

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (!context) {
    throw new Error('useDocuments must be used within DocumentsProvider');
  }
  return context;
}

export function detectDocumentKind(url) {
  return inferKindFromUrl(url);
}
