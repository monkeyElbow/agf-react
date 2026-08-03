import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createJsonContentStore } from './contentAdminStore';
import { compareSeedRouteSlices } from './seedRouteSliceComparison';
import { spawnSync } from 'node:child_process';

const ROUTE = '/services/test-seed-route';
const SCRIPT = path.resolve(process.cwd(), 'scripts/publish-content-admin-seed-routes.mjs');
const tempDirectories = [];

function actor() {
  return {
    userId: 'seed-safety-test',
    displayName: 'Seed Safety Test',
    initials: 'ST',
    accentColor: '#00adbb',
  };
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function buildSeedState() {
  const editableFields = [
    { id: 'title', label: 'Title' },
    { id: 'body', label: 'Body' },
  ];
  return {
    pageHierarchy: { [ROUTE]: { path: ROUTE, title: 'Seed route' } },
    blocksByPath: {
      [ROUTE]: [
        {
          id: 'hero',
          kind: 'content',
          mode: 'dynamic',
          settings: { title: 'Seed title', body: 'Seed body' },
          editableFields,
        },
        {
          id: 'cta',
          kind: 'content',
          mode: 'dynamic',
          settings: { title: 'Seed CTA', body: 'Seed CTA body' },
          editableFields,
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: { [ROUTE]: { blocks: {}, history: [] } },
  };
}

function createTempStore(seedState = buildSeedState()) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-seed-safety-'));
  tempDirectories.push(directory);
  const persistenceFile = path.join(directory, 'content-admin-shared.json');
  const backupDir = path.join(directory, 'backups');
  const store = createJsonContentStore({
    persistenceFile,
    backupDir,
    seedBaselineFile: path.join(directory, 'content-admin-seed-baseline.json'),
    now: (() => {
      let timestamp = 1710000000000;
      return () => { timestamp += 1; return timestamp; };
    })(),
    getGitCommitHash: () => 'seed-test',
  });
  store.resetFromSeed(seedState, { actor: actor() });
  return { store, persistenceFile, backupDir, seedState };
}

function draftState(store, update) {
  const nextState = cloneJson(store.getSnapshot().state);
  update(nextState);
  store.saveDraft(nextState, { actor: actor(), summary: 'test draft' });
}

function backupFiles(directory) {
  return fs.existsSync(directory)
    ? fs.readdirSync(directory).filter((fileName) => fileName.endsWith('.json'))
    : [];
}

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

describe('seed route publish safety', () => {
  it('allows an identical route to no-op without a backup', () => {
    const { store, backupDir, seedState } = createTempStore();
    const before = store.getSnapshot();

    const result = store.publishSeedRouteSlices(seedState, [ROUTE], { actor: actor() });

    expect(result.ok).toBe(true);
    expect(result.publishResult.didPublish).toBe(false);
    expect(store.getSnapshot().updatedAt).toBe(before.updatedAt);
    expect(backupFiles(backupDir)).toHaveLength(0);
  });

  it.each([
    ['title', (state) => { state.blocksByPath[ROUTE][0].settings.title = 'Edited title'; }],
    ['body', (state) => { state.blocksByPath[ROUTE][0].settings.body = 'Edited body'; }],
    ['removed block', (state) => { state.blocksByPath[ROUTE].pop(); }],
    ['added block', (state) => { state.blocksByPath[ROUTE].push({ id: 'added', kind: 'content', mode: 'dynamic', settings: {} }); }],
    ['reordered blocks', (state) => { state.blocksByPath[ROUTE].reverse(); }],
    ['kind', (state) => { state.blocksByPath[ROUTE][0].kind = 'billboard'; }],
    ['mode', (state) => { state.blocksByPath[ROUTE][0].mode = 'static'; }],
  ])('aborts by default for %s edits and reports route/block/field', (_label, update) => {
    const { store, backupDir, seedState } = createTempStore();
    draftState(store, update);
    const before = store.getSnapshot();
    const revisionsBeforePublish = store.getRevisionHistory(ROUTE);
    const backupCountBeforePublish = backupFiles(backupDir).length;

    const result = store.publishSeedRouteSlices(seedState, [ROUTE], { actor: actor() });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('seed-route-publish-conflict');
    expect(result.publishResult.diffReport).toContain(ROUTE);
    expect(result.publishResult.diffReport).toContain('|');
    expect(store.getSnapshot().state).toEqual(before.state);
    expect(store.getSnapshot().baseSnapshot).toEqual(before.baseSnapshot);
    expect(store.getRevisionHistory(ROUTE)).toEqual(revisionsBeforePublish);
    expect(backupFiles(backupDir)).toHaveLength(backupCountBeforePublish);
  });

  it('rejects force without a reason without writing', () => {
    const { store, backupDir, seedState } = createTempStore();
    draftState(store, (state) => { state.blocksByPath[ROUTE][0].settings.title = 'Edited title'; });
    const before = store.getSnapshot();

    const result = store.publishSeedRouteSlices(seedState, [ROUTE], {
      actor: actor(),
      forceOverwriteAdminEdits: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('force-reason-required');
    expect(store.getSnapshot().state).toEqual(before.state);
    expect(store.getSnapshot().baseSnapshot).toEqual(before.baseSnapshot);
    expect(backupFiles(backupDir)).toHaveLength(0);
  });

  it('rejects an active-to-seed operation through the seed-to-active method', () => {
    const { store, seedState } = createTempStore();

    const result = store.publishSeedRouteSlices(seedState, [ROUTE], {
      actor: actor(),
      operation: 'active-to-seed',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('conflicting-seed-route-publish-mode');
  });

  it('force overwrites both state and baseSnapshot, creates a backup, records metadata, and preserves unrelated routes', () => {
    const unrelatedRoute = '/services/unrelated';
    const { store, backupDir, seedState } = createTempStore();
    const nextState = cloneJson(store.getSnapshot().state);
    nextState.pageHierarchy[unrelatedRoute] = { path: unrelatedRoute, title: 'Unrelated' };
    nextState.blocksByPath[unrelatedRoute] = [{ id: 'unrelated', kind: 'content', mode: 'dynamic', settings: { title: 'Keep me' } }];
    nextState.collaborationByPath[unrelatedRoute] = { blocks: {}, history: [] };
    store.saveDraft(nextState, { actor: actor(), summary: 'unrelated setup' });
    draftState(store, (state) => { state.blocksByPath[ROUTE][0].settings.title = 'Edited title'; });

    const result = store.publishSeedRouteSlices(seedState, [ROUTE], {
      actor: actor(),
      forceOverwriteAdminEdits: true,
      reason: 'Replace route from reviewed seed baseline',
      summary: 'Safety test overwrite',
    });
    const snapshot = store.getSnapshot();

    expect(result.ok).toBe(true);
    expect(result.backup.reason).toBe('before-forced-seed-route-overwrite');
    expect(backupFiles(backupDir)).toHaveLength(1);
    const backupPayload = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles(backupDir)[0]), 'utf8'));
    expect(backupPayload.record.state.blocksByPath[ROUTE][0].settings.title).toBe('Edited title');
    expect(snapshot.state.blocksByPath[ROUTE]).toEqual(seedState.blocksByPath[ROUTE]);
    expect(snapshot.baseSnapshot.blocksByPath[ROUTE]).toEqual(seedState.blocksByPath[ROUTE]);
    expect(snapshot.state.blocksByPath[unrelatedRoute][0].settings.title).toBe('Keep me');
    expect(store.getRevisionHistory(ROUTE)[0]?.reason).toBe('Replace route from reviewed seed baseline');
    expect(snapshot.state.collaborationByPath[ROUTE].history[0].details)
      .toContain('Replace route from reviewed seed baseline');
  });

  it('comparison helper includes source and draft ownership changes', () => {
    const seedState = buildSeedState();
    const activeState = cloneJson(seedState);
    activeState.collaborationByPath[ROUTE].blocks.hero = {
      draftedBy: actor(),
      draftedAt: 1710000000000,
    };

    const comparison = compareSeedRouteSlices({
      activeState,
      baseSnapshot: seedState,
      seedState,
      pathnames: [ROUTE],
    });

    expect(comparison.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: 'state',
        blockId: 'hero',
        field: 'collaboration.blocks.hero.draftedBy',
        type: 'draft-ownership-changed',
      }),
    ]));
  });

  it('file-only mode applies the same safety policy and cannot bypass it', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-seed-cli-'));
    tempDirectories.push(directory);
    const sharedFile = path.join(directory, 'content-admin-shared.json');
    const seedFile = path.join(directory, 'content-admin-seed-baseline.json');
    const seedState = buildSeedState();
    const record = {
      initialized: true,
      version: 1,
      updatedAt: 1710000000000,
      state: cloneJson(seedState),
      baseSnapshot: cloneJson(seedState),
      revisionsByPath: {},
    };
    record.state.blocksByPath[ROUTE][0].settings.title = 'Admin edit';
    fs.writeFileSync(sharedFile, `${JSON.stringify(record, null, 2)}\n`);
    fs.writeFileSync(seedFile, `${JSON.stringify({ meta: {}, seedState }, null, 2)}\n`);

    const blocked = spawnSync(process.execPath, [SCRIPT, '--file-only', '--shared-file', sharedFile, '--seed-file', seedFile, ROUTE], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain(ROUTE);
    expect(fs.readdirSync(directory).filter((fileName) => fileName === 'backups')).toHaveLength(0);

    const missingReason = spawnSync(process.execPath, [SCRIPT, '--file-only', '--force-overwrite-admin-edits', '--shared-file', sharedFile, '--seed-file', seedFile, ROUTE], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(missingReason.status).toBe(1);
    expect(fs.readFileSync(sharedFile, 'utf8')).toContain('Admin edit');

    const forced = spawnSync(process.execPath, [SCRIPT, '--file-only', '--force-overwrite-admin-edits', '--reason', 'Reviewed seed replacement', '--shared-file', sharedFile, '--seed-file', seedFile, ROUTE], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(forced.status).toBe(0);
    const persisted = JSON.parse(fs.readFileSync(sharedFile, 'utf8'));
    expect(persisted.state.blocksByPath[ROUTE]).toEqual(seedState.blocksByPath[ROUTE]);
    expect(persisted.baseSnapshot.blocksByPath[ROUTE]).toEqual(seedState.blocksByPath[ROUTE]);
    expect(fs.readdirSync(path.join(directory, 'backups')).filter((fileName) => fileName.endsWith('.json'))).toHaveLength(1);
  });
});
