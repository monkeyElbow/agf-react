import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    const headerWordmarkShell = container.querySelector('.site-brand-wordmark-shell');
    const headerBrandMark = container.querySelector('.site-brand-icon-a');
    const headerBrandSquare = container.querySelector('.site-brand-icon-square');
    const footerWordmark = container.querySelector('.site-footer-logo-white');

    expect(headerWordmark?.getAttribute('width')).toBe('510');
    expect(headerWordmark?.getAttribute('height')).toBe('116');
    expect(headerWordmarkShell?.getAttribute('style') || '').toContain('width: 98.19px;');
    expect(headerWordmark?.getAttribute('style') || '').toContain('height: 30px;');
    expect(headerWordmark?.getAttribute('style') || '').toContain('transform: translateX(-33.84px);');
    expect(headerBrandMark?.getAttribute('width')).toBe('30');
    expect(headerBrandMark?.getAttribute('height')).toBe('30');
    expect(headerBrandMark?.getAttribute('style') || '').toContain('fill: rgb(255, 255, 255);');
    expect(headerBrandSquare?.getAttribute('style') || '').toContain('background: rgb(0, 173, 187);');
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

  it('keeps footer section labels visually larger than footer links', () => {
    const cssSource = readFileSync(resolve(__dirname, '../styles.css'), 'utf8');

    expect(cssSource).toContain('.site-footer-heading {');
    expect(cssSource).toContain('font-size: clamp(1.5rem, 1.2vw, 1.76rem);');
    expect(cssSource).toContain('.site-footer-heading a {');
    expect(cssSource).toContain('font-size: inherit;');
    expect(cssSource).toContain('.site-footer-col ul a {');
    expect(cssSource).toContain('font-size: 1.05rem;');
  });
});
