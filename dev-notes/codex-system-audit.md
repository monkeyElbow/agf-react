# Codex system audit log

## Mission

Act as the site's NASA-engineer wiring and structure auditor. During dedicated
audit time, seek out bad connections, inconsistent block structures, stale
ownership/HUD state, controls that do not reach their renderer, and publish or
persistence paths that lose changes. Make evidence-backed fixes on the user's
behalf when they align with the project's guardrails, shared block contracts,
editor persona, ownership rules, and content-safety rules.

## Operating rules

- Inspect the shared contract before touching a page-specific implementation.
- Prefer one proven, reversible fix at a time; extend it only after tests prove
  the contract is safe for other route classes.
- Treat browser diagnostics, ownership state, persistence state, and rendered
  DOM/CSS as separate evidence. Do not infer success from a changed control
  alone.
- Keep broad browser sweeps bounded. A harness timeout is not a product failure;
  isolate the route, block, and control before changing product code.
- Never overwrite or stage user-owned shared content state without explicit
  instruction. Keep `dev-data/content-admin-shared.json` out of audit commits
  when it is already dirty.
- Every session ends with checks run, fixes made, unresolved risks, and the next
  weakest point recorded here.

## Session template

### YYYY-MM-DD — dedicated audit session

Scope:

Checks:

Findings and fixes:

Verification:

Unresolved risks:

Next weakest point:

## Audit history

### 2026-09-12 — mission established

Scope: Establish the durable log and begin a dedicated wiring/structure audit.

Checks: To be recorded below as this session proceeds.

Findings and fixes: Mission and operating rules recorded. Existing dirty
`dev-data/content-admin-shared.json` is protected from staging.

Verification: Pending this session's audit.

Unresolved risks: Pending this session's audit.

Next weakest point: Identify the highest-risk shared connection after the first
bounded audit pass.

### 2026-09-12 — shared HUD and canonical CTA wiring audit

Scope: Shared `PageBlocksRenderer` block families, HUD focus/dimming lifecycle,
canonical CTA links in site-feature editors, representative billboard/card-grid
routes, and the existing system audit harness.

Checks:

- `npm run scan:system` passed. Route classification, block contracts,
  persistence bridges, snapshot schema, readability, retired-source checks,
  safety nets, and legacy adapters are green.
- `npm run test:control-reachability` passed with zero hard failures.
- Representative browser probes covered About history, Loans, 403(b),
  charitable trusts, and Investments growth-feature routes, including HUD
  close cleanup and representative billboard/card-grid controls.
- `git diff --check`, lint, build, targeted renderer/editor tests, and the full
  test suite passed. Full suite result: 322 files and 2,086 tests passed; the
  rates-import Node tests also passed.

Findings and fixes:

- `PageBlocksRenderer` accepted the active HUD panel and anchor map but did not
  apply focus/dimming classes to its rendered block roots. Added one shared
  `sectionHudClassName` decision at the renderer boundary and propagated it
  through every registered renderer family, including nested Columns and
  Investments growth-feature output. This closes the specific wiring failure
  without making page-specific renderers invent their own HUD state.
- Canonical `buttonLinkJson` values on site features could render correctly
  while the editor's buffered legacy `buttonUrl` draft stayed blank. The shared
  editor now resolves that draft from the canonical link source, with a test for
  external CTA URLs and the new-window state.
- The new-window CTA option is disabled when no valid target exists, preventing
  an orphan presentation flag from being edited as if it were a link.
- Browser audit close-state assertions and wrapped legacy-section targeting now
  distinguish actual HUD dimming from content-fade pseudo-elements. This keeps
  the audit from reporting renderer-wrapper false positives while still checking
  every block's cleanup state.

Verification:

- Shared renderer targeted tests: 6 files / 28 tests passed.
- System guardrails: 26 files / 254 tests passed.
- Browser probes found zero hard failures in the bounded route/control matrix;
  the only visual review was a trust billboard button-gap control with no
  configured action to move, so no product change was inferred from it.

Unresolved risks:

- The system scan still reports 430 visual effects as not independently
  unit/runtime verified. That is a coverage inventory, not a current failure;
  visual regression and keyboard gates remain future tooling work.
- A completely unfiltered dense charitable-trusts browser sweep remains too
  timeout-prone for useful evidence. Bounded route/block/control probes passed.
- The existing `dev-data/content-admin-shared.json` was already dirty and was
  neither overwritten nor staged.

Next weakest point: Build a bounded coverage matrix for the remaining visual
effects and publish acknowledgment paths, starting with one block family at a
time. Prioritize controls whose editor field, canonical settings value, and
rendered CSS variable are not all covered by the same test/probe. Keep each
change isolated and preserve the route/ownership/HUD guardrails above.

### 2026-09-12 — dynamic card-grid padding consumer audit

Scope: Standard dynamic card-grid card-shell padding consumers and the browser
audit's proof of rendered control effects across page-specific CSS layers.

Checks:

- Focused guardrails passed: 7 files / 107 tests.
- Full suite passed: 323 Vitest files / 2,088 tests, plus the 2 rates-import
  Node tests.
- `npm run lint` passed.
- Prior gates for this code state also passed: `npm run scan:system` and
  `npm run build`.
- Sequential browser probes passed for `trust_funding` on charitable trusts,
  `benefits` on Careers, `rollover_options` on rollovers, and
  `investment_strategy_options` on 403(b). Each changed the computed
  `.service-native-card` padding under `cardPaddingRem` and cleared HUD focus
  state after close.

Findings and fixes:

- Several page-specific card-grid rules wrote hardcoded `padding` values after
  the shared dynamic-grid rule. The editor could retain a changed value while
  the rendered card stayed unchanged. Standard dynamic card shells now consume
  `var(--dynamic-grid-card-padding, fallback)` across the audited Careers,
  403(b), retirement rollovers, insurance, planned-giving, and legacy-child
  families. Structural certificate/IRA shells and intentional inner heading or
  list padding remain isolated.
- The browser audit previously treated changed inline CSS variables and style
  attributes as rendered proof. It now removes those signals from the style
  signature, freezes animation/transition timing, and uses a computed padding
  proof for `cardPaddingRem`. The charitable-trust probe caught the hidden
  override before the repair and passed after it.
- Added source guardrails for the shared card-padding consumer contract and for
  the audit's anti-false-green behavior. Updated affected style ownership
  assertions to enforce the new contract.

Verification:

- The representative probes produced zero control failures and zero stale HUD
  focus targets. The dense combined probe was intentionally not used as a
  result because it included an invalid route/filter combination; corrected
  sequential probes are the evidence recorded above.
- `git diff --check` passed. The pre-existing dirty
  `dev-data/content-admin-shared.json` remained untouched and unstaged.

Unresolved risks:

- The system scan still inventories 430 visual effects without independent
  unit/runtime verification. This pass improved evidence quality for one
  control family; it does not prove every visual effect.
- Visual review, keyboard interaction, and publish acknowledgment remain
  separate coverage areas. Some named structural card shells intentionally do
  not follow generic scalar padding semantics and need a visual decision before
  any further unification.

Next weakest point: Apply the same computed-property proof to the canonical
card surface controls—background tone, outline, shadow, and text tones—on one
bounded block family, then inspect publish acknowledgment/error handling for
that family.

### 2026-09-12 — card appearance computed-property audit

Scope: Dynamic card-grid background, outline, shadow, and text-tone controls.
The contract audited was `control → setting key → renderer/CSS variable →
target selector → exact computed property`.

Checks:

- The browser audit now maps `bgTone` to `.service-native-section` computed
  `background`, outline controls to `.service-native-card` computed `border`,
  `border-color`, and `border-width`, shadow controls to computed
  `box-shadow`, and text tones to computed `color` on card `h3` and `p`/`li`
  targets. Inline variables and style attributes are not accepted as proof.
- Sequential representative browser probes passed 17 appearance control
  changes across charitable trusts, charitable gift annuities, Careers, and
  403(b), including trust funding background/shadow/body tone, trust
  differences title/body tone, CGA body tone, Careers and 403(b) background,
  shadow, title/body tone, strategy outline tone/width, and shadow opacity.
- Every browser probe also verified the HUD close state had no active panel,
  stale focus target, or page-level active-HUD class.
- `npm run lint`, `npm run scan:system`, and `npm run build` passed.
- Full suite passed: 323 Vitest files / 2,092 tests, plus the 2 rates-import
  Node tests. `git diff --check` passed.

Findings and fixes:

- The computed-proof harness had been querying the wrong property spelling for
  border and shadow, and background proofs missed sections where the root was
  itself the target. The mapping now uses CSS property names and root-aware
  target selection.
- Page-specific legacy card CSS overrode shared body/title variables in trust,
  CGA, Careers, life/group-life, generosity, and rollover card families. Those
  consumers now use the shared dynamic-grid body/title variables with explicit
  route fallbacks.
- Legacy alternating title selectors could mask an intentional title swatch.
  The shared renderer now carries an explicit title-tone override class and a
  final shared rule, while default authored highlight accents remain intact.
- Changing outline tone or width now explicitly enables the outline, so a
  value cannot be saved into an inactive Default outline mode.
- Presentations whose card titles are intentionally hidden no longer expose an
  unprovable card-title color control. Parity tests use a visible-title sample
  for the generic card-grid contract.
- Added guardrails for computed appearance mappings, shared text-tone
  consumers, outline activation, and hidden-title editor parity.

Unresolved risks:

- The system scan still inventories 430 visual effects without independent
  unit/runtime verification. This pass proves the bounded card appearance
  family, not every visual effect.
- Visual regression, keyboard/a11y smoke, and publish acknowledgment/error
  paths remain separate gates. Some ownership-blocked routes were not probed;
  no product failure was inferred from those routes.
- The pre-existing `dev-data/content-admin-shared.json` remained untouched
  and unstaged.

Next weakest point: Audit publish acknowledgment and error handling for the
same card-appearance controls, then take one bounded background-lights/motion
family and prove its pseudo-element or layer-level computed effects.

### 2026-09-12 — publish settlement and background-layer audit

Scope: Block-level live-publish verification settlement and the canonical
background-lights editor/rendering path, using the About intro as one bounded
enabled-light and motion sample.

Checks:

- Focused background/editor/audit guardrails passed: 3 files / 8 tests.
- Operator publish smoke suite passed: 18 tests, including a mismatched live
  block response.
- Browser probes passed sequentially for the global background-lights toggle
  and Light 1 motion style. They changed computed `display` on
  `.block-background-effects` and computed `animation-name` on
  `.block-background-light`, respectively. HUD close cleanup also passed.
- `npm run lint`, `npm run scan:system`, and `npm run build` passed. The build
  retained only existing chunk-size and dynamic-import advisories.
- Full suite passed: 323 Vitest files / 2,094 tests, plus the 2 rates-import
  Node tests. `git diff --check` passed.

Findings and fixes:

- Turning global background lights On only created a light when the saved
  array was empty. A saved array containing only disabled slots therefore
  produced an On state with no rendered layer. The canonical editor now
  reactivates a default first light whenever no slot is active, with a
  regression test.
- The Background lights setting now has a stable `backgroundEffectsJson`
  field identity, so browser audits can reach the global control after
  opening the canonical Background panel.
- The browser audit now proves the actual background layer display state and
  layer animation name for the bounded motion family, not merely the editor
  control or inline CSS variables.
- If a block publish endpoint returns a live block different from the block
  requested, the shared publish context now records `PUBLISH_FAILED` as well
  as the verification error. The operator cannot remain stuck in
  `PUBLISHING`; a regression test covers this exact mismatch.

Unresolved risks:

- The system scan still inventories 430 visual effects without independent
  unit/runtime verification. This pass proves one canonical background
  family sample, not every route's light configuration.
- Timeout/unknown publish paths are covered for page publishing; block
  timeout and committed-status permutations still deserve their own bounded
  operator cases.
- The pre-existing `dev-data/content-admin-shared.json` remained untouched
  and unstaged.

Next weakest point: Extend the layer-level background proof to one route with
cropping and one route with directional/ambient motion, then audit block-level
publish timeout reconciliation before broadening the browser matrix.
