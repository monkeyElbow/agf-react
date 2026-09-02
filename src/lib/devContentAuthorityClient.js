import { createContentAdminDraftCoordinator } from './contentAdminDraftCoordinator';
import { getOrCreateDevIdentity } from './devIdentity';

const DEV_CONTENT_AUTHORITY_BASE = '/__dev/content-admin';
// The current dev snapshot is a large JSON document shared over the trusted
// LAN. Five seconds is short enough to turn a slow but valid response into a
// loading loop; save and publish timeouts remain intentionally tighter.
const SHARED_CONTENT_SNAPSHOT_TIMEOUT_MS = 15_000;
const SHARED_DRAFT_SAVE_TIMEOUT_MS = 6000;
const SHARED_DRAFT_SYNC_TIMEOUT_MS = 3000;
const SHARED_PUBLISH_TIMEOUT_MS = 10_000;
const SHARED_PUBLISH_STATUS_TIMEOUT_MS = 5000;
let contentAdminAuthPromise = null;
let contentAdminAuthorityLost = false;

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function isDevContentAuthorityEnabled() {
  return Boolean(import.meta.env.DEV && import.meta.env.MODE !== 'test');
}

async function parseJsonResponse(response, requestUrl) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with ${response.status}`);
    error.code = data?.error || 'content-admin-request-failed';
    error.status = response.status;
    error.payload = data;
    error.endpoint = requestUrl;
    throw error;
  }
  return data;
}

function isAuthorityLossError(error) {
  const payloadError = String(error?.payload?.error || '').trim().toLowerCase();
  const message = String(error?.payload?.details || error?.message || '').trim().toLowerCase();
  return error?.code === 'CONTENT_ADMIN_AUTHORITY_UNAVAILABLE'
    || payloadError === 'content-admin-authority-lost'
    || message.includes('authority ownership was lost');
}

function createAuthorityLostError(requestUrl) {
  const error = new Error('Content-admin authority ownership was lost. Restart the Vite dev server, then refresh this page.');
  error.code = 'content-admin-authority-lost';
  error.endpoint = requestUrl;
  return error;
}

export function resetDevContentAuthorityCircuit() {
  contentAdminAuthorityLost = false;
}

export function isDevContentAuthorityCircuitOpen() {
  return contentAdminAuthorityLost;
}

function readRequestActor(requestOptions = {}) {
  try {
    const payload = JSON.parse(String(requestOptions.body || '{}'));
    return payload?.actor || null;
  } catch {
    return null;
  }
}

async function authenticateDevContentAuthority(actor) {
  if (contentAdminAuthPromise) {
    return contentAdminAuthPromise;
  }

  contentAdminAuthPromise = (async () => {
    const password = typeof window !== 'undefined' && typeof window.prompt === 'function'
      ? window.prompt('Content admin password')
      : '';
    if (!password) {
      const error = new Error('Content admin authentication was cancelled.');
      error.code = 'content-admin-auth-cancelled';
      throw error;
    }

    const response = await fetch(`${DEV_CONTENT_AUTHORITY_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, actor: cloneJson(actor || getOrCreateDevIdentity()) }),
    });
    await parseJsonResponse(response, `${DEV_CONTENT_AUTHORITY_BASE}/auth/login`);
  })();

  try {
    await contentAdminAuthPromise;
  } catch (error) {
    contentAdminAuthPromise = null;
    throw error;
  }
}

async function sendJson(pathname, options = {}) {
  const {
    timeoutMs = 0,
    timeoutMessage = 'Content authority request timed out',
    ...requestOptions
  } = options;
  const requestUrl = `${DEV_CONTENT_AUTHORITY_BASE}${pathname}`;
  if (contentAdminAuthorityLost) {
    throw createAuthorityLostError(requestUrl);
  }
  const controller = timeoutMs > 0 && typeof AbortController === 'function'
    ? new AbortController()
    : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(requestUrl, {
        ...requestOptions,
        credentials: 'same-origin',
        // Published snapshots are the cross-browser source of truth during
        // development. A browser must never satisfy one from its HTTP cache
        // after another operator has saved a newer version.
        cache: requestOptions.cache || 'no-store',
        ...(controller ? { signal: controller.signal } : {}),
        headers: {
          'Content-Type': 'application/json',
          ...(requestOptions.headers || {}),
        },
      });
      if (response.status === 401 && attempt === 0) {
        await authenticateDevContentAuthority(readRequestActor(requestOptions));
        continue;
      }
      return await parseJsonResponse(response, requestUrl);
    }
    throw new Error('Content authority authentication retry failed.');
  } catch (error) {
    if (isAuthorityLossError(error)) {
      contentAdminAuthorityLost = true;
      if (error.code !== 'content-admin-authority-lost') {
        error.code = 'content-admin-authority-lost';
      }
    }
    if (controller?.signal.aborted) {
      const timeoutError = new Error(timeoutMessage);
      timeoutError.code = 'content-admin-request-timeout';
      timeoutError.endpoint = requestUrl;
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

const contentAdminDraftCoordinator = createContentAdminDraftCoordinator({
  request: sendJson,
  timeouts: {
    saveMs: SHARED_DRAFT_SAVE_TIMEOUT_MS,
    syncMs: SHARED_DRAFT_SYNC_TIMEOUT_MS,
  },
});

export function saveSharedDraft(request) {
  return contentAdminDraftCoordinator.saveDraft(request);
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

export async function fetchRenderConvergenceContract(pathname) {
  const normalizedPath = String(pathname || '').trim() || '/';
  return sendJson('/render-contract?path=' + encodeURIComponent(normalizedPath), {
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
  return saveSharedDraft({
    scope: 'page',
    state: nextState,
    actor,
    summary,
  });
}

export async function saveSharedRouteDraft(pathname, routeState, actor = null, summary = '') {
  return saveSharedDraft({
    scope: 'route',
    pathname,
    state: routeState,
    actor,
    summary,
  });
}

export async function saveSharedBlockDraft(pathname, blockId, block, actor = null, summary = '') {
  return saveSharedDraft({
    scope: 'block',
    intent: 'explicit',
    pathname,
    blockId,
    block,
    actor,
    summary,
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

export async function saveSharedDisclosuresLive(patch, actor = null) {
  return sendJson('/disclosures/save-live', {
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

export async function syncSharedBlockDraft(pathname, blockId, block, actor = null, options = {}) {
  return saveSharedDraft({
    scope: 'block',
    intent: 'sync',
    pathname,
    blockId,
    block,
    actor,
    expectedPublishedRevision: options?.expectedPublishedRevision,
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

export async function migrateQcdCenteredCardGridSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-qcd-centered-card-grid', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateOnlineContributionsStepsSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-online-contributions-step-cards', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateNumberedStepCardsSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-numbered-step-cards', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateSiteFeatureCollectionsSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-site-feature-collections', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateServicesMattersBillboardSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-services-matters-billboard', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateServicesDirectorySnapshot(actor = null, reason = '') {
  return sendJson('/migrate-services-directory', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateSupportLibrarySnapshot(actor = null, reason = '') {
  return sendJson('/migrate-support-library', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateCgaSecureActCardSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-cga-secure-act-card', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateInsuranceCoverageCtaSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-insurance-coverage-cta', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateInsuranceFeatureColumnsSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-insurance-feature-columns', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
    }),
  });
}

export async function migrateInsurancePcResourceCardsSnapshot(actor = null, reason = '') {
  return sendJson('/migrate-insurance-pc-resource-card-lists', {
    method: 'POST',
    body: JSON.stringify({
      actor: cloneJson(actor),
      reason: String(reason || '').trim(),
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
