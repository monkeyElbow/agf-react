import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CertificateRatesSheet from './CertificateRatesSheet';

const CERTIFICATE_RATES = [
  { id: 'demand', product: 'DEMAND', standardRate: '3.625%', standardApy: '3.686%', premiumRate: 'N/A', premiumApy: 'N/A' },
  { id: '3-month', product: '3-MONTH', standardRate: '3.929%', standardApy: '4.001%', premiumRate: 'N/A', premiumApy: 'N/A' },
  { id: '6-month', product: '6-MONTH', standardRate: '3.875%', standardApy: '3.945%', premiumRate: '4.125%', premiumApy: '4.204%' },
  { id: '1-year', product: '1-YEAR', standardRate: '3.750%', standardApy: '3.815%', premiumRate: '4.000%', premiumApy: '4.074%' },
  { id: '2-year', product: '2-YEAR', standardRate: '3.750%', standardApy: '3.815%', premiumRate: '4.000%', premiumApy: '4.074%' },
  { id: '3-year', product: '3-YEAR', standardRate: '3.750%', standardApy: '3.815%', premiumRate: '4.000%', premiumApy: '4.074%' },
  { id: '4-year', product: '4-YEAR', standardRate: '3.750%', standardApy: '3.815%', premiumRate: '4.000%', premiumApy: '4.074%' },
  { id: '5-year', product: '5-YEAR', standardRate: '3.750%', standardApy: '3.815%', premiumRate: '4.000%', premiumApy: '4.074%' },
];

describe('CertificateRatesSheet', () => {
  it('renders independent desktop bands and mobile term cards for every certificate row without grouping terms', () => {
    const { container } = render(<CertificateRatesSheet rates={CERTIFICATE_RATES} />);

    expect(screen.getAllByText('Standard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Premium').length).toBeGreaterThan(0);
    expect(screen.getByText('Investment Type')).toBeTruthy();
    expect(screen.getByText('Standard APY*')).toBeTruthy();
    expect(screen.getByText('Standard Rate')).toBeTruthy();
    expect(screen.getByText('Premium APY*')).toBeTruthy();
    expect(screen.getByText('Premium Rate**')).toBeTruthy();
    expect(container.querySelector('.certificate-rates-sheet__desktop')).toBeTruthy();
    expect(container.querySelector('.certificate-rates-sheet__mobile')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'APY*' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Rate' }).getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelectorAll('.certificate-rates-sheet__term-card')).toHaveLength(8);
    expect(container.querySelectorAll('.certificate-rates-sheet__term-compare')).toHaveLength(8);
    expect(container.querySelectorAll('.certificate-rates-sheet__term-side')).toHaveLength(16);
    expect(container.querySelectorAll('.certificate-rates-sheet__term-side-label')).toHaveLength(16);
    expect(container.querySelectorAll('.certificate-rates-sheet__term-metric')).toHaveLength(16);
    expect(container.querySelector('.certificate-rates-sheet__term-band')).toBeNull();
    expect(screen.getAllByText('Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3-Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('6-Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1-Year').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2-Year').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3-Year').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4-Year').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-Year').length).toBeGreaterThan(0);
    expect(screen.queryByText('2–5 Year')).toBeNull();
    expect(screen.queryByText('2-5 Year')).toBeNull();
    expect(container.querySelector('.table-scroll')).toBeNull();
  });

  it('renders certificate values exactly as provided, with N/A states preserved', () => {
    render(<CertificateRatesSheet rates={CERTIFICATE_RATES} />);

    expect(screen.getAllByText('3.625%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.686%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.929%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.001%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.875%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.945%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.125%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.204%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.000%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.074%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('defaults mobile cards to APY and can switch to rate mode using the same row data', () => {
    render(<CertificateRatesSheet rates={CERTIFICATE_RATES} />);

    const apyButton = screen.getByRole('button', { name: 'APY*' });
    const rateButton = screen.getByRole('button', { name: 'Rate' });

    expect(apyButton.getAttribute('aria-pressed')).toBe('true');
    expect(rateButton.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getAllByText('3.686%').length).toBeGreaterThan(0);

    fireEvent.click(rateButton);

    expect(apyButton.getAttribute('aria-pressed')).toBe('false');
    expect(rateButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('3.625%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.125%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.000%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});
