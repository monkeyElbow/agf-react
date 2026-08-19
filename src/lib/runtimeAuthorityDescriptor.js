import { getBlockAuthority } from './managedRouteAuthorityManifest';

export const RUNTIME_AUTHORITY_GLOBAL_KEY = '__AGF_CONTENT_RUNTIME_AUTHORITY__';
export const RUNTIME_AUTHORITY_DESCRIPTOR_VERSION = 1;

function normalize(value) {
  return String(value || '').trim();
}

function cloneDescriptor(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildRuntimeAuthorityDescriptor({
  pathname = '/',
  block = null,
  section = null,
  source = 'published',
  draftRevision = '',
  publishedRevision = '',
  activeRevision = '',
  hudEnabled = false,
  runtimeBuildId = '',
  routeAuthority = null,
  blockAuthority = null,
} = {}) {
  const blockId = normalize(block?.id || section?.blockId);
  const blockKind = normalize(block?.kind || block?.type || section?.renderContract?.kind);
  const authority = blockAuthority || getBlockAuthority(blockKind, pathname);
  const contract = section?.renderContract || {};
  const route = routeAuthority || authority?.route || null;
  const blockFamily = authority?.block || null;
  return {
    version: RUNTIME_AUTHORITY_DESCRIPTOR_VERSION,
    pathname: normalize(pathname) || '/',
    blockId,
    blockKind,
    source: normalize(source) || 'published',
    draftRevision: normalize(draftRevision),
    publishedRevision: normalize(publishedRevision),
    activeRevision: normalize(activeRevision),
    hudEnabled: Boolean(hudEnabled),
    runtimeBuildId: normalize(runtimeBuildId),
    routeOwner: normalize(route?.routeOwner),
    authorityStatus: authority?.authorityStatus || route?.authorityStatus || 'unknown',
    composer: normalize(route?.composer),
    renderer: normalize(
      contract.renderer
      || authority?.renderer
      || blockFamily?.renderer
      || route?.renderer,
    ),
    editor: normalize(blockFamily?.editor || route?.editor),
    cssFamily: Array.isArray(blockFamily?.cssFamily)
      ? blockFamily.cssFamily.map(normalize).filter(Boolean)
      : (Array.isArray(route?.cssFamily) ? route.cssFamily.map(normalize).filter(Boolean) : []),
    renderContract: {
      version: contract.version,
      presetId: normalize(contract.presetId),
      rootClassName: normalize(contract.rootClassName),
      runtimeClassName: normalize(contract.runtimeClassName),
    },
  };
}

/**
 * Publishes diagnostics only in a development browser global. It is not used
 * by rendering, persistence, or admin state. The return value is safe to use
 * in tests without requiring a browser global.
 */
export function publishRuntimeAuthorityDescriptor(descriptors, {
  pathname = '/',
  hudEnabled = false,
  runtimeBuildId = '',
  mergeExisting = false,
} = {}) {
  const nextBlocks = (Array.isArray(descriptors) ? descriptors : []).map(cloneDescriptor);
  const existing = mergeExisting
    && typeof window !== 'undefined'
    && import.meta.env?.DEV
    && window[RUNTIME_AUTHORITY_GLOBAL_KEY]?.pathname === (normalize(pathname) || '/')
    ? window[RUNTIME_AUTHORITY_GLOBAL_KEY].blocks || []
    : [];
  const blocksById = new Map(existing.concat(nextBlocks).map((block) => [block.blockId, block]));
  const payload = {
    version: RUNTIME_AUTHORITY_DESCRIPTOR_VERSION,
    pathname: normalize(pathname) || '/',
    hudEnabled: Boolean(hudEnabled),
    runtimeBuildId: normalize(runtimeBuildId),
    blocks: [...blocksById.values()],
  };

  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    window[RUNTIME_AUTHORITY_GLOBAL_KEY] = payload;
  }
  return payload;
}

export function readRuntimeAuthorityDescriptor(target = typeof window !== 'undefined' ? window : null) {
  if (!target || !target[RUNTIME_AUTHORITY_GLOBAL_KEY]) {
    return null;
  }
  return cloneDescriptor(target[RUNTIME_AUTHORITY_GLOBAL_KEY]);
}

export function clearRuntimeAuthorityDescriptor(target = typeof window !== 'undefined' ? window : null) {
  if (target && Object.prototype.hasOwnProperty.call(target, RUNTIME_AUTHORITY_GLOBAL_KEY)) {
    delete target[RUNTIME_AUTHORITY_GLOBAL_KEY];
  }
}
