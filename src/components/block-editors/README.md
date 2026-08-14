# Block Editors

## Buffered Draft Field Pattern

Use buffered local draft fields for text-like inputs that are vulnerable to autosave/shared draft refresh thrash.

### Use this pattern when

Apply buffered draft handling when a field:

- accepts active typing over multiple keystrokes
- is rendered in a block editor that rehydrates from shared draft state
- can be edited while autosave or multi-user draft updates are happening
- has paired link/url/ref state that can snap back during stale rerenders

Typical examples:

- headline/title fields
- body/description text
- CTA label
- CTA URL/path
- promo-style route-link fields with paired route-ref state

### Do not use this pattern when

Avoid buffered local drafts for fields that should commit immediately and are not typing-sensitive, such as:

- toggles
- select/dropdown changes
- simple checkboxes
- explicit visibility flags
- one-click preset or feature selection controls

### Why this exists

Direct keystroke-to-shared-state updates are fragile in draft mode because:

- autosave can refresh shared props while the user is typing
- multi-user draft activity can rehydrate stale values into the active input
- paired route-ref/url state can cause fields to snap back or replay text incorrectly

Buffered local drafts prevent active input from being stomped while preserving normal save behavior.

### Required behavior

For buffered text-like fields:

- keep a local draft value while the input is active
- commit to shared block state on blur and/or short debounce
- do not let stale shared props overwrite the active local draft mid-edit
- preserve paired route-ref syncing where needed
- buffer the visible URL/path field even if the paired route-ref metadata still needs immediate sync

### Current reference implementation

Use the shared buffered helper in:

- `src/components/block-editors/migratedBlockEditors.jsx`

This pattern is currently applied to:

- `site_feature`
- `feature_panel`
- `split_panel`
- `impact_stat`
- `services_grid`
- `card_grid`
- `calculator_cta`
- `billboard`
- `intro`
- `cta_form`
- `request_form`
- `columns`
- `photo_column`

## Shared Heading Draft Stability

`ColorTextSelectionEditor` now buffers heading/title text locally while typing and commits the text plus remapped highlight JSON on blur and/or short debounce. Explicit span/color actions still commit immediately so highlight editing stays responsive.

Current shared-heading coverage:

- `cta_form`
- `request_form`
- `intro`
- `card_grid`
- `newsletter`
- `columns`

### Guardrail expectation

Any editor using this pattern should have tests proving:

- stable typing during stale rerenders/shared draft refresh
- correct debounce/blur commit behavior
- correct paired route-ref sync behavior where applicable

### Rule of thumb

If a field is text-heavy and users can visibly lose or replay characters while typing, it should not write directly into shared draft state on every keystroke.

Promo-style editor text fields now buffer local draft input before committing to shared state. This avoids autosave and shared-draft rehydration stomping active typing, which previously caused flicker, snapback, and replay in fields like headline, body, CTA label, and CTA URL. Paired route-ref sync is preserved where needed, while the visible URL/path field stays buffered for stable editing.
