import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath, genericPageBlockBlueprint, getAllBlockTemplateBlueprints } from '../../data/contentBlockBlueprints';
import { getDefaultSiteFeatureCatalogEntry, getSiteFeatureOptions } from '../../data/siteFeatureCatalog';
import { BLOCK_KIND_VALUES, BLOCK_MODE_VALUES } from '../foundation/models';
import { getBlockHudDefinition } from '../../lib/blockHudRegistry';
import { getEditorParityContract } from '../../lib/editorParityContract';
import {
  getBlockDefinition,
  getBlockEditorSections,
  getBlockPresetDefinition,
  getBlockPresetDefinitions,
  getEditableFieldsForKind,
  getMigratedBlockKinds,
  getSingletonBlockKinds,
} from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('canonical block registry', () => {
  it('registers the first migrated block kinds with required metadata', () => {
    expect(getMigratedBlockKinds()).toEqual(['content', 'calculator_cta', 'cta_band', 'cta_form', 'request_form', 'hero', 'hero_pie', 'impact_stat', 'intro', 'legal_copy', 'billboard', 'columns', 'feature_panel', 'photo_column', 'card_grid', 'newsletter', 'rates', 'services_grid', 'site_feature', 'split_panel', 'testimonials', 'top_strip']);
    expect(BLOCK_KIND_VALUES).not.toContain('rates_table');
    expect(BLOCK_MODE_VALUES).toEqual(['dynamic']);

    getMigratedBlockKinds().forEach((kind) => {
      const definition = getBlockDefinition(kind);
      expect(definition).toBeTruthy();
      expect(definition.kind).toBe(kind);
      expect(definition.label).toBeTruthy();
      expect(definition.icon).toBeTruthy();
      expect(definition.editorType).toBe(kind === 'content' ? 'page_content' : kind);
      expect(definition.allowedVariants.length).toBeGreaterThan(0);
      expect(definition.supportedModes).toContain('dynamic');
      expect(kind === 'rates' ? definition.schema.fields.length >= 0 : definition.schema.fields.length > 0).toBe(true);
      expect(definition.validators.length).toBeGreaterThan(0);
      expect(definition.styleScope.rootClassName).toBeTruthy();
      expect(typeof definition.renderer.buildRuntime).toBe('function');
    });
  });

  it('tracks singleton kinds in canonical block metadata', () => {
    expect(getSingletonBlockKinds()).toEqual(['hero', 'hero_pie', 'intro', 'newsletter', 'top_strip']);
    expect(getBlockDefinition('card_grid')?.singleton).toBe(false);
    expect(getBlockDefinition('hero')?.singleton).toBe(true);
  });

  it('keeps card-grid presets on the canonical definition instead of drifting into pseudo-kinds', () => {
    expect(getBlockPresetDefinitions('card_grid').map((preset) => preset.id)).toEqual([
      'default',
      'investment-options',
      'eligibility-cards',
      'step-cards',
    ]);
    expect(getBlockDefinition('card_grid')?.editorType).toBe('card_grid');
    expect(getBlockDefinition('card_grid')?.styleScope.cssNamespace).toBe('card-grid');
    expect(getBlockPresetDefinition('card_grid', 'investment-options')?.templateIds).toEqual([]);
    expect(getBlockPresetDefinition('services_grid', 'default')).toBeNull();
  });

  it('keeps non-form CTA presets on the canonical cta-band definition while form CTA stays separate', () => {
    expect(getBlockPresetDefinitions('cta_band').map((preset) => preset.id)).toEqual([
      'default',
      'dashboard-login',
    ]);
    expect(getBlockDefinition('cta_band')?.editorType).toBe('cta_band');
    expect(getBlockDefinition('cta_band')?.styleScope.cssNamespace).toBe('cta-band');
    expect(getBlockPresetDefinition('cta_band', 'dashboard-login')?.templateIds).toEqual(['dashboard_login_cta']);
    expect(getBlockPresetDefinition('calculator_cta', 'default')).toBeNull();
    expect(getBlockPresetDefinition('feature_panel', 'default')).toBeNull();
    expect(getBlockPresetDefinition('cta_form', 'default')).toBeNull();
  });

  it('keeps columns variants on the canonical columns definition while photo-column remains separate', () => {
    expect(getBlockPresetDefinitions('columns').map((preset) => preset.id)).toEqual([
      'default',
      'housing-allowance',
      'do-the-math',
      'value-cards',
    ]);
    expect(getBlockPresetDefinition('columns', 'housing-allowance')?.templateIds).toEqual([]);
    expect(getBlockPresetDefinition('columns', 'value-cards')?.templateIds).toEqual([]);
    expect(getBlockPresetDefinition('photo_column', 'default')).toBeNull();
  });

  it('provides HUD and admin sections from one canonical definition path', () => {
    getMigratedBlockKinds().forEach((kind) => {
      const hudSections = getBlockEditorSections(kind, 'hud');
      const adminSections = getBlockEditorSections(kind, 'admin');
      const editableFields = getEditableFieldsForKind(kind);

      expect(hudSections.length).toBeGreaterThan(0);
      expect(adminSections.length).toBeGreaterThan(0);
      expect(kind === 'rates' ? editableFields.length >= 0 : editableFields.length > 0).toBe(true);
      expect(new Set(editableFields.map((field) => field.id)).size).toBe(editableFields.length);
      expect(adminSections.flatMap((section) => section.fields).map((field) => field.id))
        .toEqual(editableFields.map((field) => field.id));
    });
  });

  it('uses the canonical editable-field API name', () => {
    const registrySource = readSource('./index.js');

    expect(registrySource).toContain('export function getEditableFieldsForKind');
    expect(registrySource).not.toContain('getLegacyEditableFieldsForKind');
  });

  it('adapts blueprint editable fields for migrated dynamic blocks from the canonical registry', () => {
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];
    const allBlocks = Object.values(contentBlockBlueprintsByPath).flat();
    const genericBlocks = genericPageBlockBlueprint();
    const pageContentBlock = allBlocks.find((block) => block?.kind === 'content' && block?.id === 'page_content' && block?.mode === 'dynamic');
    const calculatorCtaBlock = (contentBlockBlueprintsByPath['/services/investments'] || []).find((block) => block?.kind === 'calculator_cta' && block?.mode === 'dynamic');
    const ctaBandBlock = getAllBlockTemplateBlueprints().find((block) => block?.id === 'dashboard_login_cta');
    const heroBlock = testBlocks.find((block) => block?.kind === 'hero' && block?.mode === 'dynamic');
    const ctaFormBlock = (contentBlockBlueprintsByPath['/'] || []).find((block) => block?.kind === 'cta_form' && block?.mode === 'dynamic');
    const requestFormBlock = allBlocks.find((block) => block?.kind === 'request_form' && block?.mode === 'dynamic');
    const heroPieBlock = (contentBlockBlueprintsByPath['/services'] || []).find((block) => block?.kind === 'hero_pie' && block?.mode === 'dynamic');
    const impactStatBlock = (contentBlockBlueprintsByPath['/'] || []).find((block) => block?.kind === 'impact_stat' && block?.mode === 'dynamic');
    const introBlock = testBlocks.find((block) => block?.kind === 'intro' && block?.mode === 'dynamic');
    const billboardBlock = testBlocks.find((block) => block?.kind === 'billboard' && block?.mode === 'dynamic');
    const columnsBlock = testBlocks.find((block) => block?.kind === 'columns' && block?.mode === 'dynamic');
    const featurePanelBlock = (contentBlockBlueprintsByPath['/services/investments'] || []).find((block) => block?.kind === 'feature_panel' && block?.mode === 'dynamic');
    const splitPanelBlock = (contentBlockBlueprintsByPath['/services/retirement'] || []).find((block) => block?.kind === 'split_panel' && block?.mode === 'dynamic');
    const cardGridBlock = testBlocks.find((block) => block?.kind === 'card_grid' && block?.mode === 'dynamic');
    const newsletterBlock = testBlocks.find((block) => block?.kind === 'newsletter' && block?.mode === 'dynamic');
    const ratesBlock = (contentBlockBlueprintsByPath['/rates'] || []).find((block) => block?.kind === 'rates' && block?.mode === 'dynamic');
    const servicesGridBlock = (contentBlockBlueprintsByPath['/'] || []).find((block) => block?.kind === 'services_grid' && block?.mode === 'dynamic');
    const siteFeatureBlock = genericBlocks.find((block) => block?.kind === 'site_feature' && block?.mode === 'dynamic');
    const testimonialsBlock = allBlocks.find((block) => block?.kind === 'testimonials' && block?.mode === 'dynamic');
    const topStripBlock = (contentBlockBlueprintsByPath['/'] || []).find((block) => block?.kind === 'top_strip' && block?.mode === 'dynamic');

    expect(pageContentBlock?.editableFields).toEqual(getEditableFieldsForKind('content'));
    expect(calculatorCtaBlock?.editableFields).toEqual(getEditableFieldsForKind('calculator_cta'));
    expect(ctaBandBlock?.editableFields).toEqual(getEditableFieldsForKind('cta_band'));
    expect(ctaFormBlock?.editableFields).toEqual(getEditableFieldsForKind('cta_form'));
    expect(requestFormBlock?.editableFields).toEqual(getEditableFieldsForKind('request_form'));
    expect(heroBlock?.editableFields).toEqual(getEditableFieldsForKind('hero'));
    expect(heroPieBlock?.editableFields).toEqual(getEditableFieldsForKind('hero_pie'));
    expect(impactStatBlock?.editableFields).toEqual(getEditableFieldsForKind('impact_stat'));
    expect(introBlock?.editableFields).toEqual(getEditableFieldsForKind('intro'));
    expect(billboardBlock?.editableFields).toEqual(getEditableFieldsForKind('billboard'));
    expect(columnsBlock?.editableFields).toEqual(getEditableFieldsForKind('columns'));
    expect(featurePanelBlock?.editableFields).toEqual(getEditableFieldsForKind('feature_panel'));
    expect(splitPanelBlock?.editableFields).toEqual(getEditableFieldsForKind('split_panel'));
    expect(cardGridBlock?.editableFields).toEqual(getEditableFieldsForKind('card_grid'));
    expect(newsletterBlock?.editableFields).toEqual(getEditableFieldsForKind('newsletter'));
    expect(ratesBlock?.editableFields).toEqual(getEditableFieldsForKind('rates'));
    expect(servicesGridBlock?.editableFields).toEqual(getEditableFieldsForKind('services_grid'));
    expect(siteFeatureBlock?.editableFields).toEqual(getEditableFieldsForKind('site_feature'));
    expect(testimonialsBlock?.editableFields).toEqual(getEditableFieldsForKind('testimonials'));
    expect(topStripBlock?.editableFields).toEqual(getEditableFieldsForKind('top_strip'));
    expect(getEditableFieldsForKind('photo_column').length).toBeGreaterThan(0);
  });

  it('feeds HUD and parity metadata from canonical definitions for migrated kinds', () => {
    getMigratedBlockKinds().forEach((kind) => {
      const definition = getBlockDefinition(kind);
      const hudDefinition = getBlockHudDefinition(
        kind === 'card_grid'
          ? { id: kind, kind, presetId: 'default', templateId: 'card_grid' }
          : (kind === 'cta_band'
            ? { id: kind, kind, presetId: 'default', templateId: 'cta_band' }
            : (kind === 'columns'
              ? { id: kind, kind, presetId: 'default', templateId: 'columns' }
              : { id: kind, kind }))
      );
      const parityDefinition = getEditorParityContract(kind);

      const expectedHudLabel = (
        kind === 'card_grid'
          ? 'Card Grid · Flexible cards'
          : (kind === 'cta_band'
            ? 'CTA Band · General CTA'
            : (kind === 'columns'
              ? 'Columns · Flexible columns'
              : (kind === 'site_feature' ? 'Site Feature · Editorial spotlight' : definition.label)))
      );

      expect(hudDefinition.label).toBe(expectedHudLabel);
      expect(hudDefinition.icon).toBe(definition.icon);
      expect(hudDefinition.editorType).toBe(definition.editorType);
      expect(parityDefinition?.label).toBe(definition.label);
    });
  });

  it('keeps migrated kinds out of the legacy hardcoded registry fallbacks', () => {
    const hudRegistrySource = readSource('../../lib/blockHudRegistry.js');
    const paritySource = readSource('../../lib/editorParityContract.js');

    ['content', 'calculator_cta', 'cta_band', 'cta_form', 'request_form', 'hero', 'hero_pie', 'impact_stat', 'intro', 'legal_copy', 'billboard', 'columns', 'feature_panel', 'photo_column', 'card_grid', 'newsletter', 'rates', 'services_grid', 'site_feature', 'split_panel', 'testimonials', 'top_strip'].forEach((kind) => {
      expect(hudRegistrySource).not.toMatch(new RegExp(`^\\s{2}${kind}:`, 'm'));
      expect(paritySource).not.toMatch(new RegExp(`^\\s{2}${kind}:`, 'm'));
    });
  });

  it('keeps site-feature canonical and intentionally code-owned', () => {
    const definition = getBlockDefinition('site_feature');
    const editableFields = getEditableFieldsForKind('site_feature');
    const editableFieldIds = editableFields.map((field) => field.id);
    const featureIdField = definition?.schema?.fields?.find((field) => field.id === 'featureId');
    const buttonLinkField = editableFields.find((field) => field.id === 'buttonLinkJson');

    expect(definition?.editorType).toBe('site_feature');
    expect(definition?.label).toBe('Site Feature');
    expect(definition?.styleScope.cssNamespace).toBe('site-feature');
    expect(definition?.defaults?.featureId).toBe(getDefaultSiteFeatureCatalogEntry()?.featureId);
    expect(featureIdField?.options).toEqual(getSiteFeatureOptions());
    expect(editableFieldIds).toEqual([
      'featureId',
      'headline',
      'body',
      'sectionClassName',
      'buttonLabel',
      'buttonLinkJson',
    ]);
    expect(buttonLinkField).toEqual(expect.objectContaining({
      type: 'route_link',
    }));
    expect(buttonLinkField).not.toEqual(expect.objectContaining({
      legacyHrefFieldId: expect.any(String),
      routeRefFieldId: expect.any(String),
      linkJsonFieldId: expect.any(String),
      openInNewWindowFieldId: expect.any(String),
    }));
    expect(editableFieldIds.some((fieldId) => /layout|animation|image/i.test(fieldId))).toBe(false);
  });
});
