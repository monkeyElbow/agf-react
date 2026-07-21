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
    ['intro', 'intro'],
    ['retirement_plan_feature', 'site_feature'],
    ['split_options', 'split_panel'],
    ['rollover_billboard', 'billboard'],
    ['billboard', 'billboard'],
    ['columns_math', 'billboard'],
    ['cta_form', 'cta_form'],
    ['testimonials', 'testimonials'],
  ],
});

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

function toInventory(blocksByPath = {}) {
  return Object.fromEntries(
    Object.entries(blocksByPath)
      .filter(([, blocks]) => Array.isArray(blocks) && blocks.length > 0)
      .map(([pathname, blocks]) => [
        pathname,
        blocks.map(toBlockSignature),
      ])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
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

describe('content admin source convergence', () => {
  it('keeps the seed baseline file to one content source', () => {
    const seedRecord = readJson('dev-data/content-admin-seed-baseline.json');

    expect(Object.keys(seedRecord).sort()).toEqual(['meta', 'seedState']);
  });

  it('keeps shared authoring, shared published, and seed baseline inventories converged', () => {
    const snapshots = CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.map(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      return [label, toInventory(record?.[rootKey]?.blocksByPath || {})];
    });
    const referenceInventory = snapshots[0][1];

    snapshots.forEach(([label, inventory]) => {
      expect(inventory, `${label} should match shared state inventory`).toEqual(referenceInventory);
    });
  });

  it('keeps active snapshot inventories aligned with non-empty block blueprints', () => {
    const blueprintInventory = toInventory(contentBlockBlueprintsByPath);

    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      const snapshotInventory = toInventory(record?.[rootKey]?.blocksByPath || {});

      expect(snapshotInventory, `${label} should match non-empty blueprint inventory`).toEqual(blueprintInventory);
    });
  });

  it('keeps root product custom-renderer block requirements explicit', () => {
    Object.entries(ROOT_PRODUCT_PAGE_CUSTOM_RENDERER_REQUIREMENTS).forEach(([pathname, requirements]) => {
      const expected = requirements.map(([id, kind]) => ({
        id,
        kind,
        mode: 'dynamic',
        hidden: false,
      }));

      expect(
        (contentBlockBlueprintsByPath[pathname] || []).map(toBlockSignature),
        `${pathname} blueprint should carry all custom-renderer blocks`,
      ).toEqual(expected);

      CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
        const record = readJson(relativePath);

        expect(
          (record?.[rootKey]?.blocksByPath?.[pathname] || []).map(toBlockSignature),
          `${label} ${pathname} should carry the custom-renderer block contract`,
        ).toEqual(expected);
      });
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

  it('keeps shared revision restore inventories aligned with current shared state', () => {
    const sharedRecord = readJson('dev-data/content-admin-shared.json');
    const currentInventory = toInventory(sharedRecord?.state?.blocksByPath || {});
    const revisionDrift = [];

    Object.entries(sharedRecord?.revisionsByPath || {}).forEach(([pathname, revisions]) => {
      if (!Object.prototype.hasOwnProperty.call(currentInventory, pathname)) {
        return;
      }

      const expectedInventory = currentInventory[pathname];
      (Array.isArray(revisions) ? revisions : []).forEach((revision, revisionIndex) => {
        const revisionInventory = (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [])
          .map(toBlockSignature);

        if (JSON.stringify(revisionInventory) !== JSON.stringify(expectedInventory)) {
          revisionDrift.push({
            pathname,
            revisionId: String(revision?.id || ''),
            revisionIndex,
            expectedInventory,
            revisionInventory,
          });
        }
      });
    });

    expect(revisionDrift, 'shared revision restores should not reintroduce retired or partial block inventories').toEqual([]);
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
            || block?.settings?.widget === 'giving-comparison-matrix'
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
