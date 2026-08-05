import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteLayout from './SiteLayout';

let mockPathname = '/services';

const mockUseContentAdmin = vi.fn();

vi.mock('../context/ContentAdminContextCore', () => ({
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

void [MemoryRouter, SiteLayout];

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

describe('SiteLayout chatbot visibility', () => {
  beforeEach(() => {
    mockMatchMedia(true);
    mockPathname = '/services';
    window.localStorage.clear();
    mockUseContentAdmin.mockReturnValue({
      resolveManagedPathFromRef: (pathRef, fallback) => fallback || pathRef || '/',
    });
  });

  it('shows the chatbot on public pages when front HUD is disabled', () => {
    renderLayout();

    expect(screen.getByTestId('site-chatbot-window')).toBeTruthy();
  });

  it('hides the chatbot on admin routes', () => {
    mockPathname = '/admin/content';
    renderLayout();

    expect(screen.queryByTestId('site-chatbot-window')).toBeNull();
  });

  it('hides the chatbot when front HUD is enabled', () => {
    window.localStorage.setItem('agf-admin-front-hud-enabled-v1', 'true');
    renderLayout();

    expect(screen.queryByTestId('site-chatbot-window')).toBeNull();
  });
});
