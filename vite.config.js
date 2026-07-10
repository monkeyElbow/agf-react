import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createDevContentAuthorityStore } from './dev-server/contentAdminStore';
import { createSharedDisclosuresStore } from './dev-server/disclosuresStore';

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
  const disclosuresStore = createSharedDisclosuresStore({
    persistenceFile: path.resolve(process.cwd(), 'dev-data/disclosures-shared.json'),
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

          if (req.method === 'GET' && url.pathname === '/announcement') {
            sendJson(res, 200, store.getAnnouncementSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/disclosures/state') {
            sendJson(res, 200, disclosuresStore.getSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/revisions') {
            const pathname = url.searchParams.get('path') || '';
            sendJson(res, 200, {
              revisions: store.getRevisionHistory(pathname),
            });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/backups') {
            sendJson(res, 200, {
              backups: store.listBackups(),
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

          if (url.pathname === '/announcement/save') {
            sendJson(res, 200, store.saveAnnouncement(body.announcement, {
              actor: body.actor,
            }));
            return;
          }

          if (url.pathname === '/disclosures/save') {
            sendJson(res, 200, disclosuresStore.saveDraftPatch(body.patch, body.actor));
            return;
          }

          if (url.pathname === '/disclosures/reset') {
            sendJson(res, 200, disclosuresStore.resetDraftToDefaults(body.actor));
            return;
          }

          if (url.pathname === '/disclosures/restore-live') {
            sendJson(res, 200, disclosuresStore.restoreDraftFromPublished(body.actor));
            return;
          }

          if (url.pathname === '/disclosures/publish') {
            sendJson(res, 200, disclosuresStore.publishDraft(body.actor));
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
            const result = store.resetFromSeed(body.seedState, {
              actor: body.actor,
              reason: 'seed-reset',
            });
            sendJson(res, result?.ok === false ? 500 : 200, result);
            return;
          }

          if (url.pathname === '/restore-backup') {
            const result = store.restoreFromBackup(body.backupFileName, {
              actor: body.actor,
            });
            sendJson(res, result?.ok === false ? (result?.error === 'backup-not-found' ? 404 : 500) : 200, result);
            return;
          }

          if (url.pathname === '/promote-seed') {
            const result = store.promoteCurrentStateToSeed({
              actor: body.actor,
            });
            sendJson(res, result?.ok === false ? 500 : 200, result);
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
