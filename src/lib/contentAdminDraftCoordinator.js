/**
 * The single client-side boundary for draft writes.
 *
 * The dev authority may keep separate HTTP routes for compatibility and
 * different timeout budgets, but callers choose one semantic scope and one
 * intent here. In particular, a background block sync must never accidentally
 * become an explicit "saved by admin" operation.
 */

export const CONTENT_DRAFT_SCOPE = Object.freeze({
  PAGE: 'page',
  ROUTE: 'route',
  BLOCK: 'block',
});

export const CONTENT_DRAFT_INTENT = Object.freeze({
  EXPLICIT: 'explicit',
  SYNC: 'sync',
});

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function invalidDraftRequest(error) {
  return { ok: false, error };
}

function normalizeScope(scope) {
  const normalized = String(scope || '').trim().toLowerCase();
  return Object.values(CONTENT_DRAFT_SCOPE).includes(normalized) ? normalized : '';
}

function normalizeIntent(intent) {
  const normalized = String(intent || CONTENT_DRAFT_INTENT.EXPLICIT).trim().toLowerCase();
  return Object.values(CONTENT_DRAFT_INTENT).includes(normalized) ? normalized : '';
}

function requestOptions({ timeoutMs, timeoutMessage, body }) {
  return {
    method: 'POST',
    timeoutMs,
    timeoutMessage,
    body: JSON.stringify(body),
  };
}

/**
 * Build the draft coordinator around the authority client's request function.
 * Keeping the request function injected makes this contract testable without
 * starting Vite and leaves the future DB adapter with the same interface.
 */
export function createContentAdminDraftCoordinator({
  request,
  timeouts = {},
} = {}) {
  if (typeof request !== 'function') {
    throw new TypeError('createContentAdminDraftCoordinator requires a request function');
  }

  const saveTimeoutMs = Number(timeouts.saveMs) || 6000;
  const syncTimeoutMs = Number(timeouts.syncMs) || 3000;

  async function saveDraft(input = {}) {
    const scope = normalizeScope(input.scope);
    const intent = normalizeIntent(input.intent);
    if (!scope) {
      return invalidDraftRequest('invalid-draft-scope');
    }
    if (!intent) {
      return invalidDraftRequest('invalid-draft-intent');
    }
    if (scope !== CONTENT_DRAFT_SCOPE.BLOCK && intent !== CONTENT_DRAFT_INTENT.EXPLICIT) {
      return invalidDraftRequest('invalid-draft-intent-for-scope');
    }

    const actor = cloneJson(input.actor);
    const summary = String(input.summary || '');

    if (scope === CONTENT_DRAFT_SCOPE.PAGE) {
      return request('/save-draft', requestOptions({
        timeoutMs: saveTimeoutMs,
        timeoutMessage: 'Content draft save timed out',
        body: {
          state: cloneJson(input.state),
          actor,
          summary,
        },
      }));
    }

    const pathname = String(input.pathname || '');
    if (!pathname) {
      return invalidDraftRequest(scope === CONTENT_DRAFT_SCOPE.ROUTE
        ? 'invalid-route-draft-request'
        : 'invalid-block-draft-request');
    }

    if (scope === CONTENT_DRAFT_SCOPE.ROUTE) {
      return request('/save-route-draft', requestOptions({
        timeoutMs: saveTimeoutMs,
        timeoutMessage: 'Content route draft save timed out',
        body: {
          pathname,
          state: cloneJson(input.state),
          actor,
          summary,
        },
      }));
    }

    const blockId = String(input.blockId || '');
    if (!blockId) {
      return invalidDraftRequest('invalid-block-draft-request');
    }

    const isSync = intent === CONTENT_DRAFT_INTENT.SYNC;
    return request(isSync ? '/blocks/sync-draft' : '/save-block-draft', requestOptions({
      timeoutMs: isSync ? syncTimeoutMs : saveTimeoutMs,
      timeoutMessage: isSync ? 'Draft sync timed out' : 'Block draft save timed out',
      body: {
        pathname,
        blockId,
        block: cloneJson(input.block),
        actor,
        ...(isSync ? {
          expectedPublishedRevision: String(input.expectedPublishedRevision || ''),
        } : {
          summary,
        }),
      },
    }));
  }

  return Object.freeze({ saveDraft });
}
