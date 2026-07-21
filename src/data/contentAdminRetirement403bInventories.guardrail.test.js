import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext.jsx';
import { BLOCK_ONLY_MANAGED_PAGE_PATHS } from '../lib/managedPageShells.js';
import { parseLinkValueJson } from '../lib/linkValue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETIREMENT_403B_GUARDRAIL_PATHS = [
  '/services/retirement/403b',
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/403b/403b-group-enrollment',
];
const RETIREMENT_403B_PATH = '/services/retirement/403b';
const RETIREMENT_403B_CANONICAL_INVENTORY = [
  { id: 'hero', kind: 'hero', mode: 'dynamic' },
  { id: 'intro', kind: 'intro', mode: 'dynamic' },
  { id: 'benefits_cards', kind: 'card_grid', mode: 'dynamic' },
  { id: 'investment_strategy_heading', kind: 'billboard', mode: 'dynamic' },
  { id: 'investment_strategy_options', kind: 'content', mode: 'dynamic' },
  { id: 'who_qualifies', kind: 'card_grid', mode: 'dynamic' },
  { id: 'loan_details', kind: 'content', mode: 'dynamic' },
  { id: 'loan_apply', kind: 'card_grid', mode: 'dynamic' },
  { id: 'start_enrollment', kind: 'card_grid', mode: 'dynamic' },
  { id: 'rate_table', kind: 'content', mode: 'dynamic' },
  { id: 'contribution_limits', kind: 'content', mode: 'dynamic' },
  { id: 'rollover_billboard', kind: 'billboard', mode: 'dynamic' },
  { id: 'housing_feature', kind: 'columns', mode: 'dynamic' },
  { id: 'online_contributions', kind: 'columns', mode: 'dynamic' },
  { id: 'cta_form', kind: 'cta_form', mode: 'dynamic' },
];
const RETIREMENT_403B_STALE_RMHA_SNAPSHOT_STRINGS = [
  'benefits_callout',
  'retirement-403b-native-benefits-callout',
  'Faith-Based Investments',
  'Our values, beliefs about stewardship, and our mission are the same as yours.',
  'strategy_enroll_cta',
  'retirement-403b-native-strategy-enroll-cta',
  'ret403b-housing-feature-bullet-intro',
  'The maximum housing allowance exemption in any tax year is the lesser of:',
  'The unique benefit, which gives ministers a significant tax savings',
  'ret403b-housing-feature-shell',
  'retirement-ministers-housing-feature',
];
const RETIREMENT_403B_RUNTIME_RESCUE_STRINGS = [
  'strategy_enroll_cta',
  'retirement-403b-native-strategy-enroll-cta',
  'ret403b-housing-feature-bullet-intro',
  'The maximum housing allowance exemption in any tax year is the lesser of:',
  'The unique benefit, which gives ministers a significant tax savings',
];
const RETIREMENT_IRAS_PATH = '/services/retirement/iras';
const RETIREMENT_FUND_AN_IRA_PATH = '/services/retirement/iras/fund-an-ira';
const RETIREMENT_403B_TERMS_DEFINITIONS_PATH = '/services/retirement/403b/403b-terms-definitions';
const ACCESSIBILITY_PATH = '/accessibility';
const MISSION_ASSURE_CLAIM_PATH = '/services/insurance/mission-assure/report-a-claim';
const ONLINE_CONTRIBUTIONS_PATH = '/online-contributions';
const PRIVACY_POLICY_PATH = '/privacy-policy';
const RESOURCES_PATH = '/resources';
const SUBSCRIBE_PATH = '/subscribe';
const TERMS_OF_SERVICE_PATH = '/terms-of-service';
const VINEYARD_PATH = '/vineyard';
const YOURPLAN_PATH = '/yourplan';

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(__dirname, relativePath), 'utf8'));
}

function summarizeInventory(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => ({
    id: block?.id,
    kind: block?.kind,
    mode: block?.mode,
  }));
}

function summarizeTargetKeys(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => ({
    id: block?.id,
    targetSectionKey: String(block?.settings?.targetSectionKey || ''),
  }));
}

function findBlockOnlyLegacyBridgeBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => {
      const settings = block?.settings && typeof block.settings === 'object'
        ? block.settings
        : {};
      return block?.id === 'page_content'
        || String(settings.targetSectionKey || '').trim()
        || String(settings.targetSectionClassName || '').trim()
        || Number(settings.targetSectionIndex || 0);
    })
    .map((block) => ({
      id: block?.id,
      targetSectionKey: String(block?.settings?.targetSectionKey || ''),
      targetSectionClassName: String(block?.settings?.targetSectionClassName || ''),
      targetSectionIndex: Number(block?.settings?.targetSectionIndex || 0),
    }));
}

function summarizeWidgetBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => block?.settings?.widget || block?.settings?.sectionClassName)
    .map((block) => ({
      id: block?.id,
      widget: block?.settings?.widget || '',
      sectionClassName: block?.settings?.sectionClassName || '',
    }));
}

function summarizeContentBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => block?.kind === 'content')
    .map((block) => ({
      id: block?.id,
      html: block?.settings?.html || '',
      buttonLinkJson: block?.settings?.buttonLinkJson || '',
      sectionClassName: block?.settings?.sectionClassName || '',
    }));
}

function expectLinkJson(settings, fieldId, expectedLink) {
  expect(parseLinkValueJson(settings?.[fieldId])).toEqual(expect.objectContaining(expectedLink));
}

function expectNoStale403bRmhaSnapshotStrings(blocks, label) {
  const snapshotText = JSON.stringify(Array.isArray(blocks) ? blocks : []);
  RETIREMENT_403B_STALE_RMHA_SNAPSHOT_STRINGS.forEach((staleString) => {
    expect(snapshotText.includes(staleString), `${label} should not contain ${staleString}`).toBe(false);
  });
}

function expectNoStale403bSnapshotRecordStrings(record, label) {
  const snapshotText = JSON.stringify(record || {});
  RETIREMENT_403B_STALE_RMHA_SNAPSHOT_STRINGS.forEach((staleString) => {
    expect(snapshotText.includes(staleString), `${label} should not contain ${staleString}`).toBe(false);
  });
}

describe('403(b) retirement inventory guardrail', () => {
  it('keeps promoted block-only snapshots free of page-content and target-section bridge metadata', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const snapshotSets = [
      ['shared state', sharedRecord?.state?.blocksByPath || {}],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath || {}],
      ['seed seedState', seedRecord?.seedState?.blocksByPath || {}],
    ];

    Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
      snapshotSets.forEach(([label, blocksByPath]) => {
        const legacyBlocks = findBlockOnlyLegacyBridgeBlocks(blocksByPath[pathname] || []);
        expect(legacyBlocks, `${label} ${pathname} should not carry page_content or target-section bridge metadata`).toEqual([]);
      });
    });
  });

  it('keeps shared and seed route inventories aligned to the canonical blueprint map', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const sharedBlocksByPath = sharedRecord?.state?.blocksByPath || {};
    const seedBlocksByPath = seedRecord?.seedState?.blocksByPath || {};
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};

    RETIREMENT_403B_GUARDRAIL_PATHS.forEach((pathname) => {
      const canonicalInventory = summarizeInventory(canonicalBlocksByPath[pathname] || []);
      const sharedInventory = summarizeInventory(sharedBlocksByPath[pathname] || []);
      const seedInventory = summarizeInventory(seedBlocksByPath[pathname] || []);

      expect(sharedInventory, `${pathname} shared inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(seedInventory, `${pathname} seed inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
    });
  });

  it('keeps the 403(b) canonical block ids and order stable across blueprints and promoted snapshots', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const snapshotSets = [
      ['canonical blueprints', canonicalBlocksByPath[RETIREMENT_403B_PATH] || []],
      ['shared state', sharedRecord?.state?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
    ];

    snapshotSets.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} 403(b) canonical order drifted`).toEqual(RETIREMENT_403B_CANONICAL_INVENTORY);
    });
  });

  it('keeps promoted 403(b) snapshots free of stale RMHA and retired CTA strings', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const snapshotSets = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RETIREMENT_403B_PATH] || []],
    ];

    snapshotSets.forEach(([label, blocks]) => {
      expectNoStale403bRmhaSnapshotStrings(blocks, label);
    });

    [
      ['shared collaboration', sharedRecord?.state?.collaborationByPath?.[RETIREMENT_403B_PATH] || {}],
      ['shared baseSnapshot collaboration', sharedRecord?.baseSnapshot?.collaborationByPath?.[RETIREMENT_403B_PATH] || {}],
      ['seed collaboration', seedRecord?.seedState?.collaborationByPath?.[RETIREMENT_403B_PATH] || {}],
      ...((sharedRecord?.revisionsByPath?.[RETIREMENT_403B_PATH] || []).map((revision, index) => [
        `shared revision ${index}`,
        revision?.snapshot || {},
      ])),
    ].forEach(([label, record]) => {
      expectNoStale403bSnapshotRecordStrings(record, label);
    });
  });

  it('keeps stale 403(b) RMHA rescue strings out of runtime normalization sources', () => {
    const runtimeSources = [
      ['ContentAdminContext', '../../src/context/ContentAdminContext.jsx'],
      ['contentAdminStore', '../../dev-server/contentAdminStore.js'],
    ];

    runtimeSources.forEach(([label, relativePath]) => {
      const source = readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      RETIREMENT_403B_RUNTIME_RESCUE_STRINGS.forEach((staleString) => {
        expect(source.includes(staleString), `${label} should not silently rescue ${staleString}`).toBe(false);
      });
    });
  });

  it('keeps the promoted IRA inventories aligned without target-section bridges', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[RETIREMENT_IRAS_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedTargetKeys = summarizeTargetKeys(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[RETIREMENT_IRAS_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RETIREMENT_IRAS_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RETIREMENT_IRAS_PATH] || []],
    ];

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} IRA inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeTargetKeys(blocks), `${label} IRA target keys should stay cleared`).toEqual(expectedTargetKeys);
    });
  });

  it('keeps the promoted 403(b) terms definitions inventories aligned to the rich-content blueprint', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[RETIREMENT_403B_TERMS_DEFINITIONS_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[RETIREMENT_403B_TERMS_DEFINITIONS_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RETIREMENT_403B_TERMS_DEFINITIONS_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RETIREMENT_403B_TERMS_DEFINITIONS_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'core_definitions', kind: 'content', mode: 'dynamic' },
    ]);
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({
        id: 'core_definitions',
        buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/services/retirement/403b"}',
        sectionClassName: 'retirement-403b-terms-definitions-core',
      }),
    ]);
    expect(expectedContentBlocks[0]?.html).toContain('QCCO = Qualified Church-Controlled Organization.');
    expect(expectedContentBlocks[0]?.html).toContain('403bregs@agfinancial.org');

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} 403(b) terms inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeContentBlocks(blocks), `${label} 403(b) terms content settings drifted`).toEqual(expectedContentBlocks);
    });
  });

  it('keeps the promoted fund-an-IRA inventories aligned to the widget blueprint', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[RETIREMENT_FUND_AN_IRA_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedWidgetBlocks = summarizeWidgetBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[RETIREMENT_FUND_AN_IRA_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RETIREMENT_FUND_AN_IRA_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RETIREMENT_FUND_AN_IRA_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'fund_ira_widget', kind: 'content', mode: 'dynamic' },
    ]);
    expect(expectedWidgetBlocks).toEqual([
      {
        id: 'fund_ira_widget',
        widget: 'retirement-fund-ira',
        sectionClassName: 'retirement-fund-ira-native-shell',
      },
    ]);

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} fund-an-IRA inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeWidgetBlocks(blocks), `${label} fund-an-IRA widget settings drifted`).toEqual(expectedWidgetBlocks);
    });
  });

  it('keeps the promoted subscribe inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[SUBSCRIBE_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[SUBSCRIBE_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[SUBSCRIBE_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[SUBSCRIBE_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'stay_in_loop', kind: 'content', mode: 'dynamic' },
    ]);
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({
        id: 'stay_in_loop',
        buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/#stay-in-the-loop"}',
        sectionClassName: 'subscribe-native-stay-in-loop',
      }),
    ]);
    expect(expectedContentBlocks[0]?.html).toContain('Stay in the loop');

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} subscribe inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeContentBlocks(blocks), `${label} subscribe content settings drifted`).toEqual(expectedContentBlocks);
    });
  });

  it('keeps the promoted yourplan inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[YOURPLAN_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[YOURPLAN_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[YOURPLAN_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[YOURPLAN_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'start_here', kind: 'card_grid', mode: 'dynamic' },
      { id: 'contact_cta', kind: 'content', mode: 'dynamic' },
    ]);
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({
        id: 'contact_cta',
        buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}',
        sectionClassName: 'yourplan-native-contact-cta',
      }),
    ]);

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} yourplan inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeContentBlocks(blocks), `${label} yourplan content settings drifted`).toEqual(expectedContentBlocks);
    });
  });

  it('keeps the promoted vineyard inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[VINEYARD_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[VINEYARD_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[VINEYARD_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[VINEYARD_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'faith_money_cards', kind: 'card_grid', mode: 'dynamic' },
    ]);
    const canonicalFaithMoneySettings = canonicalBlocks.find((block) => block?.id === 'faith_money_cards')?.settings;
    expect(canonicalFaithMoneySettings).toMatchObject({
      sectionClassName: 'vineyard-native-faith-money',
    });
    expectLinkJson(canonicalFaithMoneySettings, 'card1ButtonLinkJson', { kind: 'internal', to: '/services/investments' });
    expectLinkJson(canonicalFaithMoneySettings, 'card2ButtonLinkJson', { kind: 'internal', to: '/services/insurance/property-casualty-insurance' });
    expectLinkJson(canonicalFaithMoneySettings, 'card3ButtonLinkJson', { kind: 'internal', to: '/services/planned-giving' });
    expectLinkJson(canonicalFaithMoneySettings, 'card4ButtonLinkJson', { kind: 'internal', to: '/services/loans' });

    promotedSnapshots.forEach(([label, blocks]) => {
      const faithMoneySettings = blocks.find((block) => block?.id === 'faith_money_cards')?.settings;
      expect(summarizeInventory(blocks), `${label} vineyard inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(faithMoneySettings, `${label} vineyard card settings drifted`).toMatchObject({
        sectionClassName: 'vineyard-native-faith-money',
      });
      expectLinkJson(faithMoneySettings, 'card1ButtonLinkJson', { kind: 'internal', to: '/services/investments' });
      expectLinkJson(faithMoneySettings, 'card2ButtonLinkJson', { kind: 'internal', to: '/services/insurance/property-casualty-insurance' });
      expectLinkJson(faithMoneySettings, 'card3ButtonLinkJson', { kind: 'internal', to: '/services/planned-giving' });
      expectLinkJson(faithMoneySettings, 'card4ButtonLinkJson', { kind: 'internal', to: '/services/loans' });
    });
  });

  it('keeps the promoted resources inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[RESOURCES_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[RESOURCES_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[RESOURCES_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[RESOURCES_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'featured_resources', kind: 'card_grid', mode: 'dynamic' },
      { id: 'categories', kind: 'content', mode: 'dynamic' },
    ]);
    const canonicalFeaturedSettings = canonicalBlocks.find((block) => block?.id === 'featured_resources')?.settings;
    expect(canonicalFeaturedSettings).toMatchObject({
      sectionClassName: 'resources-native-featured',
    });
    expectLinkJson(canonicalFeaturedSettings, 'card1ButtonLinkJson', { kind: 'internal', to: '/resources' });
    expectLinkJson(canonicalFeaturedSettings, 'card3ButtonLinkJson', { kind: 'internal', to: '/resources' });
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({ id: 'categories', sectionClassName: 'resources-native-categories' }),
    ]);
    expect(expectedContentBlocks[0]?.html).toContain('<a href="/calculators">Calculators</a>');

    promotedSnapshots.forEach(([label, blocks]) => {
      const featuredSettings = blocks.find((block) => block?.id === 'featured_resources')?.settings;
      expect(summarizeInventory(blocks), `${label} resources inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(featuredSettings, `${label} resources card settings drifted`).toMatchObject({
        sectionClassName: 'resources-native-featured',
      });
      expectLinkJson(featuredSettings, 'card1ButtonLinkJson', { kind: 'internal', to: '/resources' });
      expectLinkJson(featuredSettings, 'card3ButtonLinkJson', { kind: 'internal', to: '/resources' });
      expect(summarizeContentBlocks(blocks), `${label} resources content settings drifted`).toEqual(expectedContentBlocks);
    });
  });

  it('keeps the promoted online contributions inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[ONLINE_CONTRIBUTIONS_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[ONLINE_CONTRIBUTIONS_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[ONLINE_CONTRIBUTIONS_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[ONLINE_CONTRIBUTIONS_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'setup_overview', kind: 'content', mode: 'dynamic' },
      { id: 'setup_steps', kind: 'card_grid', mode: 'dynamic' },
      { id: 'help_cta', kind: 'billboard', mode: 'dynamic' },
    ]);
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({ id: 'setup_overview', sectionClassName: 'online-contrib-native-overview' }),
    ]);
    expect(expectedContentBlocks[0]?.html).toContain('clientservices@agfinancial.org');
    const canonicalSetupSettings = canonicalBlocks.find((block) => block?.id === 'setup_steps')?.settings;
    expect(canonicalSetupSettings).toMatchObject({
      sectionClassName: 'online-contrib-native-steps',
    });
    expectLinkJson(canonicalSetupSettings, 'card1ButtonLinkJson', { kind: 'external', href: 'https://secure.agfinancial.org/cp/do/user/login' });
    expectLinkJson(canonicalSetupSettings, 'card3ButtonLinkJson', { kind: 'email', href: 'mailto:clientservices@agfinancial.org' });
    expectLinkJson(canonicalSetupSettings, 'card3Button2LinkJson', { kind: 'phone', href: 'tel:18666211787' });
    const canonicalHelpSettings = canonicalBlocks.find((block) => block?.id === 'help_cta')?.settings;
    expect(canonicalHelpSettings).toMatchObject({
      sectionClassName: 'online-contrib-native-help',
    });
    expectLinkJson(canonicalHelpSettings, 'buttonLinkJson', { kind: 'email', href: 'mailto:retirement@agfinancial.org' });
    expectLinkJson(canonicalHelpSettings, 'button2LinkJson', { kind: 'phone', href: 'tel:18006227526' });

    promotedSnapshots.forEach(([label, blocks]) => {
      const setupSettings = blocks.find((block) => block?.id === 'setup_steps')?.settings;
      const helpSettings = blocks.find((block) => block?.id === 'help_cta')?.settings;
      expect(summarizeInventory(blocks), `${label} online contributions inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeContentBlocks(blocks), `${label} online contributions content settings drifted`).toEqual(expectedContentBlocks);
      expect(setupSettings, `${label} online contributions card settings drifted`).toMatchObject({
        sectionClassName: 'online-contrib-native-steps',
      });
      expectLinkJson(setupSettings, 'card1ButtonLinkJson', { kind: 'external', href: 'https://secure.agfinancial.org/cp/do/user/login' });
      expectLinkJson(setupSettings, 'card3ButtonLinkJson', { kind: 'email', href: 'mailto:clientservices@agfinancial.org' });
      expectLinkJson(setupSettings, 'card3Button2LinkJson', { kind: 'phone', href: 'tel:18666211787' });
      expect(helpSettings, `${label} online contributions help settings drifted`).toMatchObject({
        sectionClassName: 'online-contrib-native-help',
      });
      expectLinkJson(helpSettings, 'buttonLinkJson', { kind: 'email', href: 'mailto:retirement@agfinancial.org' });
      expectLinkJson(helpSettings, 'button2LinkJson', { kind: 'phone', href: 'tel:18006227526' });
    });
  });

  it('keeps the promoted legal page inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const legalExpectations = [
      [
        PRIVACY_POLICY_PATH,
        [
          { id: 'hero', kind: 'hero', mode: 'dynamic' },
          { id: 'intro', kind: 'intro', mode: 'dynamic' },
          { id: 'privacy_details', kind: 'content', mode: 'dynamic' },
        ],
        {
          id: 'privacy_details',
          buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}',
          sectionClassName: 'legal-native-privacy-details',
          htmlToken: 'Collection and Use of Personal Information',
        },
      ],
      [
        TERMS_OF_SERVICE_PATH,
        [
          { id: 'hero', kind: 'hero', mode: 'dynamic' },
          { id: 'intro', kind: 'intro', mode: 'dynamic' },
          { id: 'terms_details', kind: 'content', mode: 'dynamic' },
        ],
        {
          id: 'terms_details',
          buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}',
          sectionClassName: 'legal-native-terms-details',
          htmlToken: 'Acceptance of Terms',
        },
      ],
    ];

    legalExpectations.forEach(([pathname, expectedInventory, expectedContent]) => {
      const canonicalBlocks = canonicalBlocksByPath[pathname] || [];
      const canonicalInventory = summarizeInventory(canonicalBlocks);
      const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
      const promotedSnapshots = [
        ['shared state', sharedRecord?.state?.blocksByPath?.[pathname] || []],
        ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[pathname] || []],
        ['seed seedState', seedRecord?.seedState?.blocksByPath?.[pathname] || []],
      ];

      expect(canonicalInventory).toEqual(expectedInventory);
      expect(expectedContentBlocks).toEqual([
        expect.objectContaining({
          id: expectedContent.id,
          buttonLinkJson: expectedContent.buttonLinkJson,
          sectionClassName: expectedContent.sectionClassName,
        }),
      ]);
      expect(expectedContentBlocks[0]?.html).toContain(expectedContent.htmlToken);

      promotedSnapshots.forEach(([label, blocks]) => {
        expect(summarizeInventory(blocks), `${label} ${pathname} inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
        expect(summarizeContentBlocks(blocks), `${label} ${pathname} content settings drifted`).toEqual(expectedContentBlocks);
      });
    });
  });

  it('keeps the promoted accessibility inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[ACCESSIBILITY_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const expectedContentBlocks = summarizeContentBlocks(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[ACCESSIBILITY_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[ACCESSIBILITY_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[ACCESSIBILITY_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'conformance_status', kind: 'content', mode: 'dynamic' },
      { id: 'limitations', kind: 'content', mode: 'dynamic' },
      { id: 'feedback', kind: 'content', mode: 'dynamic' },
    ]);
    expect(expectedContentBlocks).toEqual([
      expect.objectContaining({ id: 'conformance_status', sectionClassName: 'accessibility-native-conformance' }),
      expect.objectContaining({ id: 'limitations', sectionClassName: 'accessibility-native-limitations' }),
      expect.objectContaining({
        id: 'feedback',
        buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}',
        sectionClassName: 'accessibility-native-feedback',
      }),
    ]);
    expect(expectedContentBlocks[0]?.html).toContain('https://www.w3.org/WAI/standards-guidelines/wcag/');
    expect(expectedContentBlocks[1]?.html).toContain('https://support.microsoft.com/en-us/help/13862/windows-10-use-high-contrast-mode');

    promotedSnapshots.forEach(([label, blocks]) => {
      expect(summarizeInventory(blocks), `${label} accessibility inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(summarizeContentBlocks(blocks), `${label} accessibility content settings drifted`).toEqual(expectedContentBlocks);
    });
  });

  it('keeps the promoted mission assure claim inventories aligned to the canonical blocks', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');
    const canonicalBlocksByPath = normalizeStoredConfig({}).blocksByPath || {};
    const canonicalBlocks = canonicalBlocksByPath[MISSION_ASSURE_CLAIM_PATH] || [];
    const canonicalInventory = summarizeInventory(canonicalBlocks);
    const promotedSnapshots = [
      ['shared state', sharedRecord?.state?.blocksByPath?.[MISSION_ASSURE_CLAIM_PATH] || []],
      ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath?.[MISSION_ASSURE_CLAIM_PATH] || []],
      ['seed seedState', seedRecord?.seedState?.blocksByPath?.[MISSION_ASSURE_CLAIM_PATH] || []],
    ];

    expect(canonicalInventory).toEqual([
      { id: 'hero', kind: 'hero', mode: 'dynamic' },
      { id: 'intro', kind: 'intro', mode: 'dynamic' },
      { id: 'claim_contacts', kind: 'card_grid', mode: 'dynamic' },
    ]);
    const canonicalClaimSettings = canonicalBlocks.find((block) => block?.id === 'claim_contacts')?.settings;
    expect(canonicalClaimSettings).toMatchObject({
      sectionClassName: 'mission-assure-claim-contacts',
    });
    expectLinkJson(canonicalClaimSettings, 'card1ButtonLinkJson', { kind: 'email', href: 'mailto:ACEClaimsFirstNotice@acegroup.com' });
    expect(canonicalBlocks.find((block) => block?.id === 'claim_contacts')?.settings?.card4Body).toContain('Scranton, PA 18505-0554');

    promotedSnapshots.forEach(([label, blocks]) => {
      const claimSettings = blocks.find((block) => block?.id === 'claim_contacts')?.settings;
      expect(summarizeInventory(blocks), `${label} claim inventory drifted from canonical blueprints`).toEqual(canonicalInventory);
      expect(claimSettings, `${label} claim contact settings drifted`).toMatchObject({
        sectionClassName: 'mission-assure-claim-contacts',
      });
      expectLinkJson(claimSettings, 'card1ButtonLinkJson', { kind: 'email', href: 'mailto:ACEClaimsFirstNotice@acegroup.com' });
    });
  });
});
