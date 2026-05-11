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

function expectHeroSettingsToMatchContract(settings, contract) {
  expect(settings.animationPreset).toBe(contract.animationPreset);
  expect(settings.bgTone).toBe(contract.bgTone);
  expect(settings.justify).toBe(contract.justify);
  expect(settings.actionJustify || '').toBe(contract.actionJustify || '');
  expect(settings.lineGap).toBe(contract.lineGap);
  expect(settings.lineHeight).toBe(contract.lineHeight);

  contract.lines.forEach((line, index) => {
    const lineNumber = index + 1;
    expect(String(settings[`line${lineNumber}Text`] || '')).toBe(line.text);
    expect(String(settings[`line${lineNumber}ClassName`] || '')).toBe(line.className);
    expect(String(settings[`line${lineNumber}HighlightsJson`] || '')).toBe(line.highlightsJson);
  });

  contract.actions.forEach((action, index) => {
    const buttonNumber = index + 1;
    expect(String(settings[`button${buttonNumber}Label`] || '')).toBe(action.label);
    expect(String(settings[`button${buttonNumber}PageRef`] || '')).toBe(action.pageRef);
    expect(String(settings[`button${buttonNumber}Url`] || '')).toBe(action.url);
    expect(String(settings[`button${buttonNumber}Style`] || '')).toBe(action.style);
    expect(String(settings[`button${buttonNumber}Tone`] || '')).toBe(action.tone);
    expect(Boolean(settings[`button${buttonNumber}OpenInNewWindow`])).toBe(Boolean(action.openInNewWindow));
  });
}

describe('hero seed guardrails', () => {
  it('keeps live hero seeds aligned to their static counterparts', () => {
    Object.entries(HERO_SEED_CONTRACTS_BY_PATH).forEach(([pathname, contract]) => {
      expectHeroSettingsToMatchContract(getDynamicHeroSettings(pathname), contract);
    });
  });

  it('restores locked hero defaults when stored settings are sparse or blanked', () => {
    Object.entries(HERO_SEED_CONTRACTS_BY_PATH).forEach(([pathname, contract]) => {
      const normalized = normalizeDynamicHeroSettings(pathname, {
        line1Text: contract.lines[0]?.text || '',
        line1ClassName: '',
        line1HighlightsJson: '[]',
        line2Text: contract.lines[1]?.text || '',
        line2ClassName: '',
        line2HighlightsJson: '[]',
        line3Text: contract.lines[2]?.text || '',
        line3ClassName: '',
        line3HighlightsJson: '[]',
        button1Label: '',
        button1PageRef: '',
        button1Url: '',
        button1Style: '',
        button1Tone: '',
      });

      expectHeroSettingsToMatchContract(normalized, contract);
    });
  });

  it('reports repaired hero fields when defaults have to be restored', () => {
    const report = inspectDynamicHeroSettings('/', {
      line1Text: "Today's investment.",
      line1ClassName: '',
      line1HighlightsJson: '[]',
      line2Text: "Tomorrow's church.",
      line2ClassName: 'home-native-title',
      line2HighlightsJson: '',
      button1Label: '',
      button1PageRef: '',
      button1Style: '',
      button1Tone: '',
    });

    expect(report.hasDrift).toBe(true);
    expect(report.repairedFields.map((entry) => entry.field)).toEqual(expect.arrayContaining([
      'line1ClassName',
      'line1HighlightsJson',
      'line2ClassName',
      'line2HighlightsJson',
      'button1Label',
      'button1PageRef',
      'button1Style',
      'button1Tone',
    ]));
  });

  it('preserves intentional hero styling edits on default text while still repairing missing default highlights', () => {
    const normalized = normalizeDynamicHeroSettings('/', {
      line1Text: "Today's investment.",
      line1ClassName: 'home-native-eyebrow is-atlantean',
      line1HighlightsJson: '[{"start":8,"end":18,"className":"is-melon","text":"investment"}]',
      line2Text: "Tomorrow's church.",
      line2ClassName: 'home-native-title line1 line2 is-mango',
      line2HighlightsJson: '[{"text":"Tomorrow","className":"is-mango"}]',
    });

    expect(String(normalized.line1ClassName || '')).toBe('home-native-eyebrow is-atlantean');
    expect(String(normalized.line1HighlightsJson || '')).toBe(
      '[{"start":8,"end":18,"className":"is-melon","text":"investment"}]',
    );
    expect(String(normalized.line2ClassName || '')).toBe('home-native-title line1 line2 is-mango');
    expect(String(normalized.line2HighlightsJson || '')).toBe(
      '[{"text":"Tomorrow","className":"is-mango"}]',
    );
  });

  it('repairs non-empty but degraded hero highlight settings when expected highlight tokens are missing', () => {
    const normalized = normalizeDynamicHeroSettings('/services/investments', {
      line1Text: 'Your investments.',
      line1ClassName: 'line1',
      line1HighlightsJson: '[]',
      line2Text: 'Your faith.',
      line2ClassName: 'line2',
      line2HighlightsJson: '[]',
      line3Text: 'Better together.',
      line3ClassName: 'line3',
      line3HighlightsJson: '[]',
    });

    expect(String(normalized.line1HighlightsJson || '')).toBe(
      '[{"text":"investments","className":"is-atlantean"}]',
    );
    expect(String(normalized.line2HighlightsJson || '')).toBe(
      '[{"text":"faith","className":"is-mango"}]',
    );
    expect(String(normalized.line3HighlightsJson || '')).toBe(
      '[{"text":"together","className":"is-sandstone"}]',
    );

    const report = inspectDynamicHeroSettings('/services/investments', {
      line1Text: 'Your investments.',
      line1ClassName: 'line1',
      line1HighlightsJson: '[]',
      line2Text: 'Your faith.',
      line2ClassName: 'line2',
      line2HighlightsJson: '[]',
      line3Text: 'Better together.',
      line3ClassName: 'line3',
      line3HighlightsJson: '[]',
    });

    expect(report.hasDrift).toBe(true);
    expect(report.repairedFields.map((entry) => entry.field)).toEqual(expect.arrayContaining([
      'line1HighlightsJson',
      'line2HighlightsJson',
      'line3HighlightsJson',
    ]));
  });

  it('upgrades legacy hero animation presets from none to the managed preset for each page', () => {
    expect(normalizeDynamicHeroSettings('/', { animationPreset: 'none' }).animationPreset).toBe('default');
    expect(normalizeDynamicHeroSettings('/services/investments', { animationPreset: 'none' }).animationPreset).toBe('loans-unblur');
    expect(normalizeDynamicHeroSettings('/services/retirement', { animationPreset: 'none' }).animationPreset).toBe('default');
  });

  it('upgrades the legacy one-line investments hero into three managed lines', () => {
    const normalized = normalizeDynamicHeroSettings('/services/investments', {
      animationPreset: 'none',
      line1Text: 'Your investments. Your faith. Better together.',
      line1ClassName: 'line1 line2',
      line1HighlightsJson: '[{"text":"investments","className":"is-atlantean"},{"text":"faith","className":"is-mango"},{"text":"together","className":"is-sandstone"}]',
      line2Text: '',
      line2ClassName: '',
      line2HighlightsJson: '',
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '',
    });

    expect(normalized.animationPreset).toBe('loans-unblur');
    expect(normalized.line1Text).toBe('Your investments.');
    expect(normalized.line1ClassName).toBe('line1');
    expect(normalized.line1HighlightsJson).toBe('[{"text":"investments","className":"is-atlantean"}]');
    expect(normalized.line2Text).toBe('Your faith.');
    expect(normalized.line2ClassName).toBe('line2');
    expect(normalized.line2HighlightsJson).toBe('[{"text":"faith","className":"is-mango"}]');
    expect(normalized.line3Text).toBe('Better together.');
    expect(normalized.line3ClassName).toBe('line3');
    expect(normalized.line3HighlightsJson).toBe('[{"text":"together","className":"is-sandstone"}]');
  });
});
