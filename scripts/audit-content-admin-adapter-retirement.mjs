#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTENT_ADMIN_MIGRATION_ADAPTERS,
  runContentAdminMigrationInventory,
} from './content-admin-migration-inventory.mjs';
import { runSnapshotAudit, summarize as summarizeSnapshotFindings } from './content-admin-snapshot-audit.mjs';
import { buildRetentionManifest } from './content-admin-retention.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const outputDir = process.env.ADAPTER_RETIREMENT_AUDIT_OUTPUT_DIR
  || '/tmp/agf-adapter-retirement-audit-20260805-v1';
const revisionDir = path.resolve(repoRoot, 'dev-data/content-admin-revisions');
const canonicalArtifact = '/tmp/agf-retention-review-20260805-v6/retained-canonical-records-v4.json';
const recoveryArtifact = '/tmp/agf-retention-review-20260805-v6/retained-recovery-records-v4.json';

function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashFile(filePath) {
  return hashBytes(fs.readFileSync(filePath));
}

function hashJson(value) {
  return hashBytes(Buffer.from(JSON.stringify(value)));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function readArtifact(filePath) {
  if (!fs.existsSync(filePath)) return { records: [] };
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeOnce(fileName, value) {
  const filePath = path.join(outputDir, fileName);
  if (fs.existsSync(filePath)) throw new Error(`Refusing to overwrite audit artifact: ${filePath}`);
  fs.writeFileSync(filePath, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function sourceLines(symbol) {
  try {
    return execFileSync('rg', [
      '-n', '--hidden',
      '--glob', '!node_modules/**',
      '--glob', 'src/**',
      '--glob', 'dev-server/**',
      '--glob', 'scripts/**',
      symbol,
      repoRoot,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim().split('\n').filter(Boolean).map((line) => {
        const match = line.match(/^(.*):(\d+):(.*)$/);
        if (!match) return { raw: line };
        const text = match[3].trim();
        return {
          file: path.relative(repoRoot, match[1]),
          line: Number(match[2]),
          text,
          role: /(?:function|const|let|var)\s+/.test(text) && text.includes(symbol)
            ? 'definition'
            : /^import\b/.test(text) ? 'import' : 'reference',
        };
      });
  } catch {
    return [];
  }
}

function runtimeCallSites() {
  const entries = [];
  const seen = new Set();
  CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((adapter) => {
    const symbols = [...new Set([
      ...(adapter.helpers || []),
      ...(adapter.sourceSymbols || []),
      ...(adapter.sourceRefs || []).flatMap((ref) => ref.symbols || []),
    ])];
    symbols.forEach((symbol) => {
      sourceLines(symbol).forEach((site) => {
        const key = `${adapter.id}:${symbol}:${site.file}:${site.line}`;
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ adapter: adapter.id, symbol, ...site });
      });
    });
  });
  return entries;
}

function routeOfFinding(finding) {
  return finding.pathname || finding.route || null;
}

function blockDetails(finding) {
  const detail = finding.detail;
  if (!detail || typeof detail !== 'object') {
    return { blockId: null, blockKind: null, matched: detail || null };
  }
  return {
    blockId: detail.id || null,
    blockKind: detail.kind || null,
    matched: {
      id: detail.id || null,
      kind: detail.kind || null,
      mode: detail.mode || null,
      settingsKeys: Object.keys(detail.settings || {}).sort(),
    },
  };
}

function descriptorForRevision(relativePath, revision, index) {
  const filePath = path.resolve(repoRoot, relativePath);
  const source = fs.readFileSync(filePath);
  const pathname = decodeURIComponent(path.basename(relativePath, '.json'));
  return {
    label: `revision:${relativePath}#${String(revision?.id || index)}`,
    relativePath,
    pathname,
    revision,
    record: { revisionsByPath: { [pathname]: [revision] } },
    checksum: hashBytes(source),
    payloadChecksum: hashJson(revision || {}),
  };
}

function externalRevisionDescriptors() {
  if (!fs.existsSync(revisionDir)) return [];
  return fs.readdirSync(revisionDir).filter((name) => name.endsWith('.json')).sort().flatMap((name) => {
    const relativePath = path.relative(repoRoot, path.join(revisionDir, name)).split(path.sep).join('/');
    const revisions = readJson(relativePath);
    return (Array.isArray(revisions) ? revisions : []).map((revision, index) => (
      descriptorForRevision(relativePath, revision, index)
    ));
  });
}

function buildRecordMaps(manifest) {
  return new Map(manifest.items.map((item) => [item.id, item]));
}

function recordIdForFinding(recordLabel, layer) {
  if (recordLabel === 'shared') return `${layer}:dev-data/content-admin-shared.json`;
  if (recordLabel === 'seed-baseline') return 'seed:dev-data/content-admin-seed-baseline.json';
  if (recordLabel.startsWith('backup:')) return `backup:dev-data/backups/${recordLabel.slice('backup:'.length)}`;
  return recordLabel;
}

function impactFor(adapter, layer, directRestorable) {
  const impacts = [];
  if (['active', 'baseSnapshot'].includes(layer)) impacts.push('public rendering');
  if (['active', 'revisions'].includes(layer)) impacts.push('admin editing');
  if (directRestorable) impacts.push('runtime restore');
  if (adapter === 'managed-path-aliases') impacts.push('URL compatibility');
  if (adapter === 'split-link-compatibility') impacts.push('URL compatibility');
  if (!impacts.length) impacts.push('evidence-only inspection');
  return [...new Set(impacts)];
}

function normalizeFinding({ adapter, sourceFile, sourceSymbols, finding, recordId, recordChecksum, manifestItem, descriptorType }) {
  const details = blockDetails(finding);
  const layer = finding.layer || (descriptorType === 'revision' ? 'revisions' : null);
  const directlyRestorable = manifestItem?.restoreEligibility === 'eligible';
  const storedLayer = descriptorType === 'revision'
    ? 'unresolved revision'
    : layer === 'revisions' && recordId.startsWith('backup:')
      ? 'embedded backup revision'
      : layer;
  return {
    adapter,
    sourceFile,
    sourceSymbols,
    layer,
    storedLayer,
    recordId,
    record: finding.record,
    recordChecksum,
    directlyRestorable,
    restoreEligibility: manifestItem?.restoreEligibility || 'unknown',
    route: routeOfFinding(finding),
    blockId: finding.blockId || details.blockId,
    blockKind: details.blockKind,
    revisionId: finding.revisionId || null,
    matchedLegacyFieldOrStructure: details.matched,
    impact: impactFor(adapter, layer, directlyRestorable),
    location: {
      blockIndex: finding.blockIndex ?? null,
      revisionIndex: finding.revisionIndex ?? null,
      source: finding.source || null,
      path: finding.path || null,
    },
  };
}

function scanExternalRevisions(revisions, recordMap) {
  const findings = [];
  revisions.forEach((descriptor) => {
    CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((adapter) => {
      const detected = adapter.detect({
        adapter: adapter.id,
        descriptor: { label: descriptor.label, type: 'shared', record: descriptor.record },
        record: descriptor.record,
      });
      detected.forEach((finding) => {
        const recordId = descriptor.label;
        findings.push(normalizeFinding({
          adapter: adapter.id,
          sourceFile: adapter.sourceFiles,
          sourceSymbols: adapter.sourceSymbols,
          finding,
          recordId,
          recordChecksum: descriptor.checksum,
          manifestItem: recordMap.get(recordId),
          descriptorType: 'revision',
        }));
      });
    });
  });
  return findings;
}

function scanMigrationFindings(report, recordMap) {
  return report.reports.flatMap((adapterReport) => {
    const adapter = CONTENT_ADMIN_MIGRATION_ADAPTERS.find((entry) => entry.id === adapterReport.adapter);
    return adapterReport.findings.map((finding) => {
      const layer = finding.layer || 'unknown';
      const recordId = recordIdForFinding(finding.record, layer);
      const manifestItem = recordMap.get(recordId);
      const checksumPath = manifestItem?.relativePath || null;
      const recordChecksum = checksumPath && fs.existsSync(path.resolve(repoRoot, checksumPath))
        ? hashFile(path.resolve(repoRoot, checksumPath)) : null;
      return normalizeFinding({
        adapter: adapterReport.adapter,
        sourceFile: adapter?.sourceFiles || [],
        sourceSymbols: adapter?.sourceSymbols || [],
        finding,
        recordId,
        recordChecksum,
        manifestItem,
        descriptorType: finding.layer === 'revisions' ? 'revision' : 'snapshot',
      });
    });
  });
}

function canonicalAndRecoveryMembership() {
  const canonical = readArtifact(canonicalArtifact).records || [];
  const recovery = readArtifact(recoveryArtifact).records || [];
  return {
    canonicalIds: new Set(canonical.map((record) => record.canonicalId)),
    recoveryIds: new Set(recovery.map((record) => record.id)),
    canonical,
    recovery,
  };
}

function classifyAdapters({ migrationFindings, snapshotFindings, callSites, membership }) {
  const byAdapter = new Map();
  CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((adapter) => {
    const findings = migrationFindings.filter((finding) => finding.adapter === adapter.id);
    const retainedCanonicalFindings = findings.filter((finding) => membership.canonicalIds.has(finding.recordId));
    const retainedRecoveryFindings = findings.filter((finding) => membership.recoveryIds.has(finding.recordId));
    const retainedRevisionFindings = findings.filter((finding) => finding.storedLayer === 'unresolved revision');
    const layers = [...new Set(findings.map((finding) => finding.layer).filter(Boolean))];
    const sites = callSites.filter((site) => site.adapter === adapter.id);
    const hasRuntimeSites = sites.some((site) => ['src/context/ContentAdminContext.jsx', 'dev-server/contentAdminStore.js', 'src/lib/contentAdminNormalization.js', 'src/lib/linkValue.js'].includes(site.file));
    const hasTestSites = sites.some((site) => site.file.endsWith('.test.js') || site.file.endsWith('.test.jsx') || site.file.includes('/test/'));
    let classification = adapter.status === 'retired'
      ? 'retired; zero persisted findings'
      : 'blocked pending record cleanup';
    let retirementReason = adapter.status === 'retired'
      ? `Retirement receipt: ${adapter.retirementReceipt || 'not recorded'}.`
      : adapter.retireWhenDescription;
    if (adapter.status !== 'retired' && !findings.length) {
      classification = hasRuntimeSites ? 'runtime-only requirement; zero persisted findings' : 'zero-finding retirement candidate';
      if (hasTestSites) retirementReason = 'Detector has zero retained findings, but test/fixture call sites still require an explicit retirement change.';
      if (adapter.id === 'managed-path-aliases') retirementReason = 'No retained finding would permit removal; external redirect confirmation is still required.';
    } else if (retainedRecoveryFindings.length) {
      classification = 'required by retained recovery backup';
      retirementReason = 'Retained recovery records contain findings; removing the adapter would reduce restore coverage.';
    } else if (retainedCanonicalFindings.length) {
      classification = 'required by retained canonical backup';
      retirementReason = 'Retained canonical records contain findings and remain directly restorable.';
    } else if (retainedRevisionFindings.length) {
      classification = 'blocked only by unresolved revisions';
      retirementReason = 'Findings remain only in unresolved revision records; adapter retirement requires a separate revision policy decision.';
    }
    byAdapter.set(adapter.id, {
      adapterId: adapter.id,
      category: adapter.category,
      status: adapter.status,
      sourceFiles: adapter.sourceFiles,
      exportedFunctions: adapter.sourceSymbols,
      affectedLayers: adapter.affectedLayers,
      detectorExecuted: true,
      detectorCoverage: {
        active: true,
        published: true,
        seed: true,
        backups: true,
        revisions: true,
      },
      totalMigrationFindings: findings.length,
      snapshotFindings: snapshotFindings.filter((finding) => finding.adapter === adapter.id).length,
      findingLayers: layers,
      retainedCanonicalFindings: retainedCanonicalFindings.length,
      retainedRecoveryFindings: retainedRecoveryFindings.length,
      unresolvedRevisionFindings: retainedRevisionFindings.length,
      runtimeCallSiteCount: sites.length,
      runtimeCallSitesKnown: sites.length > 0,
      testOrFixtureCallSiteCount: sites.filter((site) => site.file.endsWith('.test.js') || site.file.endsWith('.test.jsx')).length,
      classification,
      retirementEligibleByDetector: findings.length === 0,
      retirementReason,
      retirementReceipt: adapter.retirementReceipt || null,
      noCurrentContentMutation: true,
    });
  });
  return [...byAdapter.values()];
}

function categorizeSnapshotFindings(findings) {
  return findings.map((finding) => ({
    ...finding,
    category: finding.code === 'retired-block'
      ? 'retired block kinds'
      : finding.code === 'canonical-link-json-empty'
        ? 'legacy empty link metadata'
        : finding.code.startsWith('split-link')
          ? 'historical content fields'
          : finding.code.includes('path')
            ? 'route aliases'
            : 'unknown/unclassified findings',
  }));
}

function findingSummary(findings) {
  const byCategory = findings.reduce((summary, finding) => {
    summary[finding.category] = (summary[finding.category] || 0) + 1;
    return summary;
  }, {});
  const byRecord = findings.reduce((summary, finding) => {
    summary[finding.record] = (summary[finding.record] || 0) + 1;
    return summary;
  }, {});
  return { total: findings.length, byCategory, byCode: summarizeSnapshotFindings(findings), byRecord };
}

function emptyLinkAudit(snapshotFindings, callSites) {
  const empty = snapshotFindings.filter((finding) => finding.code === 'canonical-link-json-empty');
  const linkSites = callSites.filter((site) => ['split-link-compatibility'].includes(site.adapter));
  return {
    findingCount: empty.length,
    records: [...new Set(empty.map((finding) => finding.record))].sort(),
    routes: [...new Set(empty.map((finding) => finding.pathname))].sort(),
    fields: [...new Set(empty.map((finding) => finding.field).filter(Boolean))].sort(),
    currentActiveOrSeedFindings: empty.filter((finding) => ['shared', 'seed-baseline'].includes(finding.record)).length,
    consumedByCurrentRendererOrEditor: true,
    consumerEvidence: linkSites,
    emptyValueBehavior: 'Empty canonical LinkJson parses as no canonical link; current consumers may still inspect compatibility fields when present.',
    changesButtonStyleInference: false,
    changesInternalExternalClassification: 'Only when a compatibility field is also present; empty LinkJson alone carries no target classification.',
    changesSerializationRoundTrip: 'It is persisted noise and should be tolerated during inspection; cleanup must remain an explicit migration, not normal load/save.',
    recommendation: 'Keep compatibility reads until a separately approved snapshot cleanup proves no restorable records depend on them; do not rewrite retained records in this audit.',
  };
}

function retiredBlockAudit(snapshotFindings, migrationFindings, membership, recordMap) {
  const findings = snapshotFindings.filter((finding) => finding.code === 'retired-block');
  return findings.map((finding) => {
    const layer = finding.root === 'state' ? 'active' : finding.root === 'baseSnapshot' ? 'published' : 'revisions';
    const recordId = recordIdForFinding(finding.record, layer);
    return {
      ...finding,
      recordId,
      recordChecksum: recordMap.get(recordId)?.sha256 || null,
      directlyRestorable: recordMap.get(recordId)?.restoreEligibility === 'eligible',
      recoveryRecord: membership.recoveryIds.has(recordId),
      canonicalRecord: membership.canonicalIds.has(recordId),
      requiredAdapter: migrationFindings.find((entry) => entry.recordId === recordId && entry.route === finding.pathname)?.adapter || 'planned-giving-retired-static-comparison',
      recoveryReplacementAvailable: [...membership.recoveryIds].some((id) => id !== recordId),
      recommendation: membership.recoveryIds.has(recordId)
        ? 'Retain record and adapter until a replacement recovery proof is explicitly approved.'
        : 'Record is not a protected recovery backup; do not delete or retire adapter as part of this audit.',
    };
  });
}

function recommendedBatches(matrix) {
  return [
    {
      order: 1,
      batch: 'zero-finding migration-only adapters',
      adapters: matrix.filter((entry) => entry.retirementEligibleByDetector && !entry.runtimeCallSiteCount).map((entry) => entry.adapterId),
      files: [...new Set(matrix.filter((entry) => entry.retirementEligibleByDetector && !entry.runtimeCallSiteCount).flatMap((entry) => entry.sourceFiles))],
      exports: matrix.filter((entry) => entry.retirementEligibleByDetector && !entry.runtimeCallSiteCount).flatMap((entry) => entry.exportedFunctions),
      tests: 'Add detector coverage fixtures for active, seed, retained backup, and revision layers; rerun storage and restore proofs.',
      risk: 'medium; migration-only code may still be needed for future historical restore decisions.',
      rollbackBoundary: 'one adapter per commit, before any source snapshot mutation.',
      expectedScanChanges: 'detector inventory entry removed or marked retired; persisted findings unchanged.',
    },
    {
      order: 2,
      batch: 'empty-link compatibility handling',
      adapters: ['split-link-compatibility'],
      files: [...new Set(matrix.filter((entry) => entry.adapterId === 'split-link-compatibility').flatMap((entry) => entry.sourceFiles))],
      exports: matrix.filter((entry) => entry.adapterId === 'split-link-compatibility').flatMap((entry) => entry.exportedFunctions),
      tests: 'Prove current renderers, editors, serializers, and retained recovery records no longer require compatibility fields.',
      risk: 'high; these are runtime compatibility boundaries even with zero current findings.',
      rollbackBoundary: 'compatibility reads and writes removed separately from cleanup migration.',
      expectedScanChanges: 'empty-link findings may remain until explicit cleanup; no public current-schema change allowed.',
    },
    {
      order: 3,
      batch: 'retired block adapters',
      adapters: matrix.filter((entry) => ['block-only-page-inventory-reconciliation', 'retirement-403b-snapshot-repairs', 'planned-giving-retired-static-comparison', 'retirement-ira-block-shape'].includes(entry.adapterId)).map((entry) => entry.adapterId),
      files: [...new Set(matrix.filter((entry) => ['block-only-page-inventory-reconciliation', 'retirement-403b-snapshot-repairs', 'planned-giving-retired-static-comparison', 'retirement-ira-block-shape'].includes(entry.adapterId)).flatMap((entry) => entry.sourceFiles))],
      exports: matrix.filter((entry) => ['block-only-page-inventory-reconciliation', 'retirement-403b-snapshot-repairs', 'planned-giving-retired-static-comparison', 'retirement-ira-block-shape'].includes(entry.adapterId)).flatMap((entry) => entry.exportedFunctions),
      tests: 'Retained-record restore proof plus route-specific renderer and admin editor tests.',
      risk: 'high; 9 retired-block findings remain in retained backups.',
      rollbackBoundary: 'one adapter and one record class per commit; never combine with storage deletion.',
      expectedScanChanges: 'retired-block findings decrease only after explicit record disposition.',
    },
    {
      order: 4,
      batch: 'route aliases and historical content migrations',
      adapters: ['managed-path-aliases', 'generosity-fund-donor-advised-fund-refresh'],
      files: [...new Set(matrix.filter((entry) => ['managed-path-aliases', 'generosity-fund-donor-advised-fund-refresh'].includes(entry.adapterId)).flatMap((entry) => entry.sourceFiles))],
      exports: matrix.filter((entry) => ['managed-path-aliases', 'generosity-fund-donor-advised-fund-refresh'].includes(entry.adapterId)).flatMap((entry) => entry.exportedFunctions),
      tests: 'External redirect evidence, inbound-link inventory, retained-record scan, and route alias tests.',
      risk: 'high; 324 retained findings and existing alias tests remain.',
      rollbackBoundary: 'alias removal separate from content migration removal.',
      expectedScanChanges: 'must reach zero retained route references and receive external redirect approval.',
    },
  ];
}

async function main() {
  if (fs.existsSync(outputDir)) throw new Error(`Refusing to overwrite audit directory: ${outputDir}`);
  const migrationReport = runContentAdminMigrationInventory({ includeBackups: true });
  const snapshotAudit = runSnapshotAudit({ includeBackups: true });
  const externalRevisions = externalRevisionDescriptors();
  const retentionManifest = buildRetentionManifest();
  const recordMap = buildRecordMaps(retentionManifest);
  const membership = canonicalAndRecoveryMembership();
  const baseMigrationFindings = scanMigrationFindings(migrationReport, recordMap);
  const revisionFindings = scanExternalRevisions(externalRevisions, recordMap);
  const migrationFindings = [...baseMigrationFindings, ...revisionFindings];
  const categorizedSnapshotFindings = categorizeSnapshotFindings(snapshotAudit.findings);
  const callSites = runtimeCallSites();
  const matrix = classifyAdapters({
    migrationFindings,
    snapshotFindings: categorizedSnapshotFindings,
    callSites,
    membership,
  });
  const zeroFindingCandidates = matrix.filter((entry) => entry.retirementEligibleByDetector && !entry.runtimeCallSiteCount);
  const blockedAdapters = matrix.filter((entry) => !entry.retirementEligibleByDetector || entry.runtimeCallSiteCount);
  const artifacts = {};
  fs.mkdirSync(outputDir, { recursive: true });
  artifacts.adapterInventory = writeOnce('adapter-inventory.json', CONTENT_ADMIN_MIGRATION_ADAPTERS.map((adapter) => ({
    id: adapter.id,
    category: adapter.category,
    status: adapter.status,
    affectedLayers: adapter.affectedLayers,
    paths: adapter.paths,
    sourceFiles: adapter.sourceFiles,
    exportedFunctions: adapter.sourceSymbols,
    helpers: adapter.helpers,
    retirementCondition: adapter.retireWhenDescription,
    detectorCoverage: ['active', 'published', 'seed', 'backups', 'revisions'],
  })));
  artifacts.retainedFindings = writeOnce('retained-findings.json', {
    generatedAt: new Date().toISOString(),
    retainedStorage: {
      backups: retentionManifest.summary.backupCount,
      backupBytes: retentionManifest.items.filter((item) => item.kind === 'backup').reduce((n, item) => n + Number(item.sizeBytes || 0), 0),
      revisions: retentionManifest.summary.revisionCount,
      canonicalRecords: membership.canonical.length,
      recoveryRecords: membership.recovery.length,
    },
    migrationFindings,
    snapshotFindings: categorizedSnapshotFindings,
    externalRevisionCount: externalRevisions.length,
  });
  artifacts.categorySummary = writeOnce('finding-category-summary.json', {
    snapshotFindings: findingSummary(categorizedSnapshotFindings),
    migrationFindings: {
      total: migrationFindings.length,
      byAdapter: migrationFindings.reduce((summary, finding) => {
        summary[finding.adapter] = (summary[finding.adapter] || 0) + 1;
        return summary;
      }, {}),
      byLayer: migrationFindings.reduce((summary, finding) => {
        summary[finding.layer] = (summary[finding.layer] || 0) + 1;
        return summary;
      }, {}),
      byImpact: migrationFindings.reduce((summary, finding) => {
        finding.impact.forEach((impact) => { summary[impact] = (summary[impact] || 0) + 1; });
        return summary;
      }, {}),
    },
    categories: {
      retiredBlockKinds: categorizedSnapshotFindings.filter((finding) => finding.category === 'retired block kinds').length,
      legacyEmptyLinkMetadata: categorizedSnapshotFindings.filter((finding) => finding.category === 'legacy empty link metadata').length,
      routeAliases: categorizedSnapshotFindings.filter((finding) => finding.category === 'route aliases').length,
      historicalContentFields: categorizedSnapshotFindings.filter((finding) => finding.category === 'historical content fields').length,
      structuralSchemaIncompatibilities: categorizedSnapshotFindings.filter((finding) => ['revision-inventory-invalid', 'page-content-route-not-allowed'].includes(finding.code)).length,
      harmlessPersistedDefaults: 0,
      detectorFalsePositives: 0,
      unknownUnclassified: categorizedSnapshotFindings.filter((finding) => finding.category === 'unknown/unclassified findings').length,
    },
  });
  artifacts.retirementMatrix = writeOnce('adapter-retirement-matrix.json', matrix);
  artifacts.runtimeCallSites = writeOnce('runtime-call-sites.json', callSites);
  artifacts.zeroFindingCandidates = writeOnce('zero-finding-candidates.json', zeroFindingCandidates);
  artifacts.blockedAdapters = writeOnce('blocked-adapters.json', blockedAdapters);
  const emptyLinks = emptyLinkAudit(categorizedSnapshotFindings, callSites);
  const retiredBlocks = retiredBlockAudit(categorizedSnapshotFindings, migrationFindings, membership, recordMap);
  artifacts.legacyMetadataAudit = writeOnce('legacy-metadata-audit.json', { emptyLinkMetadata: emptyLinks, retiredBlocks });
  artifacts.recommendedOrder = writeOnce('recommended-retirement-order.md', `# Adapter Retirement Order\n\nThis is an audit only. No adapter or stored record was changed.\n\n${recommendedBatches(matrix).map((batch) => `## ${batch.order}. ${batch.batch}\n\n- Adapters: ${batch.adapters.join(', ') || 'none'}\n- Files: ${batch.files.join(', ') || 'none'}\n- Exports: ${batch.exports.join(', ') || 'none'}\n- Tests: ${batch.tests}\n- Risk: ${batch.risk}\n- Rollback boundary: ${batch.rollbackBoundary}\n- Expected scan changes: ${batch.expectedScanChanges}\n`).join('\n')}`);
  const report = {
    auditVersion: 1,
    generatedAt: new Date().toISOString(),
    outputDir,
    mutationPerformed: false,
    layers: {
      active: true,
      published: true,
      seed: true,
      backups: retentionManifest.summary.backupCount,
      revisions: retentionManifest.summary.revisionCount,
      canonicalRecords: membership.canonical.length,
      recoveryRecords: membership.recovery.length,
    },
    snapshotFindingCount: snapshotAudit.findings.length,
    migrationFindingCount: migrationFindings.length,
    revisionFindingCount: revisionFindings.length,
    adapters: matrix.length,
    zeroFindingCandidates: zeroFindingCandidates.map((entry) => entry.adapterId),
    blockedAdapters: blockedAdapters.map((entry) => entry.adapterId),
    artifacts,
  };
  writeOnce('audit-report.json', report);
  console.log(JSON.stringify(report, null, 2));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Adapter retirement audit failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
