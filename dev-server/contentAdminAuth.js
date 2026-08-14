import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const CONTENT_ADMIN_SESSION_COOKIE = 'agf_content_admin_session';
export const CONTENT_ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) return null;
  const rawUserId = String(source.userId || '').trim();
  const rawDisplayName = String(source.displayName || '').trim();
  const isLegacyYourmom = rawUserId === 'dev-d018b3e9-dcae-4181-82c4-7946f2eb3125'
    || /^yourmom$/i.test(rawDisplayName);
  const userId = isLegacyYourmom ? 'dev-user-1' : rawUserId;
  const displayName = isLegacyYourmom ? 'James' : rawDisplayName;
  if (!userId || !displayName) return null;
  return {
    userId,
    displayName,
    initials: String(source.initials || '').trim() || displayName.slice(0, 2).toUpperCase(),
    accentColor: String(source.accentColor || '').trim() || '#00adbb',
  };
}

function hashSecret(value) {
  return createHash('sha256').update(String(value || '')).digest();
}

function secretsEqual(left, right) {
  const leftHash = hashSecret(left);
  const rightHash = hashSecret(right);
  return timingSafeEqual(leftHash, rightHash);
}

function readCookie(cookieHeader, cookieName) {
  const prefix = `${cookieName}=`;
  return String(cookieHeader || '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

export function createContentAdminSessionManager({
  password = process.env.CONTENT_ADMIN_DEV_PASSWORD || '',
  now = () => Date.now(),
  randomId = () => randomBytes(32).toString('base64url'),
  maxAgeMs = CONTENT_ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
} = {}) {
  const configuredPassword = String(password || '');
  const sessions = new Map();

  function pruneExpiredSessions(timestamp = now()) {
    sessions.forEach((session, sessionId) => {
      if (timestamp - session.createdAt > maxAgeMs) {
        sessions.delete(sessionId);
      }
    });
  }

  function login(candidatePassword, actor) {
    if (!configuredPassword) {
      return {
        ok: false,
        status: 503,
        error: 'content-admin-auth-not-configured',
        details: 'Set CONTENT_ADMIN_DEV_PASSWORD before exposing the content-admin server to other devices.',
      };
    }

    const normalizedActor = normalizeActor(actor);
    if (!normalizedActor || !secretsEqual(candidatePassword, configuredPassword)) {
      return {
        ok: false,
        status: 401,
        error: 'content-admin-auth-invalid',
        details: 'The content-admin password or development identity is invalid.',
      };
    }

    pruneExpiredSessions();
    const sessionId = randomId();
    const createdAt = now();
    sessions.set(sessionId, {
      sessionId,
      actor: normalizedActor,
      createdAt,
    });
    return {
      ok: true,
      sessionId,
      actor: clone(normalizedActor),
      createdAt,
      expiresAt: createdAt + maxAgeMs,
    };
  }

  function getSession(cookieHeader) {
    pruneExpiredSessions();
    const sessionId = readCookie(cookieHeader, CONTENT_ADMIN_SESSION_COOKIE);
    if (!sessionId) return null;
    return sessions.get(sessionId) || null;
  }

  function authenticate(cookieHeader) {
    const session = getSession(cookieHeader);
    if (session) {
      return { ok: true, session: clone(session) };
    }
    return {
      ok: false,
      status: configuredPassword ? 401 : 503,
      error: configuredPassword ? 'content-admin-auth-required' : 'content-admin-auth-not-configured',
      details: configuredPassword
        ? 'Authenticate before using the content-admin authority.'
        : 'Set CONTENT_ADMIN_DEV_PASSWORD before exposing the content-admin server to other devices.',
    };
  }

  function logout(cookieHeader) {
    const sessionId = readCookie(cookieHeader, CONTENT_ADMIN_SESSION_COOKIE);
    if (sessionId) sessions.delete(sessionId);
  }

  function cookieHeader(sessionId) {
    return `${CONTENT_ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/__dev/content-admin; Max-Age=${CONTENT_ADMIN_SESSION_MAX_AGE_SECONDS}`;
  }

  return {
    login,
    authenticate,
    logout,
    cookieHeader,
    getSession,
    isConfigured: () => Boolean(configuredPassword),
    getSessionCount: () => sessions.size,
  };
}

export function normalizeContentAdminAuthActor(actor) {
  return normalizeActor(actor);
}
