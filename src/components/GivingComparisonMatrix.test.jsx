import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GivingComparisonMatrix from './GivingComparisonMatrix';

describe('GivingComparisonMatrix', () => {
  it('keeps the desktop table and renders mobile program cards instead of a mobile table', () => {
    const { container } = render(<GivingComparisonMatrix />);

    expect(screen.getByRole('table', { name: 'Charitable giving plan comparison' })).toBeTruthy();

    const mobileRoot = container.querySelector('.agf-hide-desktop');
    expect(mobileRoot).toBeTruthy();
    expect(mobileRoot?.querySelector('table[aria-label="Mobile charitable giving comparison"]')).toBeNull();

    const programCards = mobileRoot?.querySelectorAll('article') || [];
    expect(programCards).toHaveLength(3);
    expect(within(programCards[0]).getByText('How it’s Funded')).toBeTruthy();
    expect(within(programCards[0]).getByText('Minimum to Start')).toBeTruthy();
    expect(within(programCards[0]).getByText('CTA')).toBeTruthy();
  });

  it('keeps the existing mobile selector filtering behavior for the stacked cards', () => {
    const { container } = render(<GivingComparisonMatrix />);
    const mobileRoot = container.querySelector('.agf-hide-desktop');

    expect(mobileRoot).toBeTruthy();
    expect(within(mobileRoot).queryByText('Charitable Remainder Trust')).toBeNull();

    fireEvent.click(within(mobileRoot).getByRole('button', { name: 'CRT' }));

    const crtHeading = within(mobileRoot).getByText('Charitable Remainder Trust');
    const crtCard = crtHeading.closest('article');

    expect(crtHeading).toBeTruthy();
    expect(crtCard).toBeTruthy();
    expect(within(crtCard).getByRole('link', { name: 'Talk to a Consultant' })).toBeTruthy();
  });
});
