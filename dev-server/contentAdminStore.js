import fs from 'node:fs';
import path from 'node:path';
import { normalizePresetBearingBlocks } from '../src/lib/blockPresetIdentity.js';

const DEFAULT_MAX_REVISIONS_PER_PAGE = 40;

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) {
    return null;
  }
  const userId = String(source.userId || '').trim();
  const displayName = String(source.displayName || '').trim();
  if (!userId || !displayName) {
    return null;
  }
  return {
    userId,
    displayName,
    initials: String(source.initials || '').trim() || displayName.slice(0, 2).toUpperCase(),
    accentColor: String(source.accentColor || '').trim() || '#00adbb',
  };
}

function normalizeBlockMeta(rawMeta) {
  const source = rawMeta && typeof rawMeta === 'object' ? rawMeta : {};
  return {
    draftedBy: normalizeActor(source.draftedBy),
    draftedAt: Number.isFinite(Number(source.draftedAt)) ? Number(source.draftedAt) : null,
    savedBy: normalizeActor(source.savedBy),
    savedAt: Number.isFinite(Number(source.savedAt)) ? Number(source.savedAt) : null,
    lockedBy: normalizeActor(source.lockedBy),
    lockedAt: Number.isFinite(Number(source.lockedAt)) ? Number(source.lockedAt) : null,
  };
}

function normalizeHistoryEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const action = String(source.action || '').trim();
  const actor = normalizeActor(source.actor || source.createdBy);
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
    previousActor: normalizeActor(source.previousActor),
    createdAt,
  };
}

function normalizeCollaborationByPath(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const next = {};
  Object.entries(source).forEach(([pathname, rawEntry]) => {
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const blocks = {};
    Object.entries(entry.blocks || {}).forEach(([blockId, rawMeta]) => {
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedBlockId) {
        return;
      }
      blocks[normalizedBlockId] = normalizeBlockMeta(rawMeta);
    });
    next[pathname] = {
      blocks,
      history: (Array.isArray(entry.history) ? entry.history : [])
        .map(normalizeHistoryEntry)
        .filter(Boolean),
    };
  });
  return next;
}

function normalizeSharedState(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  return {
    pageHierarchy: cloneJson(source.pageHierarchy || {}),
    blocksByPath: Object.fromEntries(
      Object.entries(source.blocksByPath || {}).map(([pathname, blocks]) => [
        pathname,
        normalizePageBlocksState(blocks),
      ]),
    ),
    pathAliases: cloneJson(source.pathAliases || {}),
    collaborationByPath: normalizeCollaborationByPath(source.collaborationByPath || {}),
  };
}

function buildHistoryEntry({ action, blockId = '', actor, details = '', previousActor = null, now = Date.now(), createId }) {
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return null;
  }
  return {
    id: createId(now),
    action: String(action || '').trim(),
    blockId: String(blockId || '').trim(),
    details: String(details || '').trim(),
    actor: normalizedActor,
    previousActor: normalizeActor(previousActor),
    createdAt: now,
  };
}

function appendHistoryEntry(history, entry) {
  const current = Array.isArray(history) ? history : [];
  const normalizedEntry = normalizeHistoryEntry(entry);
  if (!normalizedEntry) {
    return current;
  }
  return [normalizedEntry, ...current];
}

function ensureCollaborationEntry(collaborationByPath, pathname) {
  const normalizedPath = String(pathname || '').trim();
  return collaborationByPath[normalizedPath] || { blocks: {}, history: [] };
}

function indexBlocksById(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  return new Map(
    source
      .map((block) => [String(block?.id || '').trim(), cloneJson(block)])
      .filter(([blockId]) => blockId),
  );
}

function areBlocksEquivalent(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function mergeHistoryLists(currentHistory, incomingHistory) {
  const byId = new Map();
  [...(Array.isArray(currentHistory) ? currentHistory : []), ...(Array.isArray(incomingHistory) ? incomingHistory : [])]
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .forEach((entry) => {
      byId.set(entry.id, entry);
    });
  return Array.from(byId.values()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function getOtherActorConflict(meta, actor) {
  const normalizedMeta = normalizeBlockMeta(meta);
  const normalizedActor = normalizeActor(actor);
  const lockedBy = normalizedMeta.lockedBy;
  if (lockedBy?.userId && lockedBy.userId !== normalizedActor?.userId) {
    return {
      reason: 'locked-by-other',
      owner: lockedBy,
      state: 'editing-other',
    };
  }
  if (lockedBy?.userId && lockedBy.userId === normalizedActor?.userId) {
    return null;
  }
  const draftedBy = normalizedMeta.draftedBy;
  if (draftedBy?.userId && draftedBy.userId !== normalizedActor?.userId) {
    return {
      reason: 'drafted-by-other',
      owner: draftedBy,
      state: 'drafted-other',
    };
  }
  return null;
}

function buildSavedBlockMeta(currentMeta, actor, timestamp) {
  const normalizedCurrent = normalizeBlockMeta(currentMeta);
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return normalizedCurrent;
  }
  return {
    draftedBy: normalizedActor,
    draftedAt: timestamp,
    savedBy: normalizedActor,
    savedAt: timestamp,
    lockedBy: null,
    lockedAt: null,
  };
}

function buildSyncedDraftBlockMeta(currentMeta, actor, timestamp) {
  const normalizedCurrent = normalizeBlockMeta(currentMeta);
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return normalizedCurrent;
  }
  const keepsOwnLock = normalizedCurrent.lockedBy?.userId === normalizedActor.userId;
  return {
    draftedBy: normalizedActor,
    draftedAt: timestamp,
    savedBy: normalizedCurrent.savedBy,
    savedAt: normalizedCurrent.savedAt,
    lockedBy: keepsOwnLock ? normalizedCurrent.lockedBy || normalizedActor : null,
    lockedAt: keepsOwnLock ? timestamp : null,
  };
}

function getForeignOwnershipMeta(meta, actor) {
  const normalizedMeta = normalizeBlockMeta(meta);
  const normalizedActor = normalizeActor(actor);
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

function mergePageDraftForSafeSave(pathname, currentState, incomingState, actor, { now: getNow, createId }) {
  const timestamp = getNow();
  const currentBlocks = Array.isArray(currentState?.blocksByPath?.[pathname]) ? currentState.blocksByPath[pathname] : [];
  const incomingBlocks = Array.isArray(incomingState?.blocksByPath?.[pathname]) ? incomingState.blocksByPath[pathname] : [];
  const currentById = indexBlocksById(currentBlocks);
  const incomingById = indexBlocksById(incomingBlocks);
  const currentEntry = ensureCollaborationEntry(currentState?.collaborationByPath || {}, pathname);
  const incomingEntry = ensureCollaborationEntry(incomingState?.collaborationByPath || {}, pathname);

  const allBlockIds = new Set([
    ...currentById.keys(),
    ...incomingById.keys(),
  ]);
  const changedBlockIds = [...allBlockIds].filter((blockId) => (
    !areBlocksEquivalent(currentById.get(blockId), incomingById.get(blockId))
  ));

  const blockedBlocks = [];
  const blockedBlockIdSet = new Set();
  changedBlockIds.forEach((blockId) => {
    const conflict = getOtherActorConflict(currentEntry.blocks?.[blockId], actor);
    if (!conflict) {
      return;
    }
    blockedBlockIdSet.add(blockId);
    blockedBlocks.push({
      pathname,
      blockId,
      reason: conflict.reason,
      owner: cloneJson(conflict.owner),
      state: conflict.state,
    });
  });

  const currentOrder = currentBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const incomingOrder = incomingBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const hasStructuralDiff = JSON.stringify(currentOrder) !== JSON.stringify(incomingOrder);
  const hasBlockedStructuralConflict = hasStructuralDiff && blockedBlockIdSet.size > 0;

  let mergedBlocks;
  if (hasBlockedStructuralConflict) {
    const next = [];
    currentBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (!blockId) {
        return;
      }
      if (blockedBlockIdSet.has(blockId)) {
        next.push(cloneJson(block));
        return;
      }
      if (incomingById.has(blockId)) {
        next.push(cloneJson(incomingById.get(blockId)));
      }
    });
    incomingBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (!blockId || currentById.has(blockId)) {
        return;
      }
      next.push(cloneJson(block));
    });
    mergedBlocks = next;
  } else {
    mergedBlocks = incomingBlocks.map((block) => {
      const blockId = String(block?.id || '').trim();
      if (blockId && blockedBlockIdSet.has(blockId) && currentById.has(blockId)) {
        return cloneJson(currentById.get(blockId));
      }
      return cloneJson(block);
    });
  }

  const savedBlockIds = [];
  const nextBlocksMeta = {};
  const mergedBlockIds = mergedBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  mergedBlockIds.forEach((blockId) => {
    const incomingBlock = incomingById.get(blockId);
    const currentBlock = currentById.get(blockId);
    const currentMeta = currentEntry.blocks?.[blockId];
    if (blockedBlockIdSet.has(blockId)) {
      nextBlocksMeta[blockId] = normalizeBlockMeta(currentMeta);
      return;
    }
    if (!areBlocksEquivalent(currentBlock, incomingBlock)) {
      savedBlockIds.push(blockId);
      nextBlocksMeta[blockId] = buildSavedBlockMeta(currentMeta, actor, timestamp);
      return;
    }
    nextBlocksMeta[blockId] = normalizeBlockMeta(currentMeta || incomingEntry.blocks?.[blockId]);
  });

  const mergedHistory = mergeHistoryLists(currentEntry.history, incomingEntry.history);
  let nextHistory = mergedHistory;
  savedBlockIds.forEach((blockId) => {
    nextHistory = appendHistoryEntry(nextHistory, buildHistoryEntry({
      action: 'block-draft-saved',
      blockId,
      actor,
      now: timestamp,
      createId,
    }));
  });
  blockedBlocks.forEach((entry) => {
    nextHistory = appendHistoryEntry(nextHistory, buildHistoryEntry({
      action: 'block-save-blocked',
      blockId: entry.blockId,
      actor,
      previousActor: entry.owner,
      details: entry.reason,
      now: timestamp,
      createId,
    }));
  });

  return {
    blocks: mergedBlocks,
    collaborationEntry: {
      ...currentEntry,
      blocks: nextBlocksMeta,
      history: nextHistory,
    },
    blockedBlocks,
    blockedBlockIds: blockedBlocks.map((entry) => entry.blockId),
    savedBlockIds,
  };
}

function releaseUserLocks(collaborationByPath, userId, { keepPath = '', keepBlockId = '' } = {}) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return collaborationByPath;
  }
  let changed = false;
  const next = {};
  Object.entries(collaborationByPath || {}).forEach(([pathname, entry]) => {
    const blocks = entry?.blocks || {};
    let blockChanged = false;
    const nextBlocks = {};
    Object.entries(blocks).forEach(([blockId, rawMeta]) => {
      const meta = normalizeBlockMeta(rawMeta);
      const keep = pathname === keepPath && blockId === keepBlockId;
      if (!keep && meta.lockedBy?.userId === normalizedUserId) {
        blockChanged = true;
        nextBlocks[blockId] = { ...meta, lockedBy: null, lockedAt: null };
        return;
      }
      nextBlocks[blockId] = meta;
    });
    next[pathname] = blockChanged ? { ...entry, blocks: nextBlocks } : entry;
    changed = changed || blockChanged;
  });
  return changed ? next : collaborationByPath;
}

function aliasesForPath(pathAliases, pathname) {
  const normalizedPath = String(pathname || '').trim();
  const entries = {};
  Object.entries(pathAliases || {}).forEach(([fromPath, toPath]) => {
    if (String(toPath || '').trim() === normalizedPath) {
      entries[fromPath] = toPath;
    }
  });
  return entries;
}

function normalizePageBlocksState(blocks) {
  return normalizePresetBearingBlocks(
    (Array.isArray(blocks) ? blocks : []).map((block) => cloneJson(block)),
  );
}

function summarizePageAuthoringDiff(currentState, baselineState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasChanges: false,
    };
  }

  const current = normalizeSharedState(currentState);
  const baseline = normalizeSharedState(baselineState);
  const currentBlocks = normalizePageBlocksState(current.blocksByPath?.[normalizedPath]);
  const baselineBlocks = normalizePageBlocksState(baseline.blocksByPath?.[normalizedPath]);
  const currentBlockIds = currentBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const baselineBlockIds = baselineBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const orderedBlockIds = [...new Set([...currentBlockIds, ...baselineBlockIds])];
  const currentBlockById = new Map(currentBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const baselineBlockById = new Map(baselineBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const hasOrderChanges = JSON.stringify(currentBlockIds) !== JSON.stringify(baselineBlockIds);
  const changedBlockIds = orderedBlockIds.filter((blockId) => (
    JSON.stringify(currentBlockById.get(blockId) || null) !== JSON.stringify(baselineBlockById.get(blockId) || null)
  ));
  const hasPageMetaChanges = JSON.stringify({
    page: current.pageHierarchy?.[normalizedPath] || null,
    aliases: aliasesForPath(current.pathAliases, normalizedPath),
  }) !== JSON.stringify({
    page: baseline.pageHierarchy?.[normalizedPath] || null,
    aliases: aliasesForPath(baseline.pathAliases, normalizedPath),
  });

  return {
    changedBlockIds,
    changedBlockCount: changedBlockIds.length,
    hasOrderChanges,
    hasPageMetaChanges,
    hasChanges: Boolean(changedBlockIds.length || hasOrderChanges || hasPageMetaChanges),
  };
}

function replacePageSlice(targetState, sourceState, pathname, collaborationEntryOverride = undefined) {
  const normalizedPath = String(pathname || '').trim();
  const nextState = normalizeSharedState(targetState);
  const normalizedSource = normalizeSharedState(sourceState);
  if (!normalizedPath) {
    return nextState;
  }

  const nextPage = normalizedSource.pageHierarchy?.[normalizedPath] || null;
  if (nextPage) {
    nextState.pageHierarchy[normalizedPath] = cloneJson(nextPage);
  } else {
    delete nextState.pageHierarchy[normalizedPath];
  }

  nextState.blocksByPath[normalizedPath] = cloneJson(normalizedSource.blocksByPath?.[normalizedPath] || []);

  Object.keys(nextState.pathAliases || {}).forEach((fromPath) => {
    const toPath = nextState.pathAliases[fromPath];
    if (String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath) {
      delete nextState.pathAliases[fromPath];
    }
  });
  Object.assign(nextState.pathAliases, aliasesForPath(normalizedSource.pathAliases, normalizedPath));

  nextState.collaborationByPath[normalizedPath] = cloneJson(
    collaborationEntryOverride || normalizedSource.collaborationByPath?.[normalizedPath] || { blocks: {}, history: [] },
  );
  return nextState;
}

function buildRevisionSnapshot(state, pathname) {
  const normalizedState = normalizeSharedState(state);
  return {
    pathname,
    state: normalizedState,
    page: cloneJson(normalizedState.pageHierarchy?.[pathname] || null),
    blocks: cloneJson(normalizedState.blocksByPath?.[pathname] || []),
    collaboration: cloneJson(normalizedState.collaborationByPath?.[pathname] || { blocks: {}, history: [] }),
    pathAliases: aliasesForPath(normalizedState.pathAliases, pathname),
  };
}

function summarizeRevisionBlocksForHistory(snapshot) {
  const blocks = Array.isArray(snapshot?.blocks) ? snapshot.blocks : [];
  return blocks.map((block) => {
    const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
    const title = String(
      settings.title
      || settings.heading
      || settings.line1Text
      || settings.leftTitle
      || settings.card1Title
      || ''
    ).trim();
    return {
      id: String(block?.id || '').trim(),
      kind: String(block?.kind || block?.type || '').trim(),
      label: String(block?.name || '').trim() || title || String(block?.kind || block?.type || 'Block').trim() || 'Block',
    };
  }).filter((block) => block.id);
}

function snapshotSignature(state, pathname) {
  return JSON.stringify(buildRevisionSnapshot(state, pathname));
}

function collectChangedPaths(prevState, nextState) {
  const prevPaths = new Set([
    ...Object.keys(prevState?.pageHierarchy || {}),
    ...Object.keys(prevState?.blocksByPath || {}),
    ...Object.keys(prevState?.collaborationByPath || {}),
  ]);
  const nextPaths = new Set([
    ...Object.keys(nextState?.pageHierarchy || {}),
    ...Object.keys(nextState?.blocksByPath || {}),
    ...Object.keys(nextState?.collaborationByPath || {}),
  ]);
  const allPaths = new Set([...prevPaths, ...nextPaths]);
  return [...allPaths].filter((pathname) => snapshotSignature(prevState, pathname) !== snapshotSignature(nextState, pathname));
}

function clearPublishedDraftOwnership(meta) {
  const normalizedMeta = normalizeBlockMeta(meta);
  return {
    draftedBy: null,
    draftedAt: null,
    savedBy: normalizedMeta.savedBy,
    savedAt: normalizedMeta.savedAt,
    lockedBy: null,
    lockedAt: null,
  };
}

function normalizeRevisionRecord(rawRevision) {
  const source = rawRevision && typeof rawRevision === 'object' ? rawRevision : {};
  const pathname = String(source.pathname || '').trim();
  const id = String(source.id || '').trim();
  const createdAt = Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : null;
  const actor = normalizeActor(source.actor);
  if (!pathname || !id || !createdAt) {
    return null;
  }
  return {
    id,
    pathname,
    createdAt,
    actor,
    reason: String(source.reason || '').trim(),
    summary: String(source.summary || '').trim(),
    snapshot: source.snapshot && typeof source.snapshot === 'object' ? source.snapshot : buildRevisionSnapshot({}, pathname),
  };
}

function defaultRecord() {
  return {
    initialized: false,
    version: 1,
    updatedAt: 0,
    state: normalizeSharedState(null),
    baseSnapshot: normalizeSharedState(null),
    revisionsByPath: {},
  };
}

export function createDevContentAuthorityStore({
  persistenceFile,
  now = () => Date.now(),
  createId = (ts) => `${ts}-${Math.random().toString(36).slice(2, 8)}`,
  maxRevisionsPerPage = DEFAULT_MAX_REVISIONS_PER_PAGE,
} = {}) {
  if (!persistenceFile) {
    throw new Error('persistenceFile is required');
  }

  let record = defaultRecord();

  const persist = () => {
    const dir = path.dirname(persistenceFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(persistenceFile, JSON.stringify(record, null, 2));
  };

  const load = () => {
    if (!fs.existsSync(persistenceFile)) {
      record = defaultRecord();
      return;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(persistenceFile, 'utf8'));
      record = {
        initialized: Boolean(parsed?.initialized),
        version: 1,
        updatedAt: Number.isFinite(Number(parsed?.updatedAt)) ? Number(parsed.updatedAt) : 0,
        state: normalizeSharedState(parsed?.state),
        baseSnapshot: normalizeSharedState(parsed?.baseSnapshot),
        revisionsByPath: Object.fromEntries(
          Object.entries(parsed?.revisionsByPath || {}).map(([pathname, revisions]) => [
            pathname,
            (Array.isArray(revisions) ? revisions : [])
              .map(normalizeRevisionRecord)
              .filter(Boolean)
              .slice(0, maxRevisionsPerPage),
          ]),
        ),
      };
    } catch {
      record = defaultRecord();
    }
  };

  const publishSnapshot = () => ({
    initialized: record.initialized,
    updatedAt: record.updatedAt,
    state: cloneJson(record.state),
    baseSnapshot: cloneJson(record.baseSnapshot),
  });

  const addRevisionsForChangedPaths = (prevState, nextState, { actor, reason, summary = '' } = {}) => {
    const changedPaths = collectChangedPaths(prevState, nextState);
    if (!changedPaths.length) {
      return;
    }
    const normalizedActor = normalizeActor(actor);
    changedPaths.forEach((pathname) => {
      const nextRevision = {
        id: createId(now()),
        pathname,
        createdAt: now(),
        actor: normalizedActor,
        reason: String(reason || '').trim() || 'draft-saved',
        summary: String(summary || '').trim(),
        snapshot: buildRevisionSnapshot(nextState, pathname),
      };
      const previous = Array.isArray(record.revisionsByPath[pathname]) ? record.revisionsByPath[pathname] : [];
      record.revisionsByPath[pathname] = [nextRevision, ...previous].slice(0, maxRevisionsPerPage);
    });
  };

  const commitState = (nextState, { actor, reason, summary = '', trackRevisions = true } = {}) => {
    const normalizedNextState = normalizeSharedState(nextState);
    const previousState = record.state;
    if (trackRevisions) {
      addRevisionsForChangedPaths(previousState, normalizedNextState, { actor, reason, summary });
    }
    record = {
      ...record,
      initialized: true,
      updatedAt: now(),
      state: normalizedNextState,
    };
    persist();
    return publishSnapshot();
  };

  const replacePageStateFromRevision = (pathname, revision) => {
    const snapshotState = normalizeSharedState(revision?.snapshot?.state);
    const nextState = normalizeSharedState(record.state);
    if (snapshotState.pageHierarchy?.[pathname]) {
      nextState.pageHierarchy[pathname] = cloneJson(snapshotState.pageHierarchy[pathname]);
    }
    if (snapshotState.blocksByPath?.[pathname]) {
      nextState.blocksByPath[pathname] = cloneJson(snapshotState.blocksByPath[pathname]);
    }
    nextState.collaborationByPath[pathname] = cloneJson(
      snapshotState.collaborationByPath?.[pathname] || { blocks: {}, history: [] },
    );
    Object.entries(snapshotState.pathAliases || {}).forEach(([fromPath, toPath]) => {
      nextState.pathAliases[fromPath] = toPath;
    });
    return nextState;
  };

  load();

  return {
    getSnapshot() {
      return publishSnapshot();
    },

    resetFromSeed(seedState, { actor, reason = 'seed-reset' } = {}) {
      const normalizedSeedState = normalizeSharedState(seedState);
      record = {
        initialized: true,
        version: 1,
        updatedAt: now(),
        state: normalizedSeedState,
        baseSnapshot: cloneJson(normalizedSeedState),
        revisionsByPath: {},
      };
      persist();
      const next = publishSnapshot();
      addRevisionsForChangedPaths(normalizeSharedState(null), next.state, {
        actor,
        reason,
        summary: 'seed baseline',
      });
      persist();
      return publishSnapshot();
    },

    saveDraft(nextState, { actor, reason = 'draft-saved', summary = '' } = {}) {
      const normalizedIncomingState = normalizeSharedState(nextState);
      const currentState = normalizeSharedState(record.state);
      const nextMergedState = {
        ...normalizeSharedState(currentState),
        pageHierarchy: cloneJson(normalizedIncomingState.pageHierarchy || {}),
        pathAliases: cloneJson(normalizedIncomingState.pathAliases || {}),
      };
      const pathnamesToMerge = new Set([
        ...Object.keys(currentState.blocksByPath || {}),
        ...Object.keys(normalizedIncomingState.blocksByPath || {}),
        ...Object.keys(currentState.collaborationByPath || {}),
        ...Object.keys(normalizedIncomingState.collaborationByPath || {}),
      ]);
      const saveResult = {
        didSave: false,
        hasConflicts: false,
        changedPaths: collectChangedPaths(currentState, normalizedIncomingState),
        savedPaths: [],
        savedBlockIdsByPath: {},
        blockedBlockIdsByPath: {},
        blockedBlocks: [],
      };

      pathnamesToMerge.forEach((pathname) => {
        const merged = mergePageDraftForSafeSave(pathname, currentState, normalizedIncomingState, actor, {
          now,
          createId,
        });
        nextMergedState.blocksByPath[pathname] = merged.blocks;
        nextMergedState.collaborationByPath[pathname] = merged.collaborationEntry;
        if (merged.savedBlockIds.length) {
          saveResult.savedBlockIdsByPath[pathname] = merged.savedBlockIds;
        }
        if (merged.blockedBlockIds.length) {
          saveResult.blockedBlockIdsByPath[pathname] = merged.blockedBlockIds;
          saveResult.blockedBlocks.push(...merged.blockedBlocks);
        }
      });

      const actualChangedPaths = collectChangedPaths(currentState, nextMergedState);
      saveResult.didSave = actualChangedPaths.length > 0;
      saveResult.savedPaths = actualChangedPaths;
      saveResult.hasConflicts = saveResult.blockedBlocks.length > 0;

      const snapshot = commitState(nextMergedState, { actor, reason, summary });
      return {
        ok: true,
        ...snapshot,
        saveResult,
      };
    },

    syncBlockDraft(pathname, blockId, nextBlock, { actor, reason = 'block-draft-synced' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      const normalizedIncomingBlockId = String(nextBlock?.id || normalizedBlockId).trim();
      if (!normalizedPath || !normalizedBlockId || !normalizedActor || !normalizedIncomingBlockId) {
        return { ok: false, error: 'invalid-block-sync-request', ...publishSnapshot() };
      }
      if (normalizedIncomingBlockId !== normalizedBlockId) {
        return { ok: false, error: 'block-id-mismatch', ...publishSnapshot() };
      }

      const nextState = normalizeSharedState(record.state);
      const currentBlocks = Array.isArray(nextState.blocksByPath[normalizedPath]) ? nextState.blocksByPath[normalizedPath] : [];
      const blockIndex = currentBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (blockIndex === -1) {
        return { ok: false, error: 'block-not-found', ...publishSnapshot() };
      }

      const currentCollaboration = normalizeCollaborationByPath(nextState.collaborationByPath);
      const entry = ensureCollaborationEntry(currentCollaboration, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      const conflict = getOtherActorConflict(currentMeta, normalizedActor);
      if (conflict) {
        return {
          ok: false,
          error: conflict.reason,
          owner: conflict.owner,
          state: conflict.state,
          ...publishSnapshot(),
        };
      }

      const timestamp = now();
      const updatedBlocks = [...currentBlocks];
      updatedBlocks.splice(blockIndex, 1, cloneJson({
        ...nextBlock,
        id: normalizedBlockId,
      }));
      nextState.blocksByPath[normalizedPath] = updatedBlocks;
      nextState.collaborationByPath = {
        ...currentCollaboration,
        [normalizedPath]: {
          ...entry,
          blocks: {
            ...(entry.blocks || {}),
            [normalizedBlockId]: buildSyncedDraftBlockMeta(currentMeta, normalizedActor, timestamp),
          },
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'block-draft-synced',
            blockId: normalizedBlockId,
            actor: normalizedActor,
            details: 'shared-draft-content',
            now: timestamp,
            createId,
          })),
        },
      };

      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason,
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    publishPage(pathname, { actor, summary = '' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedActor) {
        return { ok: false, error: 'invalid-publish-request', ...publishSnapshot() };
      }

      const currentState = normalizeSharedState(record.state);
      const currentEntry = ensureCollaborationEntry(currentState.collaborationByPath || {}, normalizedPath);
      const currentBlocks = Array.isArray(currentState.blocksByPath?.[normalizedPath])
        ? currentState.blocksByPath[normalizedPath]
        : [];
      const publishSummary = summarizePageAuthoringDiff(currentState, record.baseSnapshot, normalizedPath);

      if (!publishSummary.hasChanges) {
        return {
          ok: false,
          error: 'already-live',
          ...publishSnapshot(),
          publishResult: {
            didPublish: false,
            hasConflicts: false,
            changedPaths: [],
            publishedPaths: [],
            publishedBlockIdsByPath: {},
            blockedBlockIdsByPath: {},
            blockedBlocks: [],
            hasOrderChangesByPath: {},
            hasPageMetaChangesByPath: {},
            updatedAt: now(),
          },
        };
      }

      const blockedBlocks = [];
      Object.entries(currentEntry.blocks || {}).forEach(([blockId, rawMeta]) => {
        const conflict = getOtherActorConflict(rawMeta, normalizedActor);
        if (!conflict) {
          return;
        }
        blockedBlocks.push({
          pathname: normalizedPath,
          blockId: String(blockId || '').trim(),
          reason: conflict.reason,
          owner: cloneJson(conflict.owner),
          state: conflict.state,
        });
      });

      if (blockedBlocks.length) {
        return {
          ok: false,
          error: 'publish-blocked-by-other-draft',
          ...publishSnapshot(),
          publishResult: {
            didPublish: false,
            hasConflicts: true,
            changedPaths: [normalizedPath],
            publishedPaths: [],
            publishedBlockIdsByPath: {},
            blockedBlockIdsByPath: {
              [normalizedPath]: blockedBlocks.map((entry) => entry.blockId),
            },
            blockedBlocks,
            hasOrderChangesByPath: {
              [normalizedPath]: publishSummary.hasOrderChanges,
            },
            hasPageMetaChangesByPath: {
              [normalizedPath]: publishSummary.hasPageMetaChanges,
            },
            updatedAt: now(),
          },
        };
      }

      const timestamp = now();
      const nextBlocksMeta = {};
      currentBlocks.forEach((block) => {
        const blockId = String(block?.id || '').trim();
        if (!blockId) {
          return;
        }
        nextBlocksMeta[blockId] = clearPublishedDraftOwnership(currentEntry.blocks?.[blockId]);
      });

      const nextCollaborationEntry = {
        ...currentEntry,
        blocks: nextBlocksMeta,
        history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
          action: 'page-published',
          actor: normalizedActor,
          details: String(summary || '').trim(),
          now: timestamp,
          createId,
        })),
      };
      const nextState = replacePageSlice(currentState, currentState, normalizedPath, nextCollaborationEntry);
      const nextBaseSnapshot = replacePageSlice(record.baseSnapshot, nextState, normalizedPath, nextCollaborationEntry);
      record = {
        ...record,
        initialized: true,
        updatedAt: timestamp,
        state: nextState,
        baseSnapshot: nextBaseSnapshot,
      };
      persist();
      return {
        ok: true,
        ...publishSnapshot(),
        publishResult: {
          didPublish: true,
          hasConflicts: false,
          changedPaths: [normalizedPath],
          publishedPaths: [normalizedPath],
          publishedBlockIdsByPath: {
            [normalizedPath]: publishSummary.changedBlockIds,
          },
          blockedBlockIdsByPath: {},
          blockedBlocks: [],
          hasOrderChangesByPath: {
            [normalizedPath]: publishSummary.hasOrderChanges,
          },
          hasPageMetaChangesByPath: {
            [normalizedPath]: publishSummary.hasPageMetaChanges,
          },
          updatedAt: timestamp,
        },
      };
    },

    getRevisionHistory(pathname) {
      const normalizedPath = String(pathname || '').trim();
      const revisions = Array.isArray(record.revisionsByPath[normalizedPath]) ? record.revisionsByPath[normalizedPath] : [];
      return revisions.map((revision) => ({
        id: revision.id,
        pathname: revision.pathname,
        createdAt: revision.createdAt,
        actor: revision.actor,
        reason: revision.reason,
        summary: revision.summary,
        blocks: summarizeRevisionBlocksForHistory(revision.snapshot),
      }));
    },

    restorePageRevision(pathname, revisionId, { actor } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedRevisionId = String(revisionId || '').trim();
      const revisions = Array.isArray(record.revisionsByPath[normalizedPath]) ? record.revisionsByPath[normalizedPath] : [];
      const revision = revisions.find((entry) => entry.id === normalizedRevisionId);
      if (!revision) {
        return { ok: false, error: 'revision-not-found', snapshot: publishSnapshot() };
      }
      const nextState = replacePageStateFromRevision(normalizedPath, revision);
      return {
        ok: true,
        ...commitState(nextState, {
          actor,
          reason: 'page-revision-restored',
          summary: `${normalizedPath}:${normalizedRevisionId}`,
        }),
      };
    },

    restoreBlockFromRevision(pathname, revisionId, blockId, { actor } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedRevisionId = String(revisionId || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const revisions = Array.isArray(record.revisionsByPath[normalizedPath]) ? record.revisionsByPath[normalizedPath] : [];
      const revision = revisions.find((entry) => entry.id === normalizedRevisionId);
      if (!revision) {
        return { ok: false, error: 'revision-not-found', snapshot: publishSnapshot() };
      }
      const snapshotBlocks = Array.isArray(revision?.snapshot?.state?.blocksByPath?.[normalizedPath])
        ? revision.snapshot.state.blocksByPath[normalizedPath]
        : [];
      const snapshotBlock = snapshotBlocks.find((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (!snapshotBlock) {
        return { ok: false, error: 'block-not-found', snapshot: publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const currentBlocks = Array.isArray(nextState.blocksByPath[normalizedPath]) ? nextState.blocksByPath[normalizedPath] : [];
      const existingIndex = currentBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (existingIndex === -1) {
        currentBlocks.push(cloneJson(snapshotBlock));
      } else {
        currentBlocks.splice(existingIndex, 1, cloneJson(snapshotBlock));
      }
      nextState.blocksByPath[normalizedPath] = currentBlocks;
      return {
        ok: true,
        ...commitState(nextState, {
          actor,
          reason: 'block-revision-restored',
          summary: `${normalizedPath}:${normalizedBlockId}:${normalizedRevisionId}`,
        }),
      };
    },

    acquireBlockLock(pathname, blockId, actor, { force = false } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-lock-request', ...publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const currentCollaboration = normalizeCollaborationByPath(nextState.collaborationByPath);
      const entry = ensureCollaborationEntry(currentCollaboration, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      const { lockedByOther, draftedByOther } = getForeignOwnershipMeta(currentMeta, normalizedActor);
      if (!force && lockedByOther) {
        return {
          ok: false,
          error: 'locked-by-other',
          lockedBy: lockedByOther,
          ...publishSnapshot(),
        };
      }
      if (!force && draftedByOther) {
        return {
          ok: false,
          error: 'drafted-by-other',
          draftedBy: draftedByOther,
          ...publishSnapshot(),
        };
      }
      const timestamp = now();
      const released = releaseUserLocks(currentCollaboration, normalizedActor.userId, {
        keepPath: normalizedPath,
        keepBlockId: normalizedBlockId,
      });
      const nextEntry = ensureCollaborationEntry(released, normalizedPath);
      const previousActor = lockedByOther || (force ? draftedByOther : null);
      const action = lockedByOther
        ? 'block-edit-taken-over'
        : (force && draftedByOther ? 'block-draft-claimed' : 'block-locked');
      nextState.collaborationByPath = {
        ...released,
        [normalizedPath]: {
          ...nextEntry,
          blocks: {
            ...(nextEntry.blocks || {}),
            [normalizedBlockId]: {
              ...currentMeta,
              draftedBy: currentMeta.draftedBy,
              draftedAt: currentMeta.draftedAt,
              savedBy: currentMeta.savedBy,
              savedAt: currentMeta.savedAt,
              lockedBy: normalizedActor,
              lockedAt: timestamp,
            },
          },
          history: appendHistoryEntry(nextEntry.history, buildHistoryEntry({
            action,
            blockId: normalizedBlockId,
            actor: normalizedActor,
            previousActor,
            details: force ? 'forced' : '',
            now: timestamp,
            createId,
          })),
        },
      };
      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason: 'block-lock-updated',
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    refreshBlockLock(pathname, blockId, actor) {
      return this.acquireBlockLock(pathname, blockId, actor, { force: false });
    },

    releaseBlockLock(pathname, blockId, actor) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-lock-request', ...publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const entry = ensureCollaborationEntry(nextState.collaborationByPath || {}, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      if (currentMeta.lockedBy?.userId !== normalizedActor.userId) {
        return { ok: false, error: 'not-lock-owner', ...publishSnapshot() };
      }
      const timestamp = now();
      nextState.collaborationByPath = {
        ...(nextState.collaborationByPath || {}),
        [normalizedPath]: {
          ...entry,
          blocks: {
            ...(entry.blocks || {}),
            [normalizedBlockId]: {
              ...currentMeta,
              lockedBy: null,
              lockedAt: null,
            },
          },
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'block-unlocked',
            blockId: normalizedBlockId,
            actor: normalizedActor,
            now: timestamp,
            createId,
          })),
        },
      };
      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason: 'block-lock-updated',
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },
  };
}
