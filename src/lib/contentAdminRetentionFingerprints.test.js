import { describe, expect, it } from 'vitest';
import {
  buildPublishedRouteFingerprint,
  buildRetentionDependencyFingerprints,
} from './contentAdminRetentionFingerprints';

function baseInputs(overrides = {}) {
  return {
    candidates: [{ id: 'candidate-a', relativePath: 'a.json', sha256: 'a', sizeBytes: 10 }],
    canonicalRecords: [{ id: 'canonical-a', relativePath: 'canonical.json', sha256: 'c', sizeBytes: 20, duplicateGroupId: 'group-a' }],
    recoveryRecords: [{ id: 'recovery-a', relativePath: 'recovery.json', sha256: 'r', sizeBytes: 30, restoreEligibility: 'eligible' }],
    protectedReleaseRecords: [],
    restoreProof: { status: 'passed', samples: [{ id: 'recovery-a', status: 'passed' }] },
    policy: { policyVersion: '1.0' },
    publishedBaseSnapshot: {
      pageHierarchy: { '/relevant': { path: '/relevant', title: 'Relevant' } },
      blocksByPath: { '/relevant': [{ id: 'hero', settings: { title: 'Published' } }] },
      pathAliases: {},
    },
    relevantPublishedRoutes: ['/relevant'],
    ...overrides,
  };
}

describe('content-admin retention dependency fingerprints', () => {
  it('is deterministic and ignores object property order', () => {
    const first = buildRetentionDependencyFingerprints(baseInputs());
    const second = buildRetentionDependencyFingerprints(baseInputs({
      candidates: [{ sizeBytes: 10, sha256: 'a', relativePath: 'a.json', id: 'candidate-a' }],
    }));

    expect(second.candidateManifest.sha256).toBe(first.candidateManifest.sha256);
    expect(second.runtimeSafety.sha256).toBe(first.runtimeSafety.sha256);
  });

  it('changes when an immutable candidate or recovery dependency drifts', () => {
    const first = buildRetentionDependencyFingerprints(baseInputs());
    const candidateDrift = buildRetentionDependencyFingerprints(baseInputs({
      candidates: [{ id: 'candidate-a', relativePath: 'a.json', sha256: 'changed', sizeBytes: 10 }],
    }));
    const recoveryDrift = buildRetentionDependencyFingerprints(baseInputs({
      recoveryRecords: [{ id: 'recovery-a', relativePath: 'recovery.json', sha256: 'changed', sizeBytes: 30, restoreEligibility: 'eligible' }],
    }));

    expect(candidateDrift.candidateManifest.sha256).not.toBe(first.candidateManifest.sha256);
    expect(recoveryDrift.recoveryManifest.sha256).not.toBe(first.recoveryManifest.sha256);
  });

  it('changes only for published routes explicitly included as dependencies', () => {
    const baseSnapshot = baseInputs().publishedBaseSnapshot;
    const changed = {
      ...baseSnapshot,
      blocksByPath: {
        ...baseSnapshot.blocksByPath,
        '/relevant': [{ id: 'hero', settings: { title: 'Changed' } }],
      },
    };
    expect(buildPublishedRouteFingerprint(baseSnapshot, '/unrelated'))
      .toEqual(buildPublishedRouteFingerprint(changed, '/unrelated'));
    expect(buildPublishedRouteFingerprint(baseSnapshot, '/relevant'))
      .not.toEqual(buildPublishedRouteFingerprint(changed, '/relevant'));
  });
});
