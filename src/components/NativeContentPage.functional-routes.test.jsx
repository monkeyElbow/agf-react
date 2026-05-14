import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

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
      '/services/legacy-giving/ministry-impact-fund': {
        path: '/services/legacy-giving/ministry-impact-fund',
        title: 'Ministry Impact Fund',
        section: 'Services',
      },
      '/services/retirement/403b': {
        path: '/services/retirement/403b',
        title: '403(b)',
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

  it('renders calculators with the shared request-form shell and a single calculator intro copy', () => {
    mockBlocksByPath = {
      '/calculators': (contentBlockBlueprintsByPath['/calculators'] || []).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/calculators',
            title: 'Calculators',
          }}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.calculators-native-contact.native-dynamic-request')).toBeTruthy();
    expect(container.querySelector('.calculators-native-contact .dynamic-request-layout')).toBeTruthy();
    expect(container.querySelector('.calculators-native-contact .native-info-inline-form.dynamic-request-form')).toBeTruthy();
    expect(container.querySelector('.calculators-native-contact .native-info-inline-form:not(.dynamic-request-form)')).toBeNull();
    expect(screen.getAllByText('Tell us what you are trying to calculate, and one of our team will be in touch within 24 business hours.')).toHaveLength(1);
  });

  it('renders charitable gift annuities from explicit managed blocks without a fallback page-content section', () => {
    mockBlocksByPath = {
      '/services/legacy-giving/charitable-gift-annuities': (
        contentBlockBlueprintsByPath['/services/legacy-giving/charitable-gift-annuities'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/legacy-giving/charitable-gift-annuities',
            title: 'Charitable Gift Annuities',
          }}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(container.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(container.querySelector('.legacy-child-native-cga-request.native-dynamic-request')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Generous.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tax benefits\.\s+Ministry support\.\s+Payments for life\./ })).toBeTruthy();
  });

  it('renders ministry impact fund from explicit managed blocks without a fallback page-content section', () => {
    mockBlocksByPath = {
      '/services/legacy-giving/ministry-impact-fund': (
        contentBlockBlueprintsByPath['/services/legacy-giving/ministry-impact-fund'] || []
      ).map((block) => ({
        ...block,
        settings: { ...(block?.settings || {}) },
        editableFields: Array.isArray(block?.editableFields) ? [...block.editableFields] : [],
      })),
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/legacy-giving/ministry-impact-fund',
            title: 'Ministry Impact Fund',
          }}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-block-id="page_content"]')).toBeNull();
    expect(container.querySelector('[data-block-id="request_form"]')).toBeTruthy();
    expect(container.querySelector('.legacy-child-native-request.native-dynamic-request')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Unlocked.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Most wealth isn’t cash.' })).toBeTruthy();
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

    expect(screen.getByText('Receive payments for life.')).toBeTruthy();
    expect(stewardshipSection?.querySelector('a[href="#charitable-giving-plan-comparison"]')?.textContent).toBe('Learn more');
    expect(stewardshipSection?.className).toContain('legacy-giving-stewardship');
    expect(willsSection && stewardshipSection
      ? Boolean(willsSection.compareDocumentPosition(stewardshipSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(stewardshipSection && joySection
      ? Boolean(stewardshipSection.compareDocumentPosition(joySection) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false).toBe(true);
    expect(joySection?.className).toContain('fade-out');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
    expect(comparisonSection?.id).toBe('charitable-giving-plan-comparison');
    expect(comparisonSection?.textContent).toContain('Which Charitable Giving plan is right for you?');
  });

  it('renders the legacy giving joy section through the billboard block target while preserving the native motion classes', () => {
    mockBlocksByPath = {
      '/services/legacy-giving': (contentBlockBlueprintsByPath['/services/legacy-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
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

    const joyHeading = screen.getByText((_, element) => (
      element?.tagName === 'H2' && element.textContent === 'More joy in giving.'
    ));
    const joySection = joyHeading.closest('section');

    expect(joySection?.getAttribute('data-block-id')).toBe('joy_billboard');
    expect(joySection?.className).toContain('legacy-giving-joy');
    expect(joySection?.className).toContain('dynamic-billboard');
    expect(joySection?.className).toContain('fade-out');
    expect(joySection?.querySelector('.native-info-section-copy.fade-up')).toBeTruthy();
    expect(joySection?.textContent).toContain('It’s easier than you think.');
    expect(joySection?.textContent).toContain('Your charitable giving plan makes it easy to manage both your cash and non-cash assets.');
  });

  it('renders the legacy giving hero and intro through explicit managed blocks without changing the current copy', () => {
    mockBlocksByPath = {
      '/services/legacy-giving': (contentBlockBlueprintsByPath['/services/legacy-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
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

    const heroLineOne = screen.getByRole('heading', { name: /Generous.*giving\./i });
    const heroLineTwo = screen.getByRole('heading', { name: /With.*strategy\./i });
    const introHeading = screen.getByRole('heading', { name: 'Make a difference that lasts for generations.' });
    const heroSection = heroLineOne.closest('section');
    const introSection = introHeading.closest('section');

    expect(heroLineTwo).toBeTruthy();
    expect(heroSection?.getAttribute('data-block-id')).toBe('hero');
    expect(introSection?.getAttribute('data-block-id')).toBe('intro');
    expect(introSection?.textContent).toContain('Your generosity has the power to bless both the ministries and people you love.');
    expect(introSection?.textContent).toContain('potential tax savings and income generation');
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

  it('renders a single centered 403(b) enroll CTA below the investment strategy options grid', () => {
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

    const strategyGridSection = container.querySelector('.native-dynamic-grid.is-card-grid-preset-investment-options');
    const strategyEnrollSection = container.querySelector('.retirement-403b-native-strategy-enroll-cta');

    expect(strategyGridSection).toBeTruthy();
    expect(strategyEnrollSection).toBeTruthy();
    expect(within(strategyGridSection).queryByRole('link', { name: 'Enroll now' })).toBeNull();
    expect(within(strategyEnrollSection).getByRole('link', { name: 'Enroll now' }).getAttribute('href')).toBe('/services/retirement/403b/403b-individual-enrollment');
  });

  it('reveals an external inline CTA shell from a single centered charitable trusts trigger while keeping the later form visible', async () => {
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
