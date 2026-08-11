import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { DEFAULT_SERVICES_INTRO_HEADING } from '../data/servicesOverviewSeed';
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
    const cardGridTemplate = getAllBlockTemplateBlueprints().find((template) => template?.isAddBlockDefault);
    expect(cardGridTemplate).toMatchObject({
      kind: 'card_grid',
      templateId: 'card_grid',
      settings: {
        title: 'Card Grid - Flexible cards',
        card1Title: 'Card title',
        card1Body: 'Add card description here.',
      },
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
    expect(choices.some((choice) => choice.kind === 'site_feature')).toBe(false);
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

  it('keeps internal, hidden, and migration-only kinds out of the catalog', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    expect(choices.some((choice) => ['hero', 'hero_pie', 'rates', 'top_strip', 'content'].includes(choice.kind))).toBe(false);
    choices.forEach((choice) => {
      expect(['standard', 'contextual']).toContain(choice.catalog?.catalogVisibility);
    });
  });

  it('limits contextual forms to compatible page families', () => {
    const templates = getAllBlockTemplateBlueprints();
    const loansChoices = buildAdminBlockInsertChoices(templates, {
      mode: 'dynamic',
      pathname: '/services/loans',
    });
    const aboutChoices = buildAdminBlockInsertChoices(templates, {
      mode: 'dynamic',
      pathname: '/about-us',
    });

    expect(loansChoices.some((choice) => choice.kind === 'request_form')).toBe(true);
    expect(aboutChoices.some((choice) => choice.kind === 'request_form')).toBe(false);
  });

  it('keeps CTA Form and Request Form available as separate choices on Planned Giving', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), {
      mode: 'dynamic',
      pathname: '/services/planned-giving',
    });

    expect(choices.find((choice) => choice.kind === 'cta_form')).toMatchObject({ name: 'CTA Form' });
    expect(choices.find((choice) => choice.kind === 'request_form')).toMatchObject({ name: 'Request Form' });

    const testChoices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), {
      mode: 'dynamic',
      pathname: '/test',
    });
    expect(testChoices.find((choice) => choice.kind === 'cta_form')).toMatchObject({ name: 'CTA Form' });
    expect(testChoices.find((choice) => choice.kind === 'request_form')).toMatchObject({ name: 'Request Form' });
  });

  it('keeps the Services overview billboard out of the add-block catalog', () => {
    const templates = getAllBlockTemplateBlueprints();
    const choices = buildAdminBlockInsertChoices(templates, {
      mode: 'dynamic',
      pathname: '/services',
    });

    expect(templates.some((template) => (
      template?.kind === 'billboard'
      && template?.settings?.title === DEFAULT_SERVICES_INTRO_HEADING
    ))).toBe(false);
    expect(choices.some((choice) => (
      choice.kind === 'billboard'
      && choice.name === 'Billboard'
      && choice.createTemplateId === 'intro'
    ))).toBe(false);
  });

  it('keeps page-specific billboard and feature-panel content out of reusable block choices', () => {
    const templates = getAllBlockTemplateBlueprints();
    const choices = buildAdminBlockInsertChoices(templates, { mode: 'dynamic' });

    expect(templates.find((template) => template?.templateLookupId === 'certificate_proof')).toBeUndefined();
    expect(templates.find((template) => template?.templateLookupId === 'fraud_feature')).toBeUndefined();
    expect(templates.find((template) => template?.templateLookupId === 'billboard_default')).toMatchObject({
      kind: 'billboard',
      templateId: 'billboard',
      isReusableTemplate: true,
    });
    expect(templates.find((template) => template?.templateLookupId === 'feature_panel_default')).toMatchObject({
      kind: 'feature_panel',
      templateId: 'feature_panel',
      isReusableTemplate: true,
    });

    expect(choices.filter((choice) => choice.kind === 'billboard').map((choice) => choice.name)).toEqual(['Billboard']);
    expect(choices.filter((choice) => choice.kind === 'feature_panel').map((choice) => choice.name)).toEqual(['Feature Panel']);
  });

  it('uses neutral catalog payloads instead of route-owned content for every reusable family', () => {
    const templates = getAllBlockTemplateBlueprints();
    const choices = buildAdminBlockInsertChoices(templates, {
      mode: 'dynamic',
      pathname: '/services/retirement',
    });
    const expectedCatalogTemplateIds = [
      'billboard_default',
      'feature_panel_default',
      'intro_default',
      'newsletter_default',
      'cta_form_default',
      'request_form_default',
      'card_grid_eligibility_cards',
      'card_grid_step_cards',
      'columns_default',
      'columns_housing_allowance',
      'columns_do_the_math',
      'columns_value_cards',
      'cta_band_default',
      'impact_stat_default',
      'split_panel_default',
    ];

    expectedCatalogTemplateIds.forEach((templateLookupId) => {
      expect(templates.find((template) => template?.templateLookupId === templateLookupId)).toMatchObject({
        isReusableTemplate: true,
      });
    });
    expect(templates.some((template) => [
      'services_cards',
      'matters_band',
      'history',
      'stewardship_story',
      'retirement_plan_feature',
      'laddering',
      'split_options',
      'cta_form',
      'request_form',
    ].includes(template?.templateLookupId))).toBe(false);

    expect(choices.find((choice) => choice.kind === 'cta_form')?.createTemplateId).toBe('cta_form_default');
    expect(choices.find((choice) => choice.kind === 'request_form')?.createTemplateId).toBe('request_form_default');
    expect(choices.find((choice) => choice.kind === 'intro')?.createTemplateId).toBe('intro_default');
    expect(choices.find((choice) => choice.kind === 'newsletter')?.createTemplateId).toBe('newsletter_default');
    expect(choices.find((choice) => choice.kind === 'split_panel')?.createTemplateId).toBe('split_panel_default');
    expect(choices.find((choice) => choice.kind === 'calculator_cta')).toBeUndefined();
    expect(choices.find((choice) => choice.kind === 'site_feature')).toBeUndefined();
  });
});
