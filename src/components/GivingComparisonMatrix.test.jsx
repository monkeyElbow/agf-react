import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GivingComparisonMatrix, {
  defaultGivingComparisonSelectedIds,
  givingComparisonMobileRows,
  givingComparisonPrograms,
} from './GivingComparisonMatrix';

describe('GivingComparisonMatrix', () => {
  it('keeps all 7 charitable giving programs available in the component data', () => {
    expect(givingComparisonPrograms).toHaveLength(7);
    expect(givingComparisonPrograms.map((program) => program.name)).toEqual([
      'Donor Advised Fund',
      'Endowment',
      'Charitable Gift Annuity',
      'Charitable Remainder Trust',
      'Deferred Charitable Gift Annuity',
      'Charitable Remainder Annuity Trust',
      'Charitable Lead Trust',
    ]);
    expect(givingComparisonPrograms.map((program) => program.ctaLabel)).toEqual([
      'Talk to a Consultant',
      'Talk to a Consultant',
      'Learn More',
      'Talk to a Consultant',
      'Learn More',
      'Talk to a Consultant',
      'Talk to a Consultant',
    ]);
  });

  it('defaults desktop comparison to the selected core plans instead of rendering all 7 side by side', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const desktopRoot = container.querySelector('.agf-hide-mobile');
    const selectedGroup = within(desktopRoot).getByRole('group', { name: 'Selected programs to compare' });
    const comparisonTable = within(desktopRoot).getByRole('table', { name: 'Charitable giving plan comparison' });

    expect(screen.getByText('Comparing 3 of 7 programs')).toBeTruthy();
    expect(within(desktopRoot).getByRole('button', { name: 'Compare all 7' })).toBeTruthy();

    defaultGivingComparisonSelectedIds.forEach((id) => {
      const program = givingComparisonPrograms.find((entry) => entry.id === id);
      expect(program).toBeTruthy();
      expect(within(selectedGroup).getByRole('button', { name: new RegExp(program.name) }).getAttribute('aria-pressed')).toBe('true');
      expect(within(comparisonTable).getAllByText(program.name).length).toBeGreaterThan(0);
    });

    expect(within(comparisonTable).queryByText('Charitable Remainder Trust')).toBeNull();
    expect(within(comparisonTable).queryByText('Deferred Charitable Gift Annuity')).toBeNull();
  });

  it('keeps a full comparison option for power users on desktop', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const desktopRoot = container.querySelector('.agf-hide-mobile');

    fireEvent.click(within(desktopRoot).getByRole('button', { name: 'Compare all 7' }));

    expect(screen.getByText('Viewing all 7 matching programs')).toBeTruthy();
    expect(within(desktopRoot).getByRole('button', { name: 'Return to selected' })).toBeTruthy();

    const comparisonTable = within(desktopRoot).getByRole('table', { name: 'Charitable giving plan comparison' });
    givingComparisonPrograms.forEach((program) => {
      expect(within(comparisonTable).getAllByText(program.name).length).toBeGreaterThan(0);
    });
  });

  it('keeps the existing filters working with the selected desktop comparison view', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const desktopRoot = container.querySelector('.agf-hide-mobile');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Provides donor income' }));

    expect(screen.getByText('Comparing 1 of 7 programs')).toBeTruthy();
    expect(screen.getByText('4 programs match the current filters.')).toBeTruthy();

    const comparisonTable = within(desktopRoot).getByRole('table', { name: 'Charitable giving plan comparison' });
    expect(within(comparisonTable).getByText('Charitable Gift Annuity')).toBeTruthy();
    expect(within(comparisonTable).queryByText('Donor Advised Fund')).toBeNull();
    expect(within(comparisonTable).queryByText('Endowment')).toBeNull();
  });

  it('defaults mobile to card-first selected plans instead of the full row-by-row comparison view', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const mobileRoot = container.querySelector('.agf-hide-desktop');

    expect(within(mobileRoot).getByText('Showing 3 selected of 7 matching programs')).toBeTruthy();
    expect(within(mobileRoot).queryByRole('navigation', { name: 'Mobile comparison sections' })).toBeNull();
    expect(within(mobileRoot).getAllByRole('article')).toHaveLength(3);
    expect(within(mobileRoot).getByRole('button', { name: 'View full comparison' })).toBeTruthy();
    expect(within(mobileRoot).getByRole('heading', { name: 'Donor Advised Fund' })).toBeTruthy();
    expect(within(mobileRoot).getByRole('heading', { name: 'Endowment' })).toBeTruthy();
    expect(within(mobileRoot).getByRole('heading', { name: 'Charitable Gift Annuity' })).toBeTruthy();
  });

  it('reveals the detailed mobile comparison rows only after the user asks for the full comparison', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const mobileRoot = container.querySelector('.agf-hide-desktop');

    fireEvent.click(within(mobileRoot).getByRole('button', { name: 'View full comparison' }));

    const jumpNav = within(mobileRoot).getByRole('navigation', { name: 'Mobile comparison sections' });
    expect(within(jumpNav).getAllByRole('link')).toHaveLength(givingComparisonMobileRows.length);
    expect(within(jumpNav).getByRole('link', { name: 'How it’s Funded' }).getAttribute('href')).toBe('#mobile-comparison-fundedBy');
    expect(within(jumpNav).getByRole('link', { name: 'CTA' }).getAttribute('href')).toBe('#mobile-comparison-cta');
  });
});
