import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NativeContentPage from './NativeContentPage';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { serializeLinkValue } from '../lib/linkValue';

void [MemoryRouter, NativeContentPage];

let mockFrontHudEnabled = false;
const mockSaveSharedDraftNow = vi.fn();
const mockUpdateBlock = vi.fn();
const mockMoveBlock = vi.fn();
const mockRemoveBlock = vi.fn();
let mockBlocksByPath = {};
let mockPageHierarchy = {};
let mockResolveDocumentLink = () => '';
let mockMobileFrontHud = false;

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
    resolveDocumentLink: mockResolveDocumentLink,
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
    enabled: mockFrontHudEnabled,
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
      updateBlockSetting: vi.fn(),
      updateBlock: mockUpdateBlock,
      moveBlock: mockMoveBlock,
      removeBlock: mockRemoveBlock,
      setActiveBlockLock: vi.fn(() => ({ ok: true })),
      getBlockCollaboration: vi.fn(() => ({})),
      isPageDirty: (pathname) => pathname === '/services/insurance/ministers-group-life-plan',
      getPageChangeSummary: () => ({
        changedBlockCount: 2,
        hasOrderChanges: false,
        hasPageMetaChanges: false,
      }),
      getPageWorkflowActivity: (pathname) => ({
        hasCurrentActorDraft: pathname === '/services/insurance/ministers-group-life-plan',
        hasOtherActorDraft: false,
      }),
      lastSharedSaveResult: {
        changedPaths: ['/services/insurance/ministers-group-life-plan'],
        savedBlockIdsByPath: {
          '/services/insurance/ministers-group-life-plan': ['hero'],
        },
        blockedBlocks: [],
        updatedAt: Date.now() - 120_000,
      },
      saveSharedDraftNow: mockSaveSharedDraftNow,
      devIdentity: {
        userId: 'dev-taylor',
        displayName: 'Taylor QA',
      },
    }),
  };
});

describe('NativeContentPage HUD visibility boundaries', () => {
  beforeEach(() => {
    mockFrontHudEnabled = false;
    mockMobileFrontHud = false;
    mockSaveSharedDraftNow.mockReset();
    mockSaveSharedDraftNow.mockResolvedValue({ ok: true });
    mockUpdateBlock.mockReset();
    mockMoveBlock.mockReset();
    mockRemoveBlock.mockReset();
    mockResolveDocumentLink = () => '';
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 760px)' ? mockMobileFrontHud : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: query,
      onchange: null,
    }));
    mockBlocksByPath = {
      '/services/insurance/ministers-group-life-plan': [
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'dynamic',
          hidden: false,
          settings: {
            animationPreset: 'default',
            bgTone: 'white',
            justify: 'center',
            line1Text: 'AG Ministry',
            line1ClassName: 'line1',
            line1HighlightsJson: '[{"text":"AG Ministry","className":"is-mango"}]',
            line2Text: 'Group Life',
            line2ClassName: 'line2',
            line2HighlightsJson: '',
            line3Text: '',
            line3ClassName: 'line3',
            line3HighlightsJson: '',
          },
          editableFields: [],
        },
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'static',
          hidden: true,
          settings: {},
          editableFields: [],
        },
        {
          id: 'page_content',
          name: 'Page Content',
          kind: 'content',
          mode: 'dynamic',
          hidden: false,
          settings: {
            html: '<p>Body copy</p>',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/about-us/impact': {
        path: '/about-us/impact',
        title: 'Impact',
        breadcrumbLabel: 'Impact',
        parentPath: '/about-us',
      },
      '/services/insurance/ministers-group-life-plan': {
        path: '/services/insurance/ministers-group-life-plan',
        title: 'Ministers Group Life Plan',
        breadcrumbLabel: 'Ministers Group Life Plan',
        parentPath: '/services/insurance',
      },
      '/test': {
        path: '/test',
        title: 'Test',
        breadcrumbLabel: 'Test',
        parentPath: '/',
      },
      '/services/test-cta-hud': {
        path: '/services/test-cta-hud',
        title: 'Test CTA HUD',
        breadcrumbLabel: 'Test CTA HUD',
        parentPath: '/services',
      },
      '/services/retirement/403b': {
        path: '/services/retirement/403b',
        title: '403(b)',
        breadcrumbLabel: '403(b)',
        parentPath: '/services/retirement',
      },
    };
  });

  it('keeps the ministers group life hero visible when HUD is off and a static stub is hidden', () => {
    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'AG Ministry' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Group Life' })).toBeTruthy();
    expect(screen.queryByLabelText('Front HUD editor panels')).toBeNull();
    expect(screen.queryByLabelText('Open in admin content editor (new window)')).toBeNull();
  });

  it('does not emit native hero drift warnings or fallback hero content for block-only pages without a hero block', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockBlocksByPath = {
      '/services/planned-giving': [],
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

    expect(screen.queryByRole('heading', { name: 'Planned Giving' })).toBeNull();
    expect(document.querySelector('.service-native-hero')).toBeNull();
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Native hero drift detected'));

    warnSpy.mockRestore();
  });

  it('keeps the ministers group life hero visible when HUD is on while showing HUD chrome only then', () => {
    mockFrontHudEnabled = true;

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'AG Ministry' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Group Life' })).toBeTruthy();
    expect(screen.getByLabelText('Front HUD editor panels')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Hero HUD panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Page Content HUD panel' })).toBeTruthy();
    expect(screen.queryByLabelText('Hero mobile HUD actions')).toBeNull();
  });

  it('shows hero and intro HUD controls on the managed planned giving overview page', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/planned-giving': (contentBlockBlueprintsByPath['/services/planned-giving'] || [])
        .filter((block) => block?.mode === 'dynamic'),
    };
    mockPageHierarchy = {
      '/services/planned-giving': {
        path: '/services/planned-giving',
        title: 'Planned Giving',
        breadcrumbLabel: 'Planned Giving',
        parentPath: '/services',
      },
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

    expect(screen.getByRole('heading', { name: /Generous.*giving\./i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit intro heading' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Hero HUD panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Intro HUD panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Card Grid · Flexible cards HUD panel' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Open Billboard HUD panel' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Open Page Content HUD panel' })).toHaveLength(2);
  });

  it('switches mobile HUD to selection mode without rendering the desktop dock chrome', () => {
    mockFrontHudEnabled = true;
    mockMobileFrontHud = true;

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Front HUD editor panels')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Hero HUD panel' })).toBeNull();
    expect(screen.queryByLabelText('Hero mobile HUD actions')).toBeNull();

    fireEvent.click(container.querySelector('[data-block-id="hero"]'));

    expect(screen.getByLabelText('Hero mobile HUD actions')).toBeTruthy();
    expect(container.querySelector('[data-block-id="hero"]')?.getAttribute('data-mobile-front-hud-selected')).toBe('true');
    expect(container.querySelector('[data-block-id="page_content"]')?.getAttribute('data-mobile-front-hud-selected')).not.toBe('true');

    fireEvent.click(container.querySelector('[data-block-id="page_content"]'));

    expect(screen.getByLabelText('Page Content mobile HUD actions')).toBeTruthy();
    expect(container.querySelector('[data-block-id="page_content"]')?.getAttribute('data-mobile-front-hud-selected')).toBe('true');
    expect(container.querySelector('[data-block-id="hero"]')?.getAttribute('data-mobile-front-hud-selected')).not.toBe('true');
  });

  it('selects a mobile HUD block from visible linked content instead of requiring incidental blank space taps', () => {
    mockFrontHudEnabled = true;
    mockMobileFrontHud = true;
    mockBlocksByPath = {
      '/services/insurance/ministers-group-life-plan': [
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'dynamic',
          hidden: true,
          settings: {
            animationPreset: 'default',
            bgTone: 'white',
            justify: 'center',
            line1Text: 'AG Ministry',
            line1ClassName: 'line1',
            line1HighlightsJson: '',
            line2Text: 'Group Life',
            line2ClassName: 'line2',
            line2HighlightsJson: '',
          },
          editableFields: [],
        },
        {
          id: 'page_content',
          name: 'Page Content',
          kind: 'content',
          mode: 'dynamic',
          hidden: false,
          settings: {
            html: '<p><a href="/contact">Talk now</a></p>',
          },
          editableFields: [],
        },
      ],
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Talk now' }));

    expect(screen.getByLabelText('Page Content mobile HUD actions')).toBeTruthy();
    expect(container.querySelector('[data-block-id="page_content"]')?.getAttribute('data-mobile-front-hud-selected')).toBe('true');
  });

  it('keeps the mobile sheet close control in the sheet header and dismisses the current selection when closed', async () => {
    mockFrontHudEnabled = true;
    mockMobileFrontHud = true;

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(container.querySelector('[data-block-id="hero"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    expect(closeButton.textContent).toBe('Close');
    expect(closeButton.closest('[data-mobile-front-hud-sheet-header="true"]')).toBeTruthy();

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Hero mobile HUD actions')).toBeNull();
    });
    expect(container.querySelector('[data-block-id="hero"]')?.getAttribute('data-mobile-front-hud-selected')).not.toBe('true');
  });

  it('routes mobile tray actions into the existing block handlers and editor panel flow', async () => {
    mockFrontHudEnabled = true;
    mockMobileFrontHud = true;

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(container.querySelector('[data-block-id="hero"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    fireEvent.click(container.querySelector('[data-block-id="page_content"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Move Page Content up' }));
    expect(mockMoveBlock).toHaveBeenCalledWith('/services/insurance/ministers-group-life-plan', 'page_content', 'up');

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide block' }));
    expect(mockUpdateBlock).toHaveBeenCalledWith('/services/insurance/ministers-group-life-plan', 'page_content', { hidden: true });

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete block' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(mockRemoveBlock).toHaveBeenCalledWith('/services/insurance/ministers-group-life-plan', 'page_content');

    await waitFor(() => {
      expect(screen.queryByLabelText('Page Content mobile HUD actions')).toBeNull();
    });
  });

  it('keeps hidden impact hero and intro blocks out of the HUD while showing block-owned sections', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/about-us/impact': [
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'dynamic',
          hidden: true,
          settings: {
            animationPreset: 'default',
            bgTone: 'white',
            justify: 'center',
            line1Text: 'We’re making',
            line1ClassName: 'line1',
            line1HighlightsJson: '',
            line2Text: 'a difference… thanks to you.',
            line2ClassName: 'line2',
            line2HighlightsJson: '[{"text":"difference","className":"is-mango"},{"text":"you","className":"is-atlantean"}]',
          },
          editableFields: [],
        },
        {
          id: 'hero',
          name: 'Hero',
          kind: 'hero',
          mode: 'static',
          hidden: true,
          settings: {},
          editableFields: [],
        },
        {
          id: 'intro',
          name: 'Intro',
          kind: 'intro',
          mode: 'dynamic',
          hidden: true,
          settings: {
            heading: 'Put your money where your faith is.',
            bodyHtml: '<p>AGFinancial was created to support churches and ministries, ministers, and individuals by improving financial health and growing the Kingdom of God. As a client, you become part of that vision. We’re ministry allies.</p>',
            extraLine: 'It’s our privilege to serve you, **alongside** you.',
            bgTone: 'sand',
            textTone: 'dark',
          },
          editableFields: [],
        },
        {
          id: 'intro',
          name: 'Intro',
          kind: 'intro',
          mode: 'static',
          hidden: true,
          settings: {},
          editableFields: [],
        },
        {
          id: 'billboard',
          name: 'Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'We’re making',
            subtitle: 'a difference… thanks to you.',
            body: '',
            bgTone: 'white',
            textTone: 'dark',
            justify: 'center',
          },
          editableFields: [],
        },
        {
          id: 'impact_proof_story',
          name: 'Site Feature · Impact proof story',
          kind: 'site_feature',
          mode: 'dynamic',
          hidden: false,
          settings: {
            featureId: 'impact_proof_story',
            sectionClassName: 'impact-native-stats impact-proof-story',
            featureIntroJson: JSON.stringify({
              heading: 'Serving you, alongside you.',
              body: 'AGFinancial was created to support churches and ministries, ministers, and individuals by improving financial health while growing God’s kingdom. As a client, you become part of that vision.',
              emphasis: 'We’re ministry allies.',
            }),
          },
          editableFields: [],
        },
      ],
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/about-us/impact',
            title: 'Impact',
          }}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.service-native-hero')).toBeNull();
    expect(container.querySelector('.service-native-intro')).toBeNull();
    expect(screen.queryByText('Put your money where your faith is.')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Serving you, alongside you.' })).toBeTruthy();
    expect(screen.getByText(/improving financial health while growing God’s kingdom/i)).toBeTruthy();
    expect(screen.getByText('We’re ministry allies.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'We’re making' })).toBeTruthy();
    expect(screen.getByText('a difference… thanks to you.')).toBeTruthy();
    expect(screen.queryByText('Let’s make them together.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Hero HUD panel' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Intro HUD panel' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Billboard HUD panel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Site Feature · Impact proof story HUD panel' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open Page Content HUD panel' })).toBeNull();
  });

  it('shows the request-form HUD control on the managed endowments request section', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/planned-giving/endowments': [
        {
          id: 'request_form',
          name: 'Endowment Request Form',
          kind: 'request_form',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Begin the Endowment sign up process',
            titleClassName: '',
            titleHighlightsJson: '',
            subtitle: '',
            bodyHtml: '',
            body: '',
            bgTone: 'grey',
            textTone: 'white',
            spaceBeforeRem: 2.6,
            spaceAfterRem: 2.8,
            submitLabel: 'Submit',
            successMessage: 'Thanks. We received your request and will follow up soon.',
            salesforceUrl: '',
            sectionClassName: 'legacy-child-native-endowments-legacy-form',
            step1Title: '',
            step1Note: '',
            step1Alert: '',
            step1FieldsJson: JSON.stringify([
              { id: 'firstName', label: 'First Name*', type: 'text', required: true },
              { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
              { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              { id: 'email', label: 'Email*', type: 'email', required: true },
            ]),
            step2Title: '',
            step2Note: '',
            step2Alert: '',
            step2FieldsJson: '[]',
            step3Title: '',
            step3Note: '',
            step3Alert: '',
            step3FieldsJson: '[]',
            step4Title: '',
            step4Note: '',
            step4Alert: '',
            step4FieldsJson: '[]',
            step5Title: '',
            step5Note: '',
            step5Alert: '',
            step5FieldsJson: '[]',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/planned-giving/endowments': {
        path: '/services/planned-giving/endowments',
        title: 'Endowments',
        breadcrumbLabel: 'Endowments',
        parentPath: '/services/planned-giving',
      },
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

    const requestHeading = screen.getByRole('heading', { name: 'Begin the Endowment sign up process' });
    const requestSection = requestHeading.closest('section');

    expect(requestSection).toBeTruthy();
    expect(requestSection?.className).toContain('legacy-child-native-endowments-legacy-form');
    expect(requestSection?.className).toContain('native-dynamic-request');
    expect(requestSection?.className).toContain('has-managed-request-shell');
    expect(requestSection?.querySelectorAll('.dynamic-request-layout')).toHaveLength(1);
    expect(requestSection?.querySelector('.native-info-section-copy.dynamic-request-copy')).toBeTruthy();
    expect(requestSection?.querySelector(':scope > .ag-panel-rail > .native-info-section-copy:not(.dynamic-request-copy)')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Request Form HUD panel' })).toBeTruthy();
    expect(screen.queryByText('Contact details')).toBeNull();
  });

  it('shows the request-form HUD control on the managed generosity-fund request section', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/planned-giving/generosity-fund': [
        {
          id: 'request_form',
          name: 'Generosity Request Form',
          kind: 'request_form',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Make the most of your giving.',
            titleClassName: 'is-atlantean',
            titleHighlightsJson: '[{"text":"most","className":"is-white"}]',
            subtitle: '',
            bodyHtml: '',
            body: '',
            bgTone: 'grey',
            textTone: 'white',
            spaceBeforeRem: 2.6,
            spaceAfterRem: 2.8,
            submitLabel: 'Submit',
            successMessage: 'Thanks. We received your request and will follow up soon.',
            salesforceUrl: '',
            sectionClassName: 'legacy-child-native-generosity-request',
            step1Title: '',
            step1Note: '',
            step1Alert: '',
            step1FieldsJson: JSON.stringify([
              { id: 'firstName', label: 'First Name*', type: 'text', required: true },
              { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
              { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              { id: 'email', label: 'Email*', type: 'email', required: true },
            ]),
            step2Title: '',
            step2Note: '',
            step2Alert: '',
            step2FieldsJson: '[]',
            step3Title: '',
            step3Note: '',
            step3Alert: '',
            step3FieldsJson: '[]',
            step4Title: '',
            step4Note: '',
            step4Alert: '',
            step4FieldsJson: '[]',
            step5Title: '',
            step5Note: '',
            step5Alert: '',
            step5FieldsJson: '[]',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/planned-giving/generosity-fund': {
        path: '/services/planned-giving/generosity-fund',
        title: 'Generosity Fund',
        breadcrumbLabel: 'Generosity Fund',
        parentPath: '/services/planned-giving',
      },
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

    const requestSection = document.querySelector(
      'section[data-block-id="request_form"].legacy-child-native-generosity-request.native-dynamic-request',
    );

    expect(requestSection).toBeTruthy();
    expect(requestSection?.className).toContain('legacy-child-native-generosity-request');
    expect(requestSection?.className).toContain('native-dynamic-request');
    expect(requestSection?.className).toContain('has-managed-request-shell');
    expect(within(requestSection).getByRole('heading', { name: /Make the most of your giving\./ })).toBeTruthy();
    expect(requestSection?.querySelectorAll('.dynamic-request-layout')).toHaveLength(1);
    expect(requestSection?.querySelector('.native-info-section-copy.dynamic-request-copy')).toBeTruthy();
    expect(requestSection?.querySelector(':scope > .ag-panel-rail > .native-info-section-copy:not(.dynamic-request-copy)')).toBeNull();
    expect(screen.getByRole('button', { name: 'Request Form' })).toBeTruthy();
  });

  it('shows the request-form HUD control on the managed charitable-gift-annuities request section', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/planned-giving/charitable-gift-annuities': [
        {
          id: 'request_form',
          name: 'Charitable Gift Annuities Request Form',
          kind: 'request_form',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Your gifts are more powerful than you think.',
            titleClassName: '',
            titleHighlightsJson: '[{"text":"powerful","className":"is-mango"}]',
            subtitle: '',
            bodyHtml: '',
            body: 'When you’re ready for tax deductions, fixed payments, and attractive rates—all while supporting ministry—we’re ready to walk you through the setup process.',
            bgTone: 'grey',
            textTone: 'white',
            spaceBeforeRem: 1.6,
            spaceAfterRem: 1.6,
            submitLabel: 'Submit',
            successMessage: 'Thanks. We received your request.',
            salesforceUrl: '',
            sectionClassName: 'legacy-child-native-cga-request',
            step1Title: '',
            step1Note: '',
            step1Alert: '',
            step1FieldsJson: JSON.stringify([
              { id: 'firstName', label: 'First Name*', type: 'text', required: true },
              { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
              { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              { id: 'email', label: 'Email*', type: 'email', required: true },
            ]),
            step2Title: '',
            step2Note: '',
            step2Alert: '',
            step2FieldsJson: '[]',
            step3Title: '',
            step3Note: '',
            step3Alert: '',
            step3FieldsJson: '[]',
            step4Title: '',
            step4Note: '',
            step4Alert: '',
            step4FieldsJson: '[]',
            step5Title: '',
            step5Note: '',
            step5Alert: '',
            step5FieldsJson: '[]',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/planned-giving/charitable-gift-annuities': {
        path: '/services/planned-giving/charitable-gift-annuities',
        title: 'Charitable Gift Annuities',
        breadcrumbLabel: 'Charitable Gift Annuities',
        parentPath: '/services/planned-giving',
      },
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

    const requestHeading = screen.getByRole('heading', { name: /Your gifts are more powerful than you think\./ });
    const requestSection = requestHeading.closest('section');

    expect(requestSection).toBeTruthy();
    expect(requestSection?.className).toContain('legacy-child-native-cga-request');
    expect(requestSection?.className).toContain('native-dynamic-request');
    expect(requestSection?.className).toContain('has-managed-request-shell');
    expect(requestSection?.querySelectorAll('.dynamic-request-layout')).toHaveLength(1);
    expect(requestSection?.querySelector('.native-info-section-copy.dynamic-request-copy')).toBeTruthy();
    expect(requestSection?.querySelector(':scope > .ag-panel-rail > .native-info-section-copy:not(.dynamic-request-copy)')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Request Form HUD panel' })).toBeTruthy();
  });

  it('shows the request-form HUD control on the managed ministry-impact-fund request section', () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/planned-giving/ministry-impact-fund': [
        {
          id: 'request_form',
          name: 'Ministry Impact Fund Request Form',
          kind: 'request_form',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'A legacy of giving.',
            titleClassName: '',
            titleHighlightsJson: '[{"text":"legacy","className":"is-white"}]',
            subtitle: '',
            bodyHtml: '',
            body: 'We’re ready to help you explore how your gift can continue to give. And give. And give…',
            bgTone: 'grey',
            textTone: 'white',
            spaceBeforeRem: 1.6,
            spaceAfterRem: 1.6,
            submitLabel: 'Contact planned giving',
            successMessage: 'Thanks. We received your request.',
            salesforceUrl: '',
            sectionClassName: 'legacy-child-native-request',
            step1Title: '',
            step1Note: '',
            step1Alert: '',
            step1FieldsJson: JSON.stringify([
              { id: 'firstName', label: 'First Name*', type: 'text', required: true },
              { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
              { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              { id: 'email', label: 'Email*', type: 'email', required: true },
            ]),
            step2Title: '',
            step2Note: '',
            step2Alert: '',
            step2FieldsJson: '[]',
            step3Title: '',
            step3Note: '',
            step3Alert: '',
            step3FieldsJson: '[]',
            step4Title: '',
            step4Note: '',
            step4Alert: '',
            step4FieldsJson: '[]',
            step5Title: '',
            step5Note: '',
            step5Alert: '',
            step5FieldsJson: '[]',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/planned-giving/ministry-impact-fund': {
        path: '/services/planned-giving/ministry-impact-fund',
        title: 'Ministry Impact Fund',
        breadcrumbLabel: 'Ministry Impact Fund',
        parentPath: '/services/planned-giving',
      },
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

    const requestHeading = screen.getByRole('heading', { name: /A legacy of giving\./ });
    const requestSection = requestHeading.closest('section');

    expect(requestSection).toBeTruthy();
    expect(requestSection?.className).toContain('legacy-child-native-request');
    expect(requestSection?.className).toContain('native-dynamic-request');
    expect(requestSection?.className).toContain('has-managed-request-shell');
    expect(requestSection?.querySelectorAll('.dynamic-request-layout')).toHaveLength(1);
    expect(requestSection?.querySelector('.native-info-section-copy.dynamic-request-copy')).toBeTruthy();
    expect(requestSection?.querySelector(':scope > .ag-panel-rail > .native-info-section-copy:not(.dynamic-request-copy)')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Request Form HUD panel' })).toBeTruthy();
  });

  it('updates the live CTA section background when CTA HUD background swatches are clicked', async () => {
    mockFrontHudEnabled = true;
    mockBlocksByPath = {
      '/services/test-cta-hud': [
        {
          id: 'cta_form',
          name: 'CTA Form',
          kind: 'cta_form',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Tell us how to reach you.',
            bodyHtml: '<p>We will follow up soon.</p>',
            bgTone: 'white',
            submitLabel: 'Follow up with me',
            fieldsJson: JSON.stringify([
              { id: 'full_name', label: 'Full name', type: 'text', required: true },
            ]),
          },
          editableFields: [],
        },
      ],
    };

    const { container } = render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/test-cta-hud',
            title: 'Test CTA HUD',
          }}
        />
      </MemoryRouter>,
    );

    const ctaSection = container.querySelector('[data-block-id="cta_form"]');
    expect(ctaSection?.className).toContain('is-bg-white');

    fireEvent.click(screen.getByRole('button', { name: 'Open CTA Form HUD panel' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'CTA background' })).getByRole('radio', { name: 'Blue' }));

    await waitFor(() => {
      expect(ctaSection?.className).toContain('is-bg-blue');
    });
    expect(container.querySelector('.admin-cta-hud-heading-preview.is-bg-blue')).toBeTruthy();
  });

  it('shows the billboard HUD control on the managed generosity-fund outro billboard section', () => {
    mockFrontHudEnabled = true;
    mockResolveDocumentLink = (documentId) => (
      documentId === 'document-planned-giving-terms-and-conditions'
        ? {
            id: documentId,
            title: 'Terms and Conditions',
            url: '/documents/planned-giving-terms-and-conditions.pdf',
            external: false,
          }
        : null
    );
    mockBlocksByPath = {
      '/services/planned-giving/generosity-fund': [
        {
          id: 'joyful_giving_billboard',
          name: 'Joyful Giving Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Simple, joyful giving.',
            titleClassName: '',
            titleHighlightsJson: '',
            subtitle: 'Powered by your generosity.',
            bodyHtml: '',
            body: '',
            bgTone: 'white',
            textTone: 'dark',
            justify: 'center',
            lineSpacing: 1,
            buttonLabel: 'Open a Generosity Fund®',
            buttonLinkJson: serializeLinkValue({
              kind: 'external',
              href: 'https://secure.agfinancial.org/generosityfund/signup',
            }),
            buttonStyle: 'solid',
            buttonTone: 'atlantean',
            button2Label: 'Terms and Conditions',
            button2DocumentId: 'document-planned-giving-terms-and-conditions',
            button2Style: 'outline',
            button2Tone: 'super-grey',
            sectionClassName: 'legacy-child-native-generosity-outro',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/planned-giving/generosity-fund': {
        path: '/services/planned-giving/generosity-fund',
        title: 'Generosity Fund',
        breadcrumbLabel: 'Generosity Fund',
        parentPath: '/services/planned-giving',
      },
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

    const billboardHeading = screen.getByRole('heading', { name: /Simple, joyful giving\./ });
    const billboardSection = billboardHeading.closest('section');

    expect(billboardSection).toBeTruthy();
    expect(billboardSection?.className).toContain('legacy-child-native-generosity-outro');
    expect(billboardSection?.className).toContain('dynamic-billboard');
    expect(screen.getByRole('button', { name: 'Billboard' })).toBeTruthy();
    expect(within(billboardSection).getByRole('link', { name: 'Terms and Conditions' })).toBeTruthy();
  });

  it('renders block-only IRA billboards once with their standalone section classes', () => {
    mockBlocksByPath = {
      '/services/retirement/iras': [
        {
          id: 'rollover_billboard',
          name: 'Already Have IRA Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Already have an IRA? Simplify.',
            titleHighlightsJson: '[{"text":"Simplify.","className":"is-melon"}]',
            subtitle: '',
            bodyHtml: '<p>Rolling over your other retirement savings into a single AGFinancial IRA is surprisingly simple and undeniably smart. One account. One login.</p>',
            bgTone: 'grey',
            textTone: 'white',
            justify: 'center',
            buttonLabel: 'Let’s simplify things',
            buttonLinkJson: serializeLinkValue({
              kind: 'internal',
              to: '/services/retirement/rollovers',
            }),
            sectionClassName: 'retirement-child-native-rollover',
          },
          editableFields: [],
        },
        {
          id: 'daily_billboard',
          name: 'Retire Every Day Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Retire a little every day.',
            titleHighlightsJson: '[{"text":"every day","className":"is-mango"}]',
            subtitle: 'Starting now.',
            bodyHtml: '',
            bgTone: 'white',
            textTone: 'dark',
            justify: 'center',
            buttonLabel: 'Reach my consultant',
            buttonLinkJson: serializeLinkValue({
              kind: 'internal',
              to: '/services/retirement/retirement-consultants',
            }),
            sectionClassName: 'retirement-ira-native-cta',
          },
          editableFields: [],
        },
      ],
    };
    mockPageHierarchy = {
      '/services/retirement/iras': {
        path: '/services/retirement/iras',
        title: 'IRAs',
        breadcrumbLabel: 'IRAs',
        parentPath: '/services/retirement',
      },
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

    const retireHeadings = screen.getAllByRole('heading', { name: /Retire a little.*every day\./ });
    const rolloverHeadings = screen.getAllByRole('heading', { name: /Already have an IRA\?.*Simplify\./ });

    expect(retireHeadings).toHaveLength(1);
    expect(rolloverHeadings).toHaveLength(1);
    expect(retireHeadings[0]?.closest('section')?.className).toContain('retirement-ira-native-cta');
    expect(retireHeadings[0]?.closest('section')?.className).toContain('dynamic-billboard');
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('retirement-child-native-rollover');
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('dynamic-billboard');
  });

  it('renders the block-only 403(b) rollover billboard with standalone shell classes', () => {
    mockBlocksByPath = {
      '/services/retirement/403b': [
        {
          id: 'rollover_billboard',
          name: 'Rollover Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'A rollover is easy. Smart, too.',
            titleHighlightsJson: '[{"text":"Smart, too.","className":"is-melon"}]',
            subtitle: '',
            bodyHtml: '<p>Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple...and undeniably smart. One account. One login.</p>',
            bgTone: 'grey',
            textTone: 'white',
            justify: 'center',
            buttonLabel: 'Start a rollover',
            buttonLinkJson: serializeLinkValue({
              kind: 'internal',
              to: '/services/retirement/rollovers',
            }),
            sectionClassName: 'retirement-child-native-rollover retirement-403b-native-rollover retirement-everyday retirement-rollover-billboard',
          },
          editableFields: [],
        },
      ],
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

    const rolloverHeadings = screen.getAllByRole('heading', { name: /A rollover is easy\..*Smart, too\./ });

    expect(rolloverHeadings).toHaveLength(1);
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('retirement-child-native-rollover');
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('dynamic-billboard');
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('retirement-rollover-billboard');
    expect(rolloverHeadings[0]?.closest('section')?.className).toContain('retirement-everyday');
  });

  it('lets HUD users save draft from the page workflow strip', async () => {
    mockFrontHudEnabled = true;

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/services/insurance/ministers-group-life-plan',
            title: 'Ministers Group Life Plan',
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(mockSaveSharedDraftNow).toHaveBeenCalledWith('');
    });
  });

  it('applies billboard width overrides and extra bottom spacing when a billboard action is present', () => {
    mockBlocksByPath = {
      '/test': [
        {
          id: 'billboard',
          name: 'Billboard',
          kind: 'billboard',
          mode: 'dynamic',
          hidden: false,
          settings: {
            title: 'Need more room?',
            bodyHtml: '<p>Shared billboard body.</p>',
            bgTone: 'blue',
            textTone: 'white',
            justify: 'center',
            contentMaxWidthPx: 1100,
            buttonLabel: 'Learn more',
            buttonLinkJson: serializeLinkValue({
              kind: 'internal',
              to: '/contact-us',
            }),
          },
          editableFields: [],
        },
      ],
    };

    render(
      <MemoryRouter>
        <NativeContentPage
          page={{
            path: '/test',
            title: 'Test',
          }}
        />
      </MemoryRouter>,
    );

    const billboardHeading = screen.getByRole('heading', { name: 'Need more room?' });
    const billboardSection = billboardHeading.closest('section');
    const billboardRail = billboardSection?.querySelector('.ag-panel-rail');

    expect(billboardSection?.getAttribute('style') || '').toContain('--dynamic-billboard-padding-bottom: clamp(4.1rem, 8vw, 6.8rem)');
    expect(billboardRail?.getAttribute('style') || '').toContain('--dynamic-billboard-max-width: 1100px');
  });
});
