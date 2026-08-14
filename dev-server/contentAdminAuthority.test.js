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
    processStartTimeReader: () => 123,
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
    expect(inspectContentAdminAuthority(lockFile, { processStartTimeReader: () => 123 })).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'first', pid: process.pid },
    });
  });

  it('allows Vite to replace its own authority during a same-process restart', () => {
    const lockFile = createTempLock();
    const first = createContentAdminAuthorityLease({
      lockFile,
      projectRoot: '/repo',
      processId: process.pid,
      processStartTime: 123,
      processStartTimeReader: () => 123,
      authorityInstanceId: 'first',
      allowSameProcessRestart: true,
    });
    first.acquire();

    const replacement = createContentAdminAuthorityLease({
      lockFile,
      projectRoot: '/repo',
      processId: process.pid,
      processStartTime: 123,
      processStartTimeReader: () => 123,
      authorityInstanceId: 'replacement',
      allowSameProcessRestart: true,
    });
    replacement.acquire();

    expect(inspectContentAdminAuthority(lockFile, { processStartTimeReader: () => 123 })).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'replacement', pid: process.pid },
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

    expect(inspectContentAdminAuthority(lockFile, { processStartTimeReader: () => 123 })).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'replacement' },
    });
  });

  it('automatically reclaims a stale lock during normal startup', () => {
    const lockFile = createTempLock();
    fs.writeFileSync(lockFile, JSON.stringify({
      authorityInstanceId: 'dead',
      pid: 2147483647,
    }));
    const replacement = lease(lockFile, 'replacement');

    replacement.acquire();

    expect(inspectContentAdminAuthority(lockFile, { processStartTimeReader: () => 123 })).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'replacement' },
    });
  });

  it('reclaims a lock when the pid was reused by a different process instance', () => {
    const lockFile = createTempLock();
    fs.writeFileSync(lockFile, JSON.stringify({
      authorityInstanceId: 'old-instance',
      pid: process.pid,
      processStartTime: 123,
    }));
    const replacement = createContentAdminAuthorityLease({
      lockFile,
      projectRoot: '/repo',
      processId: process.pid,
      processStartTime: 10000,
      processStartTimeReader: () => 10000,
      authorityInstanceId: 'replacement',
    });

    replacement.acquire();

    expect(inspectContentAdminAuthority(lockFile, {
      processStartTimeReader: () => 10000,
    })).toMatchObject({
      status: 'owned',
      lease: { authorityInstanceId: 'replacement' },
    });
  });
});
