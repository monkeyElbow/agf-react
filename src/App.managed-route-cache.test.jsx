import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockContentAdminState = vi.hoisted(() => ({
  pageHierarchy: {},
  sharedSyncStatus: {
    isPending: false,
    hasQueuedDraftSync: false,
  },
}));

vi.mock('./components/SiteLayout', () => ({
  default: ({ children }) => <div data-testid="site-layout">{children}</div>,
}));

vi.mock('./components/PageBreadcrumbs', () => ({
  default: () => <div data-testid="breadcrumbs" />,
}));

vi.mock('./components/SiteAnnouncementBar', () => ({
  default: () => <div data-testid="announcement" />,
}));

vi.mock('./components/NativeContentPage', () => ({
  default: function MockNativeContentPage() {
    const location = useLocation();
    return <div data-testid="native-content-page">{location.pathname}</div>;
  },
}));

vi.mock('./pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home</div>,
}));

vi.mock('./context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    pageHierarchy: mockContentAdminState.pageHierarchy,
    sharedSyncStatus: mockContentAdminState.sharedSyncStatus,
    resolveManagedPath: (pathname) => pathname,
  }),
}));

vi.mock('./context/RedirectsContext', () => ({
  useRedirects: () => ({
    resolveRedirect: () => null,
  }),
}));

import App from './App';

void [MemoryRouter, App];

describe('App managed route cache', () => {
  it('keeps the current managed route mounted while shared page data is syncing', async () => {
    mockContentAdminState.pageHierarchy = {
      '/test': {
        path: '/test',
        title: 'Test',
        routeKey: '/test',
        source: null,
      },
    };
    mockContentAdminState.sharedSyncStatus = {
      isPending: false,
      hasQueuedDraftSync: false,
    };

    const { rerender } = render(
      <MemoryRouter initialEntries={['/test']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findByTestId('native-content-page')).textContent).toBe('/test');

    mockContentAdminState.pageHierarchy = {
      '/': {
        path: '/',
        title: 'Home',
        routeKey: '/',
        source: null,
      },
    };
    mockContentAdminState.sharedSyncStatus = {
      isPending: true,
      hasQueuedDraftSync: true,
    };

    rerender(
      <MemoryRouter initialEntries={['/test']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findByTestId('native-content-page')).textContent).toBe('/test');
    expect(screen.queryByTestId('home-page')).toBeNull();
  });
});
