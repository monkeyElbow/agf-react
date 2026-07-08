import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acquireSharedBlockLock,
  fetchSharedContentBackups,
  fetchSharedAnnouncement,
  initializeSharedContentFromSeed,
  releaseSharedBlockLock,
  resetSharedContentFromSeed,
  restoreLatestSharedContentBackup,
  restoreSharedBlockRevision,
  restoreSharedContentBackup,
  restoreSharedPageRevision,
  saveSharedAnnouncement,
  saveSharedPageDraft,
  syncSharedBlockDraft,
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

    const payloads = fetchMock.mock.calls.map(([, request]) => JSON.parse(request.body));

    expect(payloads.every((payload) => payload.actor.displayName === 'Sarah MacBook')).toBe(true);
    expect(payloads.every((payload) => payload.actor.userId === 'dev-sarah')).toBe(true);
    expect(payloads[3].force).toBe(true);
    expect(payloads[6].backupFileName).toBe('content-admin-shared-20260708-120000.json');
    expect(payloads[7].backupFileName).toBe('');
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
});
