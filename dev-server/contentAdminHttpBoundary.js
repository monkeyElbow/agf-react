export const CONTENT_ADMIN_PUBLIC_READ_PATHS = Object.freeze([
  '/published-route',
  '/announcement',
  '/disclosures/state',
]);

export function isContentAdminPublicPublishedRead(method, pathname) {
  return String(method || '').toUpperCase() === 'GET'
    && CONTENT_ADMIN_PUBLIC_READ_PATHS.includes(String(pathname || '').trim());
}

export function shouldAllowUnauthenticatedContentAdminRequest({
  sessionConfigured = false,
} = {}) {
  // This is a trusted development LAN workflow. A configured password remains
  // an opt-in boundary for any host that should not receive anonymous admin
  // access; local development does not require an account system yet.
  return !sessionConfigured;
}

export function isSameOriginContentAdminRequest({ origin = '', host = '' } = {}) {
  const normalizedOrigin = String(origin || '').trim();
  if (!normalizedOrigin) return true;
  try {
    return new URL(normalizedOrigin).host === String(host || '').trim();
  } catch {
    return false;
  }
}
