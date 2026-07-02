import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnnouncementProvider, useAnnouncement } from './AnnouncementContext';

function AnnouncementProbe() {
  const {
    announcement,
    draftAnnouncement,
    hasUnsavedChanges,
    setAnnouncementMessage,
    saveAnnouncement,
  } = useAnnouncement();

  return (
    <div>
      <p data-testid="enabled">{announcement.enabled ? 'yes' : 'no'}</p>
      <p data-testid="message">{announcement.message}</p>
      <p data-testid="draft-message">{draftAnnouncement.message}</p>
      <p data-testid="dirty">{hasUnsavedChanges ? 'yes' : 'no'}</p>
      <p data-testid="link-enabled">{announcement.linkEnabled ? 'yes' : 'no'}</p>
      <p data-testid="link-path">{announcement.linkPath}</p>
      <p data-testid="link-ref">{announcement.linkPageRef}</p>
      <button type="button" onClick={() => setAnnouncementMessage('Draft only')}>
        Change message
      </button>
      <button type="button" onClick={() => { void saveAnnouncement(); }}>
        Save message
      </button>
    </div>
  );
}

describe('AnnouncementContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes stored link targets from the saved page ref', () => {
    window.localStorage.setItem('agf-site-announcement-v1', JSON.stringify({
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
    window.localStorage.setItem('agf-site-announcement-v1', JSON.stringify({
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

  it('keeps edits in draft state until save is triggered', async () => {
    window.localStorage.setItem('agf-site-announcement-v1', JSON.stringify({
      enabled: true,
      message: 'Live message',
    }));

    render(
      <AnnouncementProvider>
        <AnnouncementProbe />
      </AnnouncementProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change message' }));

    expect(screen.getByTestId('message').textContent).toBe('Live message');
    expect(screen.getByTestId('draft-message').textContent).toBe('Draft only');
    expect(screen.getByTestId('dirty').textContent).toBe('yes');
    expect(JSON.parse(window.localStorage.getItem('agf-site-announcement-v1')).message).toBe('Live message');

    fireEvent.click(screen.getByRole('button', { name: 'Save message' }));

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('Draft only');
    });
    expect(screen.getByTestId('dirty').textContent).toBe('no');
    expect(JSON.parse(window.localStorage.getItem('agf-site-announcement-v1')).message).toBe('Draft only');
  });
});
