import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDevContentAuthorityStore } from './contentAdminStore';

function createActor(overrides = {}) {
  return {
    userId: 'dev-taylor',
    displayName: 'Taylor QA',
    initials: 'TQ',
    accentColor: '#00adbb',
    ...overrides,
  };
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function buildSeedState() {
  return {
    pageHierarchy: {
      '/services/loans': {
        path: '/services/loans',
        title: 'Loans',
      },
    },
    blocksByPath: {
      '/services/loans': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Original title',
          },
        },
        {
          id: 'cta_form',
          kind: 'cta_form',
          mode: 'dynamic',
          settings: {
            title: 'Request help',
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      '/services/loans': {
        blocks: {},
        history: [],
      },
    },
  };
}

function buildSeedStateWithOtherDraft() {
  const seedState = buildSeedState();
  seedState.collaborationByPath['/services/loans'].blocks.hero = {
    draftedBy: createActor({
      userId: 'dev-other',
      displayName: 'Morgan Laptop',
      initials: 'ML',
      accentColor: '#3355cc',
    }),
    draftedAt: 1710000000000,
    savedBy: createActor({
      userId: 'dev-other',
      displayName: 'Morgan Laptop',
      initials: 'ML',
      accentColor: '#3355cc',
    }),
    savedAt: 1710000000000,
    lockedBy: null,
    lockedAt: null,
  };
  return seedState;
}

function buildPresetSeedState() {
  return {
    pageHierarchy: {
      '/services/loans': {
        path: '/services/loans',
        title: 'Loans',
      },
      '/services/investments': {
        path: '/services/investments',
        title: 'Investments',
      },
      '/services/retirement/403b': {
        path: '/services/retirement/403b',
        title: '403(b)',
      },
    },
    blocksByPath: {
      '/services/loans': [
        {
          id: 'value_cards',
          kind: 'columns',
          mode: 'dynamic',
          presetId: 'default',
          settings: {
            title: "There's more to every loan.",
            col1Title: 'Smart consulting.',
          },
        },
      ],
      '/services/investments': [
        {
          id: 'investor_cta',
          kind: 'cta_band',
          mode: 'dynamic',
          presetId: 'default',
          settings: {
            title: 'Already connected?',
            buttonLabel: 'Open dashboard',
          },
        },
      ],
      '/services/retirement/403b': [
        {
          id: 'loan_apply',
          kind: 'card_grid',
          mode: 'dynamic',
          presetId: 'default',
          settings: {
            card1Title: 'Check your eligibility',
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      '/services/loans': {
        blocks: {},
        history: [],
      },
      '/services/investments': {
        blocks: {},
        history: [],
      },
      '/services/retirement/403b': {
        blocks: {},
        history: [],
      },
    },
  };
}

function buildGenerosityFundSeedState() {
  return {
    pageHierarchy: {
      '/services/planned-giving/generosity-fund': {
        path: '/services/planned-giving/generosity-fund',
        title: 'Generosity Fund',
      },
    },
    blocksByPath: {
      '/services/planned-giving/generosity-fund': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Your giving.',
            line2Text: 'Managed.',
            button1Label: 'Open a Generosity Fund®',
            button1Url: 'https://secure.agfinancial.org/generosityfund/signup',
            button2Label: 'Open a traditional DAF',
            button2Url: '#traditional-daf-form',
            button2PageRef: '',
            button2Action: undefined,
            button2TargetAnchorId: undefined,
            button2TargetBlockId: undefined,
            button2Style: 'outline',
            button2Tone: 'super-grey',
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      '/services/planned-giving/generosity-fund': {
        blocks: {},
        history: [],
      },
    },
  };
}

function createStore(persistenceFile) {
  return createDevContentAuthorityStore({
    persistenceFile,
    now: (() => {
      let tick = 1710000000000;
      return () => {
        tick += 1000;
        return tick;
      };
    })(),
    createId: (() => {
      let seq = 0;
      return (timestamp) => {
        seq += 1;
        return `${timestamp}-${seq}`;
      };
    })(),
  });
}

const tempDirs = [];

afterEach(() => {
  tempDirs.splice(0).forEach((dir) => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

function makeTempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-content-authority-'));
  tempDirs.push(dir);
  return path.join(dir, 'content-admin-shared.json');
}

function readPersistedRecord(persistenceFile) {
  return JSON.parse(fs.readFileSync(persistenceFile, 'utf8'));
}

describe('createDevContentAuthorityStore', () => {
  it('lets multiple clients resolve the same shared page state through one persisted store', () => {
    const persistenceFile = makeTempFile();
    const storeA = createStore(persistenceFile);
    const seedState = buildSeedState();

    storeA.resetFromSeed(seedState, { actor: createActor() });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Shared draft title';
    storeA.saveDraft(nextState, { actor: createActor() });

    const storeB = createStore(persistenceFile);
    expect(storeB.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Shared draft title');
  });

  it('persists revision history and reloads it from disk', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Updated CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'cta updated' });

    const reloaded = createStore(persistenceFile);
    const history = reloaded.getRevisionHistory('/services/loans');

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].summary).toBe('cta updated');
    expect(history[0].blocks.map((block) => block.id)).toContain('cta_form');
  });

  it('persists new revisions without full-tree snapshot state', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Updated CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'cta updated' });

    const persisted = readPersistedRecord(persistenceFile);
    const revision = persisted.revisionsByPath['/services/loans'][0];

    expect(revision.snapshot.state).toBeUndefined();
    expect(revision.snapshot.pathname).toBe('/services/loans');
    expect(revision.snapshot.page.path).toBe('/services/loans');
    expect(revision.snapshot.blocks.map((block) => block.id)).toEqual(['hero', 'cta_form']);
    expect(revision.snapshot.collaboration.blocks.hero).toBeTruthy();
    expect(revision.snapshot.collaboration.blocks.cta_form?.draftedBy?.displayName).toBe('Taylor QA');
    expect(revision.snapshot.collaboration.history[0]?.action).toBe('block-draft-saved');
    expect(revision.snapshot.pathAliases).toEqual({});
  });

  it('loads legacy revisions with snapshot.state and still returns revision history', () => {
    const persistenceFile = makeTempFile();
    const legacyState = buildSeedState();
    legacyState.blocksByPath['/services/loans'][1].settings.title = 'Legacy CTA';

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: buildSeedState(),
      baseSnapshot: buildSeedState(),
      revisionsByPath: {
        '/services/loans': [
          {
            id: '1710000005000-legacy',
            pathname: '/services/loans',
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'legacy revision',
            snapshot: {
              pathname: '/services/loans',
              state: legacyState,
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const history = store.getRevisionHistory('/services/loans');

    expect(history).toHaveLength(1);
    expect(history[0].summary).toBe('legacy revision');
    expect(history[0].blocks.map((block) => block.id)).toEqual(['hero', 'cta_form']);
  });

  it('resets the shared state back to seed', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const seedState = buildSeedState();
    store.resetFromSeed(seedState, { actor: createActor() });

    const modified = buildSeedState();
    modified.blocksByPath['/services/loans'][0].settings.line1Text = 'Modified';
    store.saveDraft(modified, { actor: createActor() });
    store.resetFromSeed(seedState, { actor: createActor() });

    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
  });

  it('normalizes preset-bearing family identity before persisting shared state', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildPresetSeedState(), { actor: createActor() });

    const reloaded = createStore(persistenceFile);
    const valueCards = reloaded.getSnapshot().state.blocksByPath['/services/loans'][0];
    const investorCta = reloaded.getSnapshot().state.blocksByPath['/services/investments'][0];
    const loanApply = reloaded.getSnapshot().state.blocksByPath['/services/retirement/403b'][0];

    expect(valueCards.presetId).toBe('value-cards');
    expect(investorCta.presetId).toBe('dashboard-login');
    expect(loanApply.presetId).toBe('step-cards');
  });

  it('repairs the stale generosity fund hero CTA fields in shared snapshots', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildGenerosityFundSeedState(), { actor: createActor() });

    const heroBlock = store.getSnapshot().state.blocksByPath['/services/planned-giving/generosity-fund'][0];
    expect(heroBlock.settings.button1Url).toBe('https://secure.agfinancial.org/generosityfund/signup');
    expect(heroBlock.settings.button2Url).toBe('');
    expect(heroBlock.settings.button2PageRef).toBe('');
    expect(heroBlock.settings.button2Action).toBe('open_cta_form');
    expect(heroBlock.settings.button2TargetAnchorId).toBe('traditional-daf-inline-form');
    expect(heroBlock.settings.button2TargetBlockId).toBe('');

    const reloaded = createStore(persistenceFile);
    const reloadedHero = reloaded.getSnapshot().state.blocksByPath['/services/planned-giving/generosity-fund'][0];
    expect(reloadedHero.settings.button2Url).toBe('');
    expect(reloadedHero.settings.button2Action).toBe('open_cta_form');
    expect(reloadedHero.settings.button2TargetAnchorId).toBe('traditional-daf-inline-form');
  });

  it('restoring a page revision creates new current draft state without mutating the old revision', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const firstDraft = buildSeedState();
    firstDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'First draft';
    store.saveDraft(firstDraft, { actor: createActor(), summary: 'first draft' });
    const firstRevisionId = store.getRevisionHistory('/services/loans')[0].id;

    const secondDraft = buildSeedState();
    secondDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Second draft';
    store.saveDraft(secondDraft, { actor: createActor(), summary: 'second draft' });

    const persistedBeforeRestore = readPersistedRecord(persistenceFile);
    expect(persistedBeforeRestore.revisionsByPath['/services/loans'][0].snapshot.state).toBeUndefined();
    expect(persistedBeforeRestore.revisionsByPath['/services/loans'][1].snapshot.state).toBeUndefined();

    const restored = store.restorePageRevision('/services/loans', firstRevisionId, { actor: createActor() });
    expect(restored.ok).toBe(true);
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('First draft');

    const revisionsAfterRestore = store.getRevisionHistory('/services/loans');
    const originalRevision = revisionsAfterRestore.find((entry) => entry.id === firstRevisionId);
    expect(originalRevision).toBeTruthy();
    expect(originalRevision.summary).toBe('first draft');
  });

  it('restoring a block revision only copies that block into the current draft state', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const firstDraft = buildSeedState();
    firstDraft.blocksByPath['/services/loans'][1].settings.title = 'Restorable CTA';
    store.saveDraft(firstDraft, { actor: createActor(), summary: 'saved cta revision' });
    const revisionId = store.getRevisionHistory('/services/loans')[0].id;

    const secondDraft = buildSeedState();
    secondDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Keep this title';
    secondDraft.blocksByPath['/services/loans'][1].settings.title = 'Different CTA';
    store.saveDraft(secondDraft, { actor: createActor(), summary: 'later draft' });

    const persistedBeforeRestore = readPersistedRecord(persistenceFile);
    expect(persistedBeforeRestore.revisionsByPath['/services/loans'][0].snapshot.state).toBeUndefined();
    expect(persistedBeforeRestore.revisionsByPath['/services/loans'][1].snapshot.state).toBeUndefined();

    const restored = store.restoreBlockFromRevision('/services/loans', revisionId, 'cta_form', { actor: createActor() });
    expect(restored.ok).toBe(true);
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Keep this title');
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][1].settings.title).toBe('Restorable CTA');
  });

  it('returns mixed history for legacy and compact revision snapshots', () => {
    const persistenceFile = makeTempFile();
    const legacyState = buildSeedState();
    legacyState.blocksByPath['/services/loans'][0].settings.line1Text = 'Legacy title';

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: buildSeedState(),
      baseSnapshot: buildSeedState(),
      revisionsByPath: {
        '/services/loans': [
          {
            id: '1710000005000-legacy',
            pathname: '/services/loans',
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'legacy revision',
            snapshot: {
              pathname: '/services/loans',
              state: legacyState,
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Compact CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'compact revision' });

    const history = store.getRevisionHistory('/services/loans');
    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.summary)).toEqual(['compact revision', 'legacy revision']);
    expect(history[0].blocks.map((block) => block.id)).toEqual(['hero', 'cta_form']);
    expect(history[1].blocks.map((block) => block.id)).toEqual(['hero', 'cta_form']);

    const persisted = readPersistedRecord(persistenceFile);
    expect(persisted.revisionsByPath['/services/loans'][0].snapshot.state).toBeUndefined();
    expect(persisted.revisionsByPath['/services/loans'][1].snapshot.state).toBeDefined();
  });

  it('acquires and releases shared block locks in persisted collaboration state', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const locked = store.acquireBlockLock('/services/loans', 'hero', createActor());
    expect(locked.ok).toBe(true);
    expect(locked.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');
    expect(locked.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);

    const released = store.releaseBlockLock('/services/loans', 'hero', createActor());
    expect(released.ok).toBe(true);
    expect(released.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy).toBe(null);
  });

  it('syncs one active block draft into shared state without clearing the editor lock', () => {
    const persistenceFile = makeTempFile();
    const storeA = createStore(persistenceFile);
    storeA.resetFromSeed(buildSeedState(), { actor: createActor() });
    storeA.acquireBlockLock('/services/loans', 'hero', createActor());

    const synced = storeA.syncBlockDraft('/services/loans', 'hero', {
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'HUD synced hero title',
      },
    }, { actor: createActor() });

    expect(synced.ok).toBe(true);
    expect(synced.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('HUD synced hero title');
    expect(synced.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy.displayName).toBe('Taylor QA');
    expect(synced.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');
    expect(synced.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-draft-synced');

    const storeB = createStore(persistenceFile);
    expect(storeB.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('HUD synced hero title');
    expect(storeB.getSnapshot().state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');
  });

  it('rejects block draft sync when another admin still owns that draft', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const blocked = store.syncBlockDraft('/services/loans', 'hero', {
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'Illicit overwrite',
      },
    }, { actor: createActor() });

    expect(blocked.ok).toBe(false);
    expect(blocked.error).toBe('drafted-by-other');
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
  });

  it('requires an explicit force claim before taking over a passive foreign draft', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const blocked = store.acquireBlockLock('/services/loans', 'hero', createActor());
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toBe('drafted-by-other');

    const claimed = store.acquireBlockLock('/services/loans', 'hero', createActor(), { force: true });
    expect(claimed.ok).toBe(true);
    expect(claimed.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');
    expect(claimed.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-draft-claimed');
  });

  it('blocks conflicting blocks from being overwritten while still saving allowed blocks', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const nextState = buildSeedStateWithOtherDraft();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Blocked hero rewrite';
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Saved CTA title';

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'partial save attempt' });

    expect(saved.ok).toBe(true);
    expect(saved.saveResult.hasConflicts).toBe(true);
    expect(saved.saveResult.savedBlockIdsByPath['/services/loans']).toContain('cta_form');
    expect(saved.saveResult.blockedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(saved.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(saved.state.blocksByPath['/services/loans'][1].settings.title).toBe('Saved CTA title');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedBy.displayName).toBe('Morgan Laptop');
  });

  it('allows a later save after explicit takeover of another admin draft', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const blockedAttempt = buildSeedStateWithOtherDraft();
    blockedAttempt.blocksByPath['/services/loans'][0].settings.line1Text = 'Blocked hero rewrite';
    const blocked = store.saveDraft(blockedAttempt, { actor: createActor(), summary: 'blocked hero save' });
    expect(blocked.saveResult.blockedBlockIdsByPath['/services/loans']).toContain('hero');

    const takenOver = store.acquireBlockLock('/services/loans', 'hero', createActor(), { force: true });
    expect(takenOver.ok).toBe(true);

    const nextState = cloneJson(takenOver.state);
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Hero after takeover';
    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'hero after takeover' });

    expect(saved.saveResult.hasConflicts).toBe(false);
    expect(saved.saveResult.savedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(saved.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Hero after takeover');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy.displayName).toBe('Taylor QA');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedBy.displayName).toBe('Taylor QA');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy).toBe(null);
  });

  it('publishes a page into the base snapshot and clears draft ownership for that page', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Published hero title';
    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'hero ready for live' });
    expect(saved.saveResult.savedBlockIdsByPath['/services/loans']).toContain('hero');

    const published = store.publishPage('/services/loans', { actor: createActor(), summary: 'ship it' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.didPublish).toBe(true);
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Published hero title');
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy).toBe(null);
    expect(published.state.collaborationByPath['/services/loans'].history[0].action).toBe('page-published');
  });

  it('re-normalizes malformed preset ids during shared draft saves', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildPresetSeedState(), { actor: createActor() });

    const nextState = cloneJson(store.getSnapshot().state);
    nextState.blocksByPath['/services/loans'][0].presetId = 'default';
    nextState.blocksByPath['/services/loans'][0].settings.col2Title = 'Teamwork.';
    nextState.blocksByPath['/services/retirement/403b'][0].presetId = 'default';
    nextState.blocksByPath['/services/retirement/403b'][0].settings.card2Title = 'Submit your request';

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'update loan apply grid' });

    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans'][0].presetId).toBe('value-cards');
    expect(saved.state.blocksByPath['/services/loans'][0].settings.col2Title).toBe('Teamwork.');
    expect(saved.state.blocksByPath['/services/retirement/403b'][0].presetId).toBe('step-cards');
    expect(saved.state.blocksByPath['/services/retirement/403b'][0].settings.card2Title).toBe('Submit your request');
  });

  it('blocks publishing when another admin still owns a draft on that page', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const nextState = buildSeedStateWithOtherDraft();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Ready to publish CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'cta saved' });

    const published = store.publishPage('/services/loans', { actor: createActor() });

    expect(published.ok).toBe(false);
    expect(published.error).toBe('publish-blocked-by-other-draft');
    expect(published.publishResult.hasConflicts).toBe(true);
    expect(published.publishResult.blockedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][1].settings.title).toBe('Request help');
  });
});
