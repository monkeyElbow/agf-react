# Block Authority and Catalog

## Lifecycle

Blueprints are starter definitions. They create a block when an admin adds one, initializes a new route, or explicitly requests a reset. They do not remain the authority for an established active block.

The active saved block is the content authority. Load and render code may normalize record shape and apply declared presentation defaults, but it must preserve valid editable values, explicit empty values, block deletion, and block order. A renderer must fail closed when a managed block is missing unless starter rendering was explicitly requested.

Publishing moves the active draft to the published snapshot. Promotion is a separate, explicit operation that updates seed or blueprint data. Runtime rendering never promotes or republishes content.

## Normalization boundaries

- **Schema normalization** canonicalizes field shape and types while preserving valid content.
- **Presentation contract** owns only explicitly declared presentation fields for a stable preset or contract; those fields must be locked or clearly unavailable in the editor.
- **Versioned migration** converts a known legacy schema once, records completion, and has a retirement condition.
- **Starter initialization** creates a new block from a blueprint.
- **Destructive repair** is an explicit maintenance/admin operation that reports what it will replace and never runs during ordinary load or render.

Marketing copy, route names, block IDs, or seed comparisons are not selectors for presentation repair.

## Taxonomy

1. **Standard block**: reusable content model with no pathname or fixed-ID dependency.
2. **Preset/variant**: the same content model with a stable preset ID and declared presentation differences.
3. **Specialized site feature**: specialized behavior with a stable `featureId`, named owner, limited availability, declared editable fields, and a reason it cannot be represented by a standard block.
4. **Functional route component**: route behavior such as search, sitemap, careers, forms, prospectus, or calculators that is not ordinary page composition.
5. **Migration-only compatibility type**: import/repair boundary, hidden from Add Block, with a retirement condition.

Decision tree: use a preset when the content model already exists; use a standard block for a new reusable model; use a site feature for genuinely specialized behavior; use a functional route for route-owned behavior; use migration-only for legacy import compatibility. If none applies, stop and classify it before implementation.

## Add Block catalog

Catalog visibility is explicit:

- `standard`: shown on compatible pages and safe for normal admin use.
- `contextual`: shown only for allowed page families/routes.
- `internal`: code-managed or advanced-only; absent from normal Add Block.
- `hidden`: retired, migration-only, or otherwise not admin-addable.

The catalog currently exposes standard editorial blocks and compatible contextual blocks. It hides `content`, internal hero/data/shell types, unclassified kinds, and generic `site_feature` entries. Route-owned site features remain available only when their catalog entry explicitly permits the current route.

## `page_content` and `site_feature`

`page_content` remains a compatibility/editorial type for general rich content. It is not a route-specific composition escape hatch. New page-content presets require an architecture reason explaining why an existing standard block or preset is insufficient.

`site_feature` is reserved for specialized runtime behavior. Every catalog entry records ownership, routes/families, catalog visibility, editable fields, the reason it cannot be a standard block, and a review/retirement note. Site-feature renderers must not infer content from pathname or marketing copy.

## Known migration backlog

The current normalization module still contains named legacy adapters for managed path aliases, block-only shell reconciliation, generosity-fund refresh, 403(b) snapshot repairs, planned-giving retired comparison data, IRA shape upgrades, and related historical imports. They are documented in `CONTENT_ADMIN_MIGRATION_ADAPTERS` and should be moved behind explicit versioned migration entry points as each snapshot family is retired.

The former highest-risk generosity-fund managed-block replacement is now an explicit versioned snapshot migration (`generosity-fund-daf-refresh`, version 1). It requires a reference state, actor, and reason, records completion, and backs up before changing active or published snapshots; ordinary load/save never invokes it. It must be retired after active, seed, backup, and revision snapshots no longer contain the legacy route shapes. The same retirement rule applies to the 403(b) repairs once old snapshots are archived outside active restore flows.

## Prohibited shortcuts

- Do not merge blueprints into active state during normal normalization.
- Do not restore deleted blocks or reorder active blocks to match a blueprint.
- Do not use title/body text to choose a renderer or presentation contract.
- Do not import blueprints or seed data into managed renderers.
- Do not expose migration adapters in Add Block.
- Do not create a one-off block without choosing standard block, preset, site feature, functional route, or migration-only ownership.
