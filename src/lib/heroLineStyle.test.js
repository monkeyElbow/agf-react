import { describe, expect, it } from 'vitest';
import {
  buildHeroLineStyle,
  normalizeHeroLineGapEm,
  normalizeHeroLineHeightEm,
} from './heroLineStyle';

describe('heroLineStyle', () => {
  it('allows negative line gaps so page render can match HUD preview tightening', () => {
    expect(normalizeHeroLineGapEm(-0.08)).toBe(-0.08);
    expect(normalizeHeroLineGapEm(-1)).toBe(-0.18);
    expect(normalizeHeroLineGapEm(1)).toBe(0.4);
  });

  it('builds a stacked hero line style with shared spacing, size, and tracking', () => {
    expect(buildHeroLineStyle({
      lineHeight: 0.9,
      fontSize: 'clamp(3rem, 9vw, 7rem)',
      letterSpacing: '-0.05em',
      lineGap: -0.08,
      lineIndex: 1,
    })).toEqual({
      lineHeight: 0.9,
      fontSize: 'clamp(3rem, 9vw, 7rem)',
      letterSpacing: '-0.05em',
      marginTop: '-0.08em',
    });
  });

  it('normalizes shared hero line height bounds', () => {
    expect(normalizeHeroLineHeightEm(undefined)).toBe(0.9);
    expect(normalizeHeroLineHeightEm(0.4)).toBe(0.72);
    expect(normalizeHeroLineHeightEm(1.6)).toBe(1.2);
  });
});
