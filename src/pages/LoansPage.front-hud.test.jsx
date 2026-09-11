import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

let mockBlocksByPath = {};
let mockPageHierarchy = {};
let mockUpdateBlockSetting = vi.fn();
let mockGetBlockCollaboration = vi.fn();
let mockSetActiveBlockLock = vi.fn();
let mockTestimonials = [];

vi.mock('../context/ContentAdminContextCore', () => ({
  useOptionalContentAdmin: () => null,
  inspectDynamicHeroSettings: () => ({ hasDrift: false, issues: [], normalizedSettings: {} }),
  normalizeDynamicHeroSettings: (_pathname, settings) => settings || {},
  useContentAdmin: () => ({
    blocksByPath: mockBlocksByPath,
    pageHierarchy: mockPageHierarchy,
    updateBlockSetting: mockUpdateBlockSetting,
    getBlockCollaboration: mockGetBlockCollaboration,
    devIdentity: { userId: 'dev-nathan' },
    setActiveBlockLock: mockSetActiveBlockLock,
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: true, opacity: 15 }),
}));

vi.mock('../context/TestimonialsContext', () => ({
  useTestimonials: () => ({
    testimonials: mockTestimonials,
  }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../lib/heroDriftWarnings', () => ({
  logHeroDriftWarningOnce: () => {},
}));

vi.mock('../lib/heroHudMode', () => ({
  shouldRenderHeroInlineEditor: () => false,
}));

import LoansPage from './LoansPage';

void [MemoryRouter, LoansPage];

function cloneLoansDynamicBlocks() {
  return (contentBlockBlueprintsByPath['/services/loans'] || [])
    .filter((block) => block?.mode === 'dynamic')
    .map((block) => ({
      ...block,
      settings: { ...(block.settings || {}) },
      editableFields: Array.isArray(block.editableFields) ? [...block.editableFields] : [],
    }));
}

function renderLoansPage() {
  return render(
    <MemoryRouter>
      <LoansPage />
    </MemoryRouter>,
  );
}

describe('LoansPage front HUD', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    mockUpdateBlockSetting = vi.fn();
    mockGetBlockCollaboration = vi.fn(() => null);
    mockSetActiveBlockLock = vi.fn(() => ({ ok: true }));
    mockTestimonials = [];
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks(),
    };
    mockPageHierarchy = {
      '/services/loans': { path: '/services/loans', title: 'Loans' },
      '/services/loans/loan-consultants': { path: '/services/loans/loan-consultants', title: 'Loan Consultants' },
      '/contact-us': { path: '/contact-us', title: 'Contact Us' },
    };
  });

  it('shows a HUD tab for every dynamic loans block', async () => {
    renderLoansPage();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save all page drafts' })).toBeTruthy());
    expect(screen.getByRole('link', { name: 'Open page admin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hero' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Intro' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request Form' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Value Cards' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Billboard' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'CTA Form' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Testimonials' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Request Form HUD panel' })).toBeTruthy();
  }, 15000);

  it('lets Nathan take over the Every loan card grid through the front HUD workflow', async () => {
    mockGetBlockCollaboration.mockImplementation((_pathname, blockId) => (
      blockId === 'loan_options'
        ? {
          draftedBy: { userId: 'dev-other', displayName: 'Other Admin' },
          draftedAt: Date.now() - 1_000,
        }
        : null
    ));

    renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Card Grid · Flexible cards' }));
    expect(mockGetBlockCollaboration).toHaveBeenCalledWith('/services/loans', 'loan_options');
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Take over draft' }).length).toBeGreaterThan(0), { timeout: 10000 });

    fireEvent.click(screen.getAllByRole('button', { name: 'Take over draft' })[0]);

    await waitFor(() => {
      expect(mockSetActiveBlockLock).toHaveBeenCalledWith('/services/loans', 'loan_options', { force: true });
    });
  }, 15000);

  it('proves takeover keeps the open panel writable through local draft and visible render', async () => {
    let loanOptionsCollaboration = {
      draftedBy: { userId: 'dev-other', displayName: 'Other Admin' },
      draftedAt: Date.now() - 1_000,
    };
    mockGetBlockCollaboration.mockImplementation((_pathname, blockId) => (
      blockId === 'loan_options' ? loanOptionsCollaboration : null
    ));

    const view = renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Card Grid · Flexible cards' }));
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Take over draft' }).length).toBeGreaterThan(0), { timeout: 10000 });

    fireEvent.click(screen.getAllByRole('button', { name: 'Take over draft' })[0]);
    await waitFor(() => {
      expect(mockSetActiveBlockLock).toHaveBeenCalledWith('/services/loans', 'loan_options', { force: true });
    });

    // Simulate the shared authority acknowledgement while keeping the same
    // HUD panel mounted and open.
    loanOptionsCollaboration = {
      lockedBy: { userId: 'dev-nathan', displayName: 'Nathan' },
      draftedBy: { userId: 'dev-nathan', displayName: 'Nathan' },
      draftedAt: Date.now(),
    };
    view.rerender(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>,
    );

    const lineHeight = await waitFor(() => screen.getByRole('slider', { name: 'Card title line height' }));
    expect(screen.getByRole('button', { name: 'Card Grid · Flexible cards' })).toBeTruthy();
    fireEvent.change(lineHeight, { target: { value: '1.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'DEV · HUD diagnostics' }));

    await waitFor(() => expect(
      document.querySelector('.loans-native-options')?.style.getPropertyValue('--dynamic-grid-card-title-line-height'),
    ).toBe('1.1'));
    const diagnosticText = document.querySelector('[data-testid="hud-input-diagnostics"]')?.textContent || '';
    expect(diagnosticText).toContain('editing-self');
    expect(diagnosticText).toContain('REAL callback');
    expect(diagnosticText).toContain('yes / accepted');
    expect(diagnosticText).toContain('yes / cardTitleLineHeight = 1.1');
    expect(diagnosticText).toContain('block changed yes');
  }, 15000);

  it('closes only the active editor so another HUD block can be selected', async () => {
    renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Card Grid · Flexible cards' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy(), { timeout: 10000 });

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Close panel' })).toBeNull());
    expect(screen.getByRole('button', { name: 'Hide panels' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Intro' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Intro' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy(), { timeout: 10000 });
  }, 15000);

  it('routes owned Card Grid ranges into the live Loans card renderer', async () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'loan_options'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              cardOutline: true,
              cardShadow: true,
            },
          }
          : block
      )),
    };

    renderLoansPage();
    fireEvent.click(screen.getByRole('button', { name: 'Card Grid · Flexible cards' }));
    await waitFor(() => expect(screen.getByRole('slider', { name: 'Card title line height' })).toBeTruthy(), { timeout: 10000 });
    fireEvent.click(screen.getByRole('button', { name: 'Layout & typography' }));

    const optionsSection = document.querySelector('.loans-native-options');
    const firstCardTitle = optionsSection?.querySelector('.loans-native-option-card h3');
    expect(optionsSection).toBeTruthy();
    expect(firstCardTitle).toBeTruthy();

    const cases = [
      ['Card title line height', '1.1', '--dynamic-grid-card-title-line-height', '1.1'],
      ['Title-to-body space', '2', '--dynamic-grid-card-title-body-space', '2rem'],
      ['Card body line height', '1.8', '--dynamic-grid-card-body-line-height', '1.8'],
      ['Card shadow opacity', '65', '--dynamic-grid-card-shadow-opacity', '0.65'],
      ['Border width', '3', '--dynamic-grid-card-outline-width', '3px'],
    ];

    for (const [label, value, property, expected] of cases) {
      fireEvent.change(screen.getByRole('slider', { name: label }), { target: { value } });
      await waitFor(() => expect(optionsSection?.style.getPropertyValue(property)).toBe(expected));
    }

    // The CSS variable is emitted on the public section and the normalized
    // value reaches the actual title node consumed by the browser.
    expect(firstCardTitle?.style.lineHeight).toBe('1.1');
    expect(optionsSection?.className).toContain('is-card-outline');
    expect(optionsSection?.className).toContain('is-card-shadow');
  }, 15000);

  it('routes the Hero headline tracking control into the live Loans hero renderer', async () => {
    const { container } = renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Hero' }));
    const tracking = await waitFor(() => screen.getByRole('slider', { name: 'Hero headline tracking' }));
    const heading = container.querySelector('[data-block-id="hero"] h1');

    expect(heading).toBeTruthy();
    expect(heading?.style.letterSpacing).toBe('-0.05em');

    fireEvent.change(tracking, { target: { value: '0' } });

    await waitFor(() => expect(heading?.style.letterSpacing).toBe('0em'));
  }, 15000);

  it('keeps Loans Card Grid styles and card content on the shared runtime contract', async () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'loan_options'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              subheadSizeRem: 1.65,
              subtitleJustify: 'center',
              bgTone: 'sand',
              contentWidth: 'content',
              cardStyle: 'card3',
              card1Body: '<p>Rich card body</p>',
              card1ListJson: JSON.stringify(['One visible bullet']),
              card1Fineprint: 'Legal note',
              card1FineprintSizeRem: 0.85,
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const optionsSection = container.querySelector('.loans-native-options');
    const firstCard = optionsSection?.querySelector('.loans-native-option-card');

    expect(optionsSection?.className).toContain('is-width-content');
    expect(optionsSection?.className).toContain('is-card-grid-style-card3');
    expect(optionsSection?.className).toContain('is-subhead-sized');
    expect(optionsSection?.style.getPropertyValue('--dynamic-grid-subhead-size')).toBe('1.65rem');
    expect(optionsSection?.style.getPropertyValue('--dynamic-grid-subhead-justify')).toBe('center');
    expect(firstCard?.querySelector('.service-native-card-rich-body')).toBeTruthy();
    expect(firstCard?.querySelector('.service-native-card-bullet-list li')?.textContent).toBe('One visible bullet');
    expect(firstCard?.querySelector('.service-native-card-fineprint')?.textContent).toBe('Legal note');

    fireEvent.click(screen.getByRole('button', { name: 'Card Grid · Flexible cards' }));
    const subheadSize = await waitFor(() => screen.getByRole('slider', { name: 'Grid subhead size (rem)' }));
    expect(screen.getByRole('radiogroup', { name: 'Grid subhead justify' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Align left' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Align center' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Align right' })).toBeNull();
    fireEvent.change(subheadSize, { target: { value: '1.9' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Grid subhead justify' })).getByRole('radio', { name: 'Right' }));

    await waitFor(() => expect(
      container.querySelector('.loans-native-options')?.style.getPropertyValue('--dynamic-grid-subhead-size'),
    ).toBe('1.9rem'));
    expect(container.querySelector('.loans-native-options')?.style.getPropertyValue('--dynamic-grid-subhead-justify')).toBe('right');
  }, 15000);

  it('renders the saved block sequence in DOM order', () => {
    const sourceBlocks = cloneLoansDynamicBlocks();
    const savedOrder = ['testimonials', 'intro', 'cta_form', 'vision_fuel', 'hero', 'request_form', 'value_cards', 'loan_options'];
    mockBlocksByPath = {
      '/services/loans': savedOrder.map((id) => sourceBlocks.find((block) => block.id === id)),
    };

    const { container } = renderLoansPage();
    const managedRoot = container.querySelector('.loans-native-page-content');
    const renderedOrder = Array.from(managedRoot.children)
      .map((element) => element.getAttribute('data-block-id'))
      .filter(Boolean);

    expect(renderedOrder).toEqual(savedOrder);
  });

  it('renders live Intro settings through the Loans page renderer', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'intro'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              justify: 'left',
              bodyColorClassName: 'is-mango',
              button1Style: 'outline',
              button1Tone: 'white',
              button2Label: 'Contact us',
              button2Url: '/contact-us',
              button2PageRef: '/contact-us',
              button2Style: 'ghost',
              extraLine: 'A little more confidence.',
              extraLineSizeRem: 2.5,
              extraLineSpaceBeforeRem: 1.2,
              extraLineLineHeight: 1.1,
              backgroundEffectsJson: JSON.stringify({
                enabled: true,
                clip: true,
                lights: [{ tone: 'mango', strength: 55, x: 20, y: 30, size: 40 }],
              }),
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const intro = container.querySelector('.loans-native-intro');

    expect(intro?.querySelector('.service-native-intro-copy.is-justify-left')).toBeTruthy();
    expect(intro?.querySelector('.native-info-rich-html.is-mango')).toBeTruthy();
    expect(intro?.querySelector('.block-background-effects')).toBeTruthy();
    expect(intro?.querySelector('.service-native-btn.is-outline.is-tone-white')).toBeTruthy();
    expect(intro?.querySelector('.service-native-btn.is-ghost')).toBeTruthy();
    expect(intro?.querySelector('.native-info-intro-emphasis')?.getAttribute('style') || '')
      .toContain('--service-native-intro-emphasis-size: 2.5rem');
  });

  it('applies the request-form core heading color to every line when no spans are stored', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'request_form'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              title: 'First heading line\nSecond heading line',
              titleClassName: 'is-mango',
              titleHighlightsJson: '',
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const title = container.querySelector('.loans-native-inquiry .dynamic-request-copy > h2');

    expect(title?.className).toContain('is-mango');
    expect(title?.querySelectorAll('mark')).toHaveLength(0);
    expect(title?.textContent).toContain('First heading line');
    expect(title?.textContent).toContain('Second heading line');
  });

  it('renders legacy double-escaped request-form markup as rich text', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'request_form'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              bodyHtml: '<p>Complete the &lt;mark&gt;inquiry form&lt;/mark&gt;.</p>',
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const body = container.querySelector('.loans-native-inquiry .dynamic-request-body');

    expect(body?.querySelector('mark')?.textContent).toBe('inquiry form');
    expect(body?.textContent).toBe('Complete the inquiry form.');
    expect(body?.textContent).not.toContain('<mark>');
  });

  it('opens the request form, billboard, CTA, and testimonials HUD panels', async () => {
    renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Request Form' }));
    await waitFor(() => expect(screen.getByLabelText('Form heading text')).toBeTruthy());
    expect(screen.getByRole('textbox', { name: 'Lead Copy' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add step 4' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Billboard' })[0]);
    expect(screen.getByLabelText('Title')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'CTA Form' }));
    expect(screen.getByText('Form Heading')).toBeTruthy();
    expect(screen.getByText('Submit Style')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Testimonials' }));
    expect(screen.getByText('Selector')).toBeTruthy();
    expect(screen.getByText('Edit fineprint in the admin content page.')).toBeTruthy();
  }, 15000);

  it('keeps the active HUD block undimmed while dimming other dynamic blocks', () => {
    const { container } = renderLoansPage();

    fireEvent.click(screen.getByRole('button', { name: 'Request Form' }));

    expect(container.querySelector('.loans-native-inquiry')?.className.includes('is-hud-focus-target')).toBe(true);
    expect(container.querySelector('.loans-native-more')?.className.includes('is-hud-dimmed')).toBe(true);
  });

  it('renders value cards through the canonical columns renderer while preserving the loans-page HUD shell', () => {
    const { container } = renderLoansPage();

    const section = container.querySelector('#theresmore');
    expect(section?.className.includes('loans-native-more')).toBe(true);
    expect(section?.className.includes('native-dynamic-columns')).toBe(true);
    expect(section?.className.includes('is-columns-preset-value-cards')).toBe(true);

    const grid = section?.querySelector('.native-columns-grid');
    expect(grid).toBeTruthy();
    expect(grid?.className.includes('investments-native-growth-grid')).toBe(true);

    const items = Array.from(section?.querySelectorAll('.native-columns-item') || []);
    expect(items.length).toBe(4);
    expect(section?.querySelector('h2')?.className.includes('investments-growth-scroll-reveal-title')).toBe(true);
    expect(items.every((item) => item.className.includes('investments-native-growth-card'))).toBe(true);
    expect(items.every((item) => item.className.includes('investments-growth-scroll-reveal'))).toBe(true);
    expect(items.map((item) => item.getAttribute('data-investments-growth-background-panel'))).toEqual(['blue', 'mango', 'sand', 'blue']);
    expect(screen.getByText('Loyalty.')).toBeTruthy();
    expect(screen.getByText(/Many of our borrowers are repeat clients/)).toBeTruthy();
  });

  it('renders the vision fuel billboard through the shared billboard contract on the loans page', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'vision_fuel'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              titleClassName: 'is-super-grey',
              titleHighlightsJson: '[{"start":7,"end":11,"className":"is-mango","text":"fuel"}]',
              bgTone: 'white',
              textTone: 'dark',
              justify: 'left',
              contentMaxWidthPx: 1040,
              actionGapRem: 2.35,
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const section = container.querySelector('.loans-native-vision-fuel');
    const title = container.querySelector('.loans-native-vision-fuel .native-info-section-copy > h2');
    const highlight = container.querySelector('.loans-native-vision-fuel .native-info-section-copy > h2 mark.is-mango');
    const copy = container.querySelector('.loans-native-vision-fuel .native-info-section-copy');
    const rail = container.querySelector('.loans-native-vision-fuel .ag-panel-rail');
    const actionRow = container.querySelector('.loans-native-vision-fuel .service-native-action-row');

    expect(section?.className.includes('dynamic-billboard')).toBe(true);
    expect(section?.className.includes('is-bg-white')).toBe(true);
    expect(section?.className.includes('is-text-dark')).toBe(true);
    expect(title?.className.includes('is-super-grey')).toBe(true);
    expect(highlight?.textContent).toBe('fuel');
    expect(copy?.className.includes('is-justify-left')).toBe(true);
    expect(rail?.getAttribute('style') || '').toContain('--dynamic-billboard-max-width: 1040px');
    expect(actionRow?.className.includes('is-dynamic-billboard-action-gap')).toBe(true);
    expect(actionRow?.getAttribute('style') || '').toContain('--dynamic-billboard-action-gap: 2.35rem');
    expect(actionRow?.getAttribute('style') || '').toContain('margin-top: 2.35rem');
  });

  it('does not coerce an unset Vision Fuel action gap into zero spacing', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'vision_fuel'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              actionGapRem: undefined,
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const actionRow = container.querySelector('.loans-native-vision-fuel .service-native-action-row');

    expect(actionRow?.className.includes('is-dynamic-billboard-action-gap')).toBe(false);
    expect(actionRow?.getAttribute('style') || '').not.toContain('--dynamic-billboard-action-gap');
    expect(actionRow?.getAttribute('style') || '').not.toContain('margin-top');
  });

  it('lets an explicit Vision Fuel title-tracking edit bypass the legacy visual lock', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'vision_fuel'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              titleTrackingEm: 0.01,
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const section = container.querySelector('.loans-native-vision-fuel');
    const title = container.querySelector('.loans-native-vision-fuel .native-info-section-copy > h2');

    expect(section?.className.includes('has-title-tracking-override')).toBe(true);
    expect(title?.getAttribute('style') || '').toContain('--dynamic-billboard-title-tracking: 0.01em');
  });

  it('keeps an added billboard in its managed block slot when the page rerenders during edit', () => {
    const blocks = cloneLoansDynamicBlocks();
    const introIndex = blocks.findIndex((block) => block.id === 'intro');
    const visionBlock = blocks.find((block) => block.id === 'vision_fuel');
    const addedBillboard = {
      ...visionBlock,
      id: 'billboard',
      name: 'Billboard',
      settings: {
        ...(visionBlock?.settings || {}),
        title: 'Inserted billboard',
      },
    };
    blocks.splice(introIndex + 1, 0, addedBillboard);
    mockBlocksByPath = {
      '/services/loans': blocks,
    };

    const rendered = renderLoansPage();
    const firstOrder = Array.from(rendered.container.querySelectorAll('[data-block-id]'))
      .map((node) => node.getAttribute('data-block-id'));

    expect(firstOrder.indexOf('intro')).toBeLessThan(firstOrder.indexOf('billboard'));
    expect(firstOrder.indexOf('billboard')).toBeLessThan(firstOrder.indexOf('loan_options'));

    mockBlocksByPath = {
      '/services/loans': blocks.map((block) => (
        block.id === 'billboard'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              title: 'Edited billboard',
            },
          }
          : block
      )),
    };
    rendered.rerender(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>,
    );

    const secondOrder = Array.from(rendered.container.querySelectorAll('[data-block-id]'))
      .map((node) => node.getAttribute('data-block-id'));
    expect(secondOrder.indexOf('intro')).toBeLessThan(secondOrder.indexOf('billboard'));
    expect(secondOrder.indexOf('billboard')).toBeLessThan(secondOrder.indexOf('loan_options'));
    expect(screen.getByText('Edited billboard')).toBeTruthy();
  });

  it('lets the loans billboard subtitle and action disappear when the admin clears them', () => {
    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'vision_fuel'
          ? {
            ...block,
            settings: {
              ...(block.settings || {}),
              subtitle: '',
              bodyHtml: '',
              body: '',
              buttonLabel: '',
              buttonUrl: '',
              buttonPageRef: '',
            },
          }
          : block
      )),
    };

    const { container } = renderLoansPage();
    const section = container.querySelector('.loans-native-vision-fuel');

    expect(section?.querySelector('.native-info-section-subtitle')).toBeNull();
    expect(section?.querySelector('.native-info-rich-html')).toBeNull();
    expect(section?.querySelector('.service-native-action-row')).toBeNull();
  });

  it('adds and removes HUD tabs when a block switches between dynamic and static', () => {
    const rendered = renderLoansPage();

    expect(screen.getByRole('button', { name: 'Request Form' })).toBeTruthy();

    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks().map((block) => (
        block.id === 'request_form'
          ? { ...block, mode: 'static' }
          : block
      )),
    };
    rendered.rerender(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Request Form' })).toBeNull();

    mockBlocksByPath = {
      '/services/loans': cloneLoansDynamicBlocks(),
    };
    rendered.rerender(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Request Form' })).toBeTruthy();
  });

});
