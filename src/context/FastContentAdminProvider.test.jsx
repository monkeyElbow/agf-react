import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastContentAdminProvider from './FastContentAdminProvider';
import { useOptionalContentAdmin } from './ContentAdminContextCore';

const heavyProviderMounts = vi.fn();
const { publishedRouteSnapshotFetches } = vi.hoisted(() => ({
  publishedRouteSnapshotFetches: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../lib/devContentAuthorityClient', () => ({
  fetchPublishedContentRouteSnapshot: publishedRouteSnapshotFetches,
}));

vi.mock('./ContentAdminContext', () => ({
  ContentAdminProvider({ children }) {
    heavyProviderMounts();
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
    window.localStorage.clear();
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
});
