import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InfoTableSheet from './InfoTableSheet';

const HEADERS = ['Contribution Limit', '2025', '2024'];
const ROWS = [
  ['Under age 50', '$23,500', '$23,000'],
  ['Age 50 and up', '$31,000', '$30,500'],
];

describe('InfoTableSheet', () => {
  it('renders the shared desktop table shell and mobile cards from one headers/rows source without legacy data-table markup', () => {
    const { container } = render(<InfoTableSheet headers={HEADERS} rows={ROWS} />);

    expect(container.querySelector('.info-table-sheet__desktop')).toBeTruthy();
    expect(container.querySelector('.info-table-sheet__mobile')).toBeTruthy();
    expect(screen.getAllByText('Contribution Limit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2025').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Under age 50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$23,500').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$23,000').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.info-table-sheet__card')).toHaveLength(2);
    expect(container.querySelector('.data-table')).toBeNull();
  });

  it('can render all visible columns as data cells without a hidden row-header column', () => {
    const { container } = render(
      <InfoTableSheet
        headers={['Traditional IRA', 'Roth IRA']}
        rows={[
          [
            'Eligibility\nMust have earned income.',
            'Eligibility\nMust meet Roth IRA income eligibility limits.',
          ],
        ]}
        firstColumnHeader={false}
      />,
    );

    expect(container.querySelector('.info-table-sheet')?.getAttribute('data-info-table-first-column-header')).toBe('false');
    expect(container.querySelectorAll('tbody th[scope="row"]')).toHaveLength(0);
    expect(container.querySelectorAll('tbody td')).toHaveLength(2);
    expect(container.querySelectorAll('tbody .info-table-sheet__cell-kicker')).toHaveLength(2);
    expect(container.querySelectorAll('.info-table-sheet__card-value .info-table-sheet__cell-kicker')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: /eligibility/i })).toBeNull();
    expect(screen.getAllByText('Traditional IRA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Roth IRA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Eligibility').length).toBeGreaterThan(0);
  });
});
