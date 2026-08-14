import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROCESS_START_TIME_TOLERANCE_MS = 5000;

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function processIsAlive(processId) {
  const pid = Number(processId);
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function readProcessStartTime(processId) {
  const pid = Number(processId);
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try {
    const output = execFileSync('ps', ['-p', String(pid), '-o', 'lstart='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const timestamp = Date.parse(output);
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

function leaseProcessIsAlive(lease, processStartTimeReader) {
  if (!processIsAlive(lease?.pid)) {
    return false;
  }

  const recordedStartTime = Number(lease?.processStartTime);
  if (!Number.isFinite(recordedStartTime)) {
    return true;
  }

  const actualStartTime = processStartTimeReader?.(lease.pid);
  if (!Number.isFinite(actualStartTime)) {
    return true;
  }

  return Math.abs(actualStartTime - recordedStartTime) <= PROCESS_START_TIME_TOLERANCE_MS;
}

function readLease(lockFile) {
  try {
    return JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  } catch {
    return null;
  }
}

function authorityError(message, details = {}) {
  const error = new Error(message);
  error.code = 'CONTENT_ADMIN_AUTHORITY_UNAVAILABLE';
  error.details = details;
  return error;
}

export function createContentAdminAuthorityLease({
  lockFile,
  host = 'localhost',
  port = null,
  projectRoot,
  processId = process.pid,
  processStartTime = Date.now() - (process.uptime() * 1000),
  processStartTimeReader = readProcessStartTime,
  authorityInstanceId,
  allowSameProcessRestart = false,
  now = () => Date.now(),
} = {}) {
  if (!lockFile || !projectRoot || !authorityInstanceId) {
    throw new Error('Content-admin authority requires lockFile, projectRoot, and authorityInstanceId.');
  }

  const identity = {
    pid: Number(processId),
    processStartTime: Number(processStartTime),
    host: String(host || 'localhost'),
    port: port == null ? null : Number(port),
    projectRoot: path.resolve(projectRoot),
    authorityInstanceId: String(authorityInstanceId),
    acquiredAt: now(),
  };
  let ownsLease = false;

  const acquire = () => {
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    try {
      const descriptor = fs.openSync(lockFile, 'wx');
      try {
        fs.writeFileSync(descriptor, `${JSON.stringify(identity, null, 2)}\n`);
      } finally {
        fs.closeSync(descriptor);
      }
      ownsLease = true;
      return clone(identity);
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      const existing = readLease(lockFile);
      const sameProcessRestart = Boolean(
        allowSameProcessRestart
        && existing
        && Number(existing.pid) === identity.pid
        && Number.isFinite(Number(existing.processStartTime))
        && Math.abs(Number(existing.processStartTime) - identity.processStartTime) <= PROCESS_START_TIME_TOLERANCE_MS,
      );
      if (sameProcessRestart) {
        try {
          fs.unlinkSync(lockFile);
        } catch (unlinkError) {
          if (unlinkError?.code !== 'ENOENT') {
            throw unlinkError;
          }
        }
        return acquire();
      }
      if (existing && !leaseProcessIsAlive(existing, processStartTimeReader)) {
        try {
          fs.unlinkSync(lockFile);
        } catch (unlinkError) {
          if (unlinkError?.code !== 'ENOENT') {
            throw unlinkError;
          }
        }
        return acquire();
      }
      if (!existing) {
        throw authorityError('Content-admin authority lock is unreadable and may belong to a starting process.', {
          lockFile,
          existing,
          stale: false,
        });
      }
      throw authorityError('Another content-admin authority already owns the project.', {
        lockFile,
        existing,
        stale: !leaseProcessIsAlive(existing, processStartTimeReader),
      });
    }
  };

  const reclaimStale = () => {
    const existing = readLease(lockFile);
    if (!existing) return acquire();
    if (leaseProcessIsAlive(existing, processStartTimeReader)) {
      throw authorityError('Cannot reclaim an authority lock owned by a live process.', {
        lockFile,
        existing,
      });
    }
    fs.unlinkSync(lockFile);
    return acquire();
  };

  const assertOwned = () => {
    const existing = readLease(lockFile);
    if (!ownsLease || !existing || existing.authorityInstanceId !== identity.authorityInstanceId) {
      throw authorityError('Content-admin write rejected because authority ownership was lost.', {
        lockFile,
        expected: identity,
        existing,
      });
    }
    return true;
  };

  const release = () => {
    if (!ownsLease) return false;
    const existing = readLease(lockFile);
    if (existing?.authorityInstanceId === identity.authorityInstanceId) {
      fs.unlinkSync(lockFile);
    }
    ownsLease = false;
    return true;
  };

  return {
    acquire,
    reclaimStale,
    assertOwned,
    release,
    isOwner: () => ownsLease,
    getIdentity: () => clone(identity),
    getDiagnostics: () => ({
      lockFile: path.resolve(lockFile),
      ownsLease,
      identity: clone(identity),
      currentLease: clone(readLease(lockFile)),
    }),
  };
}

export function inspectContentAdminAuthority(lockFile, { processStartTimeReader = readProcessStartTime } = {}) {
  const lease = readLease(lockFile);
  const processAlive = lease ? leaseProcessIsAlive(lease, processStartTimeReader) : false;
  return {
    lockFile: path.resolve(lockFile),
    lease: clone(lease),
    processAlive,
    status: !lease ? 'available' : processAlive ? 'owned' : 'stale-auto-reclaimable',
  };
}
