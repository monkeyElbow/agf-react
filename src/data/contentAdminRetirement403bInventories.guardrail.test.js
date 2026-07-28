import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BLOCK_ONLY_MANAGED_PAGE_PATHS } from '../lib/managedPageShells.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETIREMENT_403B_PATH = '/services/retirement/403b';
const RETIREMENT_403B_GUARDRAIL_PATHS = [
  RETIREMENT_403B_PATH,
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/403b/403b-group-enrollment',
];
const BLOCK_SHAPE_GUARDRAIL_PATHS = [
  ...RETIREMENT_403B_GUARDRAIL_PATHS,
  '/services/retirement/iras',
  '/services/retirement/iras/fund-an-ira',
  '/services/retirement/403b/403b-terms-definitions',
  '/accessibility',
  '/services/insurance/mission-assure/report-a-claim',
  '/online-contributions',
  '/privacy-policy',
  '/resources',
  '/subscribe',
  '/terms-of-service',
  '/vineyard',
  '/yourplan',
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

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(__dirname, relativePath), 'utf8'));
}

function getSnapshotSets() {
  const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
  const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');

  return [
    ['shared state', sharedRecord?.state?.blocksByPath || {}],
    ['shared baseSnapshot', sharedRecord?.baseSnapshot?.blocksByPath || {}],
    ['seed seedState', seedRecord?.seedState?.blocksByPath || {}],
  ];
}

function getSettings(block) {
  return block?.settings && typeof block.settings === 'object' ? block.settings : {};
}

function hasTargetBridgeSettings(block) {
  const settings = getSettings(block);

  return [
    'targetSectionKey',
    'targetFineprintSectionKey',
    'targetSectionClassName',
    'targetSectionIndex',
  ].some((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function findBlockOnlyLegacyBridgeBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => (
      block?.id === 'page_content'
      || block?.kind === 'page_content'
      || hasTargetBridgeSettings(block)
    ))
    .map((block) => ({
      id: String(block?.id || ''),
      kind: String(block?.kind || ''),
      targetSectionKey: String(getSettings(block).targetSectionKey || ''),
      targetSectionClassName: String(getSettings(block).targetSectionClassName || ''),
      targetSectionIndex: Number(getSettings(block).targetSectionIndex || 0),
    }));
}

function collectBlockShapeFindings(blocks, pathname) {
  const findings = [];
  const seenIds = new Set();

  (Array.isArray(blocks) ? blocks : []).forEach((block, blockIndex) => {
    const id = String(block?.id || '').trim();
    const kind = String(block?.kind || '').trim();
    const mode = String(block?.mode || '').trim();

    if (!id || !kind || !mode) {
      findings.push({ pathname, blockIndex, id, kind, mode, issue: 'missing_signature' });
    }

    if (seenIds.has(id)) {
      findings.push({ pathname, blockIndex, id, issue: 'duplicate_block_id' });
    }
    seenIds.add(id);

    if (mode === 'static') {
      findings.push({ pathname, blockIndex, id, issue: 'static_mode' });
    }
  });

  return findings;
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

describe('content admin promoted snapshot safety guardrail', () => {
  it('keeps promoted block-only snapshots free of page-content and target-section bridge metadata', () => {
    getSnapshotSets().forEach(([label, blocksByPath]) => {
      Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
        expect(
          findBlockOnlyLegacyBridgeBlocks(blocksByPath[pathname] || []),
          `${label} ${pathname} should not carry page_content or target-section bridge metadata`,
        ).toEqual([]);
      });
    });
  });

  it('allows admin-managed snapshots to reorder or edit blocks while keeping block records valid', () => {
    getSnapshotSets().forEach(([label, blocksByPath]) => {
      const findings = BLOCK_SHAPE_GUARDRAIL_PATHS.flatMap((pathname) => (
        collectBlockShapeFindings(blocksByPath[pathname] || [], pathname)
      ));

      expect(
        findings,
        `${label} should validate snapshot shape instead of canonical block order, presence, or content`,
      ).toEqual([]);
    });
  });

  it('keeps promoted 403(b) snapshots free of stale RMHA and retired CTA strings', () => {
    const sharedRecord = readJson('../../dev-data/content-admin-shared.json');
    const seedRecord = readJson('../../dev-data/content-admin-seed-baseline.json');

    getSnapshotSets().forEach(([label, blocksByPath]) => {
      expectNoStale403bRmhaSnapshotStrings(blocksByPath[RETIREMENT_403B_PATH] || [], label);
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
});
