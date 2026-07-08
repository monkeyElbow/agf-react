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
});
