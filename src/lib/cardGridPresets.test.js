import { describe, expect, it } from 'vitest';
import {
  buildCardGridPresetSettings,
  getCardGridPresetDefinition,
  getCardGridPresetDefinitions,
  resolveCardGridPresetDefinition,
  resolveCardGridPresetId,
} from './cardGridPresets';

describe('card grid preset definitions', () => {
  it('keeps the canonical card-grid family presets explicit', () => {
    expect(getCardGridPresetDefinitions().map((preset) => preset.id)).toEqual([
      'default',
      'investment-options',
      'eligibility-cards',
      'step-cards',
    ]);
    expect(getCardGridPresetDefinition('default')?.templateIds).toEqual([
      'card_grid',
    ]);
  });

  it('resolves preset identity from explicit preset ids and template ids', () => {
    expect(resolveCardGridPresetId({ kind: 'card_grid', presetId: 'investment-options' })).toBe('investment-options');
    expect(resolveCardGridPresetId({ kind: 'card_grid', templateId: 'card_grid' })).toBe('default');
    expect(resolveCardGridPresetDefinition({ kind: 'card_grid', presetId: 'step-cards' })?.label).toBe('Step-by-step cards');
  });

  it('keeps preset defaults and editor guardrails intentionally bounded', () => {
    expect(buildCardGridPresetSettings('investment-options')).toMatchObject({
      contentWidth: 'browser',
      columns: 'two',
    });
    expect(getCardGridPresetDefinition('eligibility-cards')?.editor).toMatchObject({
      maxCards: 3,
      cardFeatures: {
        primaryAction: false,
        secondaryAction: false,
        directLinks: false,
        accordions: false,
      },
    });
    expect(getCardGridPresetDefinition('step-cards')?.editor).toMatchObject({
      maxCards: 3,
      cardFeatures: {
        primaryAction: true,
        secondaryAction: false,
        directLinks: false,
        accordions: false,
      },
    });
  });
});
