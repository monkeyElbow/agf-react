import { describe, expect, it } from 'vitest';
import {
  isContentAdminPublicPublishedRead,
  isSameOriginContentAdminRequest,
  shouldAllowUnauthenticatedContentAdminRequest,
} from './contentAdminHttpBoundary.js';

describe('content-admin HTTP boundary policy', () => {
  it('allows only published/public GET reads without a session', () => {
    expect(isContentAdminPublicPublishedRead('GET', '/published-route')).toBe(true);
    expect(isContentAdminPublicPublishedRead('GET', '/announcement')).toBe(true);
    expect(isContentAdminPublicPublishedRead('GET', '/disclosures/state')).toBe(true);
    expect(isContentAdminPublicPublishedRead('POST', '/published-route')).toBe(false);
    expect(isContentAdminPublicPublishedRead('GET', '/state')).toBe(false);
  });

  it('allows the trusted development LAN before password auth is introduced', () => {
    expect(shouldAllowUnauthenticatedContentAdminRequest({
      sessionConfigured: false,
    })).toBe(true);
    expect(shouldAllowUnauthenticatedContentAdminRequest({
      sessionConfigured: false,
      sessionConfigured: true,
    })).toBe(false);
  });

  it('rejects cross-origin content-admin requests while allowing same-origin and omitted origin', () => {
    expect(isSameOriginContentAdminRequest({ origin: '', host: 'localhost:5173' })).toBe(true);
    expect(isSameOriginContentAdminRequest({ origin: 'http://localhost:5173', host: 'localhost:5173' })).toBe(true);
    expect(isSameOriginContentAdminRequest({ origin: 'http://evil.example', host: 'localhost:5173' })).toBe(false);
  });
});
