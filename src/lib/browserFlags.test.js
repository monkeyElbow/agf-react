import { describe, expect, it } from 'vitest';
import { isApplePlatformNavigator, isSafariBrowserNavigator } from './browserFlags';

describe('browserFlags', () => {
  it('detects Apple platforms from navigator platform or user agent data', () => {
    expect(
      isApplePlatformNavigator({
        userAgentData: { platform: 'macOS' },
        userAgent: 'Mozilla/5.0',
      }),
    ).toBe(true);
    expect(
      isApplePlatformNavigator({
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }),
    ).toBe(false);
  });

  it('detects Safari without matching Chrome-family browsers', () => {
    expect(
      isSafariBrowserNavigator({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      }),
    ).toBe(true);
    expect(
      isSafariBrowserNavigator({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      }),
    ).toBe(false);
    expect(
      isSafariBrowserNavigator({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.0.0 Mobile/15E148 Safari/604.1',
      }),
    ).toBe(false);
  });
});
