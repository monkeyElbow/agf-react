import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ServicesPage from './ServicesPage';
import { DEFAULT_SERVICE_HERO_PIE_SLICES } from '../lib/dynamicPageBlocks';

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../hooks/useHudDockOrder', () => ({
  default: () => ({
    orderedPanels: [],
    getDockTabDragProps: () => ({}),
    isPanelDragging: () => false,
    isPanelDragOver: () => false,
    getPanelDropPosition: () => '',
    isDockDragging: false,
  }),
}));

vi.mock('../hooks/useLocalBlockDrafts', () => ({
  default: ({ blocks }) => ({
    blocks,
    stageLocalBlockSetting: vi.fn(),
    stageLocalBlockSettings: vi.fn(),
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: false, opacity: 15 }),
}));

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({ testimonials: [] }),
}));

vi.mock('../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../context/ContentAdminContext.jsx');
  const { contentBlockBlueprintsByPath } = await vi.importActual('../data/contentBlockBlueprints.js');
  const servicesBlocks = contentBlockBlueprintsByPath['/services'].map((block) => ({
    ...block,
    settings: { ...(block.settings || {}) },
  }));
  return {
    ...actual,
    useContentAdmin: () => ({
      blocksByPath: {
        '/services': servicesBlocks,
      },
      pageHierarchy: {
        '/services': { path: '/services', title: 'Services', breadcrumbLabel: 'Services', parentPath: '/' },
        ...DEFAULT_SERVICE_HERO_PIE_SLICES.reduce((accumulator, slice) => ({
          ...accumulator,
          [slice.path]: {
            path: slice.path,
            title: slice.title,
            breadcrumbLabel: slice.title,
            parentPath: '/services',
          },
        }), {}),
      },
      setActiveBlockLock: vi.fn(() => ({ ok: true })),
      getBlockCollaboration: vi.fn(() => null),
      devIdentity: null,
      claimBufferedBlockEdit: vi.fn(() => false),
      commitBlockSettingsPatch: vi.fn(() => false),
      registerExternalDraftFlushHandler: vi.fn(),
    }),
  };
});

function renderServicesPage() {
  return render(
    <MemoryRouter>
      <ServicesPage />
    </MemoryRouter>,
  );
}

describe('ServicesPage breakdown directory', () => {
  it('renders the requested breakdown intro, rows, and revised service copy', () => {
    renderServicesPage();

    expect(screen.getByRole('heading', { level: 2, name: 'What would you like to explore?' })).toBeTruthy();
    expect(screen.queryByText('Services breakdown')).toBeNull();

    const expectations = [
      {
        title: 'Loans',
        description: 'The right loan can change everything for your ministry. 100% customized. Every loan, from construction to lines of credit.',
      },
      {
        title: 'Investments',
        description: "It's much more than money. Your funds help churches reach their communities. Growth for you, growth for Kingdom.",
      },
      {
        title: 'Retirement',
        description: 'Plan, contribute, and build for tomorrow. Options include screened investments, IRAs, and our very own MBA Income Fund.',
      },
      {
        title: 'Planned Giving',
        description: 'Legacy planning and charitable giving made easy. Tax savings and income generation options that benefit ministries, donors, and loved ones.',
      },
      {
        title: 'Insurance',
        description: 'Coverage built for churches, ministries and individuals to protect what’s most important.',
      },
    ];

    expectations.forEach(({ title, description }) => {
      const row = document.querySelector(`[data-service-breakdown-row="${title}"]`);
      expect(row).toBeTruthy();
      expect(within(row).getByRole('heading', { level: 3, name: title })).toBeTruthy();
      expect(within(row).getByText(description)).toBeTruthy();
    });
  });

  it('renders the requested service links and removes the old loan inquiry link and search card', () => {
    renderServicesPage();

    const expectedLinks = [
      ['Loan options', '/services/loans'],
      ['Rates', '/services/investments#rates'],
      ['Demand Certificates', '/services/investments#certificates'],
      ['Term Certificates', '/services/investments#certificates'],
      ['403(b)', '/services/retirement/403b'],
      ['IRAs', '/services/retirement/iras'],
      ['409A', '/services/retirement/409a'],
      ['Charitable Gift Annuities', '/services/planned-giving/charitable-gift-annuities'],
      ['Charitable Trusts', '/services/planned-giving/charitable-trusts'],
      ['Donor Advised Fund', '/services/planned-giving/donor-advised-fund'],
      ['Endowments', '/services/planned-giving/endowments'],
      ['Ministry Impact Fund®', '/services/planned-giving/ministry-impact-fund'],
      ['Wills & Estate Services', '/services/planned-giving'],
      ['Property & Casualty', '/services/insurance/property-casualty-insurance'],
      ['Group Life', '/services/insurance/group-term-life-insurance'],
      ['Individual Life', '/services/insurance/life-insurance-quote'],
      ['Mission Assure', '/services/insurance/mission-assure'],
    ];

    expectedLinks.forEach(([label, href]) => {
      expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(href);
    });

    expect(screen.queryByRole('link', { name: 'Inquiry form' })).toBeNull();
    expect(screen.queryByRole('heading', { name: "Let's find what you need." })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Search' })).toBeNull();
  });
});
