export const DEV_IDENTITY_STORAGE_KEY = 'agf-dev-identity-v1';

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
  const source = rawIdentity && typeof rawIdentity === 'object' ? rawIdentity : {};
  const userId = toTrimmed(source.userId || source.id);
  const displayName = toTrimmed(source.displayName || source.name);
  if (!userId || !displayName) {
    return null;
  }

  return {
    userId,
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
    return existing;
  }
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
