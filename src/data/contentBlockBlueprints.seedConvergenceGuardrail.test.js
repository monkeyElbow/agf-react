import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('content block blueprint seed convergence guardrail', () => {
  it('keeps migrated link/action blueprint seeding on narrow shared helpers', () => {
    const source = readSource('./contentBlockBlueprints.js');

    expect(source).toContain('function seedBlueprintLinkFields({ hrefField, pageRefField, href = \'\', pageRef = inferInternalPageRefFromHref(href) })');
    expect(source).toContain('function seedBlueprintActionFields({');
    expect(source).toContain('function seedBlueprintColumnButtonFields(columnNumber, options = {})');
    expect(source).toContain('function seedBlueprintServicesGridCardFields(cardNumber, {');
    expect(source).toContain('function seedBlueprintCardGridCardFields(cardNumber, {');
    expect(source).toContain('export const CANONICAL_BLUEPRINT_SEED_TEMPLATE_IDS_BY_LOOKUP_ID = Object.freeze({');
    expect(source).toContain("services_cards: 'card_grid',");
    expect(source).toMatch(/import \{[\s\S]*?PERSISTED_COMPATIBILITY_BRIDGE_TEMPLATE_IDS,[\s\S]*?\} from '\.\.\/lib\/compatibilityBridgeInventory';/);
    expect(source).toContain('export const PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS = PERSISTED_COMPATIBILITY_BRIDGE_TEMPLATE_IDS;');
    expect(source).toContain('export function resolveBlueprintSeedTemplateId(lookupId, explicitTemplateId = \'\') {');
    expect(source).toContain('export function isPersistedBlueprintBridgeTemplateId(templateId) {');
    expect(source).toContain('function createStaticBlueprintStub({ id, name, kind, settings = {} })');
    expect(source).toContain('function createDynamicCardGridBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('function createStaticCardGridBlueprintStub({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('function createDynamicColumnsBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('function createStaticColumnsBlueprintStub({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('function createDynamicCtaBandBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('function createStaticCtaBandBlueprintStub({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain('const sharedDynamicBillboardEditableFields = getLegacyEditableFieldsForKind(\'billboard\');');

    expect(source).toMatch(/\/test': \[[\s\S]*?id: 'intro'[\s\S]*?editableFields: sharedDynamicIntroEditableFields,/);
    expect(source).toMatch(/\/test': \[[\s\S]*?id: 'billboard'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);
    expect(source).toMatch(/id: 'services_grid'[\s\S]*?seedBlueprintServicesGridCardFields\(1,/);
    expect(source).toMatch(/id: 'value_cards'[\s\S]*?seedBlueprintColumnButtonFields\(1\)/);
    expect(source).toMatch(/createDynamicCardGridBlueprint\(\{[\s\S]*?id: 'card_grid'[\s\S]*?seedBlueprintCardGridCardFields\(1,/);
    expect(source).toMatch(/createStaticColumnsBlueprintStub\(\{[\s\S]*?id: 'columns_mha'[\s\S]*?presetId: 'housing-allowance'[\s\S]*?\}\)/);
    expect(source).toMatch(/createDynamicColumnsBlueprint\(\{[\s\S]*?id: 'columns_math'[\s\S]*?presetId: 'do-the-math'[\s\S]*?\}\)/);
    expect(source).toMatch(/createDynamicColumnsBlueprint\(\{[\s\S]*?id: 'value_cards'[\s\S]*?presetId: 'value-cards'[\s\S]*?\}\)/);
    expect(source).toMatch(/createDynamicColumnsBlueprint\(\{[\s\S]*?id: 'columns'[\s\S]*?presetId: 'default'[\s\S]*?\}\)/);
    expect(source).toMatch(/id: 'growth_feature'[\s\S]*?kind: 'site_feature'[\s\S]*?featureId: 'investments_growth_feature'/);
    expect(source).toMatch(/id: 'investor_cta'[\s\S]*?templateId: 'investor_cta'[\s\S]*?kind: 'cta_band'[\s\S]*?hidden: true[\s\S]*?buildCtaBandPresetSettings\('dashboard-login'\)/);
    expect(source).toMatch(/id: 'cta_form'[\s\S]*?kind: 'cta_form'[\s\S]*?title: 'Talk with an investments consultant\.'/);
    expect(source).toMatch(/createStaticBlueprintStub\(\{ id: 'hero', name: 'Hero', kind: 'hero' \}\)/);
    expect(source).toMatch(/createStaticCardGridBlueprintStub\(\{ id: 'loan_options', name: 'Loan Options Grid' \}\)/);
    expect(source).toMatch(/createStaticCardGridBlueprintStub\(\{[\s\S]*?id: 'services_cards'[\s\S]*?showIcons: false,[\s\S]*?\}\)/);
    expect(source).toMatch(/createStaticCtaBandBlueprintStub\(\{ id: 'cta_band', name: 'CTA Band' \}\)/);
    expect(source).toMatch(/id: 'billboard'[\s\S]*?name: 'Retire Every Day Billboard'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);

    expect(source).not.toContain("id: 'legacy_removed_block'");
    expect(source).not.toContain('const introDynamicExtraLineToneOptions = [');
    expect(source).not.toContain('const introDynamicTextToneOptions = [');
    expect(source).not.toContain('const heroDynamicHighlightToneOptions =');
    expect(source).not.toContain('const heroDynamicButtonStyleOptions = [');
    expect(source).not.toContain('const heroDynamicButtonToneOptions = [');
  });
});
