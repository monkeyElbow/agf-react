#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
    '  --file-only          Update dev-data JSON without calling the running dev server.',
    '  --shared-file <path> Shared content JSON. Default: dev-data/content-admin-shared.json',
    '  --seed-file <path>   Seed baseline JSON. Default: dev-data/content-admin-seed-baseline.json',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    server: DEFAULT_SERVER,
    fileOnly: false,
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

function copyRouteSlice(targetState, seedState, route) {
  if (!targetState?.blocksByPath || !seedState?.blocksByPath) {
    throw new Error('Invalid content-admin state shape.');
  }
  if (!Array.isArray(seedState.blocksByPath[route])) {
    throw new Error(`Seed baseline has no blocks for route: ${route}`);
  }

  targetState.blocksByPath[route] = cloneJson(seedState.blocksByPath[route]);
  if (seedState.pageHierarchy?.[route]) {
    targetState.pageHierarchy = targetState.pageHierarchy || {};
    targetState.pageHierarchy[route] = cloneJson(seedState.pageHierarchy[route]);
  }

  targetState.pathAliases = targetState.pathAliases || {};
  Object.entries(seedState.pathAliases || {}).forEach(([fromPath, toPath]) => {
    if (fromPath === route || toPath === route) {
      targetState.pathAliases[fromPath] = toPath;
    }
  });
}

function copyRoutesIntoRecord(record, seedState, routes) {
  routes.forEach((route) => {
    copyRouteSlice(record.state, seedState, route);
    copyRouteSlice(record.baseSnapshot, seedState, route);
  });
  record.updatedAt = Date.now();
  return record;
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

async function publishViaServer({ server, seedState, routes }) {
  await requestJson(server, '/__dev/content-admin/publish-seed-routes', {
    method: 'POST',
    body: JSON.stringify({
      seedState,
      pathnames: routes,
      actor,
      summary: `Apply seed route slices: ${routes.join(', ')}`,
    }),
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const seedRecord = readJson(options.seedFile);
  const seedState = seedRecord.seedState;
  if (!seedState?.blocksByPath) {
    throw new Error(`Invalid seed baseline: ${options.seedFile}`);
  }

  if (options.fileOnly) {
    const record = readJson(options.sharedFile);
    copyRoutesIntoRecord(record, seedState, options.routes);
    writeJson(options.sharedFile, record);
  } else {
    await publishViaServer({
      server: options.server,
      seedState,
      routes: options.routes,
    });
  }

  console.log(`Published seed route slices: ${options.routes.join(', ')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exit(1);
});
