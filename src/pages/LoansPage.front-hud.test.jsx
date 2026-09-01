import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';

let mockBlocksByPath = {};
let mockPageHierarchy = {};
let mockUpdateBlockSetting = vi.fn();
let mockTestimonials = [];

vi.mock('../context/ContentAdminContextCore', () => ({
  useOptionalContentAdmin: () => null,
  inspectDynamicHeroSettings: () => ({ hasDrift: false, issues: [], normalizedSettings: {} }),
  normalizeDynamicHeroSettings: (_pathname, settings) => settings || {},
  useContentAdmin: () => ({
    blocksByPath: mockBlocksByPath,
    pageHierarchy: mockPageHierarchy,
    updateBlockSetting: mockUpdateBlockSetting,
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
  });

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

    expect(section?.className.includes('dynamic-billboard')).toBe(true);
    expect(section?.className.includes('is-bg-white')).toBe(true);
    expect(section?.className.includes('is-text-dark')).toBe(true);
    expect(title?.className.includes('is-super-grey')).toBe(true);
    expect(highlight?.textContent).toBe('fuel');
    expect(copy?.className.includes('is-justify-left')).toBe(true);
    expect(rail?.getAttribute('style') || '').toContain('--dynamic-billboard-max-width: 1040px');
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
