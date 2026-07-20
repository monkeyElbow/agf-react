import { toDevIdentitySummary } from './devIdentity';

const MAX_CONTENT_HISTORY_ENTRIES = 40;
const SHARED_ACTIVE_CONTENT_POLL_DELAY_MS = 650;
const SHARED_VISIBLE_CONTENT_POLL_DELAY_MS = 1800;

export function normalizeContentActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) {
    return null;
  }
  return toDevIdentitySummary(source);
}

export function normalizeContentBlockMeta(rawMeta) {
  const source = rawMeta && typeof rawMeta === 'object' ? rawMeta : {};
  return {
    draftedBy: normalizeContentActor(source.draftedBy),
    draftedAt: Number.isFinite(Number(source.draftedAt)) ? Number(source.draftedAt) : null,
    savedBy: normalizeContentActor(source.savedBy),
    savedAt: Number.isFinite(Number(source.savedAt)) ? Number(source.savedAt) : null,
    lockedBy: normalizeContentActor(source.lockedBy),
    lockedAt: Number.isFinite(Number(source.lockedAt)) ? Number(source.lockedAt) : null,
  };
}

export function normalizeContentHistoryEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const action = String(source.action || '').trim();
  const actor = normalizeContentActor(source.actor || source.createdBy);
  const createdAt = Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : null;
  if (!action || !actor || !createdAt) {
    return null;
  }

  return {
    id: String(source.id || `${createdAt}-${action}`).trim() || `${createdAt}-${action}`,
    action,
    blockId: String(source.blockId || '').trim(),
    details: String(source.details || '').trim(),
    actor,
    previousActor: normalizeContentActor(source.previousActor),
    createdAt,
  };
}

export function normalizeCollaborationState(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const next = {};

  Object.entries(source).forEach(([pathname, rawEntry]) => {
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const normalizedBlocks = {};

    Object.entries(entry.blocks || {}).forEach(([blockId, blockMeta]) => {
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedBlockId) {
        return;
      }
      normalizedBlocks[normalizedBlockId] = normalizeContentBlockMeta(blockMeta);
    });

    const history = (Array.isArray(entry.history) ? entry.history : [])
      .map(normalizeContentHistoryEntry)
      .filter(Boolean)
      .slice(0, MAX_CONTENT_HISTORY_ENTRIES);

    next[pathname] = {
      blocks: normalizedBlocks,
      history,
    };
  });

  return next;
}

export function normalizeSharedSaveResult(rawResult) {
  const source = rawResult && typeof rawResult === 'object' ? rawResult : {};
  return {
    error: String(source.error || '').trim(),
    didSave: Boolean(source.didSave),
    hasConflicts: Boolean(source.hasConflicts),
    changedPaths: Array.isArray(source.changedPaths) ? source.changedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    savedPaths: Array.isArray(source.savedPaths) ? source.savedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    savedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.savedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.blockedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlocks: (Array.isArray(source.blockedBlocks) ? source.blockedBlocks : [])
      .map((entry) => ({
        pathname: String(entry?.pathname || '').trim(),
        blockId: String(entry?.blockId || '').trim(),
        reason: String(entry?.reason || '').trim(),
        state: String(entry?.state || '').trim(),
        owner: normalizeContentActor(entry?.owner),
      }))
      .filter((entry) => entry.pathname && entry.blockId),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

export function normalizeSharedPublishResult(rawResult) {
  const source = rawResult && typeof rawResult === 'object' ? rawResult : {};
  return {
    error: String(source.error || '').trim(),
    didPublish: Boolean(source.didPublish),
    hasConflicts: Boolean(source.hasConflicts),
    changedPaths: Array.isArray(source.changedPaths) ? source.changedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    publishedPaths: Array.isArray(source.publishedPaths) ? source.publishedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    publishedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.publishedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.blockedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlocks: (Array.isArray(source.blockedBlocks) ? source.blockedBlocks : [])
      .map((entry) => ({
        pathname: String(entry?.pathname || '').trim(),
        blockId: String(entry?.blockId || '').trim(),
        reason: String(entry?.reason || '').trim(),
        state: String(entry?.state || '').trim(),
        owner: normalizeContentActor(entry?.owner),
      }))
      .filter((entry) => entry.pathname && entry.blockId),
    hasOrderChangesByPath: Object.fromEntries(
      Object.entries(source.hasOrderChangesByPath || {}).map(([pathname, hasChanges]) => [
        String(pathname || '').trim(),
        Boolean(hasChanges),
      ]),
    ),
    hasPageMetaChangesByPath: Object.fromEntries(
      Object.entries(source.hasPageMetaChangesByPath || {}).map(([pathname, hasChanges]) => [
        String(pathname || '').trim(),
        Boolean(hasChanges),
      ]),
    ),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

export function getSharedContentPollDelay(isDocumentHidden) {
  return getSharedContentPollDelayForActivity(isDocumentHidden, false);
}

export function getSharedContentPollDelayForActivity(isDocumentHidden, hasActiveEditing) {
  if (isDocumentHidden) {
    return 10000;
  }
  return hasActiveEditing ? SHARED_ACTIVE_CONTENT_POLL_DELAY_MS : SHARED_VISIBLE_CONTENT_POLL_DELAY_MS;
}

export function mergeSharedCollaborationSnapshot(currentState, snapshotState) {
  if (JSON.stringify(currentState?.collaborationByPath || {}) === JSON.stringify(snapshotState?.collaborationByPath || {})) {
    return currentState;
  }
  return {
    ...currentState,
    collaborationByPath: snapshotState?.collaborationByPath || {},
  };
}

export function blockSnapshotEquals(left, right) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeBlocksPreservingReferences(currentBlocks, nextBlocks) {
  const currentList = Array.isArray(currentBlocks) ? currentBlocks : [];
  const nextList = Array.isArray(nextBlocks) ? nextBlocks : [];
  const currentById = new Map(currentList.map((block) => [String(block?.id || '').trim(), block]));
  let changed = currentList.length !== nextList.length;
  const merged = nextList.map((nextBlock, index) => {
    const nextId = String(nextBlock?.id || '').trim();
    const currentBlock = currentById.get(nextId);
    if (currentBlock && blockSnapshotEquals(currentBlock, nextBlock)) {
      if (currentList[index] !== currentBlock) {
        changed = true;
      }
      return currentBlock;
    }
    changed = true;
    return nextBlock;
  });
  return changed ? merged : currentList;
}

function getComparablePageAliases(pathAliases, pathname) {
  const normalizedPath = String(pathname || '').trim();
  return Object.fromEntries(
    Object.entries(pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
}

export function collectChangedCollaborationPaths(currentState, snapshotState) {
  const allPaths = new Set([
    ...Object.keys(currentState?.collaborationByPath || {}),
    ...Object.keys(snapshotState?.collaborationByPath || {}),
  ]);
  return [...allPaths].filter((pathname) => (
    JSON.stringify(currentState?.collaborationByPath?.[pathname] || null)
    !== JSON.stringify(snapshotState?.collaborationByPath?.[pathname] || null)
  ));
}

export function mergeSharedAuthoringSnapshot(currentState, snapshotState, options = {}) {
  const authoringPaths = new Set(Array.isArray(options.authoringPaths) ? options.authoringPaths : []);
  const collaborationPaths = new Set(Array.isArray(options.collaborationPaths) ? options.collaborationPaths : []);
  if (!authoringPaths.size && !collaborationPaths.size) {
    return currentState;
  }

  let blocksByPath = currentState.blocksByPath || {};
  let pageHierarchy = currentState.pageHierarchy || {};
  let pathAliases = currentState.pathAliases || {};
  let collaborationByPath = currentState.collaborationByPath || {};

  authoringPaths.forEach((pathname) => {
    const nextBlocks = mergeBlocksPreservingReferences(
      currentState.blocksByPath?.[pathname] || [],
      snapshotState.blocksByPath?.[pathname] || [],
    );
    if (nextBlocks !== (currentState.blocksByPath?.[pathname] || [])) {
      if (blocksByPath === currentState.blocksByPath) {
        blocksByPath = {
          ...(currentState.blocksByPath || {}),
        };
      }
      blocksByPath[pathname] = nextBlocks;
    }

    const currentPage = currentState.pageHierarchy?.[pathname] || null;
    const nextPage = snapshotState.pageHierarchy?.[pathname] || null;
    if (JSON.stringify(currentPage) !== JSON.stringify(nextPage)) {
      if (pageHierarchy === currentState.pageHierarchy) {
        pageHierarchy = {
          ...(currentState.pageHierarchy || {}),
        };
      }
      pageHierarchy[pathname] = nextPage;
    }

    const currentAliases = getComparablePageAliases(currentState.pathAliases, pathname);
    const nextAliases = getComparablePageAliases(snapshotState.pathAliases, pathname);
    if (JSON.stringify(currentAliases) !== JSON.stringify(nextAliases)) {
      if (pathAliases === currentState.pathAliases) {
        pathAliases = { ...(currentState.pathAliases || {}) };
      }
      Object.keys(pathAliases).forEach((fromPath) => {
        const toPath = pathAliases[fromPath];
        if (String(fromPath || '').trim() === pathname || String(toPath || '').trim() === pathname) {
          delete pathAliases[fromPath];
        }
      });
      Object.assign(pathAliases, nextAliases);
    }
  });

  collaborationPaths.forEach((pathname) => {
    const currentEntry = currentState.collaborationByPath?.[pathname] || null;
    const nextEntry = snapshotState.collaborationByPath?.[pathname] || null;
    if (JSON.stringify(currentEntry) === JSON.stringify(nextEntry)) {
      return;
    }
    if (collaborationByPath === currentState.collaborationByPath) {
      collaborationByPath = {
        ...(currentState.collaborationByPath || {}),
      };
    }
    collaborationByPath[pathname] = nextEntry;
  });

  if (
    blocksByPath === currentState.blocksByPath
    && pageHierarchy === currentState.pageHierarchy
    && pathAliases === currentState.pathAliases
    && collaborationByPath === currentState.collaborationByPath
  ) {
    return currentState;
  }

  return {
    ...currentState,
    blocksByPath,
    pageHierarchy,
    pathAliases,
    collaborationByPath,
  };
}

export function hasActiveSharedEditing(state, currentActor = null) {
  const currentUserId = String(currentActor?.userId || '').trim();
  return Object.values(state?.collaborationByPath || {}).some((entry) => (
    Object.values(entry?.blocks || {}).some((meta) => {
      const lockedById = String(meta?.lockedBy?.userId || '').trim();
      return Boolean(lockedById && lockedById !== currentUserId);
    })
  ));
}

export function buildHistoryEntry({ action, blockId = '', actor, details = '', previousActor = null, now = Date.now() }) {
  const normalizedActor = normalizeContentActor(actor);
  if (!normalizedActor) {
    return null;
  }
  const normalizedPreviousActor = normalizeContentActor(previousActor);
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    action: String(action || '').trim(),
    blockId: String(blockId || '').trim(),
    details: String(details || '').trim(),
    actor: normalizedActor,
    previousActor: normalizedPreviousActor,
    createdAt: now,
  };
}

export function appendHistoryEntry(history, nextEntry) {
  const entry = normalizeContentHistoryEntry(nextEntry);
  const current = Array.isArray(history) ? history : [];
  if (!entry) {
    return current;
  }
  return [entry, ...current].slice(0, MAX_CONTENT_HISTORY_ENTRIES);
}

export function buildEditingBlockMeta(previousMeta, actor, now = Date.now()) {
  const current = normalizeContentBlockMeta(previousMeta);
  const normalizedActor = normalizeContentActor(actor);
  if (!normalizedActor) {
    return current;
  }

  return {
    draftedBy: current.draftedBy,
    draftedAt: current.draftedAt,
    savedBy: current.savedBy,
    savedAt: current.savedAt,
    lockedBy: normalizedActor,
    lockedAt: now,
  };
}

export function getForeignOwnershipMeta(meta, actor) {
  const normalizedMeta = normalizeContentBlockMeta(meta);
  const normalizedActor = normalizeContentActor(actor);
  const lockedByOther = normalizedMeta.lockedBy?.userId && normalizedMeta.lockedBy.userId !== normalizedActor?.userId
    ? normalizedMeta.lockedBy
    : null;
  const draftedByOther = normalizedMeta.draftedBy?.userId && normalizedMeta.draftedBy.userId !== normalizedActor?.userId
    ? normalizedMeta.draftedBy
    : null;
  return {
    lockedByOther,
    draftedByOther,
  };
}

export function releaseUserLocks(collaborationByPath, userId, { keepPath = '', keepBlockId = '' } = {}) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return collaborationByPath && typeof collaborationByPath === 'object' ? collaborationByPath : {};
  }

  const source = collaborationByPath && typeof collaborationByPath === 'object' ? collaborationByPath : {};
  let changed = false;
  const next = {};

  Object.entries(source).forEach(([pathname, entry]) => {
    const blocks = entry?.blocks || {};
    let blockChanged = false;
    const nextBlocks = {};

    Object.entries(blocks).forEach(([blockId, rawMeta]) => {
      const meta = normalizeContentBlockMeta(rawMeta);
      const shouldKeep = pathname === keepPath && blockId === keepBlockId;
      if (!shouldKeep && meta.lockedBy?.userId === normalizedUserId) {
        blockChanged = true;
        nextBlocks[blockId] = {
          ...meta,
          lockedBy: null,
          lockedAt: null,
        };
        return;
      }
      nextBlocks[blockId] = meta;
    });

    next[pathname] = blockChanged
      ? { ...entry, blocks: nextBlocks }
      : entry;
    changed = changed || blockChanged;
  });

  return changed ? next : source;
}
