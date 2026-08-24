import { describe, expect, it } from 'vitest';
import {
  BUTTON_TONE_OPTIONS,
  HERO_TEXT_COLOR_OPTIONS,
  INTRO_ACCENT_TONE_OPTIONS,
  PANEL_TEXT_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  getTokenSwatch,
  normalizeButtonTone,
  normalizeIntroAccentTone,
  normalizePanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
  resolveIntroAccentColor,
  resolvePanelTextToneClassName,
} from './colorSystem';

describe('color system helpers', () => {
  it('normalizes legacy semantic text color aliases onto canonical class names', () => {
    expect(normalizeSemanticTextColorClass('blue')).toBe('is-atlantean');
    expect(normalizeSemanticTextColorClass('atlantean')).toBe('is-atlantean');
    expect(normalizeSemanticTextColorClass('supergrey')).toBe('is-super-grey');
    expect(normalizeSemanticTextColorClass('sand')).toBe('is-sandstone');
    expect(normalizeSemanticTextColorClass('white')).toBe('is-white');
    expect(normalizeSemanticTextColorClass('')).toBe('');
  });

  it('keeps shared surface, panel, button, and intro tone normalization compatible', () => {
    expect(normalizeSurfaceBgTone('BLUE')).toBe('blue');
    expect(normalizeSurfaceBgTone('unknown', 'sand')).toBe('sand');

    expect(normalizePanelTextTone('white')).toBe('white');
    expect(normalizePanelTextTone('unknown', 'blue')).toBe('blue');
    expect(resolvePanelTextToneClassName('blue')).toBe('is-atlantean');

    expect(normalizeButtonTone('melon')).toBe('melon');
    expect(normalizeButtonTone('unknown', 'white')).toBe('white');

    expect(normalizeIntroAccentTone('muted')).toBe('super-grey');
    expect(normalizeIntroAccentTone('sand')).toBe('sandstone');
    expect(normalizeIntroAccentTone('is-atlantean')).toBe('atlantean');
  });

  it('resolves preview accent colors from the same semantic intro tone map', () => {
    expect(resolveIntroAccentColor('blue')).toBe('var(--ag-color-atlantean)');
    expect(resolveIntroAccentColor('mango')).toBe('var(--ag-color-mango)');
    expect(resolveIntroAccentColor('sand')).toBe('var(--ag-color-sandstone)');
    expect(resolveIntroAccentColor('white')).toBe('var(--ag-color-white)');
    expect(resolveIntroAccentColor('')).toBe('');
  });

  it('backs editor swatches with token-linked palette definitions', () => {
    expect(SEMANTIC_TEXT_COLOR_OPTIONS.map((option) => option.value)).toEqual([
      'is-atlantean',
      'is-mango',
      'is-melon',
      'is-sandstone',
      'is-super-grey',
      'is-white',
    ]);
    expect(HERO_TEXT_COLOR_OPTIONS.at(-1)).toMatchObject({ value: '', hideSwatch: true });
    expect(HERO_TEXT_COLOR_OPTIONS[0]).toMatchObject({ value: 'is-atlantean', label: 'Blue' });
    expect(SURFACE_BG_TONE_OPTIONS.map((option) => option.value)).toEqual(['white', 'sand', 'blue', 'grey']);
    expect(PANEL_TEXT_TONE_OPTIONS.map((option) => option.value)).toEqual(['dark', 'white', 'blue']);
    expect(BUTTON_TONE_OPTIONS.map((option) => option.value)).toEqual(['atlantean', 'super-grey', 'mango', 'melon', 'white']);
    expect(INTRO_ACCENT_TONE_OPTIONS.map((option) => option.value)).toEqual(['', 'atlantean', 'sandstone', 'super-grey', 'mango', 'melon', 'white']);

    expect(getTokenSwatch('blue')).toContain('var(--ag-color-atlantean)');
    expect(getTokenSwatch('blue')).toContain('var(--ag-surface-blue-angle)');
    expect(getTokenSwatch('atlantean')).toBe('var(--ag-color-atlantean)');
    expect(getTokenSwatch('sand')).toContain('var(--ag-color-sand)');
    expect(getTokenSwatch('sand')).toBe('linear-gradient(147deg, var(--ag-color-sand) 62%, var(--ag-color-sand-dark) 100%)');
    expect(getTokenSwatch('sandstone')).toBe('linear-gradient(145deg, var(--ag-color-sandstone) 0%, var(--ag-color-sandstone-dark) 100%)');
    expect(getTokenSwatch('super-grey')).toContain('var(--ag-color-super-grey)');
  });
});
