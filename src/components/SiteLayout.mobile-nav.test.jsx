import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteLayout from './SiteLayout';

let mockPathname = '/services';

const mockUseContentAdmin = vi.fn();

vi.mock('../context/ContentAdminContext', () => ({
  useContentAdmin: () => mockUseContentAdmin(),
}));

vi.mock('./SiteFooter', () => ({
  default: function SiteFooter() {
    return <div data-testid="site-footer" />;
  },
}));

vi.mock('./AnimatedBrandLogo', () => ({
  default: function AnimatedBrandLogo() {
    return <div data-testid="brand-logo" />;
  },
}));

vi.mock('./SiteChatbotWindow', () => ({
  default: function SiteChatbotWindow() {
    return <div data-testid="site-chatbot-window" />;
  },
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={[mockPathname]}>
      <SiteLayout>
        <div>Page content</div>
      </SiteLayout>
    </MemoryRouter>,
  );
}

function RouteChangeButton({ to = '/rates' }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      Route change
    </button>
  );
}

function renderLayoutWithRouteChangeButton() {
  return render(
    <MemoryRouter initialEntries={[mockPathname]}>
      <SiteLayout>
        <RouteChangeButton />
        <div>Page content</div>
      </SiteLayout>
    </MemoryRouter>,
  );
}

describe('SiteLayout mobile nav drawer', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    mockPathname = '/services';
    mockUseContentAdmin.mockReturnValue({
      resolveManagedPathFromRef: (pathRef, fallback) => fallback || pathRef || '/',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps labeled mobile submenu toggles wired to their drawer sections', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    const servicesToggle = screen.getByRole('button', { name: 'Expand Services menu' });
    expect(servicesToggle.getAttribute('aria-controls')).toBe('site-nav-dropdown-services');
    expect(servicesToggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(servicesToggle);

    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('site-nav-dropdown-services')).toBeTruthy();
  });

  it('closes a desktop dropdown after clicking a submenu link', () => {
    mockMatchMedia(true);
    mockPathname = '/services';

    renderLayout();

    const servicesToggle = screen.getByRole('button', { name: 'Expand Services menu' });
    fireEvent.click(servicesToggle);
    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('link', { name: 'Investments' }));

    expect(screen.getByRole('button', { name: 'Expand Services menu' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('closes an open desktop dropdown when the route changes', () => {
    mockMatchMedia(true);
    mockPathname = '/services';

    renderLayoutWithRouteChangeButton();

    const servicesToggle = screen.getByRole('button', { name: 'Expand Services menu' });
    fireEvent.click(servicesToggle);
    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Route change' }));

    expect(screen.getByRole('button', { name: 'Expand Services menu' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a desktop submenu open through a noisy top-level group leave while the shared nav stays active', () => {
    vi.useFakeTimers();
    mockMatchMedia(true);
    mockPathname = '/services';

    const { container } = renderLayout();

    const servicesToggle = screen.getByRole('button', { name: 'Expand Services menu' });
    const servicesGroup = servicesToggle.closest('.site-nav-group');
    expect(servicesGroup).toBeTruthy();

    fireEvent.mouseEnter(servicesGroup);
    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.mouseLeave(servicesGroup, { relatedTarget: document.body });
    vi.advanceTimersByTime(120);

    expect(container.querySelector('.site-nav-group.is-open .site-nav-group-link')?.textContent).toBe('Services');
    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('resets the mobile drawer and submenu state when the route changes', () => {
    renderLayoutWithRouteChangeButton();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand Services menu' }));

    expect(screen.getByRole('button', { name: 'Collapse Services menu' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Route change' }));

    expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Collapse Services menu' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Expand Services menu' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the nav labels and routes unchanged in the shared site map', () => {
    const siteMapSource = readSource('../data/siteMap.js');

    expect(siteMapSource).toContain("title: 'Services'");
    expect(siteMapSource).toContain("{ path: '/services/investments', label: 'Investments' }");
    expect(siteMapSource).toContain("{ path: '/rates', label: 'Rates' }");
    expect(siteMapSource).toContain("title: 'Resources'");
  });

  it('keeps the mobile drawer on the shared premium dropdown surface and fast reveal contract', () => {
    const cssSource = readSource('../styles.css');

    expect(cssSource).toContain('@media (max-width: 1099px) {');
    expect(cssSource).toContain('@keyframes site-nav-dropdown-reveal {');
    expect(cssSource).toContain('.site-nav-dropdown-link {');
    expect(cssSource).toContain('--site-nav-menu-soft-hover: rgba(220, 243, 245, 0.92);');
    expect(cssSource).toContain('.site-nav-group:not(.is-admin).is-open .site-nav-dropdown,');
    expect(cssSource).toContain('background: var(--site-nav-menu-surface);');
    expect(cssSource).toContain('border: 1px solid var(--site-nav-menu-border);');
    expect(cssSource).toContain('box-shadow: var(--site-nav-menu-shadow-soft);');
    expect(cssSource).toContain('border: 1px solid var(--site-nav-menu-border);');
  });
});
