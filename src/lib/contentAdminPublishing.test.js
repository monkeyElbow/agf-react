import { describe, expect, it } from 'vitest';
import {
  classifyPublishVerification,
  isPublishOperationResponseCurrent,
  normalizePublishStatus,
  PUBLISH_STATUS,
  validatePublishResponse,
} from './contentAdminPublishing';

describe('contentAdminPublishing', () => {
  it('rejects a response for a different operation or scope', () => {
    const request = {
      operationId: 'page-1',
      pathname: '/test',
      scope: 'page',
    };

    expect(validatePublishResponse({ operationId: 'page-2', pathname: '/test', scope: 'page' }, request))
      .toEqual({ ok: false, reason: 'publish-operation-mismatch' });
    expect(validatePublishResponse({ operationId: 'page-1', pathname: '/test', scope: 'block' }, request))
      .toEqual({ ok: false, reason: 'publish-scope-mismatch' });
  });

  it('keeps late operation responses from becoming current', () => {
    expect(isPublishOperationResponseCurrent({ operationId: 'publish-2' }, 'publish-1')).toBe(false);
    expect(isPublishOperationResponseCurrent({ operationId: 'publish-2' }, 'publish-2')).toBe(true);
  });

  it('distinguishes committed, not committed, and unverifiable results', () => {
    expect(classifyPublishVerification({ status: 'committed' })).toBe('COMMITTED');
    expect(classifyPublishVerification({ committed: false })).toBe('NOT_COMMITTED');
    expect(classifyPublishVerification({})).toBe('UNKNOWN');
    expect(normalizePublishStatus(PUBLISH_STATUS.LIVE_CONFIRMED)).toBe(PUBLISH_STATUS.LIVE_CONFIRMED);
    expect(normalizePublishStatus('not-a-status')).toBe(PUBLISH_STATUS.STATUS_UNKNOWN);
  });
});
