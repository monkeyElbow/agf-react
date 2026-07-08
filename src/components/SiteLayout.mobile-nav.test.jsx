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

function createRect(width = 0, height = 0) {
  return {
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
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

  it('keeps force-compact nav stable when the rendered compact menu is narrower than the desktop link set', async () => {
    vi.useFakeTimers();
    mockMatchMedia(true);

    const resizeObserverCallbacks = [];
    const originalResizeObserver = global.ResizeObserver;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const clientWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    const scrollWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    global.ResizeObserver = class MockResizeObserver {
      constructor(callback) {
        resizeObserverCallbacks.push(callback);
      }

      observe() {}

      disconnect() {}
    };

    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(performance.now()), 0);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        if (this.classList?.contains('site-nav-inner')) {
          return 1080;
        }
        return clientWidthDescriptor?.get ? clientWidthDescriptor.get.call(this) : 0;
      },
    });

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        if (this.classList?.contains('site-brand')) {
          return 180;
        }
        return offsetWidthDescriptor?.get ? offsetWidthDescriptor.get.call(this) : 0;
      },
    });

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        if (this.classList?.contains('site-nav-links')) {
          const nav = this.closest('.site-nav');
          return nav?.classList.contains('is-force-mobile') ? 260 : 980;
        }
        return scrollWidthDescriptor?.get ? scrollWidthDescriptor.get.call(this) : 0;
      },
    });

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.classList?.contains('site-nav-inner')) {
        return createRect(1080, 56);
      }
      if (this.classList?.contains('site-brand')) {
        return createRect(180, 30);
      }
      if (this.classList?.contains('site-nav-links')) {
        const nav = this.closest('.site-nav');
        return createRect(nav?.classList.contains('is-force-mobile') ? 260 : 980, 56);
      }
      return originalGetBoundingClientRect.call(this);
    };

    try {
      const { container } = renderLayout();
      await vi.runAllTimersAsync();

      const nav = container.querySelector('.site-nav');
      expect(nav?.className.includes('is-force-mobile')).toBe(true);

      resizeObserverCallbacks.forEach((callback) => callback([], {}));
      await vi.runAllTimersAsync();

      expect(nav?.className.includes('is-force-mobile')).toBe(true);
    } finally {
      global.ResizeObserver = originalResizeObserver;
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;

      if (clientWidthDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidthDescriptor);
      }
      if (offsetWidthDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidthDescriptor);
      }
      if (scrollWidthDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidthDescriptor);
      }
    }
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

  it('keeps Safari desktop dropdowns on a non-jitter reveal contract', () => {
    const cssSource = readSource('../styles.css');

    expect(cssSource).toContain('html.ag-browser-safari .site-nav-group::after {');
    expect(cssSource).toContain('html.ag-browser-safari .site-nav-group:not(.is-admin) .site-nav-dropdown,');
    expect(cssSource).toContain('html.ag-browser-safari .site-nav-group:not(.is-admin) .site-nav-dropdown a,');
    expect(cssSource).toContain('html.ag-browser-safari .site-nav-group.is-open .site-nav-dropdown .site-nav-dropdown-link,');
    expect(cssSource).toContain('transition-delay: 0ms;');
  });

  it('keeps the login icon available on narrow desktop widths until compact mode takes over', () => {
    const cssSource = readSource('../styles.css');

    expect(cssSource).not.toContain(`@media (min-width: 1100px) and (max-width: 1280px) {
  .nav-login-link .nav-icon {
    display: none;
  }`);
  });
});
