import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteSearchPanel from './SiteSearchPanel';

const mockUseContentAdmin = vi.fn();

vi.mock('../context/ContentAdminContextCore', () => ({
  useContentAdmin: () => mockUseContentAdmin(),
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

const articles = [
  {
    id: 'pineapple-one',
    slug: 'pineapple-one',
    type: 'article',
    title: 'Pineapple One',
    category: 'Resources',
    excerpt: 'The first pineapple guide.',
    isPublished: true,
  },
  {
    id: 'pineapple-two',
    slug: 'pineapple-two',
    type: 'article',
    title: 'Pineapple Two',
    category: 'Resources',
    excerpt: 'The second pineapple guide.',
    isPublished: true,
  },
];

function renderPanel(variant = 'page') {
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <SiteSearchPanel variant={variant} articles={articles} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('SiteSearchPanel keyboard navigation', () => {
  beforeEach(() => {
    mockUseContentAdmin.mockReturnValue({ blocksByPath: {} });
  });

  it('moves the active result with ArrowDown and ArrowUp while keeping focus in the input', async () => {
    renderPanel();

    const input = screen.getByRole('searchbox');
    input.focus();
    fireEvent.change(input, { target: { value: 'pineapple' } });

    await waitFor(() => expect(screen.getByRole('link', { name: 'Pineapple One' })).toBeTruthy());

    const links = [
      screen.getByRole('link', { name: 'Pineapple One' }),
      screen.getByRole('link', { name: 'Pineapple Two' }),
    ];

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(links[0].dataset.keyboardActive).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(links[0].id);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(links[1].dataset.keyboardActive).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(links[0].dataset.keyboardActive).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('opens the highlighted result with Enter', async () => {
    renderPanel();

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'pineapple' } });
    await waitFor(() => expect(screen.getByRole('link', { name: 'Pineapple Two' })).toBeTruthy());

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('location').textContent).toBe('/resources/article/pineapple-one');
  });
});
