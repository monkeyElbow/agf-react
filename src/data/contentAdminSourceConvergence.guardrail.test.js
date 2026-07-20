import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
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

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
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
});
