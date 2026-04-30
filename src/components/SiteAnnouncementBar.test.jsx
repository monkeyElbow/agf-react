import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementProvider } from '../context/AnnouncementContext';
import SiteAnnouncementBar from './SiteAnnouncementBar';

const STORAGE_KEY = 'agf-site-announcement-v1';

function renderAnnouncementBar(storedAnnouncement) {
  if (storedAnnouncement) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedAnnouncement));
  }

  return render(
    <AnnouncementProvider>
      <MemoryRouter>
        <SiteAnnouncementBar />
      </MemoryRouter>
    </AnnouncementProvider>,
  );
}

describe('SiteAnnouncementBar', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
  });

  it('renders an active linked site message inside the scheduled date window', () => {
    renderAnnouncementBar({
      enabled: true,
      message: 'Read the new impact update.',
      backgroundId: 'brand-blue',
      textColorId: 'white',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      linkEnabled: true,
      linkPath: '/wrong-path',
      linkPageRef: '/about-us/impact',
    });

    expect(screen.getByLabelText('Site message')).toBeTruthy();
    expect(screen.getByText('Read the new impact update.')).toBeTruthy();

    const link = screen.getByRole('link', { name: 'Read the new impact update.' });
    expect(link.getAttribute('href')).toBe('/about-us/impact');
  });

  it('does not render when the current date is outside the active window', () => {
    renderAnnouncementBar({
      enabled: true,
      message: 'This should stay hidden.',
      backgroundId: 'brand-blue',
      textColorId: 'white',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      linkEnabled: false,
      linkPath: '',
      linkPageRef: '',
    });

    expect(screen.queryByLabelText('Site message')).toBeNull();
    expect(screen.queryByText('This should stay hidden.')).toBeNull();
  });
});
