import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RouteErrorBoundary from './RouteErrorBoundary';

function BrokenRoute() {
  throw new Error('Failed to fetch dynamically imported module');
}

describe('RouteErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps a route failure visible with a refresh action instead of a white page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RouteErrorBoundary>
        <BrokenRoute />
      </RouteErrorBoundary>,
    );

    expect(screen.getByRole('alert').textContent).toContain('Refresh needed to open this page.');
    expect(screen.getByText('Failed to fetch dynamically imported module')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh page' })).toBeTruthy();
  });
});
