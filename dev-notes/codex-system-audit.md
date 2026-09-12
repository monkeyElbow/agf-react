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
