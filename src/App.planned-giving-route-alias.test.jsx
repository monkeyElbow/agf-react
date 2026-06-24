import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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
  default: () => {
    const location = useLocation();
    return <div data-testid="native-content-page">{location.pathname}</div>;
  },
}));

vi.mock('./pages/HomePage', () => ({
  default: () => <div>Home</div>,
}));

vi.mock('./pages/ServicesPage', () => ({
  default: () => <div>Services</div>,
}));

vi.mock('./pages/LoansPage', () => ({
  default: () => <div>Loans</div>,
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

vi.mock('./context/ContentAdminContext', () => ({
  useContentAdmin: () => ({
    pageHierarchy: {
      '/services/planned-giving': {
        path: '/services/planned-giving',
        title: 'Planned Giving',
        routeKey: '/services/planned-giving',
        source: null,
      },
    },
    resolveManagedPath: (pathname) => (
      pathname === '/services/legacy-giving'
        ? '/services/planned-giving'
        : pathname
    ),
  }),
}));

vi.mock('./context/RedirectsContext', () => ({
  useRedirects: () => ({
    resolveRedirect: () => null,
  }),
}));

import App from './App';

void [MemoryRouter, App];

describe('App planned giving route alias', () => {
  it('redirects the old planned giving slug to the new canonical route', async () => {
    render(
      <MemoryRouter initialEntries={['/services/legacy-giving']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findByTestId('native-content-page')).textContent).toBe('/services/planned-giving');
  });
});
