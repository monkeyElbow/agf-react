import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createContentAdminAuthorityLease,
  inspectContentAdminAuthority,
} from './contentAdminAuthority';

const tempDirectories = [];

function createTempLock() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-content-authority-lock-'));
  tempDirectories.push(directory);
  return path.join(directory, 'authority.lock');
}

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

function lease(lockFile, authorityInstanceId) {
  return createContentAdminAuthorityLease({
    lockFile,
    projectRoot: '/repo',
    host: '127.0.0.1',
    port: 5173,
    processId: process.pid,
    processStartTime: 123,
    authorityInstanceId,
    now: () => 456,
  });
}

describe('content-admin authority lease', () => {
  it('acquires atomically and rejects a second live authority', () => {
    const lockFile = createTempLock();
    const first = lease(lockFile, 'first');
    first.acquire();

    const second = lease(lockFile, 'second');
    expect(() => second.acquire()).toThrow(/already owns/);
    expect(inspectContentAdminAuthority(lockFile)).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'first', pid: process.pid },
    });
  });

  it('rejects writes after ownership is lost', () => {
    const lockFile = createTempLock();
    const owner = lease(lockFile, 'owner');
    owner.acquire();
    fs.writeFileSync(lockFile, JSON.stringify({ authorityInstanceId: 'other', pid: process.pid }));

    expect(() => owner.assertOwned()).toThrow(/ownership was lost/);
  });

  it('reclaims only a lock whose recorded process is gone', () => {
    const lockFile = createTempLock();
    fs.writeFileSync(lockFile, JSON.stringify({
      authorityInstanceId: 'dead',
      pid: 2147483647,
    }));
    const replacement = lease(lockFile, 'replacement');

    replacement.reclaimStale();

    expect(inspectContentAdminAuthority(lockFile)).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'replacement' },
    });
  });
});
