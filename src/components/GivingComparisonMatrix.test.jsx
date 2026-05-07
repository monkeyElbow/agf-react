import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GivingComparisonMatrix, { givingComparisonMobileRows } from './GivingComparisonMatrix';

describe('GivingComparisonMatrix', () => {
  it('keeps the desktop table and replaces the mobile table path with question-first comparison sections', () => {
    const { container } = render(<GivingComparisonMatrix />);

    expect(screen.getByRole('table', { name: 'Charitable giving plan comparison' })).toBeTruthy();

    const mobileRoot = container.querySelector('.agf-hide-desktop');
    expect(mobileRoot).toBeTruthy();
    expect(mobileRoot?.querySelector('table[aria-label="Mobile charitable giving comparison"]')).toBeNull();
    expect(mobileRoot?.querySelectorAll('article')).toHaveLength(0);

    const mobileSections = within(mobileRoot).getAllByRole('heading', { level: 3 });
    expect(mobileSections.map((node) => node.textContent)).toEqual(
      givingComparisonMobileRows.map((row) => row.label),
    );

    const fundedSection = within(mobileRoot).getByRole('heading', { name: 'How it’s Funded' }).closest('section');
    expect(within(fundedSection).getByText('Donor Advised Fund')).toBeTruthy();
    expect(within(fundedSection).getByText('Charitable Gift Annuity')).toBeTruthy();
    expect(within(fundedSection).getByText('Endowment')).toBeTruthy();
  });

  it('keeps the existing mobile selector filtering behavior for the question-first mobile comparison', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const mobileRoot = container.querySelector('.agf-hide-desktop');

    expect(mobileRoot).toBeTruthy();
    const donorIncomeSection = within(mobileRoot)
      .getByRole('heading', { name: 'Provides Donor Income?' })
      .closest('section');
    expect(within(donorIncomeSection).queryByText('Charitable Remainder Trust')).toBeNull();

    fireEvent.click(within(mobileRoot).getByRole('button', { name: 'CRT' }));

    const nextStepSection = within(mobileRoot).getByRole('heading', { name: 'CTA' }).closest('section');
    const incomeSectionAfterSelect = within(mobileRoot)
      .getByRole('heading', { name: 'Provides Donor Income?' })
      .closest('section');

    expect(within(incomeSectionAfterSelect).getByText('Charitable Remainder Trust')).toBeTruthy();
    expect(within(incomeSectionAfterSelect).queryByText('Charitable Gift Annuity')).toBeNull();
    expect(within(nextStepSection).getAllByRole('link').length).toBe(3);
  });

  it('uses the same mobile row data to render jump links and stacked comparison sections', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const mobileRoot = container.querySelector('.agf-hide-desktop');
    const jumpNav = within(mobileRoot).getByRole('navigation', { name: 'Mobile comparison sections' });

    expect(within(jumpNav).getAllByRole('link')).toHaveLength(givingComparisonMobileRows.length);
    expect(within(jumpNav).getByRole('link', { name: 'How it’s Funded' }).getAttribute('href')).toBe('#mobile-comparison-fundedBy');
    expect(within(jumpNav).getByRole('link', { name: 'CTA' }).getAttribute('href')).toBe('#mobile-comparison-cta');
  });
});
