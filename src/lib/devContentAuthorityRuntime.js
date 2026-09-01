let clientPromise = null;

function loadClient() {
  if (!import.meta.env.DEV) {
    return Promise.resolve(null);
  }
  clientPromise ||= import('./devContentAuthorityClient');
  return clientPromise;
}

function unavailableClientError() {
  return new Error('Development content authority is unavailable outside Vite development mode.');
}

export function isDevContentAuthorityEnabled() {
  return Boolean(import.meta.env.DEV && import.meta.env.MODE !== 'test');
}

export async function fetchPublishedContentRouteSnapshot(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.fetchPublishedContentRouteSnapshot(...args);
}

export async function fetchSharedAnnouncement(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.fetchSharedAnnouncement(...args);
}

export async function saveSharedAnnouncement(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.saveSharedAnnouncement(...args);
}

export async function fetchSharedDisclosuresSnapshot(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.fetchSharedDisclosuresSnapshot(...args);
}

export async function saveSharedDisclosures(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.saveSharedDisclosures(...args);
}

export async function saveSharedDisclosuresLive(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.saveSharedDisclosuresLive(...args);
}

export async function resetSharedDisclosures(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.resetSharedDisclosures(...args);
}

export async function restoreSharedDisclosuresDraftFromLive(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.restoreSharedDisclosuresDraftFromLive(...args);
}

export async function publishSharedDisclosures(...args) {
  const client = await loadClient();
  if (!client) throw unavailableClientError();
  return client.publishSharedDisclosures(...args);
}
