import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentsProvider } from '../context/DocumentsContext';
import {
  clearHomeReturnAssistState,
  recordHomeReturnAssistNavigation,
} from '../lib/homeReturnAssist';

let mockBlocksByPath = {};

vi.mock('../context/ContentAdminContext', () => ({
  inspectDynamicHeroSettings: () => ({ hasDrift: false, issues: [], normalizedSettings: {} }),
  normalizeDynamicHeroSettings: (_pathname, settings) => settings || {},
  useContentAdmin: () => ({
    blocksByPath: mockBlocksByPath,
    updateBlockSetting: vi.fn(),
    resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
  }),
}));

vi.mock('../context/FrontHudContext', () => ({
  useFrontHud: () => ({ enabled: false, opacity: 15 }),
}));

vi.mock('../hooks/useNativeEnhancements', () => ({
  default: () => {},
}));

vi.mock('../lib/heroDriftWarnings', () => ({
  logHeroDriftWarningOnce: () => {},
}));

vi.mock('../lib/heroRenderGuardrails', () => ({
  inspectHeroRender: () => ({ hasDrift: false, issues: [] }),
  logHeroRenderWarningOnce: () => {},
}));

vi.mock('../lib/heroHudMode', () => ({
  shouldRenderHeroInlineEditor: () => false,
}));

import HomePage from './HomePage';

void [MemoryRouter, DocumentsProvider, HomePage];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function renderHomePage(initialEntries = ['/']) {
  return render(
    <DocumentsProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <HomePage />
      </MemoryRouter>
    </DocumentsProvider>,
  );
}

describe('HomePage return assist', () => {
  const serviceReturnPaths = [
    '/services',
    '/services/loans',
    '/services/investments',
    '/services/retirement',
    '/services/retirement/403b',
    '/services/insurance/mission-assure',
    '/services/planned-giving/endowments',
  ];

  beforeEach(() => {
    mockBlocksByPath = {};
    window.sessionStorage.clear();
    clearHomeReturnAssistState();
  });

  it('does not appear on a fresh home visit', () => {
    renderHomePage(['/']);

    expect(screen.queryByRole('heading', { name: 'Still looking for something?' })).toBeNull();
  });

  it.each(serviceReturnPaths)('appears on home after a same-session return from %s', async (servicePath) => {
    const now = Date.now();
    recordHomeReturnAssistNavigation(servicePath, now);
    recordHomeReturnAssistNavigation('/', now + 200);

    renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: "What can we help you find?" })).toBeTruthy();
    expect(screen.getByPlaceholderText('What can we help you find?')).toBeTruthy();
  });

  it.each(serviceReturnPaths)('appears on home during the immediate return render from %s', async (servicePath) => {
    const now = Date.now();
    recordHomeReturnAssistNavigation(servicePath, now);

    renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: "What can we help you find?" })).toBeTruthy();
  });

  it('stays hidden on repeated home renders after dismissal', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/retirement', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    const firstRender = renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: "What can we help you find?" })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss return assist' }));
    expect(screen.queryByRole('searchbox', { name: "What can we help you find?" })).toBeNull();

    firstRender.unmount();
    renderHomePage(['/']);

    expect(screen.queryByRole('searchbox', { name: "What can we help you find?" })).toBeNull();
  });

  it('does not alter the leading home content when shown', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/investments', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: "What can we help you find?" })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /What you do here matters/i })).toBeTruthy();
    expect(document.querySelector('.home-native-page')?.className).toContain('is-home-hero-temporarily-hidden');
  });

  it('renders the return assist after the first top discovery feature and before the next home section', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/investments', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    const { container } = renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: "What can we help you find?" })).toBeTruthy();

    const impactStoryBlock = container.querySelector('[data-block-id="home_impact_story"]');
    const servicesFeatureBlock = container.querySelector('[data-block-id="home_services_feature_animation"]');
    const returnAssist = container.querySelector('.home-return-assist');

    expect(impactStoryBlock).toBeTruthy();
    expect(servicesFeatureBlock).toBeTruthy();
    expect(returnAssist).toBeTruthy();
    expect(impactStoryBlock?.compareDocumentPosition(returnAssist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(returnAssist?.compareDocumentPosition(servicesFeatureBlock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the home CTA lead copy in the section heading area instead of inside the form', () => {
    renderHomePage(['/']);

    const copy = screen.getByText('It starts with a conversation. We’re happy to reach out.');
    const ctaSection = copy.closest('section');
    const copyShell = copy.closest('.native-info-section-copy');
    const form = ctaSection?.querySelector('.dynamic-cta-form form');

    expect(copyShell?.contains(copy)).toBe(true);
    expect(form?.contains(copy)).toBe(false);
  });

  it('uses the shared site search results inside the compact return assist shell', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/planned-giving', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    renderHomePage(['/']);
    const searchInput = await screen.findByRole('searchbox', { name: "What can we help you find?" });

    fireEvent.change(searchInput, { target: { value: 'rates' } });

    expect((await screen.findByRole('link', { name: 'Rates' })).getAttribute('href')).toBe('/rates');
    expect(screen.getByText(/Site Pages/i)).toBeTruthy();
  });

  it('keeps the mobile dismiss action out of the search pill lane', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('Give the dismiss action its own row on touch widths so it never overlaps the search pill.');
    expect(cssSource).toContain('.home-return-assist-dismiss {');
    expect(cssSource).toContain('position: static;');
    expect(cssSource).toContain('grid-row: 1;');
    expect(cssSource).toContain('justify-self: end;');
    expect(cssSource).toContain('opacity: 1;');
  });
});
