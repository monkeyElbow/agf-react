import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getCardGridPresetDefinitions } from './cardGridPresets';
import {
  COMPATIBILITY_BRIDGE_CLASSIFICATIONS,
  COMPATIBILITY_BRIDGE_INVENTORY,
  COMPATIBILITY_BRIDGE_SURFACES,
  getCompatibilityBridgeEntry,
  getCompatibilityBridgeIds,
} from './compatibilityBridgeInventory';
import { getRetiredInsertCompatibilityTemplateIds } from './compatibilityTemplateRetirement';
import { getColumnsPresetDefinitions } from './columnsPresets';
import { getCtaBandPresetDefinitions } from './ctaBandPresets';
import { PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS } from '../data/contentBlockBlueprints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('compatibility bridge inventory', () => {
  it('classifies remaining live compatibility bridges explicitly', () => {
    expect(COMPATIBILITY_BRIDGE_INVENTORY.length).toBeGreaterThan(0);

    expect(getCompatibilityBridgeIds({
      surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
      classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.persistedContentRequired,
    })).toEqual([
      'investment_strategy_options',
      'who_qualifies',
      'loan_apply',
      'columns_mha',
      'columns_math',
      'value_cards',
      'investor_cta',
    ]);

    expect(getCompatibilityBridgeIds({
      classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.temporaryRetained,
    })).toEqual([
      'services_cards',
      'ContentAdminContext:/rates rates_table->rates',
    ]);

    expect(getCompatibilityBridgeIds({
      surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
      classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
    })).toEqual([
      'loan_options',
      'certificates',
      'plan_features',
      'housing_allowance',
      'matters_band',
    ]);

    expect(getCompatibilityBridgeEntry('services_cards', COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId)).toMatchObject({
      insertDefaultSurface: true,
      futureRetirementCandidate: true,
    });
    expect(getCompatibilityBridgeEntry('investor_cta', COMPATIBILITY_BRIDGE_SURFACES.templateId)).toMatchObject({
      canonicalDefault: false,
      persistedContentBridge: true,
      insertDefaultSurface: false,
      futureRetirementCandidate: false,
    });
    expect(getCompatibilityBridgeEntry('rates_table', COMPATIBILITY_BRIDGE_SURFACES.blockKind)).toBeNull();
  });

  it('keeps persisted bridge ids and retired insert ids derived from the centralized inventory', () => {
    expect(PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS).toEqual(
      getCompatibilityBridgeIds({
        surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
        persistedContentBridge: true,
      }),
    );

    expect(getRetiredInsertCompatibilityTemplateIds('static')).toEqual(
      getCompatibilityBridgeIds({
        surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
        classification: COMPATIBILITY_BRIDGE_CLASSIFICATIONS.retirementCandidate,
      }),
    );
  });

  it('keeps canonical ids out of legacy block-id inventories while noncanonical preset ids stay covered', () => {
    const presetFamilies = [
      { kind: 'card_grid', canonicalId: 'card_grid', presets: getCardGridPresetDefinitions() },
      { kind: 'columns', canonicalId: 'columns', presets: getColumnsPresetDefinitions() },
      { kind: 'cta_band', canonicalId: 'cta_band', presets: getCtaBandPresetDefinitions() },
    ];

    presetFamilies.forEach(({ kind, canonicalId, presets }) => {
      presets.forEach((preset) => {
        expect(preset.legacyBlockIds).not.toContain(canonicalId);

        preset.templateIds
          .filter((id) => id !== canonicalId)
          .forEach((templateId) => {
            expect(getCompatibilityBridgeEntry(templateId, COMPATIBILITY_BRIDGE_SURFACES.templateId)).toBeTruthy();
          });

        preset.legacyBlockIds.forEach((blockId) => {
          expect(getCompatibilityBridgeEntry(blockId, COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId)).toBeTruthy();
        });
      });

      expect(getCompatibilityBridgeEntry(canonicalId, COMPATIBILITY_BRIDGE_SURFACES.templateId)).toBeNull();
      expect(getCompatibilityBridgeEntry(canonicalId, COMPATIBILITY_BRIDGE_SURFACES.legacyBlockId)).toBeNull();
      expect(kind).toBeTruthy();
    });
  });

  it('keeps the remaining helper-based bridge seams explicit and source-backed', () => {
    const cardGridPresetSource = readSource('./cardGridPresets.js');
    const columnsPresetSource = readSource('./columnsPresets.js');
    const ctaBandPresetSource = readSource('./ctaBandPresets.js');
    const presetIdentitySource = readSource('./blockPresetIdentity.js');
    const dynamicPageBlocksSource = readSource('./dynamicPageBlocks.js');
    const contentAdminSource = readSource('../context/ContentAdminContext.jsx');

    expect(cardGridPresetSource).toContain('export function resolveCardGridPresetId(block) {');
    expect(columnsPresetSource).toContain('export function resolveColumnsPresetId(block) {');
    expect(ctaBandPresetSource).toContain('export function resolveCtaBandPresetId(block) {');
    expect(presetIdentitySource).toContain('export function normalizePresetBearingBlockIdentity(block) {');
    expect(presetIdentitySource).toContain('export function normalizePresetBearingBlocks(blocks) {');
    expect(dynamicPageBlocksSource).toContain("if (kind !== 'rates') {");
    expect(dynamicPageBlocksSource).not.toContain("if (kind !== 'rates' && kind !== 'rates_table') {");
    expect(contentAdminSource).toContain("if (path === '/rates' && storedKind === 'rates_table' && storedMode === 'dynamic') {");
  });
});
