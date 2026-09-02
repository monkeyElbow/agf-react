import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  CALCULATOR_INTRO_BLOCK_ID,
  CALCULATOR_INTRO_KIND,
  CALCULATOR_WIDGET_BLOCK_ID,
  CALCULATOR_WIDGET_KIND,
  normalizeCalculatorIntroBlock,
  normalizeCalculatorWidgetBlock,
} from '../lib/calculatorWidgetIdentity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const STANDALONE_CALCULATOR_PATHS = Object.freeze([
  '/calculators/emergency-fund',
  '/calculators/increased-contribution',
  '/calculators/ministers-housing-allowance-quick-check',
  '/calculators/net-worth',
]);

const RETIRED_PAGE_CONTENT_SETTING_KEYS = Object.freeze([
  'subtitle',
  'html',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
  'buttonOpenInNewWindow',
  'buttonDocumentId',
  'addressClassName',
  'addressTitle',
  'addressLines',
  'tableHeadersJson',
  'tableRowsJson',
  'tableValueAlignment',
  'tableChartId',
  'fineprint',
  'fineprintDisclosureId',
]);

const RETIRED_INTRO_PAGE_CONTENT_SETTING_KEYS = Object.freeze([
  'subtitle',
  'html',
  'widget',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
  'buttonOpenInNewWindow',
  'buttonDocumentId',
  'addressClassName',
  'addressTitle',
  'addressLines',
  'tableHeadersJson',
  'tableRowsJson',
  'tableValueAlignment',
  'tableChartId',
  'fineprint',
  'fineprintDisclosureId',
]);

const CALCULATOR_TOOL_UTILITY_HEADER_CLASS = 'calculator-tool-native-page-head native-functional-page-head native-functional-page-head--utility';

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function collectCalculatorBlocksFromSnapshotRoot(root = {}, blockId) {
  return [
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.blocksByPath?.[pathname]) ? root.blocksByPath[pathname] : [])
        .filter((block) => block?.id === blockId)
        .map((block) => ({ pathname, source: 'blocksByPath', block }))
    )),
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.revisionsByPath?.[pathname]) ? root.revisionsByPath[pathname] : [])
        .flatMap((revision, revisionIndex) => (
          (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [])
            .filter((block) => block?.id === blockId)
            .map((block) => ({ pathname, source: `revision:${revisionIndex}`, block }))
        ))
    )),
  ];
}

function collectStandaloneCalculatorBlocks(root = {}) {
  return [
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.blocksByPath?.[pathname]) ? root.blocksByPath[pathname] : [])
        .map((block) => ({ pathname, source: 'blocksByPath', block }))
    )),
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.revisionsByPath?.[pathname]) ? root.revisionsByPath[pathname] : [])
        .flatMap((revision, revisionIndex) => (
          (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [])
            .map((block) => ({ pathname, source: `revision:${revisionIndex}`, block }))
        ))
    )),
  ];
}

function expectCalculatorIntroShape(entries) {
  expect(entries.length).toBeGreaterThan(0);
  entries.forEach(({ pathname, source, block }) => {
    expect(block?.kind, `${pathname} ${source} kind`).toBe(CALCULATOR_INTRO_KIND);
    expect(block?.name, `${pathname} ${source} name`).toBe('Calculator Intro');
    expect(Object.keys(block?.settings || {}).sort(), `${pathname} ${source} settings`).toEqual([
      'anchorId',
      'body',
      'contentMaxWidthPx',
      'copyWrap',
      'fullBleed',
      'paddingBottomRem',
      'paddingTopRem',
      'sectionClassName',
      'spaceAfterRem',
      'spaceBeforeRem',
      'title',
      'titleClassName',
      'titleHighlightsJson',
    ]);
    if (source === 'blueprint' || source === 'normalizer') {
      const expectedFields = [
        'title',
        'titleClassName',
        'titleHighlightsJson',
        'body',
        'fullBleed',
        'spaceBeforeRem',
        'spaceAfterRem',
        'paddingTopRem',
        'paddingBottomRem',
        'contentMaxWidthPx',
        'copyWrap',
        'anchorId',
        'sectionClassName',
        ...(source === 'blueprint' ? ['bgTone', 'backgroundEffectsJson'] : []),
      ];
      expect((block?.editableFields || []).map((field) => field.id), `${pathname} ${source} editable fields`).toEqual(expectedFields);
    }
    expect((block?.editableFields || []).some((field) => field.label === 'Page Content HTML'), `${pathname} ${source} page content label`).toBe(false);
    expect(RETIRED_INTRO_PAGE_CONTENT_SETTING_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(block?.settings || {}, key)), `${pathname} ${source} retired settings`).toEqual([]);
  });
}

function expectCalculatorWidgetShape(entries) {
  expect(entries.length).toBeGreaterThan(0);
  entries.forEach(({ pathname, source, block }) => {
    expect(block?.kind, `${pathname} ${source} kind`).toBe(CALCULATOR_WIDGET_KIND);
    expect(block?.name, `${pathname} ${source} name`).toBe('Calculator Tool');
    expect(Object.keys(block?.settings || {}).sort(), `${pathname} ${source} settings`).toEqual([
      'anchorId',
      'contentMaxWidthPx',
      'fullBleed',
      'paddingBottomRem',
      'paddingTopRem',
      'sectionClassName',
      'spaceAfterRem',
      'spaceBeforeRem',
      'widget',
    ]);
    if (source === 'blueprint' || source === 'normalizer') {
      const expectedFields = [
        'widget',
        'fullBleed',
        'spaceBeforeRem',
        'spaceAfterRem',
        'paddingTopRem',
        'paddingBottomRem',
        'contentMaxWidthPx',
        'anchorId',
        'sectionClassName',
        ...(source === 'blueprint' ? ['bgTone', 'backgroundEffectsJson'] : []),
      ];
      expect((block?.editableFields || []).map((field) => field.id), `${pathname} ${source} editable fields`).toEqual(expectedFields);
    }
    expect((block?.editableFields || []).some((field) => field.label === 'Page Content HTML'), `${pathname} ${source} page content label`).toBe(false);
    expect(RETIRED_PAGE_CONTENT_SETTING_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(block?.settings || {}, key)), `${pathname} ${source} retired settings`).toEqual([]);
  });
}

describe('calculator page-content ghost guardrail', () => {
  it('keeps standalone calculator blueprints on utility headers instead of hero blocks', () => {
    STANDALONE_CALCULATOR_PATHS.forEach((pathname) => {
      const blocks = contentBlockBlueprintsByPath[pathname] || [];
      const utilityHeader = blocks.find((block) => block?.id === 'utility_header');

      expect(blocks.some((block) => block?.id === 'hero' || block?.kind === 'hero'), pathname).toBe(false);
      expect(utilityHeader, pathname).toMatchObject({
        kind: 'content',
        mode: 'dynamic',
        settings: {
          headingLevel: 'h1',
          sectionClassName: CALCULATOR_TOOL_UTILITY_HEADER_CLASS,
          justify: 'left',
        },
      });
    });
  });

  it('keeps standalone calculator blueprints out of the Page Content block kind and fields', () => {
    const introEntries = STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (contentBlockBlueprintsByPath[pathname] || [])
        .filter((block) => block?.id === CALCULATOR_INTRO_BLOCK_ID)
        .map((block) => ({ pathname, source: 'blueprint', block }))
    ));
    const widgetEntries = STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (contentBlockBlueprintsByPath[pathname] || [])
        .filter((block) => block?.id === CALCULATOR_WIDGET_BLOCK_ID)
        .map((block) => ({ pathname, source: 'blueprint', block }))
    ));

    expectCalculatorIntroShape(introEntries);
    expectCalculatorWidgetShape(widgetEntries);
  });

  it('keeps shared, base, revision, and seed standalone calculator snapshots scrubbed', () => {
    const shared = readJson('dev-data/content-admin-shared.json');
    const seed = readJson('dev-data/content-admin-seed-baseline.json');
    const introEntries = [
      ...collectCalculatorBlocksFromSnapshotRoot(shared.state, CALCULATOR_INTRO_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(shared.baseSnapshot, CALCULATOR_INTRO_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(shared, CALCULATOR_INTRO_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(seed.seedState, CALCULATOR_INTRO_BLOCK_ID),
    ];
    const widgetEntries = [
      ...collectCalculatorBlocksFromSnapshotRoot(shared.state, CALCULATOR_WIDGET_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(shared.baseSnapshot, CALCULATOR_WIDGET_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(shared, CALCULATOR_WIDGET_BLOCK_ID),
      ...collectCalculatorBlocksFromSnapshotRoot(seed.seedState, CALCULATOR_WIDGET_BLOCK_ID),
    ];
    const allStandaloneEntries = [
      ...collectStandaloneCalculatorBlocks(shared.state),
      ...collectStandaloneCalculatorBlocks(shared.baseSnapshot),
      ...collectStandaloneCalculatorBlocks(shared),
      ...collectStandaloneCalculatorBlocks(seed.seedState),
    ];

    expectCalculatorIntroShape(introEntries);
    expectCalculatorWidgetShape(widgetEntries);
    expect(
      allStandaloneEntries.filter(({ block }) => block?.id === 'hero' || block?.kind === 'hero'),
    ).toEqual([]);
    STANDALONE_CALCULATOR_PATHS.forEach((pathname) => {
      const utilityHeaders = allStandaloneEntries.filter(({ pathname: entryPath, block }) => (
        entryPath === pathname && block?.id === 'utility_header'
      ));
      expect(utilityHeaders.length, pathname).toBeGreaterThan(0);
      utilityHeaders.forEach(({ block, source }) => {
        expect(block?.kind, `${pathname} ${source} utility kind`).toBe('content');
        expect(block?.settings?.headingLevel, `${pathname} ${source} heading level`).toBe('h1');
        expect(block?.settings?.sectionClassName, `${pathname} ${source} section class`).toBe(CALCULATOR_TOOL_UTILITY_HEADER_CLASS);
        expect(block?.settings?.justify, `${pathname} ${source} justify`).toBe('left');
      });
    });
  });

  it('normalizes stale content-kind standalone calculator blocks before they can re-enter state', () => {
    const staleIntroBlock = {
      id: CALCULATOR_INTRO_BLOCK_ID,
      name: 'Page Content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Take inventory of your financial reality.',
        body: '',
        html: '',
        widget: '',
        fullBleed: false,
        paddingTopRem: 1.25,
        sectionClassName: 'calculator-tool-shell',
      },
      editableFields: [
        { id: 'html', label: 'Page Content HTML', type: 'html' },
      ],
    };
    const staleWidgetBlock = {
      id: CALCULATOR_WIDGET_BLOCK_ID,
      name: 'Page Content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: '',
        body: '',
        html: '',
        widget: 'net-worth-calculator',
        fullBleed: false,
        paddingTopRem: 1.25,
        sectionClassName: 'calculator-tool-shell calculator-tool-widget',
      },
      editableFields: [
        { id: 'html', label: 'Page Content HTML', type: 'html' },
      ],
    };

    expectCalculatorIntroShape([
      {
        pathname: '/calculators/net-worth',
        source: 'normalizer',
        block: normalizeCalculatorIntroBlock(staleIntroBlock),
      },
    ]);
    expectCalculatorWidgetShape([
      {
        pathname: '/calculators/net-worth',
        source: 'normalizer',
        block: normalizeCalculatorWidgetBlock(staleWidgetBlock),
      },
    ]);
  });
});
