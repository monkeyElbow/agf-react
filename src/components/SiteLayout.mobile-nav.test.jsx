import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('SiteLayout mobile nav drawer', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    mockPathname = '/services';
    mockUseContentAdmin.mockReturnValue({
      resolveManagedPathFromRef: (pathRef, fallback) => fallback || pathRef || '/',
    });
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

  it('keeps the mobile drawer on a flat integrated row system instead of beveled chevron pills and glass submenu cards', () => {
    const cssSource = readSource('../styles.css');

    expect(cssSource).toContain('@media (max-width: 1099px) {');
    expect(cssSource).toContain('.site-nav-group-head {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr) 56px;');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('.site-nav-group-head::before {');
    expect(cssSource).toContain('background: var(--ag-color-atlantean);');
    expect(cssSource).toContain('.site-nav-group:not(.is-admin).is-open .site-nav-dropdown,');
    expect(cssSource).toContain('padding: 0.28rem 0 0.18rem 1rem;');
    expect(cssSource).toContain('border-left: 2px solid transparent;');
    expect(cssSource).toContain('box-shadow: none;');
  });
});
