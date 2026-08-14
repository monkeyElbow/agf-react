import { normalizeContentAdminAuthorityState } from './contentAdminStateBoundary';
import { isRetiredNonDynamicContentAdminBlock, normalizeContentAdminBlock } from './contentAdminNormalization';
import { findManagedOrderChangedBlockIds } from './managedBlockOrder';

export function normalizeContentAdminPageBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => !isRetiredNonDynamicContentAdminBlock(block))
    .map(normalizeContentAdminBlock);
}

export function toComparableAuthoringState(rawState) {
  const normalizedState = normalizeContentAdminAuthorityState(rawState);
  return {
    pageHierarchy: normalizedState.pageHierarchy || {},
    blocksByPath: normalizedState.blocksByPath || {},
    pathAliases: normalizedState.pathAliases || {},
  };
}

export function buildComparableAuthoringPageSnapshot(state, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return null;
  }
  const comparableState = state && typeof state === 'object'
    ? state
    : toComparableAuthoringState(state);
  return {
    page: comparableState.pageHierarchy?.[normalizedPath] || null,
    blocks: comparableState.blocksByPath?.[normalizedPath] || [],
    aliases: Object.fromEntries(
      Object.entries(comparableState.pathAliases || {}).filter(([fromPath, toPath]) => (
        String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
      )),
    ),
  };
}

export function compareComparableAuthoringPageSnapshot(leftComparableState, rightComparableState, pathname) {
  const leftSnapshot = buildComparableAuthoringPageSnapshot(leftComparableState, pathname);
  const rightSnapshot = buildComparableAuthoringPageSnapshot(rightComparableState, pathname);
  if (!leftSnapshot && !rightSnapshot) {
    return true;
  }
  return JSON.stringify(leftSnapshot) === JSON.stringify(rightSnapshot);
}

export function compareAuthoringPageSnapshot(leftState, rightState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return true;
  }
  return compareComparableAuthoringPageSnapshot(
    toComparableAuthoringState(leftState),
    toComparableAuthoringState(rightState),
    normalizedPath,
  );
}

export function summarizeComparableAuthoringPageChanges(current, persisted, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      isDeletionOnlyOrderChange: false,
      removedBlockIds: [],
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
  }

  const currentBlocks = Array.isArray(current.blocksByPath?.[normalizedPath])
    ? normalizeContentAdminPageBlocks(current.blocksByPath[normalizedPath])
    : [];
  const persistedBlocks = Array.isArray(persisted.blocksByPath?.[normalizedPath])
    ? normalizeContentAdminPageBlocks(persisted.blocksByPath[normalizedPath])
    : [];
  const currentBlockIds = currentBlocks
    .map((block) => String(block?.id || '').trim())
    .filter(Boolean);
  const persistedBlockIds = persistedBlocks
    .map((block) => String(block?.id || '').trim())
    .filter(Boolean);
  const orderedBlockIds = [...new Set([...currentBlockIds, ...persistedBlockIds])];
  const currentBlockIdSet = new Set(currentBlockIds);
  const persistedBlockIdSet = new Set(persistedBlockIds);
  const removedBlockIds = persistedBlockIds.filter((blockId) => !currentBlockIdSet.has(blockId));
  const addedBlockIds = currentBlockIds.filter((blockId) => !persistedBlockIdSet.has(blockId));
  const persistedWithoutRemovedBlocks = persistedBlockIds.filter((blockId) => currentBlockIdSet.has(blockId));
  const currentBlockById = new Map(currentBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const persistedBlockById = new Map(persistedBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const hasOrderChanges = JSON.stringify(currentBlockIds) !== JSON.stringify(persistedBlockIds);
  const isDeletionOnlyOrderChange = hasOrderChanges
    && removedBlockIds.length > 0
    && addedBlockIds.length === 0
    && JSON.stringify(currentBlockIds) === JSON.stringify(persistedWithoutRemovedBlocks);
  const changedBlockIds = orderedBlockIds.filter((blockId) => (
    JSON.stringify(currentBlockById.get(blockId) || null) !== JSON.stringify(persistedBlockById.get(blockId) || null)
  ));
  const orderChangedBlockIds = findManagedOrderChangedBlockIds(currentBlockIds, persistedBlockIds);
  const currentAliases = Object.fromEntries(
    Object.entries(current.pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
  const persistedAliases = Object.fromEntries(
    Object.entries(persisted.pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
  const hasPageMetaChanges = JSON.stringify({
    page: current.pageHierarchy?.[normalizedPath] || null,
    aliases: currentAliases,
  }) !== JSON.stringify({
    page: persisted.pageHierarchy?.[normalizedPath] || null,
    aliases: persistedAliases,
  });

  return {
    changedBlockIds,
    orderChangedBlockIds,
    changedBlockCount: changedBlockIds.length,
    hasOrderChanges,
    isDeletionOnlyOrderChange,
    removedBlockIds,
    hasPageMetaChanges,
    hasUnsavedChanges: Boolean(changedBlockIds.length || hasOrderChanges || hasPageMetaChanges),
  };
}

export function summarizeAuthoringPageChanges(currentState, persistedState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      orderChangedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
  }

  return summarizeComparableAuthoringPageChanges(
    toComparableAuthoringState(currentState),
    toComparableAuthoringState(persistedState),
    normalizedPath,
  );
}

export function collectDirtyComparableAuthoringPaths(current, persisted) {
  const allPaths = new Set([
    ...Object.keys(current.pageHierarchy || {}),
    ...Object.keys(current.blocksByPath || {}),
    ...Object.keys(persisted.pageHierarchy || {}),
    ...Object.keys(persisted.blocksByPath || {}),
  ]);
  return [...allPaths].filter((pathname) => !compareComparableAuthoringPageSnapshot(current, persisted, pathname));
}

export function collectDirtyAuthoringPaths(currentState, persistedState) {
  const current = toComparableAuthoringState(currentState);
  const persisted = toComparableAuthoringState(persistedState);
  return collectDirtyComparableAuthoringPaths(current, persisted);
}
