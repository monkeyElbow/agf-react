import { beforeEach, describe, expect, it } from 'vitest';
import {
  getOrCreateDevIdentity,
  readStoredDevAdminProfiles,
  selectStoredDevAdminProfile,
  updateStoredDevAdminProfile,
} from './devIdentity';

describe('development admin profiles', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('provides four stable temporary actors', () => {
    expect(readStoredDevAdminProfiles().map((profile) => [profile.userId, profile.displayName])).toEqual([
      ['dev-user-1', 'James'],
      ['dev-user-2', 'Nathan'],
      ['dev-user-3', 'Lisa'],
      ['dev-user-4', 'Tyler Durden'],
    ]);
  });

  it('switches the active browser actor without changing the stable id', () => {
    const selected = selectStoredDevAdminProfile('dev-user-4');
    expect(selected.userId).toBe('dev-user-4');
    expect(selected.displayName).toBe('Tyler Durden');
  });

  it('does not silently assign a new browser to James', () => {
    const identity = getOrCreateDevIdentity({
      now: 1710000000000,
      navigatorImpl: { platform: 'MacIntel' },
      cryptoImpl: { randomUUID: () => 'unassigned-browser' },
    });

    expect(identity.userId).toBe('dev-unassigned-browser');
    expect(identity.displayName).not.toBe('James');
    expect(identity.displayName).toContain('Mac');
  });

  it('stores editable profile fields while preserving the actor id', () => {
    const updated = updateStoredDevAdminProfile('dev-user-2', {
      fullName: 'Nathan Example',
      nickname: 'Nate',
      email: 'nate@example.test',
      accentColor: '#123456',
    });

    expect(updated).toMatchObject({
      userId: 'dev-user-2',
      fullName: 'Nathan Example',
      nickname: 'Nate',
      displayName: 'Nate',
      email: 'nate@example.test',
      accentColor: '#123456',
    });
  });

  it('migrates the legacy Yourmom identity to James', () => {
    window.localStorage.setItem('agf-dev-identity-v1', JSON.stringify({
      userId: 'dev-d018b3e9-dcae-4181-82c4-7946f2eb3125',
      displayName: 'Yourmom',
    }));

    expect(getOrCreateDevIdentity()).toMatchObject({
      userId: 'dev-user-1',
      displayName: 'James',
    });
  });
});
