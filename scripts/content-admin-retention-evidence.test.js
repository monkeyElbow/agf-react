import { describe, expect, it } from 'vitest';
import {
  buildCorrectedDeletionReview,
  buildRetentionDuplicateGroups,
  resolveRetentionEvidence,
  resolveRetentionRecords,
} from '../src/lib/contentAdminRetentionEvidence.js';

function backup(overrides = {}) {
  return {
    id: 'backup:record.json',
    kind: 'backup',
    relativePath: 'dev-data/backups/record.json',
    fileName: 'record.json',
    sha256: 'a'.repeat(64),
    contentSha256: 'b'.repeat(64),
    sizeBytes: 100,
    schemaVersion: 1,
    currentSchema: true,
    restoreEligibility: 'eligible',
    migrationFindingCount: 0,
    migrationAdapters: [],
    routeScope: ['/services/loans'],
    metadata: {
      createdAt: 1710000000000,
      reason: 'before-publish',
    },
    ...overrides,
  };
}

describe('content-admin retention evidence resolution', () => {
  it('does not turn filename or filesystem-style evidence into an executable candidate', () => {
    const evidence = resolveRetentionEvidence({
      id: 'backup:old.json',
      kind: 'backup',
      fileName: 'content-admin-shared-20260721-111008.json',
      schemaVersion: 1,
      restoreEligibility: 'ineligible',
      metadata: {},
    });

    expect(evidence.confidence).toBe('weakly-inferred');
    const result = resolveRetentionRecords([{
      id: 'backup:old.json',
      kind: 'backup',
      fileName: 'content-admin-shared-20260721-111008.json',
      relativePath: 'dev-data/backups/old.json',
      sha256: 'a'.repeat(64),
      schemaVersion: 1,
      restoreEligibility: 'ineligible',
      migrationFindingCount: 1,
      migrationAdapters: ['retired-shape'],
      metadata: {},
    }]);
    expect(result.resolutions[0]).toMatchObject({ category: 'unknown/hold', executable: false });
  });

  it('keeps missing schema metadata on hold even when a route is known', () => {
    const result = resolveRetentionRecords([backup({ schemaVersion: null, metadata: { createdAt: 1710000000000, reason: 'old' } })]);
    expect(result.resolutions[0]).toMatchObject({ category: 'unknown/hold', executable: false });
    expect(result.resolutions[0].shapeStatus).toBe('unresolved');
  });

  it('separates strongly inferred obsolete candidates from executable candidates', () => {
    const result = resolveRetentionRecords([backup({
      migrationFindingCount: 1,
      migrationAdapters: ['generosity-fund-donor-advised-fund-refresh'],
    })]);
    expect(result.resolutions[0]).toMatchObject({
      category: 'review strongly inferred candidate',
      executable: false,
      shapeStatus: 'historical known shape',
    });
  });

  it('does not delete the canonical member of a duplicate group', () => {
    const members = [
      backup({ id: 'backup:new.json', relativePath: 'dev-data/backups/new.json', createdAt: 1710000002000 }),
      backup({ id: 'backup:old.json', relativePath: 'dev-data/backups/old.json', createdAt: 1710000001000 }),
    ];
    const groups = buildRetentionDuplicateGroups(members);
    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.type === 'snapshot-payload')).toMatchObject({
      canonicalCandidate: 'backup:new.json',
      protected: true,
    });
  });

  it('preserves current-schema recovery records and is deterministic', () => {
    const members = [backup({ id: 'backup:one.json' }), backup({
      id: 'backup:two.json',
      relativePath: 'dev-data/backups/two.json',
      sha256: 'c'.repeat(64),
      contentSha256: 'd'.repeat(64),
      createdAt: 1710000001000,
    })];
    const options = { currentSchemaVersion: 1, protectedCurrentIds: new Set() };
    const first = resolveRetentionRecords(members, options);
    const second = resolveRetentionRecords(members, options);
    expect(first).toEqual(second);
    expect(first.resolutions.every((item) => item.category === 'retain current recovery')).toBe(true);
  });

  it('keeps corrupt records on hold rather than silently deleting them', () => {
    const result = resolveRetentionRecords([backup({
      restoreEligibility: 'ineligible',
      migrationFindingCount: 0,
      metadata: {},
    })]);
    expect(result.resolutions[0]).toMatchObject({ category: 'unknown/hold', executable: false });
  });

  it('never puts a canonical duplicate into the corrected executable deletion set', () => {
    const canonical = backup({ id: 'backup:canonical.json', relativePath: 'dev-data/backups/canonical.json' });
    const candidate = backup({
      id: 'backup:duplicate.json',
      relativePath: 'dev-data/backups/duplicate.json',
      sha256: 'c'.repeat(64),
      createdAt: 1710000001000,
      migrationFindingCount: 1,
      migrationAdapters: ['retired-shape'],
    });
    const sourcePlan = [
      { ...canonical, category: 'review strongly inferred candidate', schemaStatus: 'historical known shape' },
      { ...candidate, category: 'review strongly inferred candidate', schemaStatus: 'historical known shape' },
    ];
    const manifest = {
      policy: { currentSchemaVersion: 1 },
      items: [canonical, candidate],
      cleanupPlan: sourcePlan,
      duplicateGroups: [{
        groupId: 'duplicate:content:payload',
        type: 'snapshot-payload',
        checksum: candidate.contentSha256,
        canonicalCandidate: canonical.id,
        canonicalReason: 'deterministic newest valid record, pending review',
        members: [canonical, candidate],
        protected: false,
      }],
      restoreSamples: { samples: [] },
      currentRecoveryProof: { status: 'passed' },
    };
    const artifacts = {
      reviewedPlan: sourcePlan,
      reviewedBeforeManifest: { items: sourcePlan },
      reviewedMetadata: sourcePlan,
      reviewedRestoreRecords: sourcePlan,
    };
    const review = buildCorrectedDeletionReview({ sourceManifest: manifest, ...artifacts });
    expect(review.canonicalConflictCount).toBe(1);
    expect(review.candidates.map((item) => item.id)).toEqual([candidate.id]);
    expect(review.excludedCanonical.map((item) => item.id)).toEqual([canonical.id]);
    expect(review.canonicalRecords[0]).toMatchObject({
      canonicalId: canonical.id,
      retained: true,
      checksumStatus: 'verified against live source manifest',
    });
  });

  it('keeps protected recovery and release records out of corrected candidates', () => {
    const recovery = backup({ id: 'backup:recovery.json', relativePath: 'dev-data/backups/recovery.json' });
    const release = backup({
      id: 'backup:release.json',
      relativePath: 'dev-data/backups/release.json',
      metadata: { createdAt: 1710000000000, reason: 'release', releaseId: 'release-1' },
    });
    const candidate = backup({
      id: 'backup:candidate.json',
      relativePath: 'dev-data/backups/candidate.json',
      sha256: 'c'.repeat(64),
      migrationFindingCount: 1,
      migrationAdapters: ['retired-shape'],
    });
    const plan = [
      { ...recovery, category: 'retain current recovery' },
      { ...release, category: 'review strongly inferred candidate', releaseRelationship: { status: 'identified', value: 'release-1' } },
      { ...candidate, category: 'review strongly inferred candidate', schemaStatus: 'historical known shape' },
    ];
    const manifest = {
      policy: { currentSchemaVersion: 1 },
      items: [recovery, release, candidate],
      cleanupPlan: plan,
      duplicateGroups: [],
      restoreSamples: { samples: [] },
      currentRecoveryProof: { status: 'passed' },
    };
    const review = buildCorrectedDeletionReview({
      sourceManifest: manifest,
      reviewedPlan: plan.filter((item) => item.category === 'review strongly inferred candidate'),
      reviewedBeforeManifest: { items: plan },
      reviewedMetadata: plan,
      reviewedRestoreRecords: plan,
    });
    expect(review.candidates.map((item) => item.id)).toEqual([candidate.id]);
    expect(review.protectedRecoveryIds).toContain(recovery.id);
    expect(review.protectedReleaseIds).toContain(release.id);
  });

  it('is deterministic and fails closed on stale checksums', () => {
    const candidate = backup({
      id: 'backup:candidate.json',
      relativePath: 'dev-data/backups/candidate.json',
      migrationFindingCount: 1,
      migrationAdapters: ['retired-shape'],
    });
    const plan = [{ ...candidate, category: 'review strongly inferred candidate', schemaStatus: 'historical known shape' }];
    const manifest = {
      policy: { currentSchemaVersion: 1 },
      items: [candidate],
      cleanupPlan: plan,
      duplicateGroups: [],
      restoreSamples: { samples: [] },
      currentRecoveryProof: { status: 'passed' },
    };
    const args = {
      sourceManifest: manifest,
      reviewedPlan: plan,
      reviewedBeforeManifest: { items: plan },
      reviewedMetadata: plan,
      reviewedRestoreRecords: plan,
    };
    expect(buildCorrectedDeletionReview(args)).toEqual(buildCorrectedDeletionReview(args));
    expect(() => buildCorrectedDeletionReview({
      ...args,
      reviewedPlan: [{ ...plan[0], sha256: 'd'.repeat(64) }],
    })).toThrow(/stale or incomplete/);
  });
});
