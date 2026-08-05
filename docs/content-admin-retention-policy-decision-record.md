# Content Admin Retention Policy Decision Record

Status: **Approved intent; destructive execution not authorized**

The project owner has approved the intent to preserve current-schema operational recovery only. Historical schema compatibility is intentionally unsupported as a future restore target. This record does not authorize a destructive run; automatic deletion remains disabled until the first cleanup plan is reviewed and explicitly executed.

## Approved Cleanup Intent

- Current active state, published `baseSnapshot`, seed, and current-schema recovery records remain protected.
- The current schema is version `1`.
- Current and previous two releases are protected only when they use the current schema.
- Historical schema versions and records with retired Generosity, planned-giving comparison, IRA, target-bridge, split-link, CTA-slot, CGA, 403(b), loan, property/casualty, or other obsolete-shape findings are deletion candidates.
- Old records are not migrated or moved to evidence-only archives unless separately requested.
- Unknown or invalid metadata remains `unknown/hold`.
- Automatic deletion remains disabled for the first cleanup pass.

## Approval

| Field | Decision |
| --- | --- |
| Policy owner |  |
| Approving authority |  |
| Records/compliance reviewer |  |
| Decision date |  |
| Effective date |  |
| Policy version |  |
| Approval evidence location |  |

## Required Decisions

### 1. Direct-Restore Retention

| Record class | Retain directly restorable for | Exceptions | Approved by | Effective date |
| --- | ---: | --- | --- | --- |
| Backups |  |  |  |  |
| Revisions |  |  |  |  |

Define whether the period is measured from creation, last access, release, or another event. Do not infer this from file timestamps.

### 2. Archive Destination and Access

| Decision | Approved value |
| --- | --- |
| Archive mode |  |
| Active-restore location |  |
| Evidence-only archive location |  |
| Storage durability/backup requirement |  |
| Authorized readers |  |
| Authorized archive operators |  |
| Integrity/checksum verification owner |  |
| Archive manifest retention |  |

### 3. Authorized Approvers

| Operation | Required approver role(s) | Required evidence |
| --- | --- | --- |
| Move a record to evidence-only archive |  |  |
| Delete a backup |  |  |
| Delete a revision |  |  |
| Override a protected release/hold |  |  |
| Retire a migration adapter |  |  |

### 4. Protected Releases and Holds

Identify categories that must never be archived or deleted without an explicit hold release:

- protected release windows:
- current production release:
- incident investigations:
- legal holds:
- compliance or audit holds:
- regulatory records:
- security investigations:
- customer or ministry dispute records:
- other indefinite-preservation categories:

For each category, define who creates/releases the hold, where the hold is recorded, and whether the hold survives a restore or migration.

### 5. Whether Deletion Is Allowed

| Decision | Approved value |
| --- | --- |
| Is deletion ever allowed? |  |
| Minimum deletion authorization |  |
| Required dry-run review artifact |  |
| Required before/after manifests |  |
| Required checksum verification |  |
| Required second-person review |  |
| Required recovery test before deletion |  |
| Required deletion audit retention |  |

The current cleanup does not archive old-shape records. If deletion is allowed, define whether it applies to backups, revisions, evidence archives, or only future records. A policy that does not explicitly allow deletion leaves deletion disabled.

## Implementation Gate

The policy configuration may move from `unapproved` to `approved` only after all required decisions above have values, named approvers, approval evidence, and an effective date. The approved cleanup intent above does not itself enable deletion.

### Approval Completeness Checklist

Every item must be checked before `retentionPolicyStatus` can become `approved`:

- [ ] Policy owner named -> policy owner record
- [ ] Approving authority named -> approval authority record
- [ ] Records/compliance reviewer named -> compliance review record
- [ ] Policy version assigned -> `policyVersion`
- [ ] Decision date recorded -> decision record metadata
- [ ] Effective date recorded -> `effectiveDate`
- [ ] Approval evidence location recorded -> `approvalEvidenceLocation`
- [ ] Current-schema-only cleanup mode recorded -> `cleanupMode`
- [ ] Current schema version recorded -> `currentSchemaVersion`
- [ ] Historical schema compatibility explicitly disabled -> `preserveHistoricalSchemaCompatibility`
- [ ] Obsolete-shape action recorded as deletion candidate -> `obsoleteShapeAction`
- [ ] Backup retention period approved -> `backupRetentionDays`
- [ ] Revision retention period approved -> `revisionRetentionDays`
- [ ] Retention clock origin defined -> `retentionClockOrigin`
- [ ] Archive mode approved -> `archiveMode`
- [ ] Evidence archive directory approved -> `evidenceArchiveDirectory`
- [ ] Active-restore location approved -> `activeRestoreDirectory`
- [ ] Archive readers and operators approved -> archive access controls
- [ ] Checksum verification owner named -> integrity control owner
- [ ] Protected release count approved -> `protectedReleaseCount`
- [ ] Hold creation and release authority defined -> hold control
- [ ] Deletion explicitly allowed or prohibited -> `automaticDeletionEnabled`
- [ ] Second-person review requirement decided -> archive/deletion approval control
- [ ] Recovery-test requirement decided -> restore verification control

Any unchecked item keeps `retentionPolicyStatus = 'unapproved'`.

#### Current Fail-Closed State

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
  evidenceArchiveDirectory: null,
}
```

These unresolved values are placeholders only and must not be treated as policy. Automatic deletion remains `false` until deletion is separately approved.

#### Shape Required After Documented Approval

The following shows the fields required after approval; the placeholder values are not recommendations:

```js
{
  retentionPolicyStatus: 'approved',
  cleanupMode: 'current-schema-only',
  currentSchemaVersion: '<current schema version>',
  preserveHistoricalSchemaCompatibility: false,
  obsoleteShapeAction: 'delete-candidate',
  policyVersion: '<approved version>',
  effectiveDate: '<approved effective date>',
  approvalEvidenceLocation: '<record location>',
  automaticDeletionEnabled: '<explicitly approved boolean>',
  backupRetentionDays: '<approved positive integer>',
  revisionRetentionDays: '<approved positive integer>',
  protectedReleaseCount: '<approved nonnegative integer>',
  archiveMode: '<approved mode>',
  evidenceArchiveDirectory: '<approved destination>',
}
```

## Retirement Dependency

Migration adapters remain active until their executable retirement conditions are satisfied across active state, published state, seed, directly restorable revisions, and directly restorable backups. Archive classification does not by itself authorize adapter retirement.
