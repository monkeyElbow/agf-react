#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRetentionManifest } from './content-admin-retention.mjs';
import { buildMigrationEvidenceMap, buildCorrectedDeletionReview } from '../src/lib/contentAdminRetentionEvidence.js';

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_INPUT_DIR = '/tmp/agf-retention-review-20260805-v3';
const DEFAULT_OUTPUT_DIR = '/tmp/agf-retention-review-20260805-v4';
const INPUT_FILES = Object.freeze({
  before: 'before-manifest-v2.json',
  metadata: 'metadata-resolution-v2.json',
  duplicates: 'duplicate-groups-v2.json',
  restore: 'restore-eligibility-v2.json',
  cleanup: 'dry-run-cleanup-plan-v2.json',
  hold: 'remaining-unknown-hold-v2.json',
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadInputs(inputDir) {
  const directory = path.resolve(inputDir);
  return Object.fromEntries(Object.entries(INPUT_FILES).map(([key, fileName]) => {
    const filePath = path.join(directory, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Missing required review artifact: ${filePath}`);
    return [key, readJson(filePath)];
  }));
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

function writeOnce(directory, fileName, value) {
  const filePath = path.join(directory, fileName);
  if (fs.existsSync(filePath)) throw new Error(`Refusing to overwrite review artifact: ${filePath}`);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function buildCleanupPlan(manifest, review) {
  const candidateIds = new Set(review.candidates.map((item) => item.id));
  const canonicalIds = new Set(review.excludedCanonical.map((item) => item.id));
  return manifest.cleanupPlan.map((item) => {
    if (candidateIds.has(item.id)) {
      const candidate = review.candidates.find((entry) => entry.id === item.id);
      return {
        ...item,
        correctedAction: 'delete-reviewed-candidate',
        executable: true,
        deletionRationale: candidate.deletionRationale,
        retainedCanonicalPath: candidate.retainedCanonicalPath,
      };
    }
    if (canonicalIds.has(item.id)) {
      const canonical = review.excludedCanonical.find((entry) => entry.id === item.id);
      return {
        ...item,
        correctedAction: 'retain-protected-canonical',
        executable: false,
        exclusionReasons: canonical.exclusionReasons,
        retainedCanonicalPath: canonical.relativePath,
      };
    }
    return {
      ...item,
      correctedAction: item.kind === 'revision' || item.category === 'unknown/hold'
        ? 'retain-unknown-hold'
        : 'retain-protected',
      executable: false,
    };
  });
}

function buildProjectedStorage(manifest, review) {
  const backups = manifest.items.filter((item) => item.kind === 'backup');
  const revisions = manifest.items.filter((item) => item.kind === 'revision');
  const beforeBackupBytes = backups.reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  const beforeRevisionBytes = revisions.reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  return {
    generatedAt: Date.now(),
    mutationPerformed: false,
    before: {
      backupCount: backups.length,
      backupBytes: beforeBackupBytes,
      revisionCount: revisions.length,
      revisionBytes: beforeRevisionBytes,
    },
    deletion: {
      candidateCount: review.candidateCount,
      candidateBytes: review.candidateBytes,
      unresolvedRevisionCount: revisions.length,
    },
    projectedAfter: {
      backupCount: backups.length - review.candidateCount,
      backupBytes: beforeBackupBytes - review.candidateBytes,
      revisionCount: revisions.length,
      revisionBytes: beforeRevisionBytes,
    },
    protectedCurrentRecoveryIds: review.protectedRecoveryIds,
    protectedReleaseIds: review.protectedReleaseIds,
    activePublishedSeedHashes: manifest.items
      .filter((item) => ['active', 'published', 'seed'].includes(item.kind))
      .map((item) => ({ kind: item.kind, relativePath: item.relativePath, sha256: item.sha256 })),
  };
}

async function main() {
  const inputDir = process.argv[2] || DEFAULT_INPUT_DIR;
  const outputDir = process.argv[3] || DEFAULT_OUTPUT_DIR;
  const inputs = loadInputs(inputDir);
  const manifest = await buildLiveManifest();
  const review = buildCorrectedDeletionReview({
    sourceManifest: manifest,
    reviewedPlan: inputs.cleanup.items,
    reviewedBeforeManifest: inputs.before,
    reviewedMetadata: inputs.metadata.items,
    reviewedDuplicateGroups: inputs.duplicates.groups,
    reviewedRestoreRecords: inputs.restore.records,
  });
  if (fs.existsSync(outputDir)) throw new Error(`Refusing to overwrite existing output directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const cleanupPlan = buildCleanupPlan(manifest, review);
  const files = {
    beforeManifest: writeOnce(outputDir, 'before-manifest-v3.json', {
      ...manifest,
      reviewVersion: 3,
      reviewSource: path.resolve(inputDir),
      mutationPerformed: false,
    }),
    correctedCandidates: writeOnce(outputDir, 'corrected-delete-candidates-v3.json', {
      reviewVersion: 3,
      generatedAt: Date.now(),
      sourceCandidateCount: review.sourceCandidateCount,
      reviewedCandidateCount: review.reviewedCandidateCount,
      canonicalConflictCount: review.canonicalConflictCount,
      candidateCount: review.candidateCount,
      candidateBytes: review.candidateBytes,
      candidates: review.candidates,
      excludedCanonical: review.excludedCanonical,
      protectedRecoveryIds: review.protectedRecoveryIds,
      protectedReleaseIds: review.protectedReleaseIds,
      newestCurrentId: review.newestCurrentId,
      restoreSampleIds: review.restoreSampleIds,
      mutationPerformed: false,
    }),
    retainedCanonical: writeOnce(outputDir, 'retained-canonical-records-v3.json', {
      reviewVersion: 3,
      generatedAt: Date.now(),
      records: review.canonicalRecords,
      mutationPerformed: false,
    }),
    duplicateGroups: writeOnce(outputDir, 'duplicate-groups-v3.json', {
      reviewVersion: 3,
      generatedAt: Date.now(),
      groups: review.canonicalRecords,
      mutationPerformed: false,
    }),
    cleanupPlan: writeOnce(outputDir, 'dry-run-cleanup-plan-v3.json', {
      reviewVersion: 3,
      generatedAt: Date.now(),
      currentRecoveryProof: manifest.currentRecoveryProof,
      items: cleanupPlan,
      mutationPerformed: false,
    }),
    projectedStorage: writeOnce(outputDir, 'projected-after-storage-v3.json', buildProjectedStorage(manifest, review)),
  };
  console.log(JSON.stringify({
    status: 'corrected-review-generated',
    candidateCount: review.candidateCount,
    candidateBytes: review.candidateBytes,
    canonicalConflictCount: review.canonicalConflictCount,
    unresolvedRevisionCount: manifest.items.filter((item) => item.kind === 'revision').length,
    files,
    mutationPerformed: false,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Corrected retention review failed closed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
