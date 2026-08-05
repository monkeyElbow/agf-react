#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRetentionManifest } from './content-admin-retention.mjs';
import { buildMigrationEvidenceMap } from '../src/lib/contentAdminRetentionEvidence.js';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const EXPECTED_CANDIDATE_COUNT = 71;
const EXPECTED_CANDIDATE_BYTES = 1877922772;
const EXPECTED_RECOVERY_COUNT = 13;
const EXPECTED_REVISION_COUNT = 163;
const EXPECTED_DUPLICATE_GROUP_COUNT = 23;
const EXPECTED_AFTER_BACKUP_COUNT = 29;
const EXPECTED_AFTER_BACKUP_BYTES = 939904116;
const REQUIRED_FILES = Object.freeze([
  'before-manifest-v3.json',
  'corrected-delete-candidates-v3.json',
  'retained-canonical-records-v3.json',
  'duplicate-groups-v3.json',
  'dry-run-cleanup-plan-v3.json',
  'projected-after-storage-v3.json',
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveRepoPath(relativePath) {
  const resolved = path.resolve(repoRoot, relativePath);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function mapById(items = []) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function loadReview(reviewDir) {
  const directory = path.resolve(reviewDir);
  const artifacts = {};
  REQUIRED_FILES.forEach((fileName) => {
    const filePath = path.join(directory, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Missing required v4 review artifact: ${filePath}`);
    artifacts[fileName] = readJson(filePath);
  });
  return { directory, artifacts };
}

async function buildLiveManifest() {
  const { runContentAdminMigrationInventory } = await import('./content-admin-migration-inventory.mjs');
  const migrationReport = runContentAdminMigrationInventory({ includeBackups: true });
  const migrationEvidenceByRecord = buildMigrationEvidenceMap(migrationReport);
  const migrationScanByRecord = Object.fromEntries(Object.entries(migrationEvidenceByRecord)
    .map(([key, value]) => [key, value.findings.length]));
  return buildRetentionManifest({
    migrationReport,
    migrationEvidenceByRecord,
    migrationScanByRecord,
  });
}

function sourceHashes(manifest) {
  return Object.fromEntries((manifest.items || [])
    .filter((item) => ['active', 'published', 'seed'].includes(item.kind))
    .map((item) => [item.kind, item.sha256]));
}

function assertSourceHashesUnchanged(reviewedBefore, liveManifest) {
  const reviewed = sourceHashes(reviewedBefore);
  const live = sourceHashes(liveManifest);
  ['active', 'published', 'seed'].forEach((kind) => {
    if (!reviewed[kind] || reviewed[kind] !== live[kind]) {
      throw new Error(`Reviewed ${kind} hash differs from live state.`);
    }
    const item = liveManifest.items.find((entry) => entry.kind === kind);
    if (!item || hashFile(resolveRepoPath(item.relativePath)) !== live[kind]) {
      throw new Error(`Live ${kind} hash verification failed.`);
    }
  });
}

function assertCanonicalGroups({ artifacts, liveManifest, candidateIds }) {
  const reviewedGroups = artifacts['duplicate-groups-v3.json'].groups || [];
  const canonicalRecords = artifacts['retained-canonical-records-v3.json'].records || [];
  if (reviewedGroups.length !== EXPECTED_DUPLICATE_GROUP_COUNT
    || canonicalRecords.length !== EXPECTED_DUPLICATE_GROUP_COUNT) {
    throw new Error(`Expected ${EXPECTED_DUPLICATE_GROUP_COUNT} duplicate groups and canonical records.`);
  }
  const liveGroups = new Map((liveManifest.duplicateGroups || []).map((group) => [group.groupId, group]));
  const liveItems = mapById(liveManifest.items || []);
  const canonicalIds = new Set();
  reviewedGroups.forEach((group) => {
    const live = liveGroups.get(group.groupId);
    if (!live || live.canonicalCandidate !== group.canonicalId) {
      throw new Error(`Duplicate group drift detected for ${group.groupId}.`);
    }
    const canonicalId = group.canonicalId;
    if (candidateIds.has(canonicalId)) {
      throw new Error(`Candidate is a retained canonical record: ${canonicalId}`);
    }
    const source = liveItems.get(canonicalId);
    const member = (group.members || []).find((entry) => entry.id === canonicalId);
    if (!source || !member || source.sha256 !== member.sha256
      || group.canonicalSha256 !== source.sha256
      || group.checksumStatus !== 'verified against live source manifest') {
      throw new Error(`Canonical checksum verification failed for ${canonicalId}.`);
    }
    canonicalIds.add(canonicalId);
  });
  if (canonicalIds.size !== EXPECTED_DUPLICATE_GROUP_COUNT) {
    throw new Error('Duplicate groups do not retain one unique canonical record each.');
  }
  return canonicalRecords;
}

function preflight({ artifacts, liveManifest }) {
  const candidateArtifact = artifacts['corrected-delete-candidates-v3.json'];
  const candidates = candidateArtifact.candidates || [];
  const candidateIds = new Set(candidates.map((item) => item.id));
  const candidatePaths = new Set(candidates.map((item) => item.relativePath));
  const candidateBytes = candidates.reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  if (candidateArtifact.candidateCount !== EXPECTED_CANDIDATE_COUNT
    || candidates.length !== EXPECTED_CANDIDATE_COUNT
    || candidateIds.size !== EXPECTED_CANDIDATE_COUNT
    || candidatePaths.size !== EXPECTED_CANDIDATE_COUNT
    || candidateBytes !== EXPECTED_CANDIDATE_BYTES) {
    throw new Error(`Candidate count or byte total mismatch: ${candidates.length} files, ${candidateBytes} bytes.`);
  }
  const projected = artifacts['projected-after-storage-v3.json'];
  if (projected.projectedAfter?.backupCount !== EXPECTED_AFTER_BACKUP_COUNT
    || projected.projectedAfter?.backupBytes !== EXPECTED_AFTER_BACKUP_BYTES) {
    throw new Error('Projected after-storage totals do not match the approved review.');
  }
  const reviewedBefore = artifacts['before-manifest-v3.json'];
  assertSourceHashesUnchanged(reviewedBefore, liveManifest);
  if (liveManifest.currentRecoveryProof?.status !== 'passed') {
    throw new Error('Current-schema restore proof is not passing.');
  }

  const livePlanById = mapById(liveManifest.cleanupPlan || []);
  const reviewedCanonicalIds = new Set((artifacts['retained-canonical-records-v3.json'].records || [])
    .map((record) => record.canonicalId));
  const recoveryIds = new Set(candidateArtifact.protectedRecoveryIds || []);
  const releaseIds = new Set(candidateArtifact.protectedReleaseIds || []);
  if (recoveryIds.size !== EXPECTED_RECOVERY_COUNT) {
    throw new Error(`Expected ${EXPECTED_RECOVERY_COUNT} protected recovery records; found ${recoveryIds.size}.`);
  }
  const liveRecoveryIds = new Set((liveManifest.cleanupPlan || [])
    .filter((item) => item.category === 'retain current recovery'
      || item.category === 'retain protected current release')
    .map((item) => item.id));
  if (liveRecoveryIds.size !== EXPECTED_RECOVERY_COUNT
    || [...recoveryIds].some((id) => !liveRecoveryIds.has(id))) {
    throw new Error('Protected current-recovery set drifted from the reviewed set.');
  }
  const liveReleaseIds = new Set((liveManifest.cleanupPlan || [])
    .filter((item) => item.releaseRelationship?.status === 'identified'
      || item.category === 'retain protected current release')
    .map((item) => item.id));
  [...releaseIds].forEach((id) => {
    if (!liveReleaseIds.has(id)) throw new Error(`Protected release drift detected for ${id}.`);
  });
  const revisionCount = (liveManifest.items || []).filter((item) => item.kind === 'revision').length;
  if (revisionCount !== EXPECTED_REVISION_COUNT) {
    throw new Error(`Expected ${EXPECTED_REVISION_COUNT} unresolved revisions; found ${revisionCount}.`);
  }
  const canonicalRecords = assertCanonicalGroups({ artifacts, liveManifest, candidateIds });
  const prepared = candidates.map((candidate) => {
    if (candidate.kind !== 'backup'
      || !candidate.executable
      || candidateIds.has(candidate.id) === false
      || reviewedCanonicalIds.has(candidate.id)
      || recoveryIds.has(candidate.id)
      || releaseIds.has(candidate.id)) {
      throw new Error(`Candidate protection conflict: ${candidate.id}`);
    }
    const live = livePlanById.get(candidate.id);
    if (!live || live.kind !== 'backup'
      || live.relativePath !== candidate.relativePath
      || live.sha256 !== candidate.sha256
      || Number(live.sizeBytes || 0) !== Number(candidate.sizeBytes || 0)
      || live.category !== 'review strongly inferred candidate') {
      throw new Error(`Candidate review drift detected for ${candidate.id}.`);
    }
    const sourcePath = resolveRepoPath(candidate.relativePath);
    if (!sourcePath.startsWith(`${path.resolve(repoRoot, 'dev-data/backups')}${path.sep}`)
      || !fs.existsSync(sourcePath)) {
      throw new Error(`Candidate file is missing or outside backup storage: ${candidate.relativePath}`);
    }
    const liveSize = fs.statSync(sourcePath).size;
    const liveChecksum = hashFile(sourcePath);
    if (liveSize !== Number(candidate.sizeBytes) || liveChecksum !== candidate.sha256) {
      throw new Error(`Candidate checksum or size drift detected for ${candidate.id}.`);
    }
    return { candidate, sourcePath };
  });
  if (prepared.length !== EXPECTED_CANDIDATE_COUNT) {
    throw new Error(`Prepared candidate count is ${prepared.length}; expected ${EXPECTED_CANDIDATE_COUNT}.`);
  }
  const newestCurrentId = candidateArtifact.newestCurrentId;
  if (!newestCurrentId || !recoveryIds.has(newestCurrentId)) {
    throw new Error('Newest valid current-schema backup is not in the protected recovery set.');
  }
  return {
    candidates,
    prepared,
    canonicalRecords,
    recoveryIds: [...recoveryIds].sort(),
    releaseIds: [...releaseIds].sort(),
    newestCurrentId,
    sourceHashes: sourceHashes(reviewedBefore),
    candidateBytes,
  };
}

function parseArgs(argv) {
  const value = (name, fallback = '') => {
    const index = argv.indexOf(name);
    return index >= 0 ? String(argv[index + 1] || '').trim() || fallback : fallback;
  };
  return {
    reviewDir: value('--review-dir', '/tmp/agf-retention-review-20260805-v4'),
    executionDir: value('--execution-dir', '/tmp/agf-retention-execution-20260805-v2'),
    actor: value('--actor'),
    reason: value('--reason'),
    policyVersion: value('--policy-version'),
    confirmation: value('--confirm'),
    execute: argv.includes('--execute'),
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function verifyAfter({ afterManifest, plan, artifacts }) {
  const backups = (afterManifest.items || []).filter((item) => item.kind === 'backup');
  const revisions = (afterManifest.items || []).filter((item) => item.kind === 'revision');
  const backupBytes = backups.reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  if (backups.length !== EXPECTED_AFTER_BACKUP_COUNT || backupBytes !== EXPECTED_AFTER_BACKUP_BYTES) {
    throw new Error(`Post-delete backup totals mismatch: ${backups.length} files, ${backupBytes} bytes.`);
  }
  if (revisions.length !== EXPECTED_REVISION_COUNT) {
    throw new Error('Post-delete unresolved revision count changed.');
  }
  if (afterManifest.currentRecoveryProof?.status !== 'passed') {
    throw new Error('Post-delete current-schema restore proof failed.');
  }
  const afterIds = new Set(backups.map((item) => item.id));
  plan.recoveryIds.forEach((id) => {
    if (!afterIds.has(id)) throw new Error(`Protected recovery backup missing after deletion: ${id}`);
  });
  const canonicalGroups = artifacts['duplicate-groups-v3.json'].groups || [];
  const afterItems = mapById(afterManifest.items);
  canonicalGroups.forEach((group) => {
    const canonical = afterItems.get(group.canonicalId);
    if (!canonical || canonical.sha256 !== group.canonicalSha256) {
      throw new Error(`Canonical record missing or changed after deletion: ${group.canonicalId}`);
    }
  });
  return {
    backups,
    revisions,
    backupBytes,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.execute) throw new Error('Deletion requires explicit --execute confirmation.');
  if (!args.actor || !args.reason || args.policyVersion !== '1.0'
    || args.confirmation !== 'DELETE_CORRECTED_71_BACKUPS') {
    throw new Error('Deletion requires actor, reason, policy version 1.0, and confirmation DELETE_CORRECTED_71_BACKUPS.');
  }
  const { artifacts } = loadReview(args.reviewDir);
  const liveManifest = await buildLiveManifest();
  const plan = preflight({ artifacts, liveManifest });
  const executionDir = path.resolve(args.executionDir);
  if (fs.existsSync(executionDir)) throw new Error(`Execution directory already exists: ${executionDir}`);
  fs.mkdirSync(executionDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const execution = {
    actor: args.actor,
    reason: args.reason,
    policyVersion: args.policyVersion,
    confirmation: args.confirmation,
    executionStartedAt: startedAt,
    candidateCount: plan.candidates.length,
    candidateBytes: plan.candidateBytes,
    mutationPerformed: false,
  };
  writeJson(path.join(executionDir, 'execution-before-manifest-v4.json'), {
    ...liveManifest,
    execution,
    validatedCandidates: plan.candidates,
    retainedCanonicalRecords: plan.canonicalRecords,
    sourceHashes: plan.sourceHashes,
  });

  plan.prepared.forEach(({ sourcePath }) => fs.unlinkSync(sourcePath));
  const afterManifest = await buildLiveManifest();
  const afterHashes = sourceHashes(afterManifest);
  if (JSON.stringify(plan.sourceHashes) !== JSON.stringify(afterHashes)) {
    throw new Error('Active, published, or seed hashes changed after deletion.');
  }
  const verification = verifyAfter({ afterManifest, plan, artifacts });
  const deletedPaths = plan.candidates.map((candidate) => ({
    id: candidate.id,
    relativePath: candidate.relativePath,
    sha256: candidate.sha256,
    sizeBytes: candidate.sizeBytes,
  }));
  const finishedAt = new Date().toISOString();
  const afterExecution = {
    ...afterManifest,
    execution: {
      ...execution,
      mutationPerformed: true,
      executionFinishedAt: finishedAt,
      deletedPaths,
      bytesReclaimed: plan.candidateBytes,
      retainedBackupPaths: verification.backups.map((item) => ({
        relativePath: item.relativePath,
        sha256: item.sha256,
        sizeBytes: item.sizeBytes,
      })),
      retainedCanonicalRecords: plan.canonicalRecords,
      unresolvedRevisionsRetained: verification.revisions.map((item) => ({ id: item.id, relativePath: item.relativePath, sha256: item.sha256 })),
      unresolvedRevisionCount: verification.revisions.length,
      sourceHashesBefore: plan.sourceHashes,
      sourceHashesAfter: afterHashes,
      newestCurrentId: plan.newestCurrentId,
    },
  };
  writeJson(path.join(executionDir, 'execution-after-manifest-v4.json'), afterExecution);
  console.log(JSON.stringify({
    status: 'deleted-corrected-retention-candidates',
    executionDir,
    deletedCount: deletedPaths.length,
    bytesReclaimed: plan.candidateBytes,
    backupCountBefore: liveManifest.summary.backupCount,
    backupBytesBefore: liveManifest.items.filter((item) => item.kind === 'backup').reduce((total, item) => total + Number(item.sizeBytes || 0), 0),
    backupCountAfter: verification.backups.length,
    backupBytesAfter: verification.backupBytes,
    unresolvedRevisionCount: verification.revisions.length,
    mutationPerformed: true,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Corrected retention deletion aborted: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
