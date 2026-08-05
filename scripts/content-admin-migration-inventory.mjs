#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const AFFECTED_LAYERS = Object.freeze([
  'active',
  'baseSnapshot',
  'seed',
  'revisions',
  'backups',
]);

const RETIRED_ROUTE_TOKENS = Object.freeze([
  '/services/legacy-giving',
  '/services/retirement/403b-for-groups',
  '/services/planned-giving/generosity-fund',
]);

const TARGET_BRIDGE_KEYS = new Set([
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
  'mappedSection',
  'targetedDynamic',
]);

const BLOCK_ONLY_PATHS = new Set([
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/charitable-trusts',
  '/services/planned-giving/endowments',
  '/services/planned-giving/donor-advised-fund',
  '/services/planned-giving/ministry-impact-fund',
]);

const RETIREMENT_403B_PATHS = new Set([
  '/services/retirement/403b',
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/403b/403b-group-enrollment',
  '/services/retirement/rollovers',
]);

const SOURCE_FILES = Object.freeze({
  context: 'src/context/ContentAdminContext.jsx',
  store: 'dev-server/contentAdminStore.js',
  migrations: 'src/lib/contentAdminSnapshotMigrations.js',
  normalization: 'src/lib/contentAdminNormalization.js',
  links: 'src/lib/linkValue.js',
  forms: 'src/blocks/foundation/forms.js',
});

function finding(adapter, descriptor, layer, location, detail) {
  return {
    adapter,
    record: descriptor.label,
    layer,
    ...location,
    detail,
  };
}

function walk(value, visitor, pathParts = []) {
  visitor(value, pathParts);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  Object.entries(value).forEach(([key, entry]) => walk(entry, visitor, [...pathParts, key]));
}

function stateRoots(record, descriptor) {
  if (descriptor.type === 'seed') {
    return [{ layer: 'seed', rootName: 'seedState', state: record?.seedState }];
  }
  return [
    { layer: 'active', rootName: 'state', state: record?.state },
    { layer: 'baseSnapshot', rootName: 'baseSnapshot', state: record?.baseSnapshot },
  ];
}

function blockLocations(state) {
  return Object.entries(state?.blocksByPath || {}).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : []).map((block, blockIndex) => ({
      pathname,
      block,
      blockIndex,
      blockId: String(block?.id || '').trim(),
    }))
  ));
}

function revisionLocations(record) {
  return Object.entries(record?.revisionsByPath || {}).flatMap(([pathname, revisions]) => (
    (Array.isArray(revisions) ? revisions : []).flatMap((revision, revisionIndex) => (
      (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [])
        .map((block, blockIndex) => ({
          pathname,
          block,
          blockIndex,
          blockId: String(block?.id || '').trim(),
          revisionId: String(revision?.id || '').trim(),
          revisionIndex,
        }))
    ))
  ));
}

function blockFindings(state) {
  return blockLocations(state).flatMap(({ pathname, block, blockIndex, blockId }) => (
    [{ pathname, block, blockIndex, blockId, revisionId: null }]
  ));
}

function detectAcrossBlocks(adapter, descriptor, layer, state, predicate) {
  return blockFindings(state)
    .filter(predicate)
    .map(({ pathname, block, blockIndex, blockId, revisionId }) => finding(
      adapter,
      descriptor,
      layer,
      { pathname, blockId, blockIndex, revisionId },
      block,
    ));
}

function detectAcrossRevisions(adapter, descriptor, predicate) {
  return revisionLocations(descriptor.type === 'seed' ? {} : descriptor.record)
    .filter(predicate)
    .map(({ pathname, block, blockIndex, blockId, revisionId, revisionIndex }) => finding(
      adapter,
      descriptor,
      'revisions',
      { pathname, blockId, blockIndex, revisionId, revisionIndex },
      block,
    ));
}

function detectRetiredPathReferences({ adapter, descriptor, record }) {
  const findings = [];
  stateRoots(record, descriptor).forEach(({ layer, state }) => {
    ['pageHierarchy', 'blocksByPath', 'collaborationByPath'].forEach((source) => {
      Object.keys(state?.[source] || {}).forEach((pathname) => {
        if (RETIRED_ROUTE_TOKENS.some((token) => pathname.includes(token))) {
          findings.push(finding(adapter, descriptor, layer, { pathname, source }, 'retired content-bearing route key'));
        }
      });
    });
    walk(state?.blocksByPath, (value, pathParts) => {
      if (typeof value !== 'string') {
        return;
      }
      const token = RETIRED_ROUTE_TOKENS.find((candidate) => value.includes(candidate));
      if (token) {
        findings.push(finding(adapter, descriptor, layer, { source: 'blocksByPath', path: pathParts.join('.') }, token));
      }
    });
  });
  findings.push(...detectAcrossRevisions(adapter, { ...descriptor, record }, ({ pathname, block }) => (
    RETIRED_ROUTE_TOKENS.some((token) => pathname.includes(token))
      || JSON.stringify(block).includes('/services/legacy-giving')
  )));
  return findings;
}

function detectTargetBridge({ adapter, descriptor, record }) {
  const findings = [];
  stateRoots(record, descriptor).forEach(({ layer, state }) => {
    detectAcrossBlocks(adapter, descriptor, layer, state, ({ block }) => (
      Object.keys(block?.settings || {}).some((key) => TARGET_BRIDGE_KEYS.has(key))
    )).forEach((entry) => findings.push({ ...entry, detail: 'retired target bridge setting' }));
  });
  findings.push(...detectAcrossRevisions(adapter, { ...descriptor, record }, ({ block }) => (
    Object.keys(block?.settings || {}).some((key) => TARGET_BRIDGE_KEYS.has(key))
  )));
  return findings;
}

function detectBlockOnlyRepair({ adapter, descriptor, record }) {
  const findings = [];
  stateRoots(record, descriptor).forEach(({ layer, state }) => {
    detectAcrossBlocks(adapter, descriptor, layer, state, ({ pathname, block }) => (
      BLOCK_ONLY_PATHS.has(pathname)
      && (block?.kind === 'page_content' || block?.id === 'page_content')
    )).forEach((entry) => findings.push({ ...entry, detail: 'retired block-only page-content shell block' }));
  });
  findings.push(...detectAcrossRevisions(adapter, { ...descriptor, record }, ({ pathname, block }) => (
    BLOCK_ONLY_PATHS.has(pathname) && (block?.kind === 'page_content' || block?.id === 'page_content')
  )));
  return findings;
}

function detectGenerosityRefresh({ adapter, descriptor, record }) {
  return detectRetiredPathReferences({ adapter, descriptor, record });
}

function detectSplitLinkCompatibility({ adapter, descriptor, record }) {
  const predicate = ({ block }) => {
    const keys = Object.keys(block?.settings || {});
    return keys.some((key) => key.endsWith('PageRef'))
      || keys.some((key) => (
        key.endsWith('OpenInNewWindow')
        && keys.includes(`${key.slice(0, -'OpenInNewWindow'.length)}PageRef`)
      ));
  };
  return stateRoots(record, descriptor).flatMap(({ layer, state }) => (
    detectAcrossBlocks(adapter, descriptor, layer, state, predicate)
  )).concat(detectAcrossRevisions(adapter, { ...descriptor, record }, predicate));
}

const RETIREMENT_ADAPTERS = Object.freeze([
  {
    id: 'managed-path-aliases',
    category: 'compatibility-boundary',
    status: 'active',
    paths: Object.freeze([...RETIRED_ROUTE_TOKENS]),
    helpers: Object.freeze(['DEFAULT_MANAGED_PATH_ALIASES']),
    sourceFiles: Object.freeze([SOURCE_FILES.context]),
    sourceSymbols: Object.freeze(['DEFAULT_MANAGED_PATH_ALIASES']),
    detect: detectRetiredPathReferences,
    retireWhen: (report) => report.totalFindings === 0,
    retireWhenDescription: 'No active, seed, revision, or backup content-bearing route keys or links use retired paths; canonical redirects are confirmed externally.',
  },
  {
    id: 'block-only-page-inventory-reconciliation',
    category: 'snapshot-migration',
    status: 'active',
    paths: Object.freeze([...BLOCK_ONLY_PATHS]),
    helpers: Object.freeze(['shouldRetireBlockOnlyShellBlock', 'reconcileBlockOnlyManagedBlockInventory']),
    sourceFiles: Object.freeze([SOURCE_FILES.context]),
    sourceSymbols: Object.freeze(['shouldRetireBlockOnlyShellBlock', 'reconcileBlockOnlyManagedBlockInventory']),
    detect: detectBlockOnlyRepair,
    retireWhen: (report) => report.totalFindings === 0,
    retireWhenDescription: 'No active, seed, revision, or backup block-only route contains a retired shell-owned block shape.',
  },
  {
    id: 'generosity-fund-donor-advised-fund-refresh',
    category: 'snapshot-migration',
    status: 'active',
    paths: Object.freeze(['/services/planned-giving/donor-advised-fund', '/services/planned-giving', '/services']),
    helpers: Object.freeze(['normalizeGenerosityFundPageHierarchyEntry', 'normalizeGenerosityFundRouteLabelsInSettings', 'migrateGenerosityFundSnapshot']),
    sourceFiles: Object.freeze([SOURCE_FILES.context, SOURCE_FILES.store, SOURCE_FILES.migrations]),
    sourceSymbols: Object.freeze(['normalizeGenerosityFundPageHierarchyEntry', 'normalizeGenerosityFundRouteLabelsInSettings', 'migrateGenerosityFundSnapshot']),
    sourceRefs: Object.freeze([
      { file: SOURCE_FILES.context, symbols: Object.freeze(['normalizeGenerosityFundPageHierarchyEntry', 'normalizeGenerosityFundRouteLabelsInSettings']) },
      { file: SOURCE_FILES.store, symbols: Object.freeze(['normalizeGenerosityFundRouteLabelsInSettings']) },
      { file: SOURCE_FILES.migrations, symbols: Object.freeze(['migrateGenerosityFundSnapshot']) },
    ]),
    detect: detectGenerosityRefresh,
    retireWhen: (report) => report.totalFindings === 0,
    retireWhenDescription: 'No active, seed, revision, or backup snapshot contains the retired Generosity Fund route shape, title, or link labels.',
  },
  {
    id: 'retirement-403b-snapshot-repairs',
    category: 'snapshot-migration',
    status: 'retired',
    paths: Object.freeze([...RETIREMENT_403B_PATHS]),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([SOURCE_FILES.context]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan and current-schema restore proof; receipt: docs/content-admin-adapter-retirements/retirement-403b-snapshot-repairs.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-403b-snapshot-repairs.json',
  },
  {
    id: 'planned-giving-retired-static-comparison',
    category: 'snapshot-migration',
    status: 'retired',
    paths: Object.freeze(['/services/planned-giving']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/planned-giving-retired-static-comparison.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/planned-giving-retired-static-comparison.json',
  },
  {
    id: 'retirement-ira-block-shape',
    category: 'snapshot-migration',
    status: 'retired',
    paths: Object.freeze(['/services/retirement/iras']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/retirement-ira-block-shape.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-ira-block-shape.json',
  },
  {
    id: 'loans-dynamic-block-upgrade',
    category: 'snapshot-migration',
    status: 'retired',
    paths: Object.freeze(['/services/loans']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([SOURCE_FILES.context]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/loans-dynamic-block-upgrade.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/loans-dynamic-block-upgrade.json',
  },
  {
    id: 'property-casualty-request-repair',
    category: 'snapshot-migration',
    status: 'retired',
    paths: Object.freeze(['/services/insurance/property-casualty-insurance']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([SOURCE_FILES.context]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/property-casualty-request-repair.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/property-casualty-request-repair.json',
  },
  {
    id: 'target-bridge-snapshot-cleanup',
    category: 'snapshot-migration',
    status: 'active',
    paths: Object.freeze(['all managed routes']),
    helpers: Object.freeze(['stripRetiredTargetBridgeSettingsFromState']),
    sourceFiles: Object.freeze([SOURCE_FILES.migrations]),
    sourceSymbols: Object.freeze(['stripRetiredTargetBridgeSettingsFromState']),
    detect: detectTargetBridge,
    retireWhen: (report) => report.totalFindings === 0,
    retireWhenDescription: 'No active, seed, revision, or backup settings contain retired target bridge fields.',
  },
  {
    id: 'split-link-compatibility',
    category: 'compatibility-boundary',
    status: 'active',
    paths: Object.freeze(['all managed routes']),
    helpers: Object.freeze(['normalizeSplitLinkFieldSettings', 'coerceLinkValueFromFields']),
    sourceFiles: Object.freeze([SOURCE_FILES.normalization, SOURCE_FILES.links]),
    sourceSymbols: Object.freeze(['normalizeSplitLinkFieldSettings']),
    sourceRefs: Object.freeze([
      { file: SOURCE_FILES.normalization, symbols: Object.freeze(['normalizeSplitLinkFieldSettings']) },
      { file: SOURCE_FILES.links, symbols: Object.freeze(['normalizeSplitLinkFieldSettings', 'coerceLinkValueFromFields']) },
    ]),
    detect: detectSplitLinkCompatibility,
    retireWhen: (report) => report.totalFindings === 0,
    retireWhenDescription: 'No persisted block settings or revision snapshots contain split URL/PageRef/OpenInNewWindow fields.',
  },
  {
    id: 'cta-form-slot-compatibility',
    category: 'compatibility-boundary',
    status: 'retired',
    paths: Object.freeze(['all cta_form blocks']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([SOURCE_FILES.context, SOURCE_FILES.normalization, SOURCE_FILES.forms]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/cta-form-slot-compatibility.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/cta-form-slot-compatibility.json',
  },
  {
    id: 'cga-secure-act-content-compatibility',
    category: 'content-migration',
    status: 'retired',
    paths: Object.freeze(['/services/planned-giving/charitable-gift-annuities']),
    helpers: Object.freeze([]),
    sourceFiles: Object.freeze([]),
    sourceSymbols: Object.freeze([]),
    detect: () => [],
    retireWhen: () => true,
    retireWhenDescription: 'Retired after the final zero-finding scan; receipt: docs/content-admin-adapter-retirements/cga-secure-act-content-compatibility.json.',
    retirementReceipt: 'docs/content-admin-adapter-retirements/cga-secure-act-content-compatibility.json',
  },
]);

export const CONTENT_ADMIN_MIGRATION_ADAPTERS = Object.freeze(
  RETIREMENT_ADAPTERS.map((entry) => Object.freeze({
    ...entry,
    affectedLayers: AFFECTED_LAYERS,
  })),
);
export const CONTENT_ADMIN_MIGRATION_AFFECTED_LAYERS = AFFECTED_LAYERS;

export function getContentAdminMigrationAdapterInventory() {
  return CONTENT_ADMIN_MIGRATION_ADAPTERS;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function listRecordDescriptors({ includeBackups = false } = {}) {
  const descriptors = [
    { label: 'shared', relativePath: 'dev-data/content-admin-shared.json', type: 'shared' },
    { label: 'seed-baseline', relativePath: 'dev-data/content-admin-seed-baseline.json', type: 'seed' },
  ];
  if (includeBackups) {
    const backupRoot = path.resolve(repoRoot, 'dev-data/backups');
    if (existsSync(backupRoot)) {
      readdirSync(backupRoot).filter((fileName) => fileName.endsWith('.json')).sort().forEach((fileName) => {
        descriptors.push({ label: `backup:${fileName}`, relativePath: `dev-data/backups/${fileName}`, type: 'shared' });
      });
    }
  }
  return descriptors;
}

function sourceInventoryFindings() {
  const findings = [];
  CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((entry) => {
    const sourceRefs = entry.sourceRefs || entry.sourceFiles.map((relativePath) => ({
      file: relativePath,
      symbols: entry.sourceSymbols,
    }));
    sourceRefs.forEach(({ file: relativePath, symbols }) => {
      const absolutePath = path.resolve(repoRoot, relativePath);
      if (!existsSync(absolutePath)) {
        findings.push({ type: 'missing-source-file', adapter: entry.id, file: relativePath });
        return;
      }
      const text = readFileSync(absolutePath, 'utf8');
      symbols.forEach((symbol) => {
        if (!new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`).test(text)) {
          findings.push({ type: 'missing-source-symbol', adapter: entry.id, file: relativePath, symbol });
        }
      });
    });
  });
  return findings;
}

export function runContentAdminMigrationInventory({ includeBackups = false } = {}) {
  const sourceFindings = sourceInventoryFindings();
  const records = listRecordDescriptors({ includeBackups });
  const findingsByAdapter = Object.fromEntries(
    CONTENT_ADMIN_MIGRATION_ADAPTERS.map((entry) => [entry.id, []]),
  );
  records.forEach((descriptor) => {
    const raw = readJson(descriptor.relativePath);
    const record = raw?.record && typeof raw.record === 'object' ? raw.record : raw;
    CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((entry) => {
      findingsByAdapter[entry.id].push(...entry.detect({
        adapter: entry.id,
        descriptor,
        record,
      }));
    });
  });
  const reports = CONTENT_ADMIN_MIGRATION_ADAPTERS.map((entry) => {
    const findings = findingsByAdapter[entry.id];
    const report = {
      adapter: entry.id,
      category: entry.category,
      status: entry.status,
      affectedLayers: AFFECTED_LAYERS,
      totalFindings: findings.length,
      findings,
    };
    return {
      ...report,
      eligibleForRetirement: entry.retireWhen(report),
      retireWhen: entry.retireWhenDescription,
    };
  });

  return {
    records,
    sourceFindings,
    reports,
    totalFindings: reports.reduce((total, report) => total + report.totalFindings, 0),
  };
}

export function getSnapshotLayerManifest({ includeBackups = false } = {}) {
  const paths = [
    'dev-data/content-admin-shared.json',
    'dev-data/content-admin-seed-baseline.json',
  ];
  if (includeBackups) {
    const backupRoot = path.resolve(repoRoot, 'dev-data/backups');
    if (existsSync(backupRoot)) {
      readdirSync(backupRoot).filter((fileName) => fileName.endsWith('.json')).forEach((fileName) => {
        paths.push(`dev-data/backups/${fileName}`);
      });
    }
  }
  return paths.map((relativePath) => {
    const stats = statSync(path.resolve(repoRoot, relativePath));
    return {
      relativePath,
      bytes: stats.size,
      updatedAt: stats.mtimeMs,
    };
  });
}

if (path.resolve(process.argv[1] || '') === __filename) {
  const includeBackups = process.argv.includes('--include-backups');
  const report = runContentAdminMigrationInventory({ includeBackups });
  const manifest = getSnapshotLayerManifest({ includeBackups });
  console.log('Content admin migration inventory');
  console.log(`Records scanned: ${report.records.length}`);
  console.log(`Snapshot files: ${manifest.length}`);
  console.log(`Source inventory findings: ${report.sourceFindings.length}`);
  report.reports.forEach((entry) => {
    console.log(`- ${entry.adapter}: ${entry.status}; findings=${entry.totalFindings}; retirementEligible=${entry.eligibleForRetirement}`);
    if (entry.totalFindings) {
      entry.findings.slice(0, 5).forEach((findingEntry) => {
        console.log(`  - ${findingEntry.record}:${findingEntry.layer}:${findingEntry.pathname || '(n/a)'}#${findingEntry.blockId || '(n/a)'}`);
      });
    }
  });
  if (report.sourceFindings.length) {
    report.sourceFindings.forEach((entry) => console.log(`- source ${entry.type}: ${entry.adapter} ${entry.file} ${entry.symbol || ''}`.trim()));
    process.exitCode = 1;
  }
}
