import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';

describe('admin block insert choices', () => {
  it('surfaces intentional dynamic preset choices for canonical preset-bearing families', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    expect(choices.find((choice) => choice.kind === 'card_grid' && choice.presetId === 'default')).toMatchObject({
      name: 'Card Grid · Flexible cards',
      createTemplateId: 'dynamic:card_grid:default',
      editorType: 'card_grid',
      canonicalLabel: 'Card Grid',
      isCompatibility: false,
    });
    expect(choices.some((choice) => choice.kind === 'card_grid' && choice.presetId === 'investment-options')).toBe(false);
    expect(choices.find((choice) => choice.kind === 'cta_band' && choice.presetId === 'dashboard-login')).toMatchObject({
      name: 'CTA Band · Dashboard login',
      createTemplateId: 'dynamic:cta_band:dashboard-login',
      editorType: 'cta_band',
      canonicalLabel: 'CTA Band',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'columns' && choice.presetId === 'default')).toMatchObject({
      name: 'Columns · Flexible columns',
      createTemplateId: 'dynamic:columns:default',
      editorType: 'columns',
      canonicalLabel: 'Columns',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'columns' && choice.presetId === 'value-cards')).toMatchObject({
      name: 'Columns · Value cards',
      createTemplateId: 'dynamic:columns:value-cards',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'site_feature' && choice.createTemplateId === 'site_feature')).toMatchObject({
      name: 'Site Feature · Editorial spotlight',
      createTemplateId: 'site_feature',
      description: 'Code-managed editorial placeholder for future art-directed storytelling moments.',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'cta_band' && choice.presetId === 'default')).toMatchObject({
      name: 'CTA Band · General CTA',
      createTemplateId: 'dynamic:cta_band:default',
      editorType: 'cta_band',
      canonicalLabel: 'CTA Band',
      isCompatibility: false,
    });
  });

  it('keeps every dynamic insert choice tied to a canonical editor and runtime contract', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    choices.forEach((choice) => {
      const definition = getBlockDefinition(choice.kind);

      expect(definition).toBeTruthy();
      expect(choice.mode).toBe('dynamic');
      expect(choice.editorType).toBe(definition?.editorType);
      expect(choice.canonicalLabel).toBe(definition?.label);
      expect(typeof definition?.renderer?.buildRuntime).toBe('function');
    });
  });

  it('keeps retired compatibility-only insert choices hidden after static family bridges are cleared', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'static' });

    expect(choices.some((choice) => choice.kind === 'card_grid' && choice.presetId === 'default' && !choice.isCompatibility)).toBe(false);
    expect(choices.some((choice) => choice.kind === 'cta_band' && choice.presetId === 'default' && !choice.isCompatibility)).toBe(false);

    expect(choices.some((choice) => choice.templateId === 'rates_table')).toBe(false);
    expect(choices.some((choice) => choice.isCompatibility)).toBe(false);
  });

  it('does not reintroduce retired static compatibility templates into blueprint sources', () => {
    const templates = getAllBlockTemplateBlueprints();

    expect(templates.some((template) => template?.mode === 'static')).toBe(false);
    expect(templates.some((template) => template?.templateId === 'rates_table')).toBe(false);
  });
});
