# HUD Editor UI Design Rules

This is the canonical UI contract for front-of-site HUD editors. Billboard HUD is the reference implementation. New HUD work should reuse shared components, styles, and behavior instead of creating editor-specific versions.

## Priorities

- Admin ease of use comes first.
- Keep controls tight, grouped, intentional, and easy to scan.
- Use rows and balanced groups to avoid a long left column with empty space on the right.
- Keep related controls together: heading, heading color, heading size, and similar sets.

## Shared visual language

- The editor window uses the full browser width.
- Every editor uses the same title bar, transparency, background, and editor-shell treatment.
- Groups use the glass style with no unnecessary parent box. If a container is needed, use a padded rounded box with an optional cap and footer.
- Do not use divider-line box styling.
- HUD fields are small, rounded fields. No regular-sized fields.
- HUD buttons are small pill buttons. Preview is the only regular-sized editor button.
- Every HUD editor gets the page selector on the left to reduce scrolling.
- Avoid eyebrow labels in editor groups unless they add context that the direct
  field or group title cannot provide. Prefer a clear field label or compact
  group title over decorative eyebrow text.

## Shared controls

The following are one system, not per-editor inventions:

- The save/action row below the title bar.
- Delete block, which returns to the last editor page.
- Admin nickname/rename control on the last editor page.
- Swatches, including size, spacing, selected/highlighted state, and available color options.
- Highlight text-color selection.
- Sliders, including their font, dimensions, spacing, and interaction states.
- Page navigation and editor section navigation.

### HUD swatch palette contract

The named HUD swatch system is `ColorPalette` with `variant="hud"`. It emits the shared `hud-standard-swatch-palette` class and uses circular, compact swatch buttons. HUD editors must not use the labeled/admin `variant="admin"` palette for content or appearance color controls; that palette is allowed to render square swatches and regular-sized labels.

The editor page is the visual group. Do not add a second glass parent around a reusable heading, color, or field control. Lead copy and other explanatory text fields may use a readable multiline height, but their controls remain within the compact HUD field system.

Change these at the shared component or token level so every HUD editor updates together. Individual editors may supply different field choices, but not a different visual system.

## Draft and publish behavior

- The shared action row is wired to the block currently being edited.
- `Save block draft` in a block editor means save that block draft only.
- `Make live` in a block editor means publish that block.
- The bottom page toolbar is page-wide: `Save all page drafts` saves every page draft, including order and page details; `Make live` publishes the page.
- Buttons must accurately reflect whether the scoped block or page has a change.
- After publish, draft badges and draft actions disappear when no scoped unpublished change remains.

See [Content Admin Draft Lifecycle](./content-admin-draft-lifecycle.md) for state and status rules.

## Implementation rule

Before adding a new HUD control, check whether the control already exists in the Billboard editor, shared editor shell, shared field grid, swatch system, button styles, or editor-control contract. Extend the shared point first. Add a new local variant only when the control’s behavior truly differs.

See [Editor Control Contract](./editor-control-contract.md) for field parity and persistence guardrails.
