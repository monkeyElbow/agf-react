import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { normalizeContentAdminState } from './contentAdminNormalization';
import {
  GENEROSITY_FUND_PATH,
  GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
  migrateGenerosityFundSnapshot,
  stripRetiredTargetBridgeSettingsFromState,
} from './contentAdminSnapshotMigrations';

const legacyState = {
  pageHierarchy: { '/test': { path: '/test', title: 'Test' } },
  blocksByPath: {
    '/test': [{
      id: 'copy',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Edited title',
        bodyHtml: '<p>Edited body</p>',
        targetSectionKey: 'class:old-native-section',
      },
    }],
  },
  pathAliases: {},
  collaborationByPath: {},
};

describe('content-admin snapshot migrations', () => {
  it('does not run retired target-field cleanup during ordinary normalization', () => {
    const normalized = normalizeContentAdminState(legacyState);
    expect(normalized.blocksByPath['/test'][0].settings.targetSectionKey)
      .toBe('class:old-native-section');
    expect(normalized.blocksByPath['/test'][0].settings.title).toBe('Edited title');
  });

  it('cleans retired target fields only when the explicit migration is invoked', () => {
    const migrated = stripRetiredTargetBridgeSettingsFromState(legacyState);
    expect(migrated.blocksByPath['/test'][0].settings).toEqual({
      title: 'Edited title',
      bodyHtml: '<p>Edited body</p>',
    });
  });

  it('never replaces the active Generosity Fund block during ordinary browser normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        [GENEROSITY_FUND_PATH]: [{
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            title: 'Admin-owned title',
            bodyHtml: '<p>Admin-owned body</p>',
            customMarker: 'keep-me',
          },
        }],
      },
    });
    const hero = normalized.blocksByPath[GENEROSITY_FUND_PATH]
      .find((block) => block?.id === 'hero');

    expect(hero?.settings).toMatchObject({
      title: 'Admin-owned title',
      bodyHtml: '<p>Admin-owned body</p>',
      customMarker: 'keep-me',
    });
  });

  it('replaces the legacy block only through the explicit versioned migration', () => {
    const activeState = {
      blocksByPath: {
        [GENEROSITY_FUND_PATH]: [{
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            title: 'Admin-owned title',
            customMarker: 'legacy-shape',
          },
        }],
      },
    };
    const defaultState = {
      blocksByPath: {
        [GENEROSITY_FUND_PATH]: [{
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            title: 'Canonical title',
            canonicalMarker: 'from-reference',
          },
          editableFields: [{ id: 'title' }],
        }],
      },
    };

    const migrated = migrateGenerosityFundSnapshot(activeState, {
      defaultState,
      fromVersion: 0,
    });
    const migratedHero = migrated.state.blocksByPath[GENEROSITY_FUND_PATH][0];

    expect(migrated.changed).toBe(true);
    expect(migrated.migration).toMatchObject({
      version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
      applied: true,
    });
    expect(migratedHero.settings).toEqual({
      title: 'Canonical title',
      canonicalMarker: 'from-reference',
    });
    expect(migratedHero.editableFields).toEqual([{ id: 'title' }]);

    const secondPass = migrateGenerosityFundSnapshot(migrated.state, {
      defaultState,
      fromVersion: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
    });
    expect(secondPass.changed).toBe(false);
    expect(secondPass.state).toEqual(migrated.state);
  });
});
