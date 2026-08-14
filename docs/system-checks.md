# System Checks

System Checks are the repeatable safety gate for the block-first site. They are tooling and verification only; they must not change public copy, visual styling, page layout, or block behavior.

## Package Scripts

- `npm run scan:static`: fails if production source or active managed-content snapshots reintroduce static block creation or `mode: 'static'` block records.
- `npm run scan:route-classifications`: validates managed route classifications have no overlap and prints block-only, blockless, and special counts.
- `npm run scan:target-bridge`: fails if production source or active managed-content snapshots reintroduce retired `targetSection*`, `targetFineprintSectionKey`, `mappedSection`, or `targetedDynamic` bridge plumbing.
- `npm run scan:page-content`: checks active managed-content snapshots with managed-route awareness. `page_content` is allowed only on classified special routes that are not block-only or blockless functional routes. Source blueprint page-content convergence is covered by `npm run test:system-guardrails`.
- `npm run scan:snapshot-schema`: validates active shared/seed snapshot records against the current content admin schema version and state-root shape.
- `npm run scan:readability`: fails if large mixed-ownership source files are not documented with ownership and next split boundaries.
- `npm run scan:safety-nets`: prints and validates the visual/accessibility gate inventory and 2.0 readiness targets.
- `npm run scan:legacy-adapters`: validates the executable legacy and migration-adapter inventory against source symbols and persisted active layers.
- `npm run scan:migration-inventory`: prints adapter findings and snapshot-file manifest; add `-- --include-backups` to include backup files.
- `npm run scan:system`: runs all system scans.
- `npm run test:system-guardrails`: runs focused guardrails for source convergence, snapshot schema, route classification, readiness inventory, block-only shells, state normalization, admin operator smoke/recovery, style ownership, insert choices, link-model convergence, editor/runtime parity, and block registry contracts.
- `npm run check:system`: runs lint, all system scans, focused guardrails, the full test suite, and the production build.

## Editor CSS boundary

Public visitor styles stay in `src/styles.css` and the public feature sheets. Admin shell rules being migrated live in `src/styles/admin.css`. Front HUD rules live in `src/styles/front-hud.css`; page roots carry `.admin-front-hud-scope` as the browser-compatible selector-prefix migration boundary. Visitor mode does not add that class.

`src/styles/editorCssIsolation.guardrail.test.js` protects the import boundary, the first extracted admin rules, and HUD root coverage. Add new editor-only rules to a scoped editor sheet instead of adding generic selectors to the public stylesheet.

`src/lib/contentAdminGuardrailRegistry.js` is the executable policy index. Every durable guardrail names the rule it protects, the legitimate admin action it must preserve, and the verification that covers it.

`npm run scan:system` is the scan-only gate: it does not run Vitest, Node tests, lint, or the production build. `npm test` runs the full automated test suite, including the Node rates-import tests. `npm run check:system` is the combined release gate because it runs lint, scans, focused guardrails, `npm test`, and the production build; a passing scan alone is not a passing test or release result.

## Durable Content-Admin Policy

Every guardrail must name the durable rule it protects and the legitimate admin action it still allows. Guardrails are not successful if they merely block the operator; they must preserve safe editing and publishing.

- **One running authority:** protect the rule that only one Vite content-admin server owns shared content state, or clearly detect and report multiple running authorities. Admins must still be able to edit, save, and publish normally when one authority is running; restarting Vite may recover stale state but must not be required for ordinary edits.
- **Save truth:** protect the rule that a partial, rejected, timed-out, or otherwise blocked save never reports success. Admins must still retain their local changes and receive a visible failure state that can be retried.
- **Publish sequencing:** protect the rule that publishing always flushes local edits, saves the draft, reads back the saved block, publishes that exact revision, and verifies the resulting `baseSnapshot`. Admins must still be able to publish the intended latest edit from either the block editor or the page-wide admin controls.
- **Publish receipt:** protect the rule that every publish produces a receipt containing route, block ID when applicable, draft revision, published revision, actor, timestamp, and verification result. Admins must still receive a clear confirmation or failure reason tied to the action they took.
- **No restart dependency:** protect the rule that content operations remain correct across ordinary edits without a Vite restart. Admins must still be able to continue editing after saves, publishes, failed requests, and shared-state polling recoveries.
- **Browser proof:** protect the rule that an implementation is incomplete until the exact new title/body appears on the rendered route after publishing. Admins must still be able to verify the result on the public-facing route, not only in an editor or API response.

## Release Gate

Run these before release or before pushing a system cleanup pass:

```sh
npm run check:system
npm test
npm run build
git diff --check
```

`npm run check:system` already includes `npm test` and `npm run build`; the explicit commands are listed for reviewers who want to rerun the long gates separately. `git diff --check` stays outside the normal npm check because it depends on the current git working tree.

## Scope Rules

- Do not add public content checks that rewrite copy.
- Do not hide git working-tree checks inside normal npm scripts unless the script name clearly says it is a git check.
- Treat `contentBlockBlueprints` as starter templates and explicit reset templates, not ongoing managed-page inventory contracts. After a route has saved admin state, the saved block list and order are authoritative.
- Normal content-admin load, save, publish, restore, and render paths may migrate existing block schemas and clean invalid settings, but they must not restore missing starter blocks, require starter ids, force source order, or replace an admin-chosen block kind by id.
- If a route needs required content for legal or compliance reasons, that requirement must be explicit, documented, and surfaced in admin as a validation warning, not silently repaired by resurrecting source blueprint blocks.
- Keep the active content admin schema version in `src/lib/contentAdminSnapshotSchema.js`.
- Keep large-file readability boundaries and 2.0 readiness targets in `src/lib/systemReadinessInventory.js`.
- Keep special-route allowances sourced from `src/lib/managedPageShells.js` so block-only, blockless, and special routes do not drift apart.
- Treat the legacy adapter scan as an inventory. It should make known old-system adapters visible while cleanup continues; it is not proof that every listed adapter must remain.
- Content admin migration adapters must stay named with path scopes, helper names, and retirement criteria before deeper removal work starts.
- `/admin/blocks` is classified as a legacy snapshot diagnostic surface until it is converted into a permanent health dashboard or removed.
- Root product page fallback assemblies are classified as convergence adapters for later block-renderer cleanup, not as Pass 2 blockers.

## Admin Operator Coverage

`src/context/ContentAdminContext.operator-smoke.test.jsx` covers the provider-level operator path:

- edit block data
- save draft
- publish page
- rehydrate from the shared authority snapshot
- restore page revision
- restore selected block revision
- restore latest shared backup
- block passive foreign edits
- allow explicit takeover
- keep a failed shared save from hiding the local operator draft

This is not a visual/browser E2E replacement. Browser smoke, screenshots, keyboard checks, and accessibility checks remain separate System Checks work.

## Readiness Inventory

`src/lib/systemReadinessInventory.js` is the executable inventory for:

- large mixed-ownership files and their next split boundary
- currently covered visual/accessibility gates
- browser/visual/a11y gates that still need tooling
- 2.0 cleanup targets and retirement criteria

The inventory intentionally fails when a new large source file crosses the readability threshold without an owner and split plan.
