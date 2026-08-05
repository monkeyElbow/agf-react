#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMigrationEvidenceMap,
} from '../src/lib/contentAdminRetentionEvidence.js';
import { buildRetentionManifest } from './content-admin-retention.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const EXPECTED_CANDIDATE_COUNT = 87;
const REQUIRED_ARTIFACTS = Object.freeze([
  'before-manifest-v2.json',
  'metadata-resolution-v2.json',
  'duplicate-groups-v2.json',
  'restore-eligibility-v2.json',
  'dry-run-cleanup-plan-v2.json',
  'remaining-unknown-hold-v2.json',
]);

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveRepoPath(relativePath) {
  const resolved = path.resolve(repoRoot, relativePath);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function snapshotSourceHashes(manifest) {
  return Object.fromEntries(manifest.items
    .filter((item) => ['active', 'published', 'seed'].includes(item.kind))
    .map((item) => [item.kind, item.sha256]));
}

function loadReviewArtifacts(reviewDir) {
  const directory = path.resolve(reviewDir);
  const artifacts = Object.fromEntries(REQUIRED_ARTIFACTS.map((fileName) => {
    const filePath = path.join(directory, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Missing required review artifact: ${filePath}`);
    return [fileName, readJson(filePath)];
  }));
  return { directory, artifacts };
}

async function buildFreshManifest() {
  const { runContentAdminMigrationInventory } = await import('./content-admin-migration-inventory.mjs');
  const report = runContentAdminMigrationInventory({ includeBackups: true });
  const migrationEvidenceByRecord = buildMigrationEvidenceMap(report);
  const migrationScanByRecord = Object.fromEntries(Object.entries(migrationEvidenceByRecord)
    .map(([key, value]) => [key, value.findings.length]));
  const manifest = buildRetentionManifest({
    migrationReport: report,
    migrationEvidenceByRecord,
    migrationScanByRecord,
  });
  return { manifest, migrationEvidenceByRecord, report };
}

function mapById(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function preflight({ artifacts, manifest, expectedCount = EXPECTED_CANDIDATE_COUNT }) {
  const reviewedPlan = artifacts['dry-run-cleanup-plan-v2.json']?.items || [];
  const reviewedCandidates = reviewedPlan.filter((item) => item.category === 'review strongly inferred candidate');
  if (reviewedCandidates.length !== expectedCount) {
    throw new Error(`Candidate count is ${reviewedCandidates.length}; expected exactly ${expectedCount}.`);
  }
  if (reviewedCandidates.some((item) => item.kind !== 'backup')) {
    throw new Error('Reviewed candidate set contains a non-backup record.');
  }
  const freshById = mapById(manifest.cleanupPlan);
  const beforeById = mapById(artifacts['before-manifest-v2.json'].items);
  const metadataById = mapById(artifacts['metadata-resolution-v2.json'].items);
  const duplicateGroups = artifacts['duplicate-groups-v2.json'].groups || [];
  const duplicateById = new Map();
  duplicateGroups.forEach((group) => (group.members || []).forEach((member) => duplicateById.set(member.id, group)));
  const protectedCurrentIds = new Set(manifest.cleanupPlan
    .filter((item) => item.category === 'retain current recovery' || item.category === 'retain protected current release')
    .map((item) => item.id));
  const canonicalConflicts = [];
  const protectedConflicts = [];
  const checksumConflicts = [];
  const missingConflicts = [];
  const releaseConflicts = [];
  reviewedCandidates.forEach((reviewed) => {
    const fresh = freshById.get(reviewed.id);
    const before = beforeById.get(reviewed.id);
    const metadata = metadataById.get(reviewed.id);
    const group = duplicateById.get(reviewed.id);
    if (!fresh || !before || !metadata) missingConflicts.push(reviewed.id);
    if (fresh?.relativePath !== reviewed.relativePath || before?.relativePath !== reviewed.relativePath) {
      missingConflicts.push(`${reviewed.id}:path`);
    }
    if (fresh?.sha256 !== reviewed.sha256 || before?.sha256 !== reviewed.sha256 || metadata?.sha256 !== reviewed.sha256) {
      checksumConflicts.push(reviewed.id);
    }
    if (protectedCurrentIds.has(reviewed.id)) protectedConflicts.push(`${reviewed.id}:current-recovery`);
    if (group?.canonicalCandidate === reviewed.id) canonicalConflicts.push(reviewed.id);
    if (group?.protected && group?.canonicalCandidate === reviewed.id) protectedConflicts.push(`${reviewed.id}:protected-canonical`);
    if (reviewed.releaseRelationship?.status === 'identified' || fresh?.releaseRelationship?.status === 'identified') {
      releaseConflicts.push(reviewed.id);
    }
    const sourcePath = resolveRepoPath(reviewed.relativePath);
    if (!sourcePath.startsWith(`${path.resolve(repoRoot, 'dev-data/backups')}${path.sep}`)) {
      missingConflicts.push(`${reviewed.id}:not-backup-path`);
    }
    if (!fs.existsSync(sourcePath) || hashFile(sourcePath) !== reviewed.sha256) {
      checksumConflicts.push(`${reviewed.id}:live-checksum`);
    }
  });
  if (canonicalConflicts.length) throw new Error(`Preflight rejected ${canonicalConflicts.length} canonical duplicate records: ${canonicalConflicts.slice(0, 5).join(', ')}`);
  if (protectedConflicts.length) throw new Error(`Preflight rejected protected records: ${protectedConflicts.slice(0, 5).join(', ')}`);
  if (checksumConflicts.length) throw new Error(`Preflight rejected checksum conflicts: ${checksumConflicts.slice(0, 5).join(', ')}`);
  if (missingConflicts.length) throw new Error(`Preflight rejected missing or invalid reviewed records: ${missingConflicts.slice(0, 5).join(', ')}`);
  if (releaseConflicts.length) throw new Error(`Preflight rejected protected release records: ${releaseConflicts.slice(0, 5).join(', ')}`);
  if (protectedCurrentIds.size !== 13) throw new Error(`Preflight expected 13 retained current-recovery records; found ${protectedCurrentIds.size}.`);
  const unresolvedRevisionCount = (manifest.cleanupPlan || []).filter((item) => item.kind === 'revision').length;
  if (unresolvedRevisionCount !== 163) throw new Error(`Preflight expected 163 unresolved revisions; found ${unresolvedRevisionCount}.`);
  const newestCurrent = [...manifest.items]
    .filter((item) => item.kind === 'backup' && protectedCurrentIds.has(item.id))
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
  if (!newestCurrent || !fs.existsSync(resolveRepoPath(newestCurrent.relativePath))) {
    throw new Error('Preflight could not verify the newest valid current-schema backup.');
  }
  const deletedByteCount = reviewedCandidates.reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  return {
    reviewedCandidates,
    protectedCurrentIds: [...protectedCurrentIds],
    deletedByteCount,
    sourceHashes: snapshotSourceHashes(manifest),
    newestCurrentId: newestCurrent.id,
  };
}

function parseArgs(argv) {
  const value = (name, fallback = '') => {
    const index = argv.indexOf(name);
    return index >= 0 ? String(argv[index + 1] || '').trim() || fallback : fallback;
  };
  return {
    reviewDir: value('--review-dir', '/tmp/agf-retention-review-20260805-v3'),
    executionDir: value('--execution-dir', '/tmp/agf-retention-execution-20260805-v1'),
    actor: value('--actor'),
    reason: value('--reason'),
    policyVersion: value('--policy-version'),
    confirmation: value('--confirm'),
    execute: argv.includes('--execute'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.actor || !args.reason || args.policyVersion !== '1.0' || args.confirmation !== 'DELETE_REVIEWED_87_BACKUPS') {
    throw new Error('Reviewed deletion requires actor, reason, policy version 1.0, and confirmation DELETE_REVIEWED_87_BACKUPS.');
  }
  const { artifacts } = loadReviewArtifacts(args.reviewDir);
  const { manifest } = await buildFreshManifest();
  const plan = preflight({ artifacts, manifest });
  if (!args.execute) {
    console.log(JSON.stringify({ status: 'preflight-passed', candidateCount: plan.reviewedCandidates.length, deletedByteCount: plan.deletedByteCount }, null, 2));
    return;
  }
  const executionDir = path.resolve(args.executionDir);
  if (fs.existsSync(executionDir)) throw new Error(`Execution directory already exists and will not be overwritten: ${executionDir}`);
  fs.mkdirSync(executionDir, { recursive: true });
  const execution = {
    actor: args.actor,
    reason: args.reason,
    policyVersion: args.policyVersion,
    confirmation: args.confirmation,
    executionStartedAt: new Date().toISOString(),
    candidateCount: plan.reviewedCandidates.length,
    deletedByteCount: plan.deletedByteCount,
  };
  fs.writeFileSync(path.join(executionDir, 'before-manifest-v3.json'), `${JSON.stringify({ ...manifest, execution }, null, 2)}\n`);
  plan.reviewedCandidates.forEach((candidate) => fs.unlinkSync(resolveRepoPath(candidate.relativePath)));
  const { manifest: afterManifest } = await buildFreshManifest();
  const afterSourceHashes = snapshotSourceHashes(afterManifest);
  if (JSON.stringify(plan.sourceHashes) !== JSON.stringify(afterSourceHashes)) {
    throw new Error('Post-delete source hash mismatch: active, published, or seed changed.');
  }
  if (afterManifest.currentRecoveryProof.status !== 'passed') {
    throw new Error('Post-delete current-schema recovery proof failed.');
  }
  if (!plan.protectedCurrentIds.every((id) => afterManifest.items.some((item) => item.id === id))) {
    throw new Error('Post-delete retained current-recovery record verification failed.');
  }
  const deletedPaths = plan.reviewedCandidates.map((item) => ({
    id: item.id,
    relativePath: item.relativePath,
    sha256: item.sha256,
    sizeBytes: item.sizeBytes,
  }));
  const report = {
    ...afterManifest,
    execution: {
      ...execution,
      executionFinishedAt: new Date().toISOString(),
      deletedPaths,
      retainedProtectedRecords: plan.protectedCurrentIds,
      unresolvedRevisionCount: afterManifest.items.filter((item) => item.kind === 'revision').length,
      beforeBackupCount: manifest.items.filter((item) => item.kind === 'backup').length,
      afterBackupCount: afterManifest.items.filter((item) => item.kind === 'backup').length,
      beforeRevisionCount: manifest.items.filter((item) => item.kind === 'revision').length,
      afterRevisionCount: afterManifest.items.filter((item) => item.kind === 'revision').length,
      newestCurrentId: plan.newestCurrentId,
    },
  };
  fs.writeFileSync(path.join(executionDir, 'after-manifest-v3.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    status: 'deleted-reviewed-backups',
    executionDir,
    deletedCount: deletedPaths.length,
    deletedByteCount: plan.deletedByteCount,
    beforeBackupCount: execution.beforeBackupCount,
    afterBackupCount: execution.afterBackupCount,
    unresolvedRevisionCount: execution.unresolvedRevisionCount,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Reviewed deletion aborted: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
