import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

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
  default: () => <div data-testid="native-content-page">Native Content</div>,
}));

vi.mock('./pages/HomePage', () => ({
  default: () => <div>Home</div>,
}));

vi.mock('./pages/ServicesPage', () => ({
  default: () => <div>Services</div>,
}));

vi.mock('./pages/LoansPage', () => ({
  default: () => <div data-testid="loans-page">Loans Custom Page</div>,
}));

vi.mock('./pages/InvestmentsPage', () => ({
  default: () => <div data-testid="investments-page">Investments Custom Page</div>,
}));

vi.mock('./pages/RetirementPage', () => ({
  default: () => <div data-testid="retirement-page">Retirement Custom Page</div>,
}));

vi.mock('./pages/AdminContentPage', () => ({
  default: () => <div>Admin Content</div>,
}));

vi.mock('./pages/AdminRedirectsPage', () => ({
  default: () => <div>Admin Redirects</div>,
}));

vi.mock('./pages/AdminDocumentsPage', () => ({
  default: () => <div>Admin Documents</div>,
}));

vi.mock('./context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    pageHierarchy: {
      '/services/investments': {
        path: '/services/investments',
        title: 'Investments',
        routeKey: '/services/investments',
        source: null,
      },
      '/services/loans': {
        path: '/services/loans',
        title: 'Loans',
        routeKey: '/services/loans',
        source: null,
      },
      '/services/retirement': {
        path: '/services/retirement',
        title: 'Retirement',
        routeKey: '/services/retirement',
        source: null,
      },
    },
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

describe('App service route owners', () => {
  it.each([
    ['/services/investments', 'investments-page'],
    ['/services/retirement', 'retirement-page'],
  ])('renders the custom route owner for %s instead of NativeContentPage', async (pathname, testId) => {
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId(testId)).toBeTruthy();
    expect(screen.queryByTestId('native-content-page')).toBeNull();
  });
});
