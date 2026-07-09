import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DisclosuresProvider } from '../context/DisclosuresContext';
import { DocumentsProvider } from '../context/DocumentsContext';
import { RatesProvider } from '../context/RatesContext';
import AdminDisclosuresPage from './AdminDisclosuresPage';

function renderAdminDisclosuresPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/disclosures']}>
      <DocumentsProvider>
        <RatesProvider>
          <DisclosuresProvider>
            <AdminDisclosuresPage />
          </DisclosuresProvider>
        </RatesProvider>
      </DocumentsProvider>
    </MemoryRouter>,
  );
}

describe('AdminDisclosuresPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lists library and rates disclosures together', () => {
    renderAdminDisclosuresPage();

    expect(screen.getByRole('button', { name: /Rates page certificates disclosure/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Loan calculator disclosure/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /IRA rates disclosure/i })).toBeTruthy();
    expect(screen.getByText('Select a disclosure to edit')).toBeTruthy();
    expect(screen.getByText(/Changes save automatically once you edit live copy/i)).toBeTruthy();
  });

  it('resets a selected disclosure back to its seeded default', () => {
    renderAdminDisclosuresPage();

    fireEvent.click(screen.getByRole('button', { name: /Loan calculator disclosure/i }));
    const textarea = screen.getByRole('textbox', { name: 'Disclosure copy' });

    fireEvent.change(textarea, { target: { value: 'Temporary disclosure copy' } });
    expect(textarea.value).toBe('Temporary disclosure copy');

    fireEvent.click(screen.getByRole('button', { name: 'Reset selected' }));

    expect(textarea.value).toBe('This calculator uses example data and is not an AGFinancial official quote or recommendation.');
  });

  it('shows autosave and reference-only guidance for a selected disclosure', () => {
    renderAdminDisclosuresPage();

    fireEvent.click(screen.getByRole('button', { name: /Rates page IRA disclosure/i }));

    expect(screen.getByText('Reference details')).toBeTruthy();
    expect(screen.getByText(/These fields explain where the disclosure is used. They are read-only./i)).toBeTruthy();
    expect(screen.getByText('Editable public copy')).toBeTruthy();
    expect(screen.getAllByText(/Changes save automatically/i).length).toBeGreaterThan(0);
  });
});
