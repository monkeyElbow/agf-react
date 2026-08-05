const FILENAME_TIMESTAMP_PATTERN = /(20\d{6,8})[-_](\d{6})(?:[-_]\d+)?/;

function text(value) {
  return String(value || '').trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseFilenameTimestamp(fileName) {
  const match = text(fileName).match(FILENAME_TIMESTAMP_PATTERN);
  if (!match) return null;
  const datePart = match[1].length === 8 ? match[1] : `${match[1].slice(0, 4)}${match[1].slice(4, 6)}${match[1].slice(6, 8)}`;
  const iso = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}Z`;
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function evidence(field, source, value, confidence) {
  return { field, source, value, confidence };
}

export function resolveRetentionEvidence(item = {}) {
  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const evidenceSources = [];
  const actor = metadata.actor || item.actor || null;
  const reason = text(metadata.reason || item.reason);
  const createdAt = Number(metadata.createdAt || item.createdAt || 0) || null;
  const filenameTimestamp = parseFilenameTimestamp(item.fileName || item.relativePath);
  const schemaVersion = Number(item.schemaVersion || 0) || null;
  const routeScope = Array.isArray(item.routeScope) ? item.routeScope : [];

  if (createdAt) evidenceSources.push(evidence('createdAt', 'backup metadata', createdAt, 'authoritative'));
  if (actor) evidenceSources.push(evidence('actor', 'backup metadata', actor, 'authoritative'));
  if (reason) evidenceSources.push(evidence('reason', 'backup metadata', reason, 'authoritative'));
  if (schemaVersion) evidenceSources.push(evidence('schemaVersion', 'snapshot root/version', schemaVersion, 'authoritative'));
  if (routeScope.length) evidenceSources.push(evidence('routeScope', 'route inventory', routeScope, 'authoritative'));
  if (filenameTimestamp) evidenceSources.push(evidence('createdAt', 'filename timestamp', filenameTimestamp, 'weakly-inferred'));

  const authoritativeFields = [createdAt, reason, schemaVersion, routeScope.length > 0];
  const allAuthoritative = authoritativeFields.every(Boolean) && Boolean(actor);
  const enoughForStrongInference = authoritativeFields.every(Boolean)
    && (!filenameTimestamp || Math.abs(filenameTimestamp - createdAt) < 86400000);
  const confidence = allAuthoritative
    ? 'authoritative'
    : enoughForStrongInference
      ? 'strongly-inferred'
      : evidenceSources.length
        ? 'weakly-inferred'
        : 'unresolved';

  const releaseId = text(metadata.releaseId || metadata.protectedRelease || metadata.releaseVersion);
  const releaseRelationship = releaseId
    ? { status: 'identified', value: releaseId, evidence: 'backup metadata', confidence: 'authoritative' }
    : { status: 'unknown', value: null, evidence: null, confidence: 'unresolved' };

  return {
    confidence,
    evidenceSources,
    fields: {
      actor: actor || null,
      reason: reason || null,
      createdAt,
      schemaVersion,
      routeScope,
    },
    releaseRelationship,
    metadataStatus: confidence === 'authoritative' ? 'complete' : 'partial',
  };
}

export function classifyRetentionShape(item = {}, currentSchemaVersion = 1, adapterFindings = []) {
  const schemaVersion = Number(item.schemaVersion || 0) || null;
  const findings = Array.isArray(adapterFindings) ? adapterFindings : [];
  if (item.restoreEligibility === 'ineligible' && findings.length === 0 && schemaVersion === currentSchemaVersion) {
    return 'current-schema invalid';
  }
  if (findings.length > 0) return 'historical known shape';
  if (schemaVersion != null && schemaVersion !== currentSchemaVersion) return 'historical unclassified shape';
  if (schemaVersion === currentSchemaVersion && item.restoreEligibility === 'eligible') return 'current-schema valid';
  if (item.restoreEligibility === 'ineligible') return 'invalid/unrestorable';
  return 'unresolved';
}

function duplicateGroupId(kind, checksum) {
  return `duplicate:${kind}:${checksum}`;
}

export function buildRetentionDuplicateGroups(items = []) {
  const groups = new Map();
  items.forEach((item) => {
    const exactChecksum = text(item.sha256);
    const contentChecksum = text(item.contentSha256);
    if (exactChecksum) {
      const key = duplicateGroupId('file', exactChecksum);
      if (!groups.has(key)) groups.set(key, { groupId: key, type: 'exact-file', checksum: exactChecksum, members: [] });
      groups.get(key).members.push(item);
    }
    if (contentChecksum) {
      const key = duplicateGroupId('content', contentChecksum);
      if (!groups.has(key)) groups.set(key, { groupId: key, type: 'snapshot-payload', checksum: contentChecksum, members: [] });
      groups.get(key).members.push(item);
    }
  });
  return [...groups.values()]
    .filter((group) => group.members.length > 1)
    .map((group) => {
      const canonical = [...group.members].sort((left, right) => {
        const leftProtected = left.currentSchema && left.restoreEligibility === 'eligible' ? 0 : 1;
        const rightProtected = right.currentSchema && right.restoreEligibility === 'eligible' ? 0 : 1;
        return leftProtected - rightProtected
          || Number(right.createdAt || 0) - Number(left.createdAt || 0)
          || text(left.id).localeCompare(text(right.id));
      })[0];
      return {
        groupId: group.groupId,
        type: group.type,
        checksum: group.checksum,
        canonicalCandidate: canonical?.id || null,
        canonicalReason: canonical?.currentSchema && canonical?.restoreEligibility === 'eligible'
          ? 'current-schema valid recovery target'
          : 'deterministic newest valid record, pending review',
        members: group.members.map((member) => ({
          id: member.id,
          kind: member.kind,
          relativePath: member.relativePath,
          sha256: member.sha256,
          contentSha256: member.contentSha256,
          sizeBytes: member.sizeBytes,
          protected: Boolean(member.protected),
        })),
        protected: group.members.some((member) => member.currentSchema && member.restoreEligibility === 'eligible'),
      };
    });
}

function adapterIdsForItem(item, migrationFindingsByRecord = {}) {
  return unique(item.migrationAdapters
    || migrationFindingsByRecord?.[item.migrationRecordKey]?.adapters
    || migrationFindingsByRecord?.[item.id]?.adapters
    || migrationFindingsByRecord?.[item.relativePath]?.adapters
    || []);
}

export function resolveRetentionRecords(items = [], {
  currentSchemaVersion = 1,
  protectedCurrentIds = new Set(),
  currentRecoveryIds = null,
  migrationFindingsByRecord = {},
} = {}) {
  const duplicateGroups = buildRetentionDuplicateGroups(items);
  const duplicateById = new Map();
  duplicateGroups.forEach((group) => group.members.forEach((member) => duplicateById.set(member.id, group)));
  const verifiedRecoveryIds = currentRecoveryIds || new Set(items
    .filter((item) => item.kind === 'backup'
      && item.schemaVersion === currentSchemaVersion
      && item.restoreEligibility === 'eligible'
      && Number(item.migrationFindingCount || 0) === 0)
    .map((item) => item.id));
  const resolutions = items
    .filter((item) => item.kind === 'backup' || item.kind === 'revision')
    .map((item) => {
      const adapterIds = adapterIdsForItem(item, migrationFindingsByRecord);
      const evidence = resolveRetentionEvidence(item);
      const shapeStatus = classifyRetentionShape(item, currentSchemaVersion, adapterIds);
      const duplicateGroup = duplicateById.get(item.id) || null;
      const isCurrentRecovery = item.kind === 'backup'
        && shapeStatus === 'current-schema valid'
        && item.restoreEligibility === 'eligible'
        && verifiedRecoveryIds.has(item.id);
      const duplicateNonCanonical = !isCurrentRecovery
        && shapeStatus === 'current-schema valid'
        && duplicateGroup
        && duplicateGroup.canonicalCandidate !== item.id
        && duplicateGroup.protected;
      let category = 'unknown/hold';
      let reason = 'insufficient authoritative evidence';
      let executable = false;
      if (duplicateNonCanonical && evidence.confidence === 'authoritative') {
        category = 'delete duplicate current-shape record';
        reason = 'authoritative metadata and duplicate current-schema payload';
        executable = true;
      } else if (duplicateNonCanonical && evidence.confidence === 'strongly-inferred') {
        category = 'review strongly inferred candidate';
        reason = 'duplicate current-schema payload with incomplete metadata';
      } else if (isCurrentRecovery) {
        category = protectedCurrentIds.has(item.id)
          ? 'retain protected current release'
          : 'retain current recovery';
        reason = 'verified current-schema recovery target';
      } else if (evidence.confidence === 'authoritative' && shapeStatus.startsWith('historical')) {
        category = 'delete obsolete-shape record';
        reason = 'authoritative metadata and known unsupported shape';
        executable = true;
      } else if (evidence.confidence === 'strongly-inferred' && shapeStatus.startsWith('historical')) {
        category = 'review strongly inferred candidate';
        reason = 'strong evidence for unsupported shape, but metadata is incomplete';
      } else if (evidence.confidence === 'authoritative' && duplicateGroup && shapeStatus === 'current-schema valid') {
        category = 'delete duplicate current-shape record';
        reason = 'authoritative metadata and duplicate current-schema payload';
        executable = duplicateGroup.canonicalCandidate !== item.id && !duplicateGroup.protected;
      } else if (shapeStatus === 'current-schema invalid' || shapeStatus === 'invalid/unrestorable') {
        category = evidence.confidence === 'authoritative'
          ? 'delete invalid/unrestorable record'
          : 'unknown/hold';
        reason = 'record failed current-schema restore validation';
        executable = category !== 'unknown/hold';
      }
      return {
        ...item,
        category,
        reason,
        executable,
        shapeStatus,
        evidence,
        adapterIds,
        duplicateGroupId: duplicateGroup?.groupId || null,
        releaseRelationship: evidence.releaseRelationship,
        policyRule: category.startsWith('delete')
          ? 'current-schema-only cleanup policy'
          : null,
      };
    });
  return { resolutions, duplicateGroups };
}

export function buildMigrationEvidenceMap(migrationReport) {
  const map = {};
  (migrationReport?.reports || []).forEach((report) => {
    (report.findings || []).forEach((finding) => {
      const keys = [finding.record];
      if (finding.revisionId) keys.push(`${finding.record}#${finding.revisionId}`);
      keys.forEach((key) => {
        if (!map[key]) map[key] = { adapters: [], findings: [] };
        if (!map[key].adapters.includes(report.adapter)) map[key].adapters.push(report.adapter);
        map[key].findings.push({
          adapter: report.adapter,
          layer: finding.layer,
          pathname: finding.pathname || null,
          blockId: finding.blockId || null,
          detail: finding.detail || null,
        });
      });
    });
  });
  return map;
}

function itemMap(items = []) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function sameReviewedIdentity(source, reviewed) {
  return Boolean(source
    && reviewed
    && source.relativePath === reviewed.relativePath
    && source.sha256 === reviewed.sha256
    && Number(source.sizeBytes || 0) === Number(reviewed.sizeBytes || 0));
}

function currentRecoveryIds(manifest) {
  return new Set((manifest?.cleanupPlan || [])
    .filter((item) => item.category === 'retain current recovery'
      || item.category === 'retain protected current release')
    .map((item) => item.id));
}

function newestCurrentBackup(manifest, recoveryIds) {
  return [...(manifest?.items || [])]
    .filter((item) => item.kind === 'backup' && recoveryIds.has(item.id))
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0)
      || text(right.id).localeCompare(text(left.id)))[0] || null;
}

/**
 * Builds an explicit, non-mutating deletion review from live evidence and the
 * prior review. Canonical selection is recomputed from the live manifest; the
 * prior artifact is used only as a checksum/path drift check.
 */
export function buildCorrectedDeletionReview({
  sourceManifest,
  reviewedPlan = [],
  reviewedBeforeManifest = null,
  reviewedMetadata = [],
  reviewedDuplicateGroups = [],
  reviewedRestoreRecords = [],
} = {}) {
  const sourcePlan = sourceManifest?.cleanupPlan || [];
  const sourceItems = itemMap(sourceManifest?.items);
  const sourceById = itemMap(sourcePlan);
  const reviewedCandidates = (reviewedPlan || [])
    .filter((item) => item.category === 'review strongly inferred candidate');
  const sourceCandidates = sourcePlan
    .filter((item) => item.kind === 'backup'
      && item.category === 'review strongly inferred candidate');
  const reviewedBeforeById = itemMap(reviewedBeforeManifest?.items);
  const reviewedMetadataById = itemMap(reviewedMetadata);
  const reviewedRestoreById = itemMap(reviewedRestoreRecords);
  const reviewedGroupsById = itemMap(reviewedDuplicateGroups.flatMap((group) => group.members || []));
  const drift = [];

  reviewedCandidates.forEach((reviewed) => {
    const source = sourceById.get(reviewed.id);
    const before = reviewedBeforeById.get(reviewed.id);
    const metadata = reviewedMetadataById.get(reviewed.id);
    const restore = reviewedRestoreById.get(reviewed.id);
    const reviewedDuplicateMember = reviewedGroupsById.get(reviewed.id);
    if (!sameReviewedIdentity(source, reviewed)
      || !sameReviewedIdentity(source, before)
      || !sameReviewedIdentity(source, metadata)
      || !restore
      || restore.sha256 !== source.sha256
      || restore.restoreEligibility !== source.restoreEligibility
      || (reviewedDuplicateMember && reviewedDuplicateMember.sha256 !== source.sha256)) {
      drift.push({ id: reviewed.id, reason: 'source or reviewed checksum/path/size drift' });
    }
  });
  sourceCandidates.forEach((source) => {
    if (!reviewedCandidates.some((reviewed) => reviewed.id === source.id)) {
      drift.push({ id: source.id, reason: 'new live candidate is absent from reviewed artifact' });
    }
  });
  if (drift.length) {
    throw new Error(`Retention review is stale or incomplete: ${drift.map((item) => `${item.id} (${item.reason})`).join(', ')}`);
  }

  const duplicateGroups = sourceManifest?.duplicateGroups || [];
  const duplicateById = new Map();
  duplicateGroups.forEach((group) => (group.members || []).forEach((member) => duplicateById.set(member.id, group)));
  const recoveryIds = currentRecoveryIds(sourceManifest);
  const newestCurrent = newestCurrentBackup(sourceManifest, recoveryIds);
  const restoreSampleIds = new Set((sourceManifest?.restoreSamples?.samples || [])
    .map((sample) => sample.id));
  const releaseIds = new Set(sourcePlan
    .filter((item) => item.releaseRelationship?.status === 'identified'
      || item.category === 'retain protected current release')
    .map((item) => item.id));
  const canonicalIds = new Set(duplicateGroups.map((group) => group.canonicalCandidate).filter(Boolean));

  const canonicalRecords = duplicateGroups.map((group) => {
    const canonicalMember = (group.members || []).find((member) => member.id === group.canonicalCandidate);
    const source = sourceItems.get(group.canonicalCandidate) || sourceById.get(group.canonicalCandidate);
    if (!canonicalMember || !source || canonicalMember.sha256 !== source.sha256) {
      throw new Error(`Canonical record verification failed for duplicate group ${group.groupId}.`);
    }
    return {
      groupId: group.groupId,
      type: group.type,
      checksum: group.checksum,
      canonicalId: group.canonicalCandidate,
      canonicalPath: canonicalMember.relativePath,
      canonicalSha256: canonicalMember.sha256,
      canonicalSizeBytes: canonicalMember.sizeBytes,
      canonicalReason: group.canonicalReason,
      schemaStatus: classifyRetentionShape(source, sourceManifest.policy?.currentSchemaVersion || 1,
        source.migrationAdapters || []),
      restoreEligibility: source.restoreEligibility,
      checksumStatus: 'verified against live source manifest',
      retained: true,
      members: group.members,
    };
  });

  const excludedCanonical = [];
  const candidates = [];
  sourceCandidates.forEach((source) => {
    const group = duplicateById.get(source.id) || null;
    const exclusionReasons = [];
    if (canonicalIds.has(source.id)) exclusionReasons.push('protected canonical duplicate record');
    if (recoveryIds.has(source.id)) exclusionReasons.push('current recovery record');
    if (releaseIds.has(source.id)) exclusionReasons.push('protected release record');
    if (newestCurrent?.id === source.id) exclusionReasons.push('newest valid current-schema backup');
    if (restoreSampleIds.has(source.id)) exclusionReasons.push('required by restore proof');
    if (source.kind !== 'backup') exclusionReasons.push('not a file-backed backup');
    if (exclusionReasons.length) {
      const excluded = {
        ...source,
        duplicateGroupId: group?.groupId || source.duplicateGroupId || null,
        retainedCanonicalPath: group
          ? (group.members || []).find((member) => member.id === group.canonicalCandidate)?.relativePath || null
          : null,
        exclusionReasons,
      };
      if (canonicalIds.has(source.id)) excludedCanonical.push(excluded);
      return;
    }
    candidates.push({
      ...source,
      executable: true,
      checksumStatus: 'verified against live source and reviewed artifacts',
      retainedCanonicalPath: group
        ? (group.members || []).find((member) => member.id === group.canonicalCandidate)?.relativePath || null
        : null,
      deletionRationale: group
        ? 'strongly inferred obsolete shape; noncanonical duplicate member; explicit reviewed deletion candidate'
        : 'strongly inferred obsolete shape; explicit reviewed deletion candidate',
      duplicateGroupId: group?.groupId || source.duplicateGroupId || null,
    });
  });

  return {
    candidates: candidates.sort((left, right) => left.id.localeCompare(right.id)),
    excludedCanonical: excludedCanonical.sort((left, right) => left.id.localeCompare(right.id)),
    canonicalRecords: canonicalRecords.sort((left, right) => left.groupId.localeCompare(right.groupId)),
    protectedRecoveryIds: [...recoveryIds].sort(),
    protectedReleaseIds: [...releaseIds].sort(),
    restoreSampleIds: [...restoreSampleIds].sort(),
    newestCurrentId: newestCurrent?.id || null,
    reviewedCandidateCount: reviewedCandidates.length,
    sourceCandidateCount: sourceCandidates.length,
    canonicalConflictCount: excludedCanonical.length,
    candidateCount: candidates.length,
    candidateBytes: candidates.reduce((total, item) => total + Number(item.sizeBytes || 0), 0),
  };
}
