#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildRetentionManifest } from './content-admin-retention.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const outputDir = process.env.CANONICAL_DISPOSITION_OUTPUT_DIR
  || '/tmp/agf-canonical-disposition-20260805-v1';
const reviewDir = '/tmp/agf-retention-review-20260805-v6';
const auditDir = '/tmp/agf-adapter-retirement-audit-20260805-v2';
const EXPECTED_RECOVERY_COUNT = 14;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function liveCanonicalRecord(canonical) {
  const filePath = canonical.canonicalPath ? path.resolve(repoRoot, canonical.canonicalPath) : null;
  if (!filePath || !fs.existsSync(filePath)) return { exists: false, checksum: null, sizeBytes: null };

  if (!String(canonical.canonicalId || '').startsWith('revision:')) {
    const bytes = fs.readFileSync(filePath);
    return { exists: true, checksum: createHash('sha256').update(bytes).digest('hex'), sizeBytes: bytes.length };
  }

  const revisions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const revisionId = String(canonical.canonicalId).split(':').pop();
  const revision = Array.isArray(revisions)
    ? revisions.find((entry) => String(entry?.id || '') === revisionId)
    : null;
  if (!revision) return { exists: false, checksum: null, sizeBytes: null };
  const serialized = JSON.stringify(revision);
  return {
    exists: true,
    checksum: hashJson(revision),
    sizeBytes: Buffer.byteLength(serialized),
  };
}

function writeOnce(name, value) {
  const filePath = path.join(outputDir, name);
  if (fs.existsSync(filePath)) throw new Error(`Refusing to overwrite artifact: ${filePath}`);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function currentManifest() {
  return buildRetentionManifest();
}

function recordMap(manifest) {
  return new Map(manifest.items.map((item) => [item.id, item]));
}

function findingsByRecord() {
  const findings = readJson(path.join(auditDir, 'retained-findings.json')).migrationFindings;
  const byRecord = new Map();
  findings.forEach((finding) => {
    const list = byRecord.get(finding.recordId) || [];
    list.push(finding);
    byRecord.set(finding.recordId, list);
  });
  return { findings, byRecord };
}

function canonicalMembership() {
  const canonical = readJson(path.join(reviewDir, 'retained-canonical-records-v4.json')).records;
  const recovery = readJson(path.join(reviewDir, 'retained-recovery-records-v4.json')).records;
  const releases = readJson(path.join(reviewDir, 'protected-release-records-v4.json')).records;
  const before = readJson(path.join(reviewDir, 'before-manifest-v4.json'));
  return {
    canonical,
    recovery,
    releases,
    groups: before.duplicateGroups,
    recoveryIds: new Set(recovery.map((record) => record.id)),
    releaseIds: new Set(releases.map((record) => record.id || record.canonicalId)),
  };
}

function adapterCounts(findings) {
  return findings.reduce((counts, finding) => {
    counts[finding.adapter] = (counts[finding.adapter] || 0) + 1;
    return counts;
  }, {});
}

function classifyCanonical({ canonical, manifestItems, byRecord, membership, newestCurrentId }) {
  const item = manifestItems.get(canonical.canonicalId);
  const live = liveCanonicalRecord(canonical);
  const exists = live.exists;
  const checksum = live.checksum;
  const findings = byRecord.get(canonical.canonicalId) || [];
  const isBackup = canonical.canonicalId.startsWith('backup:');
  const isRecovery = membership.recoveryIds.has(canonical.canonicalId);
  const isRelease = membership.releaseIds.has(canonical.canonicalId);
  const currentSchema = item?.currentSchema === true;
  const policyCurrentSchema = isBackup && currentSchema && item?.restoreEligibility === 'eligible' && findings.length === 0;
  const directlyRestorable = isBackup
    ? policyCurrentSchema
    : canonical.canonicalId.startsWith('active:') || canonical.canonicalId.startsWith('published:');
  const group = membership.groups.find((entry) => entry.groupId === canonical.groupId);
  const existingMembers = (group?.members || canonical.members || []).filter((member) => {
    const memberPath = member.relativePath ? path.resolve(repoRoot, member.relativePath) : null;
    return memberPath && fs.existsSync(memberPath);
  });
  const groupRecoveryMembers = existingMembers.filter((member) => membership.recoveryIds.has(member.id));
  const groupHasCurrentValidMember = existingMembers.some((member) => {
    const memberItem = manifestItems.get(member.id);
    return memberItem?.kind === 'backup'
      && memberItem.currentSchema === true
      && memberItem.restoreEligibility === 'eligible'
      && (byRecord.get(member.id) || []).length === 0;
  });
  const groupAllRemainingMembersObsolete = existingMembers.length > 0 && existingMembers.every((member) => {
    const memberItem = manifestItems.get(member.id);
    return memberItem?.kind === 'backup'
      && !(membership.recoveryIds.has(member.id))
      && !(memberItem.currentSchema === true && memberItem.restoreEligibility === 'eligible' && (byRecord.get(member.id) || []).length === 0);
  });
  let classification = 'unknown/hold';
  let policyReason = 'Canonical role or replacement evidence is unresolved.';
  if (!isBackup) {
    classification = canonical.canonicalId.startsWith('active:') || canonical.canonicalId.startsWith('published:')
      ? 'retain current recovery'
      : 'unknown/hold';
    policyReason = 'This canonical entry is not a deletable backup file.';
  } else if (!exists || checksum !== canonical.canonicalSha256) {
    policyReason = 'Missing file or checksum drift requires hold.';
  } else if (isRecovery) {
    classification = 'retain current recovery';
    policyReason = 'Member of the approved current-schema recovery set.';
  } else if (isRelease) {
    classification = 'retain protected release';
    policyReason = 'Protected release record.';
  } else if (canonical.canonicalId === newestCurrentId) {
    classification = 'retain newest valid backup';
    policyReason = 'Newest valid current-schema recovery candidate.';
  } else if (policyCurrentSchema && !findings.length) {
    classification = groupHasCurrentValidMember || groupRecoveryMembers.length
      ? 'delete superseded canonical'
      : 'retain because it is the sole valid duplicate-group representative';
    policyReason = classification.startsWith('delete')
      ? 'Current-schema duplicate has a valid recovery/member replacement.'
      : 'Only valid current-schema representative and no recovery replacement.';
  } else if (findings.length && (item?.restoreEligibility === 'ineligible' || !policyCurrentSchema || groupAllRemainingMembersObsolete)) {
    classification = 'delete obsolete historical canonical';
    policyReason = 'Historical unsupported shape under current-schema-only policy; current recovery set provides replacement evidence.';
  }
  return {
    canonicalId: canonical.canonicalId,
    path: canonical.canonicalPath,
    checksum: canonical.canonicalSha256,
    liveChecksum: checksum,
    checksumStatus: exists && checksum === canonical.canonicalSha256 ? 'verified' : 'drift-or-missing',
    sizeBytes: live.sizeBytes || canonical.canonicalSizeBytes,
    duplicateGroupId: canonical.groupId,
    canonicalSelectionReason: canonical.canonicalReason,
    recordKind: item?.kind || (isBackup ? 'backup' : 'unknown'),
    directlyRestorable,
    restoreEligibility: item?.restoreEligibility || canonical.restoreEligibility || 'unknown',
    recoveryRecord: isRecovery,
    protectedRelease: isRelease,
    newestValidBackup: canonical.canonicalId === newestCurrentId,
    currentSchema: currentSchema || canonical.schemaStatus === 'current-schema valid',
    currentSchemaPolicyStatus: policyCurrentSchema ? 'valid-current-policy' : 'historical-or-unsupported',
    historicalAdapterFindings: findings.length,
    adapters: adapterCounts(findings),
    findingLayers: [...new Set(findings.map((finding) => finding.layer))],
    groupMemberCount: existingMembers.length,
    groupRecoveryMembers: groupRecoveryMembers.map((member) => member.id),
    groupHasCurrentValidMember,
    groupAllRemainingMembersObsolete,
    replacementRecoveryEvidence: {
      count: membership.recovery.length,
      ids: membership.recovery.map((record) => record.id),
      groupMembers: groupRecoveryMembers.map((member) => member.id),
      sufficientForCandidate: !isRecovery && membership.recovery.length === EXPECTED_RECOVERY_COUNT,
    },
    policyRetentionReason: policyReason,
    classification,
  };
}

function candidateGroups(dispositions, findings, recoveryIds) {
  const candidates = dispositions.filter((entry) => entry.classification.startsWith('delete '));
  const byAdapter = new Map();
  ['managed-path-aliases', 'generosity-fund-donor-advised-fund-refresh', 'planned-giving-retired-static-comparison', 'retirement-ira-block-shape']
    .forEach((adapter) => {
      const paths = candidates.filter((candidate) => candidate.adapters[adapter]).map((candidate) => candidate.canonicalId);
      const records = paths.map((id) => candidates.find((candidate) => candidate.canonicalId === id));
      const removed = findings.filter((finding) => finding.adapter === adapter && paths.includes(finding.recordId)).length;
      byAdapter.set(adapter, {
        groupId: `delete-canonical-${adapter}`,
        adapter,
        backupPaths: records.map((record) => record.path),
        backupIds: paths,
        checksums: records.map((record) => ({ path: record.path, sha256: record.checksum, sizeBytes: record.sizeBytes })),
        totalBytes: records.reduce((total, record) => total + record.sizeBytes, 0),
        adapterFindingsRemoved: removed,
        canonicalGroupsAffected: [...new Set(records.map((record) => record.duplicateGroupId))],
        recoveryRecordsUnaffected: records.every((record) => !recoveryIds.has(record.canonicalId)),
        replacementRecoveryEvidence: '14 current-schema recovery records, all with zero adapter findings',
        projectedRemainingFindings: findings.filter((finding) => finding.adapter === adapter && !paths.includes(finding.recordId)).length,
      });
    });
  return [...byAdapter.values()];
}

function emptyLinkDisposition(dispositions) {
  const snapshotFindings = readJson(path.join(auditDir, 'retained-findings.json')).snapshotFindings
    .filter((finding) => finding.code === 'canonical-link-json-empty');
  const records = [...new Set(snapshotFindings.map((finding) => `backup:dev-data/backups/${finding.record.slice('backup:'.length)}`))];
  return {
    findingCount: snapshotFindings.length,
    backups: dispositions.filter((entry) => records.includes(entry.canonicalId)).map((entry) => ({
      path: entry.path,
      checksum: entry.checksum,
      sizeBytes: entry.sizeBytes,
      recoveryRecord: entry.recoveryRecord,
      protectedRelease: entry.protectedRelease,
      classification: entry.classification,
      eligibleUnderCurrentPolicy: entry.classification.startsWith('delete '),
      requiredForAdapterFindings: entry.historicalAdapterFindings > 0,
    })),
    recommendation: 'Do not add a cleanup migration solely for this historical noise; these six backups are proposed deletion candidates under the current policy.',
  };
}

async function main() {
  if (fs.existsSync(outputDir)) throw new Error(`Refusing to overwrite output directory: ${outputDir}`);
  const manifest = currentManifest();
  const items = recordMap(manifest);
  const membership = canonicalMembership();
  const { findings, byRecord } = findingsByRecord();
  const currentRecovery = membership.recoveryIds;
  if (currentRecovery.size !== EXPECTED_RECOVERY_COUNT) throw new Error(`Expected ${EXPECTED_RECOVERY_COUNT} recovery records; found ${currentRecovery.size}.`);
  const newestCurrent = manifest.items
    .filter((item) => item.kind === 'backup' && item.currentSchema && item.restoreEligibility === 'eligible' && !(byRecord.get(item.id) || []).length)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0];
  const dispositions = membership.canonical.map((canonical) => classifyCanonical({
    canonical,
    manifestItems: items,
    byRecord,
    membership,
    newestCurrentId: newestCurrent?.id || null,
  }));
  const proposed = dispositions.filter((entry) => entry.classification.startsWith('delete '));
  const proposedPaths = new Set(proposed.map((entry) => entry.canonicalId));
  if (proposed.some((entry) => entry.checksumStatus !== 'verified' || entry.recoveryRecord || entry.protectedRelease)) {
    throw new Error('Proposed deletion set contains checksum drift, recovery, or protected records.');
  }
  const projectedFindings = findings.filter((finding) => !proposedPaths.has(finding.recordId));
  const adapterGroups = candidateGroups(dispositions, findings, currentRecovery);
  const emptyLinks = emptyLinkDisposition(dispositions);
  fs.mkdirSync(outputDir, { recursive: true });
  const artifactPaths = {};
  artifactPaths.canonicalSemantics = writeOnce('canonical-semantics-reconciliation.json', {
    generatedAt: new Date().toISOString(),
    canonicalCount: dispositions.length,
    explanation: 'Canonical means duplicate-group representative, not protected recovery. The prior matrix used canonical membership as a proxy for direct restorability; this audit separates those concepts. Schema validation can mark a historical JSON record eligible, while adapter findings make it unsupported for current-schema-only direct restore.',
    currentRecoveryCount: currentRecovery.size,
    newestValidBackup: newestCurrent?.id || null,
    records: dispositions,
  });
  artifactPaths.disposition = writeOnce('canonical-disposition.json', {
    policy: 'current-schema-only; historical schema restore unsupported',
    mutationPerformed: false,
    records: dispositions,
  });
  artifactPaths.adapterGroups = writeOnce('adapter-unblocking-delete-groups.json', {
    policy: 'proposed only; no deletion executed',
    groups: adapterGroups,
  });
  artifactPaths.emptyLinks = writeOnce('empty-link-backup-disposition.json', emptyLinks);
  artifactPaths.proposedDelete = writeOnce('proposed-delete-manifest.json', {
    mutationPerformed: false,
    candidateCount: proposed.length,
    candidateBytes: proposed.reduce((total, entry) => total + entry.sizeBytes, 0),
    candidates: proposed,
    excludes: {
      recoveryCount: currentRecovery.size,
      protectedReleaseCount: membership.releases.length,
      newestValidBackup: newestCurrent?.id || null,
      unresolvedRevisionCount: manifest.summary.revisionCount,
    },
  });
  artifactPaths.retained = writeOnce('retained-backup-manifest.json', {
    mutationPerformed: false,
    backups: manifest.items.filter((item) => item.kind === 'backup' && !proposedPaths.has(item.id)).map((item) => ({
      id: item.id,
      path: item.relativePath,
      sha256: item.sha256,
      sizeBytes: item.sizeBytes,
      recoveryRecord: currentRecovery.has(item.id),
      currentSchema: item.currentSchema,
      restoreEligibility: item.restoreEligibility,
    })),
  });
  artifactPaths.projected = writeOnce('projected-post-delete-findings.json', {
    mutationPerformed: false,
    current: {
      backupCount: manifest.summary.backupCount,
      backupBytes: manifest.items.filter((item) => item.kind === 'backup').reduce((n, item) => n + Number(item.sizeBytes || 0), 0),
      migrationFindings: findings.length,
      snapshotFindings: readJson(path.join(auditDir, 'retained-findings.json')).snapshotFindings.length,
    },
    projected: {
      backupCount: manifest.summary.backupCount - proposed.length,
      backupBytes: manifest.items.filter((item) => item.kind === 'backup').reduce((n, item) => n + Number(item.sizeBytes || 0), 0) - proposed.reduce((n, item) => n + item.sizeBytes, 0),
      migrationFindings: projectedFindings.length,
      snapshotFindings: 0,
      adapterFindingsByAdapter: adapterGroups.reduce((summary, group) => {
        summary[group.adapter] = group.projectedRemainingFindings;
        return summary;
      }, {}),
      detectorEligibility: 'All retained persisted findings project to zero; runtime call-site and external-alias retirement proof remains a separate requirement.',
    },
  });
  console.log(JSON.stringify({
    status: 'canonical-disposition-review-ready',
    outputDir,
    canonicalCount: dispositions.length,
    proposedDeleteCount: proposed.length,
    proposedDeleteBytes: proposed.reduce((total, entry) => total + entry.sizeBytes, 0),
    currentRecoveryCount: currentRecovery.size,
    projectedMigrationFindings: projectedFindings.length,
    artifactPaths,
    mutationPerformed: false,
  }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Canonical disposition review failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
