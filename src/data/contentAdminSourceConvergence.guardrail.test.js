import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
  SPECIAL_MANAGED_PAGE_CLASSIFICATIONS,
} from '../lib/managedPageShells';
import {
  CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS,
  CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS,
} from '../lib/contentAdminSnapshotSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const ALLOWED_PAGE_CONTENT_PATHS = Object.freeze(
  Object.entries(SPECIAL_MANAGED_PAGE_CLASSIFICATIONS)
    .filter(([, classification]) => CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS.includes(classification))
    .map(([pathname]) => pathname)
    .sort(),
);
const MANAGED_LEGACY_ALIAS_PATHS = Object.freeze([
  '/services/legacy-giving',
  '/services/legacy-giving/charitable-gift-annuities',
  '/services/legacy-giving/charitable-trusts',
  '/services/legacy-giving/endowments',
  '/services/legacy-giving/generosity-fund',
  '/services/legacy-giving/ministry-impact-fund',
  '/services/retirement/403b-for-groups',
  '/services/retirement/403b-for-groups/403b-group-enrollment',
]);
const ROOT_PRODUCT_PAGE_CUSTOM_RENDERER_REQUIREMENTS = Object.freeze({
  '/services': [
    ['hero_pie', 'hero_pie'],
    ['intro', 'billboard'],
    ['services_cards', 'site_feature'],
    ['matters_band', 'site_feature'],
    ['cta_form', 'cta_form'],
    ['testimonials', 'testimonials'],
  ],
  '/services/loans': [
    ['hero', 'hero'],
    ['intro', 'intro'],
    ['request_form', 'request_form'],
    ['loan_options', 'card_grid'],
    ['value_cards', 'columns'],
    ['vision_fuel', 'billboard'],
    ['cta_form', 'cta_form'],
    ['testimonials', 'testimonials'],
    ['cta_band', 'cta_band'],
  ],
  '/services/investments': [
    ['hero', 'hero'],
    ['intro', 'intro'],
    ['certificates', 'card_grid'],
    ['growth_feature', 'site_feature'],
    ['cta_form', 'cta_form'],
    ['certificates_table', 'rates'],
    ['laddering', 'calculator_cta'],
    ['testimonials', 'testimonials'],
    ['cash_reserves', 'feature_panel'],
  ],
  '/services/retirement': [
    ['hero', 'hero'],
    ['intro', 'intro', true],
    ['retirement_plan_feature', 'site_feature'],
    ['split_options', 'split_panel'],
    ['rollover_billboard', 'billboard'],
    ['billboard', 'billboard'],
    ['columns_math', 'billboard'],
    ['cta_form', 'cta_form'],
    ['testimonials', 'testimonials'],
  ],
});
const CHARITABLE_TRUSTS_PATH = '/services/planned-giving/charitable-trusts';

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function readSource(relativePath) {
  return readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

function toBlockSignature(block) {
  return {
    id: String(block?.id || ''),
    kind: String(block?.kind || ''),
    mode: String(block?.mode || ''),
    hidden: Boolean(block?.hidden),
  };
}

function sortBlockSignatures(signatures) {
  return [...signatures].sort((left, right) => (
    left.id.localeCompare(right.id)
    || left.kind.localeCompare(right.kind)
    || left.mode.localeCompare(right.mode)
    || Number(left.hidden) - Number(right.hidden)
  ));
}

function findPageContentPaths(blocksByPath = {}) {
  return Object.entries(blocksByPath)
    .filter(([, blocks]) => (Array.isArray(blocks) ? blocks : []).some((block) => (
      block?.id === 'page_content'
      || block?.kind === 'page_content'
    )))
    .map(([pathname]) => pathname)
    .sort();
}

function collectSnapshotBlockShapeFindings(blocksByPath = {}) {
  const findings = [];

  Object.entries(blocksByPath).forEach(([pathname, blocks]) => {
    if (!Array.isArray(blocks)) {
      findings.push({ pathname, issue: 'blocks_not_array' });
      return;
    }

    const seenIds = new Set();
    blocks.forEach((block, blockIndex) => {
      const signature = toBlockSignature(block);

      if (!signature.id || !signature.kind || !signature.mode) {
        findings.push({ pathname, blockIndex, issue: 'missing_signature', signature });
      }

      if (seenIds.has(signature.id)) {
        findings.push({ pathname, blockIndex, issue: 'duplicate_block_id', blockId: signature.id });
      }
      seenIds.add(signature.id);
    });
  });

  return findings;
}

function getRouteBlock(blocksByPath = {}, pathname, blockId) {
  return (Array.isArray(blocksByPath?.[pathname]) ? blocksByPath[pathname] : [])
    .find((block) => String(block?.id || '') === blockId);
}

function collectRevisionBlocks(revisionsByPath = {}) {
  return Object.entries(revisionsByPath).flatMap(([pathname, revisions]) => (
    (Array.isArray(revisions) ? revisions : []).flatMap((revision, revisionIndex) => (
      (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : []).map((block, blockIndex) => ({
        pathname,
        revisionId: String(revision?.id || ''),
        revisionIndex,
        blockIndex,
        block,
      }))
    ))
  ));
}

function hasTargetBridgeSettings(block) {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};

  return [
    'targetSectionKey',
    'targetFineprintSectionKey',
    'targetSectionClassName',
    'targetSectionIndex',
  ].some((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function collectRetiredContentPathKeys(stateRoot = {}) {
  const findings = [];
  const legacyPathSet = new Set(MANAGED_LEGACY_ALIAS_PATHS);

  [
    ['pageHierarchy', stateRoot.pageHierarchy],
    ['blocksByPath', stateRoot.blocksByPath],
    ['collaborationByPath', stateRoot.collaborationByPath],
  ].forEach(([source, record]) => {
    Object.keys(record || {}).forEach((pathname) => {
      if (legacyPathSet.has(pathname)) {
        findings.push({ source, pathname });
      }
    });
  });

  return findings;
}

describe('architecture.content-admin active-state hygiene', () => {
  it('keeps the seed baseline file to one content source', () => {
    const seedRecord = readJson('dev-data/content-admin-seed-baseline.json');

    expect(Object.keys(seedRecord).sort()).toEqual(['meta', 'seedState']);
  });

  it('keeps shared authoring, shared published, and seed baseline block records structurally valid', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);

      expect(
        collectSnapshotBlockShapeFindings(record?.[rootKey]?.blocksByPath || {}),
        `${label} should contain valid editable block records`,
      ).toEqual([]);
    });
  });

  it('keeps active snapshots free to diverge from source blueprint ordering and editable content', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);

      expect(
        collectSnapshotBlockShapeFindings(record?.[rootKey]?.blocksByPath || {}),
        `${label} should validate by shape instead of blueprint inventory equality`,
      ).toEqual([]);
    });
  });

  it('keeps charitable trusts operational block flow and anchor behavior valid', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      const blocks = record?.[rootKey]?.blocksByPath?.[CHARITABLE_TRUSTS_PATH] || [];
      const blockIds = blocks.map((block) => String(block?.id || ''));
      const differencesBlock = getRouteBlock(record?.[rootKey]?.blocksByPath, CHARITABLE_TRUSTS_PATH, 'trust_differences');
      const fundingBlock = getRouteBlock(record?.[rootKey]?.blocksByPath, CHARITABLE_TRUSTS_PATH, 'trust_funding');

      // Retained order contract: the funding CTA must remain immediately after
      // comparison cards so its anchor flow is not separated from the choice.
      expect(blockIds.indexOf('trust_funding'), `${label} trust_funding should follow trust_differences`).toBe(blockIds.indexOf('trust_differences') + 1);
      expect(differencesBlock, `${label} trust_differences should remain a managed block`).toMatchObject({
        id: 'trust_differences',
        kind: 'card_grid',
        mode: 'dynamic',
      });
      expect(fundingBlock, `${label} trust_funding should remain a managed block`).toMatchObject({
        id: 'trust_funding',
        kind: 'card_grid',
        mode: 'dynamic',
      });
      expect(differencesBlock?.settings?.columns).toBe('two');
      expect(fundingBlock?.settings?.columns).toBe('one');
      expect(JSON.parse(fundingBlock?.settings?.card1ButtonLinkJson || '{}')).toEqual(expect.objectContaining({
        kind: 'anchor',
        href: '#charitable-trusts-form',
        openInNewWindow: false,
      }));
    });
  });

  it('keeps root product custom-renderer block requirements explicit', () => {
    Object.entries(ROOT_PRODUCT_PAGE_CUSTOM_RENDERER_REQUIREMENTS).forEach(([pathname, requirements]) => {
      const expected = requirements.map(([id, kind, hidden = false]) => ({
        id,
        kind,
        mode: 'dynamic',
        hidden,
      }));

      expect(
        sortBlockSignatures((contentBlockBlueprintsByPath[pathname] || []).map(toBlockSignature)),
        `${pathname} blueprint should carry all custom-renderer blocks`,
      ).toEqual(sortBlockSignatures(expected));

      expect(requirements.length, `${pathname} custom renderer requirements should be declared in source only`).toBeGreaterThan(0);
    });
  });

  it('keeps root product CTA rendering owned by managed blocks, not seed defaults', () => {
    [
      'src/pages/ServicesPage.jsx',
      'src/pages/LoansPage.jsx',
      'src/pages/RetirementPage.jsx',
    ].forEach((relativePath) => {
      const source = readSource(relativePath);
      const ctaSectionIndex = source.indexOf('<DynamicCtaSection');
      const suppressDefaultIndex = source.indexOf('renderDefaultWhenMissing={false}', ctaSectionIndex);

      expect(ctaSectionIndex, `${relativePath} should render the managed CTA section`).toBeGreaterThan(-1);
      expect(
        suppressDefaultIndex,
        `${relativePath} should not render CTA seed defaults when the managed CTA block is missing`,
      ).toBeGreaterThan(ctaSectionIndex);
    });
  });

  it('keeps content admin normalization from importing native page content as a fallback source', () => {
    const source = readSource('src/context/ContentAdminContext.jsx');

    expect(source).not.toContain("from '../data/nativePageContent'");
    expect(source).not.toContain('getNativePageContent(');
    expect(source).not.toContain('getStaticHeroDefaultsForPath');
  });

  it('keeps shared revision restore block records structurally valid', () => {
    const sharedRecord = readJson('dev-data/content-admin-shared.json');
    const revisionShapeFindings = [];

    Object.entries(sharedRecord?.revisionsByPath || {}).forEach(([pathname, revisions]) => {
      (Array.isArray(revisions) ? revisions : []).forEach((revision, revisionIndex) => {
        collectSnapshotBlockShapeFindings({ [pathname]: revision?.snapshot?.blocks || [] })
          .forEach((finding) => revisionShapeFindings.push({
            ...finding,
            revisionId: String(revision?.id || ''),
            revisionIndex,
          }));
      });
    });

    expect(revisionShapeFindings, 'shared revision restores should contain valid editable block records').toEqual([]);
  });

  it('keeps page-content usage isolated to classified special routes', () => {
    expect(findPageContentPaths(contentBlockBlueprintsByPath), 'blueprint page_content paths').toEqual(ALLOWED_PAGE_CONTENT_PATHS);

    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      const pageContentPaths = findPageContentPaths(record?.[rootKey]?.blocksByPath || {});

      expect(pageContentPaths, `${label} page_content paths`).toEqual(ALLOWED_PAGE_CONTENT_PATHS);
      pageContentPaths.forEach((pathname) => {
        expect(
          SPECIAL_MANAGED_PAGE_CLASSIFICATIONS[pathname],
          `${pathname} must be classified while it carries page_content`,
        ).toBeTruthy();
        expect(
          BLOCKLESS_MANAGED_PAGE_PATHS.has(pathname),
          `${pathname} should not be treated as a blockless functional route while it carries page_content`,
        ).toBe(false);
      });
    });
  });

  it('keeps managed legacy alias paths from becoming content-bearing routes', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);

      expect(
        collectRetiredContentPathKeys(record?.[rootKey]),
        `${label} retired path keys`,
      ).toEqual([]);

      MANAGED_LEGACY_ALIAS_PATHS.forEach((legacyPath) => {
        expect(
          Object.prototype.hasOwnProperty.call(record?.[rootKey]?.pathAliases || {}, legacyPath),
          `${label} should keep ${legacyPath} only as an explicit path alias`,
        ).toBe(true);
      });
    });

    const sharedRecord = readJson('dev-data/content-admin-shared.json');
    const revisionPathFindings = Object.entries(sharedRecord?.revisionsByPath || {})
      .filter(([pathname]) => MANAGED_LEGACY_ALIAS_PATHS.includes(pathname))
      .map(([pathname]) => pathname);

    expect(revisionPathFindings, 'shared revisions should not use retired path keys').toEqual([]);
  });

  it('keeps shared revision restores free of retired block-only page residue', () => {
    const sharedRecord = readJson('dev-data/content-admin-shared.json');
    const revisionBlocks = collectRevisionBlocks(sharedRecord?.revisionsByPath || {});
    const pageContentResidue = [];
    const targetBridgeResidue = [];
    const staticModeResidue = [];
    const retiredBlockResidue = [];

    revisionBlocks.forEach(({ pathname, revisionId, revisionIndex, blockIndex, block }) => {
      const blockId = String(block?.id || '').trim();
      const location = {
        pathname,
        revisionId,
        revisionIndex,
        blockIndex,
        blockId,
        kind: String(block?.kind || '').trim(),
      };
      const isPageContent = blockId === 'page_content' || block?.kind === 'page_content';

      if (
        isPageContent
        && !ALLOWED_PAGE_CONTENT_PATHS.includes(pathname)
      ) {
        pageContentResidue.push(location);
      }

      if (
        BLOCK_ONLY_MANAGED_PAGE_PATHS.has(pathname)
        && hasTargetBridgeSettings(block)
      ) {
        targetBridgeResidue.push(location);
      }

      if (block?.mode === 'static') {
        staticModeResidue.push(location);
      }

      if (
        (
          pathname === '/services/retirement/403b'
          && (
            blockId === 'strategy_enroll_cta'
            || (blockId === 'investment_strategy_options' && block?.kind === 'card_grid')
          )
        ) || (
          pathname === '/services/planned-giving'
          && (
            blockId === 'comparison_matrix'
            || block?.settings?.widget === 'charitable-giving-table'
            || String(block?.settings?.sectionClassName || '').split(/\s+/).includes('legacy-giving-comparison-matrix')
          )
        )
      ) {
        retiredBlockResidue.push(location);
      }
    });

    expect(pageContentResidue, 'revision restores should not reintroduce page_content on block-only pages').toEqual([]);
    expect(targetBridgeResidue, 'revision restores should not reintroduce target-section bridge settings').toEqual([]);
    expect(staticModeResidue, 'revision restores should not reintroduce static block modes').toEqual([]);
    expect(retiredBlockResidue, 'revision restores should not reintroduce retired 403(b) or planned-giving blocks').toEqual([]);
  });
});
