import { createHash } from 'node:crypto';

export const RETENTION_FINGERPRINT_VERSION = 1;
export const RETENTION_CLASSIFICATION_ALGORITHM_VERSION = 1;

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

export function hashRetentionValue(value) {
  return createHash('sha256')
    .update(JSON.stringify(sortKeys(value)))
    .digest('hex');
}

export function withoutCollaboration(state) {
  if (!state || typeof state !== 'object') return state;
  const next = JSON.parse(JSON.stringify(state));
  delete next.collaborationByPath;
  return next;
}

export function buildPublishedRouteFingerprint(baseSnapshot, pathname) {
  return {
    route: pathname,
    contentSha256: hashRetentionValue({
      page: baseSnapshot?.pageHierarchy?.[pathname] || null,
      blocks: baseSnapshot?.blocksByPath?.[pathname] || [],
      aliases: Object.fromEntries(Object.entries(baseSnapshot?.pathAliases || {})
        .filter(([from, to]) => from === pathname || to === pathname)),
    }),
  };
}

function manifestEntry(item, extra = {}) {
  return {
    id: item?.id || null,
    relativePath: item?.relativePath || null,
    sha256: item?.sha256 || null,
    sizeBytes: Number(item?.sizeBytes || 0),
    schemaVersion: item?.schemaVersion || null,
    ...extra,
  };
}

export function buildRetentionDependencyFingerprints({
  candidates = [],
  canonicalRecords = [],
  recoveryRecords = [],
  protectedReleaseRecords = [],
  restoreProof = {},
  policy = {},
  publishedBaseSnapshot = {},
  relevantPublishedRoutes = [],
  schemaVersion = 1,
  migrationDetectorVersion = 1,
} = {}) {
  const candidateManifest = candidates
    .map((item) => manifestEntry(item))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const canonicalManifest = canonicalRecords
    .map((item) => manifestEntry(item, {
      duplicateGroupId: item?.duplicateGroupId || item?.groupId || null,
    }))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const recoveryManifest = recoveryRecords
    .map((item) => manifestEntry(item, {
      restoreEligibility: item?.restoreEligibility || null,
    }))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const releaseManifest = protectedReleaseRecords
    .map((item) => manifestEntry(item, {
      releaseId: item?.metadata?.releaseId || item?.releaseId || null,
      routeScope: [...(item?.routeScope || [])].sort(),
    }))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const restoreProofFingerprint = {
    status: restoreProof.status || 'unknown',
    samples: (restoreProof.samples || []).map((sample) => ({
      source: sample.source || null,
      id: sample.id || null,
      schemaVersion: sample.schemaVersion || null,
      checksumMatches: sample.checksumMatches === true,
      status: sample.status || null,
      findings: sample.findings || [],
    })).sort((left, right) => String(left.id).localeCompare(String(right.id))),
  };
  const runtimeSafety = {
    schemaVersion,
    migrationDetectorVersion,
    retentionPolicyVersion: policy.policyVersion || null,
    classificationAlgorithmVersion: RETENTION_CLASSIFICATION_ALGORITHM_VERSION,
  };
  const publishedRoutes = [...new Set(relevantPublishedRoutes)].sort()
    .map((pathname) => buildPublishedRouteFingerprint(publishedBaseSnapshot, pathname));

  return {
    fingerprintVersion: RETENTION_FINGERPRINT_VERSION,
    candidateManifest: {
      entries: candidateManifest,
      sha256: hashRetentionValue(candidateManifest),
    },
    retainedCanonicalManifest: {
      entries: canonicalManifest,
      sha256: hashRetentionValue(canonicalManifest),
    },
    recoveryManifest: {
      entries: recoveryManifest,
      sha256: hashRetentionValue(recoveryManifest),
    },
    protectedReleaseManifest: {
      entries: releaseManifest,
      sha256: hashRetentionValue(releaseManifest),
    },
    restoreProof: {
      value: restoreProofFingerprint,
      sha256: hashRetentionValue(restoreProofFingerprint),
    },
    routeScopedPublished: {
      routes: publishedRoutes,
      sha256: hashRetentionValue(publishedRoutes),
    },
    runtimeSafety: {
      value: runtimeSafety,
      sha256: hashRetentionValue(runtimeSafety),
    },
  };
}

export function buildRetentionPreflightRules() {
  return {
    invalidates: [
      'candidate path, size, or SHA-256 checksum changes',
      'retained canonical path, duplicate-group membership, or checksum changes',
      'recovery record loss, checksum drift, schema drift, or restore-proof failure',
      'protected release identity, route scope, or checksum changes',
      'relevant route-scoped published content changes',
      'supported schema, migration detector, retention policy, or classification algorithm changes',
    ],
    doesNotInvalidate: [
      'draft-only content changes',
      'unrelated published route changes',
      'timestamps, ownership, actor/display-name, and authority metadata changes',
      'unrelated revisions',
      'non-semantic JSON property ordering',
    ],
  };
}
