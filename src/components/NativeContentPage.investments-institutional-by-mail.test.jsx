import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

let mockPageHierarchy = {};
let mockBlocksByPath = {};
let mockDocuments = [];

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
    getVisibleJobs: () => [],
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

vi.mock('../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      blocksByPath: mockBlocksByPath,
      pageHierarchy: mockPageHierarchy,
      resolveManagedPathFromRef: (pathRef, fallback = '') => pathRef || fallback,
    }),
  };
});

function renderInvestByMailPage() {
  return render(
    <MemoryRouter>
      <NativeContentPage
        page={{
          path: '/services/investments/invest-by-mail',
          title: 'Open an Investment by Mail',
        }}
      />
    </MemoryRouter>,
  );
}

function selectState(value) {
  fireEvent.change(screen.getByLabelText('Select your state'), { target: { value } });
}

function continueEligibility() {
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}

function unlockDownloadStep() {
  const reviewSection = screen.getByText('Review Terms of Offering').closest('section');
  fireEvent.click(within(reviewSection).getByRole('link', { name: 'Offering Circular' }));
  fireEvent.click(within(reviewSection).getByRole('checkbox'));
  fireEvent.click(within(reviewSection).getByRole('button', { name: 'Continue' }));
}

function openMailingStep() {
  unlockDownloadStep();
  const downloadSection = screen.getByText('Download and Complete the Investment Form').closest('section');
  fireEvent.click(within(downloadSection).getByRole('button', { name: 'Continue' }));
}

describe('NativeContentPage institutional investment by mail flow', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    mockBlocksByPath = {
      '/services/investments/invest-by-mail': contentBlockBlueprintsByPath['/services/investments/invest-by-mail'],
    };
    mockPageHierarchy = {
      '/services/investments': {
        path: '/services/investments',
        title: 'Investments',
        section: 'Services',
      },
      '/services/investments/invest-by-mail': {
        path: '/services/investments/invest-by-mail',
        title: 'Open an Investment by Mail',
        section: 'Services',
      },
    };
    mockDocuments = [
      {
        id: 'document-investments-aglf-offering-circular',
        title: 'AGLF Offering Circular',
        url: 'https://managed.example.com/offering-circular.pdf',
        external: true,
      },
      {
        id: 'document-investments-institutional-investment-form',
        title: 'AGFinancial Investment Form',
        url: 'https://managed.example.com/institutional-investment-form.pdf',
        external: true,
      },
    ];
  });

  it('blocks Ohio and hides the download steps', () => {
    renderInvestByMailPage();

    selectState('OH');

    expect(screen.getByText('This offering is currently not available for Ohio residents.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Investments' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Offering Circular' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Download Form' })).toBeNull();
  });

  it('renders the route through managed hero and intro blocks without a page-content block', () => {
    const { container } = renderInvestByMailPage();

    const heroSection = container.querySelector('[data-block-id="hero"]');
    const introSection = container.querySelector('[data-block-id="intro"]');

    expect(heroSection).toBeTruthy();
    expect(heroSection?.textContent).toContain('Institutional Investments');
    expect(introSection).toBeTruthy();
    expect(introSection?.textContent).toContain('Open an Investment by Mail');
    expect(container.querySelector('[data-block-id="mail_flow"]')).toBeTruthy();
    expect(container.querySelector('.investments-mail-native-shell.native-dynamic-page-content')).toBeTruthy();
    expect(container.querySelector('[data-block-id="page_content"]')).toBeNull();
  });

  it('blocks Washington new investors', () => {
    renderInvestByMailPage();

    selectState('WA');
    fireEvent.click(screen.getByLabelText('No'));

    expect(screen.getByText('AGFinancial investments are not available to new investors in Washington.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Offering Circular' })).toBeNull();
  });

  it('lets Washington existing investors continue with the limited-class acknowledgment', () => {
    renderInvestByMailPage();

    selectState('WA');
    fireEvent.click(screen.getByLabelText('Yes'));
    continueEligibility();

    expect(screen.getByText(/I have received and agree with the terms of this Offering Circular and state that I am qualified to invest/i)).toBeTruthy();
    unlockDownloadStep();
    expect(screen.getByRole('link', { name: 'Download Form' })).toBeTruthy();
  });

  it('shows the standard acknowledgment for standard states', () => {
    renderInvestByMailPage();

    selectState('TX');
    continueEligibility();

    expect(screen.getByText('I have received and agree with the terms of this Offering Circular.')).toBeTruthy();
  });

  it('shows the qualified-investor acknowledgment for limited-class states', () => {
    renderInvestByMailPage();

    selectState('AL');
    continueEligibility();

    expect(screen.getByText(/I have received and agree with the terms of this Offering Circular and state that I am qualified to invest/i)).toBeTruthy();
  });

  it('uses configured managed-document URLs for both download buttons', () => {
    mockDocuments = [
      {
        id: 'document-investments-aglf-offering-circular',
        title: 'AGLF Offering Circular',
        url: 'https://managed.example.com/offering-circular-managed.pdf?ref=123',
        external: true,
      },
      {
        id: 'document-investments-institutional-investment-form',
        title: 'AGFinancial Investment Form',
        url: 'https://managed.example.com/institutional-investment-form-managed.pdf?ref=456',
        external: true,
      },
    ];

    renderInvestByMailPage();

    selectState('TX');
    continueEligibility();

    const offeringLink = screen.getByRole('link', { name: 'Offering Circular' });
    expect(offeringLink.getAttribute('href')).toBe('https://managed.example.com/offering-circular-managed.pdf?ref=123');
    expect(offeringLink.getAttribute('href')).not.toContain('files.agfinancial.org/Investments');

    unlockDownloadStep();

    const formLink = screen.getByRole('link', { name: 'Download Form' });
    expect(formLink.getAttribute('href')).toBe('https://managed.example.com/institutional-investment-form-managed.pdf?ref=456');
    expect(formLink.getAttribute('href')).not.toContain('files.agfinancial.org/Investments');
  });

  it('shows the exact mailing address block and reminder copy', () => {
    const { container } = renderInvestByMailPage();

    selectState('TX');
    continueEligibility();
    openMailingStep();

    expect(screen.getByText('Mail all forms and paperwork to:')).toBeTruthy();
    const address = container.querySelector('.invest-mail-address');
    expect(address?.textContent?.replace(/\s+/g, '')).toBe('AGFinancialInvestments3900SOverlandAveSpringfield,MO65807');
    expect(screen.getByText('If you are establishing a new account, don’t forget to include your two forms of identification.')).toBeTruthy();
  });
});
