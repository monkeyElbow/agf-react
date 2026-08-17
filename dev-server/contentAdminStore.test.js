import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDevContentAuthorityStore, createJsonContentStore } from './contentAdminStore';
import {
  normalizeSplitLinkFieldSettings,
  parseLinkValueJson,
} from '../src/lib/linkValue';

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

function expectLinkJson(settings, fieldId, expectedLink) {
  expect(parseLinkValueJson(settings?.[fieldId])).toEqual(expect.objectContaining(expectedLink));
}

function expectNoSplitSettings(settings, fieldIds) {
  fieldIds.forEach((fieldId) => {
    expect(Object.prototype.hasOwnProperty.call(settings || {}, fieldId), `${fieldId} should be stripped`).toBe(false);
  });
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

function buildRetirement403bStateWithGhosts() {
  const pathname = '/services/retirement/403b';
  return {
    pageHierarchy: {
      [pathname]: {
        path: pathname,
        title: '403(b)',
      },
    },
    blocksByPath: {
      [pathname]: [
        {
          id: 'investment_strategy_options',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            html: '<div class="ret403b-strategy-feature"></div>',
            sectionClassName: 'retirement-403b-native-strategy-feature',
          },
        },
        {
          id: 'strategy_enroll_cta',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            sectionClassName: 'retirement-403b-native-strategy-enroll-cta',
            buttonLabel: 'Enroll now',
          },
        },
        {
          id: 'page_content',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            html: `<h2>Retired Ministers' Housing Allowance</h2><p>The unique benefit, which gives ministers a significant tax savings.</p>`,
          },
        },
        {
          id: 'loan_details',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            title: "Retired Ministers' Housing Allowance",
            body: 'The unique benefit, which gives ministers a significant tax savings.',
            anchorId: 'retired-ministers-housing-allowance',
            buttonLabel: 'Quick check calculator',
            buttonPageRef: '/calculators',
            html: '<div class="retirement-403b-loan-copy"><h2>403(b) Plan Loans</h2><div class="retirement-403b-loan-detail-card">Loan detail</div></div>',
            sectionClassName: 'retirement-403b-native-loans',
          },
        },
        {
          id: 'housing_feature',
          kind: 'columns',
          mode: 'dynamic',
          settings: {
            col2Title: "Retired Ministers' Housing Allowance",
            col2BodyHtml: `
              <p>The unique benefit, which gives ministers a significant tax savings, is not available through secular 403(b) plans or IRAs.</p>
              <p class="ret403b-housing-feature-bullet-intro">The maximum housing allowance exemption in any tax year is the lesser of:</p>
              <ul><li>Your actual expenditures</li></ul>
            `,
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      [pathname]: {
        blocks: {
          strategy_enroll_cta: {
            draftedBy: createActor(),
            draftedAt: 1710000000000,
            savedBy: createActor(),
            savedAt: 1710000000000,
            lockedBy: null,
            lockedAt: null,
          },
          page_content: {
            draftedBy: createActor(),
            draftedAt: 1710000000000,
            savedBy: createActor(),
            savedAt: 1710000000000,
            lockedBy: null,
            lockedAt: null,
          },
        },
        history: [
          {
            id: '1710000000000-strategy',
            action: 'block-draft-saved',
            blockId: 'strategy_enroll_cta',
            actor: createActor(),
            createdAt: 1710000000000,
          },
          {
            id: '1710000000000-page-content',
            action: 'block-draft-saved',
            blockId: 'page_content',
            actor: createActor(),
            createdAt: 1710000000000,
          },
        ],
      },
    },
  };
}

function buildCleanRetirement403bState() {
  const pathname = '/services/retirement/403b';
  return {
    pageHierarchy: {
      [pathname]: {
        path: pathname,
        title: '403(b)',
      },
    },
    blocksByPath: {
      [pathname]: [
        {
          id: 'investment_strategy_options',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            html: '<div class="ret403b-strategy-feature"></div>',
            sectionClassName: 'retirement-403b-native-strategy-feature',
          },
        },
        {
          id: 'loan_details',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            title: '',
            body: '',
            anchorId: '',
            buttonLabel: '',
            buttonPageRef: '',
            html: '<div class="retirement-403b-loan-copy"><h2>403(b) Plan Loans</h2><div class="retirement-403b-loan-detail-card">Loan detail</div><p class="retirement-403b-loan-followup">Contact your AGFinancial retirement consultant for more information.</p></div>',
            sectionClassName: 'retirement-403b-native-loans',
          },
        },
        {
          id: 'housing_feature',
          kind: 'columns',
          mode: 'dynamic',
          templateId: 'columns',
          presetId: 'default',
          settings: {
            col2Title: "Retired Ministers' Housing Allowance",
            col2Body: '',
            col2BodyHtml: '<p>This unique IRS benefit, which gives ministers a significant tax savings, is not available through secular 403(b) plans or IRAs. It allows retired ministers to have distributions from the AGFinancial 403(b) plan designated as clergy housing allowance.</p>',
            col2ButtonLabel: 'IRS information',
            col2ButtonUrl: 'https://www.irs.gov/publications/p517',
            col2ButtonPageRef: '',
            col2ButtonStyle: 'outline',
            col2ButtonTone: 'atlantean',
            col2ButtonOpenInNewWindow: true,
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      [pathname]: {
        blocks: {},
        history: [],
      },
    },
  };
}

function buildPlannedGivingStateWithRetiredComparisonMatrix() {
  const pathname = '/services/planned-giving';
  return {
    pageHierarchy: {
      [pathname]: {
        path: pathname,
        title: 'Planned Giving',
      },
    },
    blocksByPath: {
      [pathname]: [
        {
          id: 'comparison_table',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            widget: 'charitable-giving-table',
            anchorId: 'charitable-giving-plan-comparison',
            sectionClassName: 'legacy-giving-comparison',
          },
        },
        {
          id: 'comparison_matrix',
          kind: 'content',
          mode: 'dynamic',
          settings: {
            widget: 'giving-comparison-matrix',
            sectionClassName: 'legacy-giving-comparison-matrix',
          },
        },
      ],
    },
    pathAliases: {},
    collaborationByPath: {
      [pathname]: {
        blocks: {
          comparison_matrix: {
            draftedBy: createActor(),
            draftedAt: 1710000000000,
            savedBy: createActor(),
            savedAt: 1710000000000,
            lockedBy: null,
            lockedAt: null,
          },
          comparison_table: {
            draftedBy: createActor(),
            draftedAt: 1710000000000,
            savedBy: createActor(),
            savedAt: 1710000000000,
            lockedBy: null,
            lockedAt: null,
          },
        },
        history: [
          {
            id: '1710000000000-matrix',
            action: 'block-draft-saved',
            blockId: 'comparison_matrix',
            actor: createActor(),
            createdAt: 1710000000000,
          },
          {
            id: '1710000000001-table',
            action: 'block-draft-saved',
            blockId: 'comparison_table',
            actor: createActor(),
            createdAt: 1710000000001,
          },
        ],
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
          presetId: 'value-cards',
          templateId: 'columns',
          settings: {
            title: "There's more to every loan.",
            col1Title: 'Smart consulting.',
          },
        },
      ],
      '/services/investments': [
        {
          id: 'dashboard_login_cta',
          kind: 'cta_band',
          mode: 'dynamic',
          presetId: 'dashboard-login',
          templateId: 'cta_band',
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
          presetId: 'step-cards',
          templateId: 'card_grid',
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
      '/services/planned-giving/donor-advised-fund': {
        path: '/services/planned-giving/donor-advised-fund',
        title: 'Generosity Fund',
      },
    },
    blocksByPath: {
      '/services/planned-giving/donor-advised-fund': [
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
      '/services/planned-giving/donor-advised-fund': {
        blocks: {},
        history: [],
      },
    },
  };
}

function createStore(persistenceFile, options = {}) {
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
    ...options,
  });
}

function createJsonStore(persistenceFile, options = {}) {
  return createJsonContentStore({
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
    ...options,
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

function listBackupFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.startsWith('content-admin-shared-') && fileName.endsWith('.json'))
    .sort();
}

function readSeedBaselineFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('createDevContentAuthorityStore', () => {
  it('round-trips current shared and seed snapshots through the JSON adapter without rewriting valid JSON', () => {
    const persistenceFile = makeTempFile();
    const sharedSourceFile = path.resolve(process.cwd(), 'dev-data/content-admin-shared.json');
    const seedSourceFile = path.resolve(process.cwd(), 'dev-data/content-admin-seed-baseline.json');
    const sharedSourceText = fs.readFileSync(sharedSourceFile, 'utf8');
    fs.writeFileSync(persistenceFile, sharedSourceText);

    const store = createJsonStore(persistenceFile);
    const currentValidation = store.validateSnapshot(store.readCurrentState(), {
      label: 'current shared state',
    });
    const publishedValidation = store.validateSnapshot(store.readPublishedSnapshot(), {
      label: 'published shared snapshot',
    });
    const seedRecord = readSeedBaselineFile(seedSourceFile);
    const seedValidation = store.validateSnapshot(seedRecord.seedState, {
      label: 'seed baseline state',
    });
    const currentSecondPass = store.validateSnapshot(JSON.parse(JSON.stringify(currentValidation.state)), {
      label: 'current shared state second pass',
    });
    const publishedSecondPass = store.validateSnapshot(JSON.parse(JSON.stringify(publishedValidation.state)), {
      label: 'published shared snapshot second pass',
    });
    const seedSecondPass = store.validateSnapshot(JSON.parse(JSON.stringify(seedValidation.state)), {
      label: 'seed baseline state second pass',
    });

    expect(currentValidation.ok).toBe(true);
    expect(currentValidation.findings).toEqual([]);
    expect(publishedValidation.ok).toBe(true);
    expect(publishedValidation.findings).toEqual([]);
    expect(seedValidation.ok).toBe(true);
    expect(seedValidation.findings).toEqual([]);
    expect(JSON.stringify(currentSecondPass.state)).toBe(JSON.stringify(currentValidation.state));
    expect(JSON.stringify(publishedSecondPass.state)).toBe(JSON.stringify(publishedValidation.state));
    expect(JSON.stringify(seedSecondPass.state)).toBe(JSON.stringify(seedValidation.state));
    expect(fs.readFileSync(persistenceFile, 'utf8')).toBe(sharedSourceText);
  });

  it('serves only the published block slice for public route hydration', () => {
    const persistenceFile = makeTempFile();
    const store = createJsonStore(persistenceFile);
    const actor = createActor();
    const seedState = buildSeedState();

    store.resetFromSeed(seedState, { actor });
    const draftState = cloneJson(store.readCurrentState());
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Draft-only title';
    store.savePageDraft(draftState, { actor, summary: 'route hydration test draft' });
    const routeSnapshot = store.getPublishedRouteSnapshot('/services/loans');

    expect(routeSnapshot.initialized).toBe(true);
    expect(Object.keys(routeSnapshot.state.blocksByPath)).toEqual(['/services/loans']);
    expect(routeSnapshot.state.blocksByPath['/services/loans']).toHaveLength(2);
    expect(routeSnapshot.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(routeSnapshot.state.blocksByPath['/services/investments']).toBeUndefined();
    expect(routeSnapshot.state.collaborationByPath).toEqual({});
  });

  it('returns clear validation findings for malformed blocks', () => {
    const persistenceFile = makeTempFile();
    const store = createJsonStore(persistenceFile);

    const validation = store.validateSnapshot({
      pageHierarchy: {
        '/broken': {
          path: '/broken',
          title: 'Broken',
        },
      },
      blocksByPath: {
        '/broken': [
          {
            kind: 'content',
            mode: 'dynamic',
            settings: {},
          },
          {
            id: 'bad_settings',
            kind: 'content',
            mode: 'dynamic',
            settings: 'not an object',
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    }, {
      label: 'malformed adapter state',
    });
    const codes = validation.findings.map((finding) => finding.code);
    const messages = validation.findings.map((finding) => finding.message).join('\n');

    expect(validation.ok).toBe(false);
    expect(codes).toContain('block-id-missing');
    expect(codes).toContain('block-settings-not-object');
    expect(messages).toContain('malformed adapter state.blocksByPath[/broken][0] is missing id.');
    expect(messages).toContain('malformed adapter state.blocksByPath[/broken][1].settings must be an object.');
  });

  it('exposes database-ready adapter operations while preserving JSON persistence shape', () => {
    const persistenceFile = makeTempFile();
    const store = createJsonStore(persistenceFile);
    const actor = createActor();

    store.resetFromSeed(buildSeedState(), { actor });
    const draftState = cloneJson(store.readCurrentState());
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Adapter draft title';

    const savedDraft = store.savePageDraft(draftState, { actor, summary: 'adapter draft' });
    const persistedAfterDraft = readPersistedRecord(persistenceFile);

    expect(savedDraft.ok).toBe(true);
    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Adapter draft title');
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(persistedAfterDraft.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Adapter draft title');
    expect(persistedAfterDraft.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');

    const published = store.publishPath('/services/loans', { actor, summary: 'adapter publish' });
    const persistedAfterPublish = readPersistedRecord(persistenceFile);

    expect(published.ok).toBe(true);
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Adapter draft title');
    expect(persistedAfterPublish.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Adapter draft title');
    expect(persistedAfterPublish.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Adapter draft title');
    expect(Object.keys(persistedAfterPublish)).toEqual(expect.arrayContaining([
      'initialized',
      'version',
      'updatedAt',
      'announcementUpdatedAt',
      'announcement',
      'state',
      'baseSnapshot',
      'revisionsByPath',
    ]));
  });

  it('keeps draft, published, and seed layers distinct until explicit promotion', () => {
    const persistenceFile = makeTempFile();
    const seedBaselineFile = path.join(path.dirname(persistenceFile), 'content-admin-seed-baseline.json');
    const seedState = buildSeedState();
    fs.writeFileSync(seedBaselineFile, JSON.stringify({ seedState }, null, 2));
    const store = createStore(persistenceFile, { seedBaselineFile });
    const actor = createActor();

    store.resetFromSeed(seedState, { actor });
    const draftState = cloneJson(store.readCurrentState());
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Lifecycle draft';
    store.savePageDraft(draftState, { actor, summary: 'lifecycle draft' });

    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Lifecycle draft');
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(readSeedBaselineFile(seedBaselineFile).seedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');

    store.publishPath('/services/loans', { actor, summary: 'lifecycle publish' });
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Lifecycle draft');
    expect(readSeedBaselineFile(seedBaselineFile).seedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');

    store.promoteCurrentStateToSeed({ actor });
    expect(readSeedBaselineFile(seedBaselineFile).seedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Lifecycle draft');
  });

  it('lets the JSON adapter validate state snapshots and create restorable backups', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createJsonStore(persistenceFile, { backupDir });
    const actor = createActor();

    store.resetFromSeed(buildSeedState(), { actor });
    const validation = store.validateSnapshot(store.readCurrentState(), {
      label: 'adapter state',
    });
    const backup = store.createBackup('adapter-contract-test', {
      source: 'json-adapter',
    });
    const draftState = cloneJson(store.readCurrentState());
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Temporary draft after backup';
    store.savePageDraft(draftState, { actor, summary: 'temporary draft' });

    const restored = store.restoreBackup(backup.fileName, { actor });

    expect(validation.ok).toBe(true);
    expect(validation.findings).toEqual([]);
    expect(backup.fileName).toMatch(/^content-admin-shared-\d{8}-\d{6}\.json$/);
    expect(store.listBackups().map((entry) => entry.fileName)).toContain(backup.fileName);
    expect(restored.ok).toBe(true);
    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
  });

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

  it('refreshes an already-running client when another client persists a newer snapshot', () => {
    const persistenceFile = makeTempFile();
    const writer = createStore(persistenceFile);
    writer.resetFromSeed(buildSeedState(), { actor: createActor() });
    const reader = createStore(persistenceFile);
    const nextState = cloneJson(writer.readCurrentState());
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'External draft visible';

    writer.saveDraft(nextState, { actor: createActor(), summary: 'external draft' });

    expect(reader.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('External draft visible');
  });

  it('exposes authority metadata for stale-store diagnosis', () => {
    const persistenceFile = makeTempFile();
    const store = createJsonStore(persistenceFile);
    const metadata = store.getSnapshot().authority;

    expect(metadata.persistenceFile).toBe(path.resolve(persistenceFile));
    expect(metadata.persistenceMtimeMs === null || Number(metadata.persistenceMtimeMs) > 0).toBe(true);
    expect(Number(metadata.loadedAt)).toBeGreaterThan(0);
    expect(metadata.recordRevision).toBe(0);
    expect(metadata.draftRevision).toBe(0);
    expect(metadata.publishedRevision).toMatch(/^[a-f0-9]{12}$/);
  });

  it('publishes seed route slices without touching unrelated drafts', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const seedState = buildSeedState();
    seedState.pageHierarchy['/services/investments'] = {
      path: '/services/investments',
      title: 'Investments',
    };
    seedState.blocksByPath['/services/investments'] = [
      {
        id: 'intro',
        kind: 'content',
        mode: 'dynamic',
        settings: {
          body: 'Investment intro',
        },
      },
    ];
    seedState.collaborationByPath['/services/investments'] = {
      blocks: {},
      history: [],
    };

    store.resetFromSeed(seedState, { actor: createActor() });

    const draftState = cloneJson(store.getSnapshot().state);
    draftState.blocksByPath['/services/loans'] = [
      {
        id: 'hero',
        kind: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Draft-only loans title',
        },
      },
    ];
    draftState.blocksByPath['/services/investments'][0].settings.body = 'Unrelated investment draft';
    store.saveDraft(draftState, { actor: createActor(), summary: 'draft changes' });

    const beforePublish = readPersistedRecord(persistenceFile);
    const untouchedInvestmentState = cloneJson(beforePublish.state.blocksByPath['/services/investments']);
    const untouchedInvestmentBase = cloneJson(beforePublish.baseSnapshot.blocksByPath['/services/investments']);
    const untouchedInvestmentCollaboration = cloneJson(beforePublish.state.collaborationByPath['/services/investments']);

    const nextSeedState = cloneJson(seedState);
    nextSeedState.blocksByPath['/services/loans'] = [
      {
        id: 'cta_form',
        kind: 'cta_form',
        mode: 'dynamic',
        settings: {
          title: 'Seed CTA update',
        },
      },
      {
        id: 'hero',
        kind: 'hero',
        mode: 'dynamic',
        settings: {
          line1Text: 'Seed route title',
        },
      },
    ];
    nextSeedState.pathAliases = {
      '/loans': '/services/loans',
      '/invest': '/services/investments',
    };

    const published = store.publishSeedRouteSlices(nextSeedState, ['/services/loans'], {
      actor: createActor(),
      summary: 'publish loans seed slice',
      forceOverwriteAdminEdits: true,
      reason: 'Apply reviewed seed route update',
    });
    const persisted = readPersistedRecord(persistenceFile);

    expect(published.ok).toBe(true);
    expect(published.publishResult.didPublish).toBe(true);
    expect(persisted.state.blocksByPath['/services/loans'].map((block) => block.id)).toEqual(['cta_form', 'hero']);
    expect(persisted.baseSnapshot.blocksByPath['/services/loans'].map((block) => block.id)).toEqual(['cta_form', 'hero']);
    expect(persisted.state.blocksByPath['/services/loans'][1].settings.line1Text).toBe('Seed route title');
    expect(persisted.baseSnapshot.blocksByPath['/services/loans'][0].settings.title).toBe('Seed CTA update');
    expect(persisted.state.pathAliases['/loans']).toBe('/services/loans');
    expect(persisted.state.pathAliases['/invest']).toBeUndefined();
    expect(persisted.state.blocksByPath['/services/investments']).toEqual(untouchedInvestmentState);
    expect(persisted.baseSnapshot.blocksByPath['/services/investments']).toEqual(untouchedInvestmentBase);
    expect(persisted.state.collaborationByPath['/services/investments']).toEqual(untouchedInvestmentCollaboration);
  });

  it('does not rewrite the shared content file when seed route slices are already live', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const seedState = buildSeedState();

    store.resetFromSeed(seedState, { actor: createActor() });
    const beforePublish = fs.readFileSync(persistenceFile, 'utf8');
    const beforeUpdatedAt = readPersistedRecord(persistenceFile).updatedAt;

    const published = store.publishSeedRouteSlices(seedState, ['/services/loans'], {
      actor: createActor(),
      summary: 'already live seed slice',
    });
    const afterPublish = fs.readFileSync(persistenceFile, 'utf8');

    expect(published.ok).toBe(true);
    expect(published.publishResult.didPublish).toBe(false);
    expect(readPersistedRecord(persistenceFile).updatedAt).toBe(beforeUpdatedAt);
    expect(afterPublish).toBe(beforePublish);
  });

  it('normalizes split link targets before saving shared snapshots', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings = {
      ...nextState.blocksByPath['/services/loans'][0].settings,
      buttonUrl: '/old-target',
      buttonPageRef: '/contact-us',
      buttonOpenInNewWindow: 'false',
    };

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'split link repair' });
    const persistedBlock = readPersistedRecord(persistenceFile).state.blocksByPath['/services/loans'][0];

    expect(saved.ok).toBe(true);
    expectLinkJson(persistedBlock.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
      openInNewWindow: false,
    });
    expectNoSplitSettings(persistedBlock.settings, ['buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow']);
  });

  it('persists the shared site announcement for other clients', () => {
    const persistenceFile = makeTempFile();
    const storeA = createStore(persistenceFile);

    storeA.saveAnnouncement({
      enabled: true,
      message: 'Network-visible banner',
      backgroundId: 'super-grey',
      textColorId: 'white',
      linkEnabled: true,
      linkPath: '/services/loans',
    }, { actor: createActor() });

    const storeB = createStore(persistenceFile);
    expect(storeB.getAnnouncementSnapshot().announcement.message).toBe('Network-visible banner');
    expect(storeB.getAnnouncementSnapshot().announcement.backgroundId).toBe('super-grey');
    expect(storeB.getAnnouncementSnapshot().announcement.linkPath).toBe('/services/loans');
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

  it('keeps revision history in cold route files when configured', () => {
    const persistenceFile = makeTempFile();
    const revisionDirectory = path.join(path.dirname(persistenceFile), 'revisions');
    const store = createJsonStore(persistenceFile, { revisionDirectory });
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Updated CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'cold history' });

    const hotRecord = readPersistedRecord(persistenceFile);
    expect(hotRecord.revisionsByPath).toBeUndefined();
    expect(fs.readdirSync(revisionDirectory)).toContain(`${encodeURIComponent('/services/loans')}.json`);

    const reloaded = createJsonStore(persistenceFile, { revisionDirectory });
    expect(reloaded.getRevisionHistory('/services/loans')[0].summary).toBe('cold history');
  });

  it('clears stale foreign draft ownership when stored blocks match the base snapshot', () => {
    const persistenceFile = makeTempFile();
    const seedState = buildSeedState();
    const staleActor = createActor({
      userId: 'dev-stale',
      displayName: 'Stale Admin',
    });
    const staleMeta = {
      draftedBy: staleActor,
      draftedAt: 1710000000000,
      savedBy: staleActor,
      savedAt: 1710000000000,
      lockedBy: staleActor,
      lockedAt: 1710000000000,
    };

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000000000,
      state: {
        ...cloneJson(seedState),
        collaborationByPath: {
          '/services/loans': {
            blocks: {
              hero: staleMeta,
              cta_form: staleMeta,
            },
            history: [],
          },
        },
      },
      baseSnapshot: cloneJson(seedState),
      revisionsByPath: {},
    }));

    const store = createStore(persistenceFile);
    const snapshot = store.getSnapshot();
    const blocksMeta = snapshot.state.collaborationByPath['/services/loans'].blocks;

    expect(blocksMeta.hero.draftedBy).toBe(null);
    expect(blocksMeta.hero.lockedBy).toBe(null);
    expect(blocksMeta.hero.savedBy.displayName).toBe('Stale Admin');
    expect(blocksMeta.cta_form.draftedBy).toBe(null);
    expect(blocksMeta.cta_form.lockedBy).toBe(null);
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

  it('keeps ordinary startup and reads non-mutating when legacy revision migration is pending', () => {
    const persistenceFile = makeTempFile();
    const revisionDirectory = path.join(path.dirname(persistenceFile), 'revisions');
    const legacyState = buildSeedState();
    const legacyRecord = {
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: buildSeedState(),
      baseSnapshot: buildSeedState(),
      revisionsByPath: {
        '/services/loans': [{
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
        }],
      },
    };
    fs.writeFileSync(persistenceFile, `${JSON.stringify(legacyRecord, null, 2)}\n`);
    const before = fs.readFileSync(persistenceFile);

    const store = createJsonStore(persistenceFile, { revisionDirectory });

    expect(fs.readFileSync(persistenceFile)).toEqual(before);
    expect(fs.existsSync(revisionDirectory)).toBe(false);
    expect(store.getRevisionHistory('/services/loans')[0].summary).toBe('legacy revision');
    expect(fs.readFileSync(persistenceFile)).toEqual(before);
  });

  it('restores page revision block arrays without resurrecting missing current seed or retired static blocks', () => {
    const persistenceFile = makeTempFile();
    const currentState = buildSeedState();
    const pathname = '/services/loans';
    const ctaRevisionBlock = {
      ...cloneJson(currentState.blocksByPath[pathname][1]),
      settings: {
        title: 'Revision CTA',
        targetSectionKey: 'class:old-native-section',
      },
    };

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: currentState,
      baseSnapshot: currentState,
      revisionsByPath: {
        [pathname]: [
          {
            id: '1710000005000-partial',
            pathname,
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'partial old revision',
            snapshot: {
              pathname,
              page: currentState.pageHierarchy[pathname],
              blocks: [
                ctaRevisionBlock,
                {
                  id: 'old_static_section',
                  kind: 'content',
                  mode: 'static',
                  settings: {
                    html: '<p>Old static section</p>',
                  },
                },
              ],
              collaboration: {
                blocks: {
                  cta_form: {
                    draftedBy: createActor(),
                    draftedAt: 1710000000000,
                    savedBy: createActor(),
                    savedAt: 1710000000000,
                    lockedBy: null,
                    lockedAt: null,
                  },
                  old_static_section: {
                    draftedBy: createActor(),
                    draftedAt: 1710000000000,
                    savedBy: createActor(),
                    savedAt: 1710000000000,
                    lockedBy: null,
                    lockedAt: null,
                  },
                },
                history: [
                  {
                    id: '1710000000000-cta',
                    action: 'block-draft-saved',
                    blockId: 'cta_form',
                    actor: createActor(),
                    createdAt: 1710000000000,
                  },
                  {
                    id: '1710000000000-old-static',
                    action: 'block-draft-saved',
                    blockId: 'old_static_section',
                    actor: createActor(),
                    createdAt: 1710000000000,
                  },
                ],
              },
              pathAliases: {},
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const restored = store.restorePageRevision(pathname, '1710000005000-partial', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];
    const restoredCollaboration = restored.state.collaborationByPath[pathname];

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.map((block) => `${block.id}:${block.kind}:${block.mode}`)).toEqual([
      'cta_form:cta_form:dynamic',
    ]);
    expect(restoredBlocks.some((block) => block.id === 'hero')).toBe(false);
    expect(restoredBlocks.find((block) => block.id === 'cta_form')?.settings.title).toBe('Revision CTA');
    expect(restoredBlocks.find((block) => block.id === 'cta_form')?.settings.targetSectionKey).toBeUndefined();
    expect(restoredCollaboration.blocks.cta_form).toBeTruthy();
    expect(restoredCollaboration.blocks.old_static_section).toBeUndefined();
    expect(restoredCollaboration.history.map((entry) => entry.blockId)).toEqual(['cta_form']);
  });

  it('does not silently repair retired 403(b) strategy CTAs or RMHA copy from persisted revision restores', () => {
    const persistenceFile = makeTempFile();
    const ghostState = buildRetirement403bStateWithGhosts();
    const pathname = '/services/retirement/403b';

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: ghostState,
      baseSnapshot: ghostState,
      revisionsByPath: {
        [pathname]: [
          {
            id: '1710000005000-ghost',
            pathname,
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'ghost revision',
            snapshot: {
              pathname,
              page: ghostState.pageHierarchy[pathname],
              blocks: ghostState.blocksByPath[pathname],
              collaboration: ghostState.collaborationByPath[pathname],
              pathAliases: {},
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const activeBlocks = store.getSnapshot().state.blocksByPath[pathname];
    const activeLoanDetails = activeBlocks.find((block) => block.id === 'loan_details');

    expect(activeBlocks.some((block) => block.id === 'strategy_enroll_cta')).toBe(true);
    expect(activeBlocks.some((block) => block.id === 'page_content')).toBe(true);
    expect(activeLoanDetails.settings.title).toBe("Retired Ministers' Housing Allowance");
    expect(activeLoanDetails.settings.body).toContain('The unique benefit, which gives ministers');
    expect(activeLoanDetails.settings.anchorId).toBe('retired-ministers-housing-allowance');
    expect(activeBlocks.find((block) => block.id === 'housing_feature')?.settings.col2Title).toBe("Retired Ministers' Housing Allowance");
    expect(activeBlocks.find((block) => block.id === 'housing_feature')?.settings.col2BodyHtml).toContain('ret403b-housing-feature-bullet-intro');
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.strategy_enroll_cta).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.page_content).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['strategy_enroll_cta', 'page_content']);

    const history = store.getRevisionHistory(pathname);
    expect(history[0].blocks.map((block) => block.id)).toEqual([
      'investment_strategy_options',
      'strategy_enroll_cta',
      'page_content',
      'loan_details',
      'housing_feature',
    ]);

    const restored = store.restorePageRevision(pathname, '1710000005000-ghost', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];
    const restoredLoanDetails = restoredBlocks.find((block) => block.id === 'loan_details');

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.some((block) => block.id === 'strategy_enroll_cta')).toBe(true);
    expect(restoredBlocks.some((block) => block.id === 'page_content')).toBe(true);
    expect(restoredLoanDetails.settings.title).toBe("Retired Ministers' Housing Allowance");
    expectLinkJson(restoredLoanDetails.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/calculators',
    });
    expect(restored.state.collaborationByPath[pathname].blocks.strategy_enroll_cta).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].blocks.page_content).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['strategy_enroll_cta', 'page_content']);
  });

  it('leaves clean 403(b) snapshots structurally unchanged without RMHA runtime rescue branches', () => {
    const persistenceFile = makeTempFile();
    const cleanState = buildCleanRetirement403bState();
    const pathname = '/services/retirement/403b';

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: cleanState,
      baseSnapshot: cleanState,
      revisionsByPath: {
        [pathname]: [
          {
            id: '1710000005000-clean',
            pathname,
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'clean revision',
            snapshot: {
              pathname,
              page: cleanState.pageHierarchy[pathname],
              blocks: cleanState.blocksByPath[pathname],
              collaboration: cleanState.collaborationByPath[pathname],
              pathAliases: {},
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const snapshot = store.getSnapshot();
    const history = store.getRevisionHistory(pathname);
    const expectedBlocks = cleanState.blocksByPath[pathname].map((block) => ({
      ...block,
      settings: normalizeSplitLinkFieldSettings(block.settings, { stripSplitFields: true }),
    }));

    expect(snapshot.state.blocksByPath[pathname]).toEqual(expectedBlocks);
    expect(snapshot.baseSnapshot.blocksByPath[pathname]).toEqual(expectedBlocks);
    expect(history[0].blocks.map((block) => block.id)).toEqual(cleanState.blocksByPath[pathname].map((block) => block.id));
  });

  it('preserves unsupported planned giving comparison shapes during load and revision restore', () => {
    const persistenceFile = makeTempFile();
    const ghostState = buildPlannedGivingStateWithRetiredComparisonMatrix();
    const pathname = '/services/planned-giving';

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state: ghostState,
      baseSnapshot: ghostState,
      revisionsByPath: {
        [pathname]: [
          {
            id: '1710000005000-comparison',
            pathname,
            createdAt: 1710000005000,
            actor: createActor(),
            reason: 'draft-saved',
            summary: 'comparison matrix revision',
            snapshot: {
              pathname,
              page: ghostState.pageHierarchy[pathname],
              blocks: ghostState.blocksByPath[pathname],
              collaboration: ghostState.collaborationByPath[pathname],
              pathAliases: {},
            },
          },
        ],
      },
    }));

    const store = createStore(persistenceFile);
    const activeBlocks = store.getSnapshot().state.blocksByPath[pathname];

    expect(activeBlocks.map((block) => block.id)).toEqual(['comparison_table', 'comparison_matrix']);
    expect(activeBlocks.some((block) => block.settings?.widget === 'charitable-giving-table')).toBe(true);
    expect(activeBlocks.find((block) => block.id === 'comparison_table')?.settings).toMatchObject({
      widget: 'charitable-giving-table',
      anchorId: 'charitable-giving-plan-comparison',
      sectionClassName: 'legacy-giving-comparison',
    });
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.comparison_matrix).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.comparison_table).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['comparison_matrix', 'comparison_table']);

    const history = store.getRevisionHistory(pathname);
    expect(history[0].blocks.map((block) => block.id)).toEqual(['comparison_table', 'comparison_matrix']);

    const restored = store.restorePageRevision(pathname, '1710000005000-comparison', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.map((block) => block.id)).toEqual(['comparison_table', 'comparison_matrix']);
    expect(restoredBlocks.find((block) => block.id === 'comparison_table')?.settings?.widget).toBe('charitable-giving-table');
    expect(restored.state.collaborationByPath[pathname].blocks.comparison_matrix).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].blocks.comparison_table).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['comparison_matrix', 'comparison_table']);
  });

  it('normalizes stale IRA comparison tables from the old Key difference column shape', () => {
    const persistenceFile = makeTempFile();
    const pathname = '/services/retirement/iras';
    const state = {
      pageHierarchy: {
        [pathname]: {
          path: pathname,
          title: 'IRAs',
        },
      },
      blocksByPath: {
        [pathname]: [
          {
            id: 'comparison_table',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              tableHeadersJson: ['Key difference', 'Traditional IRA', 'Roth IRA'],
              tableRowsJson: [
                ['Eligibility', 'Must have earned income.', 'Must meet Roth IRA limits.'],
              ],
            },
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {
        [pathname]: {
          blocks: {},
          history: [],
        },
      },
    };

    fs.writeFileSync(persistenceFile, JSON.stringify({
      initialized: true,
      version: 1,
      updatedAt: 1710000005000,
      state,
      baseSnapshot: state,
    }));

    const store = createStore(persistenceFile);
    const comparisonBlock = store.getSnapshot().state.blocksByPath[pathname][0];

    expect(comparisonBlock.settings.tableHeadersJson).toEqual(['Key difference', 'Traditional IRA', 'Roth IRA']);
    expect(comparisonBlock.settings.tableRowsJson).toEqual([
      ['Eligibility', 'Must have earned income.', 'Must meet Roth IRA limits.'],
    ]);
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

  it('discards only one route draft back to published content and creates a recovery backup', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const seedState = buildSeedState();
    store.resetFromSeed(seedState, { actor });

    const draftState = buildSeedState();
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Unwanted draft';
    draftState.blocksByPath['/services/investments'] = [
      {
        ...JSON.parse(JSON.stringify(draftState.blocksByPath['/services/loans'][1])),
        id: 'unrelated-cta',
        settings: {
          ...JSON.parse(JSON.stringify(draftState.blocksByPath['/services/loans'][1].settings)),
          title: 'Keep unrelated draft',
        },
      },
    ];
    store.saveDraft(draftState, { actor, summary: 'draft before discard' });
    const baseBeforeDiscard = store.readPublishedSnapshot();

    const discarded = store.discardPageDraft('/services/loans', {
      actor,
      summary: 'admin changed mind',
    });

    expect(discarded.ok).toBe(true);
    expect(discarded.discardResult.status).toBe('discarded');
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe(baseBeforeDiscard.blocksByPath['/services/loans'][0].settings.line1Text);
    expect(store.getSnapshot().state.blocksByPath['/services/investments'][0].settings.title)
      .toBe('Keep unrelated draft');
    expect(store.readPublishedSnapshot()).toEqual(baseBeforeDiscard);
    expect(store.listBackups()[0].reason).toBe('before-page-draft-discard');
    expect(store.getSnapshot().state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
  });

  it('does not create a backup for a clean route draft discard', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const discarded = store.discardPageDraft('/services/loans', { actor: createActor() });

    expect(discarded.ok).toBe(true);
    expect(discarded.discardResult.status).toBe('no-op');
    expect(store.listBackups()).toEqual([]);
  });

  it('discards one block draft while preserving other unpublished blocks on the same page', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const seedState = buildSeedState();
    store.resetFromSeed(seedState, { actor });

    const draftState = buildSeedState();
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Discard this block';
    draftState.blocksByPath['/services/loans'][1].settings.title = 'Keep this block draft';
    store.saveDraft(draftState, { actor, summary: 'two block drafts' });
    const publishedBeforeDiscard = store.readPublishedSnapshot();

    const discarded = store.discardBlockDraft('/services/loans', 'hero', {
      actor,
      summary: 'admin changed mind on hero',
    });

    expect(discarded.ok).toBe(true);
    expect(discarded.discardResult).toMatchObject({ status: 'discarded', scope: 'block', changedBlockIds: ['hero'] });
    const currentBlocks = store.getSnapshot().state.blocksByPath['/services/loans'];
    expect(currentBlocks[0].settings.line1Text).toBe(publishedBeforeDiscard.blocksByPath['/services/loans'][0].settings.line1Text);
    expect(currentBlocks[1].settings.title).toBe('Keep this block draft');
    expect(store.readPublishedSnapshot()).toEqual(publishedBeforeDiscard);
    expect(store.listBackups()[0].reason).toBe('before-block-draft-discard');
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
    expect(investorCta.id).toBe('dashboard_login_cta');
    expect(investorCta.templateId).toBe('cta_band');
    expect(investorCta.presetId).toBe('dashboard-login');
    expect(loanApply.presetId).toBe('step-cards');
  });

  it('repairs the stale generosity fund hero order and CTA fields in shared snapshots', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildGenerosityFundSeedState(), { actor: createActor() });

    const heroBlock = store.getSnapshot().state.blocksByPath['/services/planned-giving/donor-advised-fund'][0];
    expectLinkJson(heroBlock.settings, 'button1LinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expectLinkJson(heroBlock.settings, 'button2LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expectNoSplitSettings(heroBlock.settings, ['button1Url', 'button2Url', 'button2PageRef']);
    expect(heroBlock.settings.button2Action).toBeUndefined();
    expect(heroBlock.settings.button2TargetAnchorId).toBeUndefined();
    expect(heroBlock.settings.button2TargetBlockId).toBeUndefined();

    const reloaded = createStore(persistenceFile);
    const reloadedHero = reloaded.getSnapshot().state.blocksByPath['/services/planned-giving/donor-advised-fund'][0];
    expect(Object.prototype.hasOwnProperty.call(reloadedHero.settings, 'button2Url')).toBe(false);
    expect(reloadedHero.settings.button2Action).toBeUndefined();
    expect(reloadedHero.settings.button2TargetAnchorId).toBeUndefined();
  });

  it('keeps the current Generosity Fund block through load/save and migrates it only explicitly', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });
    const actor = createActor();
    const legacyState = buildGenerosityFundSeedState();
    const referenceState = cloneJson(legacyState);
    referenceState.blocksByPath['/services/planned-giving/donor-advised-fund'][0].settings = {
      title: 'Canonical title',
      canonicalMarker: 'reference-state',
    };
    referenceState.blocksByPath['/services/planned-giving/donor-advised-fund'][0].editableFields = [{ id: 'title' }];

    store.resetFromSeed(legacyState, { actor });
    const beforeSave = cloneJson(store.readCurrentState());
    expect(beforeSave.blocksByPath['/services/planned-giving/donor-advised-fund'][0].settings.line1Text)
      .toBe('Your giving.');

    store.saveDraft(cloneJson(beforeSave), { actor, summary: 'ordinary no-op save' });
    const reloaded = createStore(persistenceFile, { backupDir });
    expect(reloaded.getSnapshot().state.blocksByPath['/services/planned-giving/donor-advised-fund'][0].settings.line1Text)
      .toBe('Your giving.');
    expect(reloaded.listBackups()).toEqual([]);

    const migrated = reloaded.migrateGenerosityFundSnapshot({
      defaultState: referenceState,
      actor,
      reason: 'one-time migration of retired Generosity Fund block shape',
    });
    const migratedBlock = migrated.state.blocksByPath['/services/planned-giving/donor-advised-fund'][0];

    expect(migrated.ok).toBe(true);
    expect(migrated.migration).toMatchObject({
      id: 'generosity-fund-daf-refresh',
      version: 1,
      didMigrate: true,
    });
    expect(migratedBlock.settings).toEqual({
      title: 'Canonical title',
      canonicalMarker: 'reference-state',
    });
    expect(migrated.baseSnapshot.blocksByPath['/services/planned-giving/donor-advised-fund'][0].settings)
      .toEqual(migratedBlock.settings);
    expect(migrated.backup.reason).toBe('before-generosity-fund-snapshot-migration');
    expect(migrated.snapshotMigrations['generosity-fund-daf-refresh']).toBe(1);

    const reloadedAfterMigration = createStore(persistenceFile, { backupDir });
    expect(reloadedAfterMigration.getSnapshot().snapshotMigrations['generosity-fund-daf-refresh']).toBe(1);
    const secondPass = reloadedAfterMigration.migrateGenerosityFundSnapshot({
      defaultState: referenceState,
      actor,
      reason: 'repeat should be a no-op',
    });
    expect(secondPass.migration).toMatchObject({ alreadyApplied: true, didMigrate: false });
  });

  it('migrates P&C arrow-prefixed resource cards with a backup and no-op repeat', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });
    const actor = createActor();
    const pathname = '/services/insurance/property-casualty-insurance';
    const resourceBlock = {
      id: 'resources',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Body: '› Sexual misconduct liability\n› Medical payments',
        card2Body: '› Online safety tools\n› **Comprehensive risk management guide**',
      },
    };
    const state = {
      pageHierarchy: { [pathname]: { path: pathname, title: 'Property & Casualty Insurance' } },
      blocksByPath: { [pathname]: [resourceBlock] },
      pathAliases: {},
      collaborationByPath: { [pathname]: { blocks: {}, history: [] } },
    };

    store.resetFromSeed(state, { actor });
    const migrated = store.migrateInsurancePcResourceCardsSnapshot({
      actor,
      reason: 'convert P&C resource arrows to editable lists',
    });
    const migratedBlock = migrated.state.blocksByPath[pathname][0];

    expect(migrated.ok).toBe(true);
    expect(migrated.migration).toMatchObject({
      id: 'insurance-pc-resource-card-lists',
      version: 1,
      didMigrate: true,
    });
    expect(migratedBlock.settings).toMatchObject({
      card1Body: '',
      card1ListJson: JSON.stringify(['Sexual misconduct liability', 'Medical payments']),
      card2Body: '',
      card2ListJson: JSON.stringify(['Online safety tools', '**Comprehensive risk management guide**']),
    });
    expect(migrated.backup.reason).toBe('before-insurance-pc-resource-card-lists-migration');
    expect(migrated.snapshotMigrations['insurance-pc-resource-card-lists']).toBe(1);

    const reloaded = createStore(persistenceFile, { backupDir });
    const secondPass = reloaded.migrateInsurancePcResourceCardsSnapshot({
      actor,
      reason: 'repeat should be a no-op',
    });
    expect(secondPass.migration).toMatchObject({ alreadyApplied: true, didMigrate: false });
  });

  it('migrates Online Contributions setup cards onto the shared numbered-step preset', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });
    const actor = createActor();
    const pathname = '/online-contributions';
    const setupSteps = {
      id: 'setup_steps',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'default',
      settings: {
        columns: 'three',
        card1Title: '1) Create a new user account for your company.',
        card1Body: 'Start in Online Access and create a user account for your company.',
        card2Title: '2) Select "403(b) Employer" as the Account Type',
        card2Body: 'Choose the employer contribution account type during setup so the account is configured correctly.',
        card3Title: '3) Get your Employer Code',
        card3Body: 'Contact Client Services at 866.621.1787 or clientservices@agfinancial.org for your Employer Code to complete your account setup.',
      },
    };
    const state = {
      pageHierarchy: { [pathname]: { path: pathname, title: 'Online Contributions' } },
      blocksByPath: { [pathname]: [setupSteps] },
      pathAliases: {},
      collaborationByPath: { [pathname]: { blocks: {}, history: [] } },
    };

    store.resetFromSeed(state, { actor });
    const migrated = store.migrateOnlineContributionsStepsSnapshot({
      actor,
      reason: 'align Online Contributions with the shared numbered-step editor treatment',
    });
    const migratedBlock = migrated.state.blocksByPath[pathname][0];

    expect(migrated.ok).toBe(true);
    expect(migrated.migration).toMatchObject({
      id: 'online-contributions-step-cards',
      version: 1,
      didMigrate: true,
    });
    expect(migratedBlock).toMatchObject({
      presetId: 'step-cards',
      settings: {
        columns: 'one',
        card1Title: '01',
        card2Title: '02',
        card3Title: '03',
      },
    });
    expect(migratedBlock.settings.card1Body).toContain('Create a new user account for your company.');
    expect(migratedBlock.settings.card2Body).toContain('Select "403(b) Employer" as the Account Type');
    expect(migratedBlock.settings.card3Body).toContain('Get your Employer Code');
    expect(migrated.backup.reason).toBe('before-online-contributions-step-cards-migration');
    expect(migrated.snapshotMigrations['online-contributions-step-cards']).toBe(1);

    const reloaded = createStore(persistenceFile, { backupDir });
    const secondPass = reloaded.migrateOnlineContributionsStepsSnapshot({
      actor,
      reason: 'repeat should be a no-op',
    });
    expect(secondPass.migration).toMatchObject({ alreadyApplied: true, didMigrate: false });
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

  it('treats releasing an already-cleared lock as a successful no-op', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor: createActor() });

    const released = store.releaseBlockLock('/services/loans', 'hero', createActor());

    expect(released.ok).toBe(true);
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
    expect(storeA.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Original title');
    expect(synced.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy.displayName).toBe('Taylor QA');
    expect(synced.state.collaborationByPath['/services/loans'].blocks.hero.savedBy).toBe(null);
    expect(synced.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');
    expect(synced.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-draft-synced');

    const storeB = createStore(persistenceFile);
    expect(storeB.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('HUD synced hero title');
    expect(storeB.getPublishedRouteSnapshot('/services/loans').state.blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Original title');
    expect(storeB.getSnapshot().state.collaborationByPath['/services/loans'].blocks.hero.lockedBy.displayName).toBe('Taylor QA');

    const saved = storeA.saveDraft(synced.state, { actor: createActor(), summary: 'explicit draft save' });
    expect(saved.ok).toBe(true);
    expect(saved.saveResult.savedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedBy.displayName).toBe('Taylor QA');
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy).toBe(null);
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

  it('rejects a delayed block sync from before a publish', () => {
    const persistenceFile = makeTempFile();
    const actor = createActor();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor });

    const publishedRevisionBeforeEdit = store.getRouteSnapshot('/services/loans').publishedRevision;
    const draftHero = cloneJson(store.readCurrentState().blocksByPath['/services/loans'][0]);
    draftHero.settings.line1Text = 'Published title';
    const saved = store.syncBlockDraft('/services/loans', 'hero', draftHero, { actor });
    expect(saved.ok).toBe(true);

    const published = store.publishBlock('/services/loans', 'hero', { actor });
    expect(published.ok).toBe(true);

    const staleHero = cloneJson(draftHero);
    staleHero.settings.line1Text = 'Old editor buffer';
    const delayedSync = store.syncBlockDraft('/services/loans', 'hero', staleHero, {
      actor,
      expectedPublishedRevision: publishedRevisionBeforeEdit,
    });

    expect(delayedSync.ok).toBe(false);
    expect(delayedSync.error).toBe('block-draft-sync-stale-published-revision');
    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Published title');
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Published title');
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
    expect(claimed.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy.displayName).toBe('Taylor QA');
    expect(claimed.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-draft-claimed');
  });

  it('releases a foreign draft only through an explicit forced release', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const blocked = store.releaseBlockDraft('/services/loans', 'hero', createActor());
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toBe('drafted-by-other');

    const released = store.releaseBlockDraft('/services/loans', 'hero', createActor(), { force: true });
    expect(released.ok).toBe(true);
    expect(released.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
    expect(released.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-draft-released');
  });

  it('publishes one changed block without publishing unrelated page blocks', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });
    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Block live title';
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Still draft';
    store.saveDraft(nextState, { actor, summary: 'block publish setup' });

    const published = store.publishBlock('/services/loans', 'hero', {
      actor,
      summary: 'publish hero only',
      expectedBlock: nextState.blocksByPath['/services/loans'][0],
    });

    expect(published.ok).toBe(true);
    expect(published.publishResult.receipt).toMatchObject({
      route: '/services/loans',
      scope: 'block',
      blockId: 'hero',
      draftRevision: expect.any(String),
      publishedRevision: expect.stringMatching(/^[a-f0-9]{12}$/),
      actor: { userId: 'dev-taylor' },
      timestamp: expect.any(Number),
      verification: { status: 'verified', baseSnapshotMatches: true },
      publishedBlockIds: ['hero'],
    });
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Block live title');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][1].settings.title).toBe('Request help');
    expect(Object.keys(published.state.blocksByPath)).toEqual(['/services/loans']);
    expect(Object.keys(published.baseSnapshot.blocksByPath)).toEqual(['/services/loans']);
    expect(published.state.blocksByPath['/services/investments']).toBeUndefined();
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.savedBy.displayName).toBe('Taylor QA');
    expect(published.state.collaborationByPath['/services/loans'].blocks.cta_form.draftedBy.displayName).toBe('Taylor QA');
  });

  it('keeps a newly added block at its draft insertion position when publishing only that block', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });

    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'].splice(1, 0, {
      id: 'intro',
      kind: 'intro',
      mode: 'dynamic',
      settings: {
        title: 'New intro',
      },
    });
    const saved = store.saveDraft(nextState, { actor, summary: 'add intro between hero and CTA' });
    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans'].map((block) => block.id)).toEqual([
      'hero',
      'intro',
      'cta_form',
    ]);

    const published = store.publishBlock('/services/loans', 'intro', {
      actor,
      summary: 'publish intro only',
      expectedBlock: nextState.blocksByPath['/services/loans'][1],
    });

    expect(published.ok).toBe(true);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].map((block) => block.id)).toEqual([
      'hero',
      'intro',
      'cta_form',
    ]);
  });

  it('repairs an already-published block that is at the wrong position', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const seed = buildSeedState();
    seed.blocksByPath['/services/loans'].push({
      id: 'intro',
      kind: 'intro',
      mode: 'dynamic',
      settings: { title: 'Old intro' },
    });
    store.resetFromSeed(seed, { actor });

    const nextState = cloneJson(store.readCurrentState());
    const blocks = nextState.blocksByPath['/services/loans'];
    const [intro] = blocks.splice(2, 1);
    blocks.splice(1, 0, intro);
    store.saveDraft(nextState, { actor, summary: 'repair intro position' });

    const published = store.publishBlock('/services/loans', 'intro', {
      actor,
      summary: 'publish intro position repair',
      expectedBlock: intro,
    });

    expect(published.ok).toBe(true);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].map((block) => block.id)).toEqual([
      'hero',
      'intro',
      'cta_form',
    ]);
  });

  it('records the publishing admin and current time after an autosynced draft', () => {
    const persistenceFile = makeTempFile();
    let timestamp = 1710000000000;
    const actor = createActor();
    const store = createStore(persistenceFile, {
      now: () => {
        timestamp += 1000;
        return timestamp;
      },
    });
    store.resetFromSeed(buildSeedState(), { actor });
    const nextHero = cloneJson(store.readCurrentState().blocksByPath['/services/loans'][0]);
    nextHero.settings.line1Text = 'Autosynced hero draft';
    const synced = store.syncBlockDraft('/services/loans', 'hero', nextHero, { actor });
    const syncedAt = synced.state.collaborationByPath['/services/loans'].blocks.hero.draftedAt;

    const published = store.publishBlock('/services/loans', 'hero', {
      actor,
      summary: 'publish autosynced hero',
    });

    expect(published.ok).toBe(true);
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.savedBy).toEqual(actor);
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.savedAt).toBeGreaterThan(syncedAt);
    expect(published.state.collaborationByPath['/services/loans'].history[0]).toMatchObject({
      action: 'block-published',
      actor,
    });
  });

  it('records the saving admin and current time when an autosynced draft is explicitly saved', () => {
    const persistenceFile = makeTempFile();
    let timestamp = 1710000000000;
    const actor = createActor();
    const store = createStore(persistenceFile, {
      now: () => {
        timestamp += 1000;
        return timestamp;
      },
    });
    store.resetFromSeed(buildSeedState(), { actor });
    const nextHero = cloneJson(store.readCurrentState().blocksByPath['/services/loans'][0]);
    nextHero.settings.line1Text = 'Autosynced hero draft';
    const synced = store.syncBlockDraft('/services/loans', 'hero', nextHero, { actor });
    const syncedAt = synced.state.collaborationByPath['/services/loans'].blocks.hero.draftedAt;

    const saved = store.saveDraft(store.readCurrentState(), { actor, summary: 'explicitly save autosynced hero' });

    expect(saved.ok).toBe(true);
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedBy).toEqual(actor);
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedAt).toBeGreaterThan(syncedAt);
    expect(saved.state.collaborationByPath['/services/loans'].history[0]).toMatchObject({
      action: 'block-draft-saved',
      actor,
    });
  });

  it('saves one block draft without saving other page changes', () => {
    const persistenceFile = makeTempFile();
    const actor = createActor();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedState(), { actor });
    const publishedBeforeSave = store.readPublishedSnapshot();
    const nextState = cloneJson(store.readCurrentState());
    const hero = nextState.blocksByPath['/services/loans'][0];
    const otherBlock = nextState.blocksByPath['/services/loans'][1];
    hero.settings.line1Text = 'Only hero is saved';
    otherBlock.settings.title = 'Other block remains unsaved';
    store.syncBlockDraft('/services/loans', 'hero', hero, { actor });
    store.syncBlockDraft('/services/loans', otherBlock.id, otherBlock, { actor });

    const saved = store.saveBlockDraft('/services/loans', 'hero', hero, {
      actor,
      summary: 'Save hero block only',
    });

    expect(saved.ok).toBe(true);
    expect(saved.saveResult.savedBlockIdsByPath['/services/loans']).toEqual(['hero']);
    expect(saved.state.collaborationByPath['/services/loans'].blocks.hero.savedBy).toEqual(actor);
    expect(saved.state.collaborationByPath['/services/loans'].blocks[otherBlock.id].savedBy).toBe(null);
    expect(saved.baseSnapshot).toEqual(publishedBeforeSave);
    expect(store.readPublishedSnapshot()).toEqual(publishedBeforeSave);
  });

  it('publishes a deleted block without publishing unrelated page drafts', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });
    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'] = nextState.blocksByPath['/services/loans']
      .filter((block) => block.id !== 'cta_form');
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Unrelated draft stays unpublished';
    store.saveDraft(nextState, { actor, summary: 'remove CTA draft' });

    const published = store.publishBlock('/services/loans', 'cta_form', {
      actor,
      summary: 'publish CTA removal',
    });

    expect(published.ok).toBe(true);
    expect(published.publishedBlock).toBe(null);
    expect(published.publishResult.receipt.publishedBlockIds).toEqual(['cta_form']);
    expect(published.state.blocksByPath['/services/loans'].some((block) => block.id === 'cta_form')).toBe(false);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].some((block) => block.id === 'cta_form')).toBe(false);
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(published.state.collaborationByPath['/services/loans'].blocks.cta_form).toBeUndefined();
    expect(published.state.collaborationByPath['/services/loans'].history[0].action).toBe('block-removal-published');
  });

  it('rejects block publish when the expected draft is stale', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });
    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Current draft title';
    store.saveDraft(nextState, { actor, summary: 'stale publish setup' });

    const staleExpectedBlock = cloneJson(nextState.blocksByPath['/services/loans'][0]);
    staleExpectedBlock.settings.line1Text = 'Older draft title';
    const published = store.publishBlock('/services/loans', 'hero', {
      actor,
      expectedBlock: staleExpectedBlock,
    });

    expect(published.ok).toBe(false);
    expect(published.error).toBe('block-publish-stale-draft');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
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
    expect(saved.saveResult.status).toBe('partially-saved');
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
    const savedDraftRevision = store.getRouteSnapshot('/services/loans').draftRevision;

    const published = store.publishPage('/services/loans', { actor: createActor(), summary: 'ship it' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.didPublish).toBe(true);
    expect(published.publishResult.status).toBe('published');
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans']).toContain('hero');
    expect(published.publishResult.receipt).toMatchObject({
      route: '/services/loans',
      scope: 'page',
      draftRevision: savedDraftRevision,
      publishedRevision: expect.stringMatching(/^[a-f0-9]{12}$/),
      actor: { userId: 'dev-taylor' },
      timestamp: expect.any(Number),
      verification: { status: 'verified', baseSnapshotMatches: true },
    });
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Published hero title');
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.savedBy.displayName).toBe('Taylor QA');
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.lockedBy).toBe(null);
    expect(published.state.collaborationByPath['/services/loans'].history[0].action).toBe('page-published');
  });

  it('publishes a deleted block during a page publish without publishing another admin draft', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const otherActor = createActor({
      userId: 'dev-other',
      displayName: 'Other editor',
      initials: 'OE',
      accentColor: '#3355cc',
    });
    store.resetFromSeed(buildSeedState(), { actor });

    const foreignDraft = cloneJson(store.readCurrentState());
    foreignDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Keep this draft unpublished';
    store.syncBlockDraft('/services/loans', 'hero', foreignDraft.blocksByPath['/services/loans'][0], {
      actor: otherActor,
    });

    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'] = nextState.blocksByPath['/services/loans']
      .filter((block) => block.id !== 'cta_form');
    store.saveRouteDraft('/services/loans', {
      pageHierarchy: { '/services/loans': nextState.pageHierarchy['/services/loans'] },
      blocksByPath: { '/services/loans': nextState.blocksByPath['/services/loans'] },
      collaborationByPath: { '/services/loans': nextState.collaborationByPath['/services/loans'] },
      pathAliases: nextState.pathAliases,
    }, { actor, summary: 'remove CTA from live page' });

    const published = store.publishPage('/services/loans', { actor, summary: 'publish CTA removal' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.status).toBe('partially-published');
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans']).toEqual(['cta_form']);
    expect(published.publishResult.blockedBlockIdsByPath['/services/loans']).toEqual(['hero']);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].some((block) => block.id === 'cta_form')).toBe(false);
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(published.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Keep this draft unpublished');
  });

  it('publishes a deleted hero while preserving foreign drafts on the remaining page blocks', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const foreignActor = createActor({
      userId: 'dev-other',
      displayName: 'Other editor',
      initials: 'OE',
      accentColor: '#3355cc',
    });
    store.resetFromSeed(buildSeedState(), { actor });

    const foreignDraft = cloneJson(store.readCurrentState());
    foreignDraft.blocksByPath['/services/loans'][1].settings.title = 'Keep this CTA draft unpublished';
    store.syncBlockDraft('/services/loans', 'cta_form', foreignDraft.blocksByPath['/services/loans'][1], {
      actor: foreignActor,
    });

    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'] = nextState.blocksByPath['/services/loans']
      .filter((block) => block.id !== 'hero');
    store.saveRouteDraft('/services/loans', {
      pageHierarchy: { '/services/loans': nextState.pageHierarchy['/services/loans'] },
      blocksByPath: { '/services/loans': nextState.blocksByPath['/services/loans'] },
      collaborationByPath: { '/services/loans': nextState.collaborationByPath['/services/loans'] },
      pathAliases: nextState.pathAliases,
    }, { actor, summary: 'remove extra hero from live page' });

    const published = store.publishPage('/services/loans', { actor, summary: 'publish extra hero removal' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.status).toBe('partially-published');
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans']).toEqual(['hero']);
    expect(published.publishResult.blockedBlockIdsByPath['/services/loans']).toEqual(['cta_form']);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].some((block) => block.id === 'hero')).toBe(false);
    expect(published.state.blocksByPath['/services/loans'][0].settings.title).toBe('Keep this CTA draft unpublished');
    expect(published.state.collaborationByPath['/services/loans'].blocks.cta_form.draftedBy).toEqual(foreignActor);
  });

  it('does not resurrect a shared-draft deletion when a stale browser saves the old page list', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const staleActor = createActor({
      userId: 'dev-stale-browser',
      displayName: 'Stale browser',
      initials: 'SB',
      accentColor: '#3355cc',
    });
    store.resetFromSeed(buildSeedState(), { actor });

    const deletionDraft = cloneJson(store.readCurrentState());
    deletionDraft.blocksByPath['/services/loans'] = deletionDraft.blocksByPath['/services/loans']
      .filter((block) => block.id !== 'hero');
    store.saveRouteDraft('/services/loans', {
      pageHierarchy: { '/services/loans': deletionDraft.pageHierarchy['/services/loans'] },
      blocksByPath: { '/services/loans': deletionDraft.blocksByPath['/services/loans'] },
      collaborationByPath: { '/services/loans': deletionDraft.collaborationByPath['/services/loans'] },
      pathAliases: deletionDraft.pathAliases,
    }, { actor, summary: 'delete hero in shared draft' });

    const stalePage = buildSeedState();
    stalePage.blocksByPath['/services/loans'][1].settings.title = 'Stale CTA draft';
    const staleSave = store.saveRouteDraft('/services/loans', {
      pageHierarchy: { '/services/loans': stalePage.pageHierarchy['/services/loans'] },
      blocksByPath: { '/services/loans': stalePage.blocksByPath['/services/loans'] },
      collaborationByPath: { '/services/loans': stalePage.collaborationByPath['/services/loans'] },
      pathAliases: stalePage.pathAliases,
    }, { actor: staleActor, summary: 'stale browser flush before publish' });

    expect(staleSave.ok).toBe(true);
    expect(store.readCurrentState().blocksByPath['/services/loans'].some((block) => block.id === 'hero')).toBe(false);
    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.title).toBe('Stale CTA draft');

    const published = store.publishPage('/services/loans', { actor, summary: 'publish deletion after stale flush' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.status).toBe('partially-published');
    expect(published.baseSnapshot.blocksByPath['/services/loans'].some((block) => block.id === 'hero')).toBe(false);
    expect(published.state.blocksByPath['/services/loans'][0].settings.title).toBe('Stale CTA draft');
  });

  it('persists scoped publish operation receipts for idempotent timeout verification', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });

    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Receipt-backed live title';
    store.saveDraft(nextState, { actor, summary: 'receipt setup' });

    const published = store.publishPage('/services/loans', {
      actor,
      operationId: 'page-operation-10',
      expectedDraftRevision: store.getRouteSnapshot('/services/loans').draftRevision,
    });

    expect(published.ok).toBe(true);
    expect(published.operationId).toBe('page-operation-10');
    expect(published.publishedRevision).toMatch(/^[a-f0-9]{12}$/);
    expect(store.getPublishStatus('page-operation-10')).toMatchObject({
      committed: true,
      operationId: 'page-operation-10',
      pathname: '/services/loans',
      scope: 'page',
      publishedRoute: {
        blocksByPath: {
          '/services/loans': expect.arrayContaining([
            expect.objectContaining({
              settings: expect.objectContaining({ line1Text: 'Receipt-backed live title' }),
            }),
          ]),
        },
      },
    });

    const reloadedStore = createStore(persistenceFile);
    expect(reloadedStore.getPublishStatus('page-operation-10')).toMatchObject({
      committed: true,
      operationId: 'page-operation-10',
    });
    expect(reloadedStore.publishPage('/services/loans', {
      actor,
      operationId: 'page-operation-10',
    }).operationId).toBe('page-operation-10');
  });

  it('rejects a publish request when a newer draft revision exists', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    store.resetFromSeed(buildSeedState(), { actor });

    const firstDraft = buildSeedState();
    firstDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Draft revision ten';
    store.saveDraft(firstDraft, { actor, summary: 'draft ten' });
    const firstRevision = store.getRouteSnapshot('/services/loans').draftRevision;

    const newerDraft = buildSeedState();
    newerDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Draft revision eleven';
    store.saveDraft(newerDraft, { actor, summary: 'draft eleven' });

    const result = store.publishPage('/services/loans', {
      actor,
      operationId: 'stale-page-operation',
      expectedDraftRevision: firstRevision,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('page-publish-stale-draft');
    expect(store.readPublishedSnapshot().blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Original title');
    expect(store.readCurrentState().blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Draft revision eleven');
  });

  it('partially publishes eligible page blocks while preserving a changed foreign draft', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const foreignActor = createActor({
      userId: 'dev-other',
      displayName: 'Morgan Laptop',
      initials: 'ML',
      accentColor: '#3355cc',
    });
    store.resetFromSeed(buildSeedState(), { actor });

    const foreignDraft = cloneJson(store.readCurrentState());
    foreignDraft.blocksByPath['/services/loans'][0].settings.line1Text = 'Foreign draft remains';
    store.syncBlockDraft('/services/loans', 'hero', foreignDraft.blocksByPath['/services/loans'][0], { actor: foreignActor });

    const nextState = cloneJson(store.readCurrentState());
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Eligible CTA publish';
    store.saveDraft(nextState, { actor, summary: 'save eligible block' });

    const published = store.publishPage('/services/loans', { actor, summary: 'publish eligible blocks' });

    expect(published.ok).toBe(true);
    expect(published.publishResult.status).toBe('partially-published');
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans']).toEqual(['cta_form']);
    expect(published.publishResult.blockedBlockIdsByPath['/services/loans']).toEqual(['hero']);
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][1].settings.title).toBe('Eligible CTA publish');
    expect(published.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Foreign draft remains');
    expect(published.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toEqual(foreignActor);

    const claimed = store.acquireBlockLock('/services/loans', 'hero', actor, { force: true });
    expect(claimed.ok).toBe(true);
    expect(claimed.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toEqual(actor);

    const publishedAfterTakeover = store.publishPage('/services/loans', {
      actor,
      summary: 'publish hero after takeover',
    });

    expect(publishedAfterTakeover.ok).toBe(true);
    expect(publishedAfterTakeover.publishResult.status).toBe('published');
    expect(publishedAfterTakeover.publishResult.publishedBlockIdsByPath['/services/loans']).toEqual(['hero']);
    expect(publishedAfterTakeover.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text)
      .toBe('Foreign draft remains');
    expect(publishedAfterTakeover.state.collaborationByPath['/services/loans'].blocks.hero.draftedBy).toBe(null);
  });

  it('publishes eligible order changes while preserving a changed foreign draft on an unmoved block', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const actor = createActor();
    const foreignActor = createActor({
      userId: 'dev-other',
      displayName: 'Morgan Laptop',
      initials: 'ML',
      accentColor: '#3355cc',
    });
    const seed = buildSeedState();
    seed.blocksByPath['/services/loans'].push({
      id: 'newsletter',
      kind: 'content',
      mode: 'dynamic',
      settings: { title: 'Original newsletter' },
    });
    store.resetFromSeed(seed, { actor });

    const foreignDraft = cloneJson(store.readCurrentState());
    foreignDraft.blocksByPath['/services/loans'][2].settings.title = 'Foreign newsletter draft';
    store.syncBlockDraft(
      '/services/loans',
      'newsletter',
      foreignDraft.blocksByPath['/services/loans'][2],
      { actor: foreignActor },
    );

    const nextState = cloneJson(store.readCurrentState());
    const blocks = nextState.blocksByPath['/services/loans'];
    [blocks[0], blocks[1]] = [blocks[1], blocks[0]];
    store.saveDraft(nextState, { actor, summary: 'move eligible blocks' });

    const published = store.publishPage('/services/loans', {
      actor,
      summary: 'publish eligible order changes',
    });

    expect(published.ok).toBe(true);
    expect(published.publishResult.status).toBe('partially-published');
    expect(published.publishResult.publishedBlockIdsByPath['/services/loans'])
      .toEqual(['cta_form', 'hero']);
    expect(published.publishResult.blockedBlockIdsByPath['/services/loans'])
      .toEqual(['newsletter']);
    expect(published.baseSnapshot.blocksByPath['/services/loans'].map((block) => block.id))
      .toEqual(['cta_form', 'hero', 'newsletter']);
    expect(published.baseSnapshot.blocksByPath['/services/loans']
      .find((block) => block.id === 'newsletter').settings.title)
      .toBe('Original newsletter');
    expect(published.state.blocksByPath['/services/loans']
      .find((block) => block.id === 'newsletter').settings.title)
      .toBe('Foreign newsletter draft');
  });

  it('re-normalizes malformed preset-family template ids during shared draft saves', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildPresetSeedState(), { actor: createActor() });

    const nextState = cloneJson(store.getSnapshot().state);
    nextState.blocksByPath['/services/loans'][0].templateId = 'value_cards';
    nextState.blocksByPath['/services/loans'][0].settings.col2Title = 'Teamwork.';
    nextState.blocksByPath['/services/retirement/403b'][0].templateId = 'loan_apply';
    nextState.blocksByPath['/services/retirement/403b'][0].settings.card2Title = 'Submit your request';

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'update loan apply grid' });

    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans'][0].templateId).toBe('columns');
    expect(saved.state.blocksByPath['/services/loans'][0].presetId).toBe('value-cards');
    expect(saved.state.blocksByPath['/services/loans'][0].settings.col2Title).toBe('Teamwork.');
    expect(saved.state.blocksByPath['/services/retirement/403b'][0].templateId).toBe('card_grid');
    expect(saved.state.blocksByPath['/services/retirement/403b'][0].presetId).toBe('step-cards');
    expect(saved.state.blocksByPath['/services/retirement/403b'][0].settings.card2Title).toBe('Submit your request');
  });

  it('creates a timestamped backup before resetting shared content from seed', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, {
      backupDir,
      getGitCommitHash: () => 'abc123',
    });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Manager draft title';
    store.saveDraft(nextState, { actor: createActor(), summary: 'manager draft' });

    const reset = store.resetFromSeed(buildSeedState(), { actor: createActor(), reason: 'seed-refresh' });
    const backupFiles = listBackupFiles(backupDir);
    const backupPayload = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf8'));

    expect(reset.initialized).toBe(true);
    expect(backupFiles).toHaveLength(1);
    expect(backupPayload.meta.reason).toBe('before-reset-from-seed');
    expect(backupPayload.meta.action).toBe('seed-refresh');
    expect(backupPayload.meta.gitCommitHash).toBe('abc123');
    expect(backupPayload.record.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Manager draft title');
  });

  it('creates a backup before a destructive shared draft save removes blocks', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'] = [nextState.blocksByPath['/services/loans'][0]];

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'remove cta form' });
    const backupFiles = listBackupFiles(backupDir);
    const backupPayload = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf8'));

    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans']).toHaveLength(1);
    expect(backupFiles).toHaveLength(1);
    expect(backupPayload.meta.reason).toBe('before-destructive-draft-save');
    expect(backupPayload.meta.removedBlocksByPath['/services/loans']).toEqual(['cta_form']);
  });

  it('keeps removed blocks removed and saved order authoritative after reload', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'] = [
      nextState.blocksByPath['/services/loans'][1],
    ];

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'remove hero and keep cta order' });
    const reloaded = createStore(persistenceFile);

    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans'].map((block) => block.id)).toEqual(['cta_form']);
    expect(reloaded.getSnapshot().state.blocksByPath['/services/loans'].map((block) => block.id)).toEqual(['cta_form']);
  });

  it('aborts destructive shared writes when backup creation fails', () => {
    const persistenceFile = makeTempFile();
    const blockedBackupPath = path.join(path.dirname(persistenceFile), 'blocked-backups');
    fs.writeFileSync(blockedBackupPath, 'not-a-directory');
    const store = createStore(persistenceFile, { backupDir: blockedBackupPath });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const before = store.getSnapshot();
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'] = [nextState.blocksByPath['/services/loans'][0]];

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'remove cta form' });
    const after = store.getSnapshot();

    expect(saved.ok).toBe(false);
    expect(saved.error).toBe('backup-failed');
    expect(after.state.blocksByPath['/services/loans']).toHaveLength(2);
    expect(after.state.blocksByPath['/services/loans'][1].id).toBe('cta_form');
    expect(after.updatedAt).toBe(before.updatedAt);
  });

  it('restores from a shared content backup and backs up the current state first', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const draftState = buildSeedState();
    draftState.blocksByPath['/services/loans'][0].settings.line1Text = 'Draft worth restoring';
    store.saveDraft(draftState, { actor: createActor(), summary: 'draft before reset' });

    store.resetFromSeed(buildSeedState(), { actor: createActor(), reason: 'seed-refresh' });
    const originalBackupName = listBackupFiles(backupDir)[0];
    const restored = store.restoreFromBackup(originalBackupName, { actor: createActor() });
    const backups = store.listBackups();

    expect(restored.ok).toBe(true);
    expect(restored.restoredBackup.fileName).toBe(originalBackupName);
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Draft worth restoring');
    expect(backups).toHaveLength(2);
    expect(backups[0].reason).toBe('before-backup-restore');
    expect(backups[1].reason).toBe('before-reset-from-seed');
  });

  it('restores backup records without forcing the current seed inventory or retired static blocks', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });
    const currentState = buildSeedState();
    const pathname = '/services/loans';
    const oldBackupState = buildSeedState();

    oldBackupState.blocksByPath[pathname] = [
      {
        ...cloneJson(currentState.blocksByPath[pathname][1]),
        settings: {
          title: 'Backup CTA',
          targetSectionClassName: 'old-native-section',
        },
      },
      {
        id: 'old_static_section',
        kind: 'content',
        mode: 'static',
        settings: {
          html: '<p>Old static backup section</p>',
        },
      },
    ];
    oldBackupState.collaborationByPath[pathname] = {
      blocks: {
        old_static_section: {
          draftedBy: createActor(),
          draftedAt: 1710000000000,
          savedBy: createActor(),
          savedAt: 1710000000000,
          lockedBy: null,
          lockedAt: null,
        },
      },
      history: [
        {
          id: '1710000000000-old-static',
          action: 'block-draft-saved',
          blockId: 'old_static_section',
          actor: createActor(),
          createdAt: 1710000000000,
        },
      ],
    };
    oldBackupState.pathAliases = {
      '/old-loans': pathname,
    };
    oldBackupState.pageHierarchy['/old-route'] = {
      path: '/old-route',
      title: 'Old Route',
    };
    oldBackupState.blocksByPath['/old-route'] = [
      {
        id: 'page_content',
        kind: 'content',
        mode: 'static',
        settings: {
          html: '<p>Old route</p>',
        },
      },
    ];
    oldBackupState.collaborationByPath['/old-route'] = {
      blocks: {},
      history: [],
    };

    store.resetFromSeed(currentState, { actor: createActor() });
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, 'content-admin-shared-20260720-120000.json'), JSON.stringify({
      meta: {
        createdAt: 1784577600000,
        timestamp: '2026-07-20T12:00:00.000Z',
        reason: 'manual-old-backup',
      },
      record: {
        initialized: true,
        version: 1,
        updatedAt: 1784577600000,
        state: oldBackupState,
        baseSnapshot: oldBackupState,
        revisionsByPath: {
          [pathname]: [
            {
              id: '1784577600000-old-backup-revision',
              pathname,
              createdAt: 1784577600000,
              actor: createActor(),
              reason: 'draft-saved',
              summary: 'old backup revision',
              snapshot: {
                pathname,
                page: oldBackupState.pageHierarchy[pathname],
                blocks: oldBackupState.blocksByPath[pathname],
                collaboration: oldBackupState.collaborationByPath[pathname],
                pathAliases: {},
              },
            },
          ],
        },
      },
    }));

    const restored = store.restoreFromBackup('content-admin-shared-20260720-120000.json', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];
    const restoredCta = restoredBlocks.find((block) => block.id === 'cta_form');
    const restoredRevisionBlocks = readPersistedRecord(persistenceFile)
      .revisionsByPath[pathname][0].snapshot.blocks;

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.map((block) => `${block.id}:${block.kind}:${block.mode}`)).toEqual([
      'cta_form:cta_form:dynamic',
    ]);
    expect(restoredBlocks.some((block) => block.id === 'hero')).toBe(false);
    expect(restoredCta.settings.title).toBe('Backup CTA');
    expect(restoredCta.settings.targetSectionClassName).toBeUndefined();
    expect(restored.state.blocksByPath['/old-route']).toEqual([]);
    expect(restored.state.pageHierarchy['/old-route']).toEqual(oldBackupState.pageHierarchy['/old-route']);
    expect(restored.state.pathAliases['/old-loans']).toBe(pathname);
    expect(restored.state.collaborationByPath[pathname].blocks.old_static_section).toBeUndefined();
    expect(restored.state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual([]);
    expect(restoredRevisionBlocks.map((block) => `${block.id}:${block.kind}:${block.mode}`)).toEqual([
      'cta_form:cta_form:dynamic',
    ]);
  });

  it('promotes the current shared content to the reset baseline and uses it for future resets', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const seedBaselineFile = path.join(path.dirname(persistenceFile), 'content-admin-seed-baseline.json');
    const store = createStore(persistenceFile, {
      backupDir,
      seedBaselineFile,
      getGitCommitHash: () => 'abc123',
    });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const promotedState = buildSeedState();
    promotedState.blocksByPath['/services/loans'][0].settings.line1Text = 'Approved shared baseline';
    store.saveDraft(promotedState, { actor: createActor(), summary: 'approved content' });

    const promoted = store.promoteCurrentStateToSeed({ actor: createActor() });
    const seedBaselinePayload = readSeedBaselineFile(seedBaselineFile);

    expect(promoted.ok).toBe(true);
    expect(promoted.promotedSeedBaseline.gitCommitHash).toBe('abc123');
    expect(seedBaselinePayload.meta.reason).toBe('promote-to-seed-baseline');
    expect(seedBaselinePayload.seedState.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Approved shared baseline');

    const fallbackSeed = buildSeedState();
    fallbackSeed.blocksByPath['/services/loans'][0].settings.line1Text = 'Older code default';
    const reset = store.resetFromSeed(fallbackSeed, { actor: createActor(), reason: 'seed-refresh' });

    expect(reset.resetSource).toBe('promoted-seed-baseline');
    expect(store.getSnapshot().state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Approved shared baseline');
  });

  it('aborts seed promotion when the safety backup cannot be created', () => {
    const persistenceFile = makeTempFile();
    const blockedBackupPath = path.join(path.dirname(persistenceFile), 'blocked-backups');
    const seedBaselineFile = path.join(path.dirname(persistenceFile), 'content-admin-seed-baseline.json');
    fs.writeFileSync(blockedBackupPath, 'not-a-directory');
    const store = createStore(persistenceFile, {
      backupDir: blockedBackupPath,
      seedBaselineFile,
    });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const promoted = store.promoteCurrentStateToSeed({ actor: createActor() });

    expect(promoted.ok).toBe(false);
    expect(promoted.error).toBe('backup-failed');
    expect(fs.existsSync(seedBaselineFile)).toBe(false);
  });

  it('keeps normal non-destructive saves working without creating backups', () => {
    const persistenceFile = makeTempFile();
    const backupDir = path.join(path.dirname(persistenceFile), 'backups');
    const store = createStore(persistenceFile, { backupDir });

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Updated without deletion';

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'copy tweak' });

    expect(saved.ok).toBe(true);
    expect(saved.state.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Updated without deletion');
    expect(listBackupFiles(backupDir)).toHaveLength(0);
  });

  it('keeps route-scoped mutation responses compact and bounded', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    const seed = buildSeedState();
    seed.blocksByPath['/services/loans'].forEach((block) => {
      block.editableFields = Array.from({ length: 200 }, (_, index) => ({
        id: `field-${index}`,
        label: `Repeated editor metadata ${index}`,
      }));
    });
    store.resetFromSeed(seed, { actor: createActor() });

    const nextState = cloneJson(store.getSnapshot().state);
    nextState.blocksByPath['/services/loans'][0].settings.line1Text = 'Scoped save';
    const saved = store.saveRouteDraft('/services/loans', nextState, {
      actor: createActor(),
      summary: 'scoped payload test',
    });
    const persisted = fs.readFileSync(persistenceFile, 'utf8');

    expect(saved.ok).toBe(true);
    expect(Object.keys(saved.state.blocksByPath)).toEqual(['/services/loans']);
    expect(saved.state.blocksByPath['/services/loans'][0]).not.toHaveProperty('editableFields');
    expect(persisted).not.toContain('Repeated editor metadata');
    expect(Buffer.byteLength(JSON.stringify(saved))).toBeLessThan(40_000);
  });

  it('publishes changed blocks when an unrelated stale foreign draft exists on the same page', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);
    store.resetFromSeed(buildSeedStateWithOtherDraft(), { actor: createActor() });

    const nextState = buildSeedStateWithOtherDraft();
    nextState.blocksByPath['/services/loans'][1].settings.title = 'Ready to publish CTA';
    store.saveDraft(nextState, { actor: createActor(), summary: 'cta saved' });

    const published = store.publishPage('/services/loans', { actor: createActor() });

    expect(published.ok).toBe(true);
    expect(published.publishResult.hasConflicts).toBe(false);
    expect(published.baseSnapshot.blocksByPath['/services/loans'][0].settings.line1Text).toBe('Original title');
    expect(published.baseSnapshot.blocksByPath['/services/loans'][1].settings.title).toBe('Ready to publish CTA');
  });
});
