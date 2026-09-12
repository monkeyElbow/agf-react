# Editor control reachability audit

The audit has two layers. The structural layer runs with the normal Vitest
suite. The browser layer launches its own Vite authority with cloned temporary
content files and a temporary headless Chrome profile, so probes cannot touch
the working development snapshot.

## Structural/runtime audit

```bash
npm run test:control-reachability
```

This audits every registered block definition and reports a red test failure
when a setting is dropped or its runtime builder throws. `npm test` discovers
this test automatically.

## Browser/visual audit

Run directly from the repository (it starts and removes its isolated server):

```bash
npm run test:control-reachability:browser
```

The browser audit:

- launches an isolated temporary Chrome or Edge profile;
- enables the development HUD only in that profile;
- opens the configured route set;
- opens each rendered HUD block editor;
- exercises safe controls and permits draft-sync writes only inside its
  disposable isolated fixture; external targets explicitly supplied with
  `CONTROL_AUDIT_ALLOW_EXTERNAL=1` keep authority writes blocked;
- compares the block's DOM attributes, text, inline values, CSS variables, and
  computed style signature;
- exits with status 1 and lists the exact route, block, and setting when a
  control does not retain its probe value;
- reports controls that retain their staged value but have no visible DOM/style
  change as visual-review findings, since URL metadata and hidden conditional
  fields are valid non-visual settings.

The browser layer uses DOM-level probes, not human-trusted pointer/keyboard
events. Controlled range inputs and a small number of rerendering button groups
can therefore produce a browser-only retention finding even when the shared
React wiring test passes. Treat those findings as a prompt to reproduce the
same control manually; the focused component tests remain the authoritative
wiring check for those controls.

Useful options:

```bash
npm run test:control-reachability:browser -- --paths=/services/loans --wait-ms=400
npm run test:control-reachability:browser -- --paths=/services/loans --blocks=hero --wait-ms=400
npm run test:control-reachability:browser -- --paths=/services/retirement/403b --blocks=investment_strategy_heading --controls="Header gap" --wait-ms=400
BROWSER_BIN="/path/to/browser" npm run test:control-reachability:browser
```

`--blocks` and `--controls` are exact filters. A requested block or control
that is not rendered now fails the audit instead of producing a false green.
Use the visible control label for custom HUD controls and the editor field ID
for canonical field-grid controls.

Blocks with no HUD anchor are reported as skipped coverage. A requested route
that renders no block sections is a harness failure, so the audit cannot report
a false green after testing zero blocks. Known non-block routes are excluded
from the default route list. The isolated fixture is removed when the audit
exits, so it cannot change the repository's shared content or publish anything.
