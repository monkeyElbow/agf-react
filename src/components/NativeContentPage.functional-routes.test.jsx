import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

let mockPageHierarchy = {};
let mockBlocksByPath = {};
let mockAuthoringBlocksByPath = null;
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
      '/services/planned-giving/generosity-fund': {
        path: '/services/planned-giving/generosity-fund',
        title: 'Generosity Fund',
        section: 'Services',
      },
      '/services/planned-giving/ministry-impact-fund': {
        path: '/services/planned-giving/ministry-impact-fund',
        title: 'Ministry Impact Fund',
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
    expect(document.querySelector('.calculators-native-contact')).toBeNull();
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
    expect(document.querySelector('.certificate-request-native-section')).toBeTruthy();
    expect(document.querySelector('.certificate-request-native-section .certificate-request-form')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="hero"]')).toBeTruthy();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
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
    expect(document.querySelector('.group-life-native-quote.native-dynamic-request')).toBeTruthy();
    expect(document.querySelector('.group-life-native-honor.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.group-life-native-benefits.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getAllByText('Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.')).toHaveLength(1);
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
    expect(document.querySelector('.life-quote-native-bridge.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Which is best for you?' })).toBeTruthy();
    expect(screen.getByText('Use the quote form below to get started.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Request a Life Insurance Quote' })).toBeTruthy();
  });

  it('renders property and casualty from standalone blocks without native fallback content', () => {
    mockBlocksByPath = {
      '/services/insurance/property-casualty-insurance': (
        contentBlockBlueprintsByPath['/services/insurance/property-casualty-insurance'] || []
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
            path: '/services/insurance/property-casualty-insurance',
            title: 'Property & Casualty Insurance',
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('.insurance-pc-native-quote.native-dynamic-request')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-ag-program.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-partner.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-resources.native-dynamic-grid')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-safe.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('.insurance-pc-native-fineprint.native-dynamic-page-content')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="site_feature"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Request a P&C quote.' })).toBeTruthy();
    expect(screen.getByText('Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'AG Insurance Program' })).toBeTruthy();
    expect(screen.getByAltText('Church Mutual Insurance')).toBeTruthy();
    expect(screen.getByText('Additional coverages available')).toBeTruthy();
    expect(screen.getByText('Safe & sound')).toBeTruthy();
    expect(screen.getByText('CM0045 (04-2020)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('renders retirement consultants from the targeted request-form block without a fallback page-content section', () => {
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

    expect(document.querySelector('.service-native-hero h1')?.textContent).toBe('Retirement Consultants');
    expect(document.querySelector('.loans-consultant-native-contact.native-dynamic-request')).toBeTruthy();
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(document.querySelector('[data-block-id="request_form"]')).toBeTruthy();
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

    expect(document.querySelector('.retirement-rollovers-native-request.native-dynamic-request')).toBeTruthy();
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
    expect(document.querySelector('.legacy-child-native-cga-request.native-dynamic-request')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Generous.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tax benefits\.\s+Ministry support\.\s+Payments for life\./ })).toBeTruthy();
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
    expect(document.querySelector('.legacy-child-native-request.native-dynamic-request')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Unlocked.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Most wealth isn’t cash.' })).toBeTruthy();
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
    expect(screen.getByRole('heading', { name: 'Where faith & finance grow together.' })).toBeTruthy();
    expect(screen.getByText('Our culture is delivering the best financial products and experiences that align with biblical values.')).toBeTruthy();
    expect(screen.getByText('Our mission is your financial health and ministry growth.')).toBeTruthy();
    expect(screen.queryByText('Connect your faith & finances.')).toBeNull();

    const buildingShotSection = document.querySelector('.about-native-building-shot');
    expect(buildingShotSection).toBeTruthy();
    expect(within(buildingShotSection).getByAltText('AGFinancial office building')).toBeTruthy();

    const strategySection = document.querySelector('.about-native-strategy');
    expect(strategySection).toBeTruthy();
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
    expect(
      [...(valuesSection?.querySelectorAll('.investments-native-growth-card h3') || [])]
        .map((heading) => heading.textContent),
    ).toEqual(['Focus', 'Responsibility', 'Guidance']);
    expect(valuesSection?.querySelector('.about-native-values-card--focus')).toBeTruthy();
    expect(valuesSection?.querySelector('.about-native-values-card--responsibility')).toBeTruthy();
    expect(valuesSection?.querySelector('.about-native-values-card--experience')).toBeTruthy();

    const alliesSection = document.querySelector('.about-native-allies');
    expect(alliesSection).toBeTruthy();
    expect(within(alliesSection).getByRole('heading', { name: 'Ministry allies.' })).toBeTruthy();
    expect(alliesSection?.textContent).toContain("We're serving you, alongside you.");
    expect(within(alliesSection).getByRole('link', { name: "See what we're doing together" }).getAttribute('href')).toBe('/about-us/impact');
    expect(within(alliesSection).getByRole('link', { name: "See what we're doing together" }).closest('.service-native-action-row')?.className).toContain('is-centered');

    const historySection = document.querySelector('.about-native-history');
    expect(historySection).toBeTruthy();
    expect(historySection?.querySelector('.investments-native-growth-surface')).toBeTruthy();
    expect(historySection?.querySelector('.investments-native-growth-grid')).toBeTruthy();
    expect(historySection?.querySelectorAll('.investments-native-growth-card')).toHaveLength(6);
    expect(within(historySection).getByText('AGFinancial grew out of something already alive and working. That’s a stupid sentence. This is all temporary, by the way.')).toBeTruthy();
    expect(within(historySection).getByText(/AG Financial Services Group \(AGFSG\), which officially launched operations on October 1, 1998\./)).toBeTruthy();
    expect(within(historySection).getByRole('link', { name: 'This is why we matter' }).getAttribute('href')).toBe('/about-us/impact');
    expect(within(historySection).getByRole('link', { name: 'This is why we matter' }).closest('.service-native-action-row')?.className).toContain('is-centered');

    expect(document.querySelector('.about-native-cta-form')).toBeTruthy();
  });

  it('renders the impact proof story as a managed block without native stats fallback', () => {
    mockBlocksByPath = {
      '/about-us/impact': (
        contentBlockBlueprintsByPath['/about-us/impact'] || []
      ).map((block) => ({
        ...block,
        hidden: false,
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
    expect(within(managedProofSection).getByText('ministries supported by loans.')).toBeTruthy();
    expect(within(managedProofSection).getByText('Over the last 10 years, those ministries represent more than 945,000 people.')).toBeTruthy();
    expect(within(managedProofSection).getByText('retirements planned.')).toBeTruthy();
    expect(within(managedProofSection).getByRole('link', { name: 'Explore loans' }).getAttribute('href')).toBe('/services/loans');
    expect(within(impactBillboardSection).getByRole('heading', { name: "We're making a difference together." })).toBeTruthy();
    expect(managedProofSection.compareDocumentPosition(impactBillboardSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(impactBillboardSection.nextElementSibling).toBeNull();
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
    expect(screen.getByText('What you do here truly matters.')?.className).toContain('careers-native-top-intro-emphasis');
    expect(screen.getByText('What you do here truly matters.')?.className).not.toContain('fade-up');
    expect(screen.getByRole('heading', { name: 'A few reasons you’ll love working here…' })?.className).toContain('careers-native-benefits-title--roll');
    expect(document.querySelector('.careers-native-ready-copy.fade-up.fade-up-force-observe')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Marketing Manager' })).toBeTruthy();
    expect(screen.getByText('Springfield, MO')).toBeTruthy();
    expect(screen.getByText('Posted March 20, 2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apply Online' })).toBeTruthy();
  });

  it('does not apply the careers intro variant to unrelated native pages like insurance', () => {
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

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Taylor QA' },
    });
    fireEvent.click(screen.getByLabelText('Text me updates'));
    fireEvent.click(screen.getByRole('button', { name: 'Follow up with me' }));

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Thanks. We will reach out soon.')).toBeTruthy();
  });

  it('renders the planned giving stewardship site feature from standalone blocks and wires its CTA to the comparison anchor', () => {
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

    const willsHeading = screen.getByRole('heading', { name: 'Wills & Estate Services' });
    const stewardshipHeading = screen.getByRole('heading', { name: 'Smart stewardship for today and tomorrow.' });
    const joyHeading = screen.getByText((_, element) => (
      element?.tagName === 'H2' && element.textContent === 'More joy in giving.'
    ));
    const stewardshipSection = stewardshipHeading.closest('section');
    const willsSection = willsHeading.closest('section');
    const joySection = joyHeading.closest('section');
    const comparisonSection = document.querySelector('#charitable-giving-plan-comparison');

    expect(screen.getByText('Receive payments for life.')).toBeTruthy();
    expect(stewardshipSection?.querySelector('a[href="#charitable-giving-plan-comparison"]')?.textContent).toBe('Compare charitable giving ideas');
    expect(stewardshipSection?.getAttribute('data-block-id')).toBe('stewardship_story');
    expect(stewardshipSection?.className).toContain('legacy-giving-stewardship');
    expect(stewardshipSection?.className).toContain('legacy-stewardship-story');
    expect(willsSection && stewardshipSection
      ? Boolean(willsSection.compareDocumentPosition(stewardshipSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(stewardshipSection && joySection
      ? Boolean(stewardshipSection.compareDocumentPosition(joySection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(joySection?.className).toContain('fade-out');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
    expect(comparisonSection?.id).toBe('charitable-giving-plan-comparison');
    expect(comparisonSection?.getAttribute('data-block-id')).toBe('comparison_table');
    expect(comparisonSection?.textContent).toContain('Which Charitable Giving plan is right for you?');
    expect(document.querySelector('[data-block-id="comparison_matrix"]')).toBeNull();
    expect(document.querySelector('.legacy-giving-comparison-matrix')).toBeNull();
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

    const joyHeading = screen.getByText((_, element) => (
      element?.tagName === 'H2' && element.textContent === 'More joy in giving.'
    ));
    const joySection = joyHeading.closest('section');

    expect(joySection?.getAttribute('data-block-id')).toBe('joy_billboard');
    expect(joySection?.className).toContain('legacy-giving-joy');
    expect(joySection?.className).toContain('dynamic-billboard');
    expect(joySection?.className).toContain('fade-out');
    expect(joyHeading.style.fontFamily).toBe('var(--ag-font-helv)');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
    expect(joySection?.textContent).toContain('It’s easier than you think.');
    expect(joySection?.textContent).toContain('Your charitable giving plan makes it easy to manage both your cash and non-cash assets.');
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
    const missionAssureHeading = screen.getByRole('heading', { name: 'Full coverage for mission trips, retreats, and everything in between.' });
    const quoteFormHeading = screen.getByRole('heading', { name: 'What coverage is best for your ministry?' });

    expect(heroHeading.closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(heroHighlightHeading?.textContent).toBe('Built for churches & ministries.');
    expect(heroHighlightHeading?.closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(introHeading.closest('section')?.getAttribute('data-block-id')).toBe('intro');
    expect(missionAssureHeading.closest('section')?.getAttribute('data-block-id')).toBe('mission_assure');
    expect(quoteFormHeading.closest('section')?.className).toContain('insurance-native-cta');
    expect(document.querySelector('[data-block-id="page_content"]')).toBeNull();
  });

  it('keeps the insurance hero on authoring content when the front HUD is toggled off', () => {
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

    expect(screen.getByRole('heading', { name: 'For churches.' }).closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(screen.getByRole('heading', { name: 'For ministries.' }).closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(screen.getByRole('heading', { name: 'For you.' }).closest('section')?.getAttribute('data-block-id')).toBe('hero');
    expect(screen.queryByRole('heading', { name: 'Impressive coverage' })).toBeNull();
    expect(screen.queryByText('churches & ministries')).toBeNull();
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
    const firstCard = givingOptionsSection?.querySelector('.service-native-card');
    const watchVideoLink = within(firstCard).getByRole('link', { name: 'Watch video' });
    const learnMoreLink = within(firstCard).getByRole('link', { name: 'Learn more' });
    const createPlanLink = within(givingOptionsSection).getByRole('link', { name: 'Create your plan' });

    expect(givingOptionsSection?.getAttribute('data-block-id')).toBe('giving_options');
    expect(givingOptionsSection?.className).toContain('legacy-giving-types');
    expect(givingOptionsSection?.className).toContain('native-dynamic-grid');
    expect(givingOptionsSection?.textContent).toContain('This is legacy planning and charitable giving made easy.');
    expect(givingOptionsSection?.querySelector('mark.is-atlantean')?.textContent).toBe('made easy');
    expect(givingOptionsSection?.querySelectorAll('.service-native-card')).toHaveLength(6);
    expect(firstCard?.className).toContain('fade-up');
    expect(firstCard?.className).toContain('fade-up-force-observe');
    expect(watchVideoLink.className).toContain('is-outline');
    expect(watchVideoLink.className).not.toContain('is-ghost');
    expect(learnMoreLink.className).toContain('is-tone-atlantean');
    expect(learnMoreLink.className).not.toContain('is-outline');
    expect(learnMoreLink.className).not.toContain('is-ghost');
    expect(createPlanLink.className).toContain('is-outline');
    expect(createPlanLink.className).not.toContain('is-ghost');
    expect(document.querySelectorAll('section[data-block-id="giving_options"]')).toHaveLength(1);
  });

  it('renders the planned giving wills section through a standalone billboard block while preserving the current action styles', () => {
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

    const willsHeading = screen.getByRole('heading', { name: 'Wills & Estate Services' });
    const willsSection = willsHeading.closest('section');
    const downloadPacketLink = within(willsSection).getByRole('link', { name: 'Download packet' });
    const onlineFormLink = within(willsSection).getByRole('link', { name: 'Online form*' });

    expect(willsSection?.getAttribute('data-block-id')).toBe('wills_estate_billboard');
    expect(willsSection?.className).toContain('legacy-giving-wills');
    expect(willsSection?.className).toContain('dynamic-billboard');
    expect(willsSection?.className).toContain('is-bg-sand');
    expect(downloadPacketLink.className).toContain('is-outline');
    expect(downloadPacketLink.className).toContain('is-tone-atlantean');
    expect(onlineFormLink.className).toContain('is-tone-atlantean');
    expect(onlineFormLink.className).toContain('is-outline');
    expect(onlineFormLink.className).not.toContain('is-ghost');
    expect(willsSection?.textContent).toContain('This service is provided free of charge');
    expect(willsSection?.textContent).toContain('requires review by your attorney');
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
      '/services/planned-giving/generosity-fund': (contentBlockBlueprintsByPath['/services/planned-giving/generosity-fund'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/planned-giving/generosity-fund',
            title: 'Generosity Fund',
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
    expect(openFundLink.className).toContain('is-tone-atlantean');
    expect(openFundLink.className).not.toContain('is-ghost');
    expect(termsLink.className).toContain('is-outline');
    expect(termsLink.className).toContain('is-tone-super-grey');
    expect(termsLink.className).not.toContain('is-ghost');
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

    const strategyGridSection = container.querySelector('.retirement-403b-native-strategy-feature');
    const strategyEnrollSection = container.querySelector('.retirement-403b-native-strategy-enroll-cta');

    expect(strategyGridSection).toBeTruthy();
    expect(strategyEnrollSection).toBeNull();
    expect(within(strategyGridSection).queryByRole('link', { name: 'Enroll now' })).toBeNull();
  });

  it('renders the 403(b) intro copy and remaining public retirement tables through the shared table-sheet layout', () => {
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
    expect(container.querySelector('.retirement-child-native-table .info-table-sheet')).toBeTruthy();
    expect(container.querySelector('.retirement-403b-rate-widget .data-table')).toBeNull();
    expect(container.querySelector('.retirement-child-native-table .data-table')).toBeNull();
    expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Under age 50 deferral limit (pre-tax and Roth after-tax)').length).toBeGreaterThan(0);
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

    expect(screen.getByRole('heading', { name: /AGFinancial 403\(b\)/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /IndividualEnrollment/i })).toBeTruthy();
    expect(screen.getByText('Start with the 403(b) plan summary.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download 403(b) Summary PDF' }).getAttribute('href'))
      .toBe('https://files.agfinancial.org/Retirement/Plansummary.pdf');
    expect(screen.getByRole('heading', { name: 'Confirm eligibility' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Complete your enrollment' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download Enrollment Form' }).getAttribute('href'))
      .toBe('https://files.agfinancial.org/retirement/403b-Enrollment-Form.pdf');
    expect(screen.getByText('Mail or fax completed forms to:')).toBeTruthy();
    expect(screen.getByText('PO Box 2515')).toBeTruthy();
    expect(screen.getByText('417.520.0406')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Need help.*enrollment\?/i })).toBeTruthy();
    expect(container.querySelector('.retirement-child-native-qualify')).toBeNull();
    expect(container.querySelector('.retirement-child-native-strategies')).toBeNull();
  });

  it('reveals an external inline CTA shell from a single centered charitable trusts trigger while keeping the later form visible', async () => {
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
    const charitableRemainderTrust = document.querySelector('.legacy-child-native-trusts-crt.dynamic-billboard');
    const charitableRemainderTrustTypes = document.querySelector('.legacy-child-native-trusts-crt-types.native-dynamic-grid');
    const charitableLeadTrust = document.querySelector('.legacy-child-native-trusts-clt.dynamic-billboard');
    const charitableLeadTrustTypes = document.querySelector('.legacy-child-native-trusts-clt-types.native-dynamic-grid');

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
    expect(within(trustChoices).getByRole('link', { name: 'Explore CRT options' }).getAttribute('href')).toBe('/services/planned-giving/charitable-trusts#crt');
    expect(within(trustChoices).getByRole('link', { name: 'Explore CLT options' }).getAttribute('href')).toBe('/services/planned-giving/charitable-trusts#clt');
    expect(trustDifferences).toBeTruthy();
    expect(within(trustDifferences).getByRole('heading', { name: 'The differences. At a glance.' })).toBeTruthy();
    expect(trustDifferences?.querySelectorAll('.service-native-card')).toHaveLength(3);
    expect(within(trustDifferences).getByText('Cash')).toBeTruthy();
    expect(within(trustDifferences).getByText('CRTs & taxes')).toBeTruthy();
    expect(within(trustDifferences).getByText('CLTs & taxes')).toBeTruthy();
    expect(charitableRemainderTrust).toBeTruthy();
    expect(within(charitableRemainderTrust).getByRole('heading', { name: 'Charitable Remainder Trust' })).toBeTruthy();
    expect(within(charitableRemainderTrust).getByText(/The trust pays you \(and your spouse, if married\) income for life\./)).toBeTruthy();
    expect(charitableRemainderTrustTypes).toBeTruthy();
    expect(charitableRemainderTrustTypes?.querySelectorAll('.service-native-card')).toHaveLength(2);
    expect(within(charitableRemainderTrustTypes).getByText('Charitable Remainder Unitrust (CRUT)')).toBeTruthy();
    expect(within(charitableRemainderTrustTypes).getByText('Minimum required payout of 5%')).toBeTruthy();
    expect(within(charitableRemainderTrustTypes).getByText('Charitable Remainder Annuity (CRAT)')).toBeTruthy();
    expect(within(charitableRemainderTrustTypes).getByText('Payments may begin immediately upon funding')).toBeTruthy();
    expect(charitableLeadTrust).toBeTruthy();
    expect(within(charitableLeadTrust).getByRole('heading', { name: 'Charitable Lead Trust' })).toBeTruthy();
    expect(within(charitableLeadTrust).getByText(/The trust pays income to the ministry\(ies\) you’ve selected for a set number of years\./)).toBeTruthy();
    expect(charitableLeadTrustTypes).toBeTruthy();
    expect(charitableLeadTrustTypes?.querySelectorAll('.service-native-card')).toHaveLength(2);
    expect(within(charitableLeadTrustTypes).getByText('Grantor Lead Trust')).toBeTruthy();
    expect(within(charitableLeadTrustTypes).getByText('Donor is taxed on the trust’s income each year')).toBeTruthy();
    expect(within(charitableLeadTrustTypes).getByText('Non-Grantor Lead Trust')).toBeTruthy();
    expect(within(charitableLeadTrustTypes).getByText('Income is taxed at the trust level each year')).toBeTruthy();
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

  it('keeps the generosity fund traditional DAF hero CTA on the managed request-form anchor', () => {
    mockBlocksByPath = {
      '/services/planned-giving/generosity-fund': [
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
            button2Url: '#traditional-daf-form',
            button2PageRef: '',
            button2Style: 'outline',
            button2Tone: 'super-grey',
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
            path: '/services/planned-giving/generosity-fund',
            title: 'Generosity Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: 'Open a Generosity Fund®' })[0].getAttribute('href')).toContain('secure.agfinancial.org/generosityfund/signup');
    expect(screen.getByRole('link', { name: 'Open a traditional DAF' }).getAttribute('href')).toBe('#traditional-daf-form');
    expect(document.querySelector('#traditional-daf-form')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Submit' })).toHaveLength(1);
  });
});
