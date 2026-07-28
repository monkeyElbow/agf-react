import { describe, expect, it } from 'vitest';
import {
  buildCtaBandPresetSettings,
  getCtaBandPresetDefinition,
  getCtaBandPresetDefinitions,
  resolveCtaBandPresetDefinition,
  resolveCtaBandPresetId,
} from './ctaBandPresets';
import { parseLinkValueJson } from './linkValue';

describe('cta band preset definitions', () => {
  it('keeps the canonical non-form CTA presets explicit', () => {
    expect(getCtaBandPresetDefinitions().map((preset) => preset.id)).toEqual([
      'default',
      'dashboard-login',
    ]);
    expect(getCtaBandPresetDefinition('default')?.templateIds).toEqual([
      'cta_band',
    ]);
  });

  it('resolves CTA band preset identity from explicit ids and template ids', () => {
    expect(resolveCtaBandPresetId({ kind: 'cta_band', presetId: 'dashboard-login' })).toBe('dashboard-login');
    expect(resolveCtaBandPresetId({ kind: 'cta_band', templateId: 'dashboard_login_cta' })).toBe('dashboard-login');
    expect(resolveCtaBandPresetDefinition({ kind: 'cta_band', templateId: 'dashboard_login_cta' })?.label).toBe('Dashboard login');
  });

  it('keeps CTA band preset defaults and editor guardrails intentionally bounded', () => {
    const dashboardSettings = buildCtaBandPresetSettings('dashboard-login');

    expect(dashboardSettings).toMatchObject({
      title: 'Already an investor?',
      body: '',
      buttonLabel: 'Log in to manage',
    });
    expect(parseLinkValueJson(dashboardSettings.buttonLinkJson)).toEqual({
      kind: 'external',
      href: 'https://secure.agfinancial.org/',
      openInNewWindow: true,
    });
    expect(dashboardSettings).not.toEqual(expect.objectContaining({
      buttonUrl: expect.any(String),
      buttonPageRef: expect.any(String),
      buttonOpenInNewWindow: expect.any(Boolean),
    }));
    expect(getCtaBandPresetDefinition('default')?.editor).toMatchObject({
      contentFieldIds: ['title', 'body', 'bgTone'],
      actionFieldIds: ['buttonLabel', 'buttonLinkJson'],
    });
  });
});
