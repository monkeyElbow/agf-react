import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoansPage, { calculateLoanSchedule } from './LoansPage';

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    blocksByPath: {},
    pageHierarchy: {},
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({
    enabled: false,
    opacity: 15,
  }),
}));

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../hooks/useLocalBlockDrafts', () => ({
  default: ({ blocks }) => ({
    blocks,
    stageLocalBlockSetting: vi.fn(),
  }),
}));

vi.mock('../hooks/useHudDockOrder', () => ({
  default: () => ({
    orderedPanels: [],
    getDockTabDragProps: () => ({}),
    isPanelDragging: () => false,
    isPanelDragOver: () => false,
    getPanelDropPosition: () => '',
    isDockDragging: false,
  }),
}));

describe('LoansPage calculator', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('preserves the standard amortization schedule when extra principal is blank or zero', () => {
    const base = calculateLoanSchedule({
      loanAmount: '100000',
      annualRatePercent: '6',
      termYears: '15',
      displayOption: 'monthly',
    });
    const zeroExtra = calculateLoanSchedule({
      loanAmount: '100000',
      annualRatePercent: '6',
      termYears: '15',
      displayOption: 'monthly',
      additionalPrincipalPayment: '0',
    });

    expect(zeroExtra.payment).toBeCloseTo(base.payment, 6);
    expect(zeroExtra.totalPaid).toBeCloseTo(base.totalPaid, 2);
    expect(zeroExtra.totalInterest).toBeCloseTo(base.totalInterest, 2);
    expect(zeroExtra.payoffMonths).toBe(base.payoffMonths);
  });

  it('reduces payoff time and interest when extra principal is applied monthly', () => {
    const standard = calculateLoanSchedule({
      loanAmount: '100000',
      annualRatePercent: '6',
      termYears: '15',
      displayOption: 'monthly',
    });
    const accelerated = calculateLoanSchedule({
      loanAmount: '100000',
      annualRatePercent: '6',
      termYears: '15',
      displayOption: 'monthly',
      additionalPrincipalPayment: '500',
    });

    expect(accelerated.payoffMonths).toBeLessThan(standard.payoffMonths);
    expect(accelerated.totalInterest).toBeLessThan(standard.totalInterest);
    expect(accelerated.totalPaid).toBeLessThan(standard.totalPaid);
    expect(accelerated.recurringPayment).toBeGreaterThan(accelerated.payment);
  });

  it('renders the summary sheet and amortization rows after calculation', () => {
    const { container } = render(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Loan Amount ($)'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Annual Interest Rate (%)'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Term of Loan (years)'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Additional principal payment ($)'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('Accelerated payoff')).toBeTruthy();
    expect(screen.getByText('Scheduled payment')).toBeTruthy();
    expect(screen.getByText('Interest saved')).toBeTruthy();
    expect(container.querySelector('.loans-native-results-table')).toBeTruthy();
    expect(container.querySelectorAll('.loans-native-results-table tbody tr')).toHaveLength(8);
    expect(container.querySelectorAll('[data-loans-results-row]').length).toBeGreaterThan(0);
  });
});
