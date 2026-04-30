import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnnouncementProvider, useAnnouncement } from './AnnouncementContext';

const STORAGE_KEY = 'agf-site-announcement-v1';

function AnnouncementProbe() {
  const { announcement } = useAnnouncement();

  return (
    <div>
      <p data-testid="enabled">{announcement.enabled ? 'yes' : 'no'}</p>
      <p data-testid="message">{announcement.message}</p>
      <p data-testid="link-enabled">{announcement.linkEnabled ? 'yes' : 'no'}</p>
      <p data-testid="link-path">{announcement.linkPath}</p>
      <p data-testid="link-ref">{announcement.linkPageRef}</p>
    </div>
  );
}

describe('AnnouncementContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes stored link targets from the saved page ref', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: true,
      message: 'Read the latest impact report.',
      linkEnabled: true,
      linkPath: '/stale-path',
      linkPageRef: '/about-us/impact',
    }));

    render(
      <AnnouncementProvider>
        <AnnouncementProbe />
      </AnnouncementProvider>,
    );

    expect(screen.getByTestId('enabled').textContent).toBe('yes');
    expect(screen.getByTestId('message').textContent).toBe('Read the latest impact report.');
    expect(screen.getByTestId('link-enabled').textContent).toBe('yes');
    expect(screen.getByTestId('link-ref').textContent).toBe('/about-us/impact');
    expect(screen.getByTestId('link-path').textContent).toBe('/about-us/impact');
  });

  it('drops invalid manual link paths during normalization', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: true,
      message: 'Rates update',
      linkEnabled: true,
      linkPath: 'rates',
      linkPageRef: '',
    }));

    render(
      <AnnouncementProvider>
        <AnnouncementProbe />
      </AnnouncementProvider>,
    );

    expect(screen.getByTestId('link-enabled').textContent).toBe('yes');
    expect(screen.getByTestId('link-path').textContent).toBe('');
    expect(screen.getByTestId('link-ref').textContent).toBe('');
  });
});
