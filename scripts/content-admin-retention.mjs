#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTENT_ADMIN_RETENTION_POLICY_VERSION,
  DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
  canArchiveRetentionRecord,
  canDeleteRetentionRecord,
  getContentAdminRetentionPolicyIssues,
  getRetentionDaysForClass,
  isProtectedRetentionRecord,
  normalizeContentAdminRetentionPolicy,
} from '../src/lib/contentAdminRetentionPolicy.js';
import {
  validateContentAdminRecordSchema,
  validateContentAdminStateSchema,
} from '../src/lib/contentAdminSnapshotSchema.js';
import {
  buildMigrationEvidenceMap,
  resolveRetentionRecords,
} from '../src/lib/contentAdminRetentionEvidence.js';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const DEFAULT_SHARED_FILE = 'dev-data/content-admin-shared.json';
const DEFAULT_SEED_FILE = 'dev-data/content-admin-seed-baseline.json';
const DEFAULT_BACKUP_DIRECTORY = 'dev-data/backups';
const BACKUP_PREFIX = 'content-admin-shared-';

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeActor(value) {
  if (!value || typeof value !== 'object') return null;
  const userId = String(value.userId || '').trim();
  const displayName = String(value.displayName || '').trim();
  return userId && displayName
    ? { userId, displayName, initials: String(value.initials || '').trim() }
    : null;
}

function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashJson(value) {
  return hashBytes(Buffer.from(JSON.stringify(value)));
}

function readJsonFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  return {
    bytes,
    checksum: hashBytes(bytes),
    value: JSON.parse(bytes.toString('utf8')),
  };
}

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .map((fileName) => path.join(directory, fileName))
    .filter((filePath) => fs.statSync(filePath).isFile() && filePath.endsWith('.json'))
    .sort();
}

function routeScopeFromState(state) {
  return Object.keys(state?.blocksByPath || {}).sort();
}

function routeScopeFromRecord(record) {
  return [...new Set([
    ...routeScopeFromState(record?.state),
    ...routeScopeFromState(record?.baseSnapshot),
    ...Object.keys(record?.revisionsByPath || {}),
  ])].sort();
}

function migrationVersions(record, metadata = {}) {
  const versions = {};
  Object.entries(record?.snapshotMigrations || {}).forEach(([id, version]) => {
    versions[id] = Number(version) || version;
  });
  if (metadata.migrationId) {
    versions[String(metadata.migrationId)] = Number(metadata.migrationVersion) || metadata.migrationVersion || null;
  }
  return versions;
}

function schemaFindingsForRecord(record, recordType, label) {
  const findings = validateContentAdminRecordSchema(record, { recordType, label });
  if (recordType === 'shared') {
    findings.push(...validateContentAdminStateSchema(record?.state, { label: `${label}.state` }));
    findings.push(...validateContentAdminStateSchema(record?.baseSnapshot, { label: `${label}.baseSnapshot` }));
  } else if (recordType === 'seed-baseline') {
    findings.push(...validateContentAdminStateSchema(record?.seedState, { label: `${label}.seedState` }));
  }
  return findings;
}

function restoreEligibilityForRecord(record, recordType, label) {
  const findings = schemaFindingsForRecord(record, recordType, label);
  return {
    status: findings.length ? 'ineligible' : 'eligible',
    findings: findings.slice(0, 20),
  };
}

function buildFileItem({ filePath, relativePath, layer, raw, fileBytes, fileChecksum, migrationScanByRecord, migrationEvidenceByRecord, policy }) {
  const isBackup = layer === 'backup';
  const record = isBackup && raw?.record && typeof raw.record === 'object' ? raw.record : raw;
  const metadata = raw?.meta && typeof raw.meta === 'object' ? cloneJson(raw.meta) : {};
  const recordType = layer === 'seed' ? 'seed-baseline' : 'shared';
  const schemaVersion = Number(
    record?.version
      || raw?.version
      || (layer === 'seed' ? policy.currentSchemaVersion : 0),
  ) || null;
  const eligibility = restoreEligibilityForRecord(record, recordType, relativePath);
  const createdAt = Number(
    isBackup || layer === 'seed' ? metadata.createdAt : metadata.createdAt || record?.updatedAt || 0,
  ) || null;
  const label = isBackup ? `backup:${path.basename(filePath)}` : layer === 'seed' ? 'seed-baseline' : 'shared';
  const metadataStatus = isBackup
    ? (metadata.createdAt && metadata.actor && metadata.reason && record?.version && routeScopeFromRecord(record).length
      ? 'complete'
      : 'unknown')
    : 'complete';
  return {
    id: `${layer}:${relativePath}`,
    kind: isBackup ? 'backup' : layer,
    layer,
    relativePath,
    fileName: path.basename(filePath),
    routeScope: routeScopeFromRecord(record),
    actor: normalizeActor(metadata.actor),
    reason: String(metadata.reason || '').trim(),
    createdAt,
    schemaVersion,
    contentSha256: hashJson(record),
    migrationVersions: migrationVersions(record, metadata),
    sizeBytes: fileBytes.length,
    sha256: fileChecksum,
    restoreEligibility: eligibility.status,
    restoreFindings: eligibility.findings,
    validationStatus: eligibility.status === 'eligible' ? 'passed' : 'failed',
    currentSchema: schemaVersion === policy.currentSchemaVersion,
    metadataStatus,
    migrationScanStatus: migrationScanByRecord?.[label] ? 'findings' : 'passed',
    migrationFindingCount: Number(migrationScanByRecord?.[label] || 0),
    migrationRecordKey: label,
    migrationAdapters: migrationEvidenceByRecord?.[label]?.adapters || [],
    metadata,
  };
}

function buildRevisionItem({ revision, pathname, source, sourceChecksum, sourceSizeBytes, record, index, migrationScanByRecord, migrationEvidenceByRecord, policy }) {
  const snapshot = revision?.snapshot && typeof revision.snapshot === 'object' ? revision.snapshot : {};
  const label = `${source}#${String(revision?.id || index)}`;
  const valid = Boolean(String(pathname || '').trim()) && Array.isArray(snapshot.blocks);
  const metadataStatus = revision?.createdAt && revision?.actor && revision?.reason && revision?.schemaVersion
    ? 'complete'
    : 'unknown';
  const migrationFindingCount = Object.prototype.hasOwnProperty.call(migrationScanByRecord || {}, label)
    ? Number(migrationScanByRecord[label] || 0)
    : Number(migrationScanByRecord?.[source] || 0);
  return {
    id: `revision:${source}:${String(revision?.id || index)}`,
    kind: 'revision',
    layer: 'revisions',
    relativePath: source,
    fileName: path.basename(source),
    routeScope: [String(pathname || '').trim()].filter(Boolean),
    actor: normalizeActor(revision?.actor),
    reason: String(revision?.reason || '').trim(),
    createdAt: Number(revision?.createdAt || 0) || null,
    schemaVersion: Number(revision?.schemaVersion || record?.version || 0) || null,
    contentSha256: hashJson(snapshot),
    migrationVersions: migrationVersions(record),
    sizeBytes: Buffer.byteLength(JSON.stringify(revision || {})),
    sha256: hashJson(revision || {}),
    sourceSha256: sourceChecksum,
    sourceSizeBytes,
    restoreEligibility: valid ? 'eligible' : 'ineligible',
    restoreFindings: valid ? [] : ['revision snapshot must contain a pathname and blocks array'],
    validationStatus: valid ? 'passed' : 'failed',
    currentSchema: Number(revision?.schemaVersion || record?.version || 0) === policy.currentSchemaVersion,
    migrationScanStatus: migrationFindingCount ? 'findings' : 'passed',
    migrationFindingCount,
    migrationRecordKey: label,
    migrationAdapters: migrationEvidenceByRecord?.[label]?.adapters || migrationEvidenceByRecord?.[source]?.adapters || [],
    metadataStatus,
    metadata: {},
  };
}

export function verifyRestoreSamples(items, {
  rootDir = repoRoot,
  currentSchemaVersion = null,
} = {}) {
  const samplesBySchema = new Map();
  items
    .filter((item) => item.kind === 'backup'
      && item.restoreEligibility === 'eligible'
      && (currentSchemaVersion == null || item.schemaVersion === currentSchemaVersion)
      && Number(item.migrationFindingCount || 0) === 0)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))
    .forEach((item) => {
      const schema = String(item.schemaVersion || 'unknown');
      if (!samplesBySchema.has(schema)) samplesBySchema.set(schema, item);
    });
  const samples = [...samplesBySchema.entries()].map(([schemaVersion, item]) => {
    try {
      const filePath = resolveWithinRoot(rootDir, item.relativePath);
      const parsed = readJsonFile(filePath);
      const record = parsed.value?.record || parsed.value;
      const findings = schemaFindingsForRecord(record, 'shared', item.relativePath);
      const checksumMatches = parsed.checksum === item.sha256;
      return {
        schemaVersion,
        source: item.relativePath,
        id: item.id,
        checksumMatches,
        status: checksumMatches && findings.length === 0 ? 'passed' : 'failed',
        findings,
      };
    } catch (error) {
      return {
        schemaVersion,
        source: item.relativePath,
        id: item.id,
        checksumMatches: false,
        status: 'failed',
        findings: [error instanceof Error ? error.message : String(error)],
      };
    }
  });
  return {
    status: samples.length > 0 && samples.every((sample) => sample.status === 'passed') ? 'passed' : 'failed',
    samples,
  };
}

export function buildArchivePlan(items, rawPolicy = {}, now = Date.now()) {
  const policy = normalizeContentAdminRetentionPolicy(rawPolicy);
  const currentBackups = items
    .filter((item) => item.kind === 'backup'
      && item.restoreEligibility === 'eligible'
      && item.schemaVersion === policy.currentSchemaVersion
      && Number(item.migrationFindingCount || 0) === 0
      && item.metadataStatus === 'complete')
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
  const protectedBackupIds = new Set(currentBackups
    .slice(0, policy.protectedReleaseCount || 3)
    .map((item) => item.id));
  const currentContentCounts = currentBackups.reduce((counts, item) => {
    counts[item.contentSha256] = (counts[item.contentSha256] || 0) + 1;
    return counts;
  }, {});

  return items
    .filter((item) => item.kind === 'backup' || item.kind === 'revision')
    .map((item) => {
      const protection = isProtectedRetentionRecord(item, { protectedBackupIds });
      const retentionDays = getRetentionDaysForClass(policy, item.kind === 'backup' ? 'backup' : 'revision');
      const ageDays = item.createdAt ? Math.max(0, (now - item.createdAt) / 86400000) : null;
      const currentSchema = item.schemaVersion === policy.currentSchemaVersion;
      const obsoleteShape = item.migrationFindingCount > 0 || !currentSchema;
      let action = 'unknown/hold';
      let classificationReason = 'metadata, schema, or restore eligibility requires review';

      if (item.metadataStatus === 'unknown' || item.restoreEligibility !== 'eligible' || !item.schemaVersion) {
        action = 'unknown/hold';
      } else if (protection.protected) {
        action = 'retain-protected-current-release';
        classificationReason = protection.reasons.join(',');
      } else if (obsoleteShape) {
        action = 'delete-obsolete-shape-record';
        classificationReason = item.migrationFindingCount > 0
          ? 'migration adapter findings'
          : `schema ${item.schemaVersion} is not current schema ${policy.currentSchemaVersion}`;
      } else if (item.kind === 'backup') {
        action = 'delete-expired-current-shape-duplicate';
        classificationReason = currentContentCounts[item.contentSha256] > 1
          ? 'duplicate current-schema recovery content outside protected release window'
          : 'current-schema backup outside protected release window';
      } else {
        action = 'retain-current-recovery';
        classificationReason = 'current-schema revision retained for operational recovery';
      }

      return {
        id: item.id,
        kind: item.kind,
        relativePath: item.relativePath,
        sha256: item.sha256,
        retentionClass: item.kind,
        retentionDays,
        ageDays,
        protected: protection.protected,
        protectionReasons: protection.reasons,
        action,
        classificationReason,
        canDelete: action.startsWith('delete-') && canDeleteRetentionRecord(policy),
        destination: null,
      };
    });
}

export function buildRetentionManifest({
  rootDir = repoRoot,
  sharedFile = DEFAULT_SHARED_FILE,
  seedFile = DEFAULT_SEED_FILE,
  backupDirectory = DEFAULT_BACKUP_DIRECTORY,
  revisionDirectory = 'dev-data/content-admin-revisions',
  policy = DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
  migrationScanByRecord = {},
  migrationEvidenceByRecord = {},
  migrationReport = null,
  now = Date.now(),
} = {}) {
  const root = path.resolve(rootDir);
  const normalizedPolicy = normalizeContentAdminRetentionPolicy(policy);
  const items = [];
  const sharedPath = path.resolve(root, sharedFile);
  const seedPath = path.resolve(root, seedFile);
  const shared = fs.existsSync(sharedPath) ? readJsonFile(sharedPath) : null;
  const seed = fs.existsSync(seedPath) ? readJsonFile(seedPath) : null;

  if (shared) {
    items.push(buildFileItem({
      filePath: sharedPath,
      relativePath: sharedFile,
      layer: 'active',
      raw: shared.value,
      fileBytes: shared.bytes,
      fileChecksum: shared.checksum,
      policy: normalizedPolicy,
      migrationScanByRecord,
      migrationEvidenceByRecord,
    }));
    items.push(buildFileItem({
      filePath: sharedPath,
      relativePath: sharedFile,
      layer: 'published',
      raw: shared.value,
      fileBytes: shared.bytes,
      fileChecksum: shared.checksum,
      policy: normalizedPolicy,
      migrationScanByRecord,
      migrationEvidenceByRecord,
    }));
    Object.entries(shared.value?.revisionsByPath || {}).forEach(([pathname, revisions]) => {
      (Array.isArray(revisions) ? revisions : []).forEach((revision, index) => {
        items.push(buildRevisionItem({
          revision,
          pathname,
          source: sharedFile,
          sourceChecksum: shared.checksum,
          sourceSizeBytes: shared.bytes.length,
          record: shared.value,
          index,
          migrationScanByRecord,
          migrationEvidenceByRecord,
          policy: normalizedPolicy,
        }));
      });
    });
  }

  if (seed) {
    items.push(buildFileItem({
      filePath: seedPath,
      relativePath: seedFile,
      layer: 'seed',
      raw: seed.value,
      fileBytes: seed.bytes,
      fileChecksum: seed.checksum,
      policy: normalizedPolicy,
      migrationScanByRecord,
      migrationEvidenceByRecord,
    }));
  }

  const backupPath = path.resolve(root, backupDirectory);
  listJsonFiles(backupPath)
    .filter((filePath) => path.basename(filePath).startsWith(BACKUP_PREFIX))
    .forEach((filePath) => {
      const relativePath = path.relative(root, filePath).split(path.sep).join('/');
      const backup = readJsonFile(filePath);
      items.push(buildFileItem({
        filePath,
        relativePath,
        layer: 'backup',
        raw: backup.value,
        fileBytes: backup.bytes,
        fileChecksum: backup.checksum,
        policy: normalizedPolicy,
        migrationScanByRecord,
        migrationEvidenceByRecord,
      }));
    });

  const externalRevisionPath = path.resolve(root, revisionDirectory);
  listJsonFiles(externalRevisionPath).forEach((filePath) => {
    const relativePath = path.relative(root, filePath).split(path.sep).join('/');
    const parsed = readJsonFile(filePath);
    const revisions = Array.isArray(parsed.value) ? parsed.value : [];
    const pathname = decodeURIComponent(path.basename(filePath, '.json'));
    revisions.forEach((revision, index) => {
      items.push(buildRevisionItem({
        revision,
        pathname,
        source: relativePath,
        sourceChecksum: parsed.checksum,
        sourceSizeBytes: parsed.bytes.length,
        record: {},
        index,
        migrationScanByRecord,
        migrationEvidenceByRecord,
        policy: normalizedPolicy,
      }));
    });
  });

  const archivePlan = buildArchivePlan(items, normalizedPolicy, now);
  const restoreSamples = verifyRestoreSamples(items, {
    rootDir,
    currentSchemaVersion: normalizedPolicy.currentSchemaVersion,
  });
  const sourceItems = items.filter((item) => ['active', 'published', 'seed'].includes(item.kind));
  const currentBackups = items.filter((item) => item.kind === 'backup'
    && item.currentSchema
    && Number(item.migrationFindingCount || 0) === 0
    && item.restoreEligibility === 'eligible');
  const sourceFindings = sourceItems.flatMap((item) => item.restoreFindings.map((finding) => ({
    layer: item.layer,
    source: item.relativePath,
    finding,
  })));
  const currentRecoveryProof = {
    status: sourceFindings.length === 0 && currentBackups.length > 0 && restoreSamples.status === 'passed'
      ? 'passed'
      : 'failed',
    sourceStatus: sourceFindings.length ? 'failed' : 'passed',
    currentBackupCount: currentBackups.length,
    restoreSamples: restoreSamples.status,
    findings: sourceFindings,
  };
  const explicitProtectedCurrentIds = new Set(items
    .filter((item) => item.kind === 'backup'
      && item.currentSchema
      && Number(item.migrationFindingCount || 0) === 0
      && (item.metadata?.releaseId || item.metadata?.protectedRelease || item.metadata?.releaseVersion))
    .map((item) => item.id));
  const resolvedCleanup = resolveRetentionRecords(items, {
    currentSchemaVersion: normalizedPolicy.currentSchemaVersion,
    protectedCurrentIds: explicitProtectedCurrentIds,
    currentRecoveryIds: new Set(currentBackups.map((item) => item.id)),
    migrationFindingsByRecord: migrationEvidenceByRecord,
  });
  const cleanupPlan = resolvedCleanup.resolutions.map((item) => ({
    id: item.id,
    kind: item.kind,
    relativePath: item.relativePath,
    sha256: item.sha256,
    sizeBytes: item.sizeBytes,
    schemaVersion: item.schemaVersion,
    schemaStatus: item.shapeStatus,
    migrationAdapters: item.adapterIds,
    migrationFindingCount: item.migrationFindingCount,
    routeScope: item.routeScope,
    contentSha256: item.contentSha256,
    category: item.category,
    action: item.category,
    reason: item.reason,
    evidence: item.evidence,
    releaseRelationship: item.releaseRelationship,
    duplicateGroupId: item.duplicateGroupId,
    restoreEligibility: item.restoreEligibility,
    policyRule: item.policyRule,
    canDelete: item.executable && canDeleteRetentionRecord(normalizedPolicy),
  }));
  const cleanupCounts = cleanupPlan.reduce((counts, item) => {
    counts[item.action] = (counts[item.action] || 0) + 1;
    return counts;
  }, {});
  const cleanupBytes = cleanupPlan.reduce((bytes, item) => {
    if (item.action.startsWith('delete')) {
      bytes[item.action] = (bytes[item.action] || 0) + Number(item.sizeBytes || 0);
    }
    return bytes;
  }, {});
  return {
    manifestVersion: CONTENT_ADMIN_RETENTION_POLICY_VERSION,
    generatedAt: now,
    sources: { sharedFile, seedFile, backupDirectory, revisionDirectory },
    policy: normalizedPolicy,
    policyIssues: getContentAdminRetentionPolicyIssues(normalizedPolicy),
    migrationInventory: migrationReport
      ? migrationReport.reports.map((report) => ({
        adapter: report.adapter,
        category: report.category,
        findings: report.totalFindings,
        retirementEligible: report.eligibleForRetirement,
      }))
      : [],
    items,
    archivePlan,
    cleanupPlan,
    duplicateGroups: resolvedCleanup.duplicateGroups,
    restoreSamples,
    currentRecoveryProof,
    summary: {
      itemCount: items.length,
      backupCount: items.filter((item) => item.kind === 'backup').length,
      revisionCount: items.filter((item) => item.kind === 'revision').length,
      restoreEligibleCount: items.filter((item) => item.restoreEligibility === 'eligible').length,
      migrationFindingCount: items.reduce((total, item) => total + item.migrationFindingCount, 0),
      cleanupCounts,
      cleanupBytes,
      schemaVersions: [...new Set(items.map((item) => item.schemaVersion).filter(Boolean))].sort((a, b) => a - b),
      routes: [...new Set(items.flatMap((item) => item.routeScope))].sort(),
      unknownHoldCount: cleanupPlan.filter((item) => item.category === 'unknown/hold').length,
      resolvedRecordCount: cleanupPlan.filter((item) => item.category !== 'unknown/hold').length,
      restoreSampleCount: restoreSamples.samples.length,
      restoreSampleStatus: restoreSamples.status,
      currentRecoveryStatus: currentRecoveryProof.status,
    },
  };
}

function resolveWithinRoot(rootDir, relativeOrAbsolutePath) {
  const root = path.resolve(rootDir);
  const resolved = path.isAbsolute(relativeOrAbsolutePath)
    ? path.resolve(relativeOrAbsolutePath)
    : path.resolve(root, relativeOrAbsolutePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Retention path escapes root: ${relativeOrAbsolutePath}`);
  }
  return resolved;
}

function readArchiveManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return [];
  return fs.readFileSync(manifestPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function assertReviewArtifact(filePath, label) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Archive execution requires an existing ${label} file.`);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    if (label === 'review artifact'
      && !Array.isArray(parsed.archivePlan)
      && !Array.isArray(parsed.cleanupPlan)) {
      throw new Error('missing archivePlan or cleanupPlan');
    }
  } catch {
    throw new Error(`Archive execution requires a valid ${label}.`);
  }
}

function readRequiredJsonArtifact(filePath, label) {
  assertReviewArtifact(filePath, label);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function executeArchivePlan({
  manifest,
  rootDir = repoRoot,
  actor = '',
  reason = '',
  policyVersion = null,
  reviewArtifactPath = '',
  confirmation = '',
  beforeManifestPath = '',
  afterManifestPath = '',
} = {}) {
  const policy = normalizeContentAdminRetentionPolicy(manifest?.policy);
  if (!String(actor || '').trim() || !String(reason || '').trim()) {
    throw new Error('Archive execution requires a non-empty actor and reason.');
  }
  if (!canArchiveRetentionRecord(policy)) {
    throw new Error('Archive execution requires an approved, complete retention policy.');
  }
  if (!String(policyVersion || '').trim()
    || String(policyVersion).trim() !== String(policy.policyVersion || '').trim()) {
    throw new Error('Archive execution requires the approved policy version.');
  }
  if (String(confirmation || '').trim() !== 'ARCHIVE') {
    throw new Error('Archive execution requires confirmation value ARCHIVE.');
  }
  if (!reviewArtifactPath || !beforeManifestPath || !afterManifestPath) {
    throw new Error('Archive execution requires a dry-run review artifact and before/after manifest paths.');
  }
  assertReviewArtifact(reviewArtifactPath, 'review artifact');
  assertReviewArtifact(beforeManifestPath, 'before manifest');
  const root = path.resolve(rootDir);
  const destinationRoot = resolveWithinRoot(root, policy.evidenceArchiveDirectory);
  const archiveManifestPath = path.join(destinationRoot, 'retention-archive-manifest.jsonl');
  const existingRecords = readArchiveManifest(archiveManifestPath);
  const existingById = new Map(existingRecords.map((entry) => [entry.id, entry]));
  const candidates = (manifest?.archivePlan || []).filter((entry) => entry.action === 'archive-to-evidence');
  const nonFileCandidates = candidates.filter((entry) => entry.kind !== 'backup');
  if (nonFileCandidates.length) {
    throw new Error('Archive execution currently requires file-backed backup records; embedded revisions remain in place.');
  }

  const preparedCandidates = candidates.map((entry) => {
    const sourcePath = resolveWithinRoot(root, entry.relativePath);
    const destinationPath = path.join(destinationRoot, path.basename(sourcePath));
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Archive source is missing: ${entry.relativePath}`);
    }
    if (hashBytes(fs.readFileSync(sourcePath)) !== entry.sha256) {
      throw new Error(`Archive source checksum verification failed for ${entry.id}`);
    }
    const existing = existingById.get(entry.id);
    if (existing && (existing.sha256 !== entry.sha256 || existing.destination !== destinationPath)) {
      throw new Error(`Immutable archive record conflict for ${entry.id}`);
    }
    return { entry, sourcePath, destinationPath, existing };
  });

  fs.mkdirSync(destinationRoot, { recursive: true });
  const archived = [];
  preparedCandidates.forEach(({ entry, sourcePath, destinationPath, existing }) => {
    if (existing) {
      archived.push(existing);
      return;
    }
    fs.copyFileSync(sourcePath, destinationPath);
    const copiedChecksum = hashBytes(fs.readFileSync(destinationPath));
    if (copiedChecksum !== entry.sha256) {
      fs.rmSync(destinationPath, { force: true });
      throw new Error(`Archive checksum verification failed for ${entry.id}`);
    }
    fs.unlinkSync(sourcePath);
    const archiveRecord = {
      id: entry.id,
      archivedAt: Date.now(),
      actor: String(actor).trim(),
      reason: String(reason).trim(),
      source: entry.relativePath,
      destination: destinationPath,
      sha256: entry.sha256,
      retentionClass: entry.retentionClass,
      policyVersion: policy.policyVersion,
    };
    fs.appendFileSync(archiveManifestPath, `${JSON.stringify(archiveRecord)}\n`);
    archived.push(archiveRecord);
  });
  if (afterManifestPath) {
    const afterManifest = buildRetentionManifest({
      rootDir,
      ...(manifest?.sources || {}),
      policy,
      now: Date.now(),
    });
    fs.writeFileSync(afterManifestPath, `${JSON.stringify({
      ...afterManifest,
      actor: String(actor).trim(),
      reason: String(reason).trim(),
      policyVersion: policy.policyVersion,
      archiveResult: archived,
    }, null, 2)}\n`);
  }
  return { archived, manifestPath: archiveManifestPath, afterManifestPath };
}

export function executeDeletePlan({
  manifest,
  rootDir = repoRoot,
  actor = '',
  reason = '',
  policyVersion = null,
  reviewArtifactPath = '',
  confirmation = '',
  beforeManifestPath = '',
  afterManifestPath = '',
  migrationScanByRecord = {},
} = {}) {
  const policy = normalizeContentAdminRetentionPolicy(manifest?.policy);
  if (!String(actor || '').trim() || !String(reason || '').trim()) {
    throw new Error('Deletion execution requires a non-empty actor and reason.');
  }
  if (!canDeleteRetentionRecord(policy)) {
    throw new Error('Deletion execution requires an approved policy that explicitly allows deletion.');
  }
  if (!String(policyVersion || '').trim()
    || String(policyVersion).trim() !== String(policy.policyVersion || '').trim()) {
    throw new Error('Deletion execution requires the approved policy version.');
  }
  if (String(confirmation || '').trim() !== 'DELETE') {
    throw new Error('Deletion execution requires confirmation value DELETE.');
  }
  if (!reviewArtifactPath || !beforeManifestPath || !afterManifestPath) {
    throw new Error('Deletion execution requires a dry-run review artifact and before/after manifest paths.');
  }
  const review = readRequiredJsonArtifact(reviewArtifactPath, 'review artifact');
  readRequiredJsonArtifact(beforeManifestPath, 'before manifest');
  if (manifest?.currentRecoveryProof?.status !== 'passed') {
    throw new Error('Deletion execution requires a passing current-schema recovery proof.');
  }
  const reviewedPlan = review.cleanupPlan || review.archivePlan;
  const reviewedById = new Map((reviewedPlan || []).map((entry) => [entry.id, entry]));
  const candidates = (manifest?.cleanupPlan || manifest?.archivePlan || []).filter((entry) => (
    entry.action.startsWith('delete') && entry.canDelete === true
  ));
  const reviewedCandidates = candidates.filter((entry) => {
    const reviewed = reviewedById.get(entry.id);
    return reviewed && reviewed.sha256 === entry.sha256 && reviewed.action === entry.action;
  });
  if (reviewedCandidates.length !== candidates.length) {
    throw new Error('Deletion review artifact does not approve the current candidate checksums and classifications.');
  }
  const nonFileCandidates = reviewedCandidates.filter((entry) => entry.kind !== 'backup');
  if (nonFileCandidates.length) {
    throw new Error('Deletion execution currently requires file-backed backups; revision records need an explicit record-level deletion operation.');
  }

  const root = path.resolve(rootDir);
  const preparedCandidates = reviewedCandidates.map((entry) => {
    const sourcePath = resolveWithinRoot(root, entry.relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Deletion source is missing: ${entry.relativePath}`);
    }
    if (hashBytes(fs.readFileSync(sourcePath)) !== entry.sha256) {
      throw new Error(`Deletion source checksum verification failed for ${entry.id}`);
    }
    return { entry, sourcePath };
  });
  const deleted = preparedCandidates.map(({ entry, sourcePath }) => {
    fs.unlinkSync(sourcePath);
    return {
      id: entry.id,
      deletedAt: Date.now(),
      actor: String(actor).trim(),
      reason: String(reason).trim(),
      source: entry.relativePath,
      sha256: entry.sha256,
      classification: entry.action,
      policyVersion: policy.policyVersion,
    };
  });
  const deletionManifestPath = path.join(root, 'dev-data', 'retention-deletion-manifest.jsonl');
  fs.mkdirSync(path.dirname(deletionManifestPath), { recursive: true });
  deleted.forEach((entry) => fs.appendFileSync(deletionManifestPath, `${JSON.stringify(entry)}\n`));
  const afterManifest = buildRetentionManifest({
    rootDir,
    ...(manifest?.sources || {}),
    policy,
    migrationScanByRecord,
    now: Date.now(),
  });
  fs.writeFileSync(afterManifestPath, `${JSON.stringify({
    ...afterManifest,
    actor: String(actor).trim(),
    reason: String(reason).trim(),
    policyVersion: policy.policyVersion,
    deletionResult: deleted,
  }, null, 2)}\n`);
  return { deleted, manifestPath: deletionManifestPath, afterManifestPath };
}

function parseArgs(argv) {
  const getValue = (name, fallback = '') => {
    const index = argv.indexOf(name);
    return index >= 0 ? String(argv[index + 1] || '').trim() || fallback : fallback;
  };
  return {
    json: argv.includes('--json'),
    planArchive: argv.includes('--plan-archive'),
    planCleanup: argv.includes('--plan-cleanup'),
    executeArchive: argv.includes('--execute-archive'),
    executeDelete: argv.includes('--execute-delete'),
    actor: getValue('--actor'),
    reason: getValue('--reason'),
    policyVersion: getValue('--policy-version'),
    reviewArtifactPath: getValue('--review-artifact'),
    confirmation: getValue('--confirm-archive'),
    deleteConfirmation: getValue('--confirm-delete'),
    beforeManifestPath: getValue('--before-manifest'),
    afterManifestPath: getValue('--after-manifest'),
    policyFile: getValue('--policy-file'),
    output: getValue('--output'),
    reviewDir: getValue('--review-dir'),
  };
}

function loadPolicy(policyFile) {
  if (!policyFile) return DEFAULT_CONTENT_ADMIN_RETENTION_POLICY;
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, policyFile), 'utf8'));
}

function writeReviewArtifacts(manifest, reviewDirectory) {
  const directory = path.resolve(reviewDirectory);
  const activeDirectories = [
    path.resolve(repoRoot, DEFAULT_BACKUP_DIRECTORY),
    path.resolve(repoRoot, 'dev-data/content-admin-revisions'),
  ];
  if (activeDirectories.some((activeDirectory) => directory === activeDirectory
    || directory.startsWith(`${activeDirectory}${path.sep}`))) {
    throw new Error('Review artifacts must be stored outside active backup and revision directories.');
  }
  fs.mkdirSync(directory, { recursive: true });
  const artifacts = {
    beforeManifest: 'before-manifest-v2.json',
    metadataResolution: 'metadata-resolution-v2.json',
    duplicateGroups: 'duplicate-groups-v2.json',
    restoreEligibility: 'restore-eligibility-v2.json',
    cleanupPlan: 'dry-run-cleanup-plan-v2.json',
    remainingUnknownHold: 'remaining-unknown-hold-v2.json',
  };
  const payloads = {
    beforeManifest: manifest,
    metadataResolution: {
      generatedAt: manifest.generatedAt,
      items: manifest.cleanupPlan.map((item) => ({
        id: item.id,
        relativePath: item.relativePath,
        sha256: item.sha256,
        sizeBytes: item.sizeBytes,
        category: item.category,
        shapeStatus: item.schemaStatus,
        evidence: item.evidence,
        releaseRelationship: item.releaseRelationship,
        migrationAdapters: item.migrationAdapters,
        duplicateGroupId: item.duplicateGroupId,
      })),
    },
    duplicateGroups: {
      generatedAt: manifest.generatedAt,
      groups: manifest.duplicateGroups,
    },
    restoreEligibility: {
      generatedAt: manifest.generatedAt,
      currentRecoveryProof: manifest.currentRecoveryProof,
      records: manifest.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        relativePath: item.relativePath,
        sha256: item.sha256,
        schemaVersion: item.schemaVersion,
        restoreEligibility: item.restoreEligibility,
        restoreFindings: item.restoreFindings,
        currentSchema: item.currentSchema,
      })),
    },
    cleanupPlan: {
      generatedAt: manifest.generatedAt,
      policy: manifest.policy,
      currentRecoveryProof: manifest.currentRecoveryProof,
      items: manifest.cleanupPlan,
    },
    remainingUnknownHold: {
      generatedAt: manifest.generatedAt,
      items: manifest.cleanupPlan.filter((item) => item.category === 'unknown/hold'),
    },
  };
  Object.entries(artifacts).forEach(([key, fileName]) => {
    const filePath = path.join(directory, fileName);
    if (fs.existsSync(filePath)) {
      throw new Error(`Review artifact already exists and will not be overwritten: ${filePath}`);
    }
    fs.writeFileSync(filePath, `${JSON.stringify(payloads[key], null, 2)}\n`);
  });
  return Object.fromEntries(Object.entries(artifacts).map(([key, fileName]) => [key, path.join(directory, fileName)]));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = loadPolicy(args.policyFile);
  let migrationScanByRecord = {};
  let migrationEvidenceByRecord = {};
  let migrationReport = null;
  try {
    const { runContentAdminMigrationInventory } = await import('./content-admin-migration-inventory.mjs');
    const report = runContentAdminMigrationInventory({ includeBackups: true });
    migrationReport = report;
    migrationEvidenceByRecord = buildMigrationEvidenceMap(report);
    migrationScanByRecord = Object.fromEntries(Object.entries(migrationEvidenceByRecord)
      .map(([key, value]) => [key, value.findings.length]));
  } catch {
    migrationScanByRecord = {};
  }
  const manifest = buildRetentionManifest({
    policy,
    migrationScanByRecord,
    migrationEvidenceByRecord,
    migrationReport,
  });
  const reviewArtifacts = args.reviewDir ? writeReviewArtifacts(manifest, args.reviewDir) : null;
  const archiveResult = args.executeArchive
    ? executeArchivePlan({
      manifest,
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      reviewArtifactPath: path.resolve(repoRoot, args.reviewArtifactPath),
      confirmation: args.confirmation,
      beforeManifestPath: path.resolve(repoRoot, args.beforeManifestPath),
      afterManifestPath: path.resolve(repoRoot, args.afterManifestPath),
    })
    : null;
  const deleteResult = args.executeDelete
    ? executeDeletePlan({
      manifest,
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      reviewArtifactPath: path.resolve(repoRoot, args.reviewArtifactPath),
      confirmation: args.deleteConfirmation,
      beforeManifestPath: path.resolve(repoRoot, args.beforeManifestPath),
      afterManifestPath: path.resolve(repoRoot, args.afterManifestPath),
      migrationScanByRecord,
    })
    : null;
  const result = args.planArchive || args.planCleanup ? manifest : {
    ...manifest,
    archivePlan: undefined,
    cleanupPlan: undefined,
  };
  if (reviewArtifacts) result.reviewArtifacts = reviewArtifacts;
  const serialized = JSON.stringify(result, null, 2);
  if (args.output) {
    fs.writeFileSync(path.resolve(repoRoot, args.output), `${serialized}\n`);
  }
  if (args.json) {
    console.log(serialized);
    return;
  }
  console.log('Content admin retention manifest');
  console.log(`Policy status: ${manifest.policy.retentionPolicyStatus}`);
  console.log(`Automatic deletion: ${manifest.policy.automaticDeletionEnabled ? 'enabled' : 'disabled'}`);
  console.log(`Items: ${manifest.summary.itemCount}; backups: ${manifest.summary.backupCount}; revisions: ${manifest.summary.revisionCount}`);
  console.log(`Restore eligible: ${manifest.summary.restoreEligibleCount}; migration findings: ${manifest.summary.migrationFindingCount}`);
  console.log(`Restore samples: ${manifest.summary.restoreSampleStatus} (${manifest.summary.restoreSampleCount})`);
  console.log(`Current-schema recovery proof: ${manifest.currentRecoveryProof.status}`);
  console.log(`Schema versions: ${manifest.summary.schemaVersions.join(', ') || 'none'}`);
  console.log(`Routes inventoried: ${manifest.summary.routes.length}`);
  if (manifest.migrationInventory.length) {
    console.log(`Migration adapters inventoried: ${manifest.migrationInventory.length}`);
  }
  if (args.planArchive || args.planCleanup) {
    const counts = manifest.cleanupPlan.reduce((grouped, item) => {
      const list = grouped[item.action] || [];
      list.push(item);
      grouped[item.action] = list;
      return grouped;
    }, {});
    Object.entries(counts).forEach(([action, entries]) => console.log(`Cleanup plan ${action}: ${entries.length}`));
    console.log(`Duplicate groups: ${manifest.duplicateGroups.length}`);
    console.log(`Resolved records: ${manifest.summary.resolvedRecordCount}; unknown/hold: ${manifest.summary.unknownHoldCount}`);
  }
  if (archiveResult) console.log(`Archived records: ${archiveResult.archived.length}`);
  if (deleteResult) console.log(`Deleted records: ${deleteResult.deleted.length}`);
  if (!archiveResult && !deleteResult) {
    console.log('No files moved or deleted. Use an approved policy and an explicit reviewed operation before changing storage.');
  }
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
