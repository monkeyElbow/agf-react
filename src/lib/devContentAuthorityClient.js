const DEV_CONTENT_AUTHORITY_BASE = '/__dev/content-admin';

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function isDevContentAuthorityEnabled() {
  return Boolean(import.meta.env.DEV && import.meta.env.MODE !== 'test');
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function sendJson(pathname, options = {}) {
  const response = await fetch(`${DEV_CONTENT_AUTHORITY_BASE}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return parseJsonResponse(response);
}

export async function fetchSharedContentSnapshot() {
  return sendJson('/state', { method: 'GET' });
}

export async function fetchSharedAnnouncement() {
  return sendJson('/announcement', { method: 'GET' });
}

export async function initializeSharedContentFromSeed(seedState, actor = null) {
  return sendJson('/initialize', {
    method: 'POST',
    body: JSON.stringify({
      seedState: cloneJson(seedState),
      actor: cloneJson(actor),
    }),
  });
}

export async function saveSharedPageDraft(nextState, actor = null, summary = '') {
  return sendJson('/save-draft', {
    method: 'POST',
    body: JSON.stringify({
      state: cloneJson(nextState),
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function saveSharedAnnouncement(announcement, actor = null) {
  return sendJson('/announcement/save', {
    method: 'POST',
    body: JSON.stringify({
      announcement: cloneJson(announcement),
      actor: cloneJson(actor),
    }),
  });
}

export async function publishSharedPage(pathname, actor = null, summary = '') {
  return sendJson('/publish-page', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function syncSharedBlockDraft(pathname, blockId, block, actor = null) {
  return sendJson('/blocks/sync-draft', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      blockId,
      block: cloneJson(block),
      actor: cloneJson(actor),
    }),
  });
}

export async function fetchSharedPageRevisionHistory(pathname) {
  const query = new URLSearchParams({ path: String(pathname || '') });
  return sendJson(`/revisions?${query.toString()}`, { method: 'GET' });
}

export async function fetchSharedContentBackups() {
  return sendJson('/backups', { method: 'GET' });
}

export async function restoreSharedPageRevision(pathname, revisionId, actor = null) {
  return sendJson('/restore-page-revision', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      revisionId,
      actor: cloneJson(actor),
    }),
  });
}

export async function restoreSharedBlockRevision(pathname, revisionId, blockId, actor = null) {
  return sendJson('/restore-block-revision', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      revisionId,
      blockId,
      actor: cloneJson(actor),
    }),
  });
}

export async function acquireSharedBlockLock(pathname, blockId, actor = null, options = {}) {
  return sendJson('/locks/acquire', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      blockId,
      actor: cloneJson(actor),
      force: Boolean(options?.force),
    }),
  });
}

export async function refreshSharedBlockLock(pathname, blockId, actor = null) {
  return sendJson('/locks/refresh', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      blockId,
      actor: cloneJson(actor),
    }),
  });
}

export async function releaseSharedBlockLock(pathname, blockId, actor = null) {
  return sendJson('/locks/release', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      blockId,
      actor: cloneJson(actor),
    }),
  });
}

export async function resetSharedContentFromSeed(seedState, actor = null) {
  return sendJson('/reset', {
    method: 'POST',
    body: JSON.stringify({
      seedState: cloneJson(seedState),
      actor: cloneJson(actor),
    }),
  });
}

export async function restoreSharedContentBackup(backupFileName = '', actor = null) {
  return sendJson('/restore-backup', {
    method: 'POST',
    body: JSON.stringify({
      backupFileName: String(backupFileName || ''),
      actor: cloneJson(actor),
    }),
  });
}

export async function restoreLatestSharedContentBackup(actor = null) {
  return restoreSharedContentBackup('', actor);
}

export async function promoteSharedContentToSeed(actor = null) {
  return sendJson('/promote-seed', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
    }),
  });
}
