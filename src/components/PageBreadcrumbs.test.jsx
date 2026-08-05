import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PageBreadcrumbs from './PageBreadcrumbs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => ({
    getBreadcrumbTrail: (pathname) => {
      if (pathname === '/services/insurance') {
        return [
          { path: '/', label: 'Home' },
          { path: '/services', label: 'Services' },
          { path: '/services/insurance', label: 'Insurance' },
        ];
      }
      return [];
    },
  }),
}));

describe('PageBreadcrumbs', () => {
  it('preserves semantic breadcrumb markup with linked ancestors and a current-page label', () => {
    render(
      <MemoryRouter>
        <PageBreadcrumbs path="/services/insurance" />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(list.tagName).toBe('OL');
    expect(items).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Services' }).getAttribute('href')).toBe('/services');
    expect(screen.getByText('Insurance').getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('link', { name: 'Insurance' })).toBeNull();
  });

  it('keeps the modern lightweight breadcrumb row styles and removes the old dark rail treatment', () => {
    const cssSource = readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
    const breadcrumbStart = cssSource.indexOf('.native-breadcrumbs {');
    const breadcrumbEnd = cssSource.indexOf('.search-page {');
    const breadcrumbBlock = cssSource.slice(breadcrumbStart, breadcrumbEnd);

    expect(breadcrumbBlock).toContain('.native-breadcrumbs {');
    expect(breadcrumbBlock).toContain('background: transparent;');
    expect(breadcrumbBlock).toContain("content: '›';");
    expect(breadcrumbBlock).toContain('.native-breadcrumbs li.is-current span {');
    expect(breadcrumbBlock).toContain('@media (max-width: 640px) {');
    expect(breadcrumbBlock).not.toContain("content: '\\00BB';");
    expect(breadcrumbBlock).not.toContain('background: var(--ag-color-super-grey);');
    expect(breadcrumbBlock).not.toContain('max-width: none;');
  });
});
