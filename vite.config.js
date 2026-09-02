import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createJsonContentStore } from './dev-server/jsonContentStore';
import { createSharedDisclosuresStore } from './dev-server/disclosuresStore';
import { createContentAdminAuthorityLease } from './dev-server/contentAdminAuthority.js';
import { createContentAdminSessionManager } from './dev-server/contentAdminAuth.js';
import {
  isContentAdminPublicPublishedRead,
  isSameOriginContentAdminRequest,
  shouldAllowUnauthenticatedContentAdminRequest,
} from './dev-server/contentAdminHttpBoundary.js';
import { buildSiteChatbotGroundingContext } from './src/lib/chatbotGrounding.js';

const MAX_CONTENT_ADMIN_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_CHATBOT_REQUEST_BYTES = 32 * 1024;
const MAX_CHATBOT_PROMPT_LENGTH = 2000;
const CHATBOT_RATE_WINDOW_MS = 60 * 1000;
const CHATBOT_RATE_LIMIT = 20;
const VITE_RUNTIME_BUILD_ID = `${process.pid}-${Date.now()}`;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function readRequestBody(req, maxBytes = MAX_CONTENT_ADMIN_REQUEST_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    let receivedBytes = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > maxBytes) {
        rejected = true;
        const error = new Error('Request body exceeds the allowed size.');
        error.code = 'request-body-too-large';
        req.resume();
        reject(error);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (rejected) return;
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
    req.on('error', (error) => {
      if (!rejected) reject(error);
    });
  });
}

function getSafeDiagnostics(diagnostics, authorityLease, server) {
  return {
    serverInstanceId: diagnostics.serverInstanceId,
    buildId: diagnostics.buildId,
    startupAt: diagnostics.startupAt,
    serverReadyAt: diagnostics.serverReadyAt,
    storeReadyAt: diagnostics.storeReadyAt,
    pluginCreatedMs: diagnostics.pluginCreatedMs,
    serverReadyMs: diagnostics.serverReadyMs,
    storeReadyMs: diagnostics.storeReadyMs,
    requestCount: diagnostics.requestCount,
    slowRequests: diagnostics.slowRequests,
    authority: {
      ownsLease: authorityLease.isOwner(),
      identity: {
        authorityInstanceId: diagnostics.serverInstanceId,
        host: authorityLease.getIdentity().host,
        port: server.httpServer?.address?.()?.port || server.config.server.port || null,
      },
    },
    port: server.httpServer?.address?.()?.port || server.config.server.port || null,
    now: new Date().toISOString(),
    elapsedSincePluginCreateMs: Math.round((Date.now() - Number(diagnostics.startupAtMs || Date.now())) * 100) / 100,
  };
}

function contentAdminDevPlugin() {
  const repoRoot = process.cwd();
  const env = {
    ...process.env,
    ...loadEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development', repoRoot, ''),
  };
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
    buildId: VITE_RUNTIME_BUILD_ID,
    processId: process.pid,
    repoRoot,
    persistenceFile,
    revisionDirectory,
    authorityLockFile,
    startupAt: new Date(pluginCreatedAt).toISOString(),
    startupAtMs: pluginCreatedAt,
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
  const sessionManager = createContentAdminSessionManager({
    password: env.CONTENT_ADMIN_DEV_PASSWORD,
  });
  const chatbotRateByAddress = new Map();

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
      // Vite can re-run configureServer during a config restart before the
      // previous HTTP server emits close. Release this process's lease first
      // so a normal restart cannot look like a second content authority.
      const previousAuthorityLease = authorityLease;
      previousAuthorityLease?.release();
      const nextAuthorityLease = createContentAdminAuthorityLease({
        lockFile: authorityLockFile,
        host: server.config.server.host === true
          ? '0.0.0.0'
          : server.config.server.host || 'localhost',
        port: server.config.server.port || null,
        projectRoot: repoRoot,
        authorityInstanceId: serverInstanceId,
        allowSameProcessRestart: true,
      });
      nextAuthorityLease.acquire();
      authorityLease = nextAuthorityLease;
      // A store retains the lease object it was created with. Rebuild it on
      // an in-process Vite restart so writes use the replacement lease.
      store = null;
      disclosuresStore = null;
      server.middlewares.use('/__dev/content-admin', async (req, res) => {
        const requestStartedAt = performance.now();
        diagnostics.requestCount += 1;
        const url = new URL(req.url || '/', 'http://localhost');
        try {
          if (!isSameOriginContentAdminRequest({
            origin: req.headers?.origin,
            host: req.headers?.host,
          })) {
            sendJson(res, 403, {
              error: 'content-admin-origin-rejected',
              details: 'Content-admin requests must come from the same origin.',
            });
            return;
          }

          if (url.pathname === '/auth/login') {
            if (req.method !== 'POST') {
              sendJson(res, 404, { error: 'not-found' });
              return;
            }
            const body = await readRequestBody(req, 16 * 1024);
            const login = sessionManager.login(body.password, body.actor);
            if (!login.ok) {
              sendJson(res, login.status, login);
              return;
            }
            res.setHeader('Set-Cookie', sessionManager.cookieHeader(login.sessionId));
            sendJson(res, 200, { ok: true, actor: login.actor, expiresAt: login.expiresAt });
            return;
          }

          if (url.pathname === '/auth/logout') {
            if (req.method !== 'POST') {
              sendJson(res, 404, { error: 'not-found' });
              return;
            }
            sessionManager.logout(req.headers.cookie);
            res.setHeader('Set-Cookie', `${sessionManager.cookieHeader('')}; Max-Age=0`);
            sendJson(res, 200, { ok: true });
            return;
          }

          let body = {};
          if (req.method === 'POST') {
            body = await readRequestBody(req);
          }
          const isPublicPublishedRead = isContentAdminPublicPublishedRead(req.method, url.pathname);
          if (!isPublicPublishedRead) {
            const auth = sessionManager.authenticate(req.headers.cookie);
            if (!auth.ok) {
              // Keep the trusted development LAN workflow usable before the
              // server-backed account system exists. A password remains an
              // optional opt-in boundary when this dev server is shared more
              // broadly than the trusted local network.
              if (!shouldAllowUnauthenticatedContentAdminRequest({
                sessionConfigured: sessionManager.isConfigured(),
              })) {
                sendJson(res, auth.status, {
                  error: auth.error,
                  details: auth.details,
                });
                return;
              }
            } else {
              // The browser may send actor metadata for compatibility, but
              // the authenticated session is the authority for who performed
              // the action.
              body.actor = auth.session.actor;
            }
          }

          if (req.method === 'GET' && url.pathname === '/diagnostics') {
            sendJson(res, 200, getSafeDiagnostics(diagnostics, authorityLease, server));
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

          if (req.method === 'GET' && url.pathname === '/render-contract') {
            sendJson(res, 200, contentStore.getRenderConvergenceContract(url.searchParams.get('path')));
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

          if (url.pathname === '/disclosures/save-live') {
            sendJson(res, 200, sharedDisclosuresStore.saveLivePatch(body.patch, body.actor));
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

          if (url.pathname === '/migrate-qcd-centered-card-grid') {
            const result = contentStore.migrateQcdCenteredCardGridSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-online-contributions-step-cards') {
            const result = contentStore.migrateOnlineContributionsStepsSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-numbered-step-cards') {
            const result = contentStore.migrateNumberedStepCardsSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-site-feature-collections') {
            const result = contentStore.migrateSiteFeatureCollectionsSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-services-matters-billboard') {
            const result = contentStore.migrateServicesMattersBillboardSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-about-strategy-billboard') {
            const result = contentStore.migrateAboutStrategyBillboardSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-services-directory') {
            const result = contentStore.migrateServicesDirectorySnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-support-library') {
            const result = contentStore.migrateSupportLibrarySnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-cga-secure-act-card') {
            const result = contentStore.migrateCgaSecureActCardSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-endowments-presentation') {
            const result = contentStore.migrateEndowmentsPresentationSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-mif-request-headline-colors') {
            const result = contentStore.migrateMifRequestHeadlineColorSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-qcd-request-headline-colors') {
            const result = contentStore.migrateQcdRequestHeadlineColorSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-insurance-coverage-cta') {
            const result = contentStore.migrateInsuranceCoverageCtaSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-insurance-feature-columns') {
            const result = contentStore.migrateInsuranceFeatureColumnsSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/migrate-insurance-pc-resource-card-lists') {
            const result = contentStore.migrateInsurancePcResourceCardsSnapshot({
              actor: body.actor,
              reason: body.reason,
            });
            sendJson(res, result.ok ? 200 : 409, result);
            return;
          }

          if (url.pathname === '/blocks/sync-draft') {
            const result = contentStore.syncBlockDraft(body.pathname, body.blockId, body.block, {
              actor: body.actor,
              expectedPublishedRevision: body.expectedPublishedRevision,
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
          if (error?.code === 'request-body-too-large') {
            sendJson(res, 413, {
              error: 'request-body-too-large',
              details: 'Request body exceeds the allowed size.',
            });
            return;
          }
          if (error?.code === 'CONTENT_ADMIN_AUTHORITY_UNAVAILABLE') {
            // This is an expected safety rejection after a restart or lease
            // replacement. Return a machine-readable circuit-breaker signal;
            // do not print one stack-less error for every queued editor sync.
            sendJson(res, 503, {
              error: 'content-admin-authority-lost',
              details: error.message,
              authority: getSafeDiagnostics(diagnostics, authorityLease, server).authority,
            });
            return;
          }
          const errorDetails = error instanceof Error
            ? error.message
            : String(error || 'Unknown content-admin server error');
          console.error('[content-admin] request failed', {
            method: req.method,
            path: url.pathname,
            error: errorDetails,
          });
          sendJson(res, 500, {
            error: 'content-admin-dev-server-error',
            details: `The content-admin request could not be completed: ${errorDetails}`,
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

      server.middlewares.use('/api/chatbot', async (req, res) => {
        if (req.method !== 'POST' || !isSameOriginContentAdminRequest({
          origin: req.headers?.origin,
          host: req.headers?.host,
        })) {
          sendJson(res, 405, { error: 'method-not-allowed' });
          return;
        }
        try {
          const address = String(req.socket?.remoteAddress || 'unknown');
          const now = Date.now();
          const recent = (chatbotRateByAddress.get(address) || []).filter((timestamp) => now - timestamp < CHATBOT_RATE_WINDOW_MS);
          if (recent.length >= CHATBOT_RATE_LIMIT) {
            sendJson(res, 429, { error: 'chatbot-rate-limit', details: 'Please wait before sending another message.' });
            return;
          }
          chatbotRateByAddress.set(address, [...recent, now]);
          const body = await readRequestBody(req, MAX_CHATBOT_REQUEST_BYTES);
          const prompt = String(body.prompt || '').trim();
          if (!prompt || prompt.length > MAX_CHATBOT_PROMPT_LENGTH) {
            sendJson(res, 400, { error: 'chatbot-prompt-invalid', details: `Prompt must be between 1 and ${MAX_CHATBOT_PROMPT_LENGTH} characters.` });
            return;
          }
          const apiKey = String(env.OPENAI_API_KEY || '').trim();
          if (!apiKey) {
            sendJson(res, 503, { error: 'chatbot-not-configured' });
            return;
          }
          const { default: OpenAI } = await import('openai');
          const client = new OpenAI({ apiKey });
          const conversation = Array.isArray(body.conversation) ? body.conversation.slice(-6) : [];
          const transcript = conversation
            .filter((message) => message?.role === 'assistant' || message?.role === 'user')
            .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${String(message.text || '').slice(0, MAX_CHATBOT_PROMPT_LENGTH)}`)
            .filter(Boolean)
            .join('\n\n');
          const grounding = buildSiteChatbotGroundingContext(prompt);
          const input = [grounding, transcript, `User: ${prompt}`].filter(Boolean).join('\n\n');
          const response = await client.responses.create({
            model: 'gpt-5.4-mini',
            instructions: 'You are the AGFinancial website assistant. Answer only from approved AGFinancial content provided in the prompt. Do not invent URLs, rates, policies, or personalized financial, legal, tax, or retirement advice. Be concise and suggest contacting AGFinancial when information is incomplete.',
            input,
          });
          const outputText = String(response.output_text || '').trim();
          if (!outputText) {
            sendJson(res, 502, { error: 'chatbot-empty-response' });
            return;
          }
          sendJson(res, 200, { text: outputText });
        } catch (error) {
          if (error?.code === 'request-body-too-large') {
            sendJson(res, 413, { error: 'request-body-too-large', details: 'Request body exceeds the allowed size.' });
            return;
          }
          sendJson(res, 502, { error: 'chatbot-request-failed', details: 'The chatbot service is temporarily unavailable.' });
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
        nextAuthorityLease.release();
      });
      server.httpServer?.once('error', () => {
        nextAuthorityLease.release();
      });
    },
  };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_AG_RUNTIME_BUILD_ID': JSON.stringify(VITE_RUNTIME_BUILD_ID),
  },
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
