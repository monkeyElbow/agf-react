import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { normalizeContentAdminState } from './contentAdminNormalization';
import {
  CGA_PATH,
  CGA_SECURE_ACT_CARD_MIGRATION_VERSION,
  INSURANCE_PC_RESOURCES_PATH,
  INSURANCE_PATH,
  GENEROSITY_FUND_PATH,
  GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
  migrateQcdCenteredCardGridBlock,
  migrateQcdCenteredCardGridState,
  migrateCgaSecureActCardState,
  migrateInsuranceCoverageCtaState,
  migrateInsurancePcResourceCardsBlock,
  migrateInsurancePcResourceCardsState,
  migratePlannedGivingStepsBlock,
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

  it('migrates QCD flow-step identity without changing its content or approved art', () => {
    const legacyBlock = {
      id: 'how_it_works',
      kind: 'columns',
      mode: 'dynamic',
      presetId: 'default',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-qcd-steps',
        col1Body: 'First exact body',
        col1IconKey: 'endowments-step-1',
        col2IconKey: 'daf-step-3',
        col3IconKey: 'qcd-step-3',
      },
    };
    const migrated = migratePlannedGivingStepsBlock(
      '/services/planned-giving/qualified-charitable-distribution',
      legacyBlock,
    );

    expect(migrated).toMatchObject({
      presetId: 'planned-giving-steps',
      settings: {
        sectionClassName: '',
        col1Body: 'First exact body',
        col1IconKey: 'endowments-step-1',
        col2IconKey: 'daf-step-3',
        col3IconKey: 'qcd-step-3',
      },
    });
  });

  it('moves the existing QCD card copy into the reusable centered bullet presentation', () => {
    const block = {
      id: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'default',
      settings: {
        title: 'It starts with your IRA.',
        card1Title: 'A few things to know:',
        card1Body: '\nMust be age 70½ or older\nTransfers up to $110,000 per year',
        card1ListJson: '',
        card2Title: 'Card title',
        card2Body: 'Add card description here.',
        card3Title: 'Card title',
        card3Body: 'Add card description here.',
      },
    };

    const migrated = migrateQcdCenteredCardGridBlock(
      '/services/planned-giving/qualified-charitable-distribution',
      block,
    );

    expect(migrated.settings).toMatchObject({
      title: 'It starts with your IRA.',
      cardStyle: 'planned-giving-centered',
      columns: 'one',
      card1Body: '',
      card1ListJson: JSON.stringify([
        'Must be age 70½ or older',
        'Transfers up to $110,000 per year',
      ]),
      card2Title: '',
      card2Body: '',
      card3Title: '',
      card3Body: '',
    });
    expect(migrateQcdCenteredCardGridBlock('/test', block)).toEqual(block);
  });

  it('migrates both active and base QCD state through the explicit state helper', () => {
    const state = {
      blocksByPath: {
        '/services/planned-giving/qualified-charitable-distribution': [{
          id: 'card_grid',
          kind: 'card_grid',
          mode: 'dynamic',
          settings: { card1Body: 'One line' },
        }],
      },
    };
    const migrated = migrateQcdCenteredCardGridState(state);
    expect(migrated.changed).toBe(true);
    expect(migrated.state.blocksByPath['/services/planned-giving/qualified-charitable-distribution'][0].settings.card1ListJson)
      .toBe(JSON.stringify(['One line']));
  });

  it('converts legacy arrow-prefixed P&C resource copy into real card lists', () => {
    const block = {
      id: 'resources',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Body: '› Sexual misconduct liability\n› Medical payments',
        card1ListJson: '',
        card2Body: '› Online safety tools\n› **Comprehensive risk management guide**',
        card2ListJson: '',
      },
    };

    const migrated = migrateInsurancePcResourceCardsBlock(INSURANCE_PC_RESOURCES_PATH, block);

    expect(migrated.settings).toMatchObject({
      card1Body: '',
      card1ListJson: JSON.stringify(['Sexual misconduct liability', 'Medical payments']),
      card2Body: '',
      card2ListJson: JSON.stringify(['Online safety tools', '**Comprehensive risk management guide**']),
    });
    expect(migrateInsurancePcResourceCardsBlock('/test', block)).toEqual(block);
  });

  it('migrates P&C resource cards through the explicit state helper', () => {
    const state = {
      blocksByPath: {
        [INSURANCE_PC_RESOURCES_PATH]: [{
          id: 'resources',
          kind: 'card_grid',
          mode: 'dynamic',
          settings: { card1Body: '› One item' },
        }],
      },
    };

    const migrated = migrateInsurancePcResourceCardsState(state);
    expect(migrated.changed).toBe(true);
    expect(migrated.state.blocksByPath[INSURANCE_PC_RESOURCES_PATH][0].settings.card1ListJson)
      .toBe(JSON.stringify(['One item']));
  });

  it('moves CGA SECURE 2.0 content into the gift-assets card without changing other content', () => {
    const state = {
      blocksByPath: {
        [CGA_PATH]: [
          {
            id: 'gift_assets',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              card1ListJson: JSON.stringify(['Cash (a significant portion of the annuity income may be tax-free)']),
              card1BodyHtml: '<p></p>',
              card2BodyHtml: '<p>Keep this card copy.</p>',
              card1ButtonLabel: 'Learn more about this',
            },
          },
          {
            id: 'secure_act',
            kind: 'content',
            mode: 'dynamic',
            settings: { html: '<p><strong>The SECURE 2.0 Act</strong> legacy content.</p>' },
          },
          { id: 'qcd_fineprint', kind: 'content', mode: 'dynamic', settings: { html: '<p>Keep this.</p>' } },
        ],
      },
    };

    const migrated = migrateCgaSecureActCardState(state);
    const blocks = migrated.state.blocksByPath[CGA_PATH];
    const giftAssets = blocks.find((block) => block.id === 'gift_assets');

    expect(migrated.changed).toBe(true);
    expect(blocks.some((block) => block.id === 'secure_act')).toBe(false);
    expect(giftAssets.settings.card1Body).toContain('<ul>');
    expect(giftAssets.settings.card1Body).toContain('The SECURE 2.0 Act of 2022');
    expect(giftAssets.settings.card1BodyHtml).toBeUndefined();
    expect(giftAssets.settings.card1ListJson).toBeUndefined();
    expect(giftAssets.settings.card2Body).toBe('<p>Keep this card copy.</p>');
    expect(giftAssets.settings.card2BodyHtml).toBeUndefined();
    expect(giftAssets.settings.card1Body).toContain('Cash');
    expect(giftAssets.settings.card1ListJson).toBeUndefined();
    expect(giftAssets.settings.card1ButtonLabel).toBe('Learn more about this');
    expect(CGA_SECURE_ACT_CARD_MIGRATION_VERSION).toBe(4);
  });

  it('copies only the existing insurance CTA fields into a base snapshot missing them', () => {
    const fieldsJson = JSON.stringify([
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
    ]);
    const state = {
      blocksByPath: {
        [INSURANCE_PATH]: [{
          id: 'cta_form',
          kind: 'cta_form',
          mode: 'dynamic',
          settings: {
            title: 'What coverage is best for your ministry?',
            fieldsJson,
            draftOnlyValue: 'preserve',
          },
        }],
      },
    };
    const base = {
      blocksByPath: {
        [INSURANCE_PATH]: [{
          id: 'cta_form',
          kind: 'cta_form',
          mode: 'dynamic',
          settings: {
            title: 'What coverage is best for your ministry?',
          },
        }],
      },
    };

    const migrated = migrateInsuranceCoverageCtaState(base, { sourceState: state });
    const cta = migrated.state.blocksByPath[INSURANCE_PATH][0];

    expect(migrated.changed).toBe(true);
    expect(cta.settings.fieldsJson).toBe(fieldsJson);
    expect(cta.settings.draftOnlyValue).toBeUndefined();
    expect(migrateInsuranceCoverageCtaState(state).changed).toBe(false);
  });
});
