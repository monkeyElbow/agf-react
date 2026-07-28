import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GivingComparisonMatrix from './GivingComparisonMatrix';

describe('GivingComparisonMatrix', () => {
  it('starts as a guided chooser with audience badges and a compact comparison', () => {
    render(<GivingComparisonMatrix />);

    expect(screen.getByRole('heading', { name: /which charitable giving plan is right for you/i })).toBeTruthy();
    expect(screen.queryByText('Compare programs side by side. Filter first to narrow options, then review the details that matter most.')).toBeNull();
    expect(screen.getByRole('button', { name: /for me \/ my family/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /for a church or ministry/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /start with a few good options/i })).toBeTruthy();
    expect(screen.getAllByText('Individual + Ministry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ministry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ministry Impact Fund®').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Details coming soon').length).toBeGreaterThan(0);
    expect(screen.getByRole('table', { name: /charitable giving plan comparison/i })).toBeTruthy();
    expect(screen.getAllByText('How it’s Funded').length).toBeGreaterThan(0);
    expect(screen.queryByText('Basics')).toBeNull();
    expect(screen.queryByText('Possible Tax Considerations')).toBeNull();
  });

  it('reveals detail rows only after the user asks for them', () => {
    render(<GivingComparisonMatrix />);

    fireEvent.click(screen.getByRole('button', { name: /show tax details and timing/i }));

    expect(screen.getAllByText('Possible Tax Considerations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Long-term ministry support').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /show fewer details/i })).toBeTruthy();
  });
});
