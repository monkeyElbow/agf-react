import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminProvider } from '../context/ContentAdminContext';
import AdminContentPage from './AdminContentPage';

const STORAGE_KEY = 'agf-content-admin-v1';
const DEV_IDENTITY_STORAGE_KEY = 'agf-dev-identity-v1';

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

describe('AdminContentPage dev identity surfaces', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps active foreign edit markers out of the main admin view while preserving takeover action', () => {
    window.localStorage.setItem(DEV_IDENTITY_STORAGE_KEY, JSON.stringify({
      userId: 'dev-current',
      displayName: 'Taylor QA',
      initials: 'TQ',
      accentColor: '#00adbb',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              lockedBy: {
                userId: 'dev-other',
                displayName: 'Other Dev',
                initials: 'OD',
                accentColor: '#111111',
              },
              lockedAt: 1710000000000,
            },
          },
          history: [],
        },
      },
    }));

    const view = render(
      <ContentAdminProvider>
        <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
          <AdminContentPage />
        </MemoryRouter>
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.getByText('Taylor QA')).toBeTruthy();
    expect(screen.queryByText('Editing: Other Dev')).toBeNull();
    expect(screen.queryByText(/Editing now:/)).toBeNull();
    expect(view.container.querySelector('.admin-selected-block-lock-banner')).toBeNull();
    expect(screen.getByRole('button', { name: 'Take over edit' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Take over edit' }));

    expect(screen.queryByLabelText('Block mode')).toBeNull();
    expect(screen.getByRole('button', { name: 'Done editing' })).toBeTruthy();
    expect(screen.queryByText(/Active edit:/)).toBeNull();
    const historyRegion = screen.getByRole('heading', { name: 'Recent page activity' }).closest('.admin-block-history');
    expect(within(historyRegion).getByText(/block edit taken over/i)).toBeTruthy();
  });

  it('keeps stale foreign draft markers and actions out of the main admin view', () => {
    window.localStorage.setItem(DEV_IDENTITY_STORAGE_KEY, JSON.stringify({
      userId: 'dev-current',
      displayName: 'Taylor QA',
      initials: 'TQ',
      accentColor: '#00adbb',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collaborationByPath: {
        '/services/loans': {
          blocks: {
            hero: {
              draftedBy: {
                userId: 'dev-other',
                displayName: 'Other Dev',
                initials: 'OD',
                accentColor: '#111111',
              },
              draftedAt: 1710000000000,
            },
          },
          history: [],
        },
      },
    }));

    const view = render(
      <ContentAdminProvider>
        <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
          <AdminContentPage />
        </MemoryRouter>
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getAllByText('Hero')[0]);

    expect(screen.queryByText(/Unpublished draft by Other Dev/)).toBeNull();
    expect(view.container.querySelector('.admin-selected-block-lock-banner')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue draft' })).toBeNull();
    expect(screen.queryByText(/owns the latest saved draft/i)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Take over draft' })).toBeNull();
  });

  it('offers an identity color picker beside the editable admin name', () => {
    window.localStorage.setItem(DEV_IDENTITY_STORAGE_KEY, JSON.stringify({
      userId: 'dev-current',
      displayName: 'Taylor QA',
      initials: 'TQ',
      accentColor: '#00adbb',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    }));

    render(
      <ContentAdminProvider>
        <MemoryRouter initialEntries={['/admin/content?page=/services/loans']}>
          <AdminContentPage />
        </MemoryRouter>
      </ContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    const picker = screen.getByLabelText('Admin identity color');
    expect(picker.value).toBe('#00adbb');

    fireEvent.change(picker, { target: { value: '#f26660' } });

    expect(JSON.parse(window.localStorage.getItem(DEV_IDENTITY_STORAGE_KEY)).accentColor).toBe('#f26660');
    expect(screen.getByLabelText('Developer display name').value).toBe('Taylor QA');
  });
});
