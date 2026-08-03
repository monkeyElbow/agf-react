import { describe, expect, it } from 'vitest';
import { normalizeContentAdminState } from './contentAdminNormalization';
import {
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
});
