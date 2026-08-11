# Editor Control Contract

HUD layout and visual decisions follow the [HUD Editor UI Design Rules](./hud-editor-ui-design-rules.md). Billboard HUD is the reference model; shared controls should be changed at their common source.

Run `npm run test:editor-controls` to exercise the canonical editor field list.

The suite checks two layers:

- `editorControlGrid.test.jsx` renders every declared field through the shared control grid and triggers its control. A missing callback, label, or control type fails the test.
- `editorControlDraftLiveContract.test.js` probes every admin and HUD field for every registered dynamic block. It verifies that each setting survives content-admin normalization as a draft, every HUD field has a matching admin persistence contract, and the published snapshot remains separate. The admin-field pass also checks that the renderer accepts the exact draft snapshot after publish.

The probe values are type-aware. Link, highlight, form-field, table, support-group, and hero-pie JSON controls receive valid structured probes instead of arbitrary strings. Conditional controls are evaluated from an activated probe snapshot so a control is not falsely marked broken just because its parent mode hides its output.

This is a contract test, not a browser smoke test. It does not replace a small number of real editor workflow checks for save draft, discard, and make live.
