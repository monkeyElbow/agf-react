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

const INVENTORY = Object.freeze([
  Object.freeze({
    id: 'services_cards',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.temporaryRetained,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: true,
    futureRetirementCandidate: true,
    reason: 'Static services card-grid compatibility template id still survives in preset lookup and static insertion flow while canonical template identity is card_grid.',
  }),
  Object.freeze({
    id: 'investment_strategy_options',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active card-grid preset template id still used by persisted investment-options content and seeded pages.',
  }),
  Object.freeze({
    id: 'who_qualifies',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active card-grid preset template id still used by persisted eligibility-card content and seeded pages.',
  }),
  Object.freeze({
    id: 'loan_apply',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active card-grid preset template id still used by persisted step-card content and seeded pages.',
  }),
  Object.freeze({
    id: 'columns_mha',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active columns preset template id still used by persisted housing-allowance content and seeded pages.',
  }),
  Object.freeze({
    id: 'columns_math',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active columns preset template id still used by persisted do-the-math content and seeded pages.',
  }),
  Object.freeze({
    id: 'value_cards',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active columns preset template id still used by persisted value-cards content and seeded pages.',
  }),
  Object.freeze({
    id: 'investor_cta',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Active CTA-band preset template id still used by persisted dashboard-login content and seeded pages.',
  }),
  Object.freeze({
    id: 'loan_options',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    retiredInsertModes: Object.freeze(['static']),
    reason: 'Retired static card-grid template id remains only as a persisted-content bridge and future cleanup candidate.',
  }),
  Object.freeze({
    id: 'certificates',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    retiredInsertModes: Object.freeze(['static']),
    reason: 'Retired static card-grid template id remains only as a persisted-content bridge and future cleanup candidate.',
  }),
  Object.freeze({
    id: 'plan_features',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    retiredInsertModes: Object.freeze(['static']),
    reason: 'Retired static card-grid template id remains only as a persisted-content bridge and future cleanup candidate.',
  }),
  Object.freeze({
    id: 'housing_allowance',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    retiredInsertModes: Object.freeze(['static']),
    reason: 'Retired static CTA-band template id remains only as a persisted-content bridge and future cleanup candidate.',
  }),
  Object.freeze({
    id: 'matters_band',
    surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    retiredInsertModes: Object.freeze(['static']),
    reason: 'Retired static CTA-band seed id remains only as a persisted-content bridge and future cleanup candidate.',
  }),
  Object.freeze({
    id: 'services_cards',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.temporaryRetained,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: true,
    futureRetirementCandidate: true,
    reason: 'Static services card-grid lookup id still backs seeded/static insertion while canonical template identity is card_grid.',
  }),
  Object.freeze({
    id: 'loan_options',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    reason: 'Retired static loan grid block id still resolves default card-grid preset for persisted content.',
  }),
  Object.freeze({
    id: 'certificates',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    reason: 'Retired static certificates block id still resolves default card-grid preset for persisted content.',
  }),
  Object.freeze({
    id: 'plan_features',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    reason: 'Retired static plan-features block id still resolves default card-grid preset for persisted content.',
  }),
  Object.freeze({
    id: 'investment_strategy_options',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted investment-options block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'who_qualifies',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted eligibility-cards block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'loan_apply',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted step-cards block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'columns_mha',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted housing-allowance column block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'columns_math',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted do-the-math column block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'value_cards',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted value-cards block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'housing_allowance',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    reason: 'Retired CTA-band block id still resolves the default CTA-band preset for persisted content.',
  }),
  Object.freeze({
    id: 'investor_cta',
    surface: COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted dashboard-login CTA block ids still need canonical preset resolution.',
  }),
  Object.freeze({
    id: 'resolveCardGridPresetId',
    surface: COMPATIBILITY_BRIDGE_SURFACES.lookupHelper,
    owner: 'card_grid',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Canonical preset resolver still maps persisted card-grid template ids and legacy block ids onto canonical preset ids.',
  }),
  Object.freeze({
    id: 'resolveColumnsPresetId',
    surface: COMPATIBILITY_BRIDGE_SURFACES.lookupHelper,
    owner: 'columns',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Canonical preset resolver still maps persisted columns template ids and legacy block ids onto canonical preset ids.',
  }),
  Object.freeze({
    id: 'resolveCtaBandPresetId',
    surface: COMPATIBILITY_BRIDGE_SURFACES.lookupHelper,
    owner: 'cta_band',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Canonical preset resolver still maps persisted CTA-band template ids and legacy block ids onto canonical preset ids.',
  }),
  Object.freeze({
    id: 'normalizePresetBearingBlockIdentity',
    surface: COMPATIBILITY_BRIDGE_SURFACES.normalizationHelper,
    owner: 'preset_family',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Persisted preset-bearing blocks still need explicit presetId normalization after historical ids are read.',
  }),
  Object.freeze({
    id: 'normalizePresetBearingBlocks',
    surface: COMPATIBILITY_BRIDGE_SURFACES.normalizationHelper,
    owner: 'preset_family',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: false,
    reason: 'Seed/admin block arrays still normalize preset-bearing identities after loading historical ids.',
  }),
  Object.freeze({
    id: 'ContentAdminContext:/rates rates_table->rates',
    surface: COMPATIBILITY_BRIDGE_SURFACES.normalizationHelper,
    owner: 'rates',
    classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.temporaryRetained,
    canonicalDefault: false,
    persistedContentBridge: true,
    insertDefaultSurface: false,
    futureRetirementCandidate: true,
    reason: 'Retained only to migrate stale local /rates admin state with legacy rates_table blocks onto canonical rates before runtime/editor code sees them.',
  }),
]);

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
