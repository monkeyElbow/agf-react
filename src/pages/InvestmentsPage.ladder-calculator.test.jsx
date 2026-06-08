import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InvestmentsPage, { simulateLadderSchedule } from './InvestmentsPage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockRates = Array.from({ length: 10 }, (_, index) => ({
  id: `certificate-${index + 1}`,
  product: `${index + 1}-YEAR TERM CERTIFICATE`,
  standardApy: '4.00',
  standardRate: '3.92',
  premiumApy: '4.00',
  premiumRate: '3.92',
}));

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

vi.mock('../context/RatesContext', () => ({
  useRates: () => ({
    rates: mockRates,
    ratesMeta: {
      certificatesEffectiveDate: 'January 1, 2025',
    },
  }),
}));

vi.mock('../context/DocumentsContext', () => ({
  useDocuments: () => ({
    resolveDocumentLink: () => ({ url: '/prospectus' }),
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
      blocksByPath: {},
      pageHierarchy: {
        '/services/investments': {
          path: '/services/investments',
          title: 'Investments',
          breadcrumbLabel: 'Investments',
          parentPath: '/services',
        },
        '/prospectus': {
          path: '/prospectus',
          title: 'Prospectus',
          breadcrumbLabel: 'Prospectus',
          parentPath: '/',
        },
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

describe('investments ladder calculator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.requestAnimationFrame = vi.fn((callback) => {
      callback();
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    global.URL.createObjectURL = vi.fn(() => 'blob:ladder-preview');
    global.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it('renders the redesigned strategy builder controls and ladder preview', () => {
    const { container } = render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Investment Laddering Strategy' })).toBeTruthy();
    expect(screen.getByLabelText('Total Investment Amount')).toBeTruthy();
    fireEvent.click(screen.getByText('Custom span'));
    expect(screen.getByLabelText('Ladder span (years / longest term)', { selector: 'input' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Reinvest matured principal into longest term/i })).toBeTruthy();
    fireEvent.click(screen.getByText('Advanced assumptions'));
    expect(screen.getByLabelText('Timeline years to visualize')).toBeTruthy();
    expect(screen.getByLabelText('1-Year APY (%)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your ladder at a glance' })).toBeTruthy();
    expect(screen.getByText('Initial setup')).toBeTruthy();
    expect(container.querySelector('[data-ladder-intro]')).toBeTruthy();
    expect(screen.getByText('Initial ladder setup')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-axis-label]')?.textContent).toBe('Start');
    expect(container.querySelector('[data-ladder-mini-axis-year="1"]')?.textContent).toBe('Year 1');
    expect(container.querySelector('[data-ladder-mini-axis-year="5"]')?.textContent).toBe('Year 5');
    expect(screen.getByText('Start with equal investments across 1-year through 5-year certificates. As each matures, it can roll into a new 5-year certificate.')).toBeTruthy();
    expect(screen.getByText('This view shows the starting ladder. Open the timeline to see how maturities roll forward.')).toBeTruthy();

    expect(container.querySelectorAll('[data-ladder-summary-tile]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-ladder-mini-row]')).toHaveLength(5);
    expect(container.querySelector('[data-ladder-mini-row="1"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-row="5"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-maturity-marker="1"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-maturity-marker="2"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-maturity-marker="3"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-maturity-marker="4"]')).toBeTruthy();
    expect(container.querySelector('[data-ladder-mini-maturity-marker="5"]')).toBeTruthy();
    fireEvent.click(screen.getByText('View ongoing rollover timeline'));
    expect(container.querySelectorAll('[data-ladder-rung-row]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-ladder-maturity-marker]').length).toBeGreaterThanOrEqual(5);
  });

  it('preserves ladder schedule math and surfaces the same result values after calculate', () => {
    const result = simulateLadderSchedule({
      totalInvestment: 100000,
      ladderYears: 5,
      horizonYears: 10,
      reinvestMode: 'reinvest_longest',
      apyByYear: {
        1: 4,
        2: 4,
        3: 4,
        4: 4,
        5: 4,
      },
    });

    expect(result.initialRows).toHaveLength(5);
    expect(result.initialRows[0].principal).toBe(20000);
    expect(result.initialRows[0].interest).toBeCloseTo(800, 2);
    expect(result.scheduleRows[0].totalCashAvailable).toBeCloseTo(20800, 2);
    expect(result.scheduleRows[1].totalCashAvailable).toBeCloseTo(21632, 2);
    expect(result.scheduleRows[4].reinvested).toBe(true);

    render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByRole('heading', { name: 'Your maturity rhythm' })).toBeTruthy();
    expect(screen.getAllByText('$20,800.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$21,632.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ladder Breakdown')).toBeTruthy();
    expect(screen.queryByText(/^Calculated$/)).toBeNull();
    expect(document.querySelector('.ag-table.investments-native-ladder-table')).toBeNull();
    expect(document.querySelectorAll('.investments-native-ladder-table-shell')).toHaveLength(3);
    expect(document.querySelectorAll('.investments-native-ladder-mobile-row').length).toBeGreaterThan(0);
  });

  it('allows PDF download without mandatory contact fields and keeps follow-up optional', () => {
    const anchors = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);
      if (String(tagName).toLowerCase() === 'a') {
        anchors.push(element);
      }
      return element;
    });

    render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    const checkbox = screen.getByRole('checkbox', { name: /follow-up from the investments team/i });
    const downloadButton = screen.getByRole('button', { name: 'Download PDF' });

    expect(checkbox.checked).toBe(true);
    expect(downloadButton.disabled).toBe(false);

    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(false);
    expect(screen.queryByPlaceholderText('Your name')).toBeNull();
    expect(downloadButton.disabled).toBe(false);

    fireEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchors.at(-1)?.download).toContain('.pdf');
  });

  it('keeps the laddering responsive shell hooks in page and CSS source', () => {
    const pageSource = readFileSync(path.resolve(__dirname, './InvestmentsPage.jsx'), 'utf8');
    const cssSource = readFileSync(path.resolve(__dirname, '../styles/service-native.css'), 'utf8');

    expect(pageSource).toContain('data-ladder-preview-card');
    expect(pageSource).toContain('data-ladder-intro');
    expect(pageSource).toContain('data-ladder-rung-row');
    expect(pageSource).toContain('data-ladder-maturity-marker');
    expect(pageSource).toContain('Initial setup');
    expect(pageSource).toContain('Initial ladder setup');
    expect(pageSource).toContain('data-ladder-mini-axis-label');
    expect(pageSource).toContain('data-ladder-mini-maturity-marker');
    expect(pageSource).toContain('Start with equal investments across 1-year through');
    expect(pageSource).toContain('This view shows the starting ladder. Open the timeline to see how maturities roll forward.');
    expect(pageSource).toContain('View ongoing rollover timeline');
    expect(pageSource).toContain('Download PDF');
    expect(pageSource).toContain('data-ladder-results-sheet');
    expect(pageSource).not.toContain('investments-native-ladder-process-line');
    expect(pageSource).not.toContain('ag-table has-fixed-layout investments-native-ladder-table');
    expect(cssSource).toContain('.investments-native-ladder-shell {');
    expect(cssSource).toContain('.investments-native-ladder-visual-scroll {');
    expect(cssSource).toContain('.investments-native-ladder-summary-strip.is-results {');
    expect(cssSource).toContain('.investments-native-ladder-result-sheet {');
    expect(cssSource).toContain('.investments-native-ladder-opt-in {');
    expect(cssSource).toContain('.investments-native-ladder-table {');
    expect(cssSource).toContain('.investments-native-ladder-table-shell {');
    expect(cssSource).toContain('.investments-native-ladder-mobile-sheet {');
    expect(cssSource).toContain('.investments-native-ladder-mini-heading {');
    expect(cssSource).toContain('.investments-native-ladder-preview-note {');
    expect(cssSource).toContain('.service-native-section.investments-native-ladder-section > .ag-panel-rail {');
    expect(cssSource).toContain('padding-left: 0;');
    expect(cssSource).toContain('@media (max-width: 860px) {');
  });
});
