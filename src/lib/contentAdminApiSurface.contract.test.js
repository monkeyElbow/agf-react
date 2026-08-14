import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath) {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function extractClientPaths(source) {
  return [...source.matchAll(/(?:'|`)(\/[-a-z0-9_/]+)(?:\?|(?:'|`))/gi)]
    .map((match) => match[1])
    .filter((pathname) => pathname !== '/__dev/content-admin');
}

function extractServerPaths(source) {
  return [...source.matchAll(/url\.pathname === ['"](\/[-a-z0-9_/]+)['"]/g)]
    .map((match) => match[1]);
}

describe('content-admin client/server API surface', () => {
  it('keeps every client authority endpoint implemented by the Vite authority boundary', () => {
    const clientSource = [
      readRepoFile('src/lib/devContentAuthorityClient.js'),
      readRepoFile('src/lib/contentAdminDraftCoordinator.js'),
    ].join('\n');
    const serverSource = readRepoFile('vite.config.js');
    const clientPaths = [...new Set(extractClientPaths(clientSource))].sort();
    const serverPaths = new Set(extractServerPaths(serverSource));
    const missingPaths = clientPaths.filter((pathname) => !serverPaths.has(pathname));

    expect(missingPaths, `client endpoints missing from Vite authority: ${missingPaths.join(', ')}`).toEqual([]);
  });

  it('keeps the draft coordinator as the only semantic draft-write dispatcher', () => {
    const clientSource = readRepoFile('src/lib/devContentAuthorityClient.js');
    const coordinatorSource = readRepoFile('src/lib/contentAdminDraftCoordinator.js');

    expect(clientSource).toContain('createContentAdminDraftCoordinator');
    expect(clientSource).toContain('contentAdminDraftCoordinator.saveDraft(request)');
    expect(coordinatorSource).toContain("request('/save-draft'");
    expect(coordinatorSource).toContain("request('/save-route-draft'");
    expect(coordinatorSource).toContain("request(isSync ? '/blocks/sync-draft' : '/save-block-draft'");
  });
});
