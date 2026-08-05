import { describe, expect, it, vi } from 'vitest';
import { buildNextState, parseArgs, parseFieldChanges, runMutation } from './content-admin-update.mjs';

const actor = { userId: 'tester', displayName: 'Test operator' };
const state = {
  blocksByPath: {
    '/services/loans': [{ id: 'hero', settings: { title: 'Old title' } }],
  },
};

function response(payload, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(payload),
  });
}

describe('content-admin-update', () => {
  it('requires an explicit lifecycle mode and reason', () => {
    expect(() => parseArgs(['--route', '/services/loans', '--block', 'hero'])).toThrow(/Mode must be/);
    expect(() => parseArgs([
      '--route', '/services/loans', '--block', 'hero', '--mode', 'draft', '--set', 'title=New',
    ])).toThrow(/reason is required/);
  });

  it('preserves the active state shape while applying only requested settings', () => {
    expect(buildNextState({ state }, '/services/loans', 'hero', { title: 'New title' }))
      .toEqual({
        blocksByPath: {
          '/services/loans': [{ id: 'hero', settings: { title: 'New title' } }],
        },
      });
    expect(parseFieldChanges(['enabled=true', 'count=2', 'label=plain text']))
      .toEqual({ enabled: true, count: 2, label: 'plain text' });
  });

  it('saves draft mode through the authority and verifies the returned active field', async () => {
    const savedState = buildNextState({ state }, '/services/loans', 'hero', { title: 'New title' });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ state }))
      .mockImplementationOnce((_url, request) => {
        expect(JSON.parse(request.body).state).toEqual(savedState);
        return response({ ok: true });
      })
      .mockImplementationOnce(() => response({ state: savedState, baseSnapshot: state, authority: {} }));

    const result = await runMutation({
      route: '/services/loans',
      block: 'hero',
      mode: 'draft',
      set: ['title=New title'],
      reason: 'operator test',
      actor,
      authorityUrl: 'http://authority',
    }, fetchMock);

    expect(result.mode).toBe('draft');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('http://authority/save-draft');
  });

  it('publishes explicitly and verifies the published field', async () => {
    const publishedState = buildNextState({ state }, '/services/loans', 'hero', { title: 'New title' });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response({ state }))
      .mockImplementationOnce(() => response({ ok: true }))
      .mockImplementationOnce(() => response({ state: publishedState, baseSnapshot: state }))
      .mockImplementationOnce((_url, request) => {
        expect(JSON.parse(request.body).pathname).toBe('/services/loans');
        return response({ ok: true });
      })
      .mockImplementationOnce(() => response({ state: publishedState, baseSnapshot: publishedState, authority: {} }));

    const result = await runMutation({
      route: '/services/loans',
      block: 'hero',
      mode: 'publish',
      set: ['title=New title'],
      reason: 'operator test',
      actor,
      authorityUrl: 'http://authority',
    }, fetchMock);

    expect(result.mode).toBe('publish');
    expect(fetchMock.mock.calls[3][0]).toBe('http://authority/publish-page');
  });
});
