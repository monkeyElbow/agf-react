import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';

let mockPageHierarchy = {};
let mockBlocksByPath = {};
let mockDocuments = [];
let mockVisibleJobs = [];

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../context/ConsultantsContext', () => ({
  useConsultants: () => ({
    getConsultants: () => [],
  }),
}));

vi.mock('../context/CareersJobsContext', () => ({
  useCareersJobs: () => ({
    getVisibleJobs: () => mockVisibleJobs,
  }),
}));

vi.mock('../context/RatesContext', () => ({
  useRates: () => ({
    rates: [],
    iraRates: [],
    ratesMeta: null,
  }),
}));

vi.mock('../context/DocumentsContext', () => ({
  useDocuments: () => ({
    documents: mockDocuments,
    resolveDocumentLink: (documentId) => (
      mockDocuments.find((item) => item.id === documentId) || null
    ),
  }),
}));

vi.mock('../context/ConsultantResponsesContext', () => ({
  useConsultantResponses: () => ({
    addResponse: vi.fn(),
  }),
}));

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: [],
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({
    enabled: false,
    opacity: 15,
  }),
}));

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext.jsx');
  return {
    ...actual,
    useContentAdmin: () => ({
      blocksByPath: mockBlocksByPath,
      pageHierarchy: mockPageHierarchy,
      resolveManagedPathFromRef: (pathRef, fallback = '') => pathRef || fallback,
    }),
  };
});

describe('NativeContentPage functional routes', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    mockBlocksByPath = {};
    mockVisibleJobs = [];
    mockPageHierarchy = {
      '/about-us': {
        path: '/about-us',
        title: 'About Us',
        section: 'Core',
      },
      '/about-us/careers': {
        path: '/about-us/careers',
        title: 'Careers',
        section: 'Core',
      },
      '/forms': {
        path: '/forms',
        title: 'Forms',
        section: 'Resources',
      },
      '/services/test-cta': {
        path: '/services/test-cta',
        title: 'Test CTA',
        section: 'Services',
      },
      '/services/legacy-giving/charitable-trusts': {
        path: '/services/legacy-giving/charitable-trusts',
        title: 'Charitable Trusts',
        section: 'Services',
      },
      '/services/legacy-giving/generosity-fund': {
        path: '/services/legacy-giving/generosity-fund',
        title: 'Generosity Fund',
        section: 'Services',
      },
      '/prospectus': {
        path: '/prospectus',
        title: 'Prospectus',
        section: 'Resources',
      },
    };
    mockDocuments = [
      {
        id: 'document-offering-circular',
        title: 'Offering Circular',
        url: 'https://files.example.com/offering-circular.pdf',
        external: true,
      },
      {
        id: 'prospectus-prospectus-steward-funds-prospectus',
        title: 'Steward Funds Prospectus',
        url: 'https://files.example.com/steward-funds-prospectus.pdf',
        external: true,
      },
      {
        id: 'form-insurance-life-enrollment',
        title: 'Life Enrollment and Change Form',
        url: 'https://files.example.com/life-enrollment.pdf',
        category: 'form',
        topic: 'Insurance',
        active: true,
      },
    ];
  });

  it('renders the sitemap functional route through NativeContentPage', () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/sitemap',
            title: 'Sitemap',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sitemap' })).toBeTruthy();
    expect(screen.getByLabelText('Find page')).toBeTruthy();
    expect(screen.getByLabelText('Section')).toBeTruthy();
  });

  it('renders the prospectus functional route through NativeContentPage', () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/prospectus',
            title: 'Prospectus',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Search documents')).toBeTruthy();
    expect(screen.getByText('Reference prospectus and investment documents.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download offering circular' })).toBeTruthy();
  });

  it('renders the forms functional route through NativeContentPage', () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/forms',
            title: 'Forms',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Forms' })).toBeTruthy();
    expect(screen.getByLabelText('Search forms')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Life Enrollment and Change Form' })).toBeTruthy();
  });

  it('renders the careers route through NativeContentPage with delegated jobs behavior intact', () => {
    mockVisibleJobs = [
      {
        id: 'job-1',
        title: 'Marketing Manager',
        location: 'Springfield, MO',
        summary: 'Lead campaigns.',
        note: 'Hybrid role',
        postedDate: '2026-03-20',
        applyUrl: 'https://example.com/jobs/1',
      },
    ];

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us/careers',
            title: 'Careers',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Be part of something' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Marketing Manager' })).toBeTruthy();
    expect(screen.getByText('Springfield, MO')).toBeTruthy();
    expect(screen.getByText('Posted March 20, 2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apply Online' })).toBeTruthy();
  });

  it('renders and submits a dynamic CTA block with checkbox fields', () => {
    mockBlocksByPath = {
      '/services/test-cta': [
        {
          id: 'cta_form',
          kind: 'cta_form',
          mode: 'dynamic',
          settings: {
            title: 'Tell us how to reach you.',
            submitLabel: 'Follow-up with me',
            fieldsJson: JSON.stringify([
              { id: 'full_name', label: 'Full name', type: 'text', required: true },
              { id: 'consent', label: 'Text me updates', type: 'checkbox' },
            ]),
          },
        },
      ],
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/test-cta',
            title: 'Test CTA',
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Taylor QA' },
    });
    fireEvent.click(screen.getByLabelText('Text me updates'));
    fireEvent.click(screen.getByRole('button', { name: 'Follow-up with me' }));

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Thanks. We will reach out soon.')).toBeTruthy();
  });

  it('reveals an external inline CTA shell from a single charitable trusts trigger while keeping the later form visible', async () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/legacy-giving/charitable-trusts',
            title: 'Charitable Trusts',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('button', { name: 'Start the process' })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Start the process' })).toBeNull();
    expect(document.querySelector('#charitable-trusts-inline-form')).toBeNull();
    expect(document.querySelector('#charitable-trusts-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Start planning' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Start the process' }));

    await waitFor(() => {
      expect(document.querySelector('#charitable-trusts-inline-form')).toBeTruthy();
    });

    const revealedSection = document.querySelector('#charitable-trusts-inline-form');
    expect(document.querySelector('#charitable-trusts-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Start the process' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Start planning' })).toHaveLength(2);
    expect(revealedSection?.getAttribute('data-cta-display-mode')).toBe('inline_reveal');
    expect(revealedSection?.getAttribute('data-cta-trigger-mode')).toBe('external');
    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  it('keeps request-form pages on their existing visible hash-link flow', () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/legacy-giving/generosity-fund',
            title: 'Generosity Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open a traditional DAF' }).getAttribute('href')).toContain('#traditional-daf-form');
  });
});
