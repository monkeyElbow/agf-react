export const DEV_IDENTITY_STORAGE_KEY = 'agf-dev-identity-v1';
export const DEV_ADMIN_PROFILES_STORAGE_KEY = 'agf-dev-admin-profiles-v1';
const LEGACY_YOURMOM_DEV_USER_ID = 'dev-d018b3e9-dcae-4181-82c4-7946f2eb3125';

const DEV_IDENTITY_ACCENTS = Object.freeze([
  '#00adbb',
  '#faa31a',
  '#f26660',
  '#414042',
  '#1f7a8c',
  '#5e548e',
  '#2a9d8f',
  '#b56576',
]);

export const DEFAULT_DEV_ADMIN_PROFILES = Object.freeze([
  Object.freeze({
    userId: 'dev-user-1',
    fullName: 'James',
    nickname: 'James',
    email: 'james@example.test',
    accentColor: '#00adbb',
  }),
  Object.freeze({
    userId: 'dev-user-2',
    fullName: 'Nathan',
    nickname: 'Nathan',
    email: 'nathan@example.test',
    accentColor: '#faa31a',
  }),
  Object.freeze({
    userId: 'dev-user-3',
    fullName: 'Lisa',
    nickname: 'Lisa',
    email: 'lisa@example.test',
    accentColor: '#f26660',
  }),
  Object.freeze({
    userId: 'dev-user-4',
    fullName: 'Tyler Durden',
    nickname: 'Tyler Durden',
    email: 'tyler.durden@example.test',
    accentColor: '#414042',
  }),
]);

function toTrimmed(value) {
  return String(value || '').trim();
}

function normalizeAccentColor(value, fallback) {
  const color = toTrimmed(value);
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toLowerCase();
  }
  return fallback;
}

function readNavigatorPlatform(navigatorImpl) {
  const raw = toTrimmed(
    navigatorImpl?.userAgentData?.platform
    || navigatorImpl?.platform
    || navigatorImpl?.userAgent
    || '',
  ).toLowerCase();

  if (raw.includes('iphone')) {
    return 'iPhone';
  }
  if (raw.includes('ipad')) {
    return 'iPad';
  }
  if (raw.includes('mac')) {
    return 'Mac';
  }
  if (raw.includes('win')) {
    return 'PC';
  }
  if (raw.includes('android')) {
    return 'Android';
  }
  if (raw.includes('linux')) {
    return 'Linux';
  }
  return 'Browser';
}

function hashSeed(seed) {
  const source = toTrimmed(seed);
  if (!source) {
    return 0;
  }
  let value = 0;
  for (let index = 0; index < source.length; index += 1) {
    value = ((value << 5) - value) + source.charCodeAt(index);
    value |= 0;
  }
  return Math.abs(value);
}

export function deriveDevIdentityInitials(name) {
  const words = toTrimmed(name)
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) {
    return 'DV';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] || ''}${words[words.length - 1][0] || ''}`.toUpperCase();
}

export function pickDevIdentityAccent(seed) {
  if (!DEV_IDENTITY_ACCENTS.length) {
    return '#00adbb';
  }
  return DEV_IDENTITY_ACCENTS[hashSeed(seed) % DEV_IDENTITY_ACCENTS.length];
}

export function createDefaultDevIdentityName({ navigatorImpl = globalThis.navigator } = {}) {
  const platform = readNavigatorPlatform(navigatorImpl);
  const suffix = String((hashSeed(`${platform}-${Date.now()}`) % 90) + 10);
  return `${platform} ${suffix}`;
}

export function normalizeDevIdentity(rawIdentity) {
  const rawSource = rawIdentity && typeof rawIdentity === 'object' ? rawIdentity : {};
  const isLegacyYourmom = rawSource.userId === LEGACY_YOURMOM_DEV_USER_ID
    || /^yourmom$/i.test(toTrimmed(rawSource.displayName || rawSource.name || rawSource.nickname));
  const source = isLegacyYourmom
    ? {
        ...rawSource,
        userId: 'dev-user-1',
        fullName: 'James',
        nickname: 'James',
        displayName: 'James',
        email: 'james@example.test',
        accentColor: '#00adbb',
      }
    : rawSource;
  const userId = toTrimmed(source.userId || source.id);
  const fullName = toTrimmed(source.fullName || source.name || source.displayName);
  const nickname = toTrimmed(source.nickname || source.displayName || fullName);
  const displayName = nickname || fullName;
  if (!userId || !displayName) {
    return null;
  }

  return {
    userId,
    fullName: fullName || displayName,
    nickname: nickname || displayName,
    email: toTrimmed(source.email),
    displayName,
    initials: toTrimmed(source.initials) || deriveDevIdentityInitials(displayName),
    accentColor: normalizeAccentColor(
      source.accentColor,
      pickDevIdentityAccent(userId || displayName),
    ),
    createdAt: Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : Date.now(),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

export function normalizeDevAdminProfile(rawProfile, fallbackProfile = null) {
  const source = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
  const fallback = fallbackProfile && typeof fallbackProfile === 'object' ? fallbackProfile : {};
  const userId = toTrimmed(source.userId || source.id || fallback.userId);
  const fullName = toTrimmed(source.fullName || source.name || source.displayName || fallback.fullName || fallback.name || fallback.displayName);
  const nickname = toTrimmed(source.nickname || source.displayName || fallback.nickname || fallback.displayName || fullName);
  if (!userId || !fullName) {
    return null;
  }
  return normalizeDevIdentity({
    ...fallback,
    ...source,
    userId,
    fullName,
    nickname: nickname || fullName,
    displayName: nickname || fullName,
  });
}

export function normalizeDevAdminProfiles(rawProfiles) {
  const source = Array.isArray(rawProfiles) ? rawProfiles : [];
  const sourceById = new Map(source.map((profile) => [
    toTrimmed(profile?.userId || profile?.id),
    profile,
  ]).filter(([userId]) => userId));
  const defaults = DEFAULT_DEV_ADMIN_PROFILES.map((profile) => normalizeDevAdminProfile(profile));
  const normalizedDefaults = defaults.map((profile) => normalizeDevAdminProfile(
    sourceById.get(profile.userId),
    profile,
  )).filter(Boolean);
  const knownIds = new Set(normalizedDefaults.map((profile) => profile.userId));
  const additionalProfiles = source
    .map((profile) => normalizeDevAdminProfile(profile))
    .filter((profile) => profile && !knownIds.has(profile.userId));
  return [...normalizedDefaults, ...additionalProfiles];
}

export function readStoredDevAdminProfiles(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(DEV_ADMIN_PROFILES_STORAGE_KEY);
    return normalizeDevAdminProfiles(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeDevAdminProfiles(null);
  }
}

export function persistDevAdminProfiles(profiles, storage = globalThis.localStorage) {
  const normalized = normalizeDevAdminProfiles(profiles);
  try {
    storage?.setItem?.(DEV_ADMIN_PROFILES_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore local persistence failures in dev mode
  }
  return normalized;
}

export function updateStoredDevAdminProfile(userId, patch = {}, {
  storage = globalThis.localStorage,
  now = Date.now(),
} = {}) {
  const normalizedUserId = toTrimmed(userId);
  if (!normalizedUserId) {
    return null;
  }
  const profiles = readStoredDevAdminProfiles(storage);
  const current = profiles.find((profile) => profile.userId === normalizedUserId);
  if (!current) {
    return null;
  }
  const next = normalizeDevAdminProfile({
    ...current,
    ...patch,
    userId: normalizedUserId,
    updatedAt: now,
  }, current);
  const nextProfiles = persistDevAdminProfiles(
    profiles.map((profile) => (profile.userId === normalizedUserId ? next : profile)),
    storage,
  );
  const active = readStoredDevIdentity(storage);
  if (active?.userId === normalizedUserId) {
    persistDevIdentity(next, storage);
  }
  return nextProfiles.find((profile) => profile.userId === normalizedUserId) || next;
}

export function selectStoredDevAdminProfile(userId, {
  storage = globalThis.localStorage,
  now = Date.now(),
} = {}) {
  const normalizedUserId = toTrimmed(userId);
  const profile = readStoredDevAdminProfiles(storage).find((item) => item.userId === normalizedUserId);
  if (!profile) {
    return readStoredDevIdentity(storage);
  }
  return persistDevIdentity({ ...profile, updatedAt: now }, storage);
}

export function createDevIdentity({
  cryptoImpl = globalThis.crypto,
  navigatorImpl = globalThis.navigator,
  now = Date.now(),
} = {}) {
  const displayName = createDefaultDevIdentityName({ navigatorImpl });
  const randomId = typeof cryptoImpl?.randomUUID === 'function'
    ? cryptoImpl.randomUUID()
    : `${now}-${Math.random().toString(36).slice(2, 10)}`;

  return normalizeDevIdentity({
    userId: `dev-${randomId}`,
    displayName,
    createdAt: now,
    updatedAt: now,
  });
}

export function readStoredDevIdentity(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(DEV_IDENTITY_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeDevIdentity(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function persistDevIdentity(identity, storage = globalThis.localStorage) {
  const normalized = normalizeDevIdentity(identity);
  if (!normalized) {
    return null;
  }

  try {
    storage?.setItem?.(DEV_IDENTITY_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore local persistence failures in dev mode
  }

  return normalized;
}

export function getOrCreateDevIdentity({
  storage = globalThis.localStorage,
  cryptoImpl = globalThis.crypto,
  navigatorImpl = globalThis.navigator,
  now = Date.now(),
} = {}) {
  const existing = readStoredDevIdentity(storage);
  if (existing) {
    const matchingProfile = readStoredDevAdminProfiles(storage)
      .find((profile) => profile.userId === existing.userId);
    return matchingProfile
      ? persistDevIdentity({
          ...matchingProfile,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        }, storage)
      : existing;
  }
  // A new browser is an unassigned operator until someone chooses one of the
  // temporary profiles. Never silently claim the first profile (James).
  return persistDevIdentity(createDevIdentity({ cryptoImpl, navigatorImpl, now }), storage);
}

export function renameStoredDevIdentity(displayName, {
  storage = globalThis.localStorage,
  now = Date.now(),
} = {}) {
  const current = getOrCreateDevIdentity({ storage, now });
  const nextName = toTrimmed(displayName);
  if (!current || !nextName) {
    return current;
  }

  return persistDevIdentity({
    ...current,
    nickname: nextName,
    displayName: nextName,
    initials: deriveDevIdentityInitials(nextName),
    updatedAt: now,
  }, storage);
}

export function setStoredDevIdentityAccentColor(accentColor, {
  storage = globalThis.localStorage,
  now = Date.now(),
} = {}) {
  const current = getOrCreateDevIdentity({ storage, now });
  const nextAccentColor = normalizeAccentColor(accentColor, current?.accentColor);
  if (!current || !nextAccentColor) {
    return current;
  }

  return persistDevIdentity({
    ...current,
    accentColor: nextAccentColor,
    updatedAt: now,
  }, storage);
}

export function toDevIdentitySummary(identity) {
  const normalized = normalizeDevIdentity(identity);
  if (!normalized) {
    return null;
  }
  return {
    userId: normalized.userId,
    displayName: normalized.displayName,
    initials: normalized.initials,
    accentColor: normalized.accentColor,
  };
}
