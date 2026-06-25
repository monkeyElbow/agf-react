import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/SiteLayout', () => ({
  default: ({ children }) => <div data-testid="site-layout">{children}</div>,
}));

vi.mock('./components/PageBreadcrumbs', () => ({
  default: () => <nav data-testid="breadcrumbs" aria-label="Breadcrumb" />,
}));

vi.mock('./components/SiteAnnouncementBar', () => ({
  default: () => <div data-testid="announcement" />,
}));

vi.mock('./components/NativeContentPage', () => ({
  default: () => <main data-testid="native-content-page">Native Content</main>,
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
      '/services/insurance': {
        path: '/services/insurance',
        title: 'Insurance',
        routeKey: '/services/insurance',
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

describe('App breadcrumb shell placement', () => {
  it('keeps shared breadcrumbs outside native page content and below the top page chrome', async () => {
    render(
      <MemoryRouter initialEntries={['/services/insurance']}>
        <App />
      </MemoryRouter>,
    );

    const layout = screen.getByTestId('site-layout');
    const announcement = await screen.findByTestId('announcement');
    const breadcrumbs = await screen.findByTestId('breadcrumbs');
    const pageContent = await screen.findByTestId('native-content-page');

    expect(layout.children[0]).toBe(announcement);
    expect(layout.children[1]).toBe(breadcrumbs);
    expect(layout.children[2]).toBe(pageContent);
  });
});
