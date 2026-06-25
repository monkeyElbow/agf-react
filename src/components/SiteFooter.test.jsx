import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AnimatedBrandLogo from './AnimatedBrandLogo';
import SiteFooter from './SiteFooter';

vi.mock('../context/ContentAdminContext', () => ({
  useContentAdmin: () => ({
    resolveManagedPathFromRef: (pathRef, fallback) => fallback || pathRef || '/',
  }),
}));

describe('site chrome accessibility guardrails', () => {
  it('keeps explicit intrinsic logo dimensions without changing footer navigation links', () => {
    const { container } = render(
      <MemoryRouter>
        <div>
          <AnimatedBrandLogo />
          <SiteFooter />
        </div>
      </MemoryRouter>,
    );

    const headerWordmark = container.querySelector('.site-brand-wordmark-image');
    const footerWordmark = container.querySelector('.site-footer-logo-white');

    expect(headerWordmark?.getAttribute('width')).toBe('510');
    expect(headerWordmark?.getAttribute('height')).toBe('116');
    expect(footerWordmark?.getAttribute('width')).toBe('510');
    expect(footerWordmark?.getAttribute('height')).toBe('116');
    expect(screen.getByRole('link', { name: 'Services' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Investments' })).toBeTruthy();
  });

  it('keeps footer column labels out of heading navigation while preserving visible links', () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: 'Services' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'About' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Tools' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Services' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tools' })).toBeTruthy();
  });
});
