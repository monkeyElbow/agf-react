import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const CGA_ROUTE = '/services/planned-giving/charitable-gift-annuities';
const ENDOWMENTS_ROUTE = '/services/planned-giving/endowments';
const INVEST_BY_MAIL_ROUTE = '/services/investments/invest-by-mail';
const tempDirectories = [];
const SCRIPT = path.resolve(process.cwd(), 'scripts/repair-content-admin-snapshot-hygiene.mjs');

function actor() {
  return {
    userId: 'repair-test-user',
    displayName: 'Repair Test User',
    initials: 'RT',
    accentColor: '#00adbb',
  };
}

function block(id, settings, overrides = {}) {
  return {
    id,
    kind: 'content',
    mode: 'dynamic',
    settings,
    ...overrides,
  };
}

function state(blocksByPath, collaborationByPath = {}) {
  return {
    pageHierarchy: Object.fromEntries(Object.keys(blocksByPath).map((pathname) => [pathname, {
      path: pathname,
      title: pathname,
    }])),
    blocksByPath,
    pathAliases: {},
    collaborationByPath,
  };
}

function fixture() {
  const cgaBlocks = [
    block('hero', { title: 'Edited title', bodyHtml: '<p>Edited body</p>' }),
    block('admin-added', { title: '', bodyHtml: '' }),
  ];
  const endowmentBlocks = [
    block('assets_you_may_give', {
      title: 'Admin-owned assets',
      card1ButtonLinkJson: '',
      card1Button2LinkJson: '',
    }, { kind: 'card_grid' }),
  ];
  const sharedState = state({
    [CGA_ROUTE]: cgaBlocks,
    [ENDOWMENTS_ROUTE]: endowmentBlocks,
  }, {
    [CGA_ROUTE]: {
      blocks: {
        hero: { draftedBy: actor(), draftedAt: 1710000000000 },
      },
      history: [],
    },
  });
  const revision = {
    id: 'historical-revision',
    pathname: CGA_ROUTE,
    createdAt: 1710000000000,
    actor: actor(),
    snapshot: {
      pathname: CGA_ROUTE,
      page: { path: CGA_ROUTE, title: 'Historical page' },
      blocks: [block('historical-only', { title: 'Historical copy' })],
      collaboration: { blocks: { 'historical-only': { draftedBy: actor() } }, history: [] },
      pathAliases: {},
    },
  };
  return {
    initialized: true,
    version: 1,
    updatedAt: 1710000000000,
    state: sharedState,
    baseSnapshot: JSON.parse(JSON.stringify(sharedState)),
    revisionsByPath: { [CGA_ROUTE]: [revision] },
    seed: {
      meta: { seedVersion: 1 },
      seedState: state({
        [INVEST_BY_MAIL_ROUTE]: [block('hero', {
          button1Label: 'Keep link label',
          button1Url: '#demo',
          button1PageRef: '',
        }, { kind: 'hero' })],
        [CGA_ROUTE]: [block('hero', {
          button1Label: 'Try it',
          button1Url: '#demo',
          button1PageRef: '',
        }, { kind: 'hero' })],
        [ENDOWMENTS_ROUTE]: endowmentBlocks,
      }),
    },
  };
}

function writeFixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-snapshot-repair-'));
  tempDirectories.push(directory);
  const paths = {
    sharedFile: path.join(directory, 'content-admin-shared.json'),
    seedFile: path.join(directory, 'content-admin-seed-baseline.json'),
  };
  const data = fixture();
  fs.writeFileSync(paths.sharedFile, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(paths.seedFile, `${JSON.stringify(data.seed, null, 2)}\n`);
  return paths;
}

function runRepair(paths) {
  const result = spawnSync(process.execPath, [
    SCRIPT,
    '--shared-file', paths.sharedFile,
    '--seed-file', paths.seedFile,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  expect(result.status, result.stderr).toBe(0);
}

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

describe('content-admin snapshot hygiene repair', () => {
  it('preserves admin content, inventory, ownership, and historical revisions while repairing schema defects', async () => {
    const paths = writeFixture();
    runRepair(paths);
    const repairedShared = JSON.parse(fs.readFileSync(paths.sharedFile, 'utf8'));
    const repairedSeed = JSON.parse(fs.readFileSync(paths.seedFile, 'utf8'));

    expect(repairedShared.state.blocksByPath[CGA_ROUTE].map(({ id }) => id)).toEqual(['hero', 'admin-added']);
    expect(repairedShared.state.blocksByPath[CGA_ROUTE][0].settings).toMatchObject({
      title: 'Edited title',
      bodyHtml: '<p>Edited body</p>',
    });
    expect(repairedShared.state.collaborationByPath[CGA_ROUTE].blocks.hero.draftedBy).toEqual(actor());
    expect(repairedShared.state.blocksByPath[ENDOWMENTS_ROUTE][0].settings).toEqual({
      title: 'Admin-owned assets',
    });
    expect(repairedShared.revisionsByPath[CGA_ROUTE][0].snapshot.blocks.map(({ id }) => id))
      .toEqual(['historical-only']);

    [INVEST_BY_MAIL_ROUTE, CGA_ROUTE].forEach((route) => {
      const hero = repairedSeed.seedState.blocksByPath[route][0];
      expect(hero.settings.button1LinkJson).toBe('{"kind":"anchor","openInNewWindow":false,"href":"#demo"}');
      expect(hero.settings.button1Url).toBeUndefined();
      expect(hero.settings.button1PageRef).toBeUndefined();
    });
    expect(repairedSeed.seedState.blocksByPath[ENDOWMENTS_ROUTE][0].settings.card1ButtonLinkJson).toBeUndefined();

    const afterFirstRun = fs.readFileSync(paths.sharedFile, 'utf8');
    const afterFirstSeedRun = fs.readFileSync(paths.seedFile, 'utf8');
    runRepair(paths);
    expect(fs.readFileSync(paths.sharedFile, 'utf8')).toBe(afterFirstRun);
    expect(fs.readFileSync(paths.seedFile, 'utf8')).toBe(afterFirstSeedRun);
  });
});
