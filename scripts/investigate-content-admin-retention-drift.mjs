#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const sharedPath = path.resolve(repoRoot, 'dev-data/content-admin-shared.json');
const seedPath = path.resolve(repoRoot, 'dev-data/content-admin-seed-baseline.json');
const revisionsPath = path.resolve(repoRoot, 'dev-data/content-admin-revisions');
const reviewPath = '/tmp/agf-retention-review-20260805-v4/before-manifest-v3.json';
const outputDir = process.env.DRIFT_OUTPUT_DIR || '/tmp/agf-retention-drift-investigation-20260805-v1';
const outputPath = path.join(outputDir, 'drift-report-v1.json');
const diffOutputPath = path.join(outputDir, 'reviewed-vs-current-diff-v1.json');

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function hashValue(value) {
  return hashBytes(Buffer.from(JSON.stringify(sortKeys(value))));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readStableJson(filePath) {
  const firstBytes = fs.readFileSync(filePath);
  const firstHash = hashBytes(firstBytes);
  const value = JSON.parse(firstBytes.toString('utf8'));
  const secondHash = hashBytes(fs.readFileSync(filePath));
  return { value, firstHash, secondHash, stable: firstHash === secondHash };
}

function withoutCollaboration(state) {
  const next = clone(state || {});
  delete next.collaborationByPath;
  return next;
}

function ownershipLayer(record) {
  return {
    state: record?.state?.collaborationByPath || {},
    baseSnapshot: record?.baseSnapshot?.collaborationByPath || {},
    updatedAt: record?.updatedAt || 0,
    announcementUpdatedAt: record?.announcementUpdatedAt || 0,
    initialized: Boolean(record?.initialized),
    version: record?.version || null,
    snapshotMigrations: record?.snapshotMigrations || null,
  };
}

function listExternalRevisions() {
  if (!fs.existsSync(revisionsPath)) return {};
  return Object.fromEntries(fs.readdirSync(revisionsPath)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => [decodeURIComponent(fileName.slice(0, -5)), readJson(path.join(revisionsPath, fileName))]));
}

function diffValues(before, after, field = '', output = []) {
  if (Object.is(before, after)) return output;
  if (before && after && typeof before === 'object' && typeof after === 'object'
    && !Array.isArray(before) && !Array.isArray(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      diffValues(before[key], after[key], field ? `${field}.${key}` : key, output);
    }
    return output;
  }
  output.push({ field, before: before ?? null, after: after ?? null });
  return output;
}

function blockMap(state, pathname) {
  return new Map((state?.blocksByPath?.[pathname] || [])
    .map((block) => [String(block?.id || '').trim(), block]));
}

function stateVsBaseDiff(record) {
  const routes = new Set([
    ...Object.keys(record?.state?.blocksByPath || {}),
    ...Object.keys(record?.baseSnapshot?.blocksByPath || {}),
  ]);
  return [...routes].sort().flatMap((pathname) => {
    const current = blockMap(record.state, pathname);
    const published = blockMap(record.baseSnapshot, pathname);
    const ids = new Set([...current.keys(), ...published.keys()]);
    return [...ids].sort().flatMap((blockId) => {
      const diffs = diffValues(current.get(blockId) || null, published.get(blockId) || null);
      return diffs.length ? [{ pathname, blockId, fields: diffs }] : [];
    });
  });
}

function latestKnownRevisionDiff(record, history, revisions, reviewGeneratedAt) {
  const publishEvents = history.filter((entry) => entry.createdAt > reviewGeneratedAt
    && ['block-published', 'page-published'].includes(entry.action));
  return publishEvents.map((event) => {
    const source = revisions[event.pathname] || [];
    const prior = [...source]
      .filter((revision) => Number(revision.createdAt || 0) <= reviewGeneratedAt)
      .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
    const priorBlocks = prior?.snapshot?.blocks || [];
    const currentBlock = record.state?.blocksByPath?.[event.pathname]
      ?.find((block) => String(block?.id || '').trim() === event.blockId);
    const priorBlock = priorBlocks.find((block) => String(block?.id || '').trim() === event.blockId);
    const fields = diffValues(priorBlock?.settings || null, currentBlock?.settings || null, 'settings');
    return {
      route: event.pathname,
      blockId: event.blockId,
      operation: event.action,
      actor: event.actor,
      operationAt: event.createdAt,
      priorRevision: prior ? {
        id: prior.id,
        createdAt: prior.createdAt,
        reason: prior.reason,
        summary: prior.summary,
      } : null,
      fieldsComparedToLastKnownPreReviewRevision: fields,
      exactReviewedFieldDiffAvailable: false,
    };
  });
}

function main() {
  if (fs.existsSync(outputPath)) throw new Error(`Refusing to overwrite ${outputPath}`);
  const reviewed = readJson(reviewPath);
  const sharedRead = readStableJson(sharedPath);
  const seedRead = readStableJson(seedPath);
  const record = sharedRead.value;
  const seed = seedRead.value;
  const history = Object.entries(record.state?.collaborationByPath || {})
    .flatMap(([pathname, entry]) => (entry.history || []).map((item) => ({ ...item, pathname })))
    .sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0));
  const revisions = listExternalRevisions();
  const reviewGeneratedAt = Number(reviewed.generatedAt || 0);
  const currentHashes = {
    rawSharedFile: sharedRead.firstHash,
    activeDraftContent: hashValue(withoutCollaboration(record.state)),
    activeDraftOwnership: hashValue(record.state?.collaborationByPath || {}),
    publishedBaseSnapshotContent: hashValue(withoutCollaboration(record.baseSnapshot)),
    publishedBaseSnapshotOwnership: hashValue(record.baseSnapshot?.collaborationByPath || {}),
    authorityMetadata: hashValue(ownershipLayer(record)),
    revisions: hashValue(revisions),
    seedContent: hashValue(seed.seedState),
    rawSeedFile: seedRead.firstHash,
  };
  const reviewedActive = reviewed.items.find((item) => item.kind === 'active') || null;
  const reviewedPublished = reviewed.items.find((item) => item.kind === 'published') || null;
  const reviewedSeed = reviewed.items.find((item) => item.kind === 'seed') || null;
  const postReviewHistory = history.filter((entry) => Number(entry.createdAt || 0) > reviewGeneratedAt);
  const publishEvents = postReviewHistory.filter((entry) => ['block-published', 'page-published'].includes(entry.action));
  const report = {
    reportVersion: 1,
    generatedAt: Date.now(),
    mutationPerformed: false,
    reviewedArtifact: {
      path: reviewPath,
      generatedAt: reviewGeneratedAt,
      activeRawFileSha256: reviewedActive?.sha256 || null,
      activeRecordContentSha256: reviewedActive?.contentSha256 || null,
      publishedRawFileSha256: reviewedPublished?.sha256 || null,
      publishedRecordContentSha256: reviewedPublished?.contentSha256 || null,
      seedRawFileSha256: reviewedSeed?.sha256 || null,
      separateStateBaseRevisionFingerprintsAvailable: false,
    },
    currentCapture: {
      sharedPath,
      seedPath,
      sharedReadStable: sharedRead.stable,
      seedReadStable: seedRead.stable,
      fileMtimeMs: fs.statSync(sharedPath).mtimeMs,
      recordUpdatedAt: record.updatedAt,
      hashes: currentHashes,
    },
    drift: {
      rawSharedFileHashChanged: reviewedActive?.sha256 !== currentHashes.rawSharedFile,
      occurredAfterReviewArtifact: Number(record.updatedAt || 0) > reviewGeneratedAt,
      routesWithPostReviewPublish: [...new Set(publishEvents.map((entry) => entry.pathname))].sort(),
      blockIdsWithPostReviewPublish: publishEvents.map((entry) => ({
        route: entry.pathname,
        blockId: entry.blockId,
        action: entry.action,
        createdAt: entry.createdAt,
        actor: entry.actor,
        details: entry.details,
      })),
      currentDraftVsPublished: stateVsBaseDiff(record),
      exactReviewedStateDiffAvailable: false,
      limitation: 'The v4 before manifest stored file and whole-record hashes, not materialized active/baseSnapshot state. Exact reviewed field values cannot be reconstructed from that artifact alone.',
    },
    operationAttribution: {
      classification: publishEvents.length ? 'explicit admin publish plus subsequent draft activity' : 'unattributed',
      postReviewHistory: postReviewHistory.map((entry) => ({
        route: entry.pathname,
        action: entry.action,
        blockId: entry.blockId,
        details: entry.details,
        actor: entry.actor,
        createdAt: entry.createdAt,
      })),
      publishEvents,
      latestKnownPreReviewRevisionDiff: latestKnownRevisionDiff(record, history, revisions, reviewGeneratedAt),
      startupWriteHazard: {
        source: 'dev-server/contentAdminStore.js:1810-1818',
        behavior: 'load() may create a backup and persist normalized state when parsed storage differs from normalized storage',
        observedReceipt: false,
        conclusion: 'possible architecture hazard, not the cause of this identified drift because the persisted history contains an explicit block-published receipt for /test/card_grid',
      },
    },
    authorityObservation: {
      processes: [
        { pid: 14579, bind: '127.0.0.1:5173', role: 'Vite dev server', serverInstanceObserved: '14579-1785956884033-83mwg6' },
        { pid: 77867, bind: '*:5173', role: 'second Vite dev server', serverInstanceObserved: null },
        { pid: 16917, bind: '127.0.0.1:5174', role: 'Vite dev server' },
        { pid: 21878, bind: '[::1]:4173', role: 'Vite preview server' },
      ],
      conclusion: 'More than one Vite process is bound to port 5173; the project did not have one unambiguous dev authority during the drift window.',
    },
    candidateSafety: {
      reviewedCandidateArtifact: '/tmp/agf-retention-review-20260805-v4/corrected-delete-candidates-v3.json',
      candidateFilesChanged: false,
      candidateSafetyAssumptionsChanged: 'The candidate files and their checksums were not changed, but the active/published content and authority fingerprint changed after review.',
      logicalDeletionSafety: 'not executable against the stale review; rerun preflight/review after the live authority is stabilized',
    },
  };
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(diffOutputPath, `${JSON.stringify({
    reportVersion: 1,
    generatedAt: report.generatedAt,
    mutationPerformed: false,
    reviewedArtifact: report.reviewedArtifact,
    currentCapture: report.currentCapture,
    exactReviewedStateDiffAvailable: report.drift.exactReviewedStateDiffAvailable,
    limitation: report.drift.limitation,
    provenOperationDiff: report.operationAttribution.latestKnownPreReviewRevisionDiff,
    currentDraftVsPublished: report.drift.currentDraftVsPublished,
    candidateSafety: report.candidateSafety,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, diffOutputPath, mutationPerformed: false, publishEvents: report.drift.blockIdsWithPostReviewPublish }, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  try {
    main();
  } catch (error) {
    console.error(`Retention drift investigation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
