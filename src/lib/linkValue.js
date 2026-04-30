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

export function coerceLegacyLinkValue(source) {
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

function readFirstLegacyFieldValue(source, keys) {
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

function readFirstLegacyStringField(source, keys) {
  const value = readFirstLegacyFieldValue(source, keys);
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

export function coerceLegacyLinkValueFromFields(source, {
  kindKeys = ['kind'],
  documentIdKeys = ['documentId'],
  toKeys = ['to', 'pageRef'],
  hrefKeys = ['href', 'url'],
  openInNewWindowKeys = ['openInNewWindow'],
} = {}) {
  const kind = readFirstLegacyStringField(source, kindKeys);
  const documentId = readFirstLegacyStringField(source, documentIdKeys);
  const to = readFirstLegacyStringField(source, toKeys);
  const href = readFirstLegacyStringField(source, hrefKeys);
  const openInNewWindow = Boolean(readFirstLegacyFieldValue(source, openInNewWindowKeys));

  return coerceLegacyLinkValue({
    kind,
    documentId,
    to,
    href,
    openInNewWindow,
  });
}

export function validateLegacyLinkFieldGroup(source, options = {}) {
  const linkValue = coerceLegacyLinkValueFromFields(source, options);
  return !linkValue || validateLinkValue(linkValue).valid;
}

export function validateLegacyLinkFieldGroups(source, groups = []) {
  return groups.every((group) => validateLegacyLinkFieldGroup(source, group));
}

export function validateLegacyActionFieldGroup(source, {
  labelKeys = ['label'],
  ...linkOptions
} = {}) {
  const label = readFirstLegacyStringField(source, labelKeys);
  const linkValue = coerceLegacyLinkValueFromFields(source, linkOptions);

  if (!label && !linkValue) {
    return true;
  }

  return Boolean(label) && Boolean(linkValue) && validateLinkValue(linkValue).valid;
}

export function validateLegacyActionFieldGroups(source, groups = []) {
  return groups.every((group) => validateLegacyActionFieldGroup(source, group));
}

export function linkValueToLegacyLinkProps(link) {
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
