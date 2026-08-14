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
