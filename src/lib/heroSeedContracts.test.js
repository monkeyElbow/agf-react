import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { inspectDynamicHeroSettings, normalizeDynamicHeroSettings } from '../context/ContentAdminContext';
import { HERO_SEED_CONTRACTS_BY_PATH } from './heroSeedContracts';

function getDynamicHeroSettings(pathname) {
  const blocks = Array.isArray(contentBlockBlueprintsByPath[pathname]) ? contentBlockBlueprintsByPath[pathname] : [];
  const heroBlock = blocks.find((block) => (
    block?.id === 'hero'
    && block?.kind === 'hero'
    && block?.mode === 'dynamic'
  ));

  if (!heroBlock) {
    throw new Error(`Missing dynamic hero seed for ${pathname}`);
  }

  return heroBlock.settings || {};
}

function parseLinkJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function expectActionLinkSettings(settings, buttonNumber, action) {
  const linkValue = parseLinkJson(settings[`button${buttonNumber}LinkJson`]);
  const expectedPageRef = String(action.pageRef || '');
  const expectedUrl = String(action.url || '');

  if (linkValue) {
    if (expectedPageRef) {
      expect(linkValue).toEqual(expect.objectContaining({
        kind: 'internal',
        to: expectedPageRef,
        openInNewWindow: Boolean(action.openInNewWindow),
      }));
    } else if (expectedUrl.startsWith('#')) {
      expect(linkValue).toEqual(expect.objectContaining({
        kind: 'anchor',
        href: expectedUrl,
        openInNewWindow: Boolean(action.openInNewWindow),
      }));
    } else if (expectedUrl.startsWith('/')) {
      expect(linkValue).toEqual(expect.objectContaining({
        kind: 'internal',
        to: expectedUrl,
        openInNewWindow: Boolean(action.openInNewWindow),
      }));
    } else if (expectedUrl) {
      expect(linkValue).toEqual(expect.objectContaining({
        kind: 'external',
        href: expectedUrl,
        openInNewWindow: Boolean(action.openInNewWindow),
      }));
    }
    return;
  }

  expect(String(settings[`button${buttonNumber}PageRef`] || '')).toBe(expectedPageRef);
  expect(String(settings[`button${buttonNumber}Url`] || '')).toBe(expectedUrl);
  expect(Boolean(settings[`button${buttonNumber}OpenInNewWindow`])).toBe(Boolean(action.openInNewWindow));
}

function expectHeroSettingsToMatchContract(settings, contract) {
  expect(settings.animationPreset).toBe(contract.animationPreset);
  expect(settings.bgTone).toBe(contract.bgTone);
  expect(settings.justify).toBe(contract.justify);
  expect(settings.actionJustify || '').toBe(contract.actionJustify || '');
  expect(Number(settings.lineGap)).toBe(Number(contract.lineGap));
  expect(Number(settings.lineHeight)).toBe(Number(contract.lineHeight));

  contract.lines.forEach((line, index) => {
    const lineNumber = index + 1;
    expect(String(settings[`line${lineNumber}Text`] || '')).toBe(line.text);
    expect(String(settings[`line${lineNumber}ClassName`] || '')).toBe(line.className);
    expect(String(settings[`line${lineNumber}HighlightsJson`] || '')).toBe(line.highlightsJson);
  });

  contract.actions.forEach((action, index) => {
    const buttonNumber = index + 1;
    expect(String(settings[`button${buttonNumber}Label`] || '')).toBe(action.label);
    expectActionLinkSettings(settings, buttonNumber, action);
    expect(String(settings[`button${buttonNumber}Style`] || '')).toBe(action.style);
    expect(String(settings[`button${buttonNumber}Tone`] || '')).toBe(action.tone);
  });
}

describe('hero seed contracts', () => {
  it('keeps live hero seeds aligned to their reviewed contracts', () => {
    Object.entries(HERO_SEED_CONTRACTS_BY_PATH).forEach(([pathname, contract]) => {
      expectHeroSettingsToMatchContract(getDynamicHeroSettings(pathname), contract);
    });
  });

  it('preserves explicit editable values and reports no runtime drift', () => {
    const report = inspectDynamicHeroSettings('/', {
      animationPreset: 'none',
      justify: 'right',
      actionJustify: 'right',
      titleSizeRem: 6.1,
      lineGap: 0.22,
      line1Text: 'Admin headline.',
      line1ClassName: 'home-native-eyebrow custom-class is-melon',
      line1HighlightsJson: '',
      line2Text: '',
      line2ClassName: '',
      line2HighlightsJson: '',
      button1Label: '',
    });

    expect(report.hasDrift).toBe(false);
    expect(report.repairedFields).toEqual([]);
    expect(report.normalizedSettings).toMatchObject({
      animationPreset: 'none',
      justify: 'right',
      actionJustify: 'right',
      titleSizeRem: 6.1,
      lineGap: 0.22,
      line1Text: 'Admin headline.',
      line1ClassName: 'home-native-eyebrow custom-class is-melon',
      line1HighlightsJson: '',
      line2Text: '',
      line2ClassName: '',
      line2HighlightsJson: '',
      button1Label: '',
    });
  });

  it('preserves explicit empty values instead of restoring starter content', () => {
    const normalized = normalizeDynamicHeroSettings('/', {
      line1Text: 'Convenient.',
      line1ClassName: 'home-native-eyebrow is-atlantean',
      line1HighlightsJson: '',
      line2Text: '',
      line2ClassName: '',
      line2HighlightsJson: '',
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '',
    });

    expect(normalized.line1Text).toBe('Convenient.');
    expect(normalized.line1HighlightsJson).toBe('');
    expect(normalized.line2Text).toBe('');
    expect(normalized.line3Text).toBe('');
  });

  it('does not use marketing copy to select or rewrite an investments hero shape', () => {
    const settings = {
      animationPreset: 'none',
      line1Text: 'Your investments. Your faith. Better together.',
      line1ClassName: 'line1 line2 custom-class',
      line1HighlightsJson: '[]',
      line2Text: '',
      line2ClassName: '',
      line2HighlightsJson: '',
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '',
    };
    const normalized = normalizeDynamicHeroSettings('/services/investments', settings);
    const report = inspectDynamicHeroSettings('/services/investments', settings);

    expect(normalized.animationPreset).toBe('none');
    expect(normalized.line1Text).toBe(settings.line1Text);
    expect(normalized.line1HighlightsJson).toBe('[]');
    expect(normalized.line2Text).toBe('');
    expect(normalized.line3Text).toBe('');
    expect(report.hasDrift).toBe(false);
    expect(report.repairedFields).toEqual([]);
  });

  it('uses starter defaults only for missing fields and keeps inspection read-only', () => {
    const normalized = normalizeDynamicHeroSettings('/', {});
    const report = inspectDynamicHeroSettings('/', {});

    expect(normalized.line1Text).toBe(HERO_SEED_CONTRACTS_BY_PATH['/'].lines[0].text);
    expect(report.hasDrift).toBe(false);
    expect(report.repairedFields).toEqual([]);
  });

  it('keeps the reviewed loans and investments animation contracts distinct', () => {
    expect(HERO_SEED_CONTRACTS_BY_PATH['/services/loans']?.animationPreset).toBe('loans-unblur');
    expect(HERO_SEED_CONTRACTS_BY_PATH['/services/investments']?.animationPreset).toBe('default');
  });
});
