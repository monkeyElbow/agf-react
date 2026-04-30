import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createDevContentAuthorityStore } from './dev-server/contentAdminStore';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function contentAdminDevPlugin() {
  const store = createDevContentAuthorityStore({
    persistenceFile: path.resolve(process.cwd(), 'dev-data/content-admin-shared.json'),
  });

  return {
    name: 'agf-dev-content-authority',
    configureServer(server) {
      server.middlewares.use('/__dev/content-admin', async (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        try {
          if (req.method === 'GET' && url.pathname === '/state') {
            sendJson(res, 200, store.getSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/revisions') {
            const pathname = url.searchParams.get('path') || '';
            sendJson(res, 200, {
              revisions: store.getRevisionHistory(pathname),
            });
            return;
          }

          if (req.method !== 'POST') {
            sendJson(res, 404, { error: 'not-found' });
            return;
          }

          const body = await readRequestBody(req);

          if (url.pathname === '/initialize') {
            const snapshot = store.getSnapshot();
            if (snapshot.initialized) {
              sendJson(res, 200, snapshot);
              return;
            }
            sendJson(res, 200, store.resetFromSeed(body.seedState, {
              actor: body.actor,
              reason: 'seed-bootstrap',
            }));
            return;
          }

          if (url.pathname === '/save-draft') {
            sendJson(res, 200, store.saveDraft(body.state, {
              actor: body.actor,
              summary: body.summary,
            }));
            return;
          }

          if (url.pathname === '/publish-page') {
            const result = store.publishPage(body.pathname, {
              actor: body.actor,
              summary: body.summary,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/blocks/sync-draft') {
            const result = store.syncBlockDraft(body.pathname, body.blockId, body.block, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/restore-page-revision') {
            const result = store.restorePageRevision(body.pathname, body.revisionId, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 404, result);
            return;
          }

          if (url.pathname === '/restore-block-revision') {
            const result = store.restoreBlockFromRevision(body.pathname, body.revisionId, body.blockId, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 404, result);
            return;
          }

          if (url.pathname === '/locks/acquire') {
            const result = store.acquireBlockLock(body.pathname, body.blockId, body.actor, {
              force: body.force,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/locks/refresh') {
            const result = store.refreshBlockLock(body.pathname, body.blockId, body.actor);
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/locks/release') {
            const result = store.releaseBlockLock(body.pathname, body.blockId, body.actor);
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/reset') {
            sendJson(res, 200, store.resetFromSeed(body.seedState, {
              actor: body.actor,
              reason: 'seed-reset',
            }));
            return;
          }

          sendJson(res, 404, { error: 'not-found' });
        } catch (error) {
          sendJson(res, 500, {
            error: 'content-admin-dev-server-error',
            details: error instanceof Error ? error.message : 'unknown-error',
          });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), contentAdminDevPlugin()],
});
