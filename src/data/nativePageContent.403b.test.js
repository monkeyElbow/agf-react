import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) overview native page content', () => {
  it('keeps the revised benefits parade, housing callout, rate placement, strategy labels, contribution limits, and eligibility card order', () => {
    const content = getNativePageContent('/services/retirement/403b', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const benefitsCopyIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-copy');
    const benefitsCardsIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-cards');
    const benefitsCalloutIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-benefits-callout');
    const ratesIndex = sections.findIndex((section) => section?.className === 'retirement-403b-native-rate-table');
    const strategyIndex = sections.findIndex((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const benefitsCopySection = sections.find((section) => section?.className === 'retirement-403b-native-benefits-copy');
    const benefitsCardsSection = sections.find((section) => section?.className === 'retirement-403b-native-benefits-cards');
    const benefitsCalloutSection = sections.find((section) => section?.className === 'retirement-403b-native-benefits-callout');
    const strategySection = sections.find((section) => String(section?.className || '').includes('retirement-403b-native-strategy-options'));
    const qualifySection = sections.find((section) => section?.className === 'retirement-child-native-qualify');
    const enrollSection = sections.find((section) => section?.className === 'retirement-child-native-enroll');
    const contributionLimitsSection = sections.find((section) => section?.className === 'retirement-child-native-table');
    const housingSection = sections.find((section) => section?.className === 'retirement-403b-native-housing');
    const quickCheckSection = sections.find((section) => section?.className === 'retirement-403b-native-quickcheck');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.intro?.heading).toBe('Ministry-powered retirement.');
    expect(content?.intro?.body).toEqual([
      'The AGFinancial 403(b) is designed specifically for ministers and ministry employees. It’s a powerful way to save while you serve.',
    ]);
    expect(benefitsCopyIndex).toBeGreaterThanOrEqual(0);
    expect(benefitsCardsIndex).toBeGreaterThan(benefitsCopyIndex);
    expect(benefitsCalloutIndex).toBeGreaterThan(benefitsCardsIndex);
    expect(strategyIndex).toBeGreaterThan(benefitsCalloutIndex);
    expect(ratesIndex).toBeGreaterThan(strategyIndex);
    expect(benefitsCopySection?.title).toBe('Benefits you’ll love.');
    expect(benefitsCardsSection?.cards).toHaveLength(8);
    expect(benefitsCardsSection?.cards?.[3]?.body).toBe('This option allows taxes to be paid on the contribution now, in order to provide tax-free withdrawals at retirement.');
    expect(benefitsCalloutSection?.title).toBe('Includes minister’s housing allowance...which you won’t find with an IRA. See details below.');
    expect(benefitsCalloutSection?.actions?.map((action) => action.label)).toEqual(['Enroll in the 403(b)']);
    expect(strategySection?.actions?.map((action) => action.label)).toEqual(['View monthly performance', 'Prospectus']);
    expect(strategySection?.cards?.[0]?.links?.[0]?.label).toBe('MBA income fund PDF');
    expect(strategySection?.cards?.[3]?.title).toBe('Individual Investment Options');
    expect(enrollSection?.cards?.[1]?.title).toBe('Employer');
    expect(contributionLimitsSection?.tableChartId).toBe('retirement-403b-contribution-limits');
    expect(contributionLimitsSection?.table?.headers).toEqual(['403(b) Contribution Limit', '2026', '2025']);
    expect(housingSection?.anchorId).toBe('retired-ministers-housing-allowance');
    expect(housingSection?.feature?.title).toBe("Retired Ministers' Housing Allowance");
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
