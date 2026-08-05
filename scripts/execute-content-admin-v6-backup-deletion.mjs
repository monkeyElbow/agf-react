#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRetentionManifest } from './content-admin-retention.mjs';
import { buildMigrationEvidenceMap } from '../src/lib/contentAdminRetentionEvidence.js';
import { inspectContentAdminAuthority } from '../dev-server/contentAdminAuthority.js';
import {
  buildRetentionDependencyFingerprints,
  hashRetentionValue,
} from '../src/lib/contentAdminRetentionFingerprints.js';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const backupRoot = path.resolve(repoRoot, 'dev-data/backups');
const EXPECTED_CANDIDATE_COUNT = 71;
const EXPECTED_CANDIDATE_BYTES = 1_877_922_772;
const EXPECTED_BEFORE_BACKUP_COUNT = 101;
const EXPECTED_BEFORE_BACKUP_BYTES = 2_855_686_790;
const EXPECTED_AFTER_BACKUP_COUNT = 30;
const EXPECTED_AFTER_BACKUP_BYTES = 977_764_018;
const EXPECTED_CANONICAL_COUNT = 23;
const EXPECTED_RECOVERY_COUNT = 14;
const EXPECTED_REVISION_COUNT = 164;
const EXPECTED_AUTHORITY = Object.freeze({
  pid: 31775,
  port: 5173,
  host: '127.0.0.1',
  projectRoot: repoRoot,
  authorityInstanceId: '31775-1785961783370-ituv38',
});

const REQUIRED_REVIEW_FILES = Object.freeze([
  'before-manifest-v4.json',
  'corrected-delete-candidates-v4.json',
  'retained-canonical-records-v4.json',
  'retained-recovery-records-v4.json',
  'protected-release-records-v4.json',
  'route-dependency-map-v1.json',
  'published-route-fingerprints-v1.json',
  'restore-proof-v1.json',
  'runtime-safety-fingerprint-v1.json',
  'dry-run-cleanup-plan-v4.json',
  'projected-after-storage-v4.json',
  'preflight-invalidation-rules-v1.md',
]);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
  const inspected = inspectContentAdminAuthority(path.join(repoRoot, 'dev-data/content-admin-authority.lock'));
  const listeners5173 = listenerPids(5173);
  const listeners4178 = listenerPids(4178);
  const lease = inspected.lease || {};
  const matches = inspected.status === 'owned'
    && inspected.processAlive
    && lease.pid === EXPECTED_AUTHORITY.pid
    && lease.port === EXPECTED_AUTHORITY.port
    && lease.host === EXPECTED_AUTHORITY.host
    && lease.projectRoot === EXPECTED_AUTHORITY.projectRoot
    && lease.authorityInstanceId === EXPECTED_AUTHORITY.authorityInstanceId;
  if (!matches || listeners5173.length !== 1 || listeners5173[0] !== EXPECTED_AUTHORITY.pid || listeners4178.length !== 0) {
    fail(`Authority preflight failed: ${JSON.stringify({ inspected, listeners5173, listeners4178 })}`);
  }
  return {
    pid: lease.pid,
    port: lease.port,
    host: lease.host,
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
  REQUIRED_REVIEW_FILES.forEach((name) => {
    const filePath = path.join(directory, name);
    if (!fs.existsSync(filePath)) fail(`Missing v6 review artifact: ${filePath}`);
    artifacts[name] = name.endsWith('.json') ? readJson(filePath) : fs.readFileSync(filePath, 'utf8');
  });
  return { directory, artifacts };
}

function mapById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function sourceHashes(manifest) {
  return Object.fromEntries(manifest.items
    .filter((item) => ['active', 'published', 'seed'].includes(item.kind))
    .map((item) => [item.kind, item.sha256]));
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

function assertEqualFingerprint(actual, expected, label) {
  if (hashRetentionValue(actual) !== hashRetentionValue(expected)) {
    fail(`${label} fingerprint drifted.`);
  }
}

export function validateDeletionCandidates({
  candidates,
  expectedCount = EXPECTED_CANDIDATE_COUNT,
  expectedBytes = EXPECTED_CANDIDATE_BYTES,
  canonicalIds = new Set(),
  recoveryIds = new Set(),
  releaseIds = new Set(),
  unresolvedRevisionIds = new Set(),
  restoreDependencyIds = new Set(),
} = {}) {
  const ids = new Set(candidates.map((candidate) => candidate.id));
  const paths = new Set(candidates.map((candidate) => candidate.relativePath));
  const bytes = candidates.reduce((total, candidate) => total + Number(candidate.sizeBytes || 0), 0);
  if (candidates.length !== expectedCount || ids.size !== expectedCount || paths.size !== expectedCount || bytes !== expectedBytes) {
    fail(`Candidate count or byte mismatch: ${candidates.length} files, ${bytes} bytes.`);
  }
  const protectedSets = [
    ['canonical', canonicalIds],
    ['recovery', recoveryIds],
    ['protected release', releaseIds],
    ['unresolved revision', unresolvedRevisionIds],
    ['restore dependency', restoreDependencyIds],
  ];
  candidates.forEach((candidate) => {
    if (candidate.kind !== 'backup' || candidate.executable !== true) fail(`Candidate is not an executable backup: ${candidate.id}`);
    protectedSets.forEach(([label, protectedIds]) => {
      if (protectedIds.has(candidate.id) || protectedIds.has(candidate.relativePath)) {
        fail(`Candidate overlaps protected ${label} record: ${candidate.id}`);
      }
    });
  });
  return { count: candidates.length, bytes, ids, paths };
}

async function buildLiveManifest() {
  const { runContentAdminMigrationInventory } = await import('./content-admin-migration-inventory.mjs');
  const migrationReport = runContentAdminMigrationInventory({ includeBackups: true });
  const evidence = buildMigrationEvidenceMap(migrationReport);
  const scanByRecord = Object.fromEntries(Object.entries(evidence)
    .map(([key, value]) => [key, value.findings.length]));
  return buildRetentionManifest({
    migrationReport,
    migrationEvidenceByRecord: evidence,
    migrationScanByRecord: scanByRecord,
  });
}

function currentRecoveryIds(manifest) {
  return new Set(manifest.cleanupPlan
    .filter((item) => item.category === 'retain current recovery')
    .map((item) => item.id));
}

function buildExpectedFingerprints({ artifacts, manifest, candidates, recoveryRecords, canonicalRecords, releaseRecords }) {
  const routeMap = artifacts['route-dependency-map-v1.json'];
  const relevantRoutes = routeMap.routesWithPublishedDependencies || [];
  return buildRetentionDependencyFingerprints({
    candidates,
    canonicalRecords,
    recoveryRecords,
    protectedReleaseRecords: releaseRecords,
    restoreProof: manifest.restoreSamples,
    policy: manifest.policy,
    publishedBaseSnapshot: readJson(path.join(repoRoot, 'dev-data/content-admin-shared.json')).baseSnapshot,
    relevantPublishedRoutes: relevantRoutes,
    schemaVersion: manifest.policy.currentSchemaVersion,
    migrationDetectorVersion: manifest.migrationInventory.length,
  });
}

function validatePreflight({ artifacts, manifest, authority }) {
  const candidateArtifact = artifacts['corrected-delete-candidates-v4.json'];
  const candidates = candidateArtifact.candidates || [];
  const canonicalArtifact = artifacts['retained-canonical-records-v4.json'];
  const recoveryArtifact = artifacts['retained-recovery-records-v4.json'];
  const releaseArtifact = artifacts['protected-release-records-v4.json'];
  const canonicalRecords = canonicalArtifact.records || [];
  const recoveryRecords = recoveryArtifact.records || [];
  const releaseRecords = releaseArtifact.records || [];
  if (canonicalRecords.length !== EXPECTED_CANONICAL_COUNT) fail(`Expected ${EXPECTED_CANONICAL_COUNT} canonical records.`);
  if (recoveryRecords.length !== EXPECTED_RECOVERY_COUNT) fail(`Expected ${EXPECTED_RECOVERY_COUNT} recovery records.`);
  if (releaseRecords.length !== 0) fail('Unexpected protected release records in approved v6 review.');

  const liveItems = mapById(manifest.items);
  const canonicalIds = new Set(canonicalRecords.map((record) => record.canonicalId));
  const recoveryIds = new Set(recoveryRecords.map((record) => record.id));
  const revisionIds = new Set(revisionItems(manifest).map((item) => item.id));
  const restoreIds = new Set((artifacts['restore-proof-v1.json'].samples || []).map((sample) => sample.id));
  const releaseIds = new Set(releaseRecords.map((record) => record.id || record.canonicalId));

  validateDeletionCandidates({
    candidates,
    canonicalIds,
    recoveryIds,
    releaseIds,
    unresolvedRevisionIds: revisionIds,
    restoreDependencyIds: restoreIds,
  });
  if (candidateArtifact.candidateCount !== EXPECTED_CANDIDATE_COUNT
    || candidateArtifact.candidateBytes !== EXPECTED_CANDIDATE_BYTES) {
    fail('Approved candidate artifact totals do not match the approved v6 deletion.');
  }

  const reviewedBefore = artifacts['before-manifest-v4.json'];
  if (reviewedBefore.mutationPerformed !== false || reviewedBefore.reviewStatus !== 'ready-for-independent-deletion-approval') {
    fail('The v6 review is not an unmutated approved review artifact.');
  }
  const liveSources = sourceHashes(manifest);
  const reviewedSources = sourceHashes(reviewedBefore);
  if (hashRetentionValue(liveSources) !== hashRetentionValue(reviewedSources)) fail('Active, published, or seed hashes drifted from v6 review.');
  for (const [kind, checksum] of Object.entries(liveSources)) {
    const item = manifest.items.find((entry) => entry.kind === kind);
    if (!item || hashFile(resolveRepoPath(item.relativePath)) !== checksum) fail(`${kind} source checksum verification failed.`);
  }

  const totals = backupTotals(manifest);
  if (totals.count !== EXPECTED_BEFORE_BACKUP_COUNT || totals.bytes !== EXPECTED_BEFORE_BACKUP_BYTES) {
    fail(`Current backup storage drifted: ${totals.count} files, ${totals.bytes} bytes.`);
  }
  if (revisionItems(manifest).length !== EXPECTED_REVISION_COUNT) fail('Unresolved revision count drifted.');
  if (manifest.currentRecoveryProof.status !== 'passed') fail('Current-schema restore proof is not passing.');

  const liveRecoveryIds = currentRecoveryIds(manifest);
  if (liveRecoveryIds.size !== EXPECTED_RECOVERY_COUNT || [...recoveryIds].some((id) => !liveRecoveryIds.has(id))) {
    fail('Current recovery set drifted from the v6 review.');
  }
  const newest = manifest.items
    .filter((item) => item.kind === 'backup' && item.currentSchema && item.restoreEligibility === 'eligible' && item.migrationFindingCount === 0)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
  if (!newest || !recoveryIds.has(newest.id) || candidates.some((candidate) => candidate.id === newest.id)) {
    fail('Newest valid current-schema backup is not protected by the v6 review.');
  }

  const livePlanById = mapById(manifest.cleanupPlan);
  const prepared = candidates.map((candidate) => {
    const live = livePlanById.get(candidate.id);
    if (!live || live.category !== 'review strongly inferred candidate' || live.relativePath !== candidate.relativePath
      || live.sha256 !== candidate.sha256 || Number(live.sizeBytes) !== Number(candidate.sizeBytes)) {
      fail(`Candidate review drifted: ${candidate.id}`);
    }
    if (manifest.duplicateGroups.some((group) => group.canonicalCandidate === candidate.id)) {
      fail(`Candidate is a live duplicate-group canonical: ${candidate.id}`);
    }
    const sourcePath = resolveRepoPath(candidate.relativePath);
    if (!sourcePath.startsWith(`${backupRoot}${path.sep}`) || !fs.existsSync(sourcePath)) fail(`Candidate missing/outside backup storage: ${candidate.relativePath}`);
    const sizeBytes = fs.statSync(sourcePath).size;
    const sha256 = hashFile(sourcePath);
    if (sizeBytes !== Number(candidate.sizeBytes) || sha256 !== candidate.sha256) fail(`Candidate checksum drifted: ${candidate.relativePath}`);
    return { candidate, sourcePath };
  });

  canonicalRecords.forEach((record) => {
    const item = liveItems.get(record.canonicalId);
    if (!item || item.relativePath !== record.canonicalPath || item.sha256 !== record.canonicalSha256) fail(`Canonical record drifted: ${record.canonicalId}`);
  });
  recoveryRecords.forEach((record) => {
    const item = liveItems.get(record.id);
    if (!item || item.sha256 !== record.sha256 || item.relativePath !== record.relativePath) fail(`Recovery record drifted: ${record.id}`);
  });

  const expectedFingerprints = buildExpectedFingerprints({
    artifacts,
    manifest,
    candidates,
    recoveryRecords,
    canonicalRecords: canonicalRecords.map((record) => ({
      id: record.canonicalId,
      relativePath: record.canonicalPath,
      sha256: record.canonicalSha256,
      sizeBytes: record.canonicalSizeBytes,
      duplicateGroupId: record.groupId,
    })),
    releaseRecords,
  });
  assertEqualFingerprint(expectedFingerprints, reviewedBefore.dependencyFingerprints, 'v6 dependency');
  assertEqualFingerprint(expectedFingerprints.restoreProof, artifacts['restore-proof-v1.json'].fingerprint, 'restore proof');
  assertEqualFingerprint(expectedFingerprints.runtimeSafety, {
    value: artifacts['runtime-safety-fingerprint-v1.json'].value,
    sha256: artifacts['runtime-safety-fingerprint-v1.json'].sha256,
  }, 'runtime safety');
  assertEqualFingerprint(expectedFingerprints.routeScopedPublished, {
    routes: artifacts['published-route-fingerprints-v1.json'].routes,
    sha256: artifacts['published-route-fingerprints-v1.json'].sha256,
  }, 'published route');

  const routeMap = artifacts['route-dependency-map-v1.json'];
  const routeEntries = new Map((routeMap.candidates || []).map((entry) => [entry.candidateId, entry]));
  candidates.forEach((candidate) => {
    const routeEntry = routeEntries.get(candidate.id);
    if (!routeEntry || (routeEntry.publishedDependencies || []).length || routeEntry.dependsOnTestRoute) {
      fail(`Candidate has a route dependency: ${candidate.id}`);
    }
  });

  const authorityAgain = verifyAuthority();
  if (hashRetentionValue(authorityAgain) !== hashRetentionValue(authority)) fail('Authority changed during preflight.');
  return {
    candidates,
    prepared,
    canonicalRecords,
    recoveryRecords,
    releaseRecords,
    revisionItems: revisionItems(manifest),
    newestCurrentId: newest.id,
    sourceHashes: liveSources,
    backupTotals: totals,
    dependencyFingerprints: expectedFingerprints,
  };
}

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? String(argv[index + 1] || '').trim() : '';
  };
  return {
    reviewDir: get('--review-dir') || '/tmp/agf-retention-review-20260805-v6',
    executionDir: get('--execution-dir') || '/tmp/agf-retention-execution-20260805-v1',
    actor: get('--actor'),
    reason: get('--reason'),
    policyVersion: get('--policy-version'),
    confirmation: get('--confirm'),
    execute: argv.includes('--execute'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.execute) fail('Deletion requires explicit --execute.');
  if (!args.actor || !args.reason || args.policyVersion !== '1.0' || args.confirmation !== 'DELETE_V6_71_BACKUPS') {
    fail('Deletion requires actor, reason, policy version 1.0, and confirmation DELETE_V6_71_BACKUPS.');
  }
  const { directory, artifacts } = readReview(args.reviewDir);
  const executionDir = path.resolve(args.executionDir);
  if (fs.existsSync(executionDir)) fail(`Execution directory already exists: ${executionDir}`);
  const authority = verifyAuthority();
  const sharedPath = path.join(repoRoot, 'dev-data/content-admin-shared.json');
  const seedPath = path.join(repoRoot, 'dev-data/content-admin-seed-baseline.json');
  const sharedBefore = hashFile(sharedPath);
  const seedBefore = hashFile(seedPath);
  const beforeManifest = await buildLiveManifest();
  if (hashFile(sharedPath) !== sharedBefore || hashFile(seedPath) !== seedBefore) fail('Shared or seed file changed during preflight capture.');
  const plan = validatePreflight({ artifacts, manifest: beforeManifest, authority });
  fs.mkdirSync(executionDir, { recursive: true, mode: 0o700 });
  const startedAt = new Date().toISOString();
  const beforePayload = {
    manifestVersion: 1,
    reviewDirectory: directory,
    execution: {
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      confirmation: args.confirmation,
      executionStartedAt: startedAt,
      mutationPerformed: false,
    },
    authority,
    reviewedDependencyFingerprints: plan.dependencyFingerprints,
    sourceHashes: plan.sourceHashes,
    backupTotalsBefore: plan.backupTotals,
    candidates: plan.candidates.map((candidate) => ({
      id: candidate.id,
      relativePath: candidate.relativePath,
      sha256: candidate.sha256,
      sizeBytes: candidate.sizeBytes,
    })),
    retainedCanonicalRecords: plan.canonicalRecords,
    retainedRecoveryRecords: plan.recoveryRecords,
    retainedReleaseRecords: plan.releaseRecords,
    unresolvedRevisionCount: plan.revisionItems.length,
    newestCurrentId: plan.newestCurrentId,
    activePublishedSeedChecksums: { shared: sharedBefore, seed: seedBefore },
  };
  const beforePath = writeImmutable(path.join(executionDir, 'execution-before-manifest-v1.json'), beforePayload);
  const beforeChecksum = hashFile(beforePath);

  verifyAuthority();
  plan.prepared.forEach(({ sourcePath }) => fs.unlinkSync(sourcePath));

  const afterManifest = await buildLiveManifest();
  const sourceAfter = sourceHashes(afterManifest);
  if (hashRetentionValue(sourceAfter) !== hashRetentionValue(plan.sourceHashes)
    || hashFile(sharedPath) !== sharedBefore || hashFile(seedPath) !== seedBefore) {
    fail('Active, published, or seed hashes changed after deletion.');
  }
  const afterTotals = backupTotals(afterManifest);
  if (afterTotals.count !== EXPECTED_AFTER_BACKUP_COUNT || afterTotals.bytes !== EXPECTED_AFTER_BACKUP_BYTES) {
    fail(`Post-deletion backup totals mismatch: ${afterTotals.count} files, ${afterTotals.bytes} bytes.`);
  }
  if (revisionItems(afterManifest).length !== EXPECTED_REVISION_COUNT) fail('Post-deletion unresolved revision count changed.');
  if (afterManifest.currentRecoveryProof.status !== 'passed') fail('Post-deletion restore proof failed.');
  const afterItems = mapById(afterManifest.items);
  plan.canonicalRecords.forEach((record) => {
    const item = afterItems.get(record.canonicalId);
    if (!item || item.sha256 !== record.canonicalSha256) fail(`Canonical record missing after deletion: ${record.canonicalId}`);
  });
  plan.recoveryRecords.forEach((record) => {
    const item = afterItems.get(record.id);
    if (!item || item.sha256 !== record.sha256) fail(`Recovery record missing after deletion: ${record.id}`);
  });
  plan.candidates.forEach((candidate) => {
    if (fs.existsSync(resolveRepoPath(candidate.relativePath))) fail(`Deleted candidate still exists: ${candidate.relativePath}`);
  });
  const authorityAfter = verifyAuthority();
  const deletedPaths = plan.candidates.map((candidate) => ({
    id: candidate.id,
    relativePath: candidate.relativePath,
    sha256: candidate.sha256,
    sizeBytes: candidate.sizeBytes,
  }));
  const afterPath = writeImmutable(path.join(executionDir, 'execution-after-manifest-v1.json'), {
    manifestVersion: 1,
    reviewDirectory: directory,
    execution: {
      actor: args.actor,
      reason: args.reason,
      policyVersion: args.policyVersion,
      confirmation: args.confirmation,
      executionStartedAt: startedAt,
      executionFinishedAt: new Date().toISOString(),
      mutationPerformed: true,
    },
    authorityBefore: authority,
    authorityAfter,
    beforeManifestPath: beforePath,
    beforeManifestSha256: beforeChecksum,
    deletedPaths,
    bytesReclaimed: EXPECTED_CANDIDATE_BYTES,
    backupTotalsBefore: plan.backupTotals,
    backupTotalsAfter: afterTotals,
    retainedBackupPaths: afterManifest.items.filter((item) => item.kind === 'backup').map((item) => ({
      id: item.id,
      relativePath: item.relativePath,
      sha256: item.sha256,
      sizeBytes: item.sizeBytes,
    })),
    retainedCanonicalRecords: plan.canonicalRecords,
    retainedRecoveryRecords: plan.recoveryRecords,
    unresolvedRevisionCount: revisionItems(afterManifest).length,
    sourceHashesBefore: plan.sourceHashes,
    sourceHashesAfter: sourceAfter,
    restoreProof: afterManifest.currentRecoveryProof,
    mutationScope: 'approved v6 backup candidates only',
  });
  console.log(JSON.stringify({
    status: 'deleted-v6-retention-candidates',
    executionDir,
    deletedCount: deletedPaths.length,
    bytesReclaimed: EXPECTED_CANDIDATE_BYTES,
    backupCountBefore: plan.backupTotals.count,
    backupBytesBefore: plan.backupTotals.bytes,
    backupCountAfter: afterTotals.count,
    backupBytesAfter: afterTotals.bytes,
    canonicalCount: plan.canonicalRecords.length,
    recoveryCount: plan.recoveryRecords.length,
    unresolvedRevisionCount: revisionItems(afterManifest).length,
    beforePath,
    afterPath,
    mutationPerformed: true,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`V6 retention deletion aborted: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
