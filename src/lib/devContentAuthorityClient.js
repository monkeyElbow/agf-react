const DEV_CONTENT_AUTHORITY_BASE = '/__dev/content-admin';
const SHARED_CONTENT_SNAPSHOT_TIMEOUT_MS = 5000;
const SHARED_DRAFT_SAVE_TIMEOUT_MS = 6000;
const SHARED_DRAFT_SYNC_TIMEOUT_MS = 3000;
const SHARED_PUBLISH_TIMEOUT_MS = 10_000;
const SHARED_PUBLISH_STATUS_TIMEOUT_MS = 5000;

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
  const {
    timeoutMs = 0,
    timeoutMessage = 'Content authority request timed out',
    ...requestOptions
  } = options;
  const controller = timeoutMs > 0 && typeof AbortController === 'function'
    ? new AbortController()
    : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const response = await fetch(`${DEV_CONTENT_AUTHORITY_BASE}${pathname}`, {
    ...requestOptions,
    ...(controller ? { signal: controller.signal } : {}),
    headers: {
      'Content-Type': 'application/json',
      ...(requestOptions.headers || {}),
    },
    });
    return parseJsonResponse(response);
  } catch (error) {
    if (controller?.signal.aborted) {
      const timeoutError = new Error(timeoutMessage);
      timeoutError.code = 'content-admin-request-timeout';
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchSharedContentSnapshot() {
  return sendJson('/state', {
    method: 'GET',
    timeoutMs: SHARED_CONTENT_SNAPSHOT_TIMEOUT_MS,
  });
}

export async function fetchSharedContentRouteSnapshot(pathname) {
  const normalizedPath = String(pathname || '').trim() || '/';
  return sendJson(`/route-state?path=${encodeURIComponent(normalizedPath)}`, {
    method: 'GET',
    timeoutMs: SHARED_CONTENT_SNAPSHOT_TIMEOUT_MS,
  });
}

export async function fetchPublishedContentRouteSnapshot(pathname) {
  const normalizedPath = String(pathname || '').trim() || '/';
  return sendJson(`/published-route?path=${encodeURIComponent(normalizedPath)}`, {
    method: 'GET',
    timeoutMs: SHARED_CONTENT_SNAPSHOT_TIMEOUT_MS,
  });
}

export async function fetchSharedContentAuthorityMetadata() {
  return sendJson('/metadata', { method: 'GET' });
}

export async function fetchSharedDisclosuresSnapshot() {
  return sendJson('/disclosures/state', { method: 'GET' });
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
    timeoutMs: SHARED_DRAFT_SAVE_TIMEOUT_MS,
    timeoutMessage: 'Content draft save timed out',
    body: JSON.stringify({
      state: cloneJson(nextState),
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function saveSharedRouteDraft(pathname, routeState, actor = null, summary = '') {
  return sendJson('/save-route-draft', {
    method: 'POST',
    timeoutMs: SHARED_DRAFT_SAVE_TIMEOUT_MS,
    timeoutMessage: 'Content route draft save timed out',
    body: JSON.stringify({
      pathname: String(pathname || ''),
      state: cloneJson(routeState),
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function saveSharedBlockDraft(pathname, blockId, block, actor = null, summary = '') {
  return sendJson('/save-block-draft', {
    method: 'POST',
    timeoutMs: SHARED_DRAFT_SAVE_TIMEOUT_MS,
    timeoutMessage: 'Block draft save timed out',
    body: JSON.stringify({
      pathname: String(pathname || ''),
      blockId: String(blockId || ''),
      block: cloneJson(block),
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function discardSharedPageDraft(pathname, actor = null, summary = '') {
  return sendJson('/discard-draft', {
    method: 'POST',
    body: JSON.stringify({
      pathname: String(pathname || ''),
      actor: cloneJson(actor),
      summary: String(summary || ''),
    }),
  });
}

export async function discardSharedBlockDraft(pathname, blockId, actor = null, summary = '') {
  return sendJson('/discard-block-draft', {
    method: 'POST',
    body: JSON.stringify({
      pathname: String(pathname || ''),
      blockId: String(blockId || ''),
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

export async function saveSharedDisclosures(patch, actor = null) {
  return sendJson('/disclosures/save', {
    method: 'POST',
    body: JSON.stringify({
      patch: cloneJson(patch),
      actor: cloneJson(actor),
    }),
  });
}

export async function resetSharedDisclosures(actor = null) {
  return sendJson('/disclosures/reset', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
    }),
  });
}

export async function restoreSharedDisclosuresDraftFromLive(actor = null) {
  return sendJson('/disclosures/restore-live', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
    }),
  });
}

export async function publishSharedDisclosures(actor = null) {
  return sendJson('/disclosures/publish', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
    }),
  });
}

export async function publishSharedPage(pathname, actor = null, summary = '', options = {}) {
  return sendJson('/publish-page', {
    method: 'POST',
    timeoutMs: SHARED_PUBLISH_TIMEOUT_MS,
    timeoutMessage: 'Live publish timed out',
    body: JSON.stringify({
      pathname,
      actor: cloneJson(actor),
      summary: String(summary || ''),
      operationId: String(options.operationId || ''),
      expectedDraftRevision: String(options.expectedDraftRevision || ''),
    }),
  });
}

export async function migrateSharedGenerosityFundSnapshot(defaultState, actor = null, reason = '') {
  return sendJson('/migrate-generosity-fund-snapshot', {
    method: 'POST',
    body: JSON.stringify({
      defaultState: cloneJson(defaultState),
      actor: cloneJson(actor),
      reason: String(reason || ''),
    }),
  });
}

export async function publishSharedBlock(pathname, blockId, actor = null, summary = '', expectedBlock = null, options = {}) {
  const publishOptions = options?.operationId
    ? options
    : expectedBlock?.operationId
      ? expectedBlock
      : {};
  const expectedBlockPayload = publishOptions === expectedBlock ? null : expectedBlock;
  return sendJson('/publish-block', {
    method: 'POST',
    timeoutMs: SHARED_PUBLISH_TIMEOUT_MS,
    timeoutMessage: 'Live publish timed out',
    body: JSON.stringify({
      pathname,
      blockId,
      actor: cloneJson(actor),
      summary: String(summary || ''),
      expectedBlock: cloneJson(expectedBlockPayload),
      operationId: String(publishOptions.operationId || ''),
      expectedDraftRevision: String(publishOptions.expectedDraftRevision || ''),
    }),
  });
}

export async function fetchSharedPublishStatus(operationId) {
  const normalizedOperationId = String(operationId || '').trim();
  return sendJson(`/publish-status?operationId=${encodeURIComponent(normalizedOperationId)}`, {
    method: 'GET',
    timeoutMs: SHARED_PUBLISH_STATUS_TIMEOUT_MS,
    timeoutMessage: 'Publish status verification timed out',
  });
}

export async function syncSharedBlockDraft(pathname, blockId, block, actor = null) {
  return sendJson('/blocks/sync-draft', {
    method: 'POST',
    timeoutMs: SHARED_DRAFT_SYNC_TIMEOUT_MS,
    timeoutMessage: 'Draft sync timed out',
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

export async function releaseSharedBlockDraft(pathname, blockId, actor = null, options = {}) {
  return sendJson('/blocks/release-draft', {
    method: 'POST',
    body: JSON.stringify({
      pathname,
      blockId,
      actor: cloneJson(actor),
      force: Boolean(options?.force),
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
