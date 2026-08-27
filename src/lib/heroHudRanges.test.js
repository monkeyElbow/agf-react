import { describe, expect, it } from 'vitest';
import {
  isHeroDarkBgTone,
  resolveHeroLineDisplayClassName,
} from './heroHudRanges';

describe('heroHudRanges display class helpers', () => {
  it('treats blue and grey hero backgrounds as dark tones', () => {
    expect(isHeroDarkBgTone('blue')).toBe(true);
    expect(isHeroDarkBgTone('grey')).toBe(true);
    expect(isHeroDarkBgTone('white')).toBe(false);
    expect(isHeroDarkBgTone('sand')).toBe(false);
  });

  it('adds white display contrast on dark hero backgrounds when no explicit line color exists', () => {
    expect(resolveHeroLineDisplayClassName('line1', 'blue')).toBe('line1 is-white');
    expect(resolveHeroLineDisplayClassName('line2', 'grey')).toBe('line2 is-white');
  });

  it('preserves explicit line colors instead of layering auto-white on top', () => {
    expect(resolveHeroLineDisplayClassName('line1 is-super-grey', 'blue')).toBe('line1 is-super-grey');
    expect(resolveHeroLineDisplayClassName('line2 is-atlantean', 'grey')).toBe('line2 is-atlantean');
  });

  it('canonicalizes conflicting stored line colors so HUD and public CSS cannot disagree', () => {
    expect(resolveHeroLineDisplayClassName('line1 is-mango is-white', 'white')).toBe('line1 is-white');
    expect(resolveHeroLineDisplayClassName('line2 is-super-grey is-atlantean', 'blue')).toBe('line2 is-atlantean');
  });

  it('normalizes legacy blue aliases to the canonical Atlantean class at render time', () => {
    expect(resolveHeroLineDisplayClassName('line2 blue', 'white')).toBe('line2 is-atlantean');
  });

  it('keeps explicit white and fallback line classes intact on light backgrounds', () => {
    expect(resolveHeroLineDisplayClassName('is-white', 'white', 'line1')).toBe('line1 is-white');
    expect(resolveHeroLineDisplayClassName('', 'sand', 'line3')).toBe('line3');
  });
});
