import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Vite development performance boundaries', () => {
  it('keeps the dev server on one explicit port and ignores cold data artifacts', () => {
    const source = readRepoFile('vite.config.js');

    expect(source).toContain('strictPort: true');
    expect(source).toContain("'**/dev-data/backups/**'");
    expect(source).toContain("'**/dev-data/content-admin-revisions/**'");
    expect(source).toContain("'/diagnostics'");
  });

  it('does not construct the content store until a content-admin request arrives', () => {
    const source = readRepoFile('vite.config.js');

    expect(source).toContain('let store = null;');
    expect(source).toContain('const getStore = () => {');
    expect(source).toContain('store = createJsonContentStore({');
    expect(source).toContain('const contentStore = isDisclosureRequest ? null : getStore();');
    expect(source).toContain('contentStore?.refreshFromDisk();');
  });

  it('does not transfer the full admin snapshot for authority metadata', () => {
    const source = readRepoFile('vite.config.js');
    const storeSource = readRepoFile('dev-server/contentAdminStore.js');

    expect(source).toContain('contentStore.getAuthoritySnapshot()');
    expect(storeSource).toContain('getAuthoritySnapshot()');
  });

  it('keeps public route hydration scoped to the published route slice', () => {
    const source = readRepoFile('vite.config.js');
    const storeSource = readRepoFile('dev-server/contentAdminStore.js');

    expect(source).toContain("'/published-route'");
    expect(source).toContain('getPublishedRouteSnapshot');
    expect(storeSource).toContain('getPublishedRouteSnapshot(pathname)');
    expect(storeSource).toContain('record.baseSnapshot');
  });

  it('keeps diagnostics opt-in and identifies the serving authority', () => {
    const source = readRepoFile('vite.config.js');

    expect(source).toContain("process.env.VITE_PERF_DEBUG === '1'");
    expect(source).toContain('serverInstanceId');
    expect(source).toContain('processId: process.pid');
    expect(source).toContain('repoRoot');
    expect(source).toContain('persistenceFile');
    expect(source).toContain('serverReadyAt');
    expect(source).toContain('[vite-perf]');
  });

  it('requires an atomic project authority lease before serving content-admin writes', () => {
    const source = readRepoFile('vite.config.js');
    const authoritySource = readRepoFile('dev-server/contentAdminAuthority.js');

    expect(source).toContain('createContentAdminAuthorityLease');
    expect(source).toContain('nextAuthorityLease.acquire()');
    expect(source).toContain('authorityLease.assertOwned()');
    expect(source).toContain("server.httpServer?.once('close'");
    expect(source).toContain('nextAuthorityLease.release()');
    expect(authoritySource).toContain("fs.openSync(lockFile, 'wx')");
    expect(authoritySource).toContain('reclaimStale');
  });
});
