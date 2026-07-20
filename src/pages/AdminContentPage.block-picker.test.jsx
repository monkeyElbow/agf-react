import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminProvider } from '../context/ContentAdminContext';
import AdminContentPage from './AdminContentPage';

const STORAGE_KEY = 'agf-content-admin-v1';

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

function readStoredState() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
}

describe('AdminContentPage block picker guardrails', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows canonical dynamic family preset choices while keeping retired compatibility-only insert entries out of the picker', async () => {
    render(
      <ContentAdminProvider>
        <MemoryRouter initialEntries={['/admin/content?page=/test']}>
          <AdminContentPage />
        </MemoryRouter>
      </ContentAdminProvider>,
    );

    fireEvent.click((await screen.findAllByLabelText(/Insert block at position/i))[0]);

    expect(screen.getByRole('radio', { name: /Card Grid · Flexible cards/i })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Card Grid · Investment options/i })).toBeNull();
    expect(screen.getByRole('radio', { name: /Card Grid · Eligibility cards/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Card Grid · Step-by-step cards/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /CTA Band · Dashboard login/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Columns · Flexible columns/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Columns · Housing allowance/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Columns · Do the math/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Columns · Value cards/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /CTA Band · General CTA/i })).toBeTruthy();

    expect(screen.queryByRole('radio', { name: /CTA Band compatibility · What You Do Matters/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /Card Grid compatibility · Loan Options Grid/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Show static blocks/i })).toBeNull();
  });

  it('creates preset-bearing blocks with the intended family and preset identity', async () => {
    render(
      <ContentAdminProvider>
        <MemoryRouter initialEntries={['/admin/content?page=/test']}>
          <AdminContentPage />
        </MemoryRouter>
      </ContentAdminProvider>,
    );

    fireEvent.click((await screen.findAllByLabelText(/Insert block at position/i))[0]);
    fireEvent.click(screen.getByRole('radio', { name: /CTA Band · Dashboard login/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add block' }));

    await waitFor(() => {
      const storedBlocks = readStoredState().blocksByPath?.['/test'] || [];
      expect(storedBlocks.some((block) => (
        String(block?.kind || '').trim() === 'cta_band'
        && String(block?.presetId || '').trim() === 'dashboard-login'
        && String(block?.templateId || '').trim() === 'cta_band'
      ))).toBe(true);
    });

    fireEvent.click((await screen.findAllByLabelText(/Insert block at position/i))[0]);
    fireEvent.click(screen.getByRole('radio', { name: /Card Grid · Step-by-step cards/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add block' }));

    await waitFor(() => {
      const storedBlocks = readStoredState().blocksByPath?.['/test'] || [];
      expect(storedBlocks.some((block) => (
        String(block?.kind || '').trim() === 'card_grid'
        && String(block?.presetId || '').trim() === 'step-cards'
        && String(block?.templateId || '').trim() === 'card_grid'
      ))).toBe(true);
    });

    fireEvent.click((await screen.findAllByLabelText(/Insert block at position/i))[0]);
    fireEvent.click(screen.getByRole('radio', { name: /Columns · Value cards/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add block' }));

    await waitFor(() => {
      const storedBlocks = readStoredState().blocksByPath?.['/test'] || [];
      expect(storedBlocks.some((block) => (
        String(block?.kind || '').trim() === 'columns'
        && String(block?.presetId || '').trim() === 'value-cards'
        && String(block?.templateId || '').trim() === 'columns'
      ))).toBe(true);
    });
  }, 10000);
});
