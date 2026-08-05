import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCareersRouteSections,
  isNativeCareersJobsSection,
  NativeCareersJobsSection,
  NativeFormsRouteRenderer,
  NativeProspectusRouteRenderer,
  NativeSitemapRouteRenderer,
} from './nativeFunctionalRouteRenderers';

let mockPageHierarchy = {};
let mockDocuments = [];

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    pageHierarchy: mockPageHierarchy,
  }),
}));

vi.mock('../context/DocumentsContext', () => ({
  useDocuments: () => ({
    documents: mockDocuments,
  }),
}));

function ActionRenderer({ item }) {
  return <a href={item.href || item.to || '#'}>{item.label}</a>;
}

function NativeLinkRenderer({ item, children }) {
  return <a href={item.href || item.to || '#'}>{children || item.label}</a>;
}

describe('native functional route renderers', () => {
  beforeEach(() => {
    mockPageHierarchy = {
      '/about-us': {
        path: '/about-us',
        title: 'About Us',
        section: 'Core',
      },
      '/rates': {
        path: '/rates',
        title: 'Rates',
        section: 'Resources',
      },
      '/contact-us': {
        path: '/contact-us',
        title: 'Contact Us',
        section: 'Resources',
      },
      '/search': {
        path: '/search',
        title: 'Search',
        section: 'Core',
      },
      '/admin/content': {
        path: '/admin/content',
        title: 'Admin',
        section: 'Core',
      },
      '/hidden-page': {
        path: '/hidden-page',
        title: 'Hidden Page',
        section: 'Core',
        hideFromSitemap: true,
      },
    };
    mockDocuments = [];
  });

  it('preserves sitemap search, section filtering, and reset behavior', () => {
    render(
      <MemoryRouter>
        <NativeSitemapRouteRenderer compactClass="" pageClass="" />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/pages? shown/)).toBeNull();
    expect(screen.getByRole('link', { name: 'About Us' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Rates' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Section'), { target: { value: 'Resources' } });
    expect(screen.queryByText(/pages? shown/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'About Us' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Find page'), { target: { value: 'contact' } });
    expect(screen.queryByText(/pages? shown/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Rates' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Find page'), { target: { value: 'no-match' } });
    expect(screen.queryByText(/pages? shown/)).toBeNull();
    expect(screen.getByText('No pages match your filter.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.queryByText(/pages? shown/)).toBeNull();
    expect(screen.getByRole('link', { name: 'About Us' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Rates' })).toBeTruthy();
  });

  it('preserves prospectus document search behavior', () => {
    render(
      <MemoryRouter>
        <NativeProspectusRouteRenderer
          compactClass=""
          pageClass=""
          hasOpenHudPanel={false}
          intro="Reference prospectus and investment documents."
          actions={[{ label: 'Download offering circular', href: '/offering-circular.pdf' }]}
          sections={[
            {
              title: 'Documents',
              links: [
                { label: 'Steward Funds Prospectus', href: '/docs/steward.pdf' },
                { label: 'Fidelity Asset Manager Prospectus', href: '/docs/fidelity.pdf' },
                { label: 'Russell Life Points Strategies', href: '/docs/russell.pdf' },
              ],
            },
          ]}
          ActionRenderer={ActionRenderer}
          NativeLinkRenderer={NativeLinkRenderer}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('3 of 3 documents')).toBeTruthy();
    expect(screen.queryByText('Reference prospectus and investment documents.')).toBeNull();
    expect(screen.getByRole('link', { name: 'Download offering circular' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search documents'), { target: { value: 'fidelity' } });
    expect(screen.getByText('1 of 3 documents')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Fidelity Asset Manager Prospectus' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Steward Funds Prospectus' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Search documents'), { target: { value: 'missing' } });
    expect(screen.getByText('0 of 3 documents')).toBeTruthy();
    expect(screen.getByText('No documents match your search.')).toBeTruthy();
  });

  it('preserves forms search behavior while using active document-library forms when available', () => {
    mockDocuments = [
      {
        id: 'insurance-life-enrollment',
        title: 'Life Enrollment and Change Form',
        url: '/docs/life-enrollment.pdf',
        category: 'form',
        topic: 'Insurance',
        active: true,
      },
      {
        id: 'retirement-beneficiary',
        title: 'Beneficiary Change Form',
        url: '/docs/beneficiary.pdf',
        category: 'form',
        topic: 'Retirement',
        active: true,
      },
    ];

    render(
      <MemoryRouter>
        <NativeFormsRouteRenderer
          compactClass=""
          pageClass=""
          intro="Browse AGFinancial form links by topic."
          seedForms={[
            { topic: 'Legacy', label: 'Seed Fallback Form', href: '/docs/seed.pdf' },
          ]}
          NativeLinkRenderer={NativeLinkRenderer}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/of \d+ forms/)).toBeNull();
    expect(screen.queryByText('Browse AGFinancial form links by topic.')).toBeNull();
    expect(document.querySelector('.native-functional-page-head--utility.native-functional-page-head--forms h1')?.textContent).toBe('Forms');
    expect(screen.getByPlaceholderText('Start typing to search')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Seed Fallback Form' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Retirement' })).toBeTruthy();
    expect(screen.getByLabelText('Category')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Insurance' } });
    expect(screen.queryByText(/of \d+ forms/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Life Enrollment and Change Form' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Beneficiary Change Form' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'all' } });

    fireEvent.change(screen.getByLabelText('Search forms'), { target: { value: 'beneficiary' } });
    expect(screen.queryByText(/of \d+ forms/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Beneficiary Change Form' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Life Enrollment and Change Form' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Search forms'), { target: { value: 'missing' } });
    expect(screen.queryByText(/of \d+ forms/)).toBeNull();
    expect(screen.getByText('No forms match your search.')).toBeTruthy();
  });

  it('builds careers route sections with live job data only for the careers jobs-list section', () => {
    const sections = [
      { className: 'careers-native-ready', title: 'Ready when you are.' },
      { className: 'careers-native-jobs-list', title: 'Open positions', jobs: [] },
    ];

    const result = buildCareersRouteSections({
      pathname: '/about-us/careers',
      sections,
      getVisibleJobs: () => [
        {
          id: 'job-1',
          title: 'Marketing Manager',
          location: 'Springfield, MO',
          summary: 'Lead campaigns.',
          note: 'Hybrid role',
          postedDate: '2026-03-20',
          applyUrl: 'https://example.com/jobs/1',
        },
      ],
    });

    expect(result[0]).toEqual(sections[0]);
    expect(isNativeCareersJobsSection(result[1])).toBe(true);
    expect(result[1].jobs).toEqual([
      {
        id: 'job-1',
        title: 'Marketing Manager',
        location: 'Springfield, MO',
        summary: 'Lead campaigns.',
        note: 'Hybrid role',
        postedDate: 'March 20, 2026',
        applyUrl: 'https://example.com/jobs/1',
        buttonLabel: 'Apply Online',
      },
    ]);
  });

  it('preserves careers jobs rendering and empty state behavior', () => {
    const { rerender } = render(
      <MemoryRouter>
        <NativeCareersJobsSection
          jobs={[
            {
              id: 'job-1',
              title: 'Marketing Manager',
              location: 'Springfield, MO',
              postedDate: 'March 20, 2026',
              summary: 'Lead campaigns.',
              note: 'Hybrid role',
              applyUrl: 'https://example.com/jobs/1',
              buttonLabel: 'Apply Online',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Marketing Manager' })).toBeTruthy();
    expect(screen.getByText('Springfield, MO')).toBeTruthy();
    expect(screen.getByText('Posted March 20, 2026')).toBeTruthy();
    expect(screen.getByText('Lead campaigns.')).toBeTruthy();
    expect(screen.getByText('Hybrid role')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apply Online' })).toBeTruthy();

    rerender(
      <MemoryRouter>
        <NativeCareersJobsSection jobs={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('There are currently no open positions to display.')).toBeTruthy();
  });
});
