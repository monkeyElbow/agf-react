export const COMPATIBILITY_BRIDGE_CLASSIFICATIONS = Object.freeze({
  persistedContentRequired: 'persisted-content-required',
  temporaryRetained: 'temporary-retained',
  retirementCandidate: 'retirement-candidate',
});

export const COMPATIBILITY_BRIDGE_SURFACES = Object.freeze({
  templateId: 'template_id',
  legacyBlockId: 'legacy_block_id',
  blockKind: 'block_kind',
  lookupHelper: 'lookup_helper',
  normalizationHelper: 'normalization_helper',
  runtimeHelper: 'runtime_helper',
});

const INVENTORY = Object.freeze([]);

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesFilter(entry, filters = {}) {
  if (filters.surface && entry.surface !== filters.surface) {
    return false;
  }
  if (filters.owner && entry.owner !== filters.owner) {
    return false;
  }
  if (filters.classification && entry.classification !== filters.classification) {
    return false;
  }
  if (typeof filters.persistedContentBridge === 'boolean' && entry.persistedContentBridge !== filters.persistedContentBridge) {
    return false;
  }
  if (typeof filters.insertDefaultSurface === 'boolean' && entry.insertDefaultSurface !== filters.insertDefaultSurface) {
    return false;
  }
  if (typeof filters.futureRetirementCandidate === 'boolean' && entry.futureRetirementCandidate !== filters.futureRetirementCandidate) {
    return false;
  }
  return true;
}

export const COMPATIBILITY_BRIDGE_INVENTORY = INVENTORY;

export function getCompatibilityBridgeInventory(filters = {}) {
  return COMPATIBILITY_BRIDGE_INVENTORY.filter((entry) => matchesFilter(entry, filters));
}

export function getCompatibilityBridgeEntry(id, surface = '') {
  const token = normalizeToken(id);
  const normalizedSurface = normalizeToken(surface);
  return COMPATIBILITY_BRIDGE_INVENTORY.find((entry) => (
    normalizeToken(entry.id) === token
    && (!normalizedSurface || entry.surface === normalizedSurface)
  )) || null;
}

export function getCompatibilityBridgeIds(filters = {}) {
  return Object.freeze(Array.from(new Set(
    getCompatibilityBridgeInventory(filters)
      .map((entry) => entry.id)
      .filter(Boolean),
  )));
}

export const PERSISTED_COMPATIBILITY_BRIDGE_TEMPLATE_IDS = Object.freeze(
  getCompatibilityBridgeIds({
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    persistedContentBridge: true,
  }),
);

const RETIRED_INSERT_COMPATIBILITY_TEMPLATE_IDS_BY_MODE = Object.freeze(
  Object.fromEntries(
    ['static', 'dynamic'].map((mode) => ([
      mode,
      Object.freeze(
        COMPATIBILITY_BRIDGE_INVENTORY
          .filter((entry) => entry.surface === COMPATIBILITY_BRIDGE_SURFACES.templateId)
          .filter((entry) => Array.isArray(entry.retiredInsertModes) && entry.retiredInsertModes.includes(mode))
          .map((entry) => entry.id),
      ),
    ])),
  ),
);

export function getCentralRetiredInsertCompatibilityTemplateIds(mode) {
  const token = normalizeToken(mode);
  return RETIRED_INSERT_COMPATIBILITY_TEMPLATE_IDS_BY_MODE[token] || Object.freeze([]);
}

export function isCentralRetiredInsertCompatibilityTemplateId(templateId, mode) {
  const token = normalizeToken(templateId);
  return Boolean(token) && getCentralRetiredInsertCompatibilityTemplateIds(mode).includes(token);
}
