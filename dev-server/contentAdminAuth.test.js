import { describe, expect, it } from 'vitest';
import {
  CONTENT_ADMIN_SESSION_COOKIE,
  createContentAdminSessionManager,
} from './contentAdminAuth.js';

const actor = {
  userId: 'dev-one',
  displayName: 'Admin One',
  initials: 'AO',
  accentColor: '#00adbb',
};

describe('content-admin sessions', () => {
  it('requires configured password and valid actor', () => {
  const manager = createContentAdminSessionManager({ password: 'correct horse' });
    expect(manager.login('wrong', actor).error).toBe('content-admin-auth-invalid');
    expect(manager.login('correct horse', null).error).toBe('content-admin-auth-invalid');
  });

  it('issues HttpOnly same-site cookies', () => {
    const manager = createContentAdminSessionManager({
      password: 'correct horse',
      randomId: () => 'session-1',
    });
    const login = manager.login('correct horse', actor);
    expect(login.ok).toBe(true);
    const cookie = manager.cookieHeader(login.sessionId);
    expect(cookie).toMatch(new RegExp(`^${CONTENT_ADMIN_SESSION_COOKIE}=`));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(manager.authenticate(cookie).session.actor).toEqual(actor);
  });

  it('does not authenticate expired sessions', () => {
    let timestamp = 1000;
    const manager = createContentAdminSessionManager({
      password: 'correct horse',
      now: () => timestamp,
      maxAgeMs: 100,
      randomId: () => 'session-1',
    });
    const login = manager.login('correct horse', actor);
    expect(manager.authenticate(manager.cookieHeader(login.sessionId)).ok).toBe(true);
    timestamp += 101;
    expect(manager.authenticate(manager.cookieHeader(login.sessionId)).ok).toBe(false);
  });
});
