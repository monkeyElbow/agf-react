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
    '/services/legacy-giving/endowments',
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

    expect(await screen.findByRole('searchbox', { name: 'Return assist' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Return assist')).toBeTruthy();
  });

  it.each(serviceReturnPaths)('appears on home during the immediate return render from %s', async (servicePath) => {
    const now = Date.now();
    recordHomeReturnAssistNavigation(servicePath, now);

    renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: 'Return assist' })).toBeTruthy();
  });

  it('stays hidden on repeated home renders after dismissal', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/retirement', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    const firstRender = renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: 'Return assist' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss return assist' }));
    expect(screen.queryByRole('searchbox', { name: 'Return assist' })).toBeNull();

    firstRender.unmount();
    renderHomePage(['/']);

    expect(screen.queryByRole('searchbox', { name: 'Return assist' })).toBeNull();
  });

  it('does not alter the main hero when shown', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/investments', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    renderHomePage(['/']);

    expect(await screen.findByRole('searchbox', { name: 'Return assist' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore investments' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('uses the shared site search results inside the compact return assist shell', async () => {
    const now = Date.now();
    recordHomeReturnAssistNavigation('/services/legacy-giving', now);
    recordHomeReturnAssistNavigation('/', now + 200);

    renderHomePage(['/']);
    const searchInput = await screen.findByRole('searchbox', { name: 'Return assist' });

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
