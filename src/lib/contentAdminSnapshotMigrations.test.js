import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { normalizeContentAdminState } from './contentAdminNormalization';
import {
  CGA_PATH,
  CGA_SECURE_ACT_CARD_MIGRATION_VERSION,
  INSURANCE_FEATURE_COLUMNS_MIGRATION_VERSION,
  ENDOWMENTS_PRESENTATION_MIGRATION_VERSION,
  ENDOWMENTS_PRESENTATION_PATH,
  MIF_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION,
  MIF_REQUEST_HEADLINE_COLOR_PATH,
  QCD_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION,
  QCD_REQUEST_HEADLINE_COLOR_PATH,
  INSURANCE_PC_RESOURCES_PATH,
  INSURANCE_PATH,
  GENEROSITY_FUND_PATH,
  GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
  SERVICES_MATTERS_PATH,
  SERVICES_MATTERS_BILLBOARD_MIGRATION_VERSION,
  SERVICES_DIRECTORY_PATH,
  SERVICES_DIRECTORY_MIGRATION_VERSION,
  SUPPORT_LIBRARY_PATH,
  SUPPORT_LIBRARY_BLOCK_MIGRATION_VERSION,
  migrateQcdCenteredCardGridBlock,
  migrateQcdCenteredCardGridState,
  migrateCgaSecureActCardState,
  migrateInsuranceCoverageCtaState,
  migrateInsuranceFeatureColumnsState,
  migrateInsuranceFeaturePanelToColumnsBlock,
  migrateInsurancePcResourceCardsBlock,
  migrateInsurancePcResourceCardsState,
  migratePlannedGivingStepsBlock,
  migrateNumberedStepCardsBlock,
  migrateNumberedStepCardsState,
  migrateSiteFeatureCollectionsBlock,
  migrateSiteFeatureCollectionsState,
  migrateServicesMattersBillboardBlock,
  migrateServicesMattersBillboardState,
  migrateServicesDirectoryBlock,
  migrateServicesDirectoryState,
  migrateGenerosityFundSnapshot,
  migrateSupportLibraryBlock,
  migrateSupportLibraryState,
  migrateEndowmentsPresentationState,
  migrateMifRequestHeadlineColorState,
  migrateQcdRequestHeadlineColorState,
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
  it('converts the Services breakdown into an editable services directory card grid', () => {
    const legacyBlock = {
      id: 'services_cards',
      name: 'Service Cards',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'services_breakdown',
        sectionClassName: 'services-native-grid-wrap services-breakdown-section',
      },
    };

    const migratedBlock = migrateServicesDirectoryBlock(SERVICES_DIRECTORY_PATH, legacyBlock);
    expect(migratedBlock).toMatchObject({
      id: 'services_cards',
      name: 'Services Directory',
      templateId: 'card_grid',
      presetId: 'services-directory',
      kind: 'card_grid',
      settings: {
        title: 'What would you like to explore?',
        cardCount: 5,
        card1Title: 'Loans',
        card1TitleLinkJson: JSON.stringify({ kind: 'internal', to: '/services/loans', openInNewWindow: false }),
        card5Title: 'Insurance',
      },
    });
    expect(JSON.parse(migratedBlock.settings.card2LinksJson)[0]).toMatchObject({
      label: 'Rates',
      link: { kind: 'internal', to: '/services/investments#rates' },
    });

    const migratedState = migrateServicesDirectoryState({
      blocksByPath: { [SERVICES_DIRECTORY_PATH]: [legacyBlock] },
    });
    expect(migratedState.changed).toBe(true);
    expect(migrateServicesDirectoryState(migratedState.state).changed).toBe(false);
    expect(SERVICES_DIRECTORY_MIGRATION_VERSION).toBe(1);
  });

  it('moves insurance Risk Management and Mission Assure into shared columns presets without losing authored content', () => {
    const risk = {
      id: 'risk_management',
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        title: 'Risk Management',
        titleHighlightsJson: '[{"text":"Risk","className":"is-melon"}]',
        bodyHtml: '<p>Focus on your ministry.</p>',
        imageUrl: '/risk.jpg',
        imageAlt: 'Risk guide',
        buttonLabel: 'Download the guide',
        buttonUrl: 'https://example.com/risk.pdf',
        buttonOpenInNewWindow: true,
        sectionClassName: 'insurance-native-risk',
      },
    };
    const mission = {
      id: 'mission_assure',
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        title: 'Full coverage for mission trips, retreats…',
        body: '…and everything in between.',
        imageUrl: '/mission.jpg',
        imageAlt: 'Mission Assure coverage',
        logoKey: 'mission-assure',
        buttonLabel: 'Let’s go',
        buttonUrl: '/services/insurance/mission-assure',
      },
    };

    const migratedRisk = migrateInsuranceFeaturePanelToColumnsBlock(INSURANCE_PATH, risk);
    const migratedMission = migrateInsuranceFeaturePanelToColumnsBlock(INSURANCE_PATH, mission);

    expect(migratedRisk).toMatchObject({
      id: 'risk_management',
      kind: 'columns',
      presetId: 'do-the-math',
      settings: {
        col1Title: 'Risk Management',
        col1TitleHighlightsJson: risk.settings.titleHighlightsJson,
        col1BodyHtml: risk.settings.bodyHtml,
        col2ImageUrl: risk.settings.imageUrl,
        col1ButtonUrl: risk.settings.buttonUrl,
        col1ButtonLinkJson: JSON.stringify({ kind: 'external', href: risk.settings.buttonUrl, openInNewWindow: true }),
        col1ButtonOpenInNewWindow: true,
      },
    });
    expect(migratedRisk.settings.sectionClassName).toBe('');
    expect(migratedMission).toMatchObject({
      id: 'mission_assure',
      kind: 'columns',
      presetId: 'housing-allowance',
      settings: {
        col1ImageUrl: mission.settings.imageUrl,
        col2Title: mission.settings.title,
        col2Body: mission.settings.body,
        col2ButtonUrl: mission.settings.buttonUrl,
        col2ButtonLinkJson: JSON.stringify({ kind: 'internal', to: mission.settings.buttonUrl, openInNewWindow: false }),
      },
    });
    expect(migratedMission.settings.logoKey).toBeUndefined();

    const migratedState = migrateInsuranceFeatureColumnsState({
      blocksByPath: { [INSURANCE_PATH]: [risk, mission] },
    });
    expect(migratedState.changed).toBe(true);
    expect(INSURANCE_FEATURE_COLUMNS_MIGRATION_VERSION).toBe(1);
    expect(migrateInsuranceFeatureColumnsState(migratedState.state).changed).toBe(false);
  });

  it('promotes the support block without changing its ID or payload', () => {
    const legacyBlock = {
      id: 'support',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Support for current clients',
        html: '<p>Call us.</p>',
        supportGroupsJson: JSON.stringify([{ title: 'Plan details', links: [{ label: 'Plan PDF', documentId: 'doc-1' }] }]),
        supportGroupsExpanded: true,
        supportGroupsCollapsible: false,
      },
    };
    const migratedBlock = migrateSupportLibraryBlock(SUPPORT_LIBRARY_PATH, legacyBlock);
    expect(migratedBlock).toEqual({ ...legacyBlock, kind: 'support_library' });
    expect(migrateSupportLibraryBlock('/test', legacyBlock)).toEqual(legacyBlock);
    expect(SUPPORT_LIBRARY_BLOCK_MIGRATION_VERSION).toBe(1);

    const migratedState = migrateSupportLibraryState({
      blocksByPath: { [SUPPORT_LIBRARY_PATH]: [legacyBlock] },
    });
    expect(migratedState.changed).toBe(true);
    expect(migratedState.state.blocksByPath[SUPPORT_LIBRARY_PATH][0]).toEqual(migratedBlock);
  });

  it('matches the Endowments billboard tracking and repairs only the legacy contact punctuation', () => {
    const state = {
      blocksByPath: {
        [ENDOWMENTS_PRESENTATION_PATH]: [
          {
            id: 'give_forever',
            kind: 'billboard',
            mode: 'dynamic',
            settings: { title: 'Give once, forever.', titleLetterSpacingEm: -0.035 },
          },
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: { title: "Let's get started" },
          },
          {
            id: 'custom',
            kind: 'content',
            mode: 'dynamic',
            settings: { title: 'Keep this custom content' },
          },
        ],
      },
    };

    const migrated = migrateEndowmentsPresentationState(state);
    const blocks = migrated.state.blocksByPath[ENDOWMENTS_PRESENTATION_PATH];

    expect(migrated.changed).toBe(true);
    expect(blocks.find((block) => block.id === 'give_forever').settings.titleLetterSpacingEm).toBe(-0.03);
    expect(blocks.find((block) => block.id === 'request_form').settings.title).toBe("Let's get started.");
    expect(blocks.find((block) => block.id === 'custom').settings.title).toBe('Keep this custom content');
    expect(ENDOWMENTS_PRESENTATION_MIGRATION_VERSION).toBe(1);
  });

  it('adds white highlights to the legacy MIF request headline without touching custom headlines', () => {
    const state = {
      blocksByPath: {
        [MIF_REQUEST_HEADLINE_COLOR_PATH]: [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Ministry support. Unlocked and expanded.',
              titleHighlightsJson: '',
            },
          },
          {
            id: 'other',
            kind: 'request_form',
            mode: 'dynamic',
            settings: { title: 'Custom headline', titleHighlightsJson: '' },
          },
        ],
      },
    };

    const migrated = migrateMifRequestHeadlineColorState(state);
    const blocks = migrated.state.blocksByPath[MIF_REQUEST_HEADLINE_COLOR_PATH];

    expect(migrated.changed).toBe(true);
    expect(blocks[0].settings.titleHighlightsJson).toContain('Unlocked');
    expect(blocks[0].settings.titleHighlightsJson).toContain('expanded');
    expect(blocks[1].settings.titleHighlightsJson).toBe('');
    expect(MIF_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION).toBe(1);
  });

  it('adds a white highlight to the legacy QCD request headline without touching custom headlines', () => {
    const state = {
      blocksByPath: {
        [QCD_REQUEST_HEADLINE_COLOR_PATH]: [
          {
            id: 'request_form',
            kind: 'request_form',
            settings: {
              title: 'Your IRA. Their gain.',
              titleHighlightsJson: '',
            },
          },
          {
            id: 'custom-request',
            kind: 'request_form',
            settings: {
              title: 'Your IRA. Their gain.',
              titleHighlightsJson: '[{"text":"IRA","className":"is-atlantean"}]',
            },
          },
        ],
      },
    };

    const migrated = migrateQcdRequestHeadlineColorState(state);
    const blocks = migrated.state.blocksByPath[QCD_REQUEST_HEADLINE_COLOR_PATH];

    expect(migrated.changed).toBe(true);
    expect(blocks[0].settings.titleHighlightsJson).toContain('gain');
    expect(blocks[1].settings.titleHighlightsJson).toContain('is-atlantean');
    expect(QCD_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION).toBe(1);
  });

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

  it('adds numbered step-card preset metadata without changing authored content', () => {
    const block = {
      id: 'enroll_steps',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'default',
      settings: {
        sectionClassName: 'ministers-group-life-native-enroll',
        card1Title: '01',
        card1Body: 'Exact authored copy',
        card1ButtonLabel: 'Keep this button',
      },
    };
    const migrated = migrateNumberedStepCardsBlock('/services/insurance/ministers-group-life-plan', block);

    expect(migrated).toEqual({ ...block, presetId: 'step-cards' });
    expect(migrated.settings).toEqual(block.settings);
    expect(migrateNumberedStepCardsBlock('/test', {
      ...block,
      settings: { ...block.settings, sectionClassName: 'unrelated-section' },
    })).toEqual({
      ...block,
      settings: { ...block.settings, sectionClassName: 'unrelated-section' },
    });
  });

  it('converts the Services matters feature into a shared billboard block', () => {
    const legacyBlock = {
      id: 'matters_band',
      name: 'What You Do Matters',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'services_matters_band',
        body: 'As an AGFinancial customer, your financial decisions fund real ministry work, transforming lives, including yours.',
        buttonLabel: "See what we're doing together",
        buttonLinkJson: JSON.stringify({ kind: 'internal', to: '/about-us/impact', openInNewWindow: false }),
        sectionClassName: 'services-native-matters',
      },
    };

    const migratedBlock = migrateServicesMattersBillboardBlock(SERVICES_MATTERS_PATH, legacyBlock);
    expect(migratedBlock).toMatchObject({
      name: 'What You Do Matters Billboard',
      kind: 'billboard',
      templateId: 'billboard',
      presetId: 'default',
      settings: {
        title: 'What you do matters.',
        bodyHtml: '<p>As an AGFinancial customer, your financial decisions fund real ministry work, transforming lives, including yours.</p>',
        body: '',
        buttonPageRef: '/about-us/impact',
        sectionClassName: 'services-native-matters',
      },
    });
    expect(migratedBlock.settings.featureId).toBeUndefined();
    expect(migratedBlock.settings.buttonLinkJson).toBeUndefined();

    const migratedState = migrateServicesMattersBillboardState({
      blocksByPath: { [SERVICES_MATTERS_PATH]: [legacyBlock] },
    });
    expect(migratedState.changed).toBe(true);
    expect(migratedState.state.blocksByPath[SERVICES_MATTERS_PATH][0].kind).toBe('billboard');
    expect(SERVICES_MATTERS_BILLBOARD_MIGRATION_VERSION).toBe(1);
  });

  it('exposes repeatable site-feature copy without overwriting existing admin fields', () => {
    const legacyBlock = {
      id: 'impact_proof_story',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'impact_proof_story',
        featureIntroJson: JSON.stringify({
          heading: 'Existing heading',
          body: 'Existing body',
          emphasis: 'Existing emphasis',
        }),
      },
    };
    const migrated = migrateSiteFeatureCollectionsBlock(legacyBlock);
    const metrics = JSON.parse(migrated.settings.metricsJson);

    expect(metrics).toHaveLength(4);
    expect(metrics[1]).toMatchObject({
      value: '$450 million',
      eyebrow: 'Planned Giving',
      buttonLabel: 'Plan with us',
      tone: 'mango',
    });
    expect(migrated.settings).toMatchObject({
      introHeading: 'Existing heading',
      introBody: 'Existing body',
      introEmphasis: 'Existing emphasis',
    });

    const edited = migrateSiteFeatureCollectionsBlock({
      ...legacyBlock,
      settings: {
        ...legacyBlock.settings,
        metricsJson: JSON.stringify([{ value: 'Edited value', label: 'Edited label' }]),
        introHeading: 'Admin heading',
      },
    });
    expect(JSON.parse(edited.settings.metricsJson)).toEqual([{ value: 'Edited value', label: 'Edited label' }]);
    expect(edited.settings.introHeading).toBe('Admin heading');
  });

  it('migrates all repeatable feature collections across state without touching navigation features', () => {
    const state = {
      blocksByPath: {
        '/': [{ id: 'feature', kind: 'site_feature', mode: 'dynamic', settings: { featureId: 'home_services_feature_animation' } }],
        '/services': [{ id: 'feature', kind: 'site_feature', mode: 'dynamic', settings: { featureId: 'services_breakdown' } }],
      },
    };
    const migrated = migrateSiteFeatureCollectionsState(state);
    expect(migrated.changed).toBe(true);
    expect(migrated.state.blocksByPath['/'][0].settings.panelsJson).toBeTruthy();
    expect(migrated.state.blocksByPath['/services'][0]).toEqual(state.blocksByPath['/services'][0]);
  });

  it('migrates active and base numbered-card metadata without touching other blocks', () => {
    const state = {
      blocksByPath: {
        '/services/insurance/ministers-group-life-plan': [{
          id: 'enroll_steps',
          kind: 'card_grid',
          mode: 'dynamic',
          presetId: 'default',
          settings: { sectionClassName: 'ministers-group-life-native-enroll', card1Body: 'Keep' },
        }],
        '/test': [{ id: 'copy', kind: 'content', mode: 'dynamic', settings: { body: 'Keep' } }],
      },
    };
    const migrated = migrateNumberedStepCardsState(state);

    expect(migrated.changed).toBe(true);
    expect(migrated.state.blocksByPath['/services/insurance/ministers-group-life-plan'][0].presetId)
      .toBe('step-cards');
    expect(migrated.state.blocksByPath['/services/insurance/ministers-group-life-plan'][0].settings.card1Body)
      .toBe('Keep');
    expect(migrated.state.blocksByPath['/test']).toEqual(state.blocksByPath['/test']);
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
