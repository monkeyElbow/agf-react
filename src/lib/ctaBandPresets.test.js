import { describe, expect, it } from 'vitest';
import {
  buildCtaBandPresetSettings,
  getCtaBandPresetDefinition,
  getCtaBandPresetDefinitions,
  resolveCtaBandPresetDefinition,
  resolveCtaBandPresetId,
} from './ctaBandPresets';

describe('cta band preset definitions', () => {
  it('keeps the canonical non-form CTA presets explicit', () => {
    expect(getCtaBandPresetDefinitions().map((preset) => preset.id)).toEqual([
      'default',
      'dashboard-login',
    ]);
    expect(getCtaBandPresetDefinition('default')?.templateIds).toEqual([
      'cta_band',
      'housing_allowance',
    ]);
    expect(getCtaBandPresetDefinition('dashboard-login')?.legacyBlockIds).toEqual(['investor_cta']);
  });

  it('resolves CTA band preset identity from explicit ids, template ids, and narrow legacy block ids', () => {
    expect(resolveCtaBandPresetId({ kind: 'cta_band', presetId: 'dashboard-login' })).toBe('dashboard-login');
    expect(resolveCtaBandPresetId({ kind: 'cta_band', templateId: 'investor_cta' })).toBe('dashboard-login');
    expect(resolveCtaBandPresetId({ kind: 'cta_band', id: 'housing_allowance' })).toBe('default');
    expect(resolveCtaBandPresetDefinition({ kind: 'cta_band', id: 'investor_cta' })?.label).toBe('Dashboard login');
  });

  it('keeps CTA band preset defaults and editor guardrails intentionally bounded', () => {
    expect(buildCtaBandPresetSettings('dashboard-login')).toMatchObject({
      title: 'Already an investor?',
      body: 'Log in to manage.',
      buttonLabel: 'Go to my dashboard',
      buttonUrl: 'https://secure.agfinancial.org/',
      buttonOpenInNewWindow: true,
    });
    expect(getCtaBandPresetDefinition('default')?.editor).toMatchObject({
      contentFieldIds: ['title', 'body', 'bgTone'],
      actionFieldIds: ['buttonLabel', 'buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow'],
    });
  });
});
