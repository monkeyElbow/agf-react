import { describe, expect, it, vi } from 'vitest';
import {
  composeConsultantSections,
} from './nativeRouteComposition';

describe('native route composition helpers', () => {
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
