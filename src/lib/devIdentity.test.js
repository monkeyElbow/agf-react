import { describe, expect, it } from 'vitest';
import {
  DEV_IDENTITY_STORAGE_KEY,
  deriveDevIdentityInitials,
  getOrCreateDevIdentity,
  readStoredDevIdentity,
  renameStoredDevIdentity,
  setStoredDevIdentityAccentColor,
} from './devIdentity';

function createStorageStub() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('dev identity helpers', () => {
  it('creates and persists a developer identity when one does not exist', () => {
    const storage = createStorageStub();
    const identity = getOrCreateDevIdentity({
      storage,
      now: 1710000000000,
      navigatorImpl: { platform: 'MacIntel' },
      cryptoImpl: { randomUUID: () => 'abc-123' },
    });

    expect(identity.userId).toBe('dev-abc-123');
    expect(identity.displayName).toContain('Mac');
    expect(readStoredDevIdentity(storage)?.userId).toBe('dev-abc-123');
    expect(storage.getItem(DEV_IDENTITY_STORAGE_KEY)).toContain('dev-abc-123');
  });

  it('renames the stored identity without changing the underlying user id', () => {
    const storage = createStorageStub();
    const original = getOrCreateDevIdentity({
      storage,
      now: 1710000000000,
      navigatorImpl: { platform: 'Win32' },
      cryptoImpl: { randomUUID: () => 'same-user' },
    });

    const renamed = renameStoredDevIdentity('Sarah Mac', {
      storage,
      now: 1710000100000,
    });

    expect(renamed.userId).toBe(original.userId);
    expect(renamed.displayName).toBe('Sarah Mac');
    expect(renamed.initials).toBe('SM');
    expect(renamed.updatedAt).toBe(1710000100000);
  });

  it('reuses an existing stored identity instead of creating a new one', () => {
    const storage = createStorageStub();
    storage.setItem(DEV_IDENTITY_STORAGE_KEY, JSON.stringify({
      userId: 'dev-existing-user',
      displayName: 'James Laptop',
      initials: 'JL',
      accentColor: '#faa31a',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    }));

    const identity = getOrCreateDevIdentity({
      storage,
      now: 1710000100000,
      navigatorImpl: { platform: 'MacIntel' },
      cryptoImpl: { randomUUID: () => 'should-not-be-used' },
    });

    expect(identity.userId).toBe('dev-existing-user');
    expect(identity.displayName).toBe('James Laptop');
    expect(identity.updatedAt).toBe(1710000000000);
  });

  it('updates the stored accent color without changing the underlying user id', () => {
    const storage = createStorageStub();
    const original = getOrCreateDevIdentity({
      storage,
      now: 1710000000000,
      navigatorImpl: { platform: 'MacIntel' },
      cryptoImpl: { randomUUID: () => 'same-user' },
    });

    const updated = setStoredDevIdentityAccentColor('#F26660', {
      storage,
      now: 1710000100000,
    });

    expect(updated.userId).toBe(original.userId);
    expect(updated.accentColor).toBe('#f26660');
    expect(updated.updatedAt).toBe(1710000100000);
    expect(readStoredDevIdentity(storage)?.accentColor).toBe('#f26660');
  });

  it('derives initials predictably for single and multiple word names', () => {
    expect(deriveDevIdentityInitials('Mac 42')).toBe('M4');
    expect(deriveDevIdentityInitials('Sarah Mac')).toBe('SM');
    expect(deriveDevIdentityInitials('')).toBe('DV');
  });
});
