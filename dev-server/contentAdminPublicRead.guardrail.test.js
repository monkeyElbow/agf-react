import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

describe('content-admin public read boundary', () => {
  it('keeps only published/public data reads unauthenticated', () => {
    const source = readFileSync(path.join(repoRoot, 'vite.config.js'), 'utf8');
    expect(source).toContain('isContentAdminPublicPublishedRead(req.method, url.pathname)');
    expect(source).toContain('sessionManager.authenticate(req.headers.cookie)');
    expect(source).toContain('shouldAllowUnauthenticatedContentAdminRequest');
    expect(source).toContain('trusted development LAN workflow');
  });
});
