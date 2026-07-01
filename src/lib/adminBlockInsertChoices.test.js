import { describe, expect, it } from 'vitest';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';
import { getRetiredInsertCompatibilityTemplateIds } from './compatibilityTemplateRetirement';

describe('admin block insert choices', () => {
  it('surfaces intentional dynamic preset choices for canonical preset-bearing families', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    expect(choices.find((choice) => choice.kind === 'card_grid' && choice.presetId === 'default')).toMatchObject({
      name: 'Card Grid · Flexible cards',
      createTemplateId: 'card_grid',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'card_grid' && choice.presetId === 'investment-options')).toMatchObject({
      name: 'Card Grid · Investment options',
      createTemplateId: 'investment_strategy_options',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'cta_band' && choice.presetId === 'dashboard-login')).toMatchObject({
      name: 'CTA Band · Dashboard login',
      createTemplateId: 'investor_cta',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'columns' && choice.presetId === 'default')).toMatchObject({
      name: 'Columns · Flexible columns',
      createTemplateId: 'columns',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'columns' && choice.presetId === 'value-cards')).toMatchObject({
      name: 'Columns · Value cards',
      createTemplateId: 'value_cards',
      isCompatibility: false,
    });
    expect(choices.find((choice) => choice.kind === 'site_feature' && choice.createTemplateId === 'site_feature')).toMatchObject({
      name: 'Site Feature · Editorial spotlight',
      createTemplateId: 'site_feature',
      description: 'Code-managed editorial placeholder for future art-directed storytelling moments.',
      isCompatibility: false,
    });
    expect(choices.some((choice) => choice.kind === 'cta_band' && choice.presetId === 'default')).toBe(false);
  });

  it('keeps canonical static family entries available while retired compatibility-only insert choices stay hidden', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'static' });

    expect(choices.find((choice) => choice.kind === 'card_grid' && choice.presetId === 'default' && !choice.isCompatibility)).toMatchObject({
      name: 'Card Grid · Flexible cards',
      createTemplateId: 'services_cards',
    });
    expect(choices.find((choice) => choice.kind === 'cta_band' && choice.presetId === 'default' && !choice.isCompatibility)).toMatchObject({
      name: 'CTA Band · General CTA',
      createTemplateId: 'cta_band',
    });

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
