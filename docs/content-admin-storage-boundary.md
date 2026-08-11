# Content Admin Storage Boundary

The content admin store now has a database-readiness boundary without changing the active persistence backend. Local development still persists to `dev-data/content-admin-shared.json`, and the JSON record shape is intentionally unchanged.

## Current Runtime Touch Points

The dev server creates the store in `vite.config.js` and exposes these content-admin endpoints:

- `GET /__dev/content-admin/state`
- `GET /__dev/content-admin/revisions?path=...`
- `GET /__dev/content-admin/backups`
- `POST /__dev/content-admin/initialize`
- `POST /__dev/content-admin/save-draft`
- `POST /__dev/content-admin/save-block-draft`
- `POST /__dev/content-admin/publish-page`
- `POST /__dev/content-admin/publish-seed-routes`
- `POST /__dev/content-admin/blocks/sync-draft`
- `POST /__dev/content-admin/restore-page-revision`
- `POST /__dev/content-admin/restore-block-revision`
- `POST /__dev/content-admin/reset`
- `POST /__dev/content-admin/restore-backup`
- `POST /__dev/content-admin/promote-seed`

The browser client helper is `src/lib/devContentAuthorityClient.js`. It talks to the endpoints above and should not know whether the backing store is JSON, SQLite, or another local persistence layer.

Snapshot audit scripts and guardrail tests still read `dev-data/*.json` directly because their job is to validate persisted files, not to serve runtime admin traffic.

## Adapter Operations

`createJsonContentStore` in `dev-server/contentAdminStore.js` is the current adapter implementation. The adapter is deliberately shaped around operations the app already performs:

- `readCurrentState()`
- `readPublishedSnapshot()`
- `saveBlockDraft(pathname, blockId, block, options)`
- `savePageDraft(state, options)`
- `publishPath(pathname, options)`
- `restorePageRevision(pathname, revisionId, options)`
- `restoreBlockRevision(pathname, revisionId, blockId, options)`
- `listRevisions(pathname)`
- `createBackup(reason, metadata)`
- `restoreBackup(fileName, options)`
- `validateSnapshot(snapshot, options)`

The older method names remain as compatibility aliases while existing tests and scripts are moved over gradually.

## Future SQLite Shape

A future SQLite adapter should implement the same operations and keep UI-facing return payloads compatible. Likely tables:

- `routes` or `pages`: pathname, page metadata JSON, aliases, updated timestamps.
- `blocks`: pathname, block id, sort order, kind, mode, settings JSON, editable fields JSON, draft metadata.
- `published_blocks` or `published_snapshots`: published block rows per pathname, or compact page-slice snapshots matching today’s `baseSnapshot`.
- `revisions`: pathname, revision id, actor JSON, reason, summary, created timestamp, page-slice snapshot JSON.
- `locks`: pathname, block id, actor JSON, lock timestamp, draft owner metadata.
- `backups`: backup id/file name, reason, metadata JSON, created timestamp, full snapshot payload or external artifact pointer.
- `schema_migrations`: migration id, applied timestamp, checksum if needed.

Avoid adding a generic repository layer. The SQLite implementation should remain operation-first and map these app commands directly to transactions.

## Transaction Boundaries

SQLite writes must be atomic for operations that currently rewrite the JSON record in one step:

- `saveBlockDraft`: update one block, its collaboration metadata, history entry, and updated timestamp together.
- `savePageDraft`: merge page blocks, page metadata, aliases, collaboration metadata, revision records, destructive-change backup metadata, and updated timestamp together.
- `publishPath`: copy the current page slice into the published snapshot, clear draft ownership, append publish history, and update timestamps together.
- `restorePageRevision`: create a pre-restore backup record and replace the page slice from the revision in one transaction.
- `restoreBlockRevision`: create a pre-restore backup record and replace the block in one transaction.
- `restoreBackup`: create a pre-restore backup record, replace all current/published state, and preserve restored revision data together.
- `createBackup`: capture a consistent snapshot. If backups are stored outside SQLite, write the artifact and backup metadata with a rollback or cleanup path.

Reads should use a consistent snapshot for current state, published/base state, revisions, and backups so admin screens do not mix two different publish moments.
