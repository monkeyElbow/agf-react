const SUPPORT_LINK_TYPES = Object.freeze(['document', 'internal', 'external']);

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function normalizeSupportLink(link) {
  if (!link || typeof link !== 'object') {
    return null;
  }

  const label = String(link.label || '').trim();
  const href = String(link.href || '').trim();
  const to = String(link.to || '').trim();
  const documentId = String(link.documentId || '').trim();
  if (!label || (!href && !to && !documentId)) {
    return null;
  }

  return {
    label,
    ...(href ? { href } : {}),
    ...(to ? { to } : {}),
    ...(documentId ? { documentId } : {}),
    ...(toBoolean(link.openInNewWindow) ? { openInNewWindow: true } : {}),
  };
}

function normalizeSupportItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const question = String(item.question || '').trim();
  const answer = String(item.answer || '').trim();
  const links = Array.isArray(item.links)
    ? item.links.map(normalizeSupportLink).filter(Boolean)
    : [];
  return question || answer || links.length
    ? { question, answer, links }
    : null;
}

export function parseSupportLibraryGroups(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((group) => {
        const title = String(group?.title || '').trim();
        const description = String(group?.description || '').trim();
        const links = Array.isArray(group?.links)
          ? group.links.map(normalizeSupportLink).filter(Boolean)
          : [];
        const items = Array.isArray(group?.items)
          ? group.items.map(normalizeSupportItem).filter(Boolean)
          : [];
        return title && (description || links.length || items.length)
          ? { title, ...(description ? { description } : {}), links, items }
          : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function serializeSupportLibraryGroups(groups) {
  return JSON.stringify(Array.isArray(groups) ? groups : []);
}

export function getSupportLibraryDocumentIds(groups) {
  const ids = [];
  (Array.isArray(groups) ? groups : []).forEach((group) => {
    const links = [
      ...(Array.isArray(group?.links) ? group.links : []),
      ...(Array.isArray(group?.items) ? group.items.flatMap((item) => item?.links || []) : []),
    ];
    links.forEach((link) => {
      const id = String(link?.documentId || '').trim();
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    });
  });
  return ids;
}

export function getSupportLibraryUnresolvedDocumentIds(groups, documents = []) {
  const knownIds = new Set(
    (Array.isArray(documents) ? documents : [])
      .map((document) => String(document?.id || '').trim())
      .filter(Boolean),
  );
  return getSupportLibraryDocumentIds(groups).filter((id) => !knownIds.has(id));
}

export { SUPPORT_LINK_TYPES };
