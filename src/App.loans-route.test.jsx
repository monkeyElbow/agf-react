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
  default: () => <div>Investments</div>,
}));

vi.mock('./pages/RetirementPage', () => ({
  default: () => <div>Retirement</div>,
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
      '/services/loans': {
        path: '/services/loans',
        title: 'Loans',
        routeKey: '/services/loans',
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

describe('App loans route', () => {
  it('renders the custom LoansPage instead of NativeContentPage', async () => {
    render(
      <MemoryRouter initialEntries={['/services/loans']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('loans-page')).toBeTruthy();
    expect(screen.queryByTestId('native-content-page')).toBeNull();
  });
});
