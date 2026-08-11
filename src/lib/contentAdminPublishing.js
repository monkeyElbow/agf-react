export const PUBLISH_STATUS = Object.freeze({
  LOCAL_DIRTY: 'LOCAL_DIRTY',
  SAVING_DRAFT: 'SAVING_DRAFT',
  DRAFT_SYNCED: 'DRAFT_SYNCED',
  PUBLISHING: 'PUBLISHING',
  LIVE_CONFIRMED: 'LIVE_CONFIRMED',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  STATUS_UNKNOWN: 'STATUS_UNKNOWN',
  VERIFYING: 'VERIFYING',
});

export function createPublishOperationId(prefix = 'publish') {
  const normalizedPrefix = String(prefix || 'publish').trim() || 'publish';
  const randomUuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${normalizedPrefix}-${randomUuid}`;
}

export function normalizePublishRequest({
  operationId = '',
  pathname = '',
  scope = 'page',
  blockId = '',
  expectedDraftRevision = '',
} = {}) {
  return {
    operationId: String(operationId || '').trim(),
    pathname: String(pathname || '').trim(),
    scope: scope === 'block' ? 'block' : 'page',
    blockId: String(blockId || '').trim(),
    expectedDraftRevision: String(expectedDraftRevision || '').trim(),
  };
}

export function validatePublishResponse(response, request) {
  const normalizedRequest = normalizePublishRequest(request);
  const normalizedResponse = response && typeof response === 'object' ? response : {};
  const responseOperationId = String(normalizedResponse.operationId || '').trim();
  const responsePathname = String(normalizedResponse.pathname || '').trim();
  const responseScope = String(normalizedResponse.scope || '').trim();
  const responseBlockId = String(normalizedResponse.blockId || '').trim();
  if (normalizedRequest.operationId && responseOperationId !== normalizedRequest.operationId) {
    return { ok: false, reason: 'publish-operation-mismatch' };
  }
  if (responsePathname && responsePathname !== normalizedRequest.pathname) {
    return { ok: false, reason: 'publish-path-mismatch' };
  }
  if (responseScope && responseScope !== normalizedRequest.scope) {
    return { ok: false, reason: 'publish-scope-mismatch' };
  }
  if (normalizedRequest.scope === 'block' && responseBlockId && responseBlockId !== normalizedRequest.blockId) {
    return { ok: false, reason: 'publish-block-mismatch' };
  }
  return { ok: true };
}

export function isPublishOperationResponseCurrent(response, latestOperationId = '') {
  const normalizedLatest = String(latestOperationId || '').trim();
  if (!normalizedLatest) return true;
  return String(response?.operationId || '').trim() === normalizedLatest;
}

export function normalizePublishStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  return Object.values(PUBLISH_STATUS).includes(normalized)
    ? normalized
    : PUBLISH_STATUS.STATUS_UNKNOWN;
}

export function classifyPublishVerification(response) {
  if (response?.committed === true || response?.status === 'committed') return 'COMMITTED';
  if (response?.committed === false || response?.status === 'not-committed') return 'NOT_COMMITTED';
  return 'UNKNOWN';
}
