import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BrandPage from './BrandPage';

describe('BrandPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the svg download links and copies a brand hex value', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    render(<BrandPage />);

    const downloadLinks = screen.getAllByRole('link', { name: 'Download SVG' });
    expect(downloadLinks).toHaveLength(2);
    expect(downloadLinks[0].getAttribute('download')).toBe('agf-logo.svg');
    expect(downloadLinks[1].getAttribute('download')).toBe('agf-logo-footer.svg');
    expect(screen.getByText('agf-logo-footer.svg')).toBeTruthy();

    const copyButton = screen.getByRole('button', { name: 'Copy Atlantean hex' });
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith('#00ADBB');
    expect(await screen.findByText('Copied')).toBeTruthy();
  });
});
