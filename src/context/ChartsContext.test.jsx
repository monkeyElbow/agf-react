import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChartsProvider, useCharts } from './ChartsContext';

function TestHarness() {
  const { charts, getChartValue, updateChart, resetCharts } = useCharts();
  const current = getChartValue('retirement-403b-contribution-limits', null);

  return (
    <div>
      <p data-testid="chart-count">{charts.length}</p>
      <p data-testid="header-value">{current?.headers?.[1] || ''}</p>
      <button
        type="button"
        onClick={() => {
          updateChart('retirement-403b-contribution-limits', {
            headers: ['403(b) Contribution Limit', 'Next year', 'Current year'],
          });
        }}
      >
        Update
      </button>
      <button type="button" onClick={() => resetCharts()}>
        Reset
      </button>
    </div>
  );
}

describe('ChartsContext', () => {
  it('exposes the seeded chart library and updates chart data', async () => {
    const user = userEvent.setup();

    render(
      <ChartsProvider>
        <TestHarness />
      </ChartsProvider>,
    );

    expect(screen.getByTestId('chart-count').textContent).toBe('1');
    expect(screen.getByTestId('header-value').textContent).toBe('2026');

    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(screen.getByTestId('header-value').textContent).toBe('Next year');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('header-value').textContent).toBe('2026');
  });
});
