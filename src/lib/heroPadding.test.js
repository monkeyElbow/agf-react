import { describe, expect, it } from 'vitest';
import {
  HERO_PADDING_DEFAULT_REM,
  HERO_PADDING_STEP_REM,
  normalizeHeroPaddingRem,
} from './heroPadding';

describe('Hero padding contract', () => {
  it('normalizes the shared default and arbitrary values to the slider step', () => {
    expect(HERO_PADDING_DEFAULT_REM % HERO_PADDING_STEP_REM).toBe(0);
    expect(normalizeHeroPaddingRem(undefined)).toBe(2.5);
    expect(normalizeHeroPaddingRem(2.45)).toBe(2.5);
    expect(normalizeHeroPaddingRem(2.74)).toBe(2.75);
  });

  it('normalizes top and bottom values independently', () => {
    const settings = { paddingTopRem: 2.75, paddingBottomRem: 2.25 };

    expect(normalizeHeroPaddingRem(settings.paddingTopRem)).toBe(2.75);
    expect(normalizeHeroPaddingRem(settings.paddingBottomRem)).toBe(2.25);
  });
});
