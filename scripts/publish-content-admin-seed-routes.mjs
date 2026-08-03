#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  compareSeedRouteSlices,
  formatSeedRouteSliceDiffReport,
} from '../dev-server/seedRouteSliceComparison.js';

const DEFAULT_SHARED_FILE = 'dev-data/content-admin-shared.json';
const DEFAULT_SEED_FILE = 'dev-data/content-admin-seed-baseline.json';
const DEFAULT_SERVER = 'http://127.0.0.1:5173';
const PLANNED_GIVING_ROUTE_SET = [
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/ministry-impact-fund',
  '/services/planned-giving/generosity-fund',
  '/services/planned-giving/charitable-trusts',
  '/services/planned-giving/qualified-charitable-distribution',
  '/services/planned-giving/endowments',
];

const actor = {
  userId: 'content-admin-seed-route-publisher',
  displayName: 'Content Admin Seed Route Publisher',
  initials: 'CP',
  accentColor: '#00adbb',
};

function usage() {
  return [
    'Usage:',
    '  node scripts/publish-content-admin-seed-routes.mjs --planned-giving',
    '  node scripts/publish-content-admin-seed-routes.mjs /route-a /route-b',
    '',
    'Options:',
    '  --server <url>       Dev server origin. Default: http://127.0.0.1:5173',
    '  --file-only          Run the same guarded operation against the shared JSON file.',
    '  --force-overwrite-admin-edits  Authorize replacing active route edits from seed.',
    '  --reason <text>      Required reason for a forced overwrite.',
    '  --shared-file <path> Shared content JSON. Default: dev-data/content-admin-shared.json',
    '  --seed-file <path>   Seed baseline JSON. Default: dev-data/content-admin-seed-baseline.json',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    server: DEFAULT_SERVER,
    fileOnly: false,
    forceOverwriteAdminEdits: false,
    reason: '',
    sharedFile: DEFAULT_SHARED_FILE,
    seedFile: DEFAULT_SEED_FILE,
    routes: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--planned-giving') {
      options.routes.push(...PLANNED_GIVING_ROUTE_SET);
      continue;
    }
    if (arg === '--file-only') {
      options.fileOnly = true;
      continue;
    }
    if (arg === '--force-overwrite-admin-edits') {
      options.forceOverwriteAdminEdits = true;
      continue;
    }
    if (arg === '--reason') {
      options.reason = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--promote-to-seed' || arg === '--active-to-seed') {
      throw new Error('Conflicting promotion mode. Use the explicit active-to-seed promotion workflow separately.');
    }
    if (arg === '--server') {
      options.server = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--shared-file') {
      options.sharedFile = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--seed-file') {
      options.seedFile = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    options.routes.push(arg);
  }

  options.routes = [...new Set(options.routes.map(normalizeRoute).filter(Boolean))];
  if (!options.routes.length) {
    throw new Error('At least one route is required. Use --planned-giving or pass route paths.');
  }
  if (options.forceOverwriteAdminEdits && !options.reason) {
    throw new Error('--reason is required with --force-overwrite-admin-edits.');
  }
  if (options.reason && !options.forceOverwriteAdminEdits) {
    throw new Error('--reason requires --force-overwrite-admin-edits.');
  }
  return options;
}

function normalizeRoute(value) {
  const route = String(value || '').trim();
  if (!route) {
    return '';
  }
  const withSlash = route.startsWith('/') ? route : `/${route}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(path.resolve(filePath), `${JSON.stringify(data, null, 2)}\n`);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function formatBackupTimestampToken(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function createFileOnlyBackup(sharedFile, record, reason) {
  const backupDir = path.resolve(path.dirname(sharedFile), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const baseName = `content-admin-shared-${formatBackupTimestampToken(Date.now())}`;
  let fileName = `${baseName}.json`;
  let filePath = path.join(backupDir, fileName);
  let suffix = 2;
  while (fs.existsSync(filePath)) {
    fileName = `${baseName}-${suffix}.json`;
    filePath = path.join(backupDir, fileName);
    suffix += 1;
  }
  const createdAt = Date.now();
  writeJson(filePath, {
    meta: {
      createdAt,
      timestamp: new Date(createdAt).toISOString(),
      reason: 'before-forced-seed-route-overwrite',
      operationReason: reason,
      action: 'seed-route-slice-overwrite',
      actor,
      persistenceFile: path.basename(sharedFile),
      initialized: Boolean(record?.initialized),
      updatedAt: Number(record?.updatedAt || 0),
    },
    record: cloneJson(record),
  });
  return { fileName, filePath, createdAt, reason };
}

function buildRevisionSnapshot(state, pathname) {
  return {
    pathname,
    page: cloneJson(state?.pageHierarchy?.[pathname] || null),
    blocks: cloneJson(state?.blocksByPath?.[pathname] || []),
    collaboration: cloneJson(state?.collaborationByPath?.[pathname] || { blocks: {}, history: [] }),
    pathAliases: Object.fromEntries(Object.entries(state?.pathAliases || {}).filter(([fromPath, toPath]) => (
      fromPath === pathname || toPath === pathname
    ))),
  };
}

function copyFileOnlyRouteSlice(targetState, seedState, route, operation) {
  targetState.pageHierarchy = targetState.pageHierarchy || {};
  targetState.blocksByPath = targetState.blocksByPath || {};
  targetState.pathAliases = targetState.pathAliases || {};
  targetState.collaborationByPath = targetState.collaborationByPath || {};

  if (seedState.pageHierarchy?.[route]) {
    targetState.pageHierarchy[route] = cloneJson(seedState.pageHierarchy[route]);
  } else {
    delete targetState.pageHierarchy[route];
  }
  targetState.blocksByPath[route] = cloneJson(seedState.blocksByPath[route]);
  Object.keys(targetState.pathAliases).forEach((fromPath) => {
    if (fromPath === route || targetState.pathAliases[fromPath] === route) {
      delete targetState.pathAliases[fromPath];
    }
  });
  Object.entries(seedState.pathAliases || {}).forEach(([fromPath, toPath]) => {
    if (fromPath === route || toPath === route) {
      targetState.pathAliases[fromPath] = toPath;
    }
  });

  const blocks = targetState.blocksByPath[route] || [];
  const currentCollaboration = targetState.collaborationByPath[route] || { blocks: {}, history: [] };
  const collaborationBlocks = {};
  blocks.forEach((block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId) {
      return;
    }
    const previous = currentCollaboration.blocks?.[blockId] || {};
    collaborationBlocks[blockId] = {
      draftedBy: null,
      draftedAt: null,
      savedBy: previous.savedBy || null,
      savedAt: previous.savedAt || null,
      lockedBy: null,
      lockedAt: null,
    };
  });
  const historyEntry = {
    id: `${operation.createdAt}-seed-route-slice-published`,
    action: 'seed-route-slice-published',
    details: `${operation.reason}${operation.summary ? `: ${operation.summary}` : ''}`,
    actor,
    createdAt: operation.createdAt,
  };
  targetState.collaborationByPath[route] = {
    blocks: collaborationBlocks,
    history: [historyEntry, ...(Array.isArray(currentCollaboration.history) ? currentCollaboration.history : [])],
  };
}

function publishFileOnly({ sharedFile, record, seedState, routes, reason, summary }) {
  const createdAt = Date.now();
  const operation = { createdAt, reason, summary };
  const backup = createFileOnlyBackup(sharedFile, record, reason);
  const nextRecord = cloneJson(record);
  routes.forEach((route) => {
    copyFileOnlyRouteSlice(nextRecord.state, seedState, route, operation);
    copyFileOnlyRouteSlice(nextRecord.baseSnapshot, seedState, route, operation);
    nextRecord.revisionsByPath = nextRecord.revisionsByPath || {};
    const revision = {
      id: `${createdAt}-seed-route-slice-published`,
      pathname: route,
      createdAt,
      actor,
      reason,
      summary: summary || 'forced seed route overwrite',
      snapshot: buildRevisionSnapshot(nextRecord.state, route),
    };
    nextRecord.revisionsByPath[route] = [
      revision,
      ...(Array.isArray(nextRecord.revisionsByPath[route]) ? nextRecord.revisionsByPath[route] : []),
    ].slice(0, 40);
  });
  nextRecord.initialized = true;
  nextRecord.updatedAt = createdAt;
  writeJson(sharedFile, nextRecord);
  return backup;
}

async function requestJson(server, pathname, options = {}) {
  const response = await fetch(`${server.replace(/\/$/, '')}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${pathname} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function compareRecordToSeed(record, seedState, routes) {
  return compareSeedRouteSlices({
    activeState: record?.state,
    baseSnapshot: record?.baseSnapshot,
    seedState,
    pathnames: routes,
  });
}

function reportConflict(comparison) {
  if (!comparison?.hasChanges) {
    return false;
  }
  console.error('Seed route publish aborted: active content differs from seed.');
  console.error(formatSeedRouteSliceDiffReport(comparison));
  return true;
}

async function publishViaServer({ server, seedState, routes, options }) {
  const currentRecord = await requestJson(server, '/__dev/content-admin/state');
  const comparison = compareRecordToSeed(currentRecord, seedState, routes);
  if (!options.forceOverwriteAdminEdits && reportConflict(comparison)) {
    process.exitCode = 1;
    return false;
  }
  await requestJson(server, '/__dev/content-admin/publish-seed-routes', {
    method: 'POST',
    body: JSON.stringify({
      seedState,
      pathnames: routes,
      actor,
      summary: `Apply seed route slices: ${routes.join(', ')}`,
      forceOverwriteAdminEdits: options.forceOverwriteAdminEdits,
      reason: options.reason,
      operation: 'seed-to-active',
    }),
  });
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const seedRecord = readJson(options.seedFile);
  const seedState = seedRecord.seedState;
  if (!seedState?.blocksByPath) {
    throw new Error(`Invalid seed baseline: ${options.seedFile}`);
  }
  const missingSeedRoutes = options.routes.filter((route) => !Array.isArray(seedState.blocksByPath[route]));
  if (missingSeedRoutes.length) {
    throw new Error(`Seed baseline has no blocks for route: ${missingSeedRoutes.join(', ')}`);
  }

  if (options.fileOnly) {
    const record = readJson(options.sharedFile);
    const comparison = compareRecordToSeed(record, seedState, options.routes);
    if (!options.forceOverwriteAdminEdits && reportConflict(comparison)) {
      process.exitCode = 1;
      return;
    }
    if (!comparison.hasChanges) {
      console.log(`Seed route slices already match seed: ${options.routes.join(', ')}`);
      return;
    }
    publishFileOnly({
      sharedFile: options.sharedFile,
      record,
      seedState,
      routes: options.routes,
      reason: options.reason,
      summary: `Apply seed route slices: ${options.routes.join(', ')}`,
    });
  } else {
    const published = await publishViaServer({
      server: options.server,
      seedState,
      routes: options.routes,
      options,
    });
    if (!published) {
      return;
    }
  }

  console.log(`Published seed route slices: ${options.routes.join(', ')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exit(1);
});
