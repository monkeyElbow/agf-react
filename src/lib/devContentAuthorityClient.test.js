import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acquireSharedBlockLock,
  fetchSharedContentBackups,
  fetchSharedAnnouncement,
  initializeSharedContentFromSeed,
  migrateInsuranceCoverageCtaSnapshot,
  migrateSharedGenerosityFundSnapshot,
  publishSharedBlock,
  publishSharedPage,
  promoteSharedContentToSeed,
  releaseSharedBlockLock,
  resetSharedContentFromSeed,
  restoreLatestSharedContentBackup,
  restoreSharedBlockRevision,
  restoreSharedContentBackup,
  restoreSharedPageRevision,
  saveSharedAnnouncement,
  saveSharedBlockDraft,
  saveSharedPageDraft,
  saveSharedRouteDraft,
  syncSharedBlockDraft,
  fetchSharedPublishStatus,
} from './devContentAuthorityClient';

describe('devContentAuthorityClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes readable dev identity metadata on shared draft saves', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await saveSharedPageDraft(
      { blocksByPath: { '/services/loans': [] } },
      {
        userId: 'dev-james',
        displayName: 'James Laptop',
        initials: 'JL',
        accentColor: '#faa31a',
      },
      'updated draft',
    );

    const [, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(payload.actor.displayName).toBe('James Laptop');
    expect(payload.actor.userId).toBe('dev-james');
    expect(payload.summary).toBe('updated draft');
  });

  it('attaches actor metadata to reset, restore, and lock requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const actor = {
      userId: 'dev-sarah',
      displayName: 'Sarah MacBook',
      initials: 'SM',
      accentColor: '#00adbb',
    };

    await initializeSharedContentFromSeed({}, actor);
    await restoreSharedPageRevision('/services/loans', 'rev-page-1', actor);
    await restoreSharedBlockRevision('/services/loans', 'rev-block-1', 'hero', actor);
    await acquireSharedBlockLock('/services/loans', 'hero', actor, { force: true });
    await releaseSharedBlockLock('/services/loans', 'hero', actor);
    await resetSharedContentFromSeed({}, actor);
    await restoreSharedContentBackup('content-admin-shared-20260708-120000.json', actor);
    await restoreLatestSharedContentBackup(actor);
    await promoteSharedContentToSeed(actor);

    const payloads = fetchMock.mock.calls.map(([, request]) => JSON.parse(request.body));

    expect(payloads.every((payload) => payload.actor.displayName === 'Sarah MacBook')).toBe(true);
    expect(payloads.every((payload) => payload.actor.userId === 'dev-sarah')).toBe(true);
    expect(payloads[3].force).toBe(true);
    expect(payloads[6].backupFileName).toBe('content-admin-shared-20260708-120000.json');
    expect(payloads[7].backupFileName).toBe('');
    expect(payloads[8].actor.displayName).toBe('Sarah MacBook');
  });

  it('sends block-scoped draft sync payloads for active editor changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const actor = {
      userId: 'dev-taylor',
      displayName: 'Taylor QA',
      initials: 'TQ',
      accentColor: '#00adbb',
    };

    await syncSharedBlockDraft('/services/loans', 'hero', {
      id: 'hero',
      kind: 'hero',
      settings: {
        line1Text: 'HUD synced title',
      },
    }, actor);

    const [url, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(url).toContain('/blocks/sync-draft');
    expect(payload.pathname).toBe('/services/loans');
    expect(payload.blockId).toBe('hero');
    expect(payload.block.settings.line1Text).toBe('HUD synced title');
    expect(payload.actor.displayName).toBe('Taylor QA');
  });

  it('sends the published revision fence with block draft syncs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await syncSharedBlockDraft('/services/loans', 'hero', { id: 'hero' }, null, {
      expectedPublishedRevision: 'abc123',
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.expectedPublishedRevision).toBe('abc123');
  });

  it('sends a distinct block-scoped draft save request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await saveSharedBlockDraft('/services/loans', 'hero', {
      id: 'hero',
      kind: 'hero',
      settings: { line1Text: 'Saved hero title' },
    }, { userId: 'dev-taylor' }, 'Save hero block');

    const [url, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(url).toContain('/save-block-draft');
    expect(payload.blockId).toBe('hero');
    expect(payload.summary).toBe('Save hero block');
    expect(payload.block.settings.line1Text).toBe('Saved hero title');
  });

  it('bounds live publish requests so a stalled authority cannot hold the editor forever', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation((_url, request) => new Promise((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      const request = publishSharedBlock('/test', 'billboard', {
        userId: 'dev-taylor',
        displayName: 'Taylor QA',
      });
      const rejection = expect(request).rejects.toMatchObject({
        code: 'content-admin-request-timeout',
      });
      await vi.advanceTimersByTimeAsync(10_001);
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it('bounds draft saves so a stalled authority fails quickly', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation((_url, request) => new Promise((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      const pageSave = saveSharedPageDraft({ blocksByPath: { '/test': [] } }, { userId: 'dev-taylor' });
      const routeSave = saveSharedRouteDraft('/test', { blocksByPath: { '/test': [] } }, { userId: 'dev-taylor' });
      const pageRejection = expect(pageSave).rejects.toMatchObject({
        code: 'content-admin-request-timeout',
      });
      const routeRejection = expect(routeSave).rejects.toMatchObject({
        code: 'content-admin-request-timeout',
      });
      await vi.advanceTimersByTimeAsync(6001);
      await pageRejection;
      await routeRejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends publish operation identity and supports scoped status verification', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, status: 'committed', committed: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await publishSharedPage('/services/loans', { userId: 'dev-taylor' }, 'publish page', {
      operationId: 'page-operation-1',
      expectedDraftRevision: 'draft-revision-10',
    });
    await fetchSharedPublishStatus('page-operation-1');

    const [publishUrl, publishRequest] = fetchMock.mock.calls[0];
    const [statusUrl, statusRequest] = fetchMock.mock.calls[1];
    const payload = JSON.parse(publishRequest.body);

    expect(publishUrl).toContain('/publish-page');
    expect(payload.operationId).toBe('page-operation-1');
    expect(payload.expectedDraftRevision).toBe('draft-revision-10');
    expect(statusUrl).toContain('/publish-status?operationId=page-operation-1');
    expect(statusRequest.method).toBe('GET');
  });

  it('uses the dedicated shared announcement endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchSharedAnnouncement();
    await saveSharedAnnouncement({
      enabled: true,
      message: 'Shared network banner',
    });

    const [readUrl] = fetchMock.mock.calls[0];
    const [saveUrl, saveRequest] = fetchMock.mock.calls[1];
    const payload = JSON.parse(saveRequest.body);

    expect(readUrl).toContain('/announcement');
    expect(saveUrl).toContain('/announcement/save');
    expect(payload.announcement.message).toBe('Shared network banner');
  });

  it('uses the dedicated shared backup endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, backups: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchSharedContentBackups();

    const [readUrl, readRequest] = fetchMock.mock.calls[0];
    expect(readUrl).toContain('/backups');
    expect(readRequest.method).toBe('GET');
  });

  it('uses the dedicated seed promotion endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await promoteSharedContentToSeed({
      userId: 'dev-jordan',
      displayName: 'Jordan QA',
      initials: 'JQ',
      accentColor: '#00adbb',
    });

    const [url, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(url).toContain('/promote-seed');
    expect(request.method).toBe('POST');
    expect(payload.actor.userId).toBe('dev-jordan');
  });

  it('uses the explicit versioned Generosity Fund snapshot migration endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await migrateSharedGenerosityFundSnapshot(
      { blocksByPath: { '/services/planned-giving/donor-advised-fund': [] } },
      {
        userId: 'dev-jordan',
        displayName: 'Jordan QA',
      },
      'one-time snapshot migration',
    );

    const [url, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(url).toContain('/migrate-generosity-fund-snapshot');
    expect(request.method).toBe('POST');
    expect(payload.defaultState.blocksByPath['/services/planned-giving/donor-advised-fund']).toEqual([]);
    expect(payload.reason).toBe('one-time snapshot migration');
    expect(payload.actor.userId).toBe('dev-jordan');
  });

  it('uses the explicit versioned insurance CTA snapshot migration endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await migrateInsuranceCoverageCtaSnapshot(
      {
        userId: 'dev-jordan',
        displayName: 'Jordan QA',
      },
      'repair published insurance CTA field schema',
    );

    const [url, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(url).toContain('/migrate-insurance-coverage-cta');
    expect(request.method).toBe('POST');
    expect(payload.reason).toBe('repair published insurance CTA field schema');
    expect(payload.actor.userId).toBe('dev-jordan');
  });
});
