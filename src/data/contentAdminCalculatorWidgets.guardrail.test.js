import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import {
  CALCULATOR_WIDGET_BLOCK_ID,
  CALCULATOR_WIDGET_KIND,
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
  'title',
  'titleClassName',
  'titleHighlightsJson',
  'subtitle',
  'body',
  'html',
  'copyWrap',
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

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function collectCalculatorToolBlocksFromSnapshotRoot(root = {}) {
  return [
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.blocksByPath?.[pathname]) ? root.blocksByPath[pathname] : [])
        .filter((block) => block?.id === CALCULATOR_WIDGET_BLOCK_ID)
        .map((block) => ({ pathname, source: 'blocksByPath', block }))
    )),
    ...STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (Array.isArray(root?.revisionsByPath?.[pathname]) ? root.revisionsByPath[pathname] : [])
        .flatMap((revision, revisionIndex) => (
          (Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [])
            .filter((block) => block?.id === CALCULATOR_WIDGET_BLOCK_ID)
            .map((block) => ({ pathname, source: `revision:${revisionIndex}`, block }))
        ))
    )),
  ];
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
    expect((block?.editableFields || []).map((field) => field.id), `${pathname} ${source} editable fields`).toEqual([
      'widget',
      'fullBleed',
      'spaceBeforeRem',
      'spaceAfterRem',
      'paddingTopRem',
      'paddingBottomRem',
      'contentMaxWidthPx',
      'anchorId',
      'sectionClassName',
    ]);
    expect((block?.editableFields || []).some((field) => field.label === 'Page Content HTML'), `${pathname} ${source} page content label`).toBe(false);
    expect(RETIRED_PAGE_CONTENT_SETTING_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(block?.settings || {}, key)), `${pathname} ${source} retired settings`).toEqual([]);
  });
}

describe('calculator widget page-content ghost guardrail', () => {
  it('keeps standalone calculator blueprints out of the Page Content block kind and fields', () => {
    const entries = STANDALONE_CALCULATOR_PATHS.flatMap((pathname) => (
      (contentBlockBlueprintsByPath[pathname] || [])
        .filter((block) => block?.id === CALCULATOR_WIDGET_BLOCK_ID)
        .map((block) => ({ pathname, source: 'blueprint', block }))
    ));

    expectCalculatorWidgetShape(entries);
  });

  it('keeps shared, base, revision, and seed calculator_tool snapshots scrubbed', () => {
    const shared = readJson('dev-data/content-admin-shared.json');
    const seed = readJson('dev-data/content-admin-seed-baseline.json');
    const entries = [
      ...collectCalculatorToolBlocksFromSnapshotRoot(shared.state),
      ...collectCalculatorToolBlocksFromSnapshotRoot(shared.baseSnapshot),
      ...collectCalculatorToolBlocksFromSnapshotRoot(shared),
      ...collectCalculatorToolBlocksFromSnapshotRoot(seed.seedState),
    ];

    expectCalculatorWidgetShape(entries);
  });

  it('normalizes stale content-kind calculator tools before they can re-enter state', () => {
    const staleBlock = {
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

    expectCalculatorWidgetShape([
      {
        pathname: '/calculators/net-worth',
        source: 'normalizer',
        block: normalizeCalculatorWidgetBlock(staleBlock),
      },
    ]);
  });
});
