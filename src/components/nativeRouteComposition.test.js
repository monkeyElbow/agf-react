import { describe, expect, it, vi } from 'vitest';
import {
  composeConsultantSections,
  composeRetirement403bSections,
} from './nativeRouteComposition';

describe('native route composition helpers', () => {
  it('injects canonical 403(b) dynamic sections before enroll and leaves unrelated dynamic sections for later append', () => {
    const baseContent = {
      sections: [
        { className: 'retirement-403b-native-rate-table', title: 'Rates' },
        { className: 'retirement-child-native-strategies retirement-403b-native-strategy-options', title: 'Fallback strategies' },
        { className: 'retirement-403b-native-strategy-enroll-cta', title: 'Strategy enroll CTA' },
        { className: 'retirement-child-native-qualify', title: 'Fallback qualify' },
        { className: 'retirement-child-native-enroll', title: 'Enroll' },
        { className: 'retirement-child-native-rollover', title: 'Fallback rollover' },
        { className: 'retirement-child-native-table', title: 'Limits' },
      ],
    };
    const dynamicSections = [
      { blockId: 'investment_strategy_heading', className: 'dynamic-billboard', title: 'Strategy heading' },
      { blockId: 'investment_strategy_options', className: 'native-dynamic-grid', title: 'Strategy grid' },
      { blockId: 'who_qualifies', className: 'native-dynamic-grid', title: 'Qualify grid' },
      { blockId: 'page_content', className: 'native-dynamic-page-content', title: 'Loans' },
      { blockId: 'loan_apply', className: 'native-dynamic-grid', title: 'How to apply' },
      { blockId: 'rollover_billboard', className: 'dynamic-billboard retirement-everyday retirement-rollover-billboard', title: 'Rollover billboard' },
      { blockId: 'newsletter_block', className: 'native-dynamic-newsletter', title: 'Newsletter' },
    ];

    const result = composeRetirement403bSections({
      pathname: '/services/retirement/403b',
      baseContent,
      dynamicSections,
    });

    expect(result.nextBaseContent.sections.map((section) => section.title)).toEqual([
      'Qualify grid',
      'Strategy heading',
      'Strategy grid',
      'Strategy enroll CTA',
      'Loans',
      'How to apply',
      'Enroll',
      'Rates',
      'Limits',
      'Rollover billboard',
    ]);
    expect(result.remainingDynamicSections.map((section) => section.blockId)).toEqual(['newsletter_block']);
  });

  it('keeps fallback 403(b) native sections when the matching dynamic sections are absent', () => {
    const baseContent = {
      sections: [
        { className: 'retirement-child-native-strategies retirement-403b-native-strategy-options', title: 'Fallback strategies' },
        { className: 'retirement-403b-native-strategy-enroll-cta', title: 'Strategy enroll CTA' },
        { className: 'retirement-child-native-qualify', title: 'Fallback qualify' },
        { className: 'retirement-child-native-enroll', title: 'Enroll' },
      ],
    };
    const dynamicSections = [
      { blockId: 'newsletter_block', className: 'native-dynamic-newsletter', title: 'Newsletter' },
    ];

    const result = composeRetirement403bSections({
      pathname: '/services/retirement/403b',
      baseContent,
      dynamicSections,
    });

    expect(result.nextBaseContent.sections).toEqual([
      { className: 'retirement-child-native-qualify', title: 'Fallback qualify' },
      { className: 'retirement-child-native-strategies retirement-403b-native-strategy-options', title: 'Fallback strategies' },
      { className: 'retirement-403b-native-strategy-enroll-cta', title: 'Strategy enroll CTA' },
      { className: 'retirement-child-native-enroll', title: 'Enroll' },
    ]);
    expect(result.remainingDynamicSections).toEqual(dynamicSections);
  });

  it('does not apply 403(b) replacement on unrelated native routes', () => {
    const baseContent = {
      sections: [
        { className: 'retirement-child-native-strategies retirement-403b-native-strategy-options', title: 'Fallback strategies' },
        { className: 'retirement-child-native-enroll', title: 'Enroll' },
      ],
    };
    const dynamicSections = [
      { blockId: 'investment_strategy_heading', className: 'dynamic-billboard', title: 'Strategy heading' },
    ];

    const result = composeRetirement403bSections({
      pathname: '/services/retirement/iras',
      baseContent,
      dynamicSections,
    });

    expect(result.nextBaseContent).toBe(baseContent);
    expect(result.remainingDynamicSections).toBe(dynamicSections);
  });

  it('augments consultant child pages only on the consultant routes', () => {
    const getConsultants = vi.fn(() => [
      {
        name: 'Jordan Smith',
        credentials: 'CFP',
        region: 'Midwest',
        phone: '(417) 555-0100',
        email: 'jordan@example.com',
        states: ['MO', 'KS'],
      },
    ]);
    const sections = [
      { className: 'hero-shell', title: 'Hero' },
      { className: 'loans-consultant-native-locations', title: 'Consultants', cards: [] },
    ];

    const result = composeConsultantSections({
      pathname: '/services/loans/loan-consultants',
      pagePath: '/services/loans/loan-consultants',
      sections,
      getConsultants,
    });

    expect(getConsultants).toHaveBeenCalledWith('loans');
    expect(result[1].cards).toEqual([
      {
        title: 'Jordan Smith',
        titleSuffix: 'CFP',
        subtitle: 'Midwest',
        phone: '(417) 555-0100',
        phoneHref: 'tel:4175550100',
        messagePanel: true,
        messageCta: 'Message Jordan',
        consultantEmail: 'jordan@example.com',
        states: ['MO', 'KS'],
        service: 'loans',
        pagePath: '/services/loans/loan-consultants',
        inquiryLabel: 'Loan consultant inquiry',
      },
    ]);
  });

  it('does not use consultant augmentation on unrelated native routes', () => {
    const getConsultants = vi.fn(() => []);
    const sections = [{ className: 'loans-consultant-native-locations', title: 'Consultants', cards: [] }];

    const result = composeConsultantSections({
      pathname: '/services/retirement/403b',
      pagePath: '/services/retirement/403b',
      sections,
      getConsultants,
    });

    expect(result).toBe(sections);
    expect(getConsultants).not.toHaveBeenCalled();
  });
});
