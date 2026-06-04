import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IraRatesSheet from './IraRatesSheet';

const IRA_RATES = [
  { id: 'ira-demand', product: 'DEMAND', rate: '3.625%', apy: '3.69%' },
  { id: 'ira-1-year-fixed', product: '1-YEAR FIXED', rate: '3.750%', apy: '3.82%' },
  { id: 'ira-3-year-fixed', product: '3-YEAR FIXED', rate: '3.750%', apy: '3.82%' },
  { id: 'ira-5-year-fixed', product: '5-YEAR FIXED', rate: '3.750%', apy: '3.82%' },
  { id: 'ira-5-year-adj', product: '5-YEAR ADJ.', rate: '3.625%', apy: '3.69%' },
];

describe('IraRatesSheet', () => {
  it('renders the IRA rows in the shared rates-sheet visual system without changing the values', () => {
    const { container } = render(<IraRatesSheet rates={IRA_RATES} />);

    expect(container.querySelector('.ira-rates-sheet__desktop')).toBeTruthy();
    expect(container.querySelector('.ira-rates-sheet__mobile')).toBeTruthy();
    expect(container.querySelectorAll('.ira-rates-sheet__card')).toHaveLength(5);
    expect(screen.getAllByText('Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1-Year Fixed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3-Year Fixed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-Year Fixed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-Year Adj.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.625%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.750%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.69%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.82%').length).toBeGreaterThan(0);
    expect(container.querySelector('.table-scroll')).toBeNull();
  });
});
