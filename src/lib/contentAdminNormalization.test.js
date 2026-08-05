import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { normalizeSharedState } from '../../dev-server/contentAdminStore';
import {
  CONTENT_ADMIN_NORMALIZATION_VERSION,
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
