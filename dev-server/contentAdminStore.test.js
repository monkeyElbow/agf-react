import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDevContentAuthorityStore } from './contentAdminStore';
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

  it('persists canonical CTA fieldsJson when incoming state only has slot fields', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildSeedState(), { actor: createActor() });
    const nextState = buildSeedState();
    nextState.blocksByPath['/services/loans'][1].settings = {
      title: 'Slot-only CTA',
      fieldsJson: '',
      field1Enabled: true,
      field1Type: 'text',
      field1Label: 'Full name',
      field1Placeholder: '',
      field1Options: '',
      field1Required: true,
      field2Enabled: true,
      field2Type: 'email',
      field2Label: 'Email',
      field2Placeholder: '',
      field2Options: '',
      field2Required: true,
    };

    const saved = store.saveDraft(nextState, { actor: createActor(), summary: 'slot-only cta' });
    const persistedCta = readPersistedRecord(persistenceFile).state.blocksByPath['/services/loans'][1];
    const fields = JSON.parse(persistedCta.settings.fieldsJson);

    expect(saved.ok).toBe(true);
    expect(fields).toEqual([
      expect.objectContaining({ id: 'field1', label: 'Full name', type: 'text', required: true }),
      expect.objectContaining({ id: 'field2', label: 'Email', type: 'email', required: true }),
    ]);
    expect(Object.keys(persistedCta.settings).filter((key) => /^field[1-5]/.test(key))).toEqual([]);
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

  it('reconciles partial old page revisions to the current block inventory on restore', () => {
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
      'hero:hero:dynamic',
      'cta_form:cta_form:dynamic',
    ]);
    expect(restoredBlocks.find((block) => block.id === 'hero')?.settings.line1Text).toBe('Original title');
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
    expect(activeBlocks.some((block) => block.id === 'page_content')).toBe(false);
    expect(activeLoanDetails.settings.title).toBe("Retired Ministers' Housing Allowance");
    expect(activeLoanDetails.settings.body).toContain('The unique benefit, which gives ministers');
    expect(activeLoanDetails.settings.anchorId).toBe('retired-ministers-housing-allowance');
    expect(activeBlocks.find((block) => block.id === 'housing_feature')?.settings.col2Title).toBe("Retired Ministers' Housing Allowance");
    expect(activeBlocks.find((block) => block.id === 'housing_feature')?.settings.col2BodyHtml).toContain('ret403b-housing-feature-bullet-intro');
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.strategy_enroll_cta).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.page_content).toBeUndefined();
    expect(store.getSnapshot().state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['strategy_enroll_cta']);

    const history = store.getRevisionHistory(pathname);
    expect(history[0].blocks.map((block) => block.id)).toEqual([
      'investment_strategy_options',
      'strategy_enroll_cta',
      'loan_details',
      'housing_feature',
    ]);

    const restored = store.restorePageRevision(pathname, '1710000005000-ghost', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];
    const restoredLoanDetails = restoredBlocks.find((block) => block.id === 'loan_details');

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.some((block) => block.id === 'strategy_enroll_cta')).toBe(true);
    expect(restoredBlocks.some((block) => block.id === 'page_content')).toBe(false);
    expect(restoredLoanDetails.settings.title).toBe("Retired Ministers' Housing Allowance");
    expectLinkJson(restoredLoanDetails.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/calculators',
    });
    expect(restored.state.collaborationByPath[pathname].blocks.strategy_enroll_cta).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].blocks.page_content).toBeUndefined();
    expect(restored.state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['strategy_enroll_cta']);
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

  it('sanitizes the retired planned giving static comparison matrix from persisted snapshots and revision restores', () => {
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

    expect(activeBlocks.map((block) => block.id)).toEqual(['comparison_table']);
    expect(activeBlocks.some((block) => block.settings?.widget === 'giving-comparison-matrix')).toBe(false);
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.comparison_matrix).toBeUndefined();
    expect(store.getSnapshot().state.collaborationByPath[pathname].blocks.comparison_table).toBeTruthy();
    expect(store.getSnapshot().state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['comparison_table']);

    const history = store.getRevisionHistory(pathname);
    expect(history[0].blocks.map((block) => block.id)).toEqual(['comparison_table']);

    const restored = store.restorePageRevision(pathname, '1710000005000-comparison', { actor: createActor() });
    const restoredBlocks = restored.state.blocksByPath[pathname];

    expect(restored.ok).toBe(true);
    expect(restoredBlocks.map((block) => block.id)).toEqual(['comparison_table']);
    expect(restored.state.collaborationByPath[pathname].blocks.comparison_matrix).toBeUndefined();
    expect(restored.state.collaborationByPath[pathname].blocks.comparison_table).toBeTruthy();
    expect(restored.state.collaborationByPath[pathname].history.map((entry) => entry.blockId)).toEqual(['comparison_table']);
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

    expect(comparisonBlock.settings.tableHeadersJson).toEqual(['Traditional IRA', 'Roth IRA']);
    expect(comparisonBlock.settings.tableFirstColumnHeader).toBe(false);
    expect(comparisonBlock.settings.tableRowsJson).toEqual([
      ['Eligibility\nMust have earned income.', 'Eligibility\nMust meet Roth IRA limits.'],
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

  it('repairs the stale generosity fund hero CTA fields in shared snapshots', () => {
    const persistenceFile = makeTempFile();
    const store = createStore(persistenceFile);

    store.resetFromSeed(buildGenerosityFundSeedState(), { actor: createActor() });

    const heroBlock = store.getSnapshot().state.blocksByPath['/services/planned-giving/generosity-fund'][0];
    expectLinkJson(heroBlock.settings, 'button1LinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expectNoSplitSettings(heroBlock.settings, ['button1Url', 'button2Url', 'button2PageRef']);
    expect(heroBlock.settings.button2Action).toBe('open_cta_form');
    expect(heroBlock.settings.button2TargetAnchorId).toBe('traditional-daf-inline-form');
    expect(heroBlock.settings.button2TargetBlockId).toBe('');

    const reloaded = createStore(persistenceFile);
    const reloadedHero = reloaded.getSnapshot().state.blocksByPath['/services/planned-giving/generosity-fund'][0];
    expect(Object.prototype.hasOwnProperty.call(reloadedHero.settings, 'button2Url')).toBe(false);
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

  it('reconciles restored backup records to the current block inventory', () => {
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
      'hero:hero:dynamic',
      'cta_form:cta_form:dynamic',
    ]);
    expect(restoredBlocks.some((block) => block.id === 'old_static_section')).toBe(false);
    expect(restoredCta.settings.title).toBe('Backup CTA');
    expect(restoredCta.settings.targetSectionClassName).toBeUndefined();
    expect(restored.state.blocksByPath['/old-route']).toBeUndefined();
    expect(restored.state.pageHierarchy['/old-route']).toBeUndefined();
    expect(restored.state.pathAliases['/old-loans']).toBeUndefined();
    expect(restored.state.collaborationByPath[pathname].blocks.old_static_section).toBeUndefined();
    expect(restored.state.collaborationByPath[pathname].history).toEqual([]);
    expect(restoredRevisionBlocks.map((block) => `${block.id}:${block.kind}:${block.mode}`)).toEqual([
      'hero:hero:dynamic',
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
