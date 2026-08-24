import { describe, expect, it } from 'vitest';
import {
  getContentAdminMigrationAdapterInventory,
  normalizeStoredConfig,
} from './ContentAdminContext';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
} from '../lib/managedPageShells';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { parseCtaFormFieldsJson } from '../blocks/foundation/forms';
import { parseLinkValueJson } from '../lib/linkValue';
import { migrateGenerosityFundSnapshot } from '../lib/contentAdminSnapshotMigrations';

const TARGET_BRIDGE_SETTING_KEYS = [
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
];

function expectNoTargetBridgeSettings(block, label = block?.id || 'block') {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
  const presentKeys = TARGET_BRIDGE_SETTING_KEYS.filter((key) => (
    Object.prototype.hasOwnProperty.call(settings, key)
  ));

  expect(presentKeys, `${label} should not carry target bridge settings`).toEqual([]);
}

function getCtaFields(block) {
  return parseCtaFormFieldsJson(block?.settings?.fieldsJson);
}

function expectLinkJson(settings, fieldId, expectedLink) {
  expect(parseLinkValueJson(settings?.[fieldId])).toEqual(expect.objectContaining(expectedLink));
}

function expectNoSplitSettings(settings, fieldIds) {
  fieldIds.forEach((fieldId) => {
    expect(Object.prototype.hasOwnProperty.call(settings || {}, fieldId), `${fieldId} should be stripped`).toBe(false);
  });
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

describe('ContentAdminContext state normalization', () => {
  it('keeps migration adapters named with path scopes and retirement criteria', () => {
    const inventory = getContentAdminMigrationAdapterInventory();

    expect(inventory.map((entry) => entry.id)).toEqual([
      'managed-path-aliases',
      'block-only-page-inventory-reconciliation',
      'generosity-fund-donor-advised-fund-refresh',
      'retirement-403b-snapshot-repairs',
      'planned-giving-retired-static-comparison',
      'qcd-centered-card-grid',
      'online-contributions-step-cards',
      'numbered-step-cards-preset-metadata',
      'site-feature-repeatable-content-fields',
      'support-library-block-kind',
      'insurance-coverage-cta-fields',
      'insurance-feature-columns',
      'insurance-pc-resource-card-lists',
      'retirement-ira-block-shape',
      'loans-dynamic-block-upgrade',
      'property-casualty-request-repair',
      'target-bridge-snapshot-cleanup',
      'split-link-compatibility',
      'cta-form-slot-compatibility',
      'cga-secure-act-content-compatibility',
      'cga-secure-act-card',
    ]);

    inventory.forEach((entry) => {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.paths.length, `${entry.id} paths`).toBeGreaterThan(0);
      if (entry.status === 'retired') {
        expect(entry.retirementReceipt).toMatch(/^docs\//);
        expect(entry.helpers).toEqual([]);
      } else {
        expect(entry.helpers.length, `${entry.id} helpers`).toBeGreaterThan(0);
      }
      expect(entry.retireWhen, `${entry.id} retirement criteria`).toMatch(/\w/);
    });

    expect(inventory.find((entry) => entry.id === 'loans-dynamic-block-upgrade')).toEqual(expect.objectContaining({
      status: 'retired',
      helpers: [],
      retirementReceipt: 'docs/content-admin-adapter-retirements/loans-dynamic-block-upgrade.json',
    }));
  });

  it('removes unsupported retired static loans blocks during normalization', () => {
    const legacyBlock = {
      id: 'request_form',
      kind: 'retired_request_form',
      mode: 'static',
      settings: {},
      editableFields: [],
    };
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [legacyBlock],
      },
    });

    expect(normalized.blocksByPath['/services/loans']).toEqual([]);
  });

  it('preserves unsupported IRA daily billboard legacy settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/iras': [
          {
            id: 'daily_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Retire a little every day.',
              bodyHtml: '<h3>Starting now.</h3>',
              justify: 'right',
              contentMaxWidthPx: 1216,
              sectionClassName: '',
            },
          },
        ],
      },
    });

    const dailyBillboard = (normalized.blocksByPath['/services/retirement/iras'] || [])
      .find((block) => block?.id === 'daily_billboard');

    expect(dailyBillboard?.settings).toMatchObject({
      justify: 'right',
      contentMaxWidthPx: 1216,
      sectionClassName: '',
    });
  });

  it('omits blockless functional routes from normalized block state', () => {
    const staleBlocksByPath = Array.from(BLOCKLESS_MANAGED_PAGE_PATHS).reduce((next, pathname) => {
      next[pathname] = [
        {
          id: 'page_content',
          kind: 'content',
          mode: 'dynamic',
          settings: { html: '<p>Stale functional route fallback</p>' },
        },
      ];
      return next;
    }, {});

    const normalized = normalizeStoredConfig({ blocksByPath: staleBlocksByPath });

    Array.from(BLOCKLESS_MANAGED_PAGE_PATHS).forEach((pathname) => {
      expect(normalized.blocksByPath).not.toHaveProperty(pathname);
    });
  });

  it('does not use target-section bridge keys during block-only normalization', () => {
    const staleBlocksByPath = Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).reduce((next, pathname) => {
      next[pathname] = [
        {
          id: 'stale_bridge_block',
          kind: 'billboard',
          mode: 'dynamic',
          settings: {
            title: `Legacy bridge for ${pathname}`,
            targetSectionKey: 'class:legacy-native-section',
            targetSectionClassName: 'legacy-native-section',
            targetSectionIndex: 9,
          },
        },
      ];
      return next;
    }, {});

    const normalized = normalizeStoredConfig({ blocksByPath: staleBlocksByPath });

    Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
      const blocks = normalized.blocksByPath[pathname] || [];

      expect(blocks.some((block) => block?.id === 'page_content'), pathname).toBe(false);
      const staleBlock = blocks.find((block) => block?.id === 'stale_bridge_block');
      expect(staleBlock?.settings?.targetSectionKey, pathname)
        .toBe('class:legacy-native-section');
    });
  });

  it('keeps normalized block-only managed pages free of page-content and target-section metadata', () => {
    const normalized = normalizeStoredConfig({});

    Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
      const blocks = normalized.blocksByPath[pathname] || [];

      expect(blocks.some((block) => block?.id === 'page_content'), pathname).toBe(false);
      blocks.forEach((block) => expectNoTargetBridgeSettings(block, `${pathname} ${block?.id}`));
    });
  });

  it('upgrades stale static records on block-only managed pages to the current dynamic block contract', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'static',
            settings: {
              line1Text: 'Property and casualty',
            },
            editableFields: [],
          },
          {
            id: 'intro',
            kind: 'intro',
            mode: 'static',
            settings: {},
            editableFields: [],
          },
        ],
        '/services/retirement/403b/403b-terms-definitions': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'static',
            settings: {
              line1Text: 'Terms and definitions',
            },
            editableFields: [],
          },
        ],
      },
    });

    [
      ['/services/insurance/property-casualty-insurance', 'hero'],
      ['/services/insurance/property-casualty-insurance', 'intro'],
      ['/services/retirement/403b/403b-terms-definitions', 'hero'],
    ].forEach(([pathname, blockId]) => {
      const block = (normalized.blocksByPath[pathname] || [])
        .find((candidate) => candidate?.id === blockId);

      expect(block?.mode, `${pathname} ${blockId}`).toBe('dynamic');
      expect(Array.isArray(block?.editableFields) ? block.editableFields.length : 0, `${pathname} ${blockId}`).toBeGreaterThan(0);
    });
  });

  it('reconciles block-only managed pages from block blueprints instead of page render expectations', () => {
    const staleBlocksByPath = {
      '/calculators': [
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: { line1Text: 'Calculators' },
          editableFields: [],
        },
        {
          id: 'cta_form',
          name: 'CTA Form',
          kind: 'cta_form',
          mode: 'dynamic',
          settings: { title: 'Stored calculator CTA' },
          editableFields: [],
        },
      ],
      '/services/retirement/iras/fund-an-ira': [
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: { line1Text: 'Fund an IRA' },
          editableFields: [],
        },
        {
          id: 'fund_ira_widget',
          name: 'Fund an IRA Widget',
          kind: 'content',
          mode: 'dynamic',
          settings: { widget: 'retirement-fund-ira' },
          editableFields: [],
        },
      ],
    };

    const normalized = normalizeStoredConfig({ blocksByPath: staleBlocksByPath });

    Object.keys(staleBlocksByPath).forEach((pathname) => {
      const normalizedBlocks = normalized.blocksByPath[pathname] || [];
      const blueprintBlocks = contentBlockBlueprintsByPath[pathname] || [];

      expect(normalizedBlocks.map((block) => block?.id)).toEqual(blueprintBlocks.map((block) => block?.id));
      expect(normalizedBlocks.some((block) => block?.id === 'hero' || block?.kind === 'hero'), pathname).toBe(false);
      expect(normalizedBlocks[0]?.id, pathname).toBe('utility_header');
      expect(normalizedBlocks[0]?.mode, pathname).toBe('dynamic');
      expect(normalizedBlocks[0]?.settings?.sectionClassName, pathname).toContain('native-functional-page-head--utility');
    });
  });

  it('upgrades retired image-only columns bridges to current page-content image blocks before render', () => {
    const aboutBlocks = cloneJson(contentBlockBlueprintsByPath['/about-us'] || []);
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/about-us': aboutBlocks.map((block) => {
          if (block?.id !== 'building_shot') {
            return block;
          }

          return {
            ...block,
            kind: 'columns',
            settings: {
              sectionClassName: 'about-native-building-shot',
              contentWidth: 'browser',
              col1ImageUrl: '/src/assets/about-intro.jpg',
              col1ImageAlt: 'AGFinancial office building',
            },
            editableFields: [],
          };
        }),
      },
    });
    const buildingShotBlock = (normalized.blocksByPath['/about-us'] || [])
      .find((block) => block?.id === 'building_shot');

    expect(buildingShotBlock).toMatchObject({
      id: 'building_shot',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        logoImage: '/src/assets/about-intro.jpg',
        logoAlt: 'AGFinancial office building',
        sectionClassName: 'about-native-building-shot',
        railClassName: 'native-info-viewport-bleed',
      },
    });
    expect(Array.isArray(buildingShotBlock?.editableFields) ? buildingShotBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('treats saved managed route block arrays as authoritative after starter seeding', () => {
    const seedState = normalizeStoredConfig(null);
    const pathname = '/about-us';
    const seededBlocks = cloneJson(seedState.blocksByPath[pathname] || []);
    const withoutIntro = seededBlocks.filter((block) => block?.id !== 'intro');
    const withoutCta = seededBlocks.filter((block) => block?.id !== 'cta_form');
    const reordered = [
      ...seededBlocks.slice(2, 4),
      ...seededBlocks.slice(0, 2),
      ...seededBlocks.slice(4),
    ];

    const normalizedWithoutIntro = normalizeStoredConfig({
      pageHierarchy: seedState.pageHierarchy,
      blocksByPath: {
        [pathname]: withoutIntro,
      },
    });
    const normalizedWithoutCta = normalizeStoredConfig({
      pageHierarchy: seedState.pageHierarchy,
      blocksByPath: {
        [pathname]: withoutCta,
      },
    });
    const normalizedReordered = normalizeStoredConfig({
      pageHierarchy: seedState.pageHierarchy,
      blocksByPath: {
        [pathname]: reordered,
      },
    });

    expect(seededBlocks.some((block) => block?.id === 'intro')).toBe(true);
    expect(seededBlocks.some((block) => block?.id === 'cta_form')).toBe(true);
    expect(normalizedWithoutIntro.blocksByPath[pathname].map((block) => block.id)).toEqual(withoutIntro.map((block) => block.id));
    expect(normalizedWithoutIntro.blocksByPath[pathname].some((block) => block?.id === 'intro')).toBe(false);
    expect(normalizedWithoutCta.blocksByPath[pathname].map((block) => block.id)).toEqual(withoutCta.map((block) => block.id));
    expect(normalizedWithoutCta.blocksByPath[pathname].some((block) => block?.id === 'cta_form')).toBe(false);
    expect(normalizedReordered.blocksByPath[pathname].map((block) => block.id)).toEqual(reordered.map((block) => block.id));
  });

  it('does not replace an admin-chosen block kind just because it reuses a starter block id', () => {
    const seedState = normalizeStoredConfig(null);
    const pathname = '/about-us';
    const replacementIntro = {
      id: 'intro',
      name: 'Admin replacement billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Admin-owned replacement',
      },
      editableFields: [],
    };

    const normalized = normalizeStoredConfig({
      pageHierarchy: seedState.pageHierarchy,
      blocksByPath: {
        [pathname]: [
          replacementIntro,
          ...cloneJson(seedState.blocksByPath[pathname] || []).filter((block) => block?.id !== 'intro'),
        ],
      },
    });

    expect(normalized.blocksByPath[pathname][0]).toMatchObject({
      id: 'intro',
      kind: 'billboard',
      settings: {
        title: 'Admin-owned replacement',
      },
    });
  });

  it('backfills promoted 403(b) section class hooks on stored blocks that still use shared retirement-child classes', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'who_qualifies',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'retirement-child-native-qualify',
            },
          },
          {
            id: 'start_enrollment',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'retirement-child-native-enroll',
            },
          },
          {
            id: 'contribution_limits',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'retirement-child-native-table',
            },
          },
          {
            id: 'rollover_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'retirement-child-native-rollover',
            },
          },
        ],
      },
    });

    const blocksById = new Map((normalized.blocksByPath['/services/retirement/403b'] || []).map((block) => [block?.id, block]));

    expect(blocksById.get('who_qualifies')?.settings?.sectionClassName).toContain('retirement-403b-native-qualify');
    expect(blocksById.get('start_enrollment')?.settings?.sectionClassName).toContain('retirement-403b-native-enroll');
    expect(blocksById.get('contribution_limits')?.settings?.sectionClassName).toContain('retirement-403b-native-contribution-limits');
    expect(blocksById.get('rollover_billboard')?.settings?.sectionClassName).toContain('retirement-403b-native-rollover');
    expect(blocksById.get('rollover_billboard')?.settings?.sectionClassName).toContain('retirement-everyday');
    expect(blocksById.get('rollover_billboard')?.settings?.sectionClassName).toContain('retirement-rollover-billboard');
  });

  it('does not silently drop stale standalone 403(b) strategy enroll CTAs from arbitrary stored snapshots', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<div class="ret403b-strategy-feature"></div>',
              sectionClassName: 'retirement-403b-native-strategy-feature',
            },
          },
          {
            id: 'strategy_enroll_cta',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'retirement-403b-native-strategy-enroll-cta',
              buttonLabel: 'Enroll now',
              buttonPageRef: '/services/retirement/403b/403b-individual-enrollment',
            },
          },
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<div class="retirement-403b-loan-copy"><h2>403(b) Plan Loans</h2></div>',
              sectionClassName: 'retirement-403b-native-loans',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b'] || [];

    expect(blocks.some((block) => block?.id === 'strategy_enroll_cta')).toBe(true);
    expect(blocks.some((block) => block?.id === 'investment_strategy_options')).toBe(true);
    expect(blocks.some((block) => block?.id === 'loan_details')).toBe(true);
  });

  it('leaves clean current 403(b) snapshots unchanged by legacy ghost rescue branches', () => {
    const canonicalBlocks = normalizeStoredConfig({}).blocksByPath['/services/retirement/403b'] || [];
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': cloneJson(canonicalBlocks),
      },
    });
    const normalizedBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const canonicalLoanDetails = canonicalBlocks.find((block) => block?.id === 'loan_details');
    const normalizedLoanDetails = normalizedBlocks.find((block) => block?.id === 'loan_details');
    const canonicalHousingFeature = canonicalBlocks.find((block) => block?.id === 'housing_feature');
    const normalizedHousingFeature = normalizedBlocks.find((block) => block?.id === 'housing_feature');

    expect(normalizedBlocks.map((block) => block?.id)).toEqual(canonicalBlocks.map((block) => block?.id));
    expect(normalizedBlocks.some((block) => block?.id === 'strategy_enroll_cta')).toBe(false);
    expect(normalizedLoanDetails?.settings?.title || '').toBe(canonicalLoanDetails?.settings?.title || '');
    expect(normalizedLoanDetails?.settings?.body || '').toBe(canonicalLoanDetails?.settings?.body || '');
    expect(normalizedLoanDetails?.settings?.buttonLabel || '').toBe(canonicalLoanDetails?.settings?.buttonLabel || '');
    expect(normalizedLoanDetails?.settings?.buttonLinkJson || '').toBe(canonicalLoanDetails?.settings?.buttonLinkJson || '');
    expect(normalizedLoanDetails?.settings?.anchorId || '').toBe(canonicalLoanDetails?.settings?.anchorId || '');
    expect(normalizedHousingFeature?.settings?.col2BodyHtml).toBe(canonicalHousingFeature?.settings?.col2BodyHtml);
    expect(normalizedHousingFeature?.settings?.col2BodyHtml).not.toContain('ret403b-housing-feature-bullet-intro');
  });

  it('keeps the canonical home do-the-math billboard on the dynamic managed path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'home_do_the_math',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '(let us) Do the math.',
              body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
              buttonLabel: 'Use the calculators',
              buttonUrl: '/calculators',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const mathBlocks = homeBlocks.filter((block) => block?.id === 'home_do_the_math');

    expect(mathBlocks).toHaveLength(1);
    expect(mathBlocks[0]?.mode).toBe('dynamic');
    expect(mathBlocks[0]?.kind).toBe('billboard');
    expect(mathBlocks[0]?.settings?.title).toBe('(let us) Do the math.');
    expect(mathBlocks[0]?.settings?.buttonLabel).toBe('Use the calculators');
  });

  it('seeds the home managed billboard blocks on the dynamic canonical path by default', () => {
    const normalized = normalizeStoredConfig({});
    const homeBlocks = normalized.blocksByPath['/'] || [];
    const columnsMhaBlock = homeBlocks.find((block) => block?.id === 'home_ministry_allies');
    const columnsMathBlock = homeBlocks.find((block) => block?.id === 'home_do_the_math');

    expect(columnsMhaBlock).toBeTruthy();
    expect(columnsMhaBlock?.mode).toBe('dynamic');
    expect(columnsMhaBlock?.kind).toBe('billboard');
    expect(Array.isArray(columnsMhaBlock?.editableFields) ? columnsMhaBlock.editableFields.length : 0).toBeGreaterThan(0);

    expect(columnsMathBlock).toBeTruthy();
    expect(columnsMathBlock?.mode).toBe('dynamic');
    expect(columnsMathBlock?.kind).toBe('billboard');
    expect(Array.isArray(columnsMathBlock?.editableFields) ? columnsMathBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades legacy loans placeholder blocks to dynamic defaults', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'Your vision.',
              line2Text: 'Our purpose.',
            },
            editableFields: [{ id: 'line1Text', label: 'Line 1', type: 'text' }],
          },
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
            },
            editableFields: [{ id: 'heading', label: 'Heading', type: 'text' }],
          },
          { id: 'request_form', kind: 'request_form', mode: 'static', settings: {}, editableFields: [] },
          { id: 'value_cards', kind: 'columns', mode: 'static', settings: {}, editableFields: [] },
          { id: 'vision_fuel', kind: 'billboard', mode: 'static', settings: {}, editableFields: [] },
          { id: 'cta_form', kind: 'cta_form', mode: 'static', settings: {}, editableFields: [] },
          { id: 'testimonials', kind: 'testimonials', mode: 'static', settings: {}, editableFields: [] },
        ],
      },
    });

    const loansBlocks = normalized.blocksByPath['/services/loans'] || [];
    const modeById = new Map(loansBlocks.map((block) => [block?.id, block?.mode]));

    expect(modeById.get('hero')).toBe('dynamic');
    expect(modeById.get('intro')).toBe('dynamic');
    expect(modeById.get('request_form')).toBe('dynamic');
    expect(modeById.get('value_cards')).toBe('dynamic');
    expect(modeById.get('vision_fuel')).toBe('dynamic');
    expect(modeById.get('cta_form')).toBe('dynamic');
    expect(modeById.get('testimonials')).toBe('dynamic');
  });

  it('seeds planned giving with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const legacyGivingBlocks = normalized.blocksByPath['/services/planned-giving'] || [];
    const requestBlock = legacyGivingBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = legacyGivingBlocks.find((block) => block?.kind === 'cta_form');

    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock.mode).toBe('dynamic');
    expect(ctaBlock.settings.sectionClassName).toBe('legacy-giving-cta');
    expect(ctaBlock.settings.targetSectionClassName).toBeUndefined();
    expect(ctaBlock.settings.fineprint).toBe('* fields required');
    const fields = getCtaFields(ctaBlock);
    expect(fields.find((field) => field.id === 'name')).toMatchObject({
      label: 'Name*',
      type: 'text',
      required: true,
    });
    expect(fields.find((field) => field.id === 'phone')).toMatchObject({
      label: 'Phone*',
      type: 'tel',
      required: true,
    });
    expect(fields.find((field) => field.id === 'contact_preference')).toMatchObject({
      label: 'Contact preference',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
      ],
    });
    const productField = fields.find((field) => field.id === 'legacyproduct');
    expect(productField).toMatchObject({
      label: 'Planned giving product of interest*',
      type: 'select',
      required: true,
    });
    expect(productField?.options).toContainEqual({ value: 'not-sure', label: "I'm not sure." });
    expect(fields.find((field) => field.id === 'message')).toMatchObject({ label: 'Message', type: 'textarea' });
  });

  it('repairs stale planned-giving CTA drafts missing required fields and product options', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'We help every step of the way. Always.',
              sectionClassName: 'legacy-giving-cta',
              fieldsJson: JSON.stringify([
                { id: 'name', label: 'Name', type: 'text' },
                { id: 'phone', label: 'Phone', type: 'tel' },
                {
                  id: 'legacyProduct',
                  label: 'Planned giving product of interest*',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'donor-advised-fund', label: 'Donor Advised Fund' },
                    { value: 'ministry-impact-fund', label: 'Ministry Impact Fund' },
                  ],
                },
              ]),
            },
          },
        ],
      },
    });
    const ctaBlock = (normalized.blocksByPath['/services/planned-giving'] || [])
      .find((block) => block?.id === 'cta_form');
    const fields = getCtaFields(ctaBlock);

    expect(ctaBlock?.settings?.fineprint).toBe('* fields required');
    expect(fields.find((field) => field.id === 'name')).toMatchObject({ label: 'Name*', required: true });
    expect(fields.find((field) => field.id === 'phone')).toMatchObject({ label: 'Phone*', required: true });
    expect(fields.find((field) => field.id === 'contact_preference')).toMatchObject({
      label: 'Contact preference',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
      ],
    });
    expect(fields.find((field) => field.id === 'legacyproduct')?.options)
      .toContainEqual({ value: 'not-sure', label: "I'm not sure." });
  });

  it('hydrates HTML-backed intro seeds with full body content before any admin edits', () => {
    const introBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/iras'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.mode).toBe('dynamic');
    expect(introBlock?.settings?.heading).toBe('Take that, taxes.');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Tax advantages and a broad range of investment options can anchor your retirement savings. Whether you’re starting a nest egg or adding to existing plans, an IRA may be the perfect fit for your needs and goals.</p>');
    expect(introBlock?.settings?.body).toBe('Tax advantages and a broad range of investment options can anchor your retirement savings. Whether you’re starting a nest egg or adding to existing plans, an IRA may be the perfect fit for your needs and goals.');
  });

  it('backfills stored intro body text from seeded HTML during initial admin hydration', () => {
    const defaultIntroBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/iras'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/iras': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              ...defaultIntroBlock?.settings,
              body: '',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/iras'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.settings?.bodyHtml).toBe(defaultIntroBlock?.settings?.bodyHtml);
    expect(introBlock?.settings?.body).toBe(defaultIntroBlock?.settings?.body);
  });

  it('preserves unsupported IRA comparison-table legacy settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/iras': [
          {
            id: 'comparison_table',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              tableHeadersJson: ['Key difference', 'Traditional IRA', 'Roth IRA'],
              tableRowsJson: [
                ['Eligibility', 'Must have earned income.', 'Must meet Roth IRA limits.'],
              ],
            },
          },
        ],
      },
    });
    const comparisonBlock = (normalized.blocksByPath['/services/retirement/iras'] || [])
      .find((block) => block?.id === 'comparison_table');

    expect(comparisonBlock?.settings?.tableHeadersJson).toEqual(['Key difference', 'Traditional IRA', 'Roth IRA']);
    expect(comparisonBlock?.settings?.tableRowsJson).toEqual([
      ['Eligibility', 'Must have earned income.', 'Must meet Roth IRA limits.'],
    ]);
  });

  it('seeds property and casualty with standalone managed blocks', () => {
    const blocks = normalizeStoredConfig({}).blocksByPath['/services/insurance/property-casualty-insurance'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const requestBlock = blocks.find((block) => block?.id === 'request_form');
    const agProgramBlock = blocks.find((block) => block?.id === 'ag_program');
    const resourcesBlock = blocks.find((block) => block?.id === 'resources');
    const safeBlock = blocks.find((block) => block?.id === 'safe_sound');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.settings?.line1Text).toBe('Property');
    expect(heroBlock?.settings?.line2Text).toBe('& Casualty');
    expect(heroBlock?.settings?.line1HighlightsJson).toContain('is-atlantean');
    expect(heroBlock?.settings?.line2HighlightsJson).toContain('is-mango');

    expect(introBlock).toBeTruthy();
    expect(introBlock?.settings?.bodyHtml).toContain('You focus on people.');
    expect(introBlock?.settings?.bgTone).toBe('grey');
    expect(introBlock?.settings?.textTone).toBe('white');
    expect(introBlock?.settings?.button1Label).toBe('More about AG Insurance');
    expectLinkJson(introBlock?.settings, 'button1LinkJson', {
      kind: 'internal',
      to: '/services/insurance/property-casualty-insurance#ag-program',
    });
    expect(requestBlock?.settings?.sectionClassName).toBe('insurance-pc-native-quote');
    expectNoTargetBridgeSettings(requestBlock);
    expect(agProgramBlock?.settings?.sectionClassName).toBe('insurance-pc-native-ag-program');
    expect(resourcesBlock?.settings?.sectionClassName).toBe('insurance-pc-native-resources');
    expect(safeBlock?.settings?.titleHighlightsJson).toContain('Safe & sound');
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
  });

  it('preserves unsupported property and casualty intro settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: '',
              body: 'You focus on people. We\'ll handle the protection-powered confidence to keep your ministry safe and sound. Additionally, our AG Insurance Program with Church Mutual Insurance offers some nice extras for Assemblies of God churches.',
              bodyHtml: '<p>You focus on people. We\'ll handle the protection-powered confidence to keep your ministry safe and sound. Additionally, our <strong>AG Insurance Program</strong> with Church Mutual Insurance offers some nice extras for Assemblies of God churches.</p>',
              bgTone: 'white',
              textTone: 'dark',
              button1Label: 'Jump to the AG program',
              button1PageRef: '/services/insurance/property-casualty-insurance#ag-program',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/insurance/property-casualty-insurance'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.settings?.bgTone).toBe('white');
    expect(introBlock?.settings?.textTone).toBe('dark');
    expect(introBlock?.settings?.button1Label).toBe('Jump to the AG program');
  });

  it('drops stale legacy-giving request-form blocks without restoring a missing CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old request block',
            },
          },
        ],
      },
    });

    const legacyGivingBlocks = normalized.blocksByPath['/services/planned-giving'] || [];
    expect(legacyGivingBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(legacyGivingBlocks.some((block) => block?.kind === 'cta_form')).toBe(false);
  });

  it('preserves unsupported planned giving comparison shapes during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving': [
          {
            id: 'comparison_table',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              widget: 'charitable-giving-table',
              anchorId: 'charitable-giving-plan-comparison',
              sectionClassName: 'legacy-giving-comparison',
            },
          },
          {
            id: 'comparison_matrix',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              widget: 'giving-comparison-matrix',
              sectionClassName: 'legacy-giving-comparison-matrix',
            },
          },
        ],
      },
      collaborationByPath: {
        '/services/planned-giving': {
          blocks: {
            comparison_matrix: {
              draftedBy: { userId: 'dev-old' },
            },
            comparison_table: {
              draftedBy: { userId: 'dev-current' },
            },
          },
          history: [
            {
              id: '1710000000000-matrix',
              action: 'block-draft-saved',
              blockId: 'comparison_matrix',
              actor: { userId: 'dev-old', displayName: 'Old Admin' },
              createdAt: 1710000000000,
            },
            {
              id: '1710000000001-table',
              action: 'block-draft-saved',
              blockId: 'comparison_table',
              actor: { userId: 'dev-current', displayName: 'Current Admin' },
              createdAt: 1710000000001,
            },
          ],
        },
      },
    });

    const legacyGivingBlocks = normalized.blocksByPath['/services/planned-giving'] || [];

    expect(legacyGivingBlocks.map((block) => block?.id)).toEqual(['comparison_table', 'comparison_matrix']);
    expect(legacyGivingBlocks.find((block) => block?.id === 'comparison_table')?.settings?.widget).toBe('charitable-giving-table');
    expect(legacyGivingBlocks.find((block) => block?.id === 'comparison_matrix')?.settings?.widget).toBe('giving-comparison-matrix');
    expect(normalized.collaborationByPath['/services/planned-giving']?.blocks?.comparison_matrix).toBeTruthy();
    expect(normalized.collaborationByPath['/services/planned-giving']?.blocks?.comparison_table).toBeTruthy();
    expect(normalized.collaborationByPath['/services/planned-giving']?.history).toHaveLength(2);
  });

  it('drops duplicate endowments request-form blocks and keeps the canonical legacy-form section class', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/endowments': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Maybe this is an interest or inquiry form.',
            },
          },
          {
            id: 'request_form_legacy_child_native_endowments_legacy_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'A legacy of giving.',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/planned-giving/endowments'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.settings?.title).toBe('Maybe this is an interest or inquiry form.');
    expect(String(requestBlocks[0]?.settings?.step1Title || '')).toBe('');
  });

  it('drops duplicate generosity fund request-form blocks and keeps the canonical request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/donor-advised-fund': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old generosity request block',
            },
          },
          {
            id: 'request_form_legacy_child_native_generosity_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Make the most of your giving.',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.settings?.title).toBe('Old generosity request block');
    expect(JSON.parse(requestBlocks[0]?.settings?.step1FieldsJson || '[]').map((field) => field.id)).toEqual([
      'name',
      'givingProduct',
      'contactPreference',
      'phone',
      'email',
      'message',
    ]);
  });

  it('seeds the generosity fund request-form block from the later fallback form instead of the inline CTA reveal shell', () => {
    const normalized = normalizeStoredConfig({});
    const requestBlock = (normalized.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlock?.id).toBe('request_form');
    expect(requestBlock?.settings?.anchorId).toBe('traditional-daf-form');
    expect(requestBlock?.settings?.sectionClassName).toBe('legacy-child-native-generosity-request');
    expectNoTargetBridgeSettings(requestBlock);
    expect(JSON.parse(requestBlock?.settings?.step1FieldsJson || '[]').map((field) => field.id)).toEqual([
      'name',
      'givingProduct',
      'contactPreference',
      'phone',
      'email',
      'message',
    ]);
  });

  it('drops duplicate charitable-gift-annuities request-form blocks and restores the canonical dynamic request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/charitable-gift-annuities': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            settings: {
              title: 'Legacy request block',
            },
          },
          {
            id: 'request_form_legacy_child_native_cga_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Another legacy request block',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/planned-giving/charitable-gift-annuities'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.mode).toBe('dynamic');
    expect(requestBlocks[0]?.settings?.title).toBe('Legacy request block');
  });

  it('drops duplicate ministry-impact-fund request-form blocks and restores the canonical dynamic request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/ministry-impact-fund': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            settings: {
              title: 'Legacy request block',
            },
          },
          {
            id: 'request_form_legacy_child_native_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Another legacy request block',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/planned-giving/ministry-impact-fund'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.mode).toBe('dynamic');
    expect(requestBlocks[0]?.settings?.title).toBe('Legacy request block');
  });

  it('seeds 403(b) with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const retirement403bBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const heroBlock = retirement403bBlocks.find((block) => block?.id === 'hero' && block?.kind === 'hero');
    const introBlock = retirement403bBlocks.find((block) => block?.id === 'intro' && block?.kind === 'intro');
    const requestBlock = retirement403bBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = retirement403bBlocks.find((block) => block?.kind === 'cta_form');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.mode).toBe('dynamic');
    expect(heroBlock?.settings?.justify).toBe('right');
    expect(introBlock).toBeTruthy();
    expect(introBlock?.mode).toBe('dynamic');
    expect(introBlock?.settings?.heading).toBe('Ministry-powered retirement.');
    expect(introBlock?.settings?.bgTone).toBe('grey');
    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock.mode).toBe('dynamic');
    expect(ctaBlock.settings.bodyHtml).toBe('');
    expect(ctaBlock.settings.subtitle).toBe('And we’re eager to help.');
    expect(ctaBlock.settings.bgTone).toBe('white');
    expect(ctaBlock.settings.submitLabel).toBe('Follow up with me');
    const fields = getCtaFields(ctaBlock);
    expect(fields[0]?.label).toBe('Name*');
    expect(fields[1]?.label).toBe('Email*');
    expect(fields[2]?.label).toBe('Phone*');
  });

  it('drops stale 403(b) request-form blocks without restoring a missing CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old retirement request block',
            },
          },
        ],
      },
    });

    const retirement403bBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    expect(retirement403bBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(retirement403bBlocks.some((block) => block?.kind === 'cta_form')).toBe(false);
  });

  it('seeds charitable gift annuities with explicit managed blocks and no fallback page content', () => {
    const normalized = normalizeStoredConfig({});
    const annuitiesBlocks = normalized.blocksByPath['/services/planned-giving/charitable-gift-annuities'] || [];

    expect(annuitiesBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(annuitiesBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(annuitiesBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(annuitiesBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(annuitiesBlocks.some((block) => block?.id === 'outro' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
  });

  it('drops stale charitable gift annuities page-content blocks without restoring missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/charitable-gift-annuities': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<p>Old legacy content</p>',
            },
          },
        ],
      },
    });

    const annuitiesBlocks = normalized.blocksByPath['/services/planned-giving/charitable-gift-annuities'] || [];

    expect(annuitiesBlocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(annuitiesBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(false);
  });

  it('restores the charitable gift annuities hero when a stored draft hides it', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/charitable-gift-annuities': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            hidden: true,
            settings: {
              line1Text: 'Generous.',
              line2Text: 'Rewarding, too.',
            },
          },
        ],
      },
    });

    const annuitiesBlocks = normalized.blocksByPath['/services/planned-giving/charitable-gift-annuities'] || [];
    const heroBlock = annuitiesBlocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.hidden).toBe(false);
  });

  it('repairs charitable gift annuities outro typography and button order on stale stored blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/charitable-gift-annuities': [
          {
            id: 'outro',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Plenty of options.',
              subtitle: 'Explore other charitable and planned giving strategies.',
              buttonLabel: 'Discover more',
              buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/services/planned-giving"}',
              sectionClassName: 'legacy-child-native-cga-outro',
            },
          },
        ],
      },
    });

    const annuitiesBlocks = normalized.blocksByPath['/services/planned-giving/charitable-gift-annuities'] || [];
    const outroBlock = annuitiesBlocks.find((block) => block?.id === 'outro');
    const stateNoticesBlock = annuitiesBlocks.find((block) => block?.id === 'state_notices');

    expect(outroBlock?.settings?.titleFontFamily).toBe('helv');
    expect(outroBlock?.settings?.titleFontWeight).toBe(700);
    expect(outroBlock?.settings?.justify).toBe('center');
    expect(outroBlock?.settings?.actionsBeforeCards).toBe(true);
    expect(outroBlock?.settings?.fineprint).toBeUndefined();
    expect(outroBlock?.settings?.fineprintDisclosureId).toBeUndefined();
    expect(stateNoticesBlock?.kind).toBe('content');
    expect(stateNoticesBlock?.settings?.sectionClassName).toBe('legacy-child-native-cga-state-notices');
    expect(stateNoticesBlock?.settings?.fineprintDisclosureId).toBe('planned-giving-cga-state-notices');
  });

  it('seeds ministry impact fund with explicit managed blocks and no fallback page content', () => {
    const normalized = normalizeStoredConfig({});
    const ministryImpactBlocks = normalized.blocksByPath['/services/planned-giving/ministry-impact-fund'] || [];

    expect(ministryImpactBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(ministryImpactBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(ministryImpactBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(ministryImpactBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(ministryImpactBlocks.some((block) => block?.id === 'outro' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
  });

  it('drops stale ministry impact fund page-content blocks without restoring missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/ministry-impact-fund': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<p>Old legacy content</p>',
            },
          },
        ],
      },
    });

    const ministryImpactBlocks = normalized.blocksByPath['/services/planned-giving/ministry-impact-fund'] || [];

    expect(ministryImpactBlocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(ministryImpactBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(false);
  });

  it('repairs stale ministry impact fund request-form presentation back to the legacy-impact preset contract', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/ministry-impact-fund': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'A legacy of giving.',
              titleClassName: '',
              titleHighlightsJson: '[{"text":"legacy","className":"is-white"}]',
              bgTone: 'grey',
              textTone: 'white',
              spaceBeforeRem: 1.6,
              spaceAfterRem: 1.6,
              sectionClassName: 'legacy-child-native-request',
              presetId: 'legacy-impact',
              step1Title: 'Talk with planned giving',
              step1Note: 'Let’s map out the best next step.',
              step1FieldsJson: JSON.stringify([
                { id: 'firstName', label: 'First Name*', type: 'text', required: true },
              ]),
              step2FieldsJson: '[]',
              step3FieldsJson: '[]',
              step4FieldsJson: '[]',
              step5FieldsJson: '[]',
            },
          },
        ],
      },
    });

    const ministryImpactBlocks = normalized.blocksByPath['/services/planned-giving/ministry-impact-fund'] || [];
    const requestBlock = ministryImpactBlocks.find((block) => block?.id === 'request_form');

    expect(requestBlock?.settings).toMatchObject({
      titleClassName: '',
      titleHighlightsJson: '',
      bgTone: 'blue',
      textTone: 'white',
      spaceBeforeRem: 3.6,
      spaceAfterRem: 4.2,
      hideStepTitles: true,
      step1Title: '',
      step1Note: '',
    });
  });

  it('restores the ministry impact fund hero and clears stored hero buttons', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/ministry-impact-fund': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            hidden: true,
            settings: {
              line1Text: 'Any gift.',
              line2Text: 'Any asset.',
              line3Text: 'Unlocked.',
              button1Label: 'Open a Ministry Impact Fund®',
              button1Url: 'https://secure.agfinancial.org/ministryimpactfund/signup',
            },
          },
        ],
      },
    });

    const ministryImpactBlocks = normalized.blocksByPath['/services/planned-giving/ministry-impact-fund'] || [];
    const heroBlock = ministryImpactBlocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.hidden).toBe(false);
    expect(heroBlock?.settings?.button1Label).toBe('');
    expectNoSplitSettings(heroBlock?.settings, ['button1Url']);
  });

  it('seeds calculators with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const calculatorBlocks = normalized.blocksByPath['/calculators'] || [];
    const requestBlock = calculatorBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = calculatorBlocks.find((block) => block?.kind === 'cta_form');

    expect(calculatorBlocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.sectionClassName).toBe('calculators-native-cta');
    expect(ctaBlock?.settings?.bgTone).toBe('white');
    expect(ctaBlock?.settings?.titleClassName).toBe('is-atlantean');
    expect(getCtaFields(ctaBlock)[0]?.label).toBe('Name');
    expect(getCtaFields(ctaBlock)).toHaveLength(3);
  });

  it('keeps the calculators CTA block canonical when stored config already carries it', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/calculators': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Old calculator CTA block',
            },
          },
        ],
      },
    });

    const calculatorBlocks = normalized.blocksByPath['/calculators'] || [];
    const ctaBlock = calculatorBlocks.find((block) => block?.kind === 'cta_form');

    expect(calculatorBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.sectionClassName).toBe('calculators-native-cta');
    expectNoTargetBridgeSettings(ctaBlock);
    expect(ctaBlock?.settings?.bgTone).toBe('white');
  });

  it('normalizes split link target drift during state normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'Loans',
              buttonUrl: '/old-target',
              buttonPageRef: '/contact-us',
              buttonOpenInNewWindow: 'false',
            },
          },
        ],
      },
    });

    const heroBlock = normalized.blocksByPath['/services/loans']?.[0];

    expectLinkJson(heroBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
      openInNewWindow: false,
    });
    expectNoSplitSettings(heroBlock?.settings, ['buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow']);
  });

  it('seeds about us with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const aboutBlocks = normalized.blocksByPath['/about-us'] || [];
    const requestBlock = aboutBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = aboutBlocks.find((block) => block?.kind === 'cta_form');
    const pageContentBlock = aboutBlocks.find((block) => block?.id === 'page_content' && block?.kind === 'content');

    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.sectionClassName).toBe('about-native-cta-form');
    expect(ctaBlock?.settings?.targetSectionClassName).toBeUndefined();
    expect(ctaBlock?.settings?.title).toBe('What can we do for you?');
    expect(ctaBlock?.settings?.titleClassName).toBe('is-atlantean');
    expect(getCtaFields(ctaBlock)[3]?.label).toBe('What would you like to discuss?');
    expect(pageContentBlock).toBeUndefined();
  });

  it('does not reseed blank fallback page-content blocks on audited native-content routes', () => {
    const normalized = normalizeStoredConfig({});
    const auditedPaths = [
      '/about-us',
      '/about-us/careers',
      '/accessibility',
      '/calculators/emergency-fund',
      '/calculators/increased-contribution',
      '/calculators/ministers-housing-allowance-quick-check',
      '/calculators/net-worth',
      '/contact-us',
    ];

    auditedPaths.forEach((pathname) => {
      const blocks = normalized.blocksByPath[pathname] || [];
      expect(
        blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content'),
        pathname,
      ).toBe(false);
    });
  });

  it('drops stale about-us request-form blocks without restoring a missing CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/about-us': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old about-us request block',
            },
          },
        ],
      },
    });

    const aboutBlocks = normalized.blocksByPath['/about-us'] || [];

    expect(aboutBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(aboutBlocks.some((block) => block?.kind === 'cta_form')).toBe(false);
  });

  it('seeds the other audited CTA-owned form routes with CTA blocks instead of request-form blocks', () => {
    const normalized = normalizeStoredConfig({});
    const auditedRoutes = [
      ['/services/insurance', { sectionClassName: 'insurance-native-cta' }],
      ['/services/retirement/409a', { sectionClassName: 'retirement-child-native-cta' }],
    ];

    auditedRoutes.forEach(([pathname, expectation]) => {
      const blocks = normalized.blocksByPath[pathname] || [];
      const requestBlock = blocks.find((block) => block?.kind === 'request_form');
      const ctaBlock = blocks.find((block) => block?.kind === 'cta_form');

      expect(requestBlock, pathname).toBeUndefined();
      expect(ctaBlock, pathname).toBeTruthy();
      expect(ctaBlock?.mode, pathname).toBe('dynamic');
      if (expectation.targetSectionClassName) {
        expect(ctaBlock?.settings?.targetSectionClassName, pathname).toBe(expectation.targetSectionClassName);
      }
      if (expectation.sectionClassName) {
        expect(ctaBlock?.settings?.sectionClassName, pathname).toBe(expectation.sectionClassName);
      }
    });
  });

  it('keeps the charitable-trusts seed fields on the canonical request form', () => {
    const normalized = normalizeStoredConfig({});
    const charitableTrustsBlocks = (normalized.blocksByPath['/services/planned-giving/charitable-trusts'] || [])
      .filter((block) => block?.kind === 'request_form');
    const fallbackRequestBlock = charitableTrustsBlocks.find((block) => (
      block?.settings?.sectionClassName === 'legacy-child-native-trusts-request'
    ));
    const fields = JSON.parse(String(fallbackRequestBlock?.settings?.step1FieldsJson || '[]'));

    expect(charitableTrustsBlocks).toHaveLength(1);
    expect(fallbackRequestBlock?.id).toBe('request_form');
    expect(fallbackRequestBlock?.settings?.displayMode).toBeUndefined();
    expect(fallbackRequestBlock?.settings?.triggerMode).toBeUndefined();
    expect(fallbackRequestBlock?.settings?.targetSectionClassName).toBeUndefined();
    expect(fields.map((field) => field.id)).toEqual([
      'firstName',
      'lastName',
      'phone',
      'email',
      'contactPreference',
      'trustProduct',
      'message',
    ]);
  });

  it('repairs stored charitable-trusts CTA blocks by dropping retired CTA-form shells', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/charitable-trusts': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              targetSectionKey: 'class:legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline',
              targetSectionClassName: 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline',
              title: 'Income and impact.',
            },
          },
          {
            id: 'cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              targetSectionKey: 'class:legacy-child-native-cta legacy-child-native-trusts-cta',
              targetSectionClassName: 'legacy-child-native-cta legacy-child-native-trusts-cta',
              title: 'Income and impact.',
            },
          },
        ],
      },
    });

    const charitableTrustsBlocks = normalized.blocksByPath['/services/planned-giving/charitable-trusts'] || [];
    const charitableTrustsCtaBlocks = charitableTrustsBlocks
      .filter((block) => block?.kind === 'cta_form');
    const inlineCtaBlock = charitableTrustsCtaBlocks.find((block) => block?.id === 'cta_form');
    const fallbackCtaBlock = charitableTrustsCtaBlocks.find((block) => (
      block?.id === 'cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta'
    ));

    expect(charitableTrustsCtaBlocks).toHaveLength(0);
    expect(inlineCtaBlock).toBeUndefined();
    expect(fallbackCtaBlock).toBeUndefined();
  });

  it('drops stale request-form blocks from audited CTA-owned routes without restoring missing CTA blocks', () => {
    const auditedRoutes = [
      ['/services/insurance', { sectionClassName: 'insurance-native-cta' }],
      ['/services/retirement/409a', { sectionClassName: 'retirement-child-native-cta' }],
    ];

    auditedRoutes.forEach(([pathname]) => {
      const normalized = normalizeStoredConfig({
        blocksByPath: {
          [pathname]: [
            {
              id: 'request_form',
              kind: 'request_form',
              mode: 'dynamic',
              settings: {
                title: `Old request block for ${pathname}`,
              },
            },
          ],
        },
      });

      const blocks = normalized.blocksByPath[pathname] || [];
      const ctaBlock = blocks.find((block) => block?.kind === 'cta_form');

      expect(blocks.some((block) => block?.kind === 'request_form'), pathname).toBe(false);
      expect(ctaBlock, pathname).toBeUndefined();
    });
  });

  it('repairs stale generosity fund naming, hero order, and retired CTA block', () => {
    const normalized = normalizeStoredConfig({
      pageHierarchy: {
        '/services/planned-giving/generosity-fund': {
          path: '/services/planned-giving/generosity-fund',
          routeKey: '/services/planned-giving/generosity-fund',
          linkRef: '/services/planned-giving/generosity-fund',
          title: 'Generosity Fund',
          breadcrumbLabel: 'Generosity Fund',
          parentPath: '/services/planned-giving',
        },
      },
      blocksByPath: {
        '/services/planned-giving/generosity-fund': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'Your giving.',
              line2Text: 'Managed.',
              button1Label: 'Open a Generosity Fund®',
              button1Url: 'https://secure.agfinancial.org/generosityfund/signup',
              button1Style: 'blue',
              button1Tone: 'atlantean',
              button2Label: 'Open a traditional DAF',
              button2Url: '#traditional-daf-form',
              button2PageRef: '',
              button2Action: 'open_cta_form',
              button2TargetAnchorId: 'traditional-daf-inline-form',
              button2TargetBlockId: '',
              button2Style: 'outline',
              button2Tone: 'super-grey',
            },
          },
          {
            id: 'how_it_works',
            kind: 'columns',
            mode: 'dynamic',
            settings: {
              title: 'How it works',
              sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-generosity-steps',
            },
          },
          {
            id: 'traditional_daf_cta',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'legacy-child-native-generosity-traditional-cta',
              buttonLabel: 'Open a traditional DAF',
            },
          },
          {
            id: 'gift_assets',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              sectionClassName: 'legacy-child-native-assets legacy-child-native-generosity-assets',
              card1ButtonLabel: 'Open a Generosity Fund®',
            },
          },
        ],
      },
    });

    expect(normalized.pageHierarchy['/services/planned-giving/generosity-fund']).toBeUndefined();
    expect(normalized.blocksByPath['/services/planned-giving/generosity-fund']).toBeUndefined();
    expect(normalized.pathAliases['/services/planned-giving/generosity-fund'])
      .toBe('/services/planned-giving/donor-advised-fund');
    expect(normalized.pageHierarchy['/services/planned-giving/donor-advised-fund']).toMatchObject({
      path: '/services/planned-giving/donor-advised-fund',
      routeKey: '/services/planned-giving/donor-advised-fund',
      linkRef: '/services/planned-giving/donor-advised-fund',
      title: 'Donor Advised Fund',
      breadcrumbLabel: 'Donor Advised Fund',
    });
    expect((normalized.blocksByPath['/services/planned-giving/donor-advised-fund'] || []).map((block) => block.id))
      .not.toContain('traditional_daf_cta');
    const loadedHero = (normalized.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'hero');
    expect(loadedHero?.settings?.button1Label).toBe('Open a Generosity Fund®');
    const migrated = migrateGenerosityFundSnapshot(normalized, {
      defaultState: normalizeStoredConfig(null),
      fromVersion: 0,
    });
    expect(migrated.changed).toBe(true);
    const migratedState = migrated.state;
    const heroBlock = (migratedState.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'hero');
    const howItWorksBlock = (migratedState.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'how_it_works');
    const onlineBlock = (migratedState.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'generosity_fund_online');
    const giftAssetsBlock = (migratedState.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'gift_assets');

    expect(heroBlock?.settings?.button1Label).toBe('Open a traditional DAF');
    expect(heroBlock?.settings?.button2Label).toBe('Open a Generosity Fund®');
    expect(heroBlock?.settings?.button2Action || '').toBe('');
    expect(heroBlock?.settings?.button2TargetAnchorId || '').toBe('');
    expect(heroBlock?.settings?.button2TargetBlockId || '').toBe('');
    expectLinkJson(heroBlock?.settings, 'button1LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expectLinkJson(heroBlock?.settings, 'button2LinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expectNoSplitSettings(heroBlock?.settings, ['button1Url', 'button2Url', 'button2PageRef']);
    expect(howItWorksBlock?.settings?.buttonLabel).toBe('Open a traditional DAF');
    expectLinkJson(howItWorksBlock?.settings, 'buttonLinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expect(onlineBlock?.settings).toMatchObject({
      title: 'Generosity Fund®',
      subtitle: 'Our fully online Donor Advised Fund simplifies your giving even more, letting you manage your giving anytime you want.',
      buttonLabel: 'Open a Generosity Fund®',
    });
    expect(giftAssetsBlock?.settings?.card1Button2Label).toBe('Open a traditional DAF');
    expectLinkJson(giftAssetsBlock?.settings, 'card1Button2LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
  });

  it('repairs stale generosity fund joyful giving billboard secondary action styling back to the ghost treatment', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/planned-giving/donor-advised-fund': [
          {
            id: 'joyful_giving_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Simple, joyful giving.',
              buttonLabel: 'Open a Generosity Fund®',
              buttonUrl: 'https://secure.agfinancial.org/generosityfund/signup',
              buttonStyle: 'blue',
              buttonTone: 'atlantean',
              button2Label: 'Terms and Conditions',
              button2DocumentId: 'document-planned-giving-terms-and-conditions',
              button2Style: 'blue',
              button2Tone: 'atlantean',
              targetSectionKey: 'class:legacy-child-native-generosity-outro',
            },
          },
        ],
      },
    });

    const billboardBlock = (normalized.blocksByPath['/services/planned-giving/donor-advised-fund'] || [])
      .find((block) => block?.id === 'joyful_giving_billboard');

    expect(billboardBlock?.settings?.button2Style).toBe('ghost');
    expect(billboardBlock?.settings?.button2Tone).toBe('super-grey');
    expect(billboardBlock?.settings?.button2DocumentId).toBe('document-planned-giving-terms-and-conditions');
    expect(billboardBlock?.settings?.buttonLabel).toBe('Open a Generosity Fund®');
    expect(billboardBlock?.settings?.titleFontFamily).toBe('helv');
    expect(billboardBlock?.settings?.titleFontWeight).toBe(700);
    expect(billboardBlock?.settings?.titleSizeRem).toBe(5.6);
    expect(billboardBlock?.settings?.titleLetterSpacingEm).toBe(-0.03);
  });

  it('drops stale contact-us CTA blocks without restoring a missing request form', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/contact-us': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Old contact CTA block',
            },
          },
        ],
      },
    });

    const contactBlocks = normalized.blocksByPath['/contact-us'] || [];
    const requestBlock = contactBlocks.find((block) => block?.kind === 'request_form');

    expect(contactBlocks.some((block) => block?.kind === 'cta_form')).toBe(false);
    expect(requestBlock).toBeUndefined();
  });

  it('seeds the remaining request-form routes from explicit canonical blocks', () => {
    const normalized = normalizeStoredConfig({});
    const expectations = [
      ['/contact-us', 'contact-us-request', 'How can we help?'],
      ['/services/loans/loan-consultants', 'loans-consultant-native-contact', 'Talk with a consultant.'],
    ];

    expectations.forEach(([pathname, targetSectionClassName, title]) => {
      const blocks = normalized.blocksByPath[pathname] || [];
      const requestBlock = blocks.find((block) => block?.kind === 'request_form');

      expect(requestBlock, pathname).toBeTruthy();
      expect(requestBlock?.mode, pathname).toBe('dynamic');
      expect(requestBlock?.settings?.sectionClassName, pathname).toBe(targetSectionClassName);
      expectNoTargetBridgeSettings(requestBlock, pathname);
      expect(requestBlock?.settings?.title, pathname).toBe(title);
    });
  });

  it('preserves unsupported legacy 403(b) CTA settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Questions about the 403(b)? We’re ready.',
              bodyHtml: '<p>And we’re eager to help.</p>',
              bgTone: 'sand',
              targetSectionKey: 'class:retirement-child-native-cta retirement-403b-native-cta',
              targetSectionClassName: 'retirement-child-native-cta retirement-403b-native-cta',
              submitLabel: 'Follow-up with me',
            },
          },
        ],
      },
    });

    const ctaBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.kind === 'cta_form');

    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.bodyHtml).toBe('<p>And we’re eager to help.</p>');
    expect(ctaBlock?.settings?.bgTone).toBe('sand');
  });

  it('keeps customized standalone 403(b) CTA body copy once the route is block-owned', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Questions about the 403(b)? We’re ready.',
              subtitle: '',
              bodyHtml: '<p>And we’re eager to help.</p>',
              bgTone: 'white',
              targetSectionKey: '',
              targetSectionClassName: '',
              targetSectionIndex: 0,
            },
          },
        ],
      },
    });

    const ctaBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.kind === 'cta_form');

    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.bodyHtml).toBe('<p>And we’re eager to help.</p>');
    expect(ctaBlock?.settings?.subtitle).toBe('');
    expect(ctaBlock?.settings?.bgTone).toBe('white');
  });

  it('preserves unsupported legacy 403(b) rollover billboard settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'rollover_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            hidden: false,
            settings: {
              title: 'A rollover is easy. Smart, too.',
              bodyHtml: '<p>Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple...and undeniably smart. One account. One login.</p>',
              bgTone: 'grey',
              textTone: 'white',
              justify: 'center',
              buttonLabel: 'Let’s simplify things',
              buttonPageRef: '/services/retirement/rollovers',
              targetSectionKey: '',
              targetSectionClassName: '',
            },
          },
        ],
      },
    });

    const rolloverBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'rollover_billboard' && block?.kind === 'billboard');

    expect(rolloverBlock).toBeTruthy();
    expect(rolloverBlock?.hidden).toBe(false);
    expect(rolloverBlock?.settings?.buttonLabel).toBe('Let’s simplify things');
    expect(rolloverBlock?.settings?.titleFontFamily).toBe('helv');
    expect(rolloverBlock?.settings?.titleFontWeight).toBe(800);
    expect(rolloverBlock?.settings?.titleSizeRem).toBe(4.4);
    expect(rolloverBlock?.settings?.titleLetterSpacingEm).toBe(-0.024);
    expect(rolloverBlock?.settings?.contentMaxWidthPx).toBe(1080);
  });

  it('keeps customized 403(b) rollover billboard edits while clearing obsolete target-section fields', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'rollover_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            hidden: false,
            settings: {
              title: 'Roll your retirement together.',
              bodyHtml: '<p>Custom rollover copy for the block-owned route.</p>',
              bgTone: 'blue',
              textTone: 'white',
              justify: 'left',
              buttonLabel: 'Talk to us first',
              buttonPageRef: '/services/retirement/rollovers',
              targetSectionKey: 'class:retirement-child-native-rollover',
              targetSectionClassName: 'retirement-child-native-rollover',
              targetSectionIndex: 2,
            },
          },
        ],
      },
    });

    const rolloverBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'rollover_billboard' && block?.kind === 'billboard');

    expect(rolloverBlock).toBeTruthy();
    expect(rolloverBlock?.settings?.title).toBe('Roll your retirement together.');
    expect(rolloverBlock?.settings?.bodyHtml).toBe('<p>Custom rollover copy for the block-owned route.</p>');
    expect(rolloverBlock?.settings?.bgTone).toBe('blue');
    expect(rolloverBlock?.settings?.textTone).toBe('white');
    expect(rolloverBlock?.settings?.justify).toBe('left');
    expect(rolloverBlock?.settings?.buttonLabel).toBe('Talk to us first');
  });

  it('keeps customized 403(b) rollover billboard copy when only obsolete target-section fields remain', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'rollover_billboard',
            kind: 'billboard',
            mode: 'dynamic',
            hidden: false,
            settings: {
              title: 'A rollover is easy. Smart, too.',
              bodyHtml: '<p>Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple…and undeniably smart. One account. One login.</p>',
              bgTone: 'blue',
              textTone: 'white',
              justify: 'left',
              buttonLabel: 'Talk to a consultant',
              buttonPageRef: '/services/retirement/rollovers',
              targetSectionKey: 'class:retirement-child-native-rollover',
              targetSectionClassName: 'retirement-child-native-rollover',
              targetSectionIndex: 2,
            },
          },
        ],
      },
    });

    const rolloverBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'rollover_billboard' && block?.kind === 'billboard');

    expect(rolloverBlock?.settings?.title).toBe('A rollover is easy. Smart, too.');
    expect(rolloverBlock?.settings?.bodyHtml).toBe('<p>Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple…and undeniably smart. One account. One login.</p>');
    expect(rolloverBlock?.settings?.bgTone).toBe('blue');
    expect(rolloverBlock?.settings?.textTone).toBe('white');
    expect(rolloverBlock?.settings?.justify).toBe('left');
    expect(rolloverBlock?.settings?.buttonLabel).toBe('Talk to a consultant');
  });

  it('drops the stale blank 403(b) page-content fallback and uses the seeded semantic loan block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
              contentMaxWidthPx: 980,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect((normalized.blocksByPath['/services/retirement/403b'] || []).some((block) => block?.id === 'page_content')).toBe(false);
    expect(loanDetailsBlock).toBeUndefined();
  });

  it('drops stale generic 403(b) overview page-content blocks without restoring missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              title: 'Benefits you’ll love.',
              html: '<p>Legacy overview copy that should not survive migration.</p>',
              contentMaxWidthPx: 980,
            },
          },
        ],
      },
    });

    const routeBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];

    expect(routeBlocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(routeBlocks.some((block) => block?.id === 'benefits_cards' && block?.kind === 'card_grid')).toBe(false);
    expect(routeBlocks.some((block) => block?.id === 'rollover_billboard' && block?.kind === 'billboard')).toBe(false);
    expect(routeBlocks.some((block) => block?.id === 'loan_details' && block?.kind === 'content')).toBe(false);
  });

  it('does not silently replace stale legacy 403(b) loan-details HTML', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <h2>403(b) Plan Loans</h2>
                <p>A 403(b) loan allows you to borrow money from your own retirement savings without incurring early withdrawal tax penalties.</p>
                <h3>Details</h3>
                <p>The requested 403(b) loan amount cannot be less than $1,500. In addition, the amount borrowed cannot exceed the lesser of:</p>
                <ul>
                  <li>100% of the total vested account balance if less than $10,000</li>
                </ul>
              `,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(loanDetailsBlock).toBeTruthy();
    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('retirement-403b-loan-copy');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
  });

  it('does not silently remove leaked housing metadata from arbitrary 403(b) loan-details blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              title: "Retired Ministers' Housing Allowance",
              body: 'The unique benefit, which gives ministers a significant tax savings, is not available through secular 403(b) plans or IRAs.',
              html: `
                <div class="retirement-403b-loan-copy">
                  <h2>403(b) Plan Loans</h2>
                  <p>A 403(b) loan allows you to borrow money from your own retirement savings without incurring early withdrawal tax penalties.</p>
                  <div class="retirement-403b-loan-detail-card">
                    <h3>Details</h3>
                  </div>
                </div>
              `,
              sectionClassName: 'retirement-403b-native-loans',
              buttonLabel: 'Use the quick check calculator',
              buttonPageRef: '/calculators',
              anchorId: 'retired-ministers-housing-allowance',
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(loanDetailsBlock).toBeTruthy();
    expect(loanDetailsBlock?.settings?.title || '').toBe("Retired Ministers' Housing Allowance");
    expect(loanDetailsBlock?.settings?.body || '').toContain('The unique benefit, which gives ministers');
    expect(loanDetailsBlock?.settings?.buttonLabel || '').toBe('Use the quick check calculator');
    expectLinkJson(loanDetailsBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/calculators',
    });
    expect(loanDetailsBlock?.settings?.anchorId || '').toBe('retired-ministers-housing-allowance');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
  });

  it('keeps customized 403(b) loan details html once the stale legacy snapshot signature is gone', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <section>
                  <h2>403(b) Plan Loans</h2>
                  <p>Custom loan guidance for current retirement participants.</p>
                </section>
              `,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('Custom loan guidance for current retirement participants.');
    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('retirement-403b-loan-copy');
  });

  it('keeps customized 403(b) loan details html when only one old loan sentence remains', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <section>
                  <h2>403(b) Plan Loans</h2>
                  <p>The requested 403(b) loan amount cannot be less than $1,500.</p>
                  <p>Custom note for current retirement participants.</p>
                </section>
              `,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('Custom note for current retirement participants.');
    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('retirement-403b-loan-copy');
  });

  it('does not silently repair stale stored 403(b) intro copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Ministry-powered retirement.',
              bodyHtml: '<p>The AGFinancial 403(b) offers higher contribution limits and potential employer matching—advantages you won’t find with an IRA. Designed specifically for ministers and ministry employees, it’s a powerful way to save while you serve.</p>',
              bgTone: 'white',
              textTone: 'dark',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock).toBeTruthy();
    expect(introBlock?.settings?.heading).toBe('Ministry-powered retirement.');
    expect(introBlock?.settings?.bodyHtml).toContain('offers higher contribution limits');
    expect(introBlock?.settings?.bgTone).toBe('white');
    expect(introBlock?.settings?.textTone).toBe('dark');
  });

  it('keeps customized stored 403(b) overview intros once the route is block-owned', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Retirement built for ministry teams.',
              bodyHtml: '<p>Customized intro copy that should persist after the route cutover.</p>',
              body: 'Customized intro copy that should persist after the route cutover.',
              bgTone: 'white',
              textTone: 'dark',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.settings?.heading).toBe('Retirement built for ministry teams.');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Customized intro copy that should persist after the route cutover.</p>');
    expect(introBlock?.settings?.bgTone).toBe('white');
    expect(introBlock?.settings?.textTone).toBe('dark');
  });

  it('keeps 403(b) overview intros that reuse the canonical heading with new body copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Ministry-powered retirement.',
              bodyHtml: '<p>Custom overview intro copy that should persist after the route cutover.</p>',
              body: 'Custom overview intro copy that should persist after the route cutover.',
              bgTone: 'white',
              textTone: 'dark',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.settings?.heading).toBe('Ministry-powered retirement.');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Custom overview intro copy that should persist after the route cutover.</p>');
    expect(introBlock?.settings?.bgTone).toBe('white');
    expect(introBlock?.settings?.textTone).toBe('dark');
  });

  it('preserves an unsupported 403(b) benefits copy block during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'benefits_copy',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              title: 'Benefits you’ll love.',
              subtitle: '',
              body: '',
              html: '',
            },
          },
          {
            id: 'benefits_cards',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Benefits you’ll love.',
            },
          },
        ],
      },
    });

    expect((normalized.blocksByPath['/services/retirement/403b'] || []).some((block) => block?.id === 'benefits_copy')).toBe(true);
  });

  it('preserves the full 403(b) benefits card set after normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'benefits_cards',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Benefits you’ll love.',
              card1Title: 'MBA Income Fund',
              card2Title: 'Screened Investments',
              card3Title: 'Minister’s Housing Allowance',
              card3TitleHighlightsJson: '[{"text":"Minister’s Housing Allowance","className":"is-super-grey"}]',
              card4Title: 'Roth / Pretax Deferrals',
              card5Title: 'Rollovers',
              card5Body: 'Retirement savings can be simplified by consolidating other retirement accounts into a single 403(b).',
              card6Title: 'Variety',
              card6Body: 'Investment options include low-cost index funds, actively-managed funds, risk-based and target-date strategies, and individual funds.',
              card7Title: 'Your Own Consultant',
              card7Body: 'Our regional consultants are available to answer your questions, help customize your plan, and assist you with implementation.',
              card8Title: 'Education',
              card8Body: 'Onsite education for your participants is available.',
            },
          },
        ],
      },
    });

    const benefitsCardsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'benefits_cards' && block?.kind === 'card_grid');

    expect(benefitsCardsBlock?.settings?.card1Title).toBe('MBA Income Fund');
    expect(String(benefitsCardsBlock?.settings?.card3Title || '')).toBe('Minister’s Housing Allowance');
    expect(String(benefitsCardsBlock?.settings?.card3TitleHighlightsJson || '')).toContain('Minister’s Housing Allowance');
    expect(String(benefitsCardsBlock?.settings?.card5Title || '')).toBe('Rollovers');
    expect(String(benefitsCardsBlock?.settings?.card6Title || '')).toBe('Variety');
    expect(String(benefitsCardsBlock?.settings?.card7Title || '')).toBe('Your Own Consultant');
    expect(String(benefitsCardsBlock?.settings?.card8Title || '')).toBe('Education');
    expect(String(benefitsCardsBlock?.settings?.card5Body || '')).toContain('single 403(b)');
    expect(String(benefitsCardsBlock?.settings?.card8Body || '')).toContain('Onsite education');
  });

  it('preserves unsupported 403(b) investment strategy html during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <section>
                  <article>
                    <h3>MBA Income Fund</h3>
                    <a href="/prospectus">Prospectus</a>
                  </article>
                  <article>
                    <h3>Rollovers</h3>
                    <p>Retirement savings can be simplified by consolidating other retirement accounts into a single 403(b).</p>
                  </article>
                  <article>
                    <h3>Education</h3>
                    <p>Legacy extra card content.</p>
                  </article>
                </section>
              `,
            },
          },
        ],
      },
    });

    const strategyBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'content');

    expect(String(strategyBlock?.settings?.html || '')).toContain('MBA Income Fund');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Rollovers');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Education');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Prospectus');
  });

  it('preserves unsupported 403(b) investment strategy card-grid blocks during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Investment Strategy Options',
              card1Title: 'MBA Income Fund',
              card1ButtonLabel: 'Download the MBA Fact sheet PDF',
              card1Button2Label: 'Prospectus',
              card1Button2PageRef: '/prospectus',
              card2Title: 'Risk-Based Strategies',
              card2Button2Label: 'Prospectus',
              card2Button2PageRef: '/prospectus',
            },
          },
        ],
      },
    });

    const strategyBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_options');

    expect(strategyBlock?.kind).toBe('card_grid');
    expect(strategyBlock?.settings?.card1Button2Label).toBe('Prospectus');
  });

  it('does not infer 403(b) section actions from unsupported strategy content', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Investment Strategy Options',
              card1Title: 'MBA Income Fund',
              card1Button2Label: 'Prospectus',
              card1Button2PageRef: '/prospectus',
            },
          },
          {
            id: 'investment_strategy_heading',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Investment Strategy Options',
              buttonLabel: 'View monthly performance',
              buttonUrl: 'https://files.agfinancial.org/retirement/Performance-Update/Performance-Update.pdf',
              button2Label: '',
              button2Url: '',
              button2PageRef: '',
            },
          },
        ],
      },
    });

    const headingBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_heading' && block?.kind === 'billboard');

    expect(headingBlock?.settings?.buttonLabel).toBe('View monthly performance');
    expect(headingBlock?.settings?.button2Label).toBe('');
    expect(headingBlock?.settings?.button2LinkJson).toContain('/prospectus');
  });

  it('keeps customized 403(b) investment strategy heading actions once stale strategy content is gone', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <div class="ret403b-strategy-feature">
                  <article class="ret403b-strategy-feature-row services-breakdown-panel">
                    <h3>MBA Income Fund</h3>
                    <p class="services-breakdown-description">Custom strategy copy.</p>
                    <nav class="ret403b-strategy-feature-links" aria-label="MBA Income Fund links">
                      <a class="service-native-btn is-outline is-tone-atlantean ret403b-strategy-feature-link" href="/fund.pdf">Fund brief</a>
                    </nav>
                  </article>
                </div>
              `,
            },
          },
          {
            id: 'investment_strategy_heading',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Investment Strategy Options',
              buttonLabel: 'View monthly performance',
              buttonUrl: 'https://files.agfinancial.org/retirement/Performance-Update/Performance-Update.pdf',
              button2Label: '',
              button2Url: '',
              button2PageRef: '',
            },
          },
        ],
      },
    });

    const headingBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_heading' && block?.kind === 'billboard');

    expect(headingBlock?.settings?.button2Label).toBe('');
    expectNoSplitSettings(headingBlock?.settings, ['button2Url', 'button2PageRef']);
  });

  it('keeps customized 403(b) investment strategy feature html when it already uses the canonical wrapper', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <div class="ret403b-strategy-feature">
                  <article class="ret403b-strategy-feature-row services-breakdown-panel">
                    <h3>Rollovers and Education</h3>
                    <p class="services-breakdown-description">Prospectus support and custom education copy that should persist.</p>
                    <nav class="ret403b-strategy-feature-links" aria-label="Rollovers and Education links">
                      <a class="service-native-btn is-outline is-tone-atlantean ret403b-strategy-feature-link" href="/custom.pdf">Custom brief</a>
                    </nav>
                  </article>
                </div>
              `,
            },
          },
        ],
      },
    });

    const strategyBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'content');

    expect(String(strategyBlock?.settings?.html || '')).toContain('Rollovers and Education');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Prospectus support and custom education copy that should persist.');
    expect(String(strategyBlock?.settings?.html || '')).toContain('service-native-btn is-outline is-tone-atlantean ret403b-strategy-feature-link');
  });

  it('preserves wrapper-only 403(b) strategy html during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <div class="ret403b-strategy-feature">
                  <article class="ret403b-strategy-feature-row">
                    <div class="ret403b-strategy-feature-copy">
                      <h3>MBA Income Fund</h3>
                      <p>Old wrapper-only structure.</p>
                    </div>
                  </article>
                </div>
              `,
            },
          },
        ],
      },
    });

    const strategyBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'content');

    expect(String(strategyBlock?.settings?.html || '')).toContain('ret403b-strategy-feature');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Old wrapper-only structure.');
  });

  it('keeps customized 403(b) investment strategy html when it no longer matches the old leaked-card signature', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'investment_strategy_options',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <section>
                  <article>
                    <h3>Rollovers and Education</h3>
                    <p>Custom strategy overview copy for current plan participants.</p>
                  </article>
                </section>
              `,
            },
          },
        ],
      },
    });

    const strategyBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'content');

    expect(String(strategyBlock?.settings?.html || '')).toContain('Rollovers and Education');
    expect(String(strategyBlock?.settings?.html || '')).toContain('Custom strategy overview copy for current plan participants.');
  });

  it('keeps the group term life intro now that the route is block-owned', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Take care of the team.',
              bodyHtml: '<p>Protect the people who power your ministry.</p>',
              button1Label: 'Get started',
              button1Url: '/contact-us',
              button1PageRef: 'contact-us',
              button1OpenInNewWindow: true,
              button2Label: 'Learn more',
              button2Url: '/services/insurance',
              button2PageRef: 'insurance',
              button2OpenInNewWindow: true,
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const introBlock = groupLifeBlocks.find((block) => block?.id === 'intro');

    expect(introBlock?.kind).toBe('intro');
    expect(introBlock?.settings?.heading).toBe('Take care of the team.');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Protect the people who power your ministry.</p>');
    expect(introBlock?.settings?.button1Label).toBe('Get started');
  });

  it('preserves the 403(b) individual enrollment intro now that the route is block-owned', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'What’s one gotta do to get AGFinancial 403(b)?',
              bodyHtml: '<p>You’re in luck. We guide you through the process in four simple, easy-to-follow steps so you can open your account and start contributing with confidence.</p>',
              button1Label: 'Download Plan Summary',
              button1Url: 'https://files.agfinancial.org/Retirement/Plansummary.pdf',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.kind).toBe('intro');
    expect(introBlock?.settings?.heading).toBe('What’s one gotta do to get AGFinancial 403(b)?');
  });

  it('keeps customized 403(b) individual enrollment intros once the stale seed signature is gone', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'What’s one gotta do to get AGFinancial 403(b)?',
              bodyHtml: '<p>Custom explainer copy for a block-owned intro.</p>',
              body: 'Custom explainer copy for a block-owned intro.',
              button1Label: 'Talk to my consultant',
              button1Url: '/services/retirement/retirement-consultants',
              button1PageRef: '/services/retirement/retirement-consultants',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.settings?.heading).toBe('What’s one gotta do to get AGFinancial 403(b)?');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Custom explainer copy for a block-owned intro.</p>');
    expect(introBlock?.settings?.button1Label).toBe('Talk to my consultant');
    expectLinkJson(introBlock?.settings, 'button1LinkJson', {
      kind: 'internal',
      to: '/services/retirement/retirement-consultants',
    });
  });

  it('preserves unsupported leaked loans intro copy on 403(b) individual enrollment', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
              bodyHtml: '<p>What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.</p>',
              body: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.',
              button1Label: '',
              button1Url: '',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.kind).toBe('intro');
    expect(introBlock?.settings?.heading).toBe('The right loan can change everything.');
    expect(introBlock?.settings?.button1Label).toBe('');
  });

  it('drops stale generic page-content blocks from 403(b) individual enrollment while preserving the seeded block-only route structure', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: 'asdfsdfasdfsdfsdafsadfsadfsdf<p></p>',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [];
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro')).toBe(false);
    expect(blocks.some((block) => block?.id === 'confirm_eligibility' && block?.kind === 'card_grid')).toBe(false);
    expect(blocks.some((block) => block?.id === 'enrollment_steps' && block?.kind === 'card_grid')).toBe(false);
    expect(blocks.some((block) => block?.id === 'return_forms' && block?.kind === 'content')).toBe(false);
    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(false);
  });

  it('preserves the unsupported enrollment-help billboard during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Need help with enrollment?',
              body: 'Old billboard copy',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [];

    expect(blocks.some((block) => block?.id === 'billboard')).toBe(true);
    expect(blocks.some((block) => block?.id === 'request_form')).toBe(false);
  });

  it('keeps custom 403(b) individual enrollment billboards that are not the legacy help replacement', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Questions before you enroll?',
              bodyHtml: '<p>Custom billboard copy that should persist on the block-owned route.</p>',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [];
    const billboardBlock = blocks.find((block) => block?.id === 'billboard');

    expect(billboardBlock?.kind).toBe('billboard');
    expect(billboardBlock?.settings?.title).toBe('Questions before you enroll?');
    expect(billboardBlock?.settings?.bodyHtml).toBe('<p>Custom billboard copy that should persist on the block-owned route.</p>');
  });

  it('migrates legacy 403(b) group enrollment paths without appending missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero');

    expect(heroBlock).toBeUndefined();
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => block?.id === 'confirm_eligibility')).toBe(false);
    expect(normalized.blocksByPath['/services/retirement/403b-for-groups/403b-group-enrollment']).toBeUndefined();
    expect(normalized.pathAliases['/services/retirement/403b-for-groups/403b-group-enrollment']).toBe('/services/retirement/403b/403b-group-enrollment');
    expect(normalized.pathAliases['/services/retirement/403b-for-groups']).toBe('/services/retirement/403b/403b-group-enrollment');
    expect(normalized.pageHierarchy['/services/retirement/403b/403b-group-enrollment']?.parentPath).toBe('/services/retirement/403b');
    expect(normalized.pageHierarchy['/services/retirement/403b-for-groups']).toBeUndefined();
  });

  it('preserves unsupported leaked loans intro seed on 403(b) group enrollment', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
              bodyHtml: '<p>What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in these super simple easy-to-follow steps.</p>',
              body: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in these super simple easy-to-follow steps.',
              button1Label: '',
              button1Url: '',
              button2Label: '',
              button2Url: '',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.settings?.heading).toBe('The right loan can change everything.');
    expect(introBlock?.settings?.bodyHtml).toContain('What’s one gotta do to get AGFinancial 403(b)?');
    expect(introBlock?.settings?.button1Label).toBe('');
    expect(introBlock?.settings?.button2Label).toBe('');
  });

  it('keeps stored 403(b) group enrollment drafts without appending a missing request form block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'AGFinancial 403(b)',
              line2Text: 'Group Enrollment',
            },
          },
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'What’s one gotta do to get AGFinancial 403(b)?',
            },
          },
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(requestBlock).toBeUndefined();
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
  });

  it('preserves stored 403(b) group enrollment compliance billboard tones during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-group-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '403(b) Compliance Regulations',
              bgTone: 'grey',
              textTone: 'white',
            },
          },
        ],
      },
    });

    const complianceBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
          .find((block) => block?.id === 'billboard');

    expect(complianceBlock?.settings?.bgTone).toBe('grey');
    expect(complianceBlock?.settings?.textTone).toBe('white');
  });

  it('keeps customized 403(b) group enrollment compliance billboard tones once the route is block-owned', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-group-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '403(b) Compliance Regulations',
              bgTone: 'blue',
              textTone: 'white',
            },
          },
        ],
      },
    });

    const complianceBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'billboard');

    expect(complianceBlock?.settings?.bgTone).toBe('blue');
    expect(complianceBlock?.settings?.textTone).toBe('white');
  });

  it('repairs stored 403(b) group enrollment compliance buttons that saved PDF URLs as page refs', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-group-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '403(b) Compliance Regulations',
              buttonLabel: 'QCCO Guidelines',
              buttonUrl: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
              buttonPageRef: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
              button2Label: 'NQCCO Guidelines',
              button2Url: 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf',
              button2PageRef: 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf',
            },
          },
        ],
      },
    });

    const complianceBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'billboard');

    expectLinkJson(complianceBlock?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
    });
    expectLinkJson(complianceBlock?.settings, 'button2LinkJson', {
      kind: 'external',
      href: 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf',
    });
    expectNoSplitSettings(complianceBlock?.settings, ['buttonUrl', 'buttonPageRef', 'button2Url', 'button2PageRef']);
  });

  it('upgrades stale group term life request blocks back onto the standalone dynamic renderer path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            hidden: true,
            settings: {
              title: 'Request a quote for group life.',
              body: 'Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.',
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const requestBlock = groupLifeBlocks.find((block) => block?.id === 'request_form');

    expect(requestBlock).toBeTruthy();
    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.kind).toBe('request_form');
    expect(requestBlock?.hidden).toBe(false);
    expect(requestBlock?.settings?.sectionClassName).toBe('group-life-native-quote');
    expectNoTargetBridgeSettings(requestBlock);
    expect(requestBlock?.settings?.bgTone).toBe('blue');
    expect(requestBlock?.settings?.textTone).toBe('white');
    expect(requestBlock?.settings?.titleClassName).toBe('is-super-grey');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"start":20,"end":30,"className":"is-white"}]');
  });

  it('corrects stale white group term life request heading classes back to dark core copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            hidden: false,
            settings: {
              title: 'Request a quote for group life.',
              titleClassName: 'is-white',
              titleHighlightsJson: '[{"text":"group life","className":"is-white"}]',
              sectionClassName: 'group-life-native-quote',
              targetSectionKey: '',
              targetSectionClassName: '',
              bgTone: 'blue',
              textTone: 'white',
              step1Title: 'Contact info',
              step1FieldsJson: '[{"id":"contactFirstName","label":"Contact First Name","type":"text","required":true}]',
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const requestBlock = groupLifeBlocks.find((block) => block?.id === 'request_form');

    expect(requestBlock?.settings?.titleClassName).toBe('is-white');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"text":"group life","className":"is-white"}]');
  });

  it('upgrades stale investments feature-panel blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'cash_reserves',
            kind: 'feature_panel',
            mode: 'static',
            settings: {
              title: 'Old reserves block',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const featurePanelBlock = investmentsBlocks.find((block) => block?.id === 'cash_reserves');

    expect(featurePanelBlock).toBeTruthy();
    expect(featurePanelBlock?.mode).toBe('dynamic');
    expect(featurePanelBlock?.kind).toBe('feature_panel');
    expect(featurePanelBlock?.settings?.title).toBe('Old reserves block');
    expect(featurePanelBlock?.settings?.buttonLabel).toBe('Ready for the unexpected?');
    expectLinkJson(featurePanelBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/resources/article/church-cash-reserves',
    });
    expect(Array.isArray(featurePanelBlock?.editableFields) ? featurePanelBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('replaces the retirement consultants request form with the canonical seeded block', () => {
    const defaultRequestBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/retirement-consultants'] || [])
      .find((block) => block?.id === 'request_form');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/retirement-consultants': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            hidden: true,
            settings: {
              title: 'Request a quote',
              subtitle: 'Tell us what you need and we will respond quickly.',
              step1Title: 'Contact info',
              step1FieldsJson: '[{"id":"contactFirstName","label":"Contact First Name","type":"text","required":true}]',
              step2Title: 'Organization details',
              step2FieldsJson: '[{"id":"organization","label":"Organization","type":"text","required":true}]',
            },
          },
        ],
      },
    });

    const requestBlock = (normalized.blocksByPath['/services/retirement/retirement-consultants'] || [])
      .find((block) => block?.id === 'request_form');

    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.hidden).toBe(false);
    expect(requestBlock?.settings).toEqual(defaultRequestBlock?.settings);
    expect(requestBlock?.settings?.bgTone).toBe('blue');
    expect(requestBlock?.settings?.textTone).toBe('white');
    expect(requestBlock?.settings?.spaceBeforeRem).toBe(1.6);
    expect(requestBlock?.settings?.spaceAfterRem).toBe(1.6);
    expect(requestBlock?.settings?.sectionClassName).toBe('loans-consultant-native-contact');
  });

  it('replaces the life insurance quote request form with the canonical standalone seeded block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/life-insurance-quote': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            hidden: true,
            settings: {
              title: 'Request a Life Insurance Quote',
              targetSectionKey: 'class:insurance-native-life-quote',
              targetSectionClassName: 'insurance-native-life-quote',
              targetSectionIndex: 3,
              step1FieldsJson: '[{"id":"firstName","label":"First Name*","type":"text","required":true}]',
            },
          },
        ],
      },
    });

    const requestBlock = (normalized.blocksByPath['/services/insurance/life-insurance-quote'] || [])
      .find((block) => block?.id === 'request_form');

    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.hidden).toBe(true);
    expect(requestBlock?.settings?.title).toBe('Request a Life Insurance Quote');
    expect(requestBlock?.settings?.step1FieldsJson).toContain('firstName');
  });

  it('drops stale rates legal-copy blocks because disclosures are owned by Rates admin', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/rates': [
          {
            id: 'disclaimer',
            kind: 'legal_copy',
            mode: 'static',
            settings: {
              certificatesHtml: '<p>Custom certificates disclosure.</p>',
            },
          },
        ],
      },
    });

    const ratesBlocks = normalized.blocksByPath['/rates'] || [];
    const legalCopyBlock = ratesBlocks.find((block) => block?.id === 'disclaimer');

    expect(legalCopyBlock).toBeUndefined();
  });

  it('keeps the canonical investments growth feature block on the managed dynamic path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'growth_feature',
            kind: 'site_feature',
            mode: 'dynamic',
            settings: {
              featureId: 'investments_growth_feature',
              body: 'Already connected?',
              buttonLabel: 'Open dashboard',
              buttonUrl: 'https://secure.agfinancial.org/',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const growthFeatureBlock = investmentsBlocks.find((block) => block?.id === 'growth_feature');

    expect(growthFeatureBlock).toBeTruthy();
    expect(growthFeatureBlock?.mode).toBe('dynamic');
    expect(growthFeatureBlock?.kind).toBe('site_feature');
    expect(growthFeatureBlock?.templateId).toBeUndefined();
    expect(growthFeatureBlock?.presetId).toBeUndefined();
    expect(growthFeatureBlock?.settings?.body).toBe('Already connected?');
    expect(growthFeatureBlock?.settings?.buttonLabel).toBe('Open dashboard');
    expectLinkJson(growthFeatureBlock?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/',
    });
    expect(Array.isArray(growthFeatureBlock?.editableFields) ? growthFeatureBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('keeps explicit card-grid preset identity on the canonical family template id', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_apply',
            kind: 'card_grid',
            mode: 'dynamic',
            presetId: 'step-cards',
            settings: {
              card1Title: 'Check your eligibility',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const loanApplyBlock = retirementBlocks.find((block) => block?.id === 'loan_apply');

    expect(loanApplyBlock).toBeTruthy();
    expect(loanApplyBlock?.kind).toBe('card_grid');
    expect(loanApplyBlock?.templateId).toBe('card_grid');
    expect(loanApplyBlock?.presetId).toBe('step-cards');
    expect(loanApplyBlock?.settings?.card1Title).toBe('Check your eligibility');
    expect(loanApplyBlock?.settings?.columns).toBe('one');
  });

  it('preserves unsupported 403(b) loan-apply step cards during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_apply',
            kind: 'card_grid',
            mode: 'dynamic',
            presetId: 'step-cards',
            settings: {
              title: 'How to apply',
              columns: 'one',
              card1Title: '1) Review and understand the loan rules',
              card1Body: '',
              card2Title: '2) Log in to your profile',
              card2Body: '',
              card3Title: '3) Submit your application',
              card3Body: 'When logged-in, select your 403(b) account, then choose MANAGE MY RETIREMENT below the details. In the top menu, select Loan Services > Loan Modeling/Request to apply.',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const loanApplyBlock = retirementBlocks.find((block) => block?.id === 'loan_apply');

    expect(loanApplyBlock?.settings?.card1Title).toBe('1) Review and understand the loan rules');
    expect(loanApplyBlock?.settings?.card2Title).toBe('2) Log in to your profile');
    expect(loanApplyBlock?.settings?.card3Title).toBe('3) Submit your application');
    expect(loanApplyBlock?.settings?.card3Body).toContain('MANAGE MY RETIREMENT');
  });

  it('preserves 403(b) loan-apply order during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<div class="retirement-403b-loan-copy"><h2>403(b) Plan Loans</h2></div>',
            },
          },
          {
            id: 'start_enrollment',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Start enrollment',
            },
          },
          {
            id: 'housing_feature',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '<div>Housing</div>',
            },
          },
          {
            id: 'loan_apply',
            kind: 'card_grid',
            mode: 'dynamic',
            presetId: 'step-cards',
            settings: {
              title: 'How to apply',
              card1Title: '1',
              card1Body: 'Review the loan rules.',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    expect(retirementBlocks.findIndex((block) => block?.id === 'loan_apply')).toBeGreaterThan(
      retirementBlocks.findIndex((block) => block?.id === 'loan_details'),
    );
  });

  it('does not silently refresh canonical-looking 403(b) loan-details html when wrappers are missing', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <div class="retirement-403b-loan-copy">
                  <h2>403(b) Plan Loans</h2>
                  <p>A 403(b) loan allows you to borrow money from your own retirement savings without incurring early withdrawal tax penalties.</p>
                  <h3>Details</h3>
                  <p>The requested 403(b) loan amount cannot be less than $1,500.</p>
                  <ul><li>100% of the total vested account balance if less than $10,000</li></ul>
                </div>
              `,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('retirement-403b-loan-detail-card');
  });

  it('does not silently refresh stale canonical 403(b) loan html when followup copy is missing', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_details',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <div class="retirement-403b-loan-copy">
                  <h2>403(b) Plan Loans</h2>
                  <p>A 403(b) loan allows you to borrow money from your own retirement savings without incurring early withdrawal tax penalties. The interest paid on this type of loan goes back into your retirement savings.</p>
                  <div class="retirement-403b-loan-detail-card">
                    <h3>Details</h3>
                    <p>The requested 403(b) loan amount cannot be less than $1,500.</p>
                    <ul>
                      <li>100% of the total vested account balance if less than $10,000</li>
                    </ul>
                  </div>
                  <p class="retirement-403b-loan-fineprint">Members may have no more than two loans at a time.</p>
                  <p class="retirement-403b-loan-fineprint">Due to regulations issued by the U.S. Department of the Treasury, 403(b) plan loans issued after Dec. 31, 2008 require employer verification of loan qualifications.</p>
                </div>
              `,
            },
          },
        ],
      },
    });

    const loanDetailsBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'loan_details' && block?.kind === 'content');

    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('retirement-403b-loan-followup');
    expect(String(loanDetailsBlock?.settings?.html || '')).not.toContain('Contact your AGFinancial retirement consultant for more information.');
  });

  it('preserves unsupported 403(b) start enrollment settings during ordinary normalization', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'start_enrollment',
            kind: 'card_grid',
            mode: 'dynamic',
            settings: {
              title: 'Start enrollment',
              columns: 'two',
              cardStyle: 'card2',
              showTitleDivider: true,
              dividerTone: 'auto',
              card1Title: 'Enrollment for individuals.',
              card1ButtonLabel: 'Enroll now',
              card1ButtonPageRef: '/services/retirement/403b/403b-individual-enrollment',
              card2Title: 'Establish a plan as an employer.',
              card2ButtonLabel: 'Next steps',
              card2ButtonPageRef: '/services/retirement/403b/403b-group-enrollment',
            },
          },
        ],
      },
    });

    const enrollmentBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'start_enrollment' && block?.kind === 'card_grid');

    expect(enrollmentBlock?.settings?.showTitleDivider).toBe(true);
    expect(enrollmentBlock?.settings?.dividerTone).toBe('auto');
    expect(enrollmentBlock?.settings?.card1Title).toBe('Enrollment for individuals.');
  });

  it('does not silently replace stale 403(b) housing feature settings when rogue copy persists', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'housing_feature',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              title: "Retired Ministers' Housing Allowance",
              body: 'The unique benefit, which gives ministers a significant tax savings, is not available through secular 403(b) plans or IRAs.',
              html: `
                <div class="ret403b-housing-feature-shell">
                  <div class="ret403b-housing-feature-grid">
                    <div class="ret403b-housing-feature-compare">
                      <p>Compare your annual housing expenses to Fair Rental Value (FRV), and determine the maximum amount you may claim.</p>
                    </div>
                  </div>
                </div>
              `,
              buttonLabel: 'Use the quick check calculator',
              buttonPageRef: '/calculators',
            },
          },
        ],
      },
    });

    const housingFeatureBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'housing_feature' && block?.kind === 'content');

    expect(housingFeatureBlock?.settings?.title).toBe("Retired Ministers' Housing Allowance");
    expect(String(housingFeatureBlock?.settings?.body || '')).toContain('The unique benefit, which gives ministers');
    expect(String(housingFeatureBlock?.settings?.html || '')).toContain('Compare your annual housing expenses to Fair Rental Value');
  });

  it('does not silently replace blank migrated 403(b) housing columns with canonical copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'housing_feature',
            kind: 'columns',
            mode: 'dynamic',
            presetId: 'housing-allowance',
            settings: {
              columnsStyle: 'retirement',
              bgTone: 'white',
              col1Enabled: true,
              col1Type: 'photo',
              col1ImageUrl: 'housing-photo.jpg',
              col1ImageAlt: 'Living room with fireplace',
              col2Enabled: true,
              col2Type: 'text',
              col2Title: "Retired Ministers' Housing Allowance",
              col2Body: '',
              col2BodyHtml: '',
            },
          },
        ],
      },
    });

    const housingFeatureBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'housing_feature' && block?.kind === 'columns');

    expect(housingFeatureBlock?.presetId).toBe('housing-allowance');
    expect(housingFeatureBlock?.settings?.col2Title).toBe("Retired Ministers' Housing Allowance");
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).toBe('');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain('ret403b-housing-feature-bullet-intro');
  });

  it('does not silently replace blank-fragment 403(b) housing columns with canonical copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'housing_feature',
            kind: 'columns',
            mode: 'dynamic',
            presetId: 'housing-allowance',
            settings: {
              columnsStyle: 'retirement',
              bgTone: 'white',
              col1Enabled: true,
              col1Type: 'photo',
              col1ImageUrl: 'housing-photo.jpg',
              col1ImageAlt: 'Living room with fireplace',
              col2Enabled: true,
              col2Type: 'text',
              col2Title: "Retired Ministers' Housing Allowance",
              col2Body: '',
              col2BodyHtml: '<p><br></p>',
            },
          },
        ],
      },
    });

    const housingFeatureBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'housing_feature' && block?.kind === 'columns');

    expect(housingFeatureBlock?.presetId).toBe('housing-allowance');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).toBe('<p><br></p>');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain('ret403b-housing-feature-bullet-intro');
  });

  it('does not silently replace legacy migrated 403(b) housing columns with canonical copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'housing_feature',
            kind: 'columns',
            mode: 'dynamic',
            presetId: 'housing-allowance',
            settings: {
              columnsStyle: 'retirement',
              bgTone: 'white',
              col1Enabled: true,
              col1Type: 'photo',
              col1ImageUrl: 'housing-photo.jpg',
              col1ImageAlt: 'Living room with fireplace',
              col2Enabled: true,
              col2Type: 'text',
              col2Title: "Retired Ministers' Housing Allowance",
              col2Body: '',
              col2BodyHtml: `
                <p>The unique benefit, which gives ministers a significant tax savings, is not available through secular 403(b) plans or IRAs.</p>
                <p class="ret403b-housing-feature-bullet-intro">The maximum housing allowance exemption in any tax year is the lesser of:</p>
                <ul><li>Your actual expenditures</li></ul>
              `,
            },
          },
        ],
      },
    });

    const housingFeatureBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'housing_feature' && block?.kind === 'columns');

    expect(housingFeatureBlock?.presetId).toBe('housing-allowance');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain(
      'This unique IRS benefit, which gives ministers a significant tax savings',
    );
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).toContain('ret403b-housing-feature-bullet-intro');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).toContain('The maximum housing allowance exemption');
  });

  it('keeps explicit columns preset identity on the canonical family template id', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [
          {
            id: 'value_cards',
            kind: 'columns',
            mode: 'dynamic',
            presetId: 'value-cards',
            settings: {
              title: "There's more to every loan.",
              col1Title: 'Smart consulting.',
            },
          },
        ],
      },
    });

    const loansBlocks = normalized.blocksByPath['/services/loans'] || [];
    const valueCardsBlock = loansBlocks.find((block) => block?.id === 'value_cards');

    expect(valueCardsBlock).toBeTruthy();
    expect(valueCardsBlock?.kind).toBe('columns');
    expect(valueCardsBlock?.templateId).toBe('columns');
    expect(valueCardsBlock?.presetId).toBe('value-cards');
    expect(valueCardsBlock?.settings?.title).toBe("There's more to every loan.");
    expect(valueCardsBlock?.settings?.columnsStyle).toBe('loans-value');
  });

  it('upgrades stale investments calculator-cta blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'laddering',
            kind: 'calculator_cta',
            mode: 'static',
            settings: {
              title: 'Laddering Calculator',
              calculateLabel: 'Run calculation',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const calculatorCtaBlock = investmentsBlocks.find((block) => block?.id === 'laddering');

    expect(calculatorCtaBlock).toBeTruthy();
    expect(calculatorCtaBlock?.mode).toBe('dynamic');
    expect(calculatorCtaBlock?.kind).toBe('calculator_cta');
    expect(calculatorCtaBlock?.settings?.title).toBe('Laddering Calculator');
    expect(calculatorCtaBlock?.settings?.calculateLabel).toBe('Run calculation');
    expect(calculatorCtaBlock?.settings?.discussButtonLabel).toBe('Send');
    expect(Array.isArray(calculatorCtaBlock?.editableFields) ? calculatorCtaBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale retirement split-panel blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement': [
          {
            id: 'split_options',
            kind: 'split_panel',
            mode: 'static',
            settings: {
              leftTitle: 'Updated IRA heading',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement'] || [];
    const splitPanelBlock = retirementBlocks.find((block) => block?.id === 'split_options');

    expect(splitPanelBlock).toBeTruthy();
    expect(splitPanelBlock?.mode).toBe('dynamic');
    expect(splitPanelBlock?.kind).toBe('split_panel');
    expect(splitPanelBlock?.settings?.leftTitle).toBe('Updated IRA heading');
    expectLinkJson(splitPanelBlock?.settings, 'rightButtonLinkJson', {
      kind: 'internal',
      to: '/services/retirement/409a',
    });
    expect(Array.isArray(splitPanelBlock?.editableFields) ? splitPanelBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale retirement landing CTA settings to state plus one message field', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              bodyHtml: "<p>Let's explore together.</p>",
              field1Label: 'Name',
              field1Type: 'text',
              field2Label: 'Email',
              field2Type: 'email',
              field3Label: 'Phone',
              field3Type: 'tel',
              field4Enabled: true,
              field4Label: 'Message',
              field4Type: 'textarea',
              field4Placeholder: 'What would you like to discuss?',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement'] || [];
    const ctaBlock = retirementBlocks.find((block) => block?.id === 'cta_form');

    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.bodyHtml).toBe('');
    const fields = getCtaFields(ctaBlock);
    expect(fields[3]).toMatchObject({ type: 'select', label: 'State' });
    expect(fields[3]?.options).toContainEqual({ value: 'TX', label: 'Texas' });
    expect(fields[4]).toMatchObject({ type: 'textarea', label: 'Message' });
  });

  it('upgrades stale home services-grid blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'services_grid',
            kind: 'services_grid',
            mode: 'static',
            settings: {
              heading: 'Updated home services heading',
              card1Title: 'Church Loans',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const servicesGridBlock = homeBlocks.find((block) => block?.id === 'services_grid');

    expect(servicesGridBlock).toBeTruthy();
    expect(servicesGridBlock?.mode).toBe('dynamic');
    expect(servicesGridBlock?.kind).toBe('services_grid');
    expect(servicesGridBlock?.settings?.heading).toBe('Updated home services heading');
    expect(servicesGridBlock?.settings?.card1Title).toBe('Church Loans');
    expectLinkJson(servicesGridBlock?.settings, 'browseLinkJson', {
      kind: 'internal',
      to: '/services',
    });
    expect(Array.isArray(servicesGridBlock?.editableFields) ? servicesGridBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale home impact-stat blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'impact_stat',
            kind: 'impact_stat',
            mode: 'static',
            settings: {
              titlePrefix: 'What happens here',
              stat1Value: '$12 billion',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const impactStatBlock = homeBlocks.find((block) => block?.id === 'impact_stat');

    expect(impactStatBlock).toBeTruthy();
    expect(impactStatBlock?.mode).toBe('dynamic');
    expect(impactStatBlock?.kind).toBe('impact_stat');
    expect(impactStatBlock?.settings?.titlePrefix).toBe('What happens here');
    expect(impactStatBlock?.settings?.stat1Value).toBe('$12 billion');
    expectLinkJson(impactStatBlock?.settings, 'ctaLinkJson', {
      kind: 'internal',
      to: '/about-us/impact',
    });
    expect(Array.isArray(impactStatBlock?.editableFields) ? impactStatBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('keeps home managed billboard blocks on the canonical dynamic path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'home_ministry_allies',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Updated housing title',
              body: 'Updated housing body',
            },
          },
          {
            id: 'home_do_the_math',
            kind: 'billboard',
            mode: 'static',
            settings: {
              title: 'Updated math title',
              body: 'Updated math body',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const columnsMhaBlock = homeBlocks.find((block) => block?.id === 'home_ministry_allies');
    const columnsMathBlock = homeBlocks.find((block) => block?.id === 'home_do_the_math');

    expect(columnsMhaBlock).toBeTruthy();
    expect(columnsMhaBlock?.mode).toBe('dynamic');
    expect(columnsMhaBlock?.kind).toBe('billboard');
    expect(columnsMhaBlock?.settings?.title).toBe('Updated housing title');
    expect(columnsMhaBlock?.settings?.body).toBe('Updated housing body');
    expect(Array.isArray(columnsMhaBlock?.editableFields) ? columnsMhaBlock.editableFields.length : 0).toBeGreaterThan(0);

    expect(columnsMathBlock).toBeTruthy();
    expect(columnsMathBlock?.mode).toBe('dynamic');
    expect(columnsMathBlock?.kind).toBe('billboard');
    expect(columnsMathBlock?.settings?.title).toBe('Updated math title');
    expect(columnsMathBlock?.settings?.body).toBe('Updated math body');
    expect(Array.isArray(columnsMathBlock?.editableFields) ? columnsMathBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('drops an empty impact page-content block without appending missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/about-us/impact': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
              body: '',
            },
          },
        ],
      },
    });

    const impactBlocks = normalized.blocksByPath['/about-us/impact'] || [];

    expect(impactBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(false);
    expect(impactBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(false);
    expect(impactBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('drops an empty invest-by-mail page-content block without appending missing starter blocks', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments/invest-by-mail': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
              body: '',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/investments/invest-by-mail'] || [];

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(false);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

});
