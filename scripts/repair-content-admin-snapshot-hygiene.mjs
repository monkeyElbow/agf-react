#!/usr/bin/env node

import crypto from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSharedFile = path.resolve(repoRoot, 'dev-data/content-admin-shared.json');
const defaultSeedFile = path.resolve(repoRoot, 'dev-data/content-admin-seed-baseline.json');
const AFFECTED_ROUTES = Object.freeze([
  '/services/investments/invest-by-mail',
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/endowments',
]);

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex').slice(0, 12);
}

function blockManifest(block) {
  return {
    id: String(block?.id || ''),
    kind: String(block?.kind || ''),
    mode: String(block?.mode || ''),
    settingsHash: hash(block?.settings),
    editableFieldsHash: hash(block?.editableFields),
  };
}

function routeManifest(state, route, collaborationByPath = {}) {
  const blocks = Array.isArray(state?.blocksByPath?.[route]) ? state.blocksByPath[route] : [];
  const ownership = Object.fromEntries(
    Object.entries(collaborationByPath?.[route]?.blocks || {}).map(([blockId, meta]) => [blockId, {
      draftedBy: meta?.draftedBy?.userId || null,
      draftedAt: meta?.draftedAt ?? null,
      savedBy: meta?.savedBy?.userId || null,
      savedAt: meta?.savedAt ?? null,
      lockedBy: meta?.lockedBy?.userId || null,
      lockedAt: meta?.lockedAt ?? null,
    }]),
  );
  return {
    route,
    blockIds: blocks.map((block) => String(block?.id || '')),
    blocks: blocks.map(blockManifest),
    ownership,
    revisionCount: 0,
  };
}

function stateManifest(state, routes = AFFECTED_ROUTES) {
  return routes.map((route) => routeManifest(state, route, state?.collaborationByPath));
}

function buildManifest(record, routes = AFFECTED_ROUTES) {
  return routes.map((route) => {
    const state = routeManifest(record?.state, route, record?.state?.collaborationByPath);
    const baseSnapshot = routeManifest(record?.baseSnapshot, route, record?.baseSnapshot?.collaborationByPath);
    const revisions = Array.isArray(record?.revisionsByPath?.[route]) ? record.revisionsByPath[route] : [];
    return {
      route,
      state,
      baseSnapshot,
      revisionCount: revisions.length,
      revisionInventories: revisions.map((revision) => ({
        id: String(revision?.id || ''),
        blocks: (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : []).map(blockManifest),
      })),
    };
  });
}

function stripEmptyCanonicalLinkFields(state) {
  const next = cloneJson(state);
  Object.values(next?.blocksByPath || {}).forEach((blocks) => {
    (Array.isArray(blocks) ? blocks : []).forEach((block) => {
      const settings = block?.settings;
      if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return;
      }
      Object.keys(settings).forEach((key) => {
        if (/LinkJson$/.test(key) && (typeof settings[key] !== 'string' || !settings[key].trim())) {
          delete settings[key];
        }
      });
    });
  });
  return next;
}

async function loadNormalizer() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'agf-content-admin-repair-'));
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    customLogger: {
      info() {},
      warn() {},
      warnOnce() {},
      error() {},
      clearScreen() {},
      hasErrorLogged() { return false; },
      hasWarned: false,
    },
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { middlewareMode: true, hmr: false, watch: null },
  });

  try {
    const module = await server.ssrLoadModule('/src/lib/contentAdminNormalization.js');
    return {
      normalizeContentAdminState: module.normalizeContentAdminState,
      close: async () => {
        rmSync(tempRoot, { recursive: true, force: true });
        await server.close();
      },
    };
  } catch (error) {
    rmSync(tempRoot, { recursive: true, force: true });
    await server.close();
    throw error;
  }
}

function normalizeRevisionSnapshot(rawSnapshot, normalizeContentAdminState) {
  const snapshot = rawSnapshot && typeof rawSnapshot === 'object' ? rawSnapshot : {};
  const pathname = String(snapshot.pathname || '').trim();
  const state = normalizeContentAdminState({
    pageHierarchy: snapshot.page ? { [pathname]: snapshot.page } : {},
    blocksByPath: { [pathname]: Array.isArray(snapshot.blocks) ? snapshot.blocks : [] },
    pathAliases: snapshot.pathAliases && typeof snapshot.pathAliases === 'object' ? snapshot.pathAliases : {},
    collaborationByPath: {},
  });
  const normalizedBlocksState = stripEmptyCanonicalLinkFields(state);
  return {
    ...cloneJson(snapshot),
    pathname,
    page: cloneJson(state.pageHierarchy?.[pathname] || null),
    blocks: cloneJson(normalizedBlocksState.blocksByPath?.[pathname] || []),
    collaboration: cloneJson(snapshot.collaboration || { blocks: {}, history: [] }),
    pathAliases: Object.fromEntries(Object.entries(state.pathAliases || {}).filter(([from, to]) => (
      from === pathname || to === pathname
    ))),
  };
}

function normalizeStatePreservingCollaboration(rawState, normalizeContentAdminState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const normalized = normalizeContentAdminState({
    ...source,
    collaborationByPath: {},
  });
  const next = stripEmptyCanonicalLinkFields(normalized);
  next.collaborationByPath = cloneJson(source.collaborationByPath || {});
  return next;
}

function repairRecord(record, normalizeContentAdminState) {
  const next = cloneJson(record);
  next.state = normalizeStatePreservingCollaboration(record?.state, normalizeContentAdminState);
  next.baseSnapshot = normalizeStatePreservingCollaboration(record?.baseSnapshot, normalizeContentAdminState);
  next.revisionsByPath = Object.fromEntries(
    Object.entries(record?.revisionsByPath || {}).map(([pathname, revisions]) => [
      pathname,
      (Array.isArray(revisions) ? revisions : []).map((revision) => ({
        ...cloneJson(revision),
        snapshot: normalizeRevisionSnapshot(revision?.snapshot, normalizeContentAdminState),
      })),
    ]),
  );
  return next;
}

function changedPaths(before, after) {
  const paths = new Set();
  AFFECTED_ROUTES.forEach((route) => {
    ['state', 'baseSnapshot'].forEach((root) => {
      if (JSON.stringify(before?.[root]?.blocksByPath?.[route] || []) !== JSON.stringify(after?.[root]?.blocksByPath?.[route] || [])) {
        paths.add(`${root}:${route}`);
      }
      if (JSON.stringify(before?.[root]?.collaborationByPath?.[route] || {}) !== JSON.stringify(after?.[root]?.collaborationByPath?.[route] || {})) {
        paths.add(`${root}.collaboration:${route}`);
      }
    });
    if (JSON.stringify(before?.revisionsByPath?.[route] || []) !== JSON.stringify(after?.revisionsByPath?.[route] || [])) {
      paths.add(`revisions:${route}`);
    }
  });
  return [...paths].sort();
}

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : String(process.argv[index + 1] || '').trim() || fallback;
}

export async function repairSnapshotFiles({
  sharedFile = defaultSharedFile,
  seedFile = defaultSeedFile,
  dryRun = false,
} = {}) {
  const normalizer = await loadNormalizer();
  try {
    const shared = readJson(sharedFile);
    const seed = readJson(seedFile);
    const repairedShared = repairRecord(shared, normalizer.normalizeContentAdminState);
    const repairedSeed = {
      ...cloneJson(seed),
      seedState: normalizeStatePreservingCollaboration(seed?.seedState, normalizer.normalizeContentAdminState),
    };

    const manifest = {
      before: {
        shared: buildManifest(shared),
        seed: stateManifest(seed?.seedState),
      },
      changedShared: changedPaths(shared, repairedShared),
      changedSeed: AFFECTED_ROUTES.filter((route) => (
        JSON.stringify(seed?.seedState?.blocksByPath?.[route] || [])
        !== JSON.stringify(repairedSeed?.seedState?.blocksByPath?.[route] || [])
      )),
      dryRun,
    };

    if (!dryRun) {
      const nextSharedText = serialize(repairedShared);
      const nextSeedText = serialize(repairedSeed);
      if (nextSharedText !== readFileSync(sharedFile, 'utf8')) {
        writeFileSync(sharedFile, nextSharedText);
      }
      if (nextSeedText !== readFileSync(seedFile, 'utf8')) {
        writeFileSync(seedFile, nextSeedText);
      }
    }
    return manifest;
  } finally {
    await normalizer.close();
  }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const manifest = await repairSnapshotFiles({
    sharedFile: readOption('--shared-file', defaultSharedFile),
    seedFile: readOption('--seed-file', defaultSeedFile),
    dryRun: process.argv.includes('--dry-run'),
  });
  console.log('Content-admin snapshot hygiene manifest');
  console.log(JSON.stringify(manifest, null, 2));
}
