import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('service root native page content shells', () => {
  it('keeps custom-owned root service pages on shell-only native seeds without dormant fallback widgets', () => {
    const loansContent = getNativePageContent('/services/loans', '');
    const investmentsContent = getNativePageContent('/services/investments', '');
    const retirementContent = getNativePageContent('/services/retirement', '');

    expect(Array.isArray(loansContent?.sections) ? loansContent.sections : []).toEqual([]);
    expect(Array.isArray(investmentsContent?.sections) ? investmentsContent.sections : []).toEqual([]);
    expect(Array.isArray(retirementContent?.sections) ? retirementContent.sections : []).toEqual([]);

    expect(loansContent?.intro?.heading).toBe('The right loan can change everything.');
    expect(investmentsContent?.intro?.heading).toBe('Invest like it matters. Because it does.');
    expect(retirementContent?.intro?.heading).toBe('Invest in tomorrow. Start today.');
  });
});
