import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) overview native page content', () => {
  it('keeps the revised rate placement, MBA fact sheet label, and eligibility card order', () => {
    const content = getNativePageContent('/services/retirement/403b', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const benefitsCopyIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-copy');
    const benefitsCardsIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-cards');
    const ratesIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-rate-table');
    const strategyIndex = sections.findIndex((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const strategySection = sections.find((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const qualifySection = sections.find((section) => section?.className === 'retirement-child-native-qualify');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(benefitsCopyIndex).toBeGreaterThanOrEqual(0);
    expect(benefitsCardsIndex).toBeGreaterThan(benefitsCopyIndex);
    expect(ratesIndex).toBeGreaterThan(benefitsCardsIndex);
    expect(strategyIndex).toBeGreaterThan(ratesIndex);
    expect(strategySection?.cards?.[0]?.links?.[0]?.label).toBe('Download the MBA Fact sheet PDF');
    expect(qualifySection?.cards?.map((card) => card.title)).toEqual([
      'Employees of eligible employers',
      'Others serving in a ministerial capacity',
      'Self-employed credentialed ministers',
    ]);
  });
});
