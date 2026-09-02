import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

// Source-default only. These checks protect blueprint construction rules, not
// persisted content or editable marketing copy.
describe('source-default content block blueprint construction', () => {
  it('keeps migrated link/action blueprint seeding on narrow shared helpers', () => {
    const source = readSource('./contentBlockBlueprints.js');

    expect(source).toContain('function seedBlueprintLinkFields({');
    expect(source).toContain('openInNewWindowField,');
    expect(source).toContain('return normalizeSplitLinkFieldSettings({');
    expect(source).toContain('}, { stripSplitFields: true });');
    expect(source).toContain('function seedBlueprintActionFields({');
    expect(source).toContain('function seedBlueprintColumnButtonFields(columnNumber, options = {})');
    expect(source).toContain('function seedBlueprintServicesGridCardFields(cardNumber, {');
    expect(source).toContain('function seedBlueprintCardGridCardFields(cardNumber, {');
    expect(source).not.toContain('compatibilityBridgeInventory');
    expect(source).not.toContain('PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS');
    expect(source).not.toContain('CANONICAL_BLUEPRINT_SEED_TEMPLATE_IDS_BY_LOOKUP_ID');
    expect(source).toContain('function resolveBlueprintSeedTemplateId(lookupId, explicitTemplateId = \'\') {');
    expect(source).toContain('function createDynamicCardGridBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain("templateId: String(templateId || '').trim() || 'card_grid'");
    expect(source).toContain('function createDynamicColumnsBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain("templateId: String(templateId || '').trim() || 'columns'");
    expect(source).toContain('function createDynamicBillboardBlueprint({ id, name, presetId = \'default\', templateId = \'\', settings = {} })');
    expect(source).toContain("templateId: String(templateId || '').trim() || 'billboard'");
    expect(source).toContain('const sharedDynamicBillboardEditableFields = getEditableFieldsForKind(\'billboard\');');

    expect(source).toMatch(/\/test': \[[\s\S]*?id: 'intro'[\s\S]*?editableFields: sharedDynamicIntroEditableFields,/);
    expect(source).toMatch(/\/test': \[[\s\S]*?id: 'billboard'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);
    expect(source).toMatch(/id: 'services_grid'[\s\S]*?seedBlueprintServicesGridCardFields\(1,/);
    expect(source).toMatch(/id: 'value_cards'[\s\S]*?seedBlueprintColumnButtonFields\(1\)/);
    expect(source).toMatch(/id: 'home_do_the_math'[\s\S]*?kind: 'billboard'[\s\S]*?scrollReveal: 'scale-up'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);
    expect(source).toMatch(/createDynamicCardGridBlueprint\(\{[\s\S]*?id: 'card_grid'[\s\S]*?seedBlueprintCardGridCardFields\(1,/);
    expect(source).toMatch(/id: 'home_ministry_allies'[\s\S]*?kind: 'billboard'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);
    expect(source).toMatch(/id: 'columns_math'[\s\S]*?kind: 'billboard'[\s\S]*?scrollReveal: 'scale-up'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);
    expect(source).toMatch(/createDynamicColumnsBlueprint\(\{[\s\S]*?id: 'value_cards'[\s\S]*?presetId: 'value-cards'[\s\S]*?\}\)/);
    expect(source).toMatch(/createDynamicColumnsBlueprint\(\{[\s\S]*?id: 'columns'[\s\S]*?presetId: 'default'[\s\S]*?\}\)/);
    expect(source).toMatch(/id: 'growth_feature'[\s\S]*?kind: 'site_feature'[\s\S]*?featureId: 'investments_growth_feature'/);
    expect(source).toMatch(/id: 'dashboard_login_cta'[\s\S]*?templateId: 'billboard'[\s\S]*?presetId: 'dashboard-login'[\s\S]*?kind: 'billboard'[\s\S]*?hidden: true[\s\S]*?buildBillboardPresetSettings\('dashboard-login'\)/);
    expect(source).toMatch(/id: 'cta_form'[\s\S]*?kind: 'cta_form'[\s\S]*?editableFields:/);
    expect(source).toMatch(/\/test': \[[\s\S]*?id: 'cta_form'[\s\S]*?editableFields:[\s\S]*?createDynamicColumnsBlueprint/);
    expect(contentBlockBlueprintsByPath['/test'].some((block) => block?.id === 'newsletter')).toBe(false);
    expect(source).toMatch(/createDynamicCardGridBlueprint\(\{[\s\S]*?id: 'loan_options'[\s\S]*?presetId:/);
    expect(source).toMatch(/id: 'services_cards'[\s\S]*?kind: 'card_grid'[\s\S]*?presetId: 'services-directory'[\s\S]*?buildServicesDirectorySettings\(\)/);
    expect(source).toMatch(/id: 'matters_band'[\s\S]*?kind: 'billboard'[\s\S]*?buildBillboardPresetSettings\('default'/);
    expect(source).toMatch(/createDynamicBillboardBlueprint\(\{[\s\S]*?id: 'cta_band'[\s\S]*?presetId:/);
    expect(source).toMatch(/id: 'billboard'[\s\S]*?name: 'Retire Every Day Billboard'[\s\S]*?editableFields: sharedDynamicBillboardEditableFields,/);

    expect(source).not.toContain("id: 'legacy_removed_block'");
    expect(source).not.toContain('function createStaticBlueprintStub');
    expect(source).not.toContain('function createStaticCardGridBlueprintStub');
    expect(source).not.toContain('function createStaticColumnsBlueprintStub');
    expect(source).not.toContain('function createStaticCtaBandBlueprintStub');
    expect(source).not.toContain('createStaticBlueprintStub(');
    expect(source).not.toContain('const introDynamicExtraLineToneOptions = [');
    expect(source).not.toContain('const introDynamicTextToneOptions = [');
    expect(source).not.toContain('const heroDynamicHighlightToneOptions =');
    expect(source).not.toContain('const heroDynamicButtonStyleOptions = [');
    expect(source).not.toContain('const heroDynamicButtonToneOptions = [');
  });
});
