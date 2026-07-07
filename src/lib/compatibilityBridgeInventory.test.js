import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  COMPATIBILITY_BRIDGE_INVENTORY,
  COMPATIBILITY_BRIDGE_SURFACES,
  getCompatibilityBridgeEntry,
  getCompatibilityBridgeIds,
} from './compatibilityBridgeInventory';
import { getRetiredInsertCompatibilityTemplateIds } from './compatibilityTemplateRetirement';
import { PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS } from '../data/contentBlockBlueprints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('compatibility bridge inventory', () => {
  it('keeps the compatibility inventory empty after canonical preset-family cleanup', () => {
    expect(COMPATIBILITY_BRIDGE_INVENTORY).toEqual([]);
    expect(getCompatibilityBridgeIds()).toEqual([]);
    expect(getCompatibilityBridgeIds({
      surface: COMPATIBILITY_BRIDGE_SURFACES.templateId,
      persistedContentBridge: true,
    })).toEqual([]);
    expect(getCompatibilityBridgeEntry('services_cards', COMPATIBILITY_BRIDGE_SURFACES.templateId)).toBeNull();
    expect(PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS).toEqual([]);
    expect(getRetiredInsertCompatibilityTemplateIds('static')).toEqual([]);
  });

  it('keeps preset normalization on the canonical family contract rather than legacy id maps', () => {
    const presetIdentitySource = readSource('./blockPresetIdentity.js');
    const contentAdminSource = readSource('../context/ContentAdminContext.jsx');

    expect(presetIdentitySource).toContain('export function normalizePresetBearingBlockIdentity(block) {');
    expect(presetIdentitySource).toContain('export function normalizePresetBearingBlocks(blocks) {');
    expect(presetIdentitySource).not.toContain('LEGACY_PRESET_ID_BY_KIND_AND_BLOCK_ID');
    expect(presetIdentitySource).not.toContain('LEGACY_PRESET_ID_BY_KIND_AND_TEMPLATE_ID');
    expect(contentAdminSource).not.toContain("storedBlockId === 'investor_cta'");
    expect(contentAdminSource).not.toContain("storedKind === 'rates_table'");
    expect(contentAdminSource).not.toContain('normalizeHomeManagedBillboardBlock');
  });
});
