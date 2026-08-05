# Content Admin Retention Policy

This document defines the implementation boundary for backup and revision retention. The project-owner decision for this cleanup is current-schema-only operational recovery; it does not preserve historical schema compatibility as a future restore target. It does not authorize an immediate destructive run.

## Current Safety Configuration

The default policy is intentionally unresolved and fails closed:

```js
{
  retentionPolicyStatus: 'unapproved',
  cleanupMode: 'current-schema-only',
  currentSchemaVersion: 1,
  preserveHistoricalSchemaCompatibility: false,
  obsoleteShapeAction: 'delete-candidate',
  automaticDeletionEnabled: false,
  backupRetentionDays: null,
  revisionRetentionDays: null,
  protectedReleaseCount: 3,
  archiveMode: null,
}
```

Until an approved policy is supplied, the runtime will not automatically delete backups, and the retention CLI will produce hold-only cleanup plans. Existing backup and revision files are not moved, rewritten, or deleted by the inventory pass.

## Framework

`npm run scan:content-admin-retention` inventories active state, published `baseSnapshot`, seed baseline, embedded revisions, external revisions, and backup files. Each manifest item records:

- layer and source path
- route scope
- actor and reason when present
- timestamp
- schema version and snapshot migration versions
- byte size and SHA-256 checksum
- restore eligibility and validation findings
- migration-scan status
- retention class

The cleanup planner classifies backup and revision records as `retain-current-recovery`, `retain-protected-current-release`, `delete-obsolete-shape-record`, `delete-expired-current-shape-duplicate`, or `unknown/hold`. It only treats clean records using the current schema as recovery targets. Historical schema versions and migration findings are deletion candidates, not restore fixtures. Unknown or invalid metadata remains hold-only. `--json` or `--output <path>` can be used for machine-readable inventory output.

The store's legacy `maxAutomaticBackups` setting is now subordinate to the retention policy. It cannot delete anything while the policy is unapproved or incomplete.

Any future deletion mutation must provide an explicit command flag, actor, reason, policy version, existing dry-run review artifact, existing before-manifest, after-manifest path, checksum verification, and confirmation value `DELETE`. The executor requires a passing current-schema recovery proof, verifies source checksums before deletion, and writes an append-only deletion manifest. It rejects incomplete metadata, protected current releases, and review artifacts whose classifications or checksums differ. Old-shape records are not archived or migrated.

## Required Policy Decisions

AGFinancial must approve:

1. Direct-restore retention periods for current-schema backups and revisions.
2. Active-restore location, storage durability, and access controls.
3. Authorized actors and approval evidence for the reviewed cleanup.
4. Protected release windows, incident holds, legal holds, and indefinite-preservation categories.
5. Whether deletion is permitted for obsolete-shape records and excess current-schema backups/revisions, and the required verification and audit record before it occurs.

An approved cleanup policy must identify the current schema, preserve only current-schema recovery targets, define the current release protection window, and explicitly authorize deletion. No historical schema fixture is required. No policy value should be inferred from file age, backup count, or current disk usage.

## Retirement Relationship

Migration adapters may be retired only after their executable conditions are true across active state, published state, seed, revisions, and backups that remain directly restorable. Records moved to an evidence-only archive must remain represented in the manifest and must have a verified checksum before any adapter retirement decision is considered.
