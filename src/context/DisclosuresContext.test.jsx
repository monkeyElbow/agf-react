import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DisclosuresProvider, useDisclosures } from './DisclosuresContext';

function DisclosureHarness() {
  const {
    getDisclosureValue,
    updateDisclosure,
    resetDisclosures,
  } = useDisclosures();

  return (
    <div>
      <p data-testid="loan-disclosure">{getDisclosureValue('loans-calculator-disclosure', '')}</p>
      <p data-testid="state-lines">{JSON.stringify(getDisclosureValue('planned-giving-cga-state-notices', []))}</p>
      <button type="button" onClick={() => updateDisclosure('loans-calculator-disclosure', 'Updated loan disclosure')}>
        update
      </button>
      <button type="button" onClick={() => updateDisclosure('planned-giving-cga-state-notices', ['State line A', 'State line B'])}>
        update-lines
      </button>
      <button type="button" onClick={resetDisclosures}>
        reset
      </button>
    </div>
  );
}

describe('DisclosuresContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('updates and resets centralized disclosure entries', () => {
    render(
      <DisclosuresProvider>
        <DisclosureHarness />
      </DisclosuresProvider>,
    );

    expect(screen.getByTestId('loan-disclosure').textContent).toContain('official quote or recommendation');

    fireEvent.click(screen.getByRole('button', { name: 'update' }));
    expect(screen.getByTestId('loan-disclosure').textContent).toBe('Updated loan disclosure');

    fireEvent.click(screen.getByRole('button', { name: 'update-lines' }));
    expect(screen.getByTestId('state-lines').textContent).toBe(JSON.stringify(['State line A', 'State line B']));

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('loan-disclosure').textContent).toContain('official quote or recommendation');
    expect(screen.getByTestId('state-lines').textContent).toContain('California');
  });
});
