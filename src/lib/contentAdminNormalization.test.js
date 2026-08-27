import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { normalizeSharedState } from '../../dev-server/contentAdminStore';
import {
  CONTENT_ADMIN_NORMALIZATION_VERSION,
  compactContentAdminBlock,
  compactContentAdminRecord,
  normalizeContentAdminState,
  normalizeContentAdminRecord,
} from './contentAdminNormalization';

function block(id, overrides = {}) {
  return {
    id,
    kind: 'content',
    mode: 'dynamic',
    settings: { bodyHtml: `<p>${id}</p>` },
    ...overrides,
  };
}

function state(blocks, overrides = {}) {
  return {
    pageHierarchy: {
      '/test': { path: '/test', title: 'Test' },
    },
    blocksByPath: { '/test': blocks },
    pathAliases: {},
    collaborationByPath: {},
    ...overrides,
  };
}

function normalizeInBoth(input) {
  const browser = normalizeStoredConfig(input);
  const server = normalizeSharedState(input);
  expect(browser).toEqual(server);
  return browser;
}

describe('content-admin normalization parity', () => {
  it('has a versioned shared implementation', () => {
    expect(CONTENT_ADMIN_NORMALIZATION_VERSION).toBeGreaterThan(0);
    expect(normalizeContentAdminState(state([]))).toEqual(normalizeInBoth(state([])));
  });

  it.each([
    ['ordinary editable copy', state([block('copy', { settings: { bodyHtml: '<p>Edited copy</p>' } })])],
    ['removed blocks', state([block('first')])],
    ['reordered blocks', state([block('second'), block('first')])],
    ['admin-added blocks', state([block('first'), block('admin-added')])],
    ['current schema records', state([block('current')])],
  ])('normalizes %s identically in browser and server', (_label, input) => {
    normalizeInBoth(input);
  });

  it('upgrades the legacy IRA comparison table to the reusable card chart shape', () => {
    const input = state([], {
      blocksByPath: {
        '/services/retirement/iras': [block('comparison_table', {
          settings: {
            title: 'The differences. At a glance.',
            tableHeadersJson: ['Traditional IRA', 'Roth IRA'],
            tableRowsJson: [['Traditional bullet', 'Roth bullet']],
          },
        })],
      },
    });
    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/retirement/iras'][0]).toMatchObject({
      id: 'comparison_table',
      kind: 'card_chart',
      settings: {
        cardCount: '2',
        card1Title: 'Traditional IRA',
        card1Bullets: 'Traditional bullet',
        card2Title: 'Roth IRA',
        card2Bullets: 'Roth bullet',
      },
    });
    expect(normalized.blocksByPath['/services/retirement/iras'][0].settings).not.toHaveProperty('tableRowsJson');
  });

  it('converts the legacy 403(b) page-content rate widget to the shared Rates variant', () => {
    const input = state([], {
      pageHierarchy: {
        '/services/retirement/403b': { path: '/services/retirement/403b', title: '403(b)' },
      },
      blocksByPath: {
        '/services/retirement/403b': [block('rate_table', {
          settings: {
            title: '403(b) Investment Rate',
            widget: 'retirement-403b-rate-table',
            sectionClassName: 'retirement-403b-native-rate-table',
          },
        })],
      },
    });

    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/retirement/403b'][0]).toMatchObject({
      id: 'rate_table',
      kind: 'rates',
      variant: 'inline',
      settings: {
        dataset: '403b',
        panelId: 'rates-403b-investment-rate',
        anchorId: '403b-investment-rate',
        displayName: '403(b) Investment Rate',
        titleClassName: 'is-atlantean',
      },
    });
  });

  it('converts the legacy IRA rates widget to the shared IRA Rates block', () => {
    const input = state([], {
      pageHierarchy: {
        '/services/retirement/iras': { path: '/services/retirement/iras', title: 'IRAs' },
      },
      blocksByPath: {
        '/services/retirement/iras': [block('rate_table', {
          settings: {
            title: 'IRA Investment Rates',
            widget: 'retirement-ira-rate-table',
            paddingTopRem: 5.8,
            sectionClassName: 'retirement-ira-native-rates',
          },
        })],
      },
    });

    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/retirement/iras'][0]).toMatchObject({
      id: 'rate_table',
      name: 'IRA Investment Rates',
      kind: 'rates',
      variant: 'inline',
      settings: {
        dataset: 'ira',
        panelId: 'rates-ira',
        anchorId: 'ira-rates',
        displayName: 'IRA Investment Rates',
        paddingTopRem: 5.8,
      },
    });
  });

  it('converts legacy IRA contribution limits into the shared two-card chart', () => {
    const input = state([], {
      pageHierarchy: {
        '/services/retirement/iras': { path: '/services/retirement/iras', title: 'IRAs' },
      },
      blocksByPath: {
        '/services/retirement/iras': [block('contribution_limits', {
          settings: {
            title: 'Roth and Traditional IRA Contribution Limits',
            sectionClassName: 'retirement-ira-native-limits',
            tableHeadersJson: ['Age', '2025', '2024'],
            tableRowsJson: [
              ['Age 49 and under', '100% of compensation, up to $7,000', '100% of compensation, up to $7,000'],
              ['Age 50 and older', '100% of compensation, up to $8,000', '100% of compensation, up to $8,000'],
            ],
            fineprint: ['Contact your tax advisor.'],
            fineprintDisclosureId: 'retirement-ira-contribution-limits-disclosure',
          },
        })],
      },
    });

    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/retirement/iras'][0]).toMatchObject({
      id: 'contribution_limits',
      name: 'IRA Contribution Limits Chart',
      kind: 'card_chart',
      variant: 'default',
      settings: {
        cardCount: '2',
        card1Title: '2025',
        card1Color: 'atlantean',
        card1Bullets: 'Age 49 and under: 100% of compensation, up to $7,000\nAge 50 and older: 100% of compensation, up to $8,000',
        card2Title: '2024',
        card2Color: 'mango',
        card2Bullets: 'Age 49 and under: 100% of compensation, up to $7,000\nAge 50 and older: 100% of compensation, up to $8,000',
        anchorId: 'IRA-contribution-limits',
        fineprintDisclosureId: 'retirement-ira-contribution-limits-disclosure',
      },
    });
    expect(normalized.blocksByPath['/services/retirement/iras'][0].settings).not.toHaveProperty('tableRowsJson');
  });

  it('converts legacy 403(b) contribution limits into the shared two-card chart', () => {
    const input = state([], {
      pageHierarchy: {
        '/services/retirement/403b': { path: '/services/retirement/403b', title: '403(b)' },
      },
      blocksByPath: {
        '/services/retirement/403b': [block('contribution_limits', {
          settings: {
            title: 'Annual Contribution Limits',
            sectionClassName: 'retirement-child-native-table',
            tableHeadersJson: ['403(b) Contribution Limit', '2026', '2025'],
            tableRowsJson: [
              ['Under age 50', '$24,500', '$23,500'],
              ['Overall limit', '$72,000', '$70,000'],
            ],
            tableValueAlignment: 'left',
            fineprint: ['Contact your advisor.'],
            fineprintDisclosureId: 'retirement-403b-contribution-limits-disclosure',
          },
        })],
      },
    });

    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/retirement/403b'][0]).toMatchObject({
      id: 'contribution_limits',
      name: 'Annual Contribution Limits Chart',
      kind: 'card_chart',
      settings: {
        cardCount: '2',
        card1Title: '2026',
        card1Color: 'atlantean',
        card1Bullets: 'Under age 50: $24,500\nOverall limit: $72,000',
        card2Title: '2025',
        card2Color: 'mango',
        card2Bullets: 'Under age 50: $23,500\nOverall limit: $70,000',
        fineprintDisclosureId: 'retirement-403b-contribution-limits-disclosure',
        sectionClassName: 'retirement-child-native-table retirement-403b-native-contribution-limits',
      },
    });
    expect(normalized.blocksByPath['/services/retirement/403b'][0].settings).not.toHaveProperty('tableRowsJson');
  });

  it('upgrades the charitable remainder trust type cards to the reusable card chart shape', () => {
    const input = state([], {
      blocksByPath: {
        '/services/planned-giving/charitable-trusts': [block('remainder_trust_type_cards', {
          kind: 'card_grid',
          settings: {
            sectionClassName: 'legacy-child-native-trusts-crt-types',
            card1Title: 'Charitable Remainder Unitrust (CRUT)',
            card1ListJson: '["Annual payout is determined by donor","Income may fluctuate from year to year"]',
            card2Title: 'Charitable Remainder Annuity (CRAT)',
            card2ListJson: '["Donor receives a fixed payment"]',
          },
        })],
      },
    });
    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/planned-giving/charitable-trusts'][0]).toMatchObject({
      id: 'remainder_trust_type_cards',
      kind: 'card_chart',
      name: 'Remainder Trust Type Chart',
      settings: {
        cardCount: '2',
        card1Color: 'atlantean',
        card1Bullets: 'Annual payout is determined by donor\nIncome may fluctuate from year to year',
        card2Color: 'mango',
        card2Bullets: 'Donor receives a fixed payment',
      },
    });
  });

  it('upgrades the charitable lead trust type cards to the reusable card chart shape', () => {
    const input = state([], {
      blocksByPath: {
        '/services/planned-giving/charitable-trusts': [block('lead_trust_type_cards', {
          kind: 'card_grid',
          settings: {
            card1Title: 'Grantor Lead Trust',
            card1ListJson: '["Donor receives remainder of trust after stated period of time"]',
            card2Title: 'Non-Grantor Lead Trust',
            card2ListJson: '["Permanent transfer of asset","Income is taxed at the trust level each year"]',
          },
        })],
      },
    });
    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/services/planned-giving/charitable-trusts'][0]).toMatchObject({
      id: 'lead_trust_type_cards',
      kind: 'card_chart',
      name: 'Lead Trust Type Chart',
      settings: {
        card1Bullets: 'Donor receives remainder of trust after stated period of time',
        card2Bullets: 'Permanent transfer of asset\nIncome is taxed at the trust level each year',
      },
    });
  });

  it('normalizes legacy fields and preset-owned presentation fields identically', () => {
    const input = state([
      block('legacy-link', {
        editableFields: [{
          id: 'buttonUrl',
          type: 'route_link',
          routeRefFieldId: 'buttonPageRef',
          openInNewWindowFieldId: 'buttonOpenInNewWindow',
        }],
        settings: {
          buttonPageRef: '/contact',
          buttonUrl: '',
          buttonOpenInNewWindow: 'false',
        },
      }),
      block('preset', {
        kind: 'billboard',
        settings: {
          sectionClassName: 'legacy-giving-joy',
          titleFontFamily: 'avenir',
        },
      }),
    ]);
    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/test'][0].settings.buttonLinkJson).toContain('/contact');
    expect(normalized.blocksByPath['/test'][0].editableFields).toEqual([
      expect.objectContaining({ id: 'buttonLinkJson' }),
    ]);
    expect(normalized.blocksByPath['/test'][1].settings.titleFontFamily).toBe('helv');
  });

  it('canonicalizes legacy CTA without merging site-feature content', () => {
    const normalized = normalizeInBoth(state([
      block('legacy-cta', {
        kind: 'cta_band',
        templateId: 'cta_band',
        settings: { title: 'Keep this CTA', body: 'Keep this copy.' },
      }),
      block('legacy-feature', {
        kind: 'site_feature',
        templateId: 'site_feature',
        settings: { featureId: 'home_impact_story', headline: 'Keep this headline' },
      }),
    ]));

    expect(normalized.blocksByPath['/test']).toEqual([
      expect.objectContaining({
        id: 'legacy-cta',
        kind: 'billboard',
        templateId: 'billboard',
        presetId: 'default',
        settings: { title: 'Keep this CTA', body: 'Keep this copy.' },
      }),
      expect.objectContaining({
        id: 'legacy-feature',
        kind: 'site_feature',
        templateId: 'site_feature',
        settings: { featureId: 'home_impact_story', headline: 'Keep this headline' },
      }),
    ]);
  });

  it('normalizes optional admin block names as metadata without moving them into settings', () => {
    const normalized = normalizeInBoth(state([
      block('named', {
        kind: 'billboard',
        adminName: `  Pricing   ${'x'.repeat(60)} `,
      }),
    ]));

    expect(normalized.blocksByPath['/test'][0].adminName).toHaveLength(40);
    expect(normalized.blocksByPath['/test'][0].adminName).toMatch(/^Pricing x/);
    expect(normalized.blocksByPath['/test'][0].settings).not.toHaveProperty('adminName');
  });

  it('does not throw or invent inventory for malformed records', () => {
    const normalized = normalizeInBoth({
      pageHierarchy: {},
      blocksByPath: { '/test': [null, 'bad', { id: 'kept', settings: null }] },
      pathAliases: {},
      collaborationByPath: {},
    });
    expect(normalized.blocksByPath['/test']).toHaveLength(3);
    expect(normalized.blocksByPath['/test'][2]).toMatchObject({ id: 'kept', settings: null });
  });

  it('removes retired static block records without restoring a replacement', () => {
    const normalized = normalizeInBoth(state([
      block('dynamic', { settings: { bodyHtml: '<p>Keep this copy.</p>' } }),
      block('retired-static', {
        mode: 'static',
        settings: { bodyHtml: '<p>Never render this fallback.</p>' },
      }),
    ]));

    expect(normalized.blocksByPath['/test'].map(({ id }) => id)).toEqual(['dynamic']);
    expect(normalized.blocksByPath['/test'][0].settings.bodyHtml).toBe('<p>Keep this copy.</p>');
  });

  it('removes registry-backed editor catalogs without touching unknown legacy blocks', () => {
    const known = compactContentAdminBlock(block('known', {
      editableFields: [{ id: 'title' }],
    }));
    const legacy = compactContentAdminBlock(block('legacy', {
      kind: 'legacy_custom',
      editableFields: [{ id: 'custom' }],
    }));

    expect(known).not.toHaveProperty('editableFields');
    expect(legacy.editableFields).toEqual([{ id: 'custom' }]);
  });

  it('compacts state and base snapshots while preserving record metadata', () => {
    const input = {
      initialized: true,
      updatedAt: 123,
      state: state([block('state', { editableFields: [{ id: 'title' }] })]),
      baseSnapshot: state([block('published', { editableFields: [{ id: 'title' }] })]),
    };
    const compacted = compactContentAdminRecord(input);

    expect(compacted.updatedAt).toBe(123);
    expect(compacted.state.blocksByPath['/test'][0]).not.toHaveProperty('editableFields');
    expect(compacted.baseSnapshot.blocksByPath['/test'][0]).not.toHaveProperty('editableFields');
  });
});

describe('content-admin normalization preservation', () => {
  it('preserves edited copy, deletion, order, added blocks, and selected kind', () => {
    const input = state([
      block('second', { kind: 'billboard', settings: { bodyHtml: '<p>Admin copy</p>' } }),
      block('admin-added'),
    ]);
    const normalized = normalizeInBoth(input);
    expect(normalized.blocksByPath['/test'].map(({ id }) => id)).toEqual(['second', 'admin-added']);
    expect(normalized.blocksByPath['/test'][0]).toMatchObject({
      kind: 'billboard',
      settings: { bodyHtml: '<p>Admin copy</p>' },
    });
    expect(normalized.blocksByPath['/test']).not.toContainEqual(expect.objectContaining({ id: 'first' }));
  });

  it('does not reintroduce blueprint defaults during ordinary normalization', () => {
    const normalized = normalizeContentAdminState(state([]));
    expect(normalized.blocksByPath['/test']).toEqual([]);
    expect(Object.keys(normalized.pageHierarchy)).toEqual(['/test']);
  });

  it('preserves active edits through record reload normalization', () => {
    const record = {
      initialized: true,
      state: state([
        block('second', { kind: 'billboard', settings: { title: '', bodyHtml: '<p>Edited body</p>' } }),
        block('admin-added', { settings: { bodyHtml: '<p>New block</p>' } }),
      ]),
      baseSnapshot: state([]),
    };

    const reloaded = normalizeContentAdminRecord(JSON.parse(JSON.stringify(record)));
    expect(reloaded.state.blocksByPath['/test'].map(({ id }) => id)).toEqual(['second', 'admin-added']);
    expect(reloaded.state.blocksByPath['/test'][0]).toMatchObject({
      kind: 'billboard',
      settings: { title: '', bodyHtml: '<p>Edited body</p>' },
    });
    expect(reloaded.state.blocksByPath['/test']).not.toContainEqual(expect.objectContaining({ id: 'first' }));
    expect(reloaded.baseSnapshot.blocksByPath['/test']).toEqual([]);
  });
});
