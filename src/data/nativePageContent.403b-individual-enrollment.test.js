import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) individual enrollment native page content', () => {
  it('restores the WP enrollment content in the retirement child page system', () => {
    const content = getNativePageContent('/services/retirement/403b/403b-individual-enrollment', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const qualifySection = sections.find((section) => section?.className === 'retirement-child-native-qualify');
    const enrollSection = sections.find((section) => section?.className === 'retirement-child-native-strategies');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-child');
    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.hero?.lines?.map((line) => line.title)).toEqual([
      'AGFinancial 403(b)',
      'Individual Enrollment',
    ]);
    expect(content?.intro?.heading).toBe('Start with the 403(b) plan summary.');
    expect(content?.intro?.body).toEqual([
      'Review the plan summary for eligibility, participation details, and key enrollment information before you complete your forms.',
    ]);
    expect(content?.intro?.actions?.[0]?.label).toBe('Download 403(b) Summary PDF');
    expect(Array.isArray(qualifySection?.cards) ? qualifySection.cards : []).toHaveLength(3);
    expect(qualifySection?.cards?.map((card) => card.title)).toEqual([
      'Self-employed credentialed ministers',
      'Ministers serving outside AG organizations',
      'Employees of eligible employers',
    ]);
    expect(Array.isArray(enrollSection?.cards) ? enrollSection.cards : []).toHaveLength(3);
    expect(enrollSection?.subtitle).toBe('Three steps. One clear path.');
    expect(enrollSection?.cards?.[0]?.actions?.[0]?.label).toBe('Download Enrollment Form');
    expect(enrollSection?.cards?.[1]?.actions?.[0]?.label).toBe('Submit securely online');
    expect(enrollSection?.cards?.[2]?.actions?.[0]?.label).toBe('Download Payroll Deduction Form');
    expect(enrollSection?.addressBlock?.title).toBe('Mail or fax completed forms to:');
    expect(enrollSection?.addressBlock?.lines).toEqual([
      'AGFinancial',
      'PO Box 2515',
      'Springfield, MO 65801',
    ]);
    expect(enrollSection?.fineprint).toContain('417.520.0406');
    expect(sections.some((section) => section?.className === 'retirement-child-native-rollover')).toBe(false);
  });
});
