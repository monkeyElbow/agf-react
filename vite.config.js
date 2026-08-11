import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createJsonContentStore } from './dev-server/jsonContentStore';
import { createSharedDisclosuresStore } from './dev-server/disclosuresStore';
import { createContentAdminAuthorityLease } from './dev-server/contentAdminAuthority.js';

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
  const repoRoot = process.cwd();
  const persistenceFile = path.resolve(repoRoot, 'dev-data/content-admin-shared.json');
  const revisionDirectory = path.resolve(repoRoot, 'dev-data/content-admin-revisions');
  const authorityLockFile = path.resolve(repoRoot, 'dev-data/content-admin-authority.lock');
  const disclosuresFile = path.resolve(repoRoot, 'dev-data/disclosures-shared.json');
  const perfDebugEnabled = process.env.VITE_PERF_DEBUG === '1';
  const pluginCreatedAt = Date.now();
  const pluginCreatedPerf = performance.now();
  const serverInstanceId = `${process.pid}-${pluginCreatedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const diagnostics = {
    serverInstanceId,
    processId: process.pid,
    repoRoot,
    persistenceFile,
    revisionDirectory,
    authorityLockFile,
    startupAt: new Date(pluginCreatedAt).toISOString(),
    pluginCreatedMs: 0,
    serverReadyAt: '',
    serverReadyMs: 0,
    storeReadyAt: '',
    storeReadyMs: 0,
    requestCount: 0,
    slowRequests: [],
  };
  let store = null;
  let disclosuresStore = null;
  let authorityLease = null;

  const logPerf = (label, durationMs, details = {}) => {
    const roundedDuration = Math.round(Number(durationMs) * 100) / 100;
    if (!perfDebugEnabled || roundedDuration < 25) {
      return;
    }
    console.info(`[vite-perf] ${label} ${roundedDuration}ms`, details);
  };

  const getStore = () => {
    if (store) {
      return store;
    }
    const startedAt = performance.now();
    store = createJsonContentStore({
      persistenceFile,
      revisionDirectory,
      authorityLease,
      onDiagnostic: (entry) => {
        if (perfDebugEnabled) {
          logPerf(`content-store.${entry.operation}`, entry.durationMs, entry.details);
        }
      },
    });
    const durationMs = performance.now() - startedAt;
    diagnostics.storeReadyAt = new Date().toISOString();
    diagnostics.storeReadyMs = Math.round(durationMs * 100) / 100;
    logPerf('content-store.create', durationMs, { persistenceFile, revisionDirectory });
    return store;
  };

  const getDisclosuresStore = () => {
    if (!disclosuresStore) {
      disclosuresStore = createSharedDisclosuresStore({ persistenceFile: disclosuresFile });
    }
    return disclosuresStore;
  };

  return {
    name: 'agf-dev-content-authority',
    configureServer(server) {
      authorityLease = createContentAdminAuthorityLease({
        lockFile: authorityLockFile,
        host: server.config.server.host || 'localhost',
        port: server.config.server.port || null,
        projectRoot: repoRoot,
        authorityInstanceId: serverInstanceId,
      });
      authorityLease.acquire();
      server.middlewares.use('/__dev/content-admin', async (req, res) => {
        const requestStartedAt = performance.now();
        diagnostics.requestCount += 1;
        const url = new URL(req.url || '/', 'http://localhost');
        try {
          if (req.method === 'GET' && url.pathname === '/diagnostics') {
            sendJson(res, 200, {
              ...diagnostics,
              authority: authorityLease.getDiagnostics(),
              port: server.httpServer?.address?.()?.port || server.config.server.port || null,
              now: new Date().toISOString(),
              elapsedSincePluginCreateMs: Math.round((Date.now() - pluginCreatedAt) * 100) / 100,
            });
            return;
          }

          if (req.method === 'POST') {
            authorityLease.assertOwned();
          }
          const isDisclosureRequest = url.pathname.startsWith('/disclosures/');
          const contentStore = isDisclosureRequest ? null : getStore();
          const sharedDisclosuresStore = isDisclosureRequest ? getDisclosuresStore() : null;
          contentStore?.refreshFromDisk();
          if (req.method === 'GET' && url.pathname === '/state') {
            sendJson(res, 200, contentStore.getSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/route-state') {
            sendJson(res, 200, contentStore.getRouteSnapshot(url.searchParams.get('path')));
            return;
          }

          if (req.method === 'GET' && url.pathname === '/published-route') {
            sendJson(res, 200, contentStore.getPublishedRouteSnapshot(url.searchParams.get('path')));
            return;
          }

          if (req.method === 'GET' && url.pathname === '/metadata') {
            sendJson(res, 200, contentStore.getAuthoritySnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/publish-status') {
            sendJson(res, 200, contentStore.getPublishStatus(url.searchParams.get('operationId')));
            return;
          }

          if (req.method === 'GET' && url.pathname === '/announcement') {
            sendJson(res, 200, contentStore.getAnnouncementSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/disclosures/state') {
            sendJson(res, 200, sharedDisclosuresStore.getSnapshot());
            return;
          }

          if (req.method === 'GET' && url.pathname === '/revisions') {
            const pathname = url.searchParams.get('path') || '';
            sendJson(res, 200, {
              revisions: contentStore.listRevisions(pathname),
            });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/backups') {
            sendJson(res, 200, {
              backups: contentStore.listBackups(),
            });
            return;
          }

          if (req.method !== 'POST') {
            sendJson(res, 404, { error: 'not-found' });
            return;
          }

          const body = await readRequestBody(req);

          if (url.pathname === '/initialize') {
            const snapshot = contentStore.getSnapshot();
            if (snapshot.initialized) {
              sendJson(res, 200, snapshot);
              return;
            }
            sendJson(res, 200, contentStore.resetFromSeed(body.seedState, {
              actor: body.actor,
              reason: 'seed-bootstrap',
            }));
            return;
          }

          if (url.pathname === '/save-draft') {
            sendJson(res, 200, contentStore.savePageDraft(body.state, {
              actor: body.actor,
              summary: body.summary,
            }));
            return;
          }

          if (url.pathname === '/save-route-draft') {
            sendJson(res, 200, contentStore.saveRouteDraft(body.pathname, body.state, {
              actor: body.actor,
              summary: body.summary,
            }));
            return;
          }

          if (url.pathname === '/save-block-draft') {
            const result = contentStore.saveBlockDraft(body.pathname, body.blockId, body.block, {
              actor: body.actor,
              summary: body.summary,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/discard-draft') {
            const result = contentStore.discardPageDraft(body.pathname, {
              actor: body.actor,
              summary: body.summary,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/discard-block-draft') {
            const result = contentStore.discardBlockDraft(body.pathname, body.blockId, {
              actor: body.actor,
              summary: body.summary,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/announcement/save') {
            sendJson(res, 200, contentStore.saveAnnouncement(body.announcement, {
              actor: body.actor,
            }));
            return;
          }

          if (url.pathname === '/disclosures/save') {
            sendJson(res, 200, sharedDisclosuresStore.saveDraftPatch(body.patch, body.actor));
            return;
          }

          if (url.pathname === '/disclosures/reset') {
            sendJson(res, 200, sharedDisclosuresStore.resetDraftToDefaults(body.actor));
            return;
          }

          if (url.pathname === '/disclosures/restore-live') {
            sendJson(res, 200, sharedDisclosuresStore.restoreDraftFromPublished(body.actor));
            return;
          }

          if (url.pathname === '/disclosures/publish') {
            sendJson(res, 200, sharedDisclosuresStore.publishDraft(body.actor));
            return;
          }

          if (url.pathname === '/publish-page') {
            const result = contentStore.publishPath(body.pathname, {
              actor: body.actor,
              summary: body.summary,
              operationId: body.operationId,
              expectedDraftRevision: body.expectedDraftRevision,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/publish-block') {
            const result = contentStore.publishBlock(body.pathname, body.blockId, {
              actor: body.actor,
              summary: body.summary,
              expectedBlock: body.expectedBlock,
              operationId: body.operationId,
              expectedDraftRevision: body.expectedDraftRevision,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/publish-seed-routes') {
            const result = contentStore.publishSeedRouteSlices(body.seedState, body.pathnames, {
              actor: body.actor,
              summary: body.summary,
              forceOverwriteAdminEdits: body.forceOverwriteAdminEdits === true,
              reason: body.reason,
              operation: body.operation || 'seed-to-active',
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-generosity-fund-snapshot') {
            const result = contentStore.migrateGenerosityFundSnapshot({
              defaultState: body.defaultState,
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/blocks/sync-draft') {
            const result = contentStore.syncBlockDraft(body.pathname, body.blockId, body.block, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/restore-page-revision') {
            const result = contentStore.restorePageRevision(body.pathname, body.revisionId, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 404, result);
            return;
          }

          if (url.pathname === '/restore-block-revision') {
            const result = contentStore.restoreBlockRevision(body.pathname, body.revisionId, body.blockId, {
              actor: body.actor,
            });
            sendJson(res, result.ok ? 200 : 404, result);
            return;
          }

          if (url.pathname === '/locks/acquire') {
            const result = contentStore.acquireBlockLock(body.pathname, body.blockId, body.actor, {
              force: body.force,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/locks/refresh') {
            const result = contentStore.refreshBlockLock(body.pathname, body.blockId, body.actor);
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/locks/release') {
            const result = contentStore.releaseBlockLock(body.pathname, body.blockId, body.actor);
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/blocks/release-draft') {
            const result = contentStore.releaseBlockDraft(body.pathname, body.blockId, body.actor, {
              force: body.force === true,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/reset') {
            const result = contentStore.resetFromSeed(body.seedState, {
              actor: body.actor,
              reason: 'seed-reset',
            });
            sendJson(res, result?.ok === false ? 500 : 200, result);
            return;
          }

          if (url.pathname === '/restore-backup') {
            const result = contentStore.restoreBackup(body.backupFileName, {
              actor: body.actor,
            });
            sendJson(res, result?.ok === false ? (result?.error === 'backup-not-found' ? 404 : 500) : 200, result);
            return;
          }

          if (url.pathname === '/promote-seed') {
            const result = contentStore.promoteCurrentStateToSeed({
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
        } finally {
          const durationMs = performance.now() - requestStartedAt;
          if (durationMs >= 25) {
            diagnostics.slowRequests = [
              ...diagnostics.slowRequests.slice(-19),
              {
                method: req.method,
                path: url.pathname,
                durationMs: Math.round(durationMs * 100) / 100,
              },
            ];
          }
          logPerf(`request ${req.method} ${url.pathname}`, durationMs);
        }
      });

      const configureServerDurationMs = performance.now() - pluginCreatedPerf;
      diagnostics.pluginCreatedMs = Math.round(configureServerDurationMs * 100) / 100;
      logPerf('plugin.configureServer', configureServerDurationMs, { serverInstanceId });
      server.httpServer?.once('listening', () => {
        const durationMs = performance.now() - pluginCreatedPerf;
        diagnostics.serverReadyAt = new Date().toISOString();
        diagnostics.serverReadyMs = Math.round(durationMs * 100) / 100;
        logPerf('server.ready', durationMs, {
          port: server.httpServer?.address?.()?.port || server.config.server.port || null,
          serverInstanceId,
        });
      });
      server.httpServer?.once('close', () => {
        authorityLease?.release();
      });
      server.httpServer?.once('error', () => {
        authorityLease?.release();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), contentAdminDevPlugin()],
  server: {
    strictPort: true,
    watch: {
      ignored: [
        '**/dev-data/backups/**',
        '**/dev-data/content-admin-revisions/**',
        '**/coverage/**',
        '**/dist/**',
        '**/test-results/**',
        '**/screenshots/**',
        '**/*.trace.json',
        '**/*.json.gz',
      ],
    },
  },
});
