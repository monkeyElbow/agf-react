import { describe, expect, it } from 'vitest';
import {
  getGridCompatibleCardStyleOptions,
  getGridCompatibleToneOptions,
  getGridDefaultToneForBg,
  getGridSafeToneForBg,
  isGridCardStyleAllowedForBg,
  isGridToneAllowedForBg,
  normalizeGridBgTone,
  normalizeDynamicGridHeaderSizeRem,
  normalizeDynamicGridHeaderWidthPercent,
  normalizeDynamicGridCardTitleLineHeight,
} from './dynamicGrid';

const SHARED_TONE_OPTIONS = [
  { value: 'super-grey', label: 'Super Grey' },
  { value: 'atlantean', label: 'Blue' },
  { value: 'mango', label: 'Mango' },
  { value: 'melon', label: 'Melon' },
  { value: 'white', label: 'White' },
];

describe('dynamic grid contrast helpers', () => {
  it('allows borderless shadow cards and alternating title colors across section surfaces', () => {
    expect(isGridCardStyleAllowedForBg('borderless-shadow', 'white')).toBe(true);
    expect(isGridCardStyleAllowedForBg('borderless-shadow', 'blue')).toBe(true);
    expect(isGridToneAllowedForBg('alternating', 'white')).toBe(true);
    expect(isGridToneAllowedForBg('alternating', 'grey')).toBe(true);
    expect(getGridCompatibleCardStyleOptions([
      { value: 'card2' },
      { value: 'borderless-shadow' },
    ], 'white').map((option) => option.value)).toEqual(['card2', 'borderless-shadow']);
  });

  it('treats white as the shared safe default tone on blue and grey backgrounds', () => {
    expect(getGridDefaultToneForBg('blue')).toBe('white');
    expect(getGridDefaultToneForBg('grey')).toBe('white');
    expect(getGridSafeToneForBg('super-grey', 'blue', 'super-grey', SHARED_TONE_OPTIONS)).toBe('white');
    expect(getGridSafeToneForBg('super-grey', 'grey', 'super-grey', SHARED_TONE_OPTIONS)).toBe('white');
  });

  it('keeps super-grey available on light backgrounds', () => {
    expect(getGridDefaultToneForBg('white')).toBe('super-grey');
    expect(getGridDefaultToneForBg('sand')).toBe('super-grey');
    expect(getGridSafeToneForBg('white', 'white', 'super-grey', SHARED_TONE_OPTIONS)).toBe('super-grey');
    expect(getGridSafeToneForBg('white', 'sand', 'super-grey', SHARED_TONE_OPTIONS)).toBe('super-grey');
    expect(normalizeGridBgTone('sandstone')).toBe('sandstone');
    expect(getGridSafeToneForBg('super-grey', 'sandstone', 'super-grey', SHARED_TONE_OPTIONS)).toBe('super-grey');
    expect(isGridCardStyleAllowedForBg('card3', 'sandstone')).toBe(true);
  });

  it('removes unsafe dark-tone options from dark background compatibility lists', () => {
    expect(isGridToneAllowedForBg('super-grey', 'blue')).toBe(false);
    expect(isGridToneAllowedForBg('super-grey', 'grey')).toBe(false);
    expect(getGridCompatibleToneOptions(SHARED_TONE_OPTIONS, 'blue').map((option) => option.value)).not.toContain('super-grey');
    expect(getGridCompatibleToneOptions(SHARED_TONE_OPTIONS, 'grey').map((option) => option.value)).not.toContain('super-grey');
    expect(getGridCompatibleToneOptions(SHARED_TONE_OPTIONS, 'blue').map((option) => option.value)).toContain('white');
  });

  it('normalizes the optional Card Grid header-size slider', () => {
    expect(normalizeDynamicGridHeaderSizeRem(3.275)).toBe(3.27);
    expect(normalizeDynamicGridHeaderSizeRem(99)).toBe(4.5);
    expect(normalizeDynamicGridHeaderSizeRem(undefined)).toBe(2.9);
  });

  it('normalizes the optional Card Grid header-width slider', () => {
    expect(normalizeDynamicGridHeaderWidthPercent(72.6)).toBe(73);
    expect(normalizeDynamicGridHeaderWidthPercent(20)).toBe(40);
    expect(normalizeDynamicGridHeaderWidthPercent(140)).toBe(100);
    expect(normalizeDynamicGridHeaderWidthPercent(undefined)).toBe(100);
  });

  it('normalizes the optional Card Grid card-title line-height slider', () => {
    expect(normalizeDynamicGridCardTitleLineHeight(1.25)).toBe(1.25);
    expect(normalizeDynamicGridCardTitleLineHeight(0.2)).toBe(0.8);
    expect(normalizeDynamicGridCardTitleLineHeight(2)).toBe(1.5);
    expect(normalizeDynamicGridCardTitleLineHeight(undefined)).toBe(1.2);
  });
});
