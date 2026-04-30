import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  heroTitleSizeRemToEditorCss,
  heroTitleSizeRemToRuntimeCss,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from './heroTitleSize';

describe('heroTitleSize', () => {
  it('falls back to the shared default headline size when the setting is missing', () => {
    expect(normalizeHeroTitleSizeRem(undefined)).toBe(DEFAULT_HERO_TITLE_SIZE_REM);
  });

  it('clamps headline size into the supported hero range', () => {
    expect(normalizeHeroTitleSizeRem(2)).toBe(4.5);
    expect(normalizeHeroTitleSizeRem(11)).toBe(9);
  });

  it('falls back to the shared default headline tracking when the setting is missing', () => {
    expect(DEFAULT_HERO_TITLE_LETTER_SPACING_EM).toBe(-0.05);
    expect(normalizeHeroTitleLetterSpacingEm(undefined)).toBe(-0.05);
  });

  it('derives shared runtime and editor font-size clamps from the same rem value', () => {
    expect(heroTitleSizeRemToRuntimeCss(7)).toBe('clamp(3.01rem, 9.2vw, 7rem)');
    expect(heroTitleSizeRemToEditorCss(7)).toBe('clamp(2.03rem, 4.1vw, 3.22rem)');
  });
});
