import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ChartsProvider } from '../context/ChartsContext';
import AdminChartsPage from './AdminChartsPage';

function renderAdminChartsPage() {
  return render(
    <ChartsProvider>
      <MemoryRouter initialEntries={['/admin/charts']}>
        <AdminChartsPage />
      </MemoryRouter>
    </ChartsProvider>,
  );
}

describe('AdminChartsPage', () => {
  it('lists the managed charts and previews the selected chart', () => {
    renderAdminChartsPage();

    expect(screen.getByRole('heading', { name: 'Admin: Charts' })).toBeTruthy();
    expect(screen.getAllByText('403(b) Annual Contribution Limits').length).toBeGreaterThan(0);
    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getAllByText('Under age 50 deferral limit (pre-tax and Roth after-tax)').length).toBeGreaterThan(0);
  });

  it('updates a chart cell from the editor grid', async () => {
    const user = userEvent.setup();
    renderAdminChartsPage();

    const field = screen.getByDisplayValue('The lesser of $24,500 or includible compensation.');
    await user.clear(field);
    await user.type(field, '$24,500 max');

    expect(screen.getByDisplayValue('$24,500 max')).toBeTruthy();
    expect(screen.getAllByText('$24,500 max').length).toBeGreaterThan(0);
  });
});
