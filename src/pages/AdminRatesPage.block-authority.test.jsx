import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ContentAdminContext } from '../context/ContentAdminContextCore';
import { RatesProvider } from '../context/RatesContext';
import { CERTIFICATES_RATES_BLOCK_ID, IRA_RATES_BLOCK_ID, RATES_CONTENT_PATH } from '../lib/ratesBlockData';
import AdminRatesPage from './AdminRatesPage';

const parseRatesPdfMock = vi.hoisted(() => vi.fn());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

vi.mock('../utils/ratesPdfImport', () => ({
  parseRatesPdf: parseRatesPdfMock,
  resolveRatesPdfWorkerUrl: () => 'mock-worker.js',
}));

function renderRatesAdmin({ updateBlock, publishSharedPageNow, pageHistory = [] }) {
  return render(
    <ContentAdminContext.Provider value={{
      blocksByPath: {
        [RATES_CONTENT_PATH]: [
          { id: CERTIFICATES_RATES_BLOCK_ID, kind: 'rates', mode: 'dynamic', settings: {} },
          { id: IRA_RATES_BLOCK_ID, kind: 'rates', mode: 'dynamic', settings: {} },
        ],
      },
      updateBlock,
      getPageHistory: () => pageHistory,
      publishSharedPageNow,
    }}>
      <RatesProvider>
        <MemoryRouter>
          <AdminRatesPage />
        </MemoryRouter>
      </RatesProvider>
    </ContentAdminContext.Provider>,
  );
}

describe('AdminRatesPage block authority', () => {
  it('changes the import action to Updated after applying values to the fields', async () => {
    parseRatesPdfMock.mockResolvedValue({
      effectiveDate: '',
      certificates: [],
      ira: [],
      retirement403bMbaRate: '',
      retirement403bMbaApy: '',
      warnings: [],
      unmatchedPdfRows: [],
      missingCertificateRows: [],
      missingIraRows: [],
    });
    const { container } = renderRatesAdmin({
      updateBlock: vi.fn(),
      publishSharedPageNow: vi.fn(),
    });

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File(['PDF'], 'rates.pdf', { type: 'application/pdf' })] },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Update fields' }));
    expect(screen.getByRole('button', { name: 'Updated' }).disabled).toBe(true);
  });

  it('shows the separate successful admin-save timestamp, not a rate effective date', () => {
    renderRatesAdmin({
      updateBlock: vi.fn(),
      publishSharedPageNow: vi.fn(),
      pageHistory: [
        {
          action: 'page-published',
          createdAt: Date.UTC(2026, 8, 1, 15, 30),
          actor: { displayName: 'Lisa' },
        },
      ],
    });

    expect(screen.getByText(/Updated:.*Lisa/)).toBeTruthy();
  });

  it('writes the rate changes into the existing /rates blocks before the normal shared page publish', async () => {
    const updateBlock = vi.fn();
    const publishSharedPageNow = vi.fn().mockResolvedValue({ ok: true });
    renderRatesAdmin({ updateBlock, publishSharedPageNow });

    fireEvent.change(screen.getAllByDisplayValue('3.625%')[0], {
      target: { value: '8.888%' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => {
      expect(updateBlock).toHaveBeenCalledTimes(2);
      expect(publishSharedPageNow).toHaveBeenCalledWith(RATES_CONTENT_PATH, 'Rates admin save');
    });
    expect(screen.getAllByRole('button', { name: 'Save' })[0].disabled).toBe(true);
    expect(updateBlock).toHaveBeenNthCalledWith(
      1,
      RATES_CONTENT_PATH,
      CERTIFICATES_RATES_BLOCK_ID,
      expect.objectContaining({
        settings: expect.objectContaining({ rowsJson: expect.stringContaining('8.888%') }),
      }),
    );
    expect(updateBlock).toHaveBeenNthCalledWith(
      2,
      RATES_CONTENT_PATH,
      IRA_RATES_BLOCK_ID,
      expect.objectContaining({ settings: expect.any(Object) }),
    );
  });

  it('uses the public Rate, APY, Premium, APY column order in the admin chart', () => {
    renderRatesAdmin({ updateBlock: vi.fn(), publishSharedPageNow: vi.fn() });

    const certificateHeaders = Array.from(document.querySelectorAll('.admin-rates-chart-table--certificates thead th'))
      .map((cell) => cell.textContent);
    const iraHeaders = Array.from(document.querySelectorAll('.admin-rates-chart-table--ira thead th'))
      .map((cell) => cell.textContent);

    expect(certificateHeaders).toEqual(['Investment Type', 'Rate', 'APY*', 'Rate', 'APY*']);
    expect(iraHeaders).toEqual(['Investment Type', 'Rate', 'APY*']);
  });

  it('centers numeric header labels without changing the editable cells', () => {
    const adminCss = readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8');

    expect(adminCss).toContain('.admin-rates-chart-table thead th:not(:first-child) {\n  text-align: center !important;');
  });
});
