import { describe, expect, it } from 'vitest';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';
import { getRetiredInsertCompatibilityTemplateIds } from './compatibilityTemplateRetirement';

describe('admin block insert choices', () => {
  it('surfaces intentional dynamic preset choices for canonical preset-bearing families', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    expect(choices.find((choice) => choice.kind === 'card_grid' && choice.presetId === 'default')).toMatchObject({
      name: 'Card Grid · Flexible cards',
      createTemplateId: 'dynamic:card_grid:default',
      isCompatibility: false,
    });
    expect(choices.some((choice) => choice.kind === 'card_grid' && choice.presetId === 'investment-options')).toBe(false);
    expect(choices.find((choice) => choice.kind === 'cta_band' && choice.presetId === 'dashboard-login')).toMatchObject({
      name: 'CTA Band · Dashboard login',
      createTemplateId: 'dynamic:cta_band:dashboard-login',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'columns' && choice.presetId === 'default')).toMatchObject({
      name: 'Columns · Flexible columns',
      createTemplateId: 'dynamic:columns:default',
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
      isCompatibility: false,
    });
  });

  it('keeps retired compatibility-only insert choices hidden after static family bridges are cleared', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'static' });

    expect(choices.some((choice) => choice.kind === 'card_grid' && choice.presetId === 'default' && !choice.isCompatibility)).toBe(false);
    expect(choices.some((choice) => choice.kind === 'cta_band' && choice.presetId === 'default' && !choice.isCompatibility)).toBe(false);

    getRetiredInsertCompatibilityTemplateIds('static').forEach((templateId) => {
      expect(choices.some((choice) => choice.templateId === templateId)).toBe(false);
    });
    expect(choices.some((choice) => choice.templateId === 'rates_table')).toBe(false);
  });

  it('keeps retired static compatibility templates available in blueprint sources for live bridges only', () => {
    const templates = getAllBlockTemplateBlueprints();

    getRetiredInsertCompatibilityTemplateIds('static').forEach((templateId) => {
      expect(templates.some((template) => template?.templateId === templateId)).toBe(true);
    });
  });
});
