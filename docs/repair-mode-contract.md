# Repair mode contract

This contract applies when an admin reports that a browser-facing behavior is
broken, missing, ineffective, or different from the requested behavior without
asking for a redesign.

## Durable rule

One prompt must produce one identified owner, one bounded change, and one
browser proof. Unit tests, lint, and a production build support the proof; they
do not replace it.

## REPAIR MODE

1. Reproduce the actual browser failure first.
2. Identify the active route, block ID, content source, revision, and renderer.
3. Trace one value or behavior through the real runtime.
4. Find the first boundary where expected behavior diverges.
5. Change only that boundary.
6. Preserve the requested interaction; do not redesign or replace it.
7. Do not remove a control because its propagation is broken.
8. Do not change the data shape unless the broken boundary requires it.
9. Verify authority readback when persistence is involved.
10. Verify DOM and computed browser output.
11. Verify HUD on/off when the behavior crosses that boundary.
12. Do not report completion from callback or unit tests alone.
13. Report the reproduced failure, first broken boundary, exact files changed,
    browser proof before, and browser proof after.

If the repair appears to require an architectural redesign, stop and explain
the boundary and proposed redesign before changing UX or data contracts.

## Minimum Definition of Done

```text
actual route loaded
actual block identified
active source identified
active renderer identified
failure reproduced
first broken boundary identified
repair applied only there
browser output verified
```

For persistence:

```text
input
→ request
→ authority readback
→ active revision
→ renderer
→ browser output
```

For styling:

```text
requested value
→ rendered element
→ computed browser style
```

For links:

```text
requested interaction
→ rendered link/button structure
→ browser click behavior
```

## Browser proof helper

The existing route verifier is also the authority verifier. It can inspect a
specific block without changing content:

```bash
npm run verify:authority -- \
  --path=/services/planned-giving/ministry-impact-fund \
  --block-id=gift_types \
  --selector="li" \
  --style="font-size,line-height" \
  --css-vars="--planned-giving-bullet-size,--planned-giving-bullet-line-height" \
  --readback-keys=cardBulletSizeRem,cardBulletLineHeight \
  --expect-renderer="NativeContentPage.buildManagedBlockSection" \
  --expect-source=draft \
  --expect-hud=true
```

For a card-link repair:

```bash
npm run verify:authority -- \
  --path=/services/planned-giving/charitable-trusts \
  --block-id=trust_type_cards \
  --link-selector="a"
```

The output includes the runtime descriptor, authority readback, DOM text,
computed styles, CSS variables, inline styles, matched CSS rules where the
browser exposes them, and rendered links. A renderer or source mismatch fails
with an explicit wrong-owner message.

## Guardrail metadata

Every new guardrail must state:

```text
Durable rule protected:
Legitimate admin action still allowed:
Protected layer:
Failure symptom:
Proof method:
Retirement condition:
```
