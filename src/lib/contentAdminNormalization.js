import { normalizePresetBearingBlockIdentity } from './blockPresetIdentity.js';
import { normalizeBlockPresentation } from './blockPresentationContracts.js';
import { normalizeSplitLinkFieldSettings } from './linkValue.js';
import { normalizeCollaborationState } from './contentAdminCollaboration.js';

// This version describes the record transformations below, not the renderer schema.
// Increment it when a new, non-destructive stored-record migration is introduced.
export const CONTENT_ADMIN_NORMALIZATION_VERSION = 1;

const RETIRED_DAF_PATH = '/services/planned-giving/generosity-fund';
const DAF_PATH = '/services/planned-giving/donor-advised-fund';
const LEGACY_DAF_PATH = '/services/legacy-giving/generosity-fund';
const PLANNED_GIVING_PATH = '/services/planned-giving';
function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function normalizeManagedContentPath(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }
  const withLeadingSlash = source.startsWith('/') ? source : `/${source}`;
  const compact = withLeadingSlash.replace(/\/{2,}/g, '/');
  return compact.length > 1 && compact.endsWith('/') ? compact.slice(0, -1) : compact;
}

function resolveAliasPath(pathname, aliases) {
  let current = normalizeManagedContentPath(pathname);
  const seen = new Set();
  let guard = 0;
  while (current && aliases?.[current] && !seen.has(current) && guard < 40) {
    seen.add(current);
    current = normalizeManagedContentPath(aliases[current]);
    guard += 1;
  }
  return current;
}

function normalizePathAliases(rawAliases, pageHierarchy) {
  const knownPaths = new Set(Object.keys(pageHierarchy || {}));
  const source = isObject(rawAliases) ? rawAliases : {};
  const aliases = {};

  Object.entries(source).forEach(([fromValue, toValue]) => {
    const from = normalizeManagedContentPath(fromValue);
    const to = normalizeManagedContentPath(toValue);
    if (!from || !to || from === to || knownPaths.has(from)) {
      return;
    }
    aliases[from] = to;
  });

  return Object.fromEntries(
    Object.entries(aliases)
      .map(([from, to]) => [from, resolveAliasPath(to, aliases)])
      .filter(([from, to]) => from && to && from !== to),
  );
}

function normalizePageHierarchy(rawHierarchy) {
  const source = isObject(rawHierarchy) ? rawHierarchy : {};
  const next = {};
  Object.entries(source).forEach(([key, rawPage]) => {
    if (!isObject(rawPage)) {
      return;
    }
    const pathname = normalizeManagedContentPath(rawPage.path || key);
    if (!pathname || pathname.startsWith('/admin/')) {
      return;
    }
    next[pathname] = {
      ...cloneJson(rawPage),
      path: pathname,
    };
  });
  return next;
}

function canonicalizeRouteLinkEditableFields(editableFields) {
  if (!Array.isArray(editableFields)) {
    return editableFields;
  }

  return editableFields
    .map((field) => {
      if (!isObject(field) || field.type !== 'route_link') {
        return field;
      }
      const fieldId = String(field.id || '').trim();
      const routeRefFieldId = String(field.routeRefFieldId || '').trim();
      const legacyHrefFieldId = String(field.legacyHrefFieldId || (fieldId.endsWith('LinkJson') ? '' : fieldId)).trim();
      const baseFieldId = String(routeRefFieldId || legacyHrefFieldId || fieldId)
        .replace(/(?:PageRef|Url|Path|Href|LinkJson)$/, '');
      const linkJsonFieldId = String(
        field.linkJsonFieldId
        || (fieldId.endsWith('LinkJson') ? fieldId : '')
        || (baseFieldId ? `${baseFieldId}LinkJson` : ''),
      ).trim();
      const {
        legacyHrefFieldId: _legacyHrefFieldId,
        routeRefFieldId: _routeRefFieldId,
        linkJsonFieldId: _linkJsonFieldId,
        openInNewWindowFieldId: _openInNewWindowFieldId,
        ...withoutLegacyMetadata
      } = field;
      return { ...withoutLegacyMetadata, id: linkJsonFieldId || fieldId };
    })
    .filter((field) => {
      const fieldId = String(field?.id || '').trim();
      return !fieldId.endsWith('PageRef') && !fieldId.endsWith('OpenInNewWindow');
    });
}

function normalizeBlockSettings(settings) {
  if (!isObject(settings)) {
    return {};
  }
  let next = normalizeSplitLinkFieldSettings(cloneJson(settings), { stripSplitFields: true });
  next = { ...next };
  return next;
}

/** Schema normalization plus declared presentation contracts. Inventory is untouched. */
export function normalizeContentAdminBlock(rawBlock) {
  if (!isObject(rawBlock)) {
    return cloneJson(rawBlock);
  }

  let nextBlock = cloneJson(rawBlock);
  if (!isObject(nextBlock.settings)) {
    return nextBlock;
  }
  nextBlock.settings = normalizeBlockSettings(nextBlock.settings);
  nextBlock = normalizePresetBearingBlockIdentity(nextBlock);
  nextBlock = normalizeBlockPresentation(nextBlock);

  if (Array.isArray(nextBlock.editableFields)) {
    nextBlock.editableFields = canonicalizeRouteLinkEditableFields(nextBlock.editableFields);
  }
  return nextBlock;
}

function migrateLegacyRouteAliases(state) {
  const source = state && typeof state === 'object' ? state : {};
  const pageHierarchy = cloneJson(source.pageHierarchy || {});
  const blocksByPath = cloneJson(source.blocksByPath || {});
  const collaborationByPath = cloneJson(source.collaborationByPath || {});
  const pathAliases = cloneJson(source.pathAliases || {});

  if (pageHierarchy[RETIRED_DAF_PATH] && !pageHierarchy[DAF_PATH]) {
    pageHierarchy[DAF_PATH] = {
      ...pageHierarchy[RETIRED_DAF_PATH],
      path: DAF_PATH,
      routeKey: DAF_PATH,
      linkRef: DAF_PATH,
      parentPath: PLANNED_GIVING_PATH,
    };
  }
  if (Array.isArray(blocksByPath[RETIRED_DAF_PATH]) && !Array.isArray(blocksByPath[DAF_PATH])) {
    blocksByPath[DAF_PATH] = blocksByPath[RETIRED_DAF_PATH];
  }
  if (collaborationByPath[RETIRED_DAF_PATH] && !collaborationByPath[DAF_PATH]) {
    collaborationByPath[DAF_PATH] = collaborationByPath[RETIRED_DAF_PATH];
  }
  delete pageHierarchy[RETIRED_DAF_PATH];
  delete blocksByPath[RETIRED_DAF_PATH];
  delete collaborationByPath[RETIRED_DAF_PATH];
  pathAliases[RETIRED_DAF_PATH] = DAF_PATH;
  pathAliases[LEGACY_DAF_PATH] = DAF_PATH;

  return { pageHierarchy, blocksByPath, pathAliases, collaborationByPath };
}

/** Versioned, non-inventory content migration. */
export function migrateContentAdminState(rawState, { fromVersion = 0 } = {}) {
  const source = isObject(rawState) ? rawState : {};
  const migrated = fromVersion < CONTENT_ADMIN_NORMALIZATION_VERSION
    ? migrateLegacyRouteAliases(source)
    : cloneJson(source);
  return migrated;
}

/**
 * Shared normal load/save normalizer. It never consults blueprints and never
 * changes block membership or order.
 */
export function normalizeContentAdminState(rawState, options = {}) {
  const source = isObject(rawState) ? rawState : {};
  const migrated = options.applyMigrations === false
    ? cloneJson(source)
    : migrateContentAdminState(source, options);
  const pageHierarchy = normalizePageHierarchy(migrated.pageHierarchy);
  const blocksByPathSource = isObject(migrated.blocksByPath) ? migrated.blocksByPath : {};
  const blocksByPath = Object.fromEntries(
    Object.entries(blocksByPathSource).map(([rawPath, rawBlocks]) => {
      const pathname = normalizeManagedContentPath(rawPath);
      return [pathname || rawPath, (Array.isArray(rawBlocks) ? rawBlocks : []).map(normalizeContentAdminBlock)];
    }),
  );

  return {
    pageHierarchy,
    blocksByPath,
    pathAliases: normalizePathAliases(migrated.pathAliases, pageHierarchy),
    collaborationByPath: normalizeCollaborationState(migrated.collaborationByPath, { maxHistoryEntries: Infinity }),
  };
}

export function normalizeContentAdminRecord(rawRecord) {
  const source = isObject(rawRecord) ? rawRecord : {};
  return {
    ...cloneJson(source),
    state: normalizeContentAdminState(source.state),
    baseSnapshot: normalizeContentAdminState(source.baseSnapshot),
  };
}

/** Starter/reset initialization is explicit and only normalizes supplied starter data. */
export function initializeContentAdminStarterState(starterState) {
  return normalizeContentAdminState(starterState, { applyMigrations: false });
}

/** Explicit repair hook. Normalization itself never invokes this operation. */
export function applyExplicitContentAdminRepair(state, repair) {
  if (typeof repair !== 'function') {
    throw new TypeError('An explicit content-admin repair function is required.');
  }
  return repair(cloneJson(state));
}
