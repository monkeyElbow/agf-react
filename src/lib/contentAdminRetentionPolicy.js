export const CONTENT_ADMIN_RETENTION_POLICY_VERSION = 1;

export const DEFAULT_CONTENT_ADMIN_RETENTION_POLICY = Object.freeze({
  policyVersion: null,
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
  activeRestoreDirectory: 'dev-data/backups',
  evidenceArchiveDirectory: null,
  policyOwner: null,
  approvingAuthority: null,
  complianceReviewer: null,
  decisionDate: null,
  effectiveDate: null,
  approvalEvidenceLocation: null,
  retentionClockOrigin: null,
  archiveAccessControls: null,
  checksumVerificationOwner: null,
  holdAuthority: null,
  secondPersonReviewRequired: null,
  recoveryTestRequired: null,
  deletionPolicyDecision: null,
});

const ARCHIVE_MODES = new Set(['evidence-only', 'active-and-evidence']);

function normalizeNullablePositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeNullableNonnegativeInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function normalizeNullableText(value) {
  return String(value || '').trim() || null;
}

function normalizeNullableBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

export function normalizeContentAdminRetentionPolicy(rawPolicy = {}) {
  const source = rawPolicy && typeof rawPolicy === 'object' ? rawPolicy : {};
  const archiveMode = String(source.archiveMode || '').trim() || null;
  return {
    ...DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
    ...source,
    policyVersion: normalizeNullableText(source.policyVersion),
    retentionPolicyStatus: String(source.retentionPolicyStatus || 'unapproved').trim() || 'unapproved',
    cleanupMode: source.cleanupMode === 'current-schema-only' ? source.cleanupMode : 'current-schema-only',
    currentSchemaVersion: Number.isInteger(Number(source.currentSchemaVersion))
      ? Number(source.currentSchemaVersion)
      : DEFAULT_CONTENT_ADMIN_RETENTION_POLICY.currentSchemaVersion,
    preserveHistoricalSchemaCompatibility: source.preserveHistoricalSchemaCompatibility === true,
    obsoleteShapeAction: source.obsoleteShapeAction === 'delete-candidate'
      ? source.obsoleteShapeAction
      : 'delete-candidate',
    automaticDeletionEnabled: source.automaticDeletionEnabled === true,
    backupRetentionDays: normalizeNullablePositiveInteger(source.backupRetentionDays),
    revisionRetentionDays: normalizeNullablePositiveInteger(source.revisionRetentionDays),
    protectedReleaseCount: normalizeNullableNonnegativeInteger(source.protectedReleaseCount),
    archiveMode: ARCHIVE_MODES.has(archiveMode) ? archiveMode : null,
    activeRestoreDirectory: String(
      source.activeRestoreDirectory || DEFAULT_CONTENT_ADMIN_RETENTION_POLICY.activeRestoreDirectory,
    ).trim(),
    evidenceArchiveDirectory: String(source.evidenceArchiveDirectory || '').trim() || null,
    policyOwner: normalizeNullableText(source.policyOwner),
    approvingAuthority: normalizeNullableText(source.approvingAuthority),
    complianceReviewer: normalizeNullableText(source.complianceReviewer),
    decisionDate: normalizeNullableText(source.decisionDate),
    effectiveDate: normalizeNullableText(source.effectiveDate),
    approvalEvidenceLocation: normalizeNullableText(source.approvalEvidenceLocation),
    retentionClockOrigin: normalizeNullableText(source.retentionClockOrigin),
    archiveAccessControls: normalizeNullableText(source.archiveAccessControls),
    checksumVerificationOwner: normalizeNullableText(source.checksumVerificationOwner),
    holdAuthority: normalizeNullableText(source.holdAuthority),
    secondPersonReviewRequired: normalizeNullableBoolean(source.secondPersonReviewRequired),
    recoveryTestRequired: normalizeNullableBoolean(source.recoveryTestRequired),
    deletionPolicyDecision: ['allowed', 'prohibited'].includes(source.deletionPolicyDecision)
      ? source.deletionPolicyDecision
      : null,
  };
}

export function getContentAdminRetentionPolicyIssues(rawPolicy = {}) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  const issues = [];
  if (!['unapproved', 'approved'].includes(policy.retentionPolicyStatus)) {
    issues.push('invalid-policy-status');
  }
  if (policy.retentionPolicyStatus === 'approved') {
    if (policy.cleanupMode !== 'current-schema-only') issues.push('current-schema-cleanup-mode-required');
    if (!Number.isInteger(policy.currentSchemaVersion) || policy.currentSchemaVersion < 1) {
      issues.push('current-schema-version-required');
    }
    if (policy.preserveHistoricalSchemaCompatibility) {
      issues.push('historical-schema-compatibility-must-be-disabled');
    }
    if (policy.obsoleteShapeAction !== 'delete-candidate') {
      issues.push('obsolete-shape-delete-candidate-policy-required');
    }
    if (!policy.policyVersion) issues.push('policy-version-required');
    if (!policy.backupRetentionDays) issues.push('backup-retention-days-required');
    if (!policy.revisionRetentionDays) issues.push('revision-retention-days-required');
    if (policy.protectedReleaseCount == null) issues.push('protected-release-count-required');
    if (!policy.archiveMode) issues.push('archive-mode-required');
    if (!policy.evidenceArchiveDirectory) issues.push('evidence-archive-directory-required');
    if (!policy.policyOwner) issues.push('policy-owner-required');
    if (!policy.approvingAuthority) issues.push('approving-authority-required');
    if (!policy.complianceReviewer) issues.push('compliance-reviewer-required');
    if (!policy.decisionDate) issues.push('decision-date-required');
    if (!policy.effectiveDate) issues.push('effective-date-required');
    if (!policy.approvalEvidenceLocation) issues.push('approval-evidence-location-required');
    if (!policy.retentionClockOrigin) issues.push('retention-clock-origin-required');
    if (!policy.archiveAccessControls) issues.push('archive-access-controls-required');
    if (!policy.checksumVerificationOwner) issues.push('checksum-verification-owner-required');
    if (!policy.holdAuthority) issues.push('hold-authority-required');
    if (policy.secondPersonReviewRequired == null) issues.push('second-person-review-required');
    if (policy.recoveryTestRequired == null) issues.push('recovery-test-requirement-required');
    if (!policy.deletionPolicyDecision) issues.push('deletion-policy-decision-required');
  }
  if (policy.automaticDeletionEnabled && policy.retentionPolicyStatus !== 'approved') {
    issues.push('automatic-deletion-requires-approved-policy');
  }
  if (policy.automaticDeletionEnabled && !policy.backupRetentionDays) {
    issues.push('automatic-deletion-requires-backup-retention-days');
  }
  if (policy.automaticDeletionEnabled && policy.deletionPolicyDecision !== 'allowed') {
    issues.push('automatic-deletion-requires-explicit-allowance');
  }
  return issues;
}

export function isAutomaticRetentionDeletionAllowed(rawPolicy = {}) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  return policy.retentionPolicyStatus === 'approved'
    && policy.automaticDeletionEnabled
    && getContentAdminRetentionPolicyIssues(policy).length === 0;
}

export function getRetentionDaysForClass(rawPolicy, retentionClass) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  if (retentionClass === 'backup') return policy.backupRetentionDays;
  if (retentionClass === 'revision') return policy.revisionRetentionDays;
  return null;
}

export function isProtectedRetentionRecord(item, {
  newestValidBackupId = '',
  protectedBackupIds = new Set(),
} = {}) {
  const reasons = [];
  if (item?.id && item.id === newestValidBackupId) {
    reasons.push('newest-valid-backup');
  }
  if (item?.id && protectedBackupIds.has(item.id)) {
    reasons.push('only-restore-compatible-backup-for-schema');
  }
  const metadata = item?.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const protectedUntil = Number(metadata.protectedUntil || 0);
  const protectedRelease = String(metadata.protectedRelease || metadata.releaseId || '').trim();
  if (protectedUntil > Date.now()) reasons.push('protected-until');
  if (protectedRelease) reasons.push('protected-release');
  if (metadata.legalHold === true) reasons.push('legal-hold');
  if (metadata.complianceHold === true) reasons.push('compliance-hold');
  if (metadata.retentionHold === true) reasons.push('retention-hold');
  return { protected: reasons.length > 0, reasons };
}

export function canArchiveRetentionRecord(rawPolicy = {}) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  return policy.retentionPolicyStatus === 'approved'
    && Boolean(policy.archiveMode && policy.evidenceArchiveDirectory)
    && getContentAdminRetentionPolicyIssues(policy).length === 0;
}

export function canDeleteRetentionRecord(rawPolicy = {}) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  return policy.retentionPolicyStatus === 'approved'
    && policy.deletionPolicyDecision === 'allowed'
    && getContentAdminRetentionPolicyIssues(policy).length === 0;
}
