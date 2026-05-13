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
      '/services/legacy-giving': {
        path: '/services/legacy-giving',
        title: 'Legacy Giving',
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

  it('renders the legacy giving stewardship site feature in place of the static stewardship section and wires its CTA to the comparison anchor', () => {
    mockBlocksByPath = {
      '/services/legacy-giving': [
        {
          id: 'stewardship_story',
          kind: 'site_feature',
          mode: 'dynamic',
          settings: {
            featureId: 'legacy_giving_stewardship_story',
            targetSectionKey: 'id:legacy-giving-stewardship-story',
          },
        },
      ],
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/legacy-giving',
            title: 'Legacy Giving',
          }}
        />
      </MemoryRouter>,
    );

    const willsHeading = screen.getByRole('heading', { name: 'Wills & Estate Services' });
    const stewardshipHeading = screen.getByRole('heading', { name: 'Smart stewardship—for today and tomorrow.' });
    const joyHeading = screen.getByText((_, element) => (
      element?.tagName === 'H2' && element.textContent === 'More joy in giving.'
    ));
    const stewardshipSection = stewardshipHeading.closest('section');
    const willsSection = willsHeading.closest('section');
    const joySection = joyHeading.closest('section');
    const comparisonSection = document.querySelector('#charitable-giving-plan-comparison');

    expect(screen.getByText('Generate more retirement income')).toBeTruthy();
    expect(stewardshipSection?.querySelector('a[href="#charitable-giving-plan-comparison"]')?.textContent).toBe('Learn more');
    expect(stewardshipSection?.className).toContain('legacy-giving-stewardship');
    expect(willsSection && stewardshipSection
      ? Boolean(willsSection.compareDocumentPosition(stewardshipSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(stewardshipSection && joySection
      ? Boolean(stewardshipSection.compareDocumentPosition(joySection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(comparisonSection?.id).toBe('charitable-giving-plan-comparison');
    expect(comparisonSection?.textContent).toContain('Which Charitable Giving plan is right for you?');
  });

  it('reveals an external inline CTA shell from the charitable trusts CRUT and CRAT triggers while keeping the later form visible', async () => {
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

    expect(screen.getAllByRole('button', { name: 'Start the process' })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Start the process' })).toBeNull();
    expect(document.querySelector('#charitable-trusts-inline-form')).toBeNull();
    expect(document.querySelector('#charitable-trusts-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Start planning' })).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Start the process' })[0]);

    await waitFor(() => {
      expect(document.querySelector('#charitable-trusts-inline-form')).toBeTruthy();
    });

    const revealedSection = document.querySelector('#charitable-trusts-inline-form');
    expect(document.querySelector('#charitable-trusts-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Start the process' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Start planning' })).toHaveLength(2);
    expect(revealedSection?.getAttribute('data-cta-display-mode')).toBe('inline_reveal');
    expect(revealedSection?.getAttribute('data-cta-trigger-mode')).toBe('external');
    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  it('reveals the generosity fund traditional DAF form inline from the hero when the admin-backed hero uses explicit CTA action fields', async () => {
    mockBlocksByPath = {
      '/services/legacy-giving/generosity-fund': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Your giving.',
            line2Text: 'Managed.',
            button1Label: 'Open a Generosity Fund®',
            button1Url: 'https://secure.agfinancial.org/generosityfund/signup',
            button2Label: 'Open a traditional DAF',
            button2Action: 'open_cta_form',
            button2TargetAnchorId: 'traditional-daf-inline-form',
            button2Url: '',
            button2PageRef: '',
            button2Style: 'outline',
            button2Tone: 'super-grey',
          },
        },
      ],
    };

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

    expect(screen.getAllByRole('link', { name: 'Open a Generosity Fund®' })[0].getAttribute('href')).toContain('secure.agfinancial.org/generosityfund/signup');
    expect(screen.getByRole('button', { name: 'Open a traditional DAF' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Open a traditional DAF' })).toBeNull();
    expect(document.querySelector('#traditional-daf-inline-form')).toBeNull();
    expect(document.querySelector('#traditional-daf-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Submit' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open a traditional DAF' }));

    await waitFor(() => {
      expect(document.querySelector('#traditional-daf-inline-form')).toBeTruthy();
    });

    const revealedSection = document.querySelector('#traditional-daf-inline-form');
    const introHeading = screen.getByRole('heading', { name: 'All your charitable giving in one place.' });
    const introSection = introHeading.closest('section');
    const fallbackSection = document.querySelector('#traditional-daf-form');
    expect(document.querySelector('#traditional-daf-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Submit' })).toHaveLength(2);
    expect(revealedSection?.getAttribute('data-cta-display-mode')).toBe('inline_reveal');
    expect(revealedSection?.getAttribute('data-cta-trigger-mode')).toBe('external');
    expect(revealedSection && introSection
      ? Boolean(revealedSection.compareDocumentPosition(introSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(introSection && fallbackSection
      ? Boolean(introSection.compareDocumentPosition(fallbackSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });
});
