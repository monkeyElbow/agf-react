import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastContentAdminProvider from './FastContentAdminProvider';
import { useOptionalContentAdmin } from './ContentAdminContextCore';

const heavyProviderMounts = vi.fn();
const { publishedRouteSnapshotFetches, heavyProviderThrows } = vi.hoisted(() => ({
  publishedRouteSnapshotFetches: vi.fn(() => Promise.resolve(null)),
  heavyProviderThrows: vi.fn(() => false),
}));

vi.mock('../lib/devContentAuthorityClient', () => ({
  fetchPublishedContentRouteSnapshot: publishedRouteSnapshotFetches,
}));

vi.mock('./ContentAdminContext', () => ({
  ContentAdminProvider({ children }) {
    heavyProviderMounts();
    if (heavyProviderThrows()) {
      throw new Error('content-admin module failed');
    }
    return <div data-testid="heavy-provider">{children}</div>;
  },
}));

function Probe() {
  const context = useOptionalContentAdmin();
  return <button type="button" onClick={() => context?.activateAdminProvider?.()}>Activate admin</button>;
}

describe('FastContentAdminProvider', () => {
  beforeEach(() => {
    heavyProviderMounts.mockClear();
    publishedRouteSnapshotFetches.mockClear();
    heavyProviderThrows.mockReturnValue(false);
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('does not mount the full admin provider during ordinary public startup', async () => {
    render(
      <FastContentAdminProvider>
        <Probe />
      </FastContentAdminProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heavyProviderMounts).not.toHaveBeenCalled();
    expect(screen.queryByTestId('heavy-provider')).toBeNull();
    expect(publishedRouteSnapshotFetches).toHaveBeenCalled();
  });

  it('loads the full provider only after explicit admin activation', async () => {
    render(
      <FastContentAdminProvider>
        <Probe />
      </FastContentAdminProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Activate admin' }));
    await waitFor(() => expect(screen.getByTestId('heavy-provider')).toBeTruthy());
    expect(heavyProviderMounts).toHaveBeenCalledTimes(1);
  });

  it('does not mount admin pages against the incomplete fast context while loading', async () => {
    window.history.pushState({}, '', '/admin/content');

    render(
      <FastContentAdminProvider>
        <div data-testid="admin-child">Admin page</div>
      </FastContentAdminProvider>,
    );

    expect(screen.getByLabelText('Loading AGFinancial...')).toBeTruthy();
    expect(screen.queryByTestId('admin-child')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('heavy-provider')).toBeTruthy());
  });

  it('activates the full provider when public navigation enters an admin route', async () => {
    render(
      <FastContentAdminProvider>
        <div data-testid="admin-child">Admin page</div>
      </FastContentAdminProvider>,
    );

    act(() => {
      window.history.pushState({}, '', '/admin/content');
    });

    expect(screen.getByLabelText('Loading AGFinancial...')).toBeTruthy();
    expect(screen.queryByTestId('admin-child')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('heavy-provider')).toBeTruthy());
  });

  it('keeps a public route available when the activated admin provider fails', async () => {
    window.localStorage.setItem('agf-admin-front-hud-enabled-v1', 'true');
    heavyProviderThrows.mockReturnValue(true);

    render(
      <FastContentAdminProvider>
        <div data-testid="public-child">Public page</div>
      </FastContentAdminProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('public-child')).toBeTruthy());
    expect(screen.queryByText('Admin tools could not finish loading.')).toBeNull();
  });
});
