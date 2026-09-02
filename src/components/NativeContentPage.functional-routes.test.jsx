import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { defaultTestimonialsLibrary } from '../data/testimonialsLibrarySeed';
import { serializeLinkValue } from '../lib/linkValue';

let mockPageHierarchy = {};
let mockBlocksByPath = {};
let mockAuthoringBlocksByPath = null;
let mockFrontHudEnabled = false;
let mockDocuments = [];
let mockVisibleJobs = [];

const DONOR_ADVISED_FUND_PATH = '/services/planned-giving/donor-advised-fund';

function cloneRouteBlocksWithHowItWorksCopy(col1Body) {
  return (contentBlockBlueprintsByPath[DONOR_ADVISED_FUND_PATH] || []).map((block) => ({
    ...block,
    settings: {
      ...(block?.settings || {}),
      ...(block?.id === 'how_it_works' ? { col1Body } : {}),
    },
    editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
  }));
}

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
    testimonials: defaultTestimonialsLibrary,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({
    enabled: mockFrontHudEnabled,
    opacity: 15,
  }),
}));

vi.mock('../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      blocksByPath: mockBlocksByPath,
      authoringBlocksByPath: mockAuthoringBlocksByPath,
      pageHierarchy: mockPageHierarchy,
      resolveManagedPathFromRef: (pathRef, fallback = '') => pathRef || fallback,
      resolveAuthoringManagedPathFromRef: (pathRef, fallback = '') => pathRef || fallback,
    }),
  };
});

describe('NativeContentPage functional routes', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    mockBlocksByPath = {};
    mockAuthoringBlocksByPath = null;
    mockFrontHudEnabled = false;
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
      '/services/planned-giving/charitable-trusts': {
        path: '/services/planned-giving/charitable-trusts',
        title: 'Charitable Trusts',
        section: 'Services',
      },
      '/services/planned-giving': {
        path: '/services/planned-giving',
        title: 'Planned Giving',
        section: 'Services',
      },
      '/services/planned-giving/donor-advised-fund': {
        path: '/services/planned-giving/donor-advised-fund',
        title: 'Donor Advised Fund',
        section: 'Services',
      },
      '/services/planned-giving/ministry-impact-fund': {
        path: '/services/planned-giving/ministry-impact-fund',
        title: 'Ministry Impact Fund',
        section: 'Services',
      },
      '/services/planned-giving/qualified-charitable-distribution': {
        path: '/services/planned-giving/qualified-charitable-distribution',
        title: 'Qualified Charitable Distribution',
        section: 'Services',
      },
      '/services/retirement/403b': {
        path: '/services/retirement/403b',
        title: '403(b)',
        section: 'Retirement',
      },
      '/services/retirement/403b/403b-individual-enrollment': {
        path: '/services/retirement/403b/403b-individual-enrollment',
        title: '403b Individual Enrollment',
        section: 'Retirement',
      },
      '/services/retirement/iras/fund-an-ira': {
        path: '/services/retirement/iras/fund-an-ira',
        title: 'Fund an IRA',
        section: 'Retirement',
      },
      '/services/retirement/iras': {
        path: '/services/retirement/iras',
        title: 'IRAs',
        section: 'Retirement',
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
      {
        id: 'form-planned-giving-will-planning-document',
        title: 'Will Planning Document',
        url: 'https://files.example.com/will-planning-document.pdf',
        category: 'form',
        topic: 'Planned Giving',
        active: true,
      },
      {
        id: 'document-retirement-rollover-transfer-form',
        title: 'Rollover/Transfer Form',
        url: 'https://files.example.com/rollover-transfer-form.pdf',
        external: true,
      },
    ];
  });

  it('renders the sitemap functional route through NativeContentPage', () => {
    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/sitemap',
            title: 'Sitemap',
          }}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.service-native-page')?.className).toContain('ag-page-shell');
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

    expect(screen.getByRole('searchbox', { name: 'Search documents' })).toBeTruthy();
    expect(screen.queryByText('Reference prospectus and investment documents.')).toBeNull();
    const offeringCircularLink = screen.getByRole('link', { name: 'Download offering circular' });
    expect(offeringCircularLink).toBeTruthy();
    expect(offeringCircularLink.className).toContain('service-native-btn');
    expect(offeringCircularLink.className).toContain('is-outline');
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
    const formLink = screen.getByRole('link', { name: 'Life Enrollment and Change Form' });
    expect(formLink).toBeTruthy();
    expect(formLink.className).toContain('service-native-btn');
    expect(formLink.className).toContain('is-outline');
  });

  it('renders Fund an IRA from explicit managed blocks without a duplicate widget title', () => {
    mockBlocksByPath = {
      '/services/retirement/iras/fund-an-ira': (contentBlockBlueprintsByPath['/services/retirement/iras/fund-an-ira'] || []).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/iras/fund-an-ira',
            title: 'Fund an IRA',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeNull();
    expect(document.querySelector('[data-block-id="utility_header"]')).toBeTruthy();
    expect(document.querySelector('.fund-ira-native-page-head.native-functional-page-head--utility h1')?.textContent).toBe('Fund an IRA');
    expect(document.querySelector('.fund-ira-widget')).toBeTruthy();
    expect(document.querySelector('.fund-ira-header h2')).toBeNull();
    expect(document.querySelectorAll('.fund-ira-native-page-head h1')).toHaveLength(1);
  });

  it('renders the IRA differences section from the reusable Card Chart block', () => {
    mockBlocksByPath = {
      '/services/retirement/iras': (contentBlockBlueprintsByPath['/services/retirement/iras'] || []).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/iras',
            title: 'IRAs',
          }}
        />
      </MemoryRouter>,
    );

    const comparison = document.querySelector('[data-block-id="comparison_table"]');
    expect(comparison?.className).toContain('native-dynamic-card-chart');
    expect(within(comparison).getByRole('heading', { name: 'The differences. At a glance.' })).toBeTruthy();
    expect(comparison?.querySelector('.info-table-sheet[data-info-table-first-column-header="false"]')).toBeTruthy();
    expect(comparison?.style.getPropertyValue('--card-chart-cell-text-size')).toBe('1.05rem');
    expect(comparison?.style.getPropertyValue('--card-chart-cell-text-weight')).toBe('650');
    expect(comparison?.querySelector('tbody td[data-info-table-column-tone="atlantean"]')).toBeTruthy();
    expect(comparison?.querySelector('tbody td[data-info-table-column-tone="mango"]')).toBeTruthy();
    expect(within(comparison).getAllByText('Must have earned income').length).toBeGreaterThan(0);
    expect(within(comparison).getAllByText('Traditional IRAs may be converted to Roth IRAs').length).toBeGreaterThan(0);
  });

  it('renders calculators with a targeted billboard and CTA form instead of the old request-form block', () => {
    mockBlocksByPath = {
      '/calculators': (contentBlockBlueprintsByPath['/calculators'] || []).map((block) => ({
          ...block,
          settings: { ...(block?.settings || {}) },
          editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
        })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/calculators',
            title: 'Calculators',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.calculators-native-billboard.dynamic-billboard')).toBeTruthy();
    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeNull();
    expect(document.querySelector('[data-block-id="utility_header"]')).toBeTruthy();
    expect(document.querySelectorAll('.calculators-native-page-head h1')).toHaveLength(1);
    expect(document.querySelector('.calculators-native-page-head.native-functional-page-head--utility h1')?.textContent).toBe('Calculators');
    expect(document.querySelector('.calculators-native-contact')).toBeNull();
    expect(document.querySelector('.service-native-intro')).toBeNull();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeNull();
    expect(document.querySelector('[data-block-id="billboard"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="cta_form"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="cta_form"] .dynamic-cta-form')).toBeTruthy();
    expect(screen.getByText('Numbers are great.')).toBeTruthy();
    expect(screen.getByText('People are better.')).toBeTruthy();
    expect(screen.getAllByText('Complete the short contact form below, and one of our team will be in touch within 24 business hours.')).toHaveLength(1);
    expect(screen.getByText('Connect your faith & finances. Start here.')).toBeTruthy();
    expect(screen.getByText('Let’s explore what we can do together.')).toBeTruthy();
  });

  it('renders standalone calculator widgets without blank page-content shell copy', () => {
    mockBlocksByPath = {
      '/calculators/net-worth': (contentBlockBlueprintsByPath['/calculators/net-worth'] || []).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/calculators/net-worth',
            title: 'Net Worth Calculator',
          }}
        />
      </MemoryRouter>,
    );

    const widgetSection = document.querySelector('[data-block-id="calculator_tool"]');
    const introSection = document.querySelector('[data-block-id="intro"]');
    const utilityHeader = document.querySelector('[data-block-id="utility_header"]');

    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeNull();
    expect(utilityHeader).toBeTruthy();
    expect(utilityHeader?.className).toContain('calculator-tool-native-page-head');
    expect(utilityHeader?.className).toContain('native-functional-page-head--utility');
    expect(utilityHeader?.querySelector('h1')?.textContent).toBe('Net Worth Calculator');
    expect(document.querySelector('.service-native-intro')).toBeNull();
    expect(introSection?.className).toContain('native-dynamic-calculator-intro');
    expect(introSection?.className).not.toContain('service-native-intro');
    expect(introSection?.className).not.toContain('native-dynamic-page-content');
    expect(widgetSection).toBeTruthy();
    expect(widgetSection?.className).toContain('calculator-tool-widget');
    expect(widgetSection?.className).toContain('native-dynamic-calculator-widget');
    expect(widgetSection?.className).not.toContain('native-dynamic-page-content');
    expect(widgetSection?.querySelector('.net-worth-tool')).toBeTruthy();
    expect(widgetSection?.querySelector('.native-info-section-copy')).toBeNull();
    expect(screen.getByText('Take inventory of your financial reality.')).toBeTruthy();
    expect(screen.queryByText(/Add your assets and liabilities/i)).toBeNull();
    expect(screen.queryByText(/Estimate what your net worth could be in the future based on specified growth rates/i)).toBeNull();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
  });

  it('renders certificate request from standalone blocks without fallback page content', () => {
    mockBlocksByPath = {
      '/services/insurance/certificate-request': (
        contentBlockBlueprintsByPath['/services/insurance/certificate-request'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/certificate-request',
            title: 'Certificate Request',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Certificate Request')).toBeTruthy();
    expect(screen.getByText('Need proof of insurance?')).toBeTruthy();
    expect(document.querySelector('.certificate-request-native-section.native-dynamic-request.is-request-form-preset-certificate-request')).toBeTruthy();
    expect(document.querySelector('.certificate-request-native-section .certificate-request-form')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
  });

  it('renders contact from standalone request blocks with the contact request preset', () => {
    mockBlocksByPath = {
      '/contact-us': (
        contentBlockBlueprintsByPath['/contact-us'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/contact-us',
            title: 'Contact Us',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.contact-us-request.native-dynamic-request.is-request-form-preset-contact')).toBeTruthy();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'How can we help?' })).toBeTruthy();
  });

  it('renders group term life from standalone blocks without fallback page content', () => {
    mockBlocksByPath = {
      '/services/insurance/group-term-life-insurance': (
        contentBlockBlueprintsByPath['/services/insurance/group-term-life-insurance'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/group-term-life-insurance',
            title: 'Group term life insurance',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero h1')?.textContent).toBe('Get a group quote.');
    expect(document.querySelector('.group-life-native-lead.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.group-life-native-quote.native-dynamic-request.is-request-form-preset-group-life-quote')).toBeTruthy();
    expect(document.querySelector('.group-life-native-honor.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.group-life-native-benefits.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getAllByText('Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Contact info' })).toBeNull();
    expect(screen.getByRole('link', { name: "Ministers' Group Life Plan details" }).getAttribute('href')).toBe('/services/insurance/ministers-group-life-plan');
  });

  it('renders ministers group life from standalone blocks without native fallback content', () => {
    mockBlocksByPath = {
      '/services/insurance/ministers-group-life-plan': (
        contentBlockBlueprintsByPath['/services/insurance/ministers-group-life-plan'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: "Ministers' Group Life Plan",
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero h1')?.textContent).toBe('AG Ministry');
    expect(document.querySelector('.ministers-group-life-native-details.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('.ministers-group-life-native-enroll.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('.ministers-group-life-native-support.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.ministers-group-life-native-cta.native-dynamic-cta')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(screen.getByText('About the plan')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Minister enrollment form' })).toBeTruthy();
    expect(screen.getByText('Support for current clients')).toBeTruthy();
    expect(screen.getByLabelText('Search support')).toBeTruthy();
    expect(screen.getByText('Life Services Toolkit')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Still need help?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Follow up with me' })).toBeTruthy();
  });

  it('renders life insurance quote from standalone blocks without native fallback content', () => {
    mockBlocksByPath = {
      '/services/insurance/life-insurance-quote': (
        contentBlockBlueprintsByPath['/services/insurance/life-insurance-quote'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/life-insurance-quote',
            title: 'Life Insurance Quote',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero h1')?.textContent).toBe('Get a life quote.');
    expect(document.querySelector('.life-quote-native-types.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('.life-quote-native-bridge.native-dynamic-page-content')).toBeNull();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')?.getAttribute('id')).toBe('quote');
    expect(screen.queryByRole('heading', { name: 'Which is best for you?' })).toBeNull();
    expect(screen.queryByText('Use the quote form below to get started.')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Request a Life Insurance Quote' })).toBeTruthy();
  });

  it('renders property and casualty from standalone blocks without native fallback content', () => {
    mockBlocksByPath = {
      '/services/insurance/property-casualty-insurance': (
        contentBlockBlueprintsByPath['/services/insurance/property-casualty-insurance'] || []
      ).map((block) => ({
        ...block,
        settings: {
          ...(block?.settings || {}),
          ...(block?.id === 'resources' ? { cardTitleSizeRem: 1.25, cardTitleLineHeight: 1.1 } : {}),
        },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/property-casualty-insurance',
            title: 'Property & Casualty Insurance',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.insurance-pc-native-quote.native-dynamic-request.is-request-form-preset-insurance-quote')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-ag-program.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-partner.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-resources.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-resources')?.getAttribute('style')).toContain('--dynamic-grid-card-title-size: 1.25rem');
    expect(document.querySelector('.insurance-pc-native-resources')?.getAttribute('style')).toContain('--dynamic-grid-card-title-line-height: 1.1');
    expect(document.querySelector('.insurance-pc-native-resources')?.className).toContain('is-card-title-line-height-controlled');
    expect(document.querySelector('.insurance-pc-native-safe.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-fineprint.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')?.getAttribute('id')).toBe('quote');
    expect(screen.getByRole('heading', { name: 'Request a P&C quote.' })).toBeTruthy();
    expect(screen.getByText('Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'AG Insurance Program' })).toBeTruthy();
    expect(screen.getByAltText('Church Mutual Insurance')).toBeTruthy();
    expect(screen.getByText('Additional coverages available')).toBeTruthy();
    expect(document.querySelectorAll('.insurance-pc-native-resources .retirement-account-card--certificate')).toHaveLength(2);
    expect(document.querySelector('.insurance-pc-native-resources .investments-native-cert-card')).toBeNull();
    expect(document.querySelectorAll('.insurance-pc-native-resources .service-native-card-bullet-list')).toHaveLength(2);
    expect(document.querySelectorAll('.insurance-pc-native-resources .service-native-card-bullet-list li')).toHaveLength(15);
    expect(document.querySelector('.insurance-pc-native-resources')?.textContent).not.toContain('›');
    expect(screen.getByText('Safe & sound')).toBeTruthy();
    expect(screen.getByText('CM0045 (04-2020)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('renders loan consultants with the canonical consultant request form', () => {
    mockBlocksByPath = {
      '/services/loans/loan-consultants': (
        contentBlockBlueprintsByPath['/services/loans/loan-consultants'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/loans/loan-consultants',
            title: 'Loan Consultants',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.loans-consultant-native-locations')).toBeTruthy();
    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('.consultant-native-page-head.native-functional-page-head--utility h1')?.textContent).toBe('Loan Consultants');
    expect(document.querySelector('.loans-consultant-native-contact.native-dynamic-request.is-request-form-preset-consultant-contact')).toBeTruthy();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Talk with a consultant.' })).toBeTruthy();
    expect(screen.getByLabelText('Select your state')).toBeTruthy();
  });

  it('renders retirement consultants with the canonical request form and without fallback page content', () => {
    mockBlocksByPath = {
      '/services/retirement/retirement-consultants': (
        contentBlockBlueprintsByPath['/services/retirement/retirement-consultants'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/retirement-consultants',
            title: 'Retirement Consultants',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('.consultant-native-page-head.native-functional-page-head--utility h1')?.textContent).toBe('Retirement Consultants');
    expect(document.querySelector('.loans-consultant-native-locations')).toBeTruthy();
    expect(document.querySelector('.loans-consultant-native-contact.native-dynamic-request.is-request-form-preset-consultant-contact')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Talk with a consultant.' })).toBeTruthy();
    expect(screen.getByLabelText('Select your state')).toBeTruthy();
  });

  it('renders retirement rollovers from explicit managed blocks instead of legacy page-owned sections', () => {
    mockBlocksByPath = {
      '/services/retirement/rollovers': (
        contentBlockBlueprintsByPath['/services/retirement/rollovers'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/rollovers',
            title: 'Rollovers',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.retirement-rollovers-native-request.native-dynamic-request.is-request-form-preset-retirement-rollover')).toBeTruthy();
    expect(document.querySelector('.retirement-rollovers-native-request .dynamic-request-layout')).toBeTruthy();
    expect(document.querySelector('.retirement-rollovers-native-request .native-info-inline-form.dynamic-request-form')).toBeTruthy();
    expect(document.querySelector('.retirement-rollovers-native-cta')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="intro"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="rollover_options"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="rollover_process"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Move your funds.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Start the process' })).toBeTruthy();
    expect(document.querySelector('[data-block-id="rollover_options"] > .ag-panel-rail > .native-info-section-copy > h2')).toBeTruthy();
    expect(document.querySelector('[data-block-id="rollover_process"] > .ag-panel-rail > .native-info-rich-html > h2')).toBeTruthy();
    expect(document.querySelectorAll('[data-block-id="rollover_process"] > .ag-panel-rail > .native-info-rich-html > p')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Rollover/Transfer Form' })).toBeTruthy();
    expect(screen.getAllByText('Our rollover specialists are happy to help focus your retirement.')).toHaveLength(1);
  });

  it('renders charitable gift annuities from explicit managed blocks without a fallback page-content section', () => {
    mockBlocksByPath = {
      '/services/planned-giving/charitable-gift-annuities': (
        contentBlockBlueprintsByPath['/services/planned-giving/charitable-gift-annuities'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/charitable-gift-annuities',
            title: 'Charitable Gift Annuities',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="annuity_options"].legacy-child-native-cga-options')).toBeTruthy();
    expect(document.querySelector('[data-block-id="annuity_options"]')?.className).not.toContain('is-divider');
    const estimatorLink = screen.getByRole('link', { name: 'Try the CGA estimator' });
    expect(estimatorLink.getAttribute('href')).toBe('#demo');
    fireEvent.click(estimatorLink);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    expect(window.location.hash).toBe('#demo');
    const annuityOptions = document.querySelector('[data-block-id="annuity_options"]');
    expect(annuityOptions?.querySelectorAll('.investments-native-cert-card')).toHaveLength(2);
    expect(annuityOptions?.querySelectorAll('.service-native-action-row')).toHaveLength(0);
    const giftAssets = document.querySelector('[data-block-id="gift_assets"]');
    const qcdFineprint = document.querySelector('[data-block-id="qcd_fineprint"]');
    expect(giftAssets).toBeTruthy();
    expect(qcdFineprint).toBeTruthy();
    expect(giftAssets.querySelector('.service-native-card-rich-body p')?.textContent).toContain('The SECURE 2.0 Act');
    expect([...giftAssets.querySelectorAll('.service-native-card-rich-body .is-atlantean')]
      .map((element) => element.textContent)).toContain('The SECURE 2.0 Act of 2022');
    expect(giftAssets.querySelector('.service-native-card-rich-body')?.compareDocumentPosition(giftAssets.querySelector('.service-native-action-row')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(qcdFineprint.querySelector('.native-info-rich-html p')?.textContent).toContain('Also available');
    expect(document.querySelector('.legacy-child-native-cga-request.native-dynamic-request.is-request-form-preset-legacy-cga')).toBeTruthy();
    const productSelect = screen.getByLabelText('Product of interest');
    expect(within(productSelect).getByRole('option', { name: 'CGA (immediate)' })).toBeTruthy();
    expect(within(productSelect).getByRole('option', { name: 'CGA (deferred)' })).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-flow-steps.legacy-child-native-cga-steps.native-dynamic-columns')).toBeTruthy();
    const stepIcons = [...document.querySelectorAll('.legacy-child-native-cga-steps [data-planned-giving-step-icon]')];
    expect(stepIcons.map((icon) => icon.getAttribute('data-planned-giving-step-icon')))
      .toEqual(['daf-step-1', 'cga-step-2', 'cga-step-3']);
    expect(stepIcons.map((icon) => icon.getAttribute('data-fade-delay-ms'))).toEqual(['0', '140', '280']);
    stepIcons.forEach((icon) => {
      expect(icon.className).toContain('planned-giving-step-icon--scroll-reveal');
      expect(icon.className).toContain('fade-up');
      expect(icon.className).toContain('fade-up-repeat-observe');
      expect(icon.className).toContain('fade-up-no-shift');
    });
    expect(screen.getByRole('heading', { name: 'Generous.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tax benefits\.\s+Ministry support\.\s+Payments for life\./ })).toBeTruthy();
  });

  it('renders endowments from explicit managed blocks with the endowment request preset', () => {
    mockBlocksByPath = {
      '/services/planned-giving/endowments': (
        contentBlockBlueprintsByPath['/services/planned-giving/endowments'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/endowments',
            title: 'Endowments',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Set up an endowment' }).getAttribute('href')).toBe('#endowment-request-form');
    expect(document.querySelector('#endowment-request-form')).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-endowments-legacy-form.native-dynamic-request.is-request-form-preset-legacy-endowment')).toBeTruthy();
    expect([...document.querySelectorAll('.legacy-child-native-endowments-duo [data-planned-giving-step-icon]')]
      .map((icon) => icon.getAttribute('data-planned-giving-step-icon')))
      .toEqual(['daf-step-1', 'mif-step-3', 'endowments-step-3']);
    const assetsSection = document.querySelector('[data-block-id="assets_you_may_give"]');
    expect(assetsSection?.className).toContain('legacy-child-native-give-assets');
    expect(within(assetsSection).getByRole('heading', { name: /Assets\s*you may give/ })).toBeTruthy();
    expect(assetsSection?.querySelectorAll('.service-native-card')).toHaveLength(1);
    expect(assetsSection?.textContent).toContain('Cash');
    expect(assetsSection?.textContent).toContain('Securities (restricted and marketable)');
    expect(assetsSection?.textContent).toContain('$10,000 for cash or securities');
    const endowmentProductSelect = screen.getByLabelText('Product of interest');
    expect([...endowmentProductSelect.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Select one',
      'Endowment',
    ]);
    expect(screen.getByRole('heading', { name: 'Leave a legacy that lasts.' })).toBeTruthy();
  });

  it('renders generosity fund from explicit managed blocks with the generosity request preset', () => {
    mockBlocksByPath = {
      [DONOR_ADVISED_FUND_PATH]: cloneRouteBlocksWithHowItWorksCopy(
        'Open a DAF, and fund it with cash or appreciated assets. You may receive immediate tax benefits.',
      ),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: DONOR_ADVISED_FUND_PATH,
            title: 'Donor Advised Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('.legacy-child-native-generosity-request.native-dynamic-request.is-request-form-preset-legacy-generosity')).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-flow-steps.legacy-child-native-generosity-steps.native-dynamic-columns')).toBeTruthy();
    expect([...document.querySelectorAll('.legacy-child-native-generosity-steps [data-planned-giving-step-icon]')]
      .map((icon) => icon.getAttribute('data-planned-giving-step-icon')))
      .toEqual(['daf-step-1', 'daf-step-2', 'daf-step-3']);
    expect(document.querySelector('[data-block-id="traditional_daf_cta"]')).toBeNull();
    expect(within(document.querySelector('[data-block-id="how_it_works"]')).getByRole('link', { name: 'Open a traditional DAF' })).toBeTruthy();
    const generosityOnlineSection = document.querySelector('[data-block-id="generosity_fund_online"]');
    expect(generosityOnlineSection).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Generosity Fund®' })).toBeTruthy();
    expect(generosityOnlineSection.querySelector('h2 sup')?.textContent).toBe('®');
    expect(screen.getByText('Our fully online Donor Advised Fund simplifies your giving even more, letting you manage your giving anytime you want.')).toBeTruthy();
    const giftAssetsSection = document.querySelector('[data-block-id="gift_assets"]');
    expect(within(giftAssetsSection).getByRole('link', { name: 'Open a traditional DAF' })).toBeTruthy();
    expect(giftAssetsSection?.className).not.toContain('is-divider');
    expect([...giftAssetsSection.querySelectorAll('.service-native-card-bullet-list strong')]
      .map((item) => item.textContent))
      .toEqual([
        'Cash',
        'Household income',
        'Proceeds from selling a home or business',
        'Securities',
        'A variety of other funding sources',
        '$10,000 minimum',
      ]);
    expect(screen.getByRole('heading', { name: 'Make the most of your giving.' })).toBeTruthy();
    expect(screen.getByText('Contact us to open a traditional DAF. Use this form to start the process.')).toBeTruthy();
    const givingProductSelect = screen.getByLabelText('Product of interest');
    expect(givingProductSelect.hasAttribute('required')).toBe(true);
    expect(within(givingProductSelect).getByRole('option', { name: 'Donor Advised Fund' })).toBeTruthy();
    expect(within(givingProductSelect).getByRole('option', { name: 'Generosity Fund' })).toBeTruthy();
    expect(screen.getByPlaceholderText('How can we help?')).toBeTruthy();
    const contactPreferenceSelect = screen.getByLabelText('How should we get in touch with you?');
    expect(contactPreferenceSelect.hasAttribute('required')).toBe(true);
    expect(within(contactPreferenceSelect).getByRole('option', { name: 'Phone' })).toBeTruthy();
    expect(within(contactPreferenceSelect).getByRole('option', { name: 'Email' })).toBeTruthy();
  });

  it('renders published native blocks when front HUD is off even if authoring blocks are stale', () => {
    mockBlocksByPath = {
      [DONOR_ADVISED_FUND_PATH]: cloneRouteBlocksWithHowItWorksCopy('Published How it works 01 copy.'),
    };
    mockAuthoringBlocksByPath = {
      [DONOR_ADVISED_FUND_PATH]: cloneRouteBlocksWithHowItWorksCopy('Stale authoring How it works 01 copy.'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: DONOR_ADVISED_FUND_PATH,
            title: 'Donor Advised Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Published How it works 01 copy.')).toBeTruthy();
    expect(screen.queryByText('Stale authoring How it works 01 copy.')).toBeNull();
  });

  it('renders authoring native blocks when front HUD is on', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      [DONOR_ADVISED_FUND_PATH]: cloneRouteBlocksWithHowItWorksCopy('Published How it works 01 copy.'),
    };
    mockAuthoringBlocksByPath = {
      [DONOR_ADVISED_FUND_PATH]: cloneRouteBlocksWithHowItWorksCopy('Authoring How it works 01 copy.'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: DONOR_ADVISED_FUND_PATH,
            title: 'Donor Advised Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Authoring How it works 01 copy.')).toBeTruthy();
    expect(screen.queryByText('Published How it works 01 copy.')).toBeNull();
  });

  it('renders ministry impact fund from explicit managed blocks without a fallback page-content section', () => {
    mockBlocksByPath = {
      '/services/planned-giving/ministry-impact-fund': (
        contentBlockBlueprintsByPath['/services/planned-giving/ministry-impact-fund'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/ministry-impact-fund',
            title: 'Ministry Impact Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-request.native-dynamic-request.is-request-form-preset-legacy-impact')).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-flow-steps.legacy-child-native-ministry-impact-steps.native-dynamic-columns')).toBeTruthy();
    expect([...document.querySelectorAll('.legacy-child-native-ministry-impact-steps [data-planned-giving-step-icon]')]
      .map((icon) => icon.getAttribute('data-planned-giving-step-icon')))
      .toEqual(['daf-step-1', 'mif-step-2', 'mif-step-3']);
    const giftTypesSection = document.querySelector('[data-block-id="gift_types"]');
    expect(giftTypesSection?.className).not.toContain('is-divider');
    expect(within(giftTypesSection).queryByText('Cash')).toBeNull();
    expect(within(giftTypesSection).getByText('Stock')).toBeTruthy();
    expect(giftTypesSection?.textContent).not.toContain('see below');
    expect(screen.getByRole('heading', { name: 'Unlocked.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Most wealth isn’t cash.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ministry support. Unlocked and expanded.' })).toBeTruthy();
    expect([...screen.getByLabelText('Product of interest').querySelectorAll('option')].map((option) => option.textContent))
      .toEqual(['Select one', 'Ministry Impact Fund®']);
  });

  it('renders the about us route with the updated intro, full-width image section, strategy links, and allies CTA', () => {
    mockBlocksByPath = {
      '/about-us': (
        contentBlockBlueprintsByPath['/about-us'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us',
            title: 'About Us',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('.service-native-intro.about-native-top-intro')).toBeTruthy();
    expect(document.querySelector('.service-native-intro.about-native-top-intro')?.className).not.toContain('careers-native-top-intro');
    expect(screen.getByRole('heading', { name: 'Where faith & finance grow together.' }).className).toContain('is-atlantean');
    expect(screen.getByText('Our culture is delivering the best financial products and experiences that align with biblical values.')).toBeTruthy();
    expect(screen.getByText('Our mission is your financial health and ministry growth.')).toBeTruthy();
    expect(screen.queryByText('Connect your faith & finances.')).toBeNull();

    const buildingShotSection = document.querySelector('.about-native-building-shot');
    expect(buildingShotSection).toBeTruthy();
    expect(buildingShotSection?.className).toContain('native-dynamic-page-content');
    expect(buildingShotSection?.className).not.toContain('native-dynamic-columns');
    expect(buildingShotSection?.querySelector('.native-info-viewport-bleed')).toBeTruthy();
    expect(within(buildingShotSection).getByAltText('AGFinancial office building')).toBeTruthy();

    const strategySection = document.querySelector('.about-native-strategy');
    expect(strategySection).toBeTruthy();
    expect(strategySection?.className).toContain('dynamic-billboard');
    expect(strategySection?.getAttribute('data-block-id')).toBe('strategy');
    expect(within(strategySection).getByText(/Create a robust financial strategy for/i)).toBeTruthy();
    expect(within(strategySection).getByRole('link', { name: 'loans' }).getAttribute('href')).toBe('/services/loans');
    expect(within(strategySection).getByRole('link', { name: 'investments' }).getAttribute('href')).toBe('/services/investments');
    expect(within(strategySection).getByRole('link', { name: 'retirement' }).getAttribute('href')).toBe('/services/retirement');
    expect(within(strategySection).getByRole('link', { name: 'planned giving' }).getAttribute('href')).toBe('/services/planned-giving');
    expect(within(strategySection).getByRole('link', { name: 'insurance' }).getAttribute('href')).toBe('/services/insurance');
    expect(within(strategySection).getByRole('link', { name: 'Explore all services' }).getAttribute('href')).toBe('/services');
    expect(within(strategySection).getByRole('link', { name: 'Explore all services' }).closest('.service-native-action-row')?.className).toContain('is-centered');
    expect(within(strategySection).getByText(/\$12 billion\+/)).toBeTruthy();
    expect(strategySection?.querySelector('.investments-native-growth-surface')).toBeNull();
    expect(strategySection?.querySelector('.investments-native-growth-grid')).toBeNull();
    expect(strategySection?.querySelector('.native-info-section-copy > h2')?.className || '').not.toContain('investments-native-build-title');

    const valuesSection = document.querySelector('.about-native-values');
    expect(valuesSection).toBeTruthy();
    expect(valuesSection?.className).toContain('is-cards-preset-value-cards');
    expect(valuesSection?.querySelector('.investments-native-growth-surface')).toBeTruthy();
    expect(valuesSection?.querySelector('.investments-native-growth-grid')).toBeTruthy();
    expect(valuesSection?.querySelectorAll('.investments-native-growth-card')).toHaveLength(3);
    expect(valuesSection?.querySelectorAll('.investments-native-growth-card.investments-growth-scroll-reveal')).toHaveLength(3);
    expect(valuesSection?.querySelector('.about-native-values-card--focus')).toBeTruthy();
    expect(valuesSection?.querySelector('.about-native-values-card--responsibility')).toBeTruthy();
    expect(valuesSection?.querySelector('.about-native-values-card--experience')).toBeTruthy();

    const alliesSection = document.querySelector('.about-native-allies');
    expect(alliesSection).toBeTruthy();
    expect(alliesSection?.querySelector('.service-native-action-row')).toBeTruthy();

    const historySection = document.querySelector('.about-native-history');
    expect(historySection).toBeTruthy();
    expect(historySection?.querySelector('.investments-native-growth-surface')).toBeTruthy();
    expect(historySection?.querySelector('.investments-native-growth-grid')).toBeTruthy();
    expect(historySection?.querySelectorAll('.investments-native-growth-card')).toHaveLength(6);
    expect(historySection?.querySelector('.service-native-action-row')).toBeTruthy();
    expect(historySection?.className).toContain('is-title-super-grey');
    expect(historySection?.className).toContain('is-body-super-grey');
    expect(historySection?.style.getPropertyValue('--dynamic-grid-card-title-size')).toBe('5.4rem');
    expect(historySection?.style.getPropertyValue('--dynamic-grid-card-body-size')).toBe('1.14rem');
    expect(historySection?.style.getPropertyValue('--dynamic-grid-card-body-line-height')).toBe('1.72');

    expect(document.querySelector('.about-native-cta-form')).toBeTruthy();
  });

  it('keeps the About intro body when HUD switches to an incomplete authoring snapshot', () => {
    const publishedBlocks = (contentBlockBlueprintsByPath['/about-us'] || []).map((block) => ({
      ...block,
      settings: { ...(block?.settings || {}) },
      editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
    }));
    mockBlocksByPath = { '/about-us': publishedBlocks };
    mockAuthoringBlocksByPath = {
      '/about-us': publishedBlocks.filter((block) => block.id !== 'intro'),
    };

    const view = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us',
            title: 'About Us',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Our culture is delivering the best financial products and experiences that align with biblical values.')).toBeTruthy();

    mockFrontHudEnabled = true;
    view.rerender(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us',
            title: 'About Us',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Our culture is delivering the best financial products and experiences that align with biblical values.')).toBeTruthy();
    expect(screen.getByText('Our mission is your financial health and ministry growth.')).toBeTruthy();
    expect(document.querySelector('.service-native-intro.about-native-top-intro')).toBeTruthy();
  });

  it('renders a normalized stale About building columns draft through the page-content photo presentation', () => {
    const normalizedState = normalizeStoredConfig({
      blocksByPath: {
        '/about-us': (
          contentBlockBlueprintsByPath['/about-us'] || []
        ).map((block) => {
          if (block.id !== 'building_shot') {
            return {
              ...block,
              settings: { ...(block?.settings || {}) },
              editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
            };
          }

          return {
            ...block,
            kind: 'columns',
            settings: {
              sectionClassName: 'about-native-building-shot',
              contentWidth: 'browser',
              col1ImageUrl: '/src/assets/about-intro.jpg',
              col1ImageAlt: 'AGFinancial office building',
            },
            editableFields: [],
          };
        }),
      },
    });
    mockBlocksByPath = {
      '/about-us': normalizedState.blocksByPath['/about-us'] || [],
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us',
            title: 'About Us',
          }}
        />
      </MemoryRouter>,
    );

    const buildingShotSection = document.querySelector('.about-native-building-shot');
    expect(buildingShotSection?.className).toContain('native-dynamic-page-content');
    expect(buildingShotSection?.className).not.toContain('native-dynamic-columns');
    expect(buildingShotSection?.querySelector('.native-info-viewport-bleed')).toBeTruthy();
    expect(within(buildingShotSection).getByAltText('AGFinancial office building')).toBeTruthy();
  });

  it('renders the impact proof story as a managed block without native stats fallback', () => {
    mockBlocksByPath = {
      '/about-us/impact': (
        contentBlockBlueprintsByPath['/about-us/impact'] || []
      ).map((block) => ({
        ...block,
        hidden: block.hidden,
      })),
    };

    const { container, unmount } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us/impact',
            title: 'Impact',
          }}
        />
      </MemoryRouter>,
    );

    const managedProofSection = document.querySelector('.impact-native-stats.native-dynamic-site-feature');
    const impactBillboardSection = document.querySelector('.impact-native-billboard');
    expect(managedProofSection).toBeTruthy();
    expect(impactBillboardSection).toBeTruthy();
    expect(container.querySelector('.service-native-hero')).toBeNull();
    expect(container.querySelector('.service-native-intro')).toBeNull();
    expect(within(managedProofSection).getByRole('heading', { name: 'Serving you, alongside you.' })).toBeTruthy();
    expect(within(managedProofSection).getByText('We’re ministry allies.')).toBeTruthy();
    expect(managedProofSection?.querySelector('.impact-proof-story-shell, .impact-proof-story-static')).toBeTruthy();
    expect(managedProofSection?.querySelectorAll('.impact-native-card')).toHaveLength(0);
    expect(within(managedProofSection).queryByText('Impact highlights')).toBeNull();
    expect(managedProofSection?.querySelector('.impact-proof-story-summary')).toBeNull();
    expect(within(managedProofSection).getByText('loans fueling ministry growth.')).toBeTruthy();
    expect(within(managedProofSection).getByText('Over the last 15 years, those loans represent more than 1.4 million people.')).toBeTruthy();
    expect(within(managedProofSection).getByText('retirements planned.')).toBeTruthy();
    expect(within(managedProofSection).getByRole('link', { name: 'Explore loans' }).getAttribute('href')).toBe('/services/loans');
    expect(within(impactBillboardSection).getByRole('heading', { name: "We're making a difference together." })).toBeTruthy();
    expect(screen.queryByText('Bold, smart moves.')).toBeNull();
    expect(screen.queryByText('Let’s make them together.')).toBeNull();

    unmount();
    mockBlocksByPath = {};

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us/impact',
            title: 'Impact',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.impact-native-stats')).toBeNull();
  });

  it('renders the careers route through NativeContentPage with delegated jobs behavior intact', () => {
    mockBlocksByPath = {
      '/about-us/careers': contentBlockBlueprintsByPath['/about-us/careers'],
    };
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

    expect(
      Array.from(document.querySelectorAll('.service-native-hero h1')).map((node) => node.textContent),
    ).toEqual(['Be part of', 'something', 'bigger.']);
    const careersIntro = document.querySelector('.service-native-intro.careers-native-top-intro');
    expect(careersIntro).toBeTruthy();
    expect(careersIntro?.querySelector('.service-native-intro-copy.careers-native-top-intro-copy')).toBeTruthy();
    expect(careersIntro?.querySelector('.careers-native-top-intro-body.fade-up.fade-up-force-observe')).toBeTruthy();
    expect(careersIntro?.querySelector('.careers-native-top-intro-heading.fade-up.fade-up-force-observe.fade-up-no-shift')).toBeTruthy();
    expect(careersIntro?.className).not.toContain('about-native-top-intro');
    expect(document.querySelector('.service-native-hero h1.careers-hero-line--major')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Faith + Career.' })).toBeTruthy();
    const careersEmphasis = screen.getByText('What you do here truly matters.');
    expect(careersEmphasis?.className).toContain('careers-native-top-intro-emphasis');
    expect(careersEmphasis?.className).toContain('fade-up');
    expect(careersEmphasis?.className).toContain('fade-up-force-observe');
    expect(careersEmphasis?.className).toContain('fade-up-repeat-observe');
    expect(careersEmphasis?.className).toContain('billboard-scroll-reveal-scale-up');
    expect(screen.getByRole('heading', { name: 'A few reasons you’ll love working here…' })?.className).toContain('careers-native-benefits-title--roll');
    expect(document.querySelector('.careers-native-ready-copy.fade-up.fade-up-force-observe')).toBeTruthy();
    const careersReadyCopy = screen.getByText('See all positions below and apply online.');
    expect(careersReadyCopy.className).toContain('is-mango');
    expect(screen.getByRole('heading', { name: 'Marketing Manager' })).toBeTruthy();
    expect(screen.getByText('Springfield, MO')).toBeTruthy();
    expect(screen.getByText('Posted March 20, 2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apply Online' })).toBeTruthy();
  });

  it('exposes every Careers section in the front HUD in authored order', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/about-us/careers': contentBlockBlueprintsByPath['/about-us/careers'],
    };

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

    expect(Array.from(document.querySelectorAll('.admin-front-hud-dock-tab .admin-front-hud-dock-tab-label')).map((node) => node.textContent)).toEqual([
      'Hero',
      'Intro',
      'Card Grid · Flexible cards',
      'Billboard',
      'Career Open Positions',
      'Billboard',
      'Page Content',
    ]);
  });

  it('does not restore native careers content when a block-only route is explicitly empty', () => {
    mockBlocksByPath = {
      '/about-us/careers': [],
    };

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

    expect(screen.queryByRole('heading', { name: 'Faith + Career.' })).toBeNull();
    expect(document.querySelector('.native-info-page--careers .careers-native-benefits')).toBeNull();
  });

  it('does not apply the careers intro variant to unrelated native pages like insurance', () => {
    mockBlocksByPath = {
      '/services/insurance': (contentBlockBlueprintsByPath['/services/insurance'] || []).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance',
            title: 'Insurance',
          }}
        />
      </MemoryRouter>,
    );

    const insuranceIntro = document.querySelector('.service-native-intro');
    expect(insuranceIntro).toBeTruthy();
    expect(insuranceIntro?.className).not.toContain('careers-native-top-intro');
    expect(insuranceIntro?.querySelector('.careers-native-top-intro-copy')).toBeNull();
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
            submitLabel: 'Follow up with me',
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

    expect(document.querySelector('[data-block-id="cta_form"]')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Taylor QA' },
    });
    fireEvent.click(screen.getByLabelText('Text me updates'));
    fireEvent.click(screen.getByRole('button', { name: 'Follow up with me' }));

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Thanks. We will reach out soon.')).toBeTruthy();
  });

  it('renders the planned giving stewardship site feature from standalone blocks with a scroll cue instead of a comparison CTA', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const stewardshipSection = document.querySelector('[data-block-id="stewardship_story"]');
    const joySection = document.querySelector('[data-block-id="joy_billboard"]');
    const comparisonSection = document.querySelector('#charitable-giving-plan-comparison');
    const testimonialsSection = document.querySelector('section.legacy-giving-testimonials');
    const fineprintSection = document.querySelector('section.legacy-giving-fineprint');

    expect(screen.getByLabelText('Name*').hasAttribute('required')).toBe(true);
    expect(screen.getByLabelText('Phone*').hasAttribute('required')).toBe(true);
    expect(screen.getByLabelText('Planned giving product of interest*')).toBeTruthy();
    const contactPreferenceSelect = screen.getByLabelText('Contact preference');
    expect(contactPreferenceSelect).toBeTruthy();
    expect(within(contactPreferenceSelect).getByRole('option', { name: 'Phone' })).toBeTruthy();
    expect(within(contactPreferenceSelect).getByRole('option', { name: 'Email' })).toBeTruthy();
    expect(screen.getByRole('option', { name: "I'm not sure." })).toBeTruthy();
    expect(screen.getByText('* fields required')).toBeTruthy();
    expect(stewardshipSection?.querySelector('a[href="#charitable-giving-plan-comparison"]')).toBeNull();
    expect(stewardshipSection?.querySelector('.legacy-stewardship-story-scroll-cue.is-final-cue')).toBeTruthy();
    expect(stewardshipSection?.getAttribute('data-block-id')).toBe('stewardship_story');
    expect(stewardshipSection?.className).toContain('legacy-giving-stewardship');
    expect(stewardshipSection?.className).toContain('legacy-stewardship-story');
    expect(screen.queryByRole('heading', { name: 'Wills & Estate Services' })).toBeNull();
    expect(document.querySelector('[data-block-id="wills_estate_billboard"]')).toBeNull();
    expect(joySection?.className).toContain('fade-out');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
    expect(comparisonSection?.id).toBe('charitable-giving-plan-comparison');
    expect(comparisonSection?.getAttribute('data-block-id')).toBe('comparison_table');
    expect(comparisonSection?.textContent).toContain('Which Charitable Giving plan is right for you?');
    expect(comparisonSection?.textContent).not.toContain('Compare programs side by side. Filter first to narrow options, then review the details that matter most.');
    expect(comparisonSection?.querySelector('.cga-charitable-giving-table-widget')).toBeNull();
    expect(comparisonSection?.querySelector('.info-table-sheet')).toBeNull();
    expect(comparisonSection?.querySelector('.giving-comparison-matrix')).toBeTruthy();
    expect(comparisonSection?.textContent).toContain('I’m exploring this for');
    expect(comparisonSection?.textContent).toContain('For me / my family');
    expect(comparisonSection?.textContent).toContain('For a church or ministry');
    expect(comparisonSection?.textContent).toContain('Start with a few good options.');
    expect(comparisonSection?.textContent).toContain('Individual + Ministry');
    expect(comparisonSection?.textContent).toContain('Ministry Impact Fund®');
    expect(comparisonSection?.textContent).toContain('Details coming soon');
    expect(comparisonSection?.textContent).toContain('Provides Donor Income?');
    expect(comparisonSection?.textContent).toContain('How it’s Funded');
    expect(comparisonSection?.textContent).toContain('Cash, stocks, bonds, or property');
    expect(comparisonSection?.textContent).toContain('Show tax details and timing');
    expect(comparisonSection?.querySelector('table[aria-label="Charitable giving plan comparison"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="comparison_matrix"]')).toBeNull();
    expect(document.querySelector('.legacy-giving-comparison-matrix')).toBeNull();
    expect(testimonialsSection?.getAttribute('data-block-id')).toBe('testimonials');
    expect(testimonialsSection?.textContent).toContain('Donor Advised Fund Corporate Client');
    expect(testimonialsSection?.textContent).toContain('Northplace Church');
    expect(testimonialsSection?.querySelectorAll('.carousel-frame')).toHaveLength(3);
    expect(fineprintSection?.getAttribute('data-block-id')).toBe('testimonials_fineprint');
  });

  it('renders the planned giving joy section through a standalone billboard block while preserving the native motion classes', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const joySection = document.querySelector('[data-block-id="joy_billboard"]');
    const joyHeading = joySection?.querySelector('h2');

    expect(joySection?.getAttribute('data-block-id')).toBe('joy_billboard');
    expect(joySection?.className).toContain('is-billboard-preset-planned-giving-joy');
    expect(joySection?.className).toContain('dynamic-billboard');
    expect(joySection?.className).toContain('fade-out');
    expect(joyHeading?.style.fontFamily).toBe('var(--ag-font-helv)');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
  });

  it('applies the planned giving joy billboard lead-copy size to its plain body paragraph', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic')
        .map((block) => block?.id === 'joy_billboard'
          ? {
              ...block,
              settings: {
                ...block.settings,
                leadCopySizeRem: 2.35,
              },
            }
          : block),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const joyCopy = document.querySelector('[data-block-id="joy_billboard"] .native-info-section-copy');
    const joyBody = joyCopy?.querySelector('.billboard-body-copy');

    expect(joyCopy?.style.getPropertyValue('--dynamic-billboard-lead-copy-size')).toBe(
      'clamp(calc(2.35rem * 0.68), 2.1vw, 2.35rem)',
    );
    expect(joyBody?.className).toContain('is-dynamic-billboard-lead-copy-sized');
  });

  it('renders the planned giving hero and intro through explicit managed blocks without changing the current copy', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const heroLineOne = screen.getByRole('heading', { name: /Generous.*giving\./i });
    const heroLineTwo = screen.getByRole('heading', { name: /With.*strategy\./i });
    const introHeading = screen.getByRole('heading', { name: 'Make a difference that lasts for generations.' });
    const heroSection = heroLineOne.closest('section');
    const introSection = introHeading.closest('section');

    expect(heroLineTwo).toBeTruthy();
    expect(heroSection?.getAttribute('data-block-id')).toBe('hero');
    expect(introSection?.getAttribute('data-block-id')).toBe('intro');
    expect(introSection?.className).toContain('is-bg-sand');
    expect(introSection?.textContent).toContain('Your generosity has the power to bless both the ministries and people you love.');
    expect(introSection?.textContent).toContain('potential tax savings and income generation');
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
  });

  it('renders the insurance overview from explicit managed blocks without a fallback page-content section', () => {
    mockBlocksByPath = {
      '/services/insurance': (contentBlockBlueprintsByPath['/services/insurance'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance',
            title: 'Insurance',
          }}
        />
      </MemoryRouter>,
    );

    const heroHeading = screen.getByRole('heading', { name: 'Impressive coverage' });
    const heroHighlightHeading = screen.getByText('churches & ministries').closest('h1');
    const introHeading = screen.getByRole('heading', { name: 'Protect what matters most.' });
    const coverageHeading = screen.getByRole('heading', { name: 'Coverage options' });
    const riskHeading = screen.getByRole('heading', { name: 'Risk Management' });
    const missionAssureHeading = screen.getByRole('heading', { name: 'Full coverage for mission trips, retreats…' });
    const quoteFormHeading = screen.getByRole('heading', { name: 'What coverage is best for your ministry?' });

    expect(heroHeading.closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(heroHighlightHeading?.textContent).toBe('Built for churches & ministries.');
    expect(heroHighlightHeading?.closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(introHeading.closest('section')?.getAttribute('data-block-id')).toBe('intro');
    expect(introHeading.closest('section')?.className).toContain('is-bg-blue');
    expect(introHeading.closest('section')?.className).toContain('is-text-white');
    expect(coverageHeading.closest('section')?.getAttribute('data-block-id')).toBe('coverage_solutions');
    expect(riskHeading.querySelector('mark.is-melon')?.textContent).toBe('Risk');
    expect(riskHeading.closest('section')?.className).toContain('native-dynamic-columns');
    expect(riskHeading.closest('section')?.className).toContain('is-columns-preset-do-the-math');
    expect(riskHeading.closest('section')?.querySelector('.service-native-dark-feature')).toBeNull();
    expect(missionAssureHeading.closest('section')?.getAttribute('data-block-id')).toBe('mission_assure');
    expect(missionAssureHeading.closest('section')?.className).toContain('native-dynamic-columns');
    expect(missionAssureHeading.closest('section')?.className).toContain('is-columns-preset-housing-allowance');
    expect(missionAssureHeading.closest('section')?.querySelector('.service-native-dark-feature')).toBeNull();
    expect(missionAssureHeading.closest('section')?.textContent).toContain('and everything in between.');
    expect(quoteFormHeading.closest('section')?.className).toContain('insurance-native-cta');
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
  });

  it('renders the insurance hero from published content when the front HUD is toggled off', () => {
    const publishedBlocks = (contentBlockBlueprintsByPath['/services/insurance'] || [])
      .filter((block) => block?.mode === 'dynamic');
    const authoringBlocks = publishedBlocks.map((block) => (
      block?.id === 'hero'
        ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              line1Text: 'For churches.',
              line2Text: 'For ministries.',
              line3Text: 'For you.',
              line1ClassName: 'is-super-grey',
              line2ClassName: 'is-atlantean',
              line3ClassName: 'is-mango',
              line1HighlightsJson: '',
              line2HighlightsJson: '',
              line3HighlightsJson: '',
            },
          }
        : block
    ));

    mockBlocksByPath = {
      '/services/insurance': publishedBlocks,
    };
    mockAuthoringBlocksByPath = {
      '/services/insurance': authoringBlocks,
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance',
            title: 'Insurance',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Impressive coverage' }).closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(screen.getByRole('heading', { name: 'Built forchurches & ministries.' }).closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(screen.queryByRole('heading', { name: 'For churches.' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'For ministries.' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'For you.' })).toBeNull();
  });

  it('renders the planned giving types section through the managed card grid without changing its current design shell', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const givingOptionsSection = document.querySelector('section.legacy-giving-types');
    const productCards = [...(givingOptionsSection?.querySelectorAll('.service-native-card') || [])];
    const firstCard = productCards[0];
    const willsCard = productCards[6];
    const qcdCard = productCards[7];
    const learnMoreLink = within(firstCard).getByRole('link', { name: 'Learn more' });
    const createPlanLink = within(givingOptionsSection).getByRole('link', { name: 'Create your plan' });

    expect(givingOptionsSection?.getAttribute('data-block-id')).toBe('giving_options');
    expect(givingOptionsSection?.className).toContain('legacy-giving-types');
    expect(givingOptionsSection?.className).toContain('native-dynamic-grid');
    expect(givingOptionsSection?.textContent).toContain('This is legacy planning and charitable giving made easy.');
    expect(givingOptionsSection?.querySelector('mark.is-atlantean')?.textContent).toBe('made easy');
    expect(productCards.length).toBeGreaterThan(0);
    expect(firstCard?.getAttribute('style') || '').not.toContain('padding');
    expect(firstCard?.className).toContain('fade-up');
    expect(firstCard?.className).toContain('fade-up-force-observe');
    expect(within(firstCard).getByRole('heading', { name: 'Donor Advised Funds' })).toBeTruthy();
    expect(firstCard?.textContent).toContain('A Donor Advised Fund lets you contribute assets, receive an immediate tax deduction, and recommend grants to the ministries and causes you care about. It’s a tax-smart, flexible way to give on your own timeline.');
    expect(within(firstCard).queryByRole('heading', { name: 'Donor Advised Funds / Generosity Fund®' })).toBeNull();
    expect(within(firstCard).queryByRole('link', { name: 'Watch video' })).toBeNull();
    expect(learnMoreLink.className).toContain('is-tone-atlantean');
    expect(learnMoreLink.className).not.toContain('is-outline');
    expect(learnMoreLink.className).not.toContain('is-ghost');
    expect(createPlanLink.className).not.toContain('is-outline');
    expect(createPlanLink.className).toContain('is-ghost');
    expect(willsCard?.textContent).toContain('Simple and straightforward, a will ensures a distribution end-of-life plan for your assets. This service is provided free of charge when you designate a 10% gift to an Assemblies of God ministry.');
    expect(within(willsCard).getByRole('link', { name: 'Download packet' })).toBeTruthy();
    expect(within(willsCard).getByRole('link', { name: 'Online form*' }).getAttribute('href')).toBe('https://sft.agfinancial.org/documents/Send.do');
    expect(qcdCard?.textContent).toContain('Your IRA can do more than fund your retirement. If you’re 70½ or older, a Qualified Charitable Distribution (QCD) lets you transfer up to $110,000 per year directly to your church or an eligible ministry tax-free, and straight from the source.');
    expect(within(qcdCard).getByRole('link', { name: 'Learn more' }).getAttribute('href')).toBe('/services/planned-giving/qualified-charitable-distribution');
    expect(document.querySelectorAll('section[data-block-id="giving_options"]')).toHaveLength(1);
  });

  it('passes card-grid subhead size to both legacy and rich-html subheads', () => {
    const makeGrid = (id, settings) => ({
      id,
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'Grid heading',
        card1Title: 'First card',
        card1Body: 'Card copy',
        ...settings,
      },
    });
    mockBlocksByPath = {
      '/test': [
        makeGrid('legacy-subhead-grid', {
          subtitle: 'Legacy subhead',
          subheadSizeRem: 1.85,
        }),
        makeGrid('rich-subhead-grid', {
          introHtml: 'Rich subhead<p>Intro copy</p>',
          bgTone: 'grey',
          bodyTone: 'white',
          headerSizeRem: 3.1,
          subheadSizeRem: 1.95,
        }),
      ],
    };

    render(
      <MemoryRouter>
        <NativeContentPage page={{ path: '/test', title: 'Test' }} />
      </MemoryRouter>,
    );

    const legacy = document.querySelector('[data-block-id="legacy-subhead-grid"]');
    const rich = document.querySelector('[data-block-id="rich-subhead-grid"]');
    expect(legacy?.querySelector('.native-info-section-subtitle')?.getAttribute('style')).toContain('font-size: 1.85rem');
    expect(rich?.querySelector('.native-info-rich-html')?.getAttribute('style')).toContain('--dynamic-grid-subhead-size: 1.95rem');
    expect(rich?.querySelector('.native-info-rich-html > h3')?.textContent).toBe('Rich subhead');
    expect(rich?.className).toContain('is-body-white');
    expect(rich?.getAttribute('style')).toContain('--dynamic-grid-header-size: 3.1rem');
    expect(rich?.className).toContain('is-subhead-super-grey');
    expect(rich?.querySelector('.native-info-rich-html > h3')?.className).toBe('');
  });

  it('renders the qualified charitable distribution route through explicit planned giving blocks', () => {
    mockBlocksByPath = {
      '/services/planned-giving/qualified-charitable-distribution': (
        contentBlockBlueprintsByPath['/services/planned-giving/qualified-charitable-distribution'] || []
      ).filter((block) => block?.mode === 'dynamic'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/qualified-charitable-distribution',
            title: 'Qualified Charitable Distribution',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Qualified\s*Charitable/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Distribution' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your IRA can do more.' })).toBeTruthy();
    expect(screen.getByText(/not a dollar goes to taxes first/i)).toBeTruthy();
    expect(screen.getByText('Because the distribution goes directly to the ministry, it\'s excluded from your taxable income entirely. Your generosity goes further.')).toBeTruthy();
    expect(container.querySelector('.is-columns-preset-planned-giving-steps.native-dynamic-columns')).toBeTruthy();
    expect([...container.querySelectorAll('.is-columns-preset-planned-giving-steps [data-planned-giving-step-icon]')]
      .map((icon) => icon.getAttribute('data-planned-giving-step-icon')))
      .toEqual(['endowments-step-1', 'daf-step-3', 'qcd-step-3']);
    expect(container.querySelector('section[data-block-id="hero"]')).toBeTruthy();
    expect(container.querySelector('section[data-block-id="intro"]')).toBeTruthy();
    expect(container.querySelector('section[data-block-id="how_it_works"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your IRA. Their gain.' })).toBeTruthy();
    expect(screen.getByText('Ready to make your distribution count? Use this form to take the first step.')).toBeTruthy();
    expect(container.querySelector('section[data-block-id="request_form"]')).toBeTruthy();
    expect(container.querySelector('section[data-block-id="page_content"]')).toBeNull();
  });

  it('does not render the retired planned giving wills billboard below the giving cards', () => {
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving',
            title: 'Planned Giving',
          }}
        />
      </MemoryRouter>,
    );

    const givingOptionsSection = document.querySelector('section.legacy-giving-types');

    expect(screen.queryByRole('heading', { name: 'Wills & Estate Services' })).toBeNull();
    expect(document.querySelector('[data-block-id="wills_estate_billboard"]')).toBeNull();
    expect(givingOptionsSection).toBeTruthy();
  });

  it('renders the generosity fund joyful giving section through the targeted billboard block while preserving the current action styles', () => {
    mockDocuments = [
      ...mockDocuments,
      {
        id: 'document-planned-giving-terms-and-conditions',
        title: 'Terms and Conditions',
        url: 'https://files.example.com/planned-giving-terms-and-conditions.pdf',
        external: true,
      },
    ];
    mockBlocksByPath = {
      '/services/planned-giving/donor-advised-fund': (contentBlockBlueprintsByPath['/services/planned-giving/donor-advised-fund'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/donor-advised-fund',
            title: 'Donor Advised Fund',
          }}
        />
      </MemoryRouter>,
    );

    const joyfulHeading = screen.getByRole('heading', { name: 'Simple, joyful giving.' });
    const joyfulSection = joyfulHeading.closest('section');
    const openFundLink = within(joyfulSection).getByRole('link', { name: 'Open a Generosity Fund®' });
    const termsLink = within(joyfulSection).getByRole('link', { name: 'Terms and Conditions' });

    expect(joyfulSection?.getAttribute('data-block-id')).toBe('joyful_giving_billboard');
    expect(joyfulSection?.className).toContain('legacy-child-native-generosity-outro');
    expect(joyfulSection?.className).toContain('dynamic-billboard');
    expect(joyfulSection?.className).toContain('is-bg-white');
    expect(joyfulSection?.className).toContain('is-text-dark');
    expect(joyfulHeading.getAttribute('style') || '').toContain('font-family: var(--ag-font-helv)');
    expect(openFundLink.className).toContain('is-tone-atlantean');
    expect(openFundLink.className).not.toContain('is-ghost');
    expect(termsLink.className).not.toContain('is-outline');
    expect(termsLink.className).toContain('is-tone-super-grey');
    expect(termsLink.className).toContain('is-ghost');
    expect(joyfulSection?.textContent).toContain('Powered by your generosity.');
  });

  it('renders the 403(b) online contributions block on the intended retirement feature preset', () => {
    mockBlocksByPath = {
      '/services/retirement/403b': (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/403b',
            title: '403(b)',
          }}
        />
      </MemoryRouter>,
    );

    const heading = screen.getByRole('heading', { name: 'Online Contributions' });
    const section = heading.closest('section');
    const button = screen.getByRole('link', { name: 'Submit contributions' });

    expect(section?.className).toContain('native-dynamic-columns');
    expect(section?.className).toContain('is-columns-preset-do-the-math');
    expect(section?.className).toContain('is-columns-style-retirement');
    expect(screen.queryByText('Column 2')).toBeNull();
    expect(button.className).toContain('service-native-btn');
  });

  it('renders the 403(b) housing columns block with the canonical body copy', () => {
    mockBlocksByPath = {
      '/services/retirement/403b': (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/403b',
            title: '403(b)',
          }}
        />
      </MemoryRouter>,
    );

    const heading = screen.getByRole('heading', { name: "Retired Ministers' Housing Allowance" });
    const section = heading.closest('section');

    expect(section?.className).toContain('native-dynamic-columns');
    expect(section?.className).toContain('is-columns-preset-housing-allowance');
    expect(screen.getByText(/This unique IRS benefit, which gives ministers a significant tax savings/i)).toBeTruthy();
    expect(within(section).getByRole('link', { name: 'IRS information' }).getAttribute('href')).toBe('https://www.irs.gov/publications/p517');
    expect(screen.queryByText('The maximum housing allowance exemption in any tax year is the lesser of:')).toBeNull();
    expect(screen.queryByText('Your actual expenditures')).toBeNull();
  });

  it('does not render the retired standalone 403(b) enroll CTA below the investment strategy feature section', () => {
    mockBlocksByPath = {
      '/services/retirement/403b': (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/403b',
            title: '403(b)',
          }}
        />
      </MemoryRouter>,
    );

    const strategyGridSection = container.querySelector('.retirement-403b-native-strategy-options');
    const strategyEnrollSection = container.querySelector('.retirement-403b-native-strategy-enroll-cta');
    const strategyHeadingSection = container.querySelector('.retirement-403b-native-strategy-heading');
    const loanApplySection = container.querySelector('.retirement-403b-native-loan-apply');
    const loanDetailsSection = container.querySelector('.retirement-403b-native-loans');

    expect(strategyGridSection).toBeTruthy();
    expect(strategyHeadingSection?.getAttribute('style') || '').toContain('--dynamic-billboard-padding-top: 4.8rem');
    expect(strategyHeadingSection?.getAttribute('style') || '').toContain('--dynamic-billboard-padding-bottom: 7.6rem');
    expect(loanApplySection?.className).toContain('is-bg-sandstone');
    expect(loanDetailsSection?.getAttribute('style') || '').toContain('--dyn-content-padding-bottom: 4.8rem');
    expect(strategyEnrollSection).toBeNull();
    expect(within(strategyGridSection).queryByRole('link', { name: 'Enroll now' })).toBeNull();
    expect(within(strategyGridSection).getByRole('heading', { name: 'MBA Income Fund' })).toBeTruthy();
    expect(within(strategyGridSection).getByRole('heading', { name: 'Individual Investment Options' })).toBeTruthy();
    const strategyDocumentLink = within(strategyGridSection).getByRole('link', { name: 'MBA Income Fund' });
    expect(strategyDocumentLink.className).toContain('service-native-btn');
    expect(strategyDocumentLink.className).toContain('is-outline');
    expect(strategyDocumentLink.getAttribute('target')).toBe('_blank');
    expect(strategyGridSection.className).toContain('is-card-grid-preset-investment-options');
  });

  it('renders the 403(b) intro copy and contribution limits through the shared card-chart layout', () => {
    mockBlocksByPath = {
      '/services/retirement/403b': (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/403b',
            title: '403(b)',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('The AGFinancial 403(b) is designed specifically for ministers and ministry employees. It’s a powerful way to save while you serve.')).toBeTruthy();
    expect(container.querySelector('.retirement-403b-rate-widget .info-table-sheet')).toBeTruthy();
    const contributionLimitsChart = container.querySelector('.native-dynamic-card-chart.retirement-child-native-table.retirement-403b-native-contribution-limits');
    expect(contributionLimitsChart).toBeTruthy();
    expect(contributionLimitsChart?.querySelector('.info-table-sheet')).toBeTruthy();
    expect(contributionLimitsChart?.getAttribute('style') || '').toContain('--card-chart-header-gap: 2.4rem');
    expect(contributionLimitsChart?.getAttribute('style') || '').toContain('--dyn-content-max-width: 980px');
    expect(container.querySelector('.retirement-403b-rate-widget .data-table')).toBeNull();
    expect(container.querySelector('.retirement-child-native-table .data-table')).toBeNull();
    expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Under age 50 deferral limit \(pre-tax and Roth after-tax\):/).length).toBeGreaterThan(0);
  });

  it('renders IRA investment rates through the shared Rates block and IRA dataset', () => {
    mockBlocksByPath = {
      '/services/retirement/iras': (contentBlockBlueprintsByPath['/services/retirement/iras'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/iras',
            title: 'IRAs',
          }}
        />
      </MemoryRouter>,
    );

    const rateSection = container.querySelector('[data-block-id="rate_table"]');
    expect(rateSection?.className).toContain('native-dynamic-rates');
    expect(within(rateSection).getByRole('heading', { name: 'IRA Investment Rates' })).toBeTruthy();
    expect(rateSection?.querySelector('[data-rates-block="true"][data-rates-dataset="ira"]')).toBeTruthy();
    expect(rateSection?.querySelector('.retirement-ira-rate-widget')).toBeNull();
    expect(rateSection?.querySelector('.rates-disclaimer')).toBeTruthy();
  });

  it('renders IRA contribution limits through the shared Card Chart block', () => {
    mockBlocksByPath = {
      '/services/retirement/iras': (contentBlockBlueprintsByPath['/services/retirement/iras'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/iras',
            title: 'IRAs',
          }}
        />
      </MemoryRouter>,
    );

    const chartSection = container.querySelector('[data-block-id="contribution_limits"]');
    expect(chartSection?.className).toContain('native-dynamic-card-chart');
    expect(chartSection?.className).toContain('retirement-ira-native-limits');
    expect(within(chartSection).getByRole('heading', { name: 'Roth and Traditional IRA Contribution Limits' })).toBeTruthy();
    expect(chartSection?.querySelector('.info-table-sheet')).toBeTruthy();
    expect(chartSection?.querySelector('.native-dynamic-page-content')).toBeNull();
    expect(within(chartSection).getAllByText('2025').length).toBeGreaterThan(0);
    expect(within(chartSection).getAllByText('2024').length).toBeGreaterThan(0);
  });

  it('renders 409A through explicit blocks instead of page-owned sections', () => {
    mockBlocksByPath = {
      '/services/retirement/409a': (contentBlockBlueprintsByPath['/services/retirement/409a'] || [])
        .filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/409a',
            title: '409A',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '409A considerations' })).toBeTruthy();
    expect(screen.getByText(/all taxable compensation/i)).toBeTruthy();
    expect(container.querySelector('.retirement-child-native-scenarios.native-dynamic-grid')).toBeTruthy();
    expect(container.querySelector('.retirement-child-native-quote')).toBeTruthy();
    expect(container.querySelector('.retirement-child-native-cta.native-dynamic-cta')).toBeTruthy();
    expect(container.querySelector('.retirement-child-native-teaser')).toBeTruthy();
  });

  it('renders 403(b) individual enrollment through explicit blocks instead of native route-owned sections', () => {
    mockBlocksByPath = {
      '/services/retirement/403b/403b-individual-enrollment': (
        contentBlockBlueprintsByPath['/services/retirement/403b/403b-individual-enrollment'] || []
      ).filter((block) => block?.mode !== 'static'),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/retirement/403b/403b-individual-enrollment',
            title: '403b Individual Enrollment',
          }}
        />
      </MemoryRouter>,
    );

    [
      'hero',
      'intro',
      'confirm_eligibility',
      'enrollment_steps',
      'return_forms',
      'request_form',
    ].forEach((blockId) => {
      expect(container.querySelector(`[data-block-id="${blockId}"]`)).toBeTruthy();
    });
    expect(container.querySelector('.retirement-child-native-qualify')).toBeNull();
    expect(container.querySelector('.retirement-child-native-strategies')).toBeNull();
  });

  it('renders charitable trusts without the retired CRT steps and first income-impact form', () => {
    mockBlocksByPath = {
      '/services/planned-giving/charitable-trusts': (
        contentBlockBlueprintsByPath['/services/planned-giving/charitable-trusts'] || []
      ).map((block) => ({
        ...block,
        hidden: false,
      })),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/charitable-trusts',
            title: 'Charitable Trusts',
          }}
        />
      </MemoryRouter>,
    );

    const intro = document.querySelector('.service-native-intro.dynamic-intro');
    const trustChoices = document.querySelector('.legacy-child-native-trust-choices--trusts.native-dynamic-grid');
    const trustDifferences = document.querySelector('.legacy-child-native-trusts-differences.native-dynamic-grid');
    const trustFunding = document.querySelector('.legacy-child-native-trusts-funding.native-dynamic-grid');
    const charitableRemainderTrust = document.querySelector('.legacy-child-native-trusts-crt.dynamic-billboard');
    const charitableRemainderTrustTypes = document.querySelector('.legacy-child-native-trusts-crt-types.native-dynamic-card-chart');
    const charitableLeadTrust = document.querySelector('.legacy-child-native-trusts-clt.dynamic-billboard');
    const charitableLeadTrustTypes = document.querySelector('.legacy-child-native-trusts-clt-types.native-dynamic-card-chart');
    const charitableTrustsRequest = document.querySelector('.legacy-child-native-trusts-request.native-dynamic-request.has-managed-request-shell');

    expect(intro?.className).toContain('is-text-white');
    expect(trustChoices).toBeTruthy();
    expect(trustChoices?.querySelectorAll('.service-native-card')).toHaveLength(2);
    const trustChoiceHeadings = trustChoices?.querySelectorAll('.service-native-card h3') || [];
    expect(trustChoiceHeadings).toHaveLength(2);
    expect(trustChoiceHeadings[0]?.textContent).toBe('Charitable Remainder Trust (CRT)');
    expect(trustChoiceHeadings[0]?.querySelector('mark.is-melon')?.textContent).toBe('Remainder');
    expect(trustChoiceHeadings[1]?.textContent).toBe('Charitable Lead Trust (CLT)');
    expect(trustChoiceHeadings[1]?.querySelector('mark.is-mango')?.textContent).toBe('Lead');
    expect(within(trustChoices).queryByText(/\*\*/)).toBeNull();
    const trustChoiceBodies = trustChoices?.querySelectorAll('.investments-native-cert-card__body p') || [];
    expect(trustChoiceBodies[0]?.textContent).toBe('This option allows you to receive income payments for you and your family while potentially receiving immediate tax benefits. At the completion of the trust, you’ll have the joy of giving to the ministry of your choice. Minimum requirements: $50,000 cash or securities; $100,000 real estate.');
    expect(trustChoiceBodies[0]?.querySelector('strong')?.textContent).toBe('Minimum requirements: $50,000 cash or securities; $100,000 real estate.');
    expect(trustChoiceBodies[1]?.textContent).toBe('This option allows ministry to receive income payments for a set term while you potentially receive immediate tax benefits. At the completion of the trust, assets return to you or transfer to your family—often with significant growth. Minimum requirements: $50,000 cash or securities; $100,000 real estate.');
    expect(trustChoiceBodies[1]?.querySelector('strong')?.textContent).toBe('Minimum requirements: $50,000 cash or securities; $100,000 real estate.');
    const crtButton = within(trustChoices).getByRole('link', { name: 'Explore CRT options' });
    const cltButton = within(trustChoices).getByRole('link', { name: 'Explore CLT options' });
    expect(crtButton.getAttribute('href')).toBe('/services/planned-giving/charitable-trusts#crt');
    expect(crtButton.className).toContain('is-tone-atlantean');
    expect(crtButton.className).not.toContain('is-outline');
    expect(cltButton.getAttribute('href')).toBe('/services/planned-giving/charitable-trusts#clt');
    expect(cltButton.className).toContain('is-tone-mango');
    expect(cltButton.className).not.toContain('is-outline');
    expect(trustDifferences).toBeTruthy();
    expect(within(trustDifferences).getByRole('heading', { name: 'The differences. At a glance.' })).toBeTruthy();
    expect(trustDifferences?.querySelectorAll('.service-native-card')).toHaveLength(2);
    expect(within(trustDifferences).getByText('CRTs & taxes')).toBeTruthy();
    expect(within(trustDifferences).getByText('CLTs & taxes')).toBeTruthy();
    expect(within(trustDifferences).queryByText('Cash')).toBeNull();
    expect(trustFunding).toBeTruthy();
    expect(trustFunding?.querySelector('.native-info-section-copy h2')?.textContent).toBe('Fund both CRTs and CLTs:');
    expect(trustFunding?.querySelector('.native-info-section-copy h2 mark.is-atlantean')?.textContent).toBe('CRTs and CLTs');
    expect(trustFunding?.querySelectorAll('.service-native-card')).toHaveLength(1);
    expect(within(trustFunding).getByText('Funding')).toBeTruthy();
    expect(within(trustFunding).getByText('Cash')).toBeTruthy();
    expect(within(trustFunding).getByText('Securities (stocks, bonds, mutual funds)')).toBeTruthy();
    expect(within(trustFunding).getByText('Real estate')).toBeTruthy();
    const startHereButton = within(trustFunding).getByRole('link', { name: 'Start here' });
    expect(startHereButton.getAttribute('href')).toBe('#charitable-trusts-form');
    expect(startHereButton.className).toContain('is-tone-atlantean');
    expect(startHereButton.className).not.toContain('is-outline');
    expect(charitableRemainderTrust).toBeTruthy();
    expect(within(charitableRemainderTrust).getByRole('heading', { name: 'Charitable Remainder Trust' })).toBeTruthy();
    expect(within(charitableRemainderTrust).getByText(/The trust pays you \(and your spouse, if married\) income for life\./)).toBeTruthy();
    expect(document.querySelector('.legacy-child-native-flow-steps.legacy-child-native-trusts-crt-steps')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'How it works' })).toBeNull();
    expect(screen.queryByText('Placeholder: describe the first CRT step here.')).toBeNull();
    expect(charitableRemainderTrustTypes).toBeTruthy();
    expect(charitableRemainderTrustTypes?.querySelector('.info-table-sheet[data-info-table-first-column-header="false"]')).toBeTruthy();
    expect(within(charitableRemainderTrustTypes).getAllByText('Charitable Remainder Unitrust (CRUT)').length).toBeGreaterThan(0);
    expect(within(charitableRemainderTrustTypes).getAllByText('Minimum required payout of 5%').length).toBeGreaterThan(0);
    expect(within(charitableRemainderTrustTypes).getAllByText('Charitable Remainder Annuity (CRAT)').length).toBeGreaterThan(0);
    expect(within(charitableRemainderTrustTypes).getAllByText('Payments may begin immediately upon funding').length).toBeGreaterThan(0);
    expect(charitableLeadTrust).toBeTruthy();
    expect(within(charitableLeadTrust).getByRole('heading', { name: 'Charitable Lead Trust' })).toBeTruthy();
    expect(within(charitableLeadTrust).getByText(/The trust pays income to the ministry you’ve selected for a set number of years\./)).toBeTruthy();
    expect(charitableLeadTrustTypes).toBeTruthy();
    expect(charitableLeadTrustTypes?.querySelector('.info-table-sheet[data-info-table-first-column-header="false"]')).toBeTruthy();
    expect(within(charitableLeadTrustTypes).getAllByText('Grantor Lead Trust').length).toBeGreaterThan(0);
    expect(within(charitableLeadTrustTypes).getAllByText('Donor is taxed on the trust’s income each year').length).toBeGreaterThan(0);
    expect(within(charitableLeadTrustTypes).getAllByText('Non-Grantor Lead Trust').length).toBeGreaterThan(0);
    expect(within(charitableLeadTrustTypes).getAllByText('Income is taxed at the trust level each year').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Start the process' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Start the process' })).toBeNull();
    expect(document.querySelector('#charitable-trusts-inline-form')).toBeNull();
    expect(document.querySelector('#charitable-trusts-form')).toBeTruthy();
    expect(charitableTrustsRequest).toBeTruthy();
    expect(charitableTrustsRequest?.className).toContain('is-request-form-preset-legacy-trusts');
    expect(charitableTrustsRequest?.className).toContain('is-bg-blue');
    expect(charitableTrustsRequest?.className).toContain('is-text-white');
    expect(charitableTrustsRequest?.querySelector('.native-info-section-copy.dynamic-request-copy h2')?.textContent).toBe('Income and impact.');
    expect(charitableTrustsRequest?.querySelector('.native-info-section-copy.dynamic-request-copy h2 mark.is-white')?.textContent).toBe('and');
    expect(charitableTrustsRequest?.querySelector('.native-info-section-copy.dynamic-request-copy h2 mark.is-mango')?.textContent).toBe('impact');
    expect(within(charitableTrustsRequest).getByText('Use this form to start the Charitable Trust process. Let’s transform your generosity into a tax-saving, ministry-supporting win.')).toBeTruthy();
    const trustsContactPreferenceSelect = within(charitableTrustsRequest).getByLabelText('How should we get in touch with you?');
    expect(trustsContactPreferenceSelect.hasAttribute('required')).toBe(true);
    expect(within(trustsContactPreferenceSelect).getByRole('option', { name: 'Phone' })).toBeTruthy();
    expect(within(trustsContactPreferenceSelect).getByRole('option', { name: 'Email' })).toBeTruthy();
    expect(within(charitableTrustsRequest).queryByText('And we’re eager to help.')).toBeNull();
    expect(charitableTrustsRequest?.querySelector('.dynamic-request-form h5')).toBeNull();
    expect(charitableTrustsRequest?.querySelector('.native-info-inline-form.dynamic-request-form')).toBeTruthy();
    const requestLayoutChildren = Array.from(charitableTrustsRequest?.querySelector('.dynamic-request-layout')?.children || []);
    expect(requestLayoutChildren.indexOf(charitableTrustsRequest?.querySelector('.native-info-inline-form.dynamic-request-form'))).toBeLessThan(
      requestLayoutChildren.indexOf(charitableTrustsRequest?.querySelector('.native-info-section-copy.dynamic-request-copy')),
    );
    expect(screen.getAllByRole('button', { name: 'Start planning' })).toHaveLength(1);
  });

  it('does not restore native hero or intro copy when managed blocks are deleted', () => {
    mockBlocksByPath = {
      '/services/planned-giving/charitable-trusts': (
        contentBlockBlueprintsByPath['/services/planned-giving/charitable-trusts'] || []
      ).filter((block) => !['hero', 'intro'].includes(block?.id)),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/charitable-trusts',
            title: 'Charitable Trusts',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(document.querySelector('.service-native-intro')).toBeNull();
  });

  it('keeps the generosity fund traditional DAF hero CTA on the managed request-form anchor', () => {
    mockBlocksByPath = {
      '/services/planned-giving/donor-advised-fund': [
        {
          id: 'hero',
          kind: 'hero',
          mode: 'dynamic',
          settings: {
            line1Text: 'Your giving.',
            line2Text: 'Managed.',
            button1Label: 'Open a traditional DAF',
            button1LinkJson: serializeLinkValue({
              kind: 'anchor',
              href: '#traditional-daf-form',
            }),
            button1Style: 'outline',
            button1Tone: 'super-grey',
            button2Label: 'Open a Generosity Fund®',
            button2LinkJson: serializeLinkValue({
              kind: 'external',
              href: 'https://secure.agfinancial.org/generosityfund/signup',
            }),
            button2Style: 'blue',
            button2Tone: 'atlantean',
          },
        },
        {
          id: 'request_form',
          kind: 'request_form',
          mode: 'dynamic',
          settings: {
            title: 'Make the most of your giving.',
            body: 'Let’s discover the best way for you to give, and in the easiest way possible.',
            bgTone: 'blue',
            textTone: 'white',
            submitLabel: 'Submit',
            anchorId: 'traditional-daf-form',
            sectionClassName: 'legacy-child-native-generosity-request',
            step1FieldsJson: JSON.stringify([
              { id: 'name', label: 'Name*', type: 'text', required: true },
            ]),
          },
        },
      ],
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/donor-advised-fund',
            title: 'Donor Advised Fund',
          }}
        />
      </MemoryRouter>,
    );

    const heroSection = document.querySelector('[data-block-id="hero"]');
    const heroLinks = within(heroSection).getAllByRole('link');

    expect(heroLinks[0].textContent).toBe('Open a traditional DAF');
    expect(heroLinks[0].getAttribute('href')).toBe('#traditional-daf-form');
    expect(heroLinks[1].textContent).toBe('Open a Generosity Fund®');
    expect(heroLinks[1].getAttribute('href')).toContain('secure.agfinancial.org/generosityfund/signup');
    expect(document.querySelector('#traditional-daf-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Submit' })).toHaveLength(1);
  });
});
