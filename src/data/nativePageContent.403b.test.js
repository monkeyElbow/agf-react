import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) overview native page content', () => {
  it('keeps the revised rate placement, strategy labels, contribution limits, and eligibility card order', () => {
    const content = getNativePageContent('/services/retirement/403b', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const benefitsCopyIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-copy');
    const benefitsCardsIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-cards');
    const ratesIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-rate-table');
    const strategyIndex = sections.findIndex((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const strategySection = sections.find((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const qualifySection = sections.find((section) => section?.className === 'retirement-child-native-qualify');
    const enrollSection = sections.find((section) => section?.className === 'retirement-child-native-enroll');
    const contributionLimitsSection = sections.find((section) => section?.className === 'retirement-child-native-table');
    const quickCheckSection = sections.find((section) => section?.className === 'retirement-403b-native-quickcheck');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.intro?.heading).toBe('Ministry-powered retirement.');
    expect(content?.intro?.body).toEqual([
      'The AGFinancial 403(b) is designed specifically for ministers and ministry employees. It’s a powerful way to save while you serve.',
    ]);
    expect(benefitsCopyIndex).toBeGreaterThanOrEqual(0);
    expect(benefitsCardsIndex).toBeGreaterThan(benefitsCopyIndex);
    expect(ratesIndex).toBeGreaterThan(benefitsCardsIndex);
    expect(strategyIndex).toBeGreaterThan(ratesIndex);
    expect(strategySection?.actions?.map((action) => action.label)).toEqual(['View monthly performance', 'Prospectus']);
    expect(strategySection?.cards?.[0]?.links?.[0]?.label).toBe('MBA income fund PDF');
    expect(strategySection?.cards?.[3]?.title).toBe('Individual Investment Options');
    expect(enrollSection?.cards?.[1]?.title).toBe('Employer');
    expect(contributionLimitsSection?.tableChartId).toBe('retirement-403b-contribution-limits');
    expect(contributionLimitsSection?.table?.headers).toEqual(['403(b) Contribution Limit', '2026', '2025']);
    expect(quickCheckSection?.body).toEqual([
      'Answer a few questions, total your annual housing expenses, and compare to Fair Rental Value (FRV).',
    ]);
    expect(qualifySection?.cards?.map((card) => card.title)).toEqual([
      'Employees of eligible employers',
      'Others serving in a ministerial capacity',
      'Self-employed credentialed ministers',
    ]);
  });
});
