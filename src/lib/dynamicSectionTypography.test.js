import { describe, expect, it } from 'vitest';
import {
  buildBillboardSubtitleStyle,
  buildBillboardTitleStyle,
  normalizeBillboardSubtitleSizeRem,
  normalizeIntroLineSpacing,
} from './dynamicSectionTypography';

describe('dynamicSectionTypography', () => {
  it('keeps intro line spacing on the shared rounded clamp path', () => {
    expect(normalizeIntroLineSpacing(undefined)).toBe(1.04);
    expect(normalizeIntroLineSpacing(1.237)).toBe(1.24);
    expect(normalizeIntroLineSpacing(2)).toBe(1.4);
    expect(normalizeIntroLineSpacing(0.1)).toBe(0.85);
  });

  it('keeps billboard subtitle sizes on their own normalization path', () => {
    expect(normalizeBillboardSubtitleSizeRem(undefined)).toBe(1.18);
    expect(normalizeBillboardSubtitleSizeRem(1.36)).toBe(1.36);
    expect(normalizeBillboardSubtitleSizeRem(0.2)).toBe(1);
  });

  it('builds shared billboard title and subtitle styles from the same normalized inputs', () => {
    expect(buildBillboardTitleStyle({
      lineSpacing: 1.049,
      titleFontFamily: 'helv',
      titleFontWeight: 715,
      titleSizeRem: 3.37,
      titleLetterSpacingEm: -0.017,
    })).toEqual({
      lineHeight: 1.05,
      fontFamily: 'var(--ag-font-helv)',
      fontWeight: 700,
      fontSize: 'clamp(calc(3.37rem * 0.58), 8vw, 3.37rem)',
      letterSpacing: '-0.017em',
    });

    expect(buildBillboardSubtitleStyle({
      resolvedColor: 'var(--ag-color-mango)',
      subtitleDisplay: 'supporting',
      subtitleSizeRem: 1.42,
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      titleSizeRem: 3.4,
      titleLetterSpacingEm: -0.015,
    })).toEqual({
      color: 'var(--ag-color-mango)',
      fontSize: 'clamp(calc(1.42rem * 0.68), 5vw, 1.42rem)',
    });
  });
});
