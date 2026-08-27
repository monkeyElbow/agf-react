import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RatesBlock from './RatesBlock';

describe('RatesBlock', () => {
  it('renders the selected dataset with explicit panel and anchor identity', () => {
    render(
      <RatesBlock
        runtime={{
          dataset: 'ira',
          panelId: 'rates-ira',
          anchorId: 'ira-rates',
          displayName: 'IRA Rates',
        }}
        iraRates={[{ id: 'ira-1', product: 'IRA Certificate', rate: '3.00%', apy: '3.04%' }]}
      />,
    );

    const block = screen.getByRole('table').closest('[data-rates-block="true"]');
    expect(block?.getAttribute('data-rates-dataset')).toBe('ira');
    expect(block?.getAttribute('data-rates-panel-id')).toBe('rates-ira');
    expect(block?.getAttribute('data-rates-anchor')).toBe('ira-rates');
    expect(block?.getAttribute('data-rates-display-name')).toBe('IRA Rates');
    expect(screen.getAllByText('Ira Certificate').length).toBeGreaterThan(0);
  });
});
