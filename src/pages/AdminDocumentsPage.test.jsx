import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DocumentsProvider } from '../context/DocumentsContext';
import AdminDocumentsPage from './AdminDocumentsPage';

function renderAdminDocumentsPage() {
  return render(
    <DocumentsProvider>
      <MemoryRouter initialEntries={['/admin/documents']}>
        <AdminDocumentsPage />
      </MemoryRouter>
    </DocumentsProvider>,
  );
}

describe('AdminDocumentsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('requires confirmation before deleting and can restore the last deleted document', () => {
    renderAdminDocumentsPage();

    fireEvent.change(screen.getByLabelText('Select document'), {
      target: { value: 'document-retirement-403b-loan-rules' },
    });

    const documentsSection = screen.getByRole('heading', { name: /Documents \(/i }).closest('section');
    expect(documentsSection).toBeTruthy();
    expect(within(documentsSection).getByText('403b Loan Rules')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));

    expect(within(documentsSection).getByText('403b Loan Rules')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm delete selected' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete selected' }));

    expect(within(documentsSection).queryByText('403b Loan Rules')).toBeNull();
    expect(screen.getByRole('button', { name: 'Restore last deleted' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Restore last deleted' }));

    expect(within(documentsSection).getByText('403b Loan Rules')).toBeTruthy();
  });

  it('can restore a deleted seed document without resetting the whole library', () => {
    renderAdminDocumentsPage();

    fireEvent.change(screen.getByLabelText('Select document'), {
      target: { value: 'document-retirement-403b-loan-rules' },
    });

    const documentsSection = screen.getByRole('heading', { name: /Documents \(/i }).closest('section');
    expect(documentsSection).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete selected' }));

    expect(screen.getByRole('button', { name: 'Restore missing seed docs (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Restore missing seed docs (1)' }));

    expect(within(documentsSection).getByText('403b Loan Rules')).toBeTruthy();
  });
});
