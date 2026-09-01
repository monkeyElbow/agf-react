import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentAdminContext } from './ContentAdminContextCore';

const { fetchPublishedContentRouteSnapshot, fetchSharedDisclosuresSnapshot } = vi.hoisted(() => ({
  fetchPublishedContentRouteSnapshot: vi.fn(),
  fetchSharedDisclosuresSnapshot: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../lib/devContentAuthorityRuntime', () => ({
  fetchPublishedContentRouteSnapshot,
  fetchSharedDisclosuresSnapshot,
  isDevContentAuthorityEnabled: () => true,
  publishSharedDisclosures: vi.fn(),
  resetSharedDisclosures: vi.fn(),
}));

import { RatesProvider, useRates } from './RatesContext';

function RatesDateProbe() {
  const { ratesMeta } = useRates();
  return <output>{ratesMeta.certificatesEffectiveDate}</output>;
}

describe('RatesProvider published /rates hydration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates global published rates on a lightweight non-rates page', async () => {
    fetchPublishedContentRouteSnapshot.mockResolvedValue({
      initialized: true,
      baseSnapshot: {
        blocksByPath: {
          '/rates': [
            {
              id: 'certificates_table',
              settings: { effectiveDate: 'July 1, 2026', rowsJson: '[]' },
            },
            { id: 'ira_table', settings: { effectiveDate: 'July 1, 2026', rowsJson: '[]' } },
          ],
        },
      },
    });

    render(
      <ContentAdminContext.Provider value={{
        blocksByPath: { '/services/investments': [] },
        authoringBlocksByPath: {},
      }}>
        <RatesProvider><RatesDateProbe /></RatesProvider>
      </ContentAdminContext.Provider>,
    );

    await waitFor(() => expect(screen.getByText('July 1, 2026')).toBeTruthy());
    expect(fetchPublishedContentRouteSnapshot).toHaveBeenCalledWith('/rates');
  });
});
