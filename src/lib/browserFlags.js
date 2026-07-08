export function isApplePlatformNavigator(navigatorImpl) {
  const platform = String(navigatorImpl?.userAgentData?.platform || navigatorImpl?.platform || '');
  const userAgent = String(navigatorImpl?.userAgent || '');
  return /Mac|iPhone|iPad|iPod/i.test(`${platform} ${userAgent}`);
}

export function isSafariBrowserNavigator(navigatorImpl) {
  const userAgent = String(navigatorImpl?.userAgent || '');
  if (!userAgent) {
    return false;
  }
  if (!/AppleWebKit/i.test(userAgent) || !/Safari/i.test(userAgent)) {
    return false;
  }
  return !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Opera|Firefox|FxiOS|SamsungBrowser|DuckDuckGo/i.test(userAgent);
}
