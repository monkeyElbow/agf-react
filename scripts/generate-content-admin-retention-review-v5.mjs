#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRetentionManifest } from './content-admin-retention.mjs';
import { buildMigrationEvidenceMap, buildCorrectedDeletionReview } from '../src/lib/contentAdminRetentionEvidence.js';
import { inspectContentAdminAuthority } from '../dev-server/contentAdminAuthority.js';
import {
  buildRetentionDependencyFingerprints,
  buildRetentionPreflightRules,
  hashRetentionValue,
  RETENTION_CLASSIFICATION_ALGORITHM_VERSION,
  RETENTION_FINGERPRINT_VERSION,
} from '../src/lib/contentAdminRetentionFingerprints.js';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const inputDir = process.env.RETENTION_REVIEW_INPUT_DIR || '/tmp/agf-retention-review-20260805-v4';
const outputDir = process.env.RETENTION_V5_OUTPUT_DIR || '/tmp/agf-retention-review-20260805-v5';
const authorityLockFile = path.resolve(repoRoot, 'dev-data/content-admin-authority.lock');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readStable(filePath) {
  const before = fs.readFileSync(filePath);
  const after = fs.readFileSync(filePath);
  return {
    bytes: before,
    stable: hashRetentionValue(before.toString('utf8')) === hashRetentionValue(after.toString('utf8')),
  };
}

function writeOnce(fileName, value) {
  const filePath = path.join(outputDir, fileName);
  if (fs.existsSync(filePath)) throw new Error(`Refusing to overwrite review artifact: ${filePath}`);
  fs.writeFileSync(filePath, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function listenerPids(port = 5173) {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(/\s+/).filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

function authorityVerification() {
  const lease = inspectContentAdminAuthority(authorityLockFile);
  const listeners = listenerPids();
  return {
    lock: lease,
    listeners,
    verified: lease.status === 'owned' && lease.processAlive && listeners.length <= 1,
    reason: lease.status !== 'owned'
      ? 'content-admin authority lease is not owned by a running server'
      : listeners.length > 1
        ? 'more than one process is listening on the configured content-admin port'
        : 'single authority lease and listener verified',
  };
}

async function liveManifest() {
  const { runContentAdminMigrationInventory } = await import('./content-admin-migration-inventory.mjs');
  const migrationReport = runContentAdminMigrationInventory({ includeBackups: true });
  const migrationEvidenceByRecord = buildMigrationEvidenceMap(migrationReport);
  const migrationScanByRecord = Object.fromEntries(Object.entries(migrationEvidenceByRecord)
    .map(([key, value]) => [key, value.findings.length]));
  return buildRetentionManifest({ migrationReport, migrationEvidenceByRecord, migrationScanByRecord });
}

function loadV4Inputs() {
  const names = {
    before: 'before-manifest-v3.json',
    candidates: 'corrected-delete-candidates-v3.json',
    canonical: 'retained-canonical-records-v3.json',
    groups: 'duplicate-groups-v3.json',
    cleanup: 'dry-run-cleanup-plan-v3.json',
  };
  return Object.fromEntries(Object.entries(names).map(([key, name]) => {
    const filePath = path.join(inputDir, name);
    if (!fs.existsSync(filePath)) throw new Error(`Missing v4 input: ${filePath}`);
    return [key, readJson(filePath)];
  }));
}

function recordsByIds(manifest, ids) {
  const wanted = new Set(ids || []);
  return manifest.items.filter((item) => wanted.has(item.id));
}

function routeDependencyMap(candidates) {
  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    path: candidate.relativePath,
    routeScope: [...(candidate.routeScope || [])].sort(),
    publishedDependencies: [],
    dependsOnTestRoute: false,
    rationale: 'Deletion safety is established from immutable candidate, canonical, recovery, release, and restore-proof records; current published content is not an input.',
    schemaStatus: candidate.schemaStatus,
    migrationFindings: candidate.migrationFindingCount,
    duplicateGroupId: candidate.duplicateGroupId || null,
    recoveryRelationship: candidate.restoreEligibility,
    protectedReleaseRelationship: candidate.releaseRelationship || null,
  }));
}

function buildCleanupPlan(manifest, review, authority) {
  const candidateIds = new Set(review.candidates.map((item) => item.id));
  return manifest.cleanupPlan.map((item) => ({
    ...item,
    executable: authority.verified && candidateIds.has(item.id),
    reviewAction: candidateIds.has(item.id) ? 'delete-reviewed-candidate' : 'retain-protected-or-hold',
    authorityRequired: true,
  }));
}

async function main() {
  if (fs.existsSync(outputDir)) throw new Error(`Refusing to overwrite existing output directory: ${outputDir}`);
  const inputs = loadV4Inputs();
  const authority = authorityVerification();
  const sharedPath = path.resolve(repoRoot, 'dev-data/content-admin-shared.json');
  const seedPath = path.resolve(repoRoot, 'dev-data/content-admin-seed-baseline.json');
  const sharedBefore = readStable(sharedPath);
  const seedBefore = readStable(seedPath);
  const manifest = await liveManifest();
  const sharedAfter = readStable(sharedPath);
  const seedAfter = readStable(seedPath);
  if (!sharedBefore.stable || !sharedAfter.stable || !seedBefore.stable || !seedAfter.stable) {
    throw new Error('Retention review failed closed because active or seed input changed during capture.');
  }
  const review = buildCorrectedDeletionReview({
    sourceManifest: manifest,
    reviewedPlan: inputs.cleanup.items,
    reviewedBeforeManifest: inputs.before,
    reviewedMetadata: [
      ...(inputs.candidates.candidates || []),
      ...(inputs.candidates.excludedCanonical || []),
    ],
    reviewedDuplicateGroups: inputs.groups.groups,
    reviewedRestoreRecords: inputs.cleanup.items,
  });
  const canonicalRecords = review.canonicalRecords;
  const recoveryRecords = recordsByIds(manifest, review.protectedRecoveryIds);
  const releaseRecords = recordsByIds(manifest, review.protectedReleaseIds);
  const routeDependencies = routeDependencyMap(review.candidates);
  const publishedRoutes = [];
  const fingerprints = buildRetentionDependencyFingerprints({
    candidates: review.candidates,
    canonicalRecords: canonicalRecords.map((record) => ({
      id: record.canonicalId,
      relativePath: record.canonicalPath,
      sha256: record.canonicalSha256,
      sizeBytes: record.canonicalSizeBytes,
      duplicateGroupId: record.groupId,
    })),
    recoveryRecords,
    protectedReleaseRecords: releaseRecords,
    restoreProof: manifest.restoreSamples,
    policy: manifest.policy,
    publishedBaseSnapshot: JSON.parse(fs.readFileSync(sharedPath, 'utf8')).baseSnapshot,
    relevantPublishedRoutes: publishedRoutes,
    schemaVersion: manifest.policy.currentSchemaVersion,
    migrationDetectorVersion: manifest.migrationInventory.length,
  });
  const cleanupPlan = buildCleanupPlan(manifest, review, authority);
  const beforeBackupBytes = manifest.items.filter((item) => item.kind === 'backup')
    .reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  const beforeRevisionBytes = manifest.items.filter((item) => item.kind === 'revision')
    .reduce((total, item) => total + Number(item.sizeBytes || 0), 0);
  const reviewStatus = authority.verified ? 'ready-for-independent-deletion-approval' : 'blocked-authority-not-stabilized';
  fs.mkdirSync(outputDir, { recursive: true });
  const files = {
    beforeManifest: writeOnce('before-manifest-v4.json', {
      ...manifest,
      reviewVersion: 4,
      reviewStatus,
      authorityVerification: authority,
      dependencyFingerprints: fingerprints,
      mutationPerformed: false,
    }),
    correctedCandidates: writeOnce('corrected-delete-candidates-v4.json', {
      reviewVersion: 4,
      reviewStatus,
      candidateCount: review.candidateCount,
      candidateBytes: review.candidateBytes,
      candidates: review.candidates.map((candidate) => ({
        ...candidate,
        publishedDependencies: [],
        dependsOnTestRoute: false,
      })),
      mutationPerformed: false,
    }),
    retainedCanonical: writeOnce('retained-canonical-records-v4.json', {
      reviewVersion: 4,
      records: canonicalRecords,
      mutationPerformed: false,
    }),
    retainedRecovery: writeOnce('retained-recovery-records-v4.json', {
      reviewVersion: 4,
      records: recoveryRecords,
      mutationPerformed: false,
    }),
    protectedRelease: writeOnce('protected-release-records-v4.json', {
      reviewVersion: 4,
      records: releaseRecords,
      mutationPerformed: false,
    }),
    routeDependencies: writeOnce('route-dependency-map-v1.json', {
      version: 1,
      routesWithPublishedDependencies: publishedRoutes,
      candidates: routeDependencies,
      mutationPerformed: false,
    }),
    publishedFingerprints: writeOnce('published-route-fingerprints-v1.json', {
      ...fingerprints.routeScopedPublished,
      excludedUnrelatedRoutes: [...new Set(manifest.items.find((item) => item.kind === 'published')?.routeScope || [])]
        .filter((route) => !publishedRoutes.includes(route)).sort(),
      mutationPerformed: false,
    }),
    restoreProof: writeOnce('restore-proof-v1.json', {
      ...manifest.restoreSamples,
      fingerprint: fingerprints.restoreProof,
      mutationPerformed: false,
    }),
    runtimeSafety: writeOnce('runtime-safety-fingerprint-v1.json', {
      ...fingerprints.runtimeSafety,
      fingerprintVersion: RETENTION_FINGERPRINT_VERSION,
      classificationAlgorithmVersion: RETENTION_CLASSIFICATION_ALGORITHM_VERSION,
      mutationPerformed: false,
    }),
    cleanupPlan: writeOnce('dry-run-cleanup-plan-v4.json', {
      reviewVersion: 4,
      reviewStatus,
      items: cleanupPlan,
      dependencyFingerprints: fingerprints,
      mutationPerformed: false,
    }),
    projectedStorage: writeOnce('projected-after-storage-v4.json', {
      reviewVersion: 4,
      reviewStatus,
      before: {
        backupCount: manifest.summary.backupCount,
        backupBytes: beforeBackupBytes,
        revisionCount: manifest.summary.revisionCount,
        revisionBytes: beforeRevisionBytes,
      },
      deletion: { candidateCount: review.candidateCount, candidateBytes: review.candidateBytes },
      projectedAfter: {
        backupCount: manifest.summary.backupCount - review.candidateCount,
        backupBytes: beforeBackupBytes - review.candidateBytes,
        revisionCount: manifest.summary.revisionCount,
        revisionBytes: beforeRevisionBytes,
      },
      mutationPerformed: false,
    }),
    invalidationRules: writeOnce('preflight-invalidation-rules-v1.md', [
      '# Retention preflight invalidation rules',
      '',
      'This review is invalidated only when a dependency fingerprint changes.',
      '',
      '## Invalidating changes',
      ...buildRetentionPreflightRules().invalidates.map((rule) => `- ${rule}`),
      '',
      '## Non-invalidating changes',
      ...buildRetentionPreflightRules().doesNotInvalidate.map((rule) => `- ${rule}`),
      '',
      `Fingerprint version: ${RETENTION_FINGERPRINT_VERSION}`,
      `Classification algorithm version: ${RETENTION_CLASSIFICATION_ALGORITHM_VERSION}`,
      `Review status: ${reviewStatus}`,
    ].join('\n') + '\n'),
  };
  console.log(JSON.stringify({
    status: reviewStatus,
    candidateCount: review.candidateCount,
    candidateBytes: review.candidateBytes,
    canonicalCount: canonicalRecords.length,
    recoveryCount: recoveryRecords.length,
    protectedReleaseCount: releaseRecords.length,
    authority,
    files,
    mutationPerformed: false,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Retention v5 review failed closed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
