const AFFECTED_LAYERS = Object.freeze([
  'active',
  'baseSnapshot',
  'seed',
  'revisions',
  'backups',
]);

const RETIRED_ROUTE_PATHS = Object.freeze([
  '/services/legacy-giving',
  '/services/retirement/403b-for-groups',
  '/services/planned-giving/generosity-fund',
]);

const BLOCK_ONLY_PATHS = Object.freeze([
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/charitable-trusts',
  '/services/planned-giving/endowments',
  '/services/planned-giving/donor-advised-fund',
  '/services/planned-giving/ministry-impact-fund',
]);

export const CONTENT_ADMIN_MIGRATION_AFFECTED_LAYERS = AFFECTED_LAYERS;

export const CONTENT_ADMIN_MIGRATION_ADAPTERS = Object.freeze([
  {
    id: 'managed-path-aliases',
    category: 'compatibility-boundary',
    paths: RETIRED_ROUTE_PATHS,
    helpers: Object.freeze(['DEFAULT_MANAGED_PATH_ALIASES']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No active, seed, revision, or backup content-bearing route keys or links use retired paths; canonical redirects are confirmed externally.',
  },
  {
    id: 'block-only-page-inventory-reconciliation',
    category: 'snapshot-migration',
    paths: BLOCK_ONLY_PATHS,
    helpers: Object.freeze(['shouldRetireBlockOnlyShellBlock', 'reconcileBlockOnlyManagedBlockInventory']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No active, seed, revision, or backup block-only route contains a retired shell-owned block shape.',
  },
  {
    id: 'generosity-fund-donor-advised-fund-refresh',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/planned-giving/donor-advised-fund', '/services/planned-giving', '/services']),
    helpers: Object.freeze(['normalizeGenerosityFundPageHierarchyEntry', 'normalizeGenerosityFundRouteLabelsInSettings', 'migrateGenerosityFundSnapshot']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No active, seed, revision, or backup snapshot contains the retired Generosity Fund route shape, title, or link labels.',
  },
  {
    id: 'retirement-403b-snapshot-repairs',
    category: 'snapshot-migration',
    paths: Object.freeze([
      '/services/retirement/403b',
      '/services/retirement/403b/403b-individual-enrollment',
      '/services/retirement/403b/403b-group-enrollment',
      '/services/retirement/rollovers',
    ]),
    helpers: Object.freeze(['normalizeRetirement403bBlockSet', 'isRetiredRetirement403bCta']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: '403(b) and rollover snapshots are versioned past the repair and old backups are archived outside active restore flows.',
  },
  {
    id: 'planned-giving-retired-static-comparison',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/planned-giving']),
    helpers: Object.freeze(['normalizePlannedGivingOverviewBlockSet', 'normalizeRetiredBlockCollaborationEntry']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No planned-giving active, seed, revision, or backup snapshot contains the retired static comparison table.',
  },
  {
    id: 'retirement-ira-block-shape',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/retirement/iras']),
    helpers: Object.freeze(['normalizeRetirementIraComparisonTableSettings', 'normalizeRetirementIraBlockSet']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'IRA snapshots no longer contain the old comparison-table shape or right-aligned daily billboard contract.',
  },
  {
    id: 'loans-dynamic-block-upgrade',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/loans']),
    helpers: Object.freeze(['LOANS_RETIRED_DYNAMIC_BLOCK_IDS', 'shouldUpgradeRetiredLoansDynamicBlock']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'Loan snapshots no longer contain pre-dynamic block records.',
  },
  {
    id: 'property-casualty-request-repair',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/insurance/property-casualty-insurance']),
    helpers: Object.freeze(['shouldQuarantinePropertyCasualtyRequestContent']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'Property/casualty request-form snapshots are versioned and old backups are archived outside active restore flows.',
  },
  {
    id: 'target-bridge-snapshot-cleanup',
    category: 'snapshot-migration',
    paths: Object.freeze(['all managed routes']),
    helpers: Object.freeze(['stripRetiredTargetBridgeSettingsFromState']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No active, seed, revision, or backup settings contain retired target bridge fields.',
  },
  {
    id: 'split-link-compatibility',
    category: 'compatibility-boundary',
    paths: Object.freeze(['all managed routes']),
    helpers: Object.freeze(['normalizeSplitLinkFieldSettings', 'coerceLinkValueFromFields']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No persisted block settings or revision snapshots contain split URL/PageRef/OpenInNewWindow fields.',
  },
  {
    id: 'cta-form-slot-compatibility',
    category: 'compatibility-boundary',
    paths: Object.freeze(['all cta_form blocks']),
    helpers: Object.freeze(['buildCtaFormSlotFields', 'stripCtaFormSlotFieldSettings']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'No persisted CTA form settings or editable fields use legacy slot fields.',
  },
  {
    id: 'cga-secure-act-content-compatibility',
    category: 'content-migration',
    paths: Object.freeze(['/services/planned-giving/charitable-gift-annuities']),
    helpers: Object.freeze(['normalizeCgaSecureActBlocks']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'CGA content is on the canonical block schema and no legacy secure-act compatibility shape remains in restorable snapshots.',
  },
]);

export function getContentAdminMigrationAdapterInventory() {
  return CONTENT_ADMIN_MIGRATION_ADAPTERS;
}
