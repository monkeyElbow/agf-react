export const LINK_VALUE_KIND_VALUES = Object.freeze([
  'anchor',
  'document',
  'email',
  'external',
  'internal',
  'phone',
]);

export function isLinkValueKind(value) {
  return LINK_VALUE_KIND_VALUES.includes(String(value || '').trim());
}

function normalizeProtocolHref(value) {
  return String(value || '').trim();
}

export function createLinkValue(link) {
  const source = link && typeof link === 'object' ? link : {};
  const kind = String(source.kind || '').trim().toLowerCase();

  if (!isLinkValueKind(kind)) {
    return null;
  }

  const normalized = {
    kind,
    openInNewWindow: Boolean(source.openInNewWindow),
  };

  if (kind === 'internal') {
    normalized.to = String(source.to || '').trim();
  } else if (kind === 'external' || kind === 'anchor' || kind === 'email' || kind === 'phone') {
    normalized.href = normalizeProtocolHref(source.href);
  } else if (kind === 'document') {
    normalized.documentId = String(source.documentId || '').trim();
  }

  return normalized;
}

export function validateLinkValue(link) {
  const normalized = createLinkValue(link);
  if (!normalized) {
    return {
      valid: false,
      errors: ['Link kind is required and must be canonical.'],
      value: null,
    };
  }

  const errors = [];

  if (normalized.kind === 'internal' && !normalized.to) {
    errors.push('Internal links require a "to" path.');
  }
  if (normalized.kind === 'external' && !/^https?:\/\//i.test(normalized.href || '')) {
    errors.push('External links require an http(s) href.');
  }
  if (normalized.kind === 'anchor' && !/^#/i.test(normalized.href || '')) {
    errors.push('Anchor links require an href starting with "#".');
  }
  if (normalized.kind === 'email' && !/^mailto:/i.test(normalized.href || '')) {
    errors.push('Email links require a mailto: href.');
  }
  if (normalized.kind === 'phone' && !/^tel:/i.test(normalized.href || '')) {
    errors.push('Phone links require a tel: href.');
  }
  if (normalized.kind === 'document' && !normalized.documentId) {
    errors.push('Document links require a documentId.');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: normalized,
  };
}

export function coerceLinkValue(source) {
  const link = source && typeof source === 'object' ? source : {};
  if (isLinkValueKind(link.kind)) {
    return createLinkValue(link);
  }

  const documentId = String(link.documentId || '').trim();
  if (documentId) {
    return createLinkValue({
      kind: 'document',
      documentId,
      openInNewWindow: link.openInNewWindow,
    });
  }

  const explicitPageRef = String(link.pageRef || '').trim();
  const to = String(link.to || explicitPageRef).trim();
  const href = String(link.href || link.url || '').trim();

  if (to) {
    if (/^https?:\/\//i.test(to)) {
      return createLinkValue({
        kind: 'external',
        href: to,
        openInNewWindow: link.openInNewWindow,
      });
    }
    if (to.startsWith('#')) {
      return createLinkValue({
        kind: 'anchor',
        href: to,
        openInNewWindow: link.openInNewWindow,
      });
    }
    return createLinkValue({
      kind: 'internal',
      to,
      openInNewWindow: link.openInNewWindow,
    });
  }

  if (/^mailto:/i.test(href)) {
    return createLinkValue({
      kind: 'email',
      href,
      openInNewWindow: link.openInNewWindow,
    });
  }
  if (/^tel:/i.test(href)) {
    return createLinkValue({
      kind: 'phone',
      href,
      openInNewWindow: link.openInNewWindow,
    });
  }
  if (/^#/i.test(href)) {
    return createLinkValue({
      kind: 'anchor',
      href,
      openInNewWindow: link.openInNewWindow,
    });
  }
  if (/^https?:\/\//i.test(href)) {
    return createLinkValue({
      kind: 'external',
      href,
      openInNewWindow: link.openInNewWindow,
    });
  }
  if (href.startsWith('/')) {
    return createLinkValue({
      kind: 'internal',
      to: href,
      openInNewWindow: link.openInNewWindow,
    });
  }

  return null;
}

function normalizeFieldKeyList(keys, fallback = []) {
  if (Array.isArray(keys)) {
    return keys.filter(Boolean);
  }
  if (typeof keys === 'string' && keys.trim()) {
    return [keys.trim()];
  }
  return fallback;
}

function readFirstFieldValue(source, keys) {
  const fieldKeys = normalizeFieldKeyList(keys);
  const record = source && typeof source === 'object' ? source : {};
  for (const key of fieldKeys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const value = record[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
}

function readFirstStringField(source, keys) {
  const value = readFirstFieldValue(source, keys);
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

export function coerceLinkValueFromFields(source, {
  kindKeys = ['kind'],
  documentIdKeys = ['documentId'],
  toKeys = ['to', 'pageRef'],
  hrefKeys = ['href', 'url'],
  openInNewWindowKeys = ['openInNewWindow'],
} = {}) {
  const kind = readFirstStringField(source, kindKeys);
  const documentId = readFirstStringField(source, documentIdKeys);
  const to = readFirstStringField(source, toKeys);
  const href = readFirstStringField(source, hrefKeys);
  const openInNewWindow = Boolean(readFirstFieldValue(source, openInNewWindowKeys));

  return coerceLinkValue({
    kind,
    documentId,
    to,
    href,
    openInNewWindow,
  });
}

export function validateLinkFieldGroup(source, options = {}) {
  const linkValue = coerceLinkValueFromFields(source, options);
  return !linkValue || validateLinkValue(linkValue).valid;
}

export function validateLinkFieldGroups(source, groups = []) {
  return groups.every((group) => validateLinkFieldGroup(source, group));
}

function inferActionDocumentIdKeys(labelKeys) {
  const normalizedLabelKeys = normalizeFieldKeyList(labelKeys, ['label']);
  return Array.from(new Set([
    'documentId',
    ...normalizedLabelKeys
      .map((key) => String(key || '').trim())
      .filter((key) => /Label$/.test(key))
      .map((key) => key.replace(/Label$/, 'DocumentId')),
  ]));
}

function inferActionFieldKeys(labelKeys, suffix, fallback) {
  const normalizedLabelKeys = normalizeFieldKeyList(labelKeys, ['label']);
  return Array.from(new Set([
    fallback,
    ...normalizedLabelKeys
      .map((key) => String(key || '').trim())
      .filter((key) => /Label$/.test(key))
      .map((key) => key.replace(/Label$/, suffix)),
  ]));
}

export function validateActionFieldGroup(source, {
  labelKeys = ['label'],
  documentIdKeys = inferActionDocumentIdKeys(labelKeys),
  actionKeys = inferActionFieldKeys(labelKeys, 'Action', 'action'),
  targetAnchorIdKeys = inferActionFieldKeys(labelKeys, 'TargetAnchorId', 'targetAnchorId'),
  targetBlockIdKeys = inferActionFieldKeys(labelKeys, 'TargetBlockId', 'targetBlockId'),
  ...linkOptions
} = {}) {
  const label = readFirstStringField(source, labelKeys);
  const action = readFirstStringField(source, actionKeys);
  const targetAnchorId = readFirstStringField(source, targetAnchorIdKeys);
  const targetBlockId = readFirstStringField(source, targetBlockIdKeys);
  const linkValue = coerceLinkValueFromFields(source, {
    ...linkOptions,
    documentIdKeys,
  });

  if (!label && !linkValue && !action) {
    return true;
  }

  if (label && action && (targetAnchorId || targetBlockId)) {
    return true;
  }

  return Boolean(label) && Boolean(linkValue) && validateLinkValue(linkValue).valid;
}

export function validateActionFieldGroups(source, groups = []) {
  return groups.every((group) => validateActionFieldGroup(source, group));
}

export function linkValueToLinkProps(link) {
  const normalized = createLinkValue(link);
  if (!normalized) {
    return {};
  }

  if (normalized.kind === 'internal') {
    return {
      to: normalized.to,
      href: undefined,
      documentId: undefined,
      openInNewWindow: normalized.openInNewWindow,
    };
  }
  if (normalized.kind === 'document') {
    return {
      to: undefined,
      href: undefined,
      documentId: normalized.documentId,
      openInNewWindow: normalized.openInNewWindow,
    };
  }

  return {
    to: undefined,
    href: normalized.href,
    documentId: undefined,
    openInNewWindow: normalized.openInNewWindow,
  };
}
