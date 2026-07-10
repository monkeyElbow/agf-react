import { describe, expect, it } from 'vitest';
import { getResourceCategoryTone } from './resourceCategoryTone';

describe('getResourceCategoryTone', () => {
  it('maps finance-style resource categories to sandstone', () => {
    expect(getResourceCategoryTone('Article')).toBe('sandstone');
    expect(getResourceCategoryTone('Personal Finance')).toBe('sandstone');
    expect(getResourceCategoryTone('Document')).toBe('sandstone');
  });

  it('maps major resource categories to their intended tones', () => {
    expect(getResourceCategoryTone('Loans')).toBe('atlantean');
    expect(getResourceCategoryTone('Insurance')).toBe('melon');
    expect(getResourceCategoryTone('Retirement')).toBe('super-grey');
    expect(getResourceCategoryTone('Planned Giving')).toBe('mango');
  });
});
