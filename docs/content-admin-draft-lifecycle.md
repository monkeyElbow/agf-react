# Content Admin Draft Lifecycle

HUD-specific layout and shared-control rules live in the [HUD Editor UI Design Rules](./hud-editor-ui-design-rules.md).

The editor has separate preview, draft, and published states. The status text should describe the state that is currently true.

## 1. Browser-memory buffer

When an admin types or changes a control, the preview updates immediately from a React state buffer in the browser. This is not `localStorage`, a database write, or a system draft. It is transient. The editor attempts to flush it when it closes, but a browser crash or interruption before the flush can lose that change.

The editor reports this as:

> In browser memory; not saved as a system draft yet.

## 2. Shared draft sync

After the admin pauses for 1.2 seconds, the buffer is committed and the content authority receives a debounced block-draft update. Today the development authority persists that update through its draft API. In a server-backed deployment, this is the same boundary as writing the draft row or document to the database. It remains unpublished.

The editor reports this as:

> Saving draft to shared content...

After the request settles, the editor reports that the draft was synced to shared content. A draft sync must never update the published snapshot.

## 3. Explicit Save Draft

Save Draft sends the page-level draft snapshot and gives the admin an explicit acknowledgement. This confirms the system draft is saved; it still does not publish the page.

All draft writes pass through one client-side draft coordinator. It has three
scopes—page, route, and block—and two block intents: explicit save and
background sync. The dev authority keeps separate HTTP adapters for those
operations, but the coordinator is the single place that defines their
payloads, validation, and timeout semantics. This boundary can later point at
the database adapter without changing editor behavior.

## 4. Make Live

Make Live is the only publishing action. It flushes pending draft edits, waits for draft synchronization, and then updates the published snapshot. Until that action succeeds, the live site must continue rendering the previous published snapshot.

## Status vocabulary

- **Editing locally:** preview-only browser memory buffer.
- **Saving draft:** draft write is queued or in flight.
- **Draft saved / synced:** shared draft persistence completed.
- **Published site:** separate live state; it changes only after Make Live.
