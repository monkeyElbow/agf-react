export const LINK_VALUE_KIND_VALUES = Object.freeze([
  'anchor',
  'document',
  'email',
  'external',
  'internal',
  'phone',
]);
export const SPLIT_LINK_HREF_SUFFIXES = Object.freeze(['Url', 'Path', 'Href']);
export const SPLIT_LINK_PAGE_REF_SUFFIX = 'PageRef';
export const SPLIT_LINK_OPEN_IN_NEW_WINDOW_SUFFIX = 'OpenInNewWindow';
export const CANONICAL_LINK_JSON_SUFFIX = 'LinkJson';

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

function isInternalLinkPath(value) {
  return String(value || '').trim().startsWith('/');
}

function readBooleanValue(value) {
  if (value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase();
    if (!token) {
      return false;
    }
    return token !== 'false' && token !== '0' && token !== 'off' && token !== 'no';
  }
  return Boolean(value);
}

function getSplitLinkHrefKeys(settings, baseKey) {
  return SPLIT_LINK_HREF_SUFFIXES
    .map((suffix) => `${baseKey}${suffix}`)
    .filter((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function inferSplitLinkBaseKey(fieldKey) {
  const key = String(fieldKey || '').trim();
  const suffix = [
    SPLIT_LINK_PAGE_REF_SUFFIX,
    SPLIT_LINK_OPEN_IN_NEW_WINDOW_SUFFIX,
    ...SPLIT_LINK_HREF_SUFFIXES,
  ].find((candidateSuffix) => key.endsWith(candidateSuffix));

  return suffix ? key.slice(0, -suffix.length) : '';
}

export function getCanonicalLinkJsonFieldId(baseKey) {
  const normalizedBaseKey = String(baseKey || '').trim();
  return normalizedBaseKey ? `${normalizedBaseKey}${CANONICAL_LINK_JSON_SUFFIX}` : '';
}

function inferCanonicalLinkJsonKeys({
  hrefKeys = [],
  toKeys = [],
  openInNewWindowKeys = [],
} = {}) {
  return Array.from(new Set([
    ...normalizeFieldKeyList(toKeys),
    ...normalizeFieldKeyList(hrefKeys),
    ...normalizeFieldKeyList(openInNewWindowKeys),
  ]
    .map(inferSplitLinkBaseKey)
    .filter(Boolean)
    .map(getCanonicalLinkJsonFieldId)));
}

export function parseLinkValueJson(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return createLinkValue(value);
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return createLinkValue(JSON.parse(value));
  } catch {
    return null;
  }
}

export function serializeLinkValue(link) {
  const normalized = createLinkValue(link);
  return normalized ? JSON.stringify(normalized) : '';
}

export function normalizeSplitLinkFieldSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  let changed = false;
  const nextSettings = { ...settings };

  Object.entries(settings).forEach(([key, value]) => {
    if (key.endsWith(SPLIT_LINK_OPEN_IN_NEW_WINDOW_SUFFIX) && value !== true && value !== false) {
      nextSettings[key] = readBooleanValue(value);
      changed = true;
      return;
    }

    if (!key.endsWith(SPLIT_LINK_PAGE_REF_SUFFIX)) {
      return;
    }

    const pageRef = readFirstStringField(settings, [key]);
    const baseKey = key.slice(0, -SPLIT_LINK_PAGE_REF_SUFFIX.length);
    const hrefKeys = getSplitLinkHrefKeys(settings, baseKey);

    if (pageRef && !isInternalLinkPath(pageRef)) {
      const emptyHrefKey = hrefKeys.find((hrefKey) => !readFirstStringField(settings, [hrefKey]));
      if (emptyHrefKey) {
        nextSettings[emptyHrefKey] = pageRef;
      }
      nextSettings[key] = '';
      changed = true;
      return;
    }

    const internalHref = hrefKeys
      .map((hrefKey) => [hrefKey, readFirstStringField(settings, [hrefKey])])
      .find(([, href]) => isInternalLinkPath(href));

    if (!pageRef && internalHref) {
      nextSettings[key] = internalHref[1];
      changed = true;
    }

    const canonicalTarget = pageRef || internalHref?.[1] || '';
    if (!canonicalTarget) {
      return;
    }

    hrefKeys.forEach((hrefKey) => {
      const href = readFirstStringField(settings, [hrefKey]);
      if (pageRef || !href || isInternalLinkPath(href)) {
        if (href !== canonicalTarget) {
          nextSettings[hrefKey] = canonicalTarget;
          changed = true;
        }
      }
    });
  });

  Object.keys(nextSettings).forEach((key) => {
    if (!key.endsWith(SPLIT_LINK_PAGE_REF_SUFFIX)) {
      return;
    }

    const baseKey = key.slice(0, -SPLIT_LINK_PAGE_REF_SUFFIX.length);
    const hrefKeys = getSplitLinkHrefKeys(nextSettings, baseKey);
    const linkValue = coerceLinkValueFromFields(nextSettings, {
      hrefKeys,
      toKeys: [key],
      openInNewWindowKeys: [`${baseKey}${SPLIT_LINK_OPEN_IN_NEW_WINDOW_SUFFIX}`],
      preferLinkJson: false,
    });
    const linkJsonKey = getCanonicalLinkJsonFieldId(baseKey);
    const nextLinkJson = serializeLinkValue(linkValue);

    if (nextLinkJson && nextSettings[linkJsonKey] !== nextLinkJson) {
      nextSettings[linkJsonKey] = nextLinkJson;
      changed = true;
    } else if (!nextLinkJson && Object.prototype.hasOwnProperty.call(nextSettings, linkJsonKey)) {
      delete nextSettings[linkJsonKey];
      changed = true;
    }
  });

  return changed ? nextSettings : settings;
}

export function coerceLinkValueFromFields(source, {
  linkJsonKeys = [],
  preferLinkJson = true,
  kindKeys = ['kind'],
  documentIdKeys = ['documentId'],
  toKeys = ['to', 'pageRef'],
  hrefKeys = ['href', 'url'],
  openInNewWindowKeys = ['openInNewWindow'],
} = {}) {
  if (preferLinkJson) {
    const canonicalKeys = Array.from(new Set([
      ...normalizeFieldKeyList(linkJsonKeys),
      ...inferCanonicalLinkJsonKeys({ hrefKeys, toKeys, openInNewWindowKeys }),
    ]));
    for (const key of canonicalKeys) {
      const linkValue = parseLinkValueJson(readFirstFieldValue(source, [key]));
      if (linkValue) {
        return linkValue;
      }
    }
  }

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
