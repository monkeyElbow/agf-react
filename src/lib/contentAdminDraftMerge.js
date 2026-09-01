import {
  normalizeContentActor,
  normalizeContentBlockMeta,
} from './contentAdminCollaboration';
import {
  summarizeComparableAuthoringPageChanges,
  toComparableAuthoringState,
} from './contentAdminPageComparison';

export function preserveBlockedDraftContent(sharedState, localState, blockedBlocks) {
  const blockedByPath = new Map();
  (Array.isArray(blockedBlocks) ? blockedBlocks : []).forEach((entry) => {
    const pathname = String(entry?.pathname || '').trim();
    const blockId = String(entry?.blockId || '').trim();
    if (!pathname || !blockId) {
      return;
    }
    const pathEntries = blockedByPath.get(pathname) || new Set();
    pathEntries.add(blockId);
    blockedByPath.set(pathname, pathEntries);
  });
  if (!blockedByPath.size) {
    return sharedState;
  }

  let blocksByPath = sharedState?.blocksByPath || {};
  let collaborationByPath = sharedState?.collaborationByPath || {};
  blockedByPath.forEach((blockedIds, pathname) => {
    const localBlocks = Array.isArray(localState?.blocksByPath?.[pathname])
      ? localState.blocksByPath[pathname]
      : [];
    const sharedBlocks = Array.isArray(sharedState?.blocksByPath?.[pathname])
      ? sharedState.blocksByPath[pathname]
      : [];
    const localById = new Map(localBlocks.map((block) => [String(block?.id || '').trim(), block]));
    const mergedBlocks = localBlocks.map((localBlock) => {
      const blockId = String(localBlock?.id || '').trim();
      const sharedBlock = sharedBlocks.find((candidate) => String(candidate?.id || '').trim() === blockId);
      return blockedIds.has(blockId) ? localBlock : (sharedBlock || localBlock);
    });
    const localIds = new Set(mergedBlocks.map((block) => String(block?.id || '').trim()));
    sharedBlocks.forEach((sharedBlock) => {
      const blockId = String(sharedBlock?.id || '').trim();
      if (blockId && !localIds.has(blockId) && !localById.has(blockId)) {
        mergedBlocks.push(sharedBlock);
      }
    });
    blocksByPath = blocksByPath === sharedState.blocksByPath
      ? { ...(sharedState.blocksByPath || {}) }
      : blocksByPath;
    blocksByPath[pathname] = mergedBlocks;

    const localCollaboration = localState?.collaborationByPath?.[pathname];
    const sharedCollaboration = sharedState?.collaborationByPath?.[pathname] || { blocks: {}, history: [] };
    if (localCollaboration) {
      const nextBlocks = { ...(sharedCollaboration.blocks || {}) };
      blockedIds.forEach((blockId) => {
        if (localCollaboration.blocks?.[blockId]) {
          nextBlocks[blockId] = localCollaboration.blocks[blockId];
        }
      });
      collaborationByPath = collaborationByPath === sharedState.collaborationByPath
        ? { ...(sharedState.collaborationByPath || {}) }
        : collaborationByPath;
      collaborationByPath[pathname] = {
        ...sharedCollaboration,
        blocks: nextBlocks,
      };
    }
  });

  return {
    ...sharedState,
    blocksByPath,
    collaborationByPath,
  };
}

export function summarizePageWorkflowActivity(collaborationByPath, pathname, actor, currentState, publishedState) {
  const normalizedPath = String(pathname || '').trim();
  const currentUserId = String(actor?.userId || '').trim();
  if (!normalizedPath || !currentUserId) {
    return {
      currentActorBlockCount: 0,
      otherActorBlockCount: 0,
      hasCurrentActorDraft: false,
      hasCurrentActorUnsavedSave: false,
      hasOtherActorDraft: false,
      currentActorBlockIds: [],
      currentActorUnsavedSaveBlockIds: [],
      otherActorBlocks: [],
    };
  }

  const publishSummary = summarizeComparableAuthoringPageChanges(
    toComparableAuthoringState(currentState),
    toComparableAuthoringState(publishedState),
    normalizedPath,
  );
  // A moved block can be content-identical, so it is absent from
  // changedBlockIds. Include order participants when determining who owns a
  // page draft; otherwise a valid reorder has no Save affordance.
  const changedBlockIds = new Set([
    ...(publishSummary.changedBlockIds || []),
    ...(publishSummary.orderChangedBlockIds || []),
  ]);
  const orderChangedBlockIds = new Set(publishSummary.orderChangedBlockIds || []);
  const blocks = collaborationByPath?.[normalizedPath]?.blocks || {};
  let currentActorBlockCount = 0;
  let otherActorBlockCount = 0;
  let currentActorUnsavedSaveBlockCount = 0;
  const currentActorBlockIds = [];
  const currentActorUnsavedSaveBlockIds = [];
  const otherActorBlocks = [];

  Object.entries(blocks).forEach(([blockId, meta]) => {
    if (!changedBlockIds.has(String(blockId || '').trim())) {
      return;
    }
    const normalizedMeta = normalizeContentBlockMeta(meta);
    const currentActorOwnsBlock = (
      normalizedMeta.lockedBy?.userId === currentUserId
      || normalizedMeta.draftedBy?.userId === currentUserId
    );
    const otherActorOwnsBlock = (
      (normalizedMeta.lockedBy?.userId && normalizedMeta.lockedBy.userId !== currentUserId)
      || (normalizedMeta.draftedBy?.userId && normalizedMeta.draftedBy.userId !== currentUserId)
    );

    if (currentActorOwnsBlock) {
      currentActorBlockCount += 1;
      currentActorBlockIds.push(String(blockId || '').trim());
      if (
        normalizedMeta.draftedBy?.userId === currentUserId
        && (
          normalizedMeta.savedBy?.userId !== currentUserId
          || normalizedMeta.savedAt !== normalizedMeta.draftedAt
        )
        // During a reorder the local move deliberately has not been saved
        // yet, but it does hold the mover's optimistic lock. Treat that as
        // an unsaved page action so the explicit Save button remains usable.
        || (
          orderChangedBlockIds.has(String(blockId || '').trim())
          && normalizedMeta.lockedBy?.userId === currentUserId
          && normalizedMeta.draftedBy?.userId !== currentUserId
        )
      ) {
        currentActorUnsavedSaveBlockCount += 1;
        currentActorUnsavedSaveBlockIds.push(String(blockId || '').trim());
      }
    } else if (otherActorOwnsBlock) {
      otherActorBlockCount += 1;
      otherActorBlocks.push({
        blockId: String(blockId || '').trim(),
        owner: normalizeContentActor(normalizedMeta.draftedBy || normalizedMeta.lockedBy),
        state: normalizedMeta.lockedBy?.userId && normalizedMeta.lockedBy.userId !== currentUserId
          ? 'editing-other'
          : 'drafted-other',
      });
    }
  });

  return {
    currentActorBlockCount,
    otherActorBlockCount,
    hasCurrentActorDraft: currentActorBlockCount > 0,
    hasCurrentActorUnsavedSave: currentActorUnsavedSaveBlockCount > 0,
    hasOtherActorDraft: otherActorBlockCount > 0,
    currentActorBlockIds,
    currentActorUnsavedSaveBlockIds,
    otherActorBlocks,
  };
}
