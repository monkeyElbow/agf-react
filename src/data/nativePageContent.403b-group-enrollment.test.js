import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) group enrollment native page content', () => {
  it('restores the saved WP content in the retirement child page system', () => {
    const content = getNativePageContent('/services/retirement/403b/403b-group-enrollment', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const qualifySection = sections.find((section) => section?.className === 'retirement-child-native-qualify');
    const enrollSection = sections.find((section) => String(section?.className || '').includes('retirement-403b-group-enrollment-steps'));

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-child');
    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.hero?.lines?.map((line) => line.title)).toEqual([
      'AGFinancial 403(b)',
      'Group Enrollment',
    ]);
    expect(content?.intro?.heading).toBe('How do I enroll my staff in AGFinancial 403(b)?');
    expect(content?.intro?.actions?.map((action) => action.label)).toEqual([
      'Download Plan Summary',
    ]);
    expect(content?.intro?.body?.[0]).toContain('establish your organization’s plan');
    expect(Array.isArray(qualifySection?.cards) ? qualifySection.cards : []).toHaveLength(3);
    expect(qualifySection?.subtitle).toContain('establishing a plan');
    expect(qualifySection?.cards?.map((card) => card.title)).toEqual([
      'Assemblies of God churches',
      'General and district councils',
      'AG-affiliated 501(c)(3) ministries',
    ]);
    expect(qualifySection?.cards?.[0]?.body).toContain('church is establishing an AGFinancial 403(b) plan');
    expect(qualifySection?.cards?.[1]?.body).toContain('General Council of the Assemblies of God and District Councils');
    expect(qualifySection?.cards?.[2]?.body).toContain('tax-exempt under 501(c)(3)');
    expect(Array.isArray(enrollSection?.cards) ? enrollSection.cards : []).toHaveLength(1);
    expect(enrollSection?.cards?.map((card) => card.title)).toEqual([
      '1. Establish your plan',
    ]);
    expect(enrollSection?.subtitle).toBe('Easy steps.');
    expect(enrollSection?.cards?.[0]?.links?.map((link) => link.label)).toEqual([
      'Agreement 1: Church or QCCO',
      'Agreement 2: NQCCO',
      '403(b) Terms & Definitions',
      'Download Enrollment Form',
      'Download Payroll Deduction Form',
      'Submit securely online',
    ]);
    expect(enrollSection?.cards?.[0]?.list).toContain('Choose the correct agreement for your organization type.');
    expect(enrollSection?.cards?.[0]?.list).toContain('Complete payroll deduction setup for each participating employee.');
    expect(enrollSection?.cards?.[0]?.fineprint?.[0]).toContain('The service agreement helps define employer and AGFinancial responsibilities');
    expect(enrollSection?.cards?.[0]?.fineprint?.slice(2, 5)).toEqual([
      'AGFinancial',
      'PO Box 2515',
      'Springfield, MO 65801',
    ]);
    expect(enrollSection?.cards?.[0]?.fineprint?.[5]).toContain('417.520.0406');
    expect(sections.some((section) => String(section?.className || '').includes('retirement-child-native-rollover'))).toBe(false);
  });
});
