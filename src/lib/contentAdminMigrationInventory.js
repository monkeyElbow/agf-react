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
    status: 'retired',
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-403b-snapshot-repairs.json',
    retireWhen: 'Retired after the final zero-finding scan and current-schema restore proof; see the retirement receipt.',
  },
  {
    id: 'planned-giving-retired-static-comparison',
    status: 'retired',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/planned-giving']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/planned-giving-retired-static-comparison.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
  },
  {
    id: 'qcd-centered-card-grid',
    category: 'content-migration',
    paths: Object.freeze(['/services/planned-giving/qualified-charitable-distribution']),
    helpers: Object.freeze(['migrateQcdCenteredCardGridState']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'Retired after the QCD card grid has the centered presentation and no untouched placeholder cards remain in active, base, revision, or backup snapshots.',
  },
  {
    id: 'retirement-ira-block-shape',
    status: 'retired',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/retirement/iras']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-ira-block-shape.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
  },
  {
    id: 'loans-dynamic-block-upgrade',
    status: 'retired',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/loans']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/loans-dynamic-block-upgrade.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
  },
  {
    id: 'property-casualty-request-repair',
    status: 'retired',
    category: 'snapshot-migration',
    paths: Object.freeze(['/services/insurance/property-casualty-insurance']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/property-casualty-request-repair.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
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
    status: 'retired',
    category: 'compatibility-boundary',
    paths: Object.freeze(['all cta_form blocks']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/cta-form-slot-compatibility.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
  },
  {
    id: 'cga-secure-act-content-compatibility',
    status: 'retired',
    category: 'content-migration',
    paths: Object.freeze(['/services/planned-giving/charitable-gift-annuities']),
    helpers: Object.freeze([]),
    affectedLayers: AFFECTED_LAYERS,
    retirementReceipt: 'docs/content-admin-adapter-retirements/cga-secure-act-content-compatibility.json',
    retireWhen: 'Retired after the final zero-finding scan; see the retirement receipt.',
  },
  {
    id: 'cga-secure-act-card',
    category: 'content-migration',
    paths: Object.freeze(['/services/planned-giving/charitable-gift-annuities']),
    helpers: Object.freeze(['migrateCgaSecureActCardState']),
    affectedLayers: AFFECTED_LAYERS,
    retireWhen: 'Retired after the SECURE 2.0 content and gift bullets are stored in gift_assets.card1Body, legacy secure_act, duplicate BodyHtml fields, and card ListJson are absent, and active, base, revision, and backup snapshots agree.',
  },
]);

export function getContentAdminMigrationAdapterInventory() {
  return CONTENT_ADMIN_MIGRATION_ADAPTERS;
}
