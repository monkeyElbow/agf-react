import { act, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServicesPage from './ServicesPage';
import { DEFAULT_SERVICE_HERO_PIE_SLICES } from '../lib/dynamicPageBlocks';

let reducedMotion = false;

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

vi.mock('../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      blocksByPath: {},
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

function getSelectedCard() {
  return document.querySelector('.services-pie-card');
}

describe('ServicesPage interactive service wheel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps all service labels and routes intact while driving the selected card from wheel data', () => {
    renderServicesPage();

    expect(document.querySelectorAll('[data-service-wheel-slice]')).toHaveLength(DEFAULT_SERVICE_HERO_PIE_SLICES.length);

    DEFAULT_SERVICE_HERO_PIE_SLICES.forEach((slice) => {
      const wedgeLink = document.querySelector(`[data-service-wheel-slice="${slice.title}"]`);
      expect(wedgeLink).toBeTruthy();
      expect(wedgeLink.getAttribute('href')).toBe(slice.path);
      fireEvent.click(wedgeLink);
      const selectedCard = getSelectedCard();
      expect(selectedCard).toBeTruthy();
      expect(within(selectedCard).getByRole('heading', { name: slice.title })).toBeTruthy();
      expect(within(selectedCard).getByRole('link', { name: `Explore ${slice.title}` }).getAttribute('href')).toBe(slice.path);
      expect(document.querySelector(`[data-service-wheel-card="${slice.title}"]`)).toBeTruthy();
    });
  });

  it('updates the selected card when a service is chosen from the wheel controls', () => {
    renderServicesPage();
    const selectedCard = getSelectedCard();

    expect(selectedCard).toBeTruthy();
    expect(within(selectedCard).getByRole('heading', { name: 'Loans' })).toBeTruthy();
    expect(within(selectedCard).getByRole('link', { name: 'Explore Loans' }).getAttribute('href')).toBe('/services/loans');

    fireEvent.click(document.querySelector('[data-service-wheel-slice="Insurance"]'));

    expect(within(selectedCard).getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    expect(within(selectedCard).getByText('Coverage built for churches, ministries and individuals to protect what’s most important.')).toBeTruthy();
    expect(within(selectedCard).getByRole('link', { name: 'Explore Insurance' }).getAttribute('href')).toBe('/services/insurance');
  });

  it('updates the selected card when a wheel slice is clicked directly', () => {
    renderServicesPage();
    const selectedCard = getSelectedCard();

    expect(selectedCard).toBeTruthy();
    fireEvent.click(document.querySelector('[data-service-wheel-slice="Planned Giving"]'));

    expect(within(selectedCard).getByRole('heading', { name: 'Planned Giving' })).toBeTruthy();
    expect(within(selectedCard).getByRole('link', { name: 'Explore Planned Giving' }).getAttribute('href')).toBe('/services/planned-giving');
  });

  it('auto-advances only when motion is allowed and pauses when reduced motion is preferred', () => {
    const autoplayRender = renderServicesPage();
    const selectedCard = getSelectedCard();

    expect(selectedCard).toBeTruthy();
    expect(within(selectedCard).getByRole('heading', { name: 'Loans' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(within(selectedCard).getByRole('heading', { name: 'Investments' })).toBeTruthy();

    autoplayRender.unmount();
    reducedMotion = true;
    renderServicesPage();
    const reducedMotionCard = getSelectedCard();

    expect(reducedMotionCard).toBeTruthy();
    expect(within(reducedMotionCard).getByRole('heading', { name: 'Loans' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(within(reducedMotionCard).getByRole('heading', { name: 'Loans' })).toBeTruthy();
  });
});
