import { describe, expect, it } from 'vitest';
import {
  CONTENT_ADMIN_MIGRATION_AFFECTED_LAYERS,
  CONTENT_ADMIN_MIGRATION_ADAPTERS,
  getSnapshotLayerManifest,
  runContentAdminMigrationInventory,
} from './content-admin-migration-inventory.mjs';

function fixtureRecord() {
  return {
    state: {
      pageHierarchy: {},
      blocksByPath: {
        '/test': [{
          id: 'copy',
          kind: 'content',
          mode: 'dynamic',
          settings: { targetSectionKey: 'class:retired-target' },
        }],
      },
      pathAliases: {},
      collaborationByPath: {},
    },
    baseSnapshot: {
      pageHierarchy: {},
      blocksByPath: {},
      pathAliases: {},
      collaborationByPath: {},
    },
    revisionsByPath: {},
  };
}

describe('content-admin migration inventory', () => {
  it('requires executable metadata for every known adapter', () => {
    expect(CONTENT_ADMIN_MIGRATION_ADAPTERS.length).toBeGreaterThan(0);
    CONTENT_ADMIN_MIGRATION_ADAPTERS.forEach((entry) => {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.category).toBeTruthy();
      expect(entry.affectedLayers).toEqual(CONTENT_ADMIN_MIGRATION_AFFECTED_LAYERS);
      expect(entry.sourceFiles.length).toBeGreaterThan(0);
      expect(entry.sourceSymbols.length).toBeGreaterThan(0);
      expect(entry.detect).toEqual(expect.any(Function));
      expect(entry.retireWhen).toEqual(expect.any(Function));
      expect(entry.retireWhenDescription).toMatch(/\w/);
    });
  });

  it('detects a persisted target bridge finding by route and block', () => {
    const adapter = CONTENT_ADMIN_MIGRATION_ADAPTERS.find((entry) => entry.id === 'target-bridge-snapshot-cleanup');
    const descriptor = { label: 'fixture', type: 'shared' };
    const findings = adapter.detect({
      adapter: adapter.id,
      descriptor,
      record: fixtureRecord(),
    });

    expect(findings).toEqual([
      expect.objectContaining({
        adapter: adapter.id,
        record: 'fixture',
        layer: 'active',
        pathname: '/test',
        blockId: 'copy',
      }),
    ]);
    expect(adapter.retireWhen({ totalFindings: findings.length })).toBe(false);
  });

  it('reports the current active and seed layer manifest without mutating records', () => {
    const before = runContentAdminMigrationInventory();
    const manifest = getSnapshotLayerManifest();
    const after = runContentAdminMigrationInventory();

    expect(manifest.map((entry) => entry.relativePath)).toEqual([
      'dev-data/content-admin-shared.json',
      'dev-data/content-admin-seed-baseline.json',
    ]);
    expect(after).toEqual(before);
    expect(before.sourceFindings).toEqual([]);
  });
});
