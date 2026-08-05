#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectContentAdminAuthority } from '../dev-server/contentAdminAuthority.js';
import { runContentAdminMigrationInventory } from './content-admin-migration-inventory.mjs';
import { runSnapshotAudit, summarize as summarizeSnapshots } from './content-admin-snapshot-audit.mjs';
import { buildRetentionManifest } from './content-admin-retention.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const backupRoot = path.resolve(repoRoot, 'dev-data/backups');
const DEFAULT_REVIEW_DIR = '/tmp/agf-canonical-disposition-20260805-v2';
const DEFAULT_EXECUTION_DIR = '/tmp/agf-canonical-deletion-execution-20260805-v1';
const EXPECTED_CANDIDATE_COUNT = 16;
const EXPECTED_CANDIDATE_BYTES = 480_873_752;
const EXPECTED_BEFORE_BACKUP_COUNT = 30;
const EXPECTED_BEFORE_BACKUP_BYTES = 977_764_018;
const EXPECTED_AFTER_BACKUP_COUNT = 14;
const EXPECTED_AFTER_BACKUP_BYTES = 496_890_266;
const EXPECTED_RECOVERY_COUNT = 14;
const EXPECTED_REVISION_COUNT = 164;
const EXPECTED_CONFIRMATION = 'DELETE_16_OBSOLETE_CANONICAL_BACKUPS';
const REQUIRED_ARTIFACTS = Object.freeze([
  'proposed-delete-manifest.json',
  'canonical-disposition.json',
  'canonical-semantics-reconciliation.json',
  'adapter-unblocking-delete-groups.json',
  'empty-link-backup-disposition.json',
  'retained-backup-manifest.json',
  'projected-post-delete-findings.json',
]);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function writeImmutable(filePath, value) {
  if (fs.existsSync(filePath)) fail(`Refusing to overwrite execution artifact: ${filePath}`);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o444 });
  fs.chmodSync(filePath, 0o444);
  return filePath;
}

function resolveRepoPath(relativePath) {
  const resolved = path.resolve(repoRoot, relativePath);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    fail(`Path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function listenerPids(port) {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(/\s+/).filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

function verifyAuthority() {
  const lockFile = path.join(repoRoot, 'dev-data/content-admin-authority.lock');
  const inspected = inspectContentAdminAuthority(lockFile);
  const lease = inspected.lease || {};
  const listeners5173 = listenerPids(5173);
  const listeners4178 = listenerPids(4178);
  const healthy = inspected.status === 'owned'
    && inspected.processAlive
    && lease.host === '127.0.0.1'
    && lease.port === 5173
    && lease.projectRoot === repoRoot
    && listeners5173.length === 1
    && listeners5173[0] === Number(lease.pid)
    && listeners4178.length === 0;
  if (!healthy) {
    fail(`Authority preflight failed: ${JSON.stringify({ inspected, listeners5173, listeners4178 })}`);
  }
  return {
    pid: lease.pid,
    processStartTime: lease.processStartTime,
    host: lease.host,
    port: lease.port,
    projectRoot: lease.projectRoot,
    authorityInstanceId: lease.authorityInstanceId,
    listeners5173,
    listeners4178,
    status: inspected.status,
    processAlive: inspected.processAlive,
  };
}

function readReview(reviewDir) {
  const directory = path.resolve(reviewDir);
  const artifacts = {};
  REQUIRED_ARTIFACTS.forEach((name) => {
    const filePath = path.join(directory, name);
    if (!fs.existsSync(filePath)) fail(`Missing required review artifact: ${filePath}`);
    artifacts[name] = readJson(filePath);
  });
  return { directory, artifacts };
}

function mapById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function sourceFingerprints(manifest) {
  return Object.fromEntries(manifest.items
    .filter((item) => ['active', 'published', 'seed'].includes(item.kind))
    .map((item) => [item.kind, {
      id: item.id,
      relativePath: item.relativePath,
      sha256: item.sha256,
      contentSha256: item.contentSha256,
    }]));
}

function backupTotals(manifest) {
  const backups = manifest.items.filter((item) => item.kind === 'backup');
  return {
    count: backups.length,
    bytes: backups.reduce((total, item) => total + Number(item.sizeBytes || 0), 0),
  };
}

function revisionItems(manifest) {
  return manifest.items.filter((item) => item.kind === 'revision');
}

function adapterFindings(includeBackups) {
  const report = runContentAdminMigrationInventory({ includeBackups });
  return {
    totalFindings: report.totalFindings,
    adapters: Object.fromEntries(report.reports.map((entry) => [entry.adapter, {
      findings: entry.totalFindings,
      eligibleForRetirement: entry.eligibleForRetirement,
    }])),
  };
}

function snapshotFindings(includeBackups) {
  const audit = runSnapshotAudit({ includeBackups });
  return {
    records: audit.records.length,
    findings: audit.findings.length,
    byCode: summarizeSnapshots(audit.findings),
  };
}

function buildState({ manifest, includeBackups }) {
  return {
    manifest,
    sourceFingerprints: sourceFingerprints(manifest),
    backupTotals: backupTotals(manifest),
    revisionCount: revisionItems(manifest).length,
    restoreProof: clone(manifest.currentRecoveryProof),
    migrationFindings: adapterFindings(includeBackups),
    snapshotFindings: snapshotFindings(includeBackups),
    activeSnapshotFindings: snapshotFindings(false),
  };
}

function assertCandidatePreflight({ artifacts, state }) {
  const proposed = artifacts['proposed-delete-manifest.json'];
  const dispositions = mapById((artifacts['canonical-disposition.json'].records || [])
    .map((record) => ({ ...record, id: record.canonicalId })));
  const semantics = mapById((artifacts['canonical-semantics-reconciliation.json'].records || [])
    .map((record) => ({ ...record, id: record.canonicalId })));
  const retained = artifacts['retained-backup-manifest.json'].backups || [];
  const candidates = proposed.candidates || [];
  const liveItems = mapById(state.manifest.items);
  const candidateIds = new Set(candidates.map((candidate) => candidate.canonicalId));
  const candidatePaths = new Set(candidates.map((candidate) => candidate.path));
  const retainedIds = new Set(retained.map((record) => record.id));
  const retainedPaths = new Set(retained.map((record) => record.path));

  if (proposed.candidateCount !== EXPECTED_CANDIDATE_COUNT
    || proposed.candidateBytes !== EXPECTED_CANDIDATE_BYTES
    || candidates.length !== EXPECTED_CANDIDATE_COUNT
    || candidateIds.size !== EXPECTED_CANDIDATE_COUNT
    || candidatePaths.size !== EXPECTED_CANDIDATE_COUNT) {
    fail('Approved candidate count, path uniqueness, or byte total drifted.');
  }
  if (state.backupTotals.count !== EXPECTED_BEFORE_BACKUP_COUNT
    || state.backupTotals.bytes !== EXPECTED_BEFORE_BACKUP_BYTES) {
    fail(`Backup storage drifted: ${state.backupTotals.count} files, ${state.backupTotals.bytes} bytes.`);
  }
  if (retained.length !== EXPECTED_RECOVERY_COUNT || state.revisionCount !== EXPECTED_REVISION_COUNT) {
    fail('Retained recovery or unresolved revision count drifted.');
  }
  if (state.restoreProof?.status !== 'passed') fail('Current-schema restore proof is not passing.');
  if (state.activeSnapshotFindings.findings !== 0) fail('Active/published snapshot findings are not clean.');

  const liveBackups = new Set(state.manifest.items.filter((item) => item.kind === 'backup').map((item) => item.id));
  if (candidateIds.size + retainedIds.size !== liveBackups.size
    || [...candidateIds, ...retainedIds].some((id) => !liveBackups.has(id))) {
    fail('Candidate and retained manifests do not partition current backup storage.');
  }

  candidates.forEach((candidate) => {
    const live = liveItems.get(candidate.canonicalId);
    const disposition = dispositions.get(candidate.canonicalId);
    const semantic = semantics.get(candidate.canonicalId);
    const sourcePath = resolveRepoPath(candidate.path);
    if (candidate.recordKind !== 'backup' || !live || live.kind !== 'backup') fail(`Candidate is not a live backup: ${candidate.canonicalId}`);
    if (!sourcePath.startsWith(`${backupRoot}${path.sep}`) || !fs.existsSync(sourcePath)) fail(`Candidate missing/outside backup storage: ${candidate.path}`);
    if (candidate.recoveryRecord || candidate.protectedRelease || candidate.newestValidBackup) fail(`Candidate is protected: ${candidate.canonicalId}`);
    if (retainedIds.has(candidate.canonicalId) || retainedPaths.has(candidate.path)) fail(`Candidate overlaps retained recovery: ${candidate.canonicalId}`);
    if (disposition?.classification !== 'delete obsolete historical canonical'
      || semantic?.classification !== 'delete obsolete historical canonical'
      || semantic?.recordKind !== 'backup'
      || semantic?.directlyRestorable !== false
      || semantic?.currentSchemaPolicyStatus === 'valid-current-policy') {
      fail(`Candidate disposition is not approved obsolete canonical: ${candidate.canonicalId}`);
    }
    const stats = fs.statSync(sourcePath);
    const checksum = hashFile(sourcePath);
    if (stats.size !== Number(candidate.sizeBytes) || checksum !== candidate.checksum || checksum !== candidate.liveChecksum) {
      fail(`Candidate checksum or size drifted: ${candidate.path}`);
    }
    if (candidateIds.has(`revision:${candidate.path}`)) fail(`Revision entered deletion set: ${candidate.path}`);
  });

  const heldRevisions = (artifacts['canonical-semantics-reconciliation.json'].records || [])
    .filter((record) => record.recordKind === 'revision');
  if (heldRevisions.length !== 2 || heldRevisions.some((record) => record.classification !== 'unknown/hold')) {
    fail('The two canonical external revisions are not preserved as hold-only records.');
  }
  if (heldRevisions.some((record) => candidateIds.has(record.canonicalId))) fail('Canonical revision entered deletion set.');

  const sourceBefore = state.sourceFingerprints;
  const sharedPath = resolveRepoPath('dev-data/content-admin-shared.json');
  const seedPath = resolveRepoPath('dev-data/content-admin-seed-baseline.json');
  if (hashFile(sharedPath) !== sourceBefore.active.sha256 || hashFile(seedPath) !== sourceBefore.seed.sha256) {
    fail('Active or seed source checksum drifted during preflight.');
  }

  retained.forEach((record) => {
    const live = liveItems.get(record.id);
    if (!live || live.kind !== 'backup' || live.relativePath !== record.path
      || live.sha256 !== record.sha256 || Number(live.sizeBytes) !== Number(record.sizeBytes)) {
      fail(`Retained backup manifest drifted: ${record.id}`);
    }
  });

  const newest = state.manifest.items
    .filter((item) => item.kind === 'backup'
      && item.currentSchema === true
      && item.restoreEligibility === 'eligible'
      && Number(item.migrationFindingCount || 0) === 0)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
  if (!newest || candidateIds.has(newest.id) || !retainedIds.has(newest.id)) {
    fail('Newest valid current-schema recovery is not retained.');
  }

  const authority = verifyAuthority();
  return {
    candidates,
    retained,
    heldRevisions,
    sourceBefore,
    authority,
    newestCurrentId: newest.id,
  };
}

function parseArgs(argv) {
  const value = (name, fallback = '') => {
    const index = argv.indexOf(name);
    return index >= 0 ? String(argv[index + 1] || '').trim() : fallback;
  };
  return {
    reviewDir: value('--review-dir', DEFAULT_REVIEW_DIR),
    executionDir: value('--execution-dir', DEFAULT_EXECUTION_DIR),
    actor: value('--actor'),
    reason: value('--reason'),
    policyVersion: value('--policy-version'),
    confirmation: value('--confirm'),
    execute: argv.includes('--execute'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.execute) fail('Deletion requires explicit --execute.');
  if (!args.actor || !args.reason || args.policyVersion !== '1.0' || args.confirmation !== EXPECTED_CONFIRMATION) {
    fail(`Deletion requires actor, reason, policy version 1.0, and confirmation ${EXPECTED_CONFIRMATION}.`);
  }
  const { directory, artifacts } = readReview(args.reviewDir);
  const executionDir = path.resolve(args.executionDir);
  if (fs.existsSync(executionDir)) fail(`Execution directory already exists: ${executionDir}`);

  const authorityBefore = verifyAuthority();
  const manifestBefore = buildRetentionManifest({
    migrationReport: runContentAdminMigrationInventory({ includeBackups: true }),
  });
  const stateBefore = buildState({ manifest: manifestBefore, includeBackups: true });
  const plan = assertCandidatePreflight({ artifacts, state: stateBefore });
  const authorityAfterPreflight = verifyAuthority();
  if (JSON.stringify(authorityBefore) !== JSON.stringify(authorityAfterPreflight)) fail('Authority changed during preflight.');

  fs.mkdirSync(executionDir, { recursive: true, mode: 0o700 });
  const executionStartedAt = new Date().toISOString();
  const beforePath = writeImmutable(path.join(executionDir, 'execution-before-manifest-v1.json'), {
    manifestVersion: 1,
    reviewDirectory: directory,
    execution: {
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      confirmation: args.confirmation,
      executionStartedAt,
      mutationPerformed: false,
    },
    authority: plan.authority,
    candidates: plan.candidates.map((candidate) => ({
      id: candidate.canonicalId,
      path: candidate.path,
      sha256: candidate.checksum,
      sizeBytes: candidate.sizeBytes,
    })),
    retainedRecoveryRecords: plan.retained,
    heldCanonicalRevisions: plan.heldRevisions,
    newestCurrentId: plan.newestCurrentId,
    backupTotalsBefore: stateBefore.backupTotals,
    sourceFingerprintsBefore: stateBefore.sourceFingerprints,
    migrationFindingsBefore: stateBefore.migrationFindings,
    snapshotFindingsBefore: stateBefore.snapshotFindings,
  });
  const beforeChecksum = hashFile(beforePath);

  verifyAuthority();
  plan.candidates.forEach((candidate) => fs.unlinkSync(resolveRepoPath(candidate.path)));

  const manifestAfter = buildRetentionManifest({
    migrationReport: runContentAdminMigrationInventory({ includeBackups: true }),
  });
  const stateAfter = buildState({ manifest: manifestAfter, includeBackups: true });
  const sourceAfter = stateAfter.sourceFingerprints;
  const authorityAfter = verifyAuthority();

  if (stateAfter.backupTotals.count !== EXPECTED_AFTER_BACKUP_COUNT
    || stateAfter.backupTotals.bytes !== EXPECTED_AFTER_BACKUP_BYTES) {
    fail(`Post-deletion backup totals mismatch: ${stateAfter.backupTotals.count} files, ${stateAfter.backupTotals.bytes} bytes.`);
  }
  if (stateAfter.revisionCount !== EXPECTED_REVISION_COUNT) fail('Post-deletion revision count changed.');
  if (stateAfter.restoreProof?.status !== 'passed') fail('Post-deletion current-schema restore proof failed.');
  if (JSON.stringify(sourceAfter) !== JSON.stringify(stateBefore.sourceFingerprints)) fail('Active, published, or seed hashes changed.');
  if (stateAfter.activeSnapshotFindings.findings !== 0) fail('Post-deletion active/published snapshot findings appeared.');
  if (plan.candidates.some((candidate) => fs.existsSync(resolveRepoPath(candidate.path)))) fail('Deleted candidate still exists.');
  plan.retained.forEach((record) => {
    const live = manifestAfter.items.find((item) => item.id === record.id);
    if (!live || live.sha256 !== record.sha256 || live.relativePath !== record.path) fail(`Retained recovery changed: ${record.id}`);
  });
  plan.heldRevisions.forEach((record) => {
    const live = manifestAfter.items.find((item) => item.id === record.canonicalId);
    if (!live) fail(`Held revision disappeared: ${record.canonicalId}`);
  });

  const afterPath = writeImmutable(path.join(executionDir, 'execution-after-manifest-v1.json'), {
    manifestVersion: 1,
    reviewDirectory: directory,
    execution: {
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      confirmation: args.confirmation,
      executionStartedAt,
      executionFinishedAt: new Date().toISOString(),
      mutationPerformed: true,
    },
    authorityBefore: plan.authority,
    authorityAfter,
    beforeManifestPath: beforePath,
    beforeManifestSha256: beforeChecksum,
    deletedPaths: plan.candidates.map((candidate) => ({
      id: candidate.canonicalId,
      path: candidate.path,
      sha256: candidate.checksum,
      sizeBytes: candidate.sizeBytes,
    })),
    bytesReclaimed: EXPECTED_CANDIDATE_BYTES,
    backupTotalsBefore: stateBefore.backupTotals,
    backupTotalsAfter: stateAfter.backupTotals,
    retainedBackupRecords: manifestAfter.items.filter((item) => item.kind === 'backup').map((item) => ({
      id: item.id,
      path: item.relativePath,
      sha256: item.sha256,
      sizeBytes: item.sizeBytes,
    })),
    retainedRecoveryRecords: plan.retained,
    heldCanonicalRevisions: plan.heldRevisions,
    sourceFingerprintsBefore: stateBefore.sourceFingerprints,
    sourceFingerprintsAfter: sourceAfter,
    migrationFindingsBefore: stateBefore.migrationFindings,
    migrationFindingsAfter: stateAfter.migrationFindings,
    snapshotFindingsBefore: stateBefore.snapshotFindings,
    snapshotFindingsAfter: stateAfter.snapshotFindings,
    restoreProofAfter: stateAfter.restoreProof,
    mutationScope: 'approved obsolete canonical backups only',
  });

  console.log(JSON.stringify({
    status: 'deleted-obsolete-canonical-backups',
    executionDir,
    deletedCount: plan.candidates.length,
    bytesReclaimed: EXPECTED_CANDIDATE_BYTES,
    backupCountBefore: stateBefore.backupTotals.count,
    backupBytesBefore: stateBefore.backupTotals.bytes,
    backupCountAfter: stateAfter.backupTotals.count,
    backupBytesAfter: stateAfter.backupTotals.bytes,
    retainedRecoveryCount: plan.retained.length,
    heldRevisionCount: plan.heldRevisions.length,
    beforePath,
    afterPath,
    migrationFindingsBefore: stateBefore.migrationFindings,
    migrationFindingsAfter: stateAfter.migrationFindings,
    snapshotFindingsBefore: stateBefore.snapshotFindings,
    snapshotFindingsAfter: stateAfter.snapshotFindings,
    authority: authorityAfter,
    mutationPerformed: true,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Canonical backup deletion aborted: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
