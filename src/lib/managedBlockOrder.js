/**
 * Managed block order is data, not a rendering side effect. These helpers
 * preserve the supplied order and never sort by blueprint, kind, or title.
 */
export function composeManagedBlockOrder(blocks) {
  return (Array.isArray(blocks) ? blocks : []).filter((block) => (
    block && typeof block === 'object'
  ));
}

export function getManagedBlockRenderKey(block, index) {
  const blockId = String(block?.id || '').trim();
  if (blockId) {
    return `managed-block-${blockId}`;
  }
  const blockKind = String(block?.kind || block?.type || 'block').trim() || 'block';
  return `managed-block-legacy-${blockKind}-${index}`;
}

export function findManagedOrderChangedBlockIds(currentBlockIds, baselineBlockIds) {
  const currentIds = [...new Set((Array.isArray(currentBlockIds) ? currentBlockIds : [])
    .map((blockId) => String(blockId || '').trim())
    .filter(Boolean))];
  const baselineIds = [...new Set((Array.isArray(baselineBlockIds) ? baselineBlockIds : [])
    .map((blockId) => String(blockId || '').trim())
    .filter(Boolean))];
  const baselineIndexById = new Map(baselineIds.map((blockId, index) => [blockId, index]));
  const currentIndexById = new Map(currentIds.map((blockId, index) => [blockId, index]));
  const sharedIds = currentIds.filter((blockId) => baselineIndexById.has(blockId));
  const changedIds = new Set();

  sharedIds.forEach((blockId, index) => {
    for (let followingIndex = index + 1; followingIndex < sharedIds.length; followingIndex += 1) {
      const followingId = sharedIds[followingIndex];
      const currentOrderChanged = currentIndexById.get(blockId) > currentIndexById.get(followingId);
      const baselineOrderChanged = baselineIndexById.get(blockId) > baselineIndexById.get(followingId);
      if (currentOrderChanged !== baselineOrderChanged) {
        changedIds.add(blockId);
        changedIds.add(followingId);
      }
    }
  });

  return [...new Set([...currentIds, ...baselineIds])]
    .filter((blockId) => changedIds.has(blockId));
}

export function placeManagedBlockAtDraftPosition(targetBlocks, draftBlocks, blockId, nextBlock = undefined) {
  const normalizedBlockId = String(blockId || '').trim();
  const target = composeManagedBlockOrder(targetBlocks).filter((block) => (
    String(block?.id || '').trim() !== normalizedBlockId
  ));
  const draft = composeManagedBlockOrder(draftBlocks);
  const draftIndex = draft.findIndex((block) => String(block?.id || '').trim() === normalizedBlockId);
  const blockToPlace = nextBlock === undefined ? draft[draftIndex] : nextBlock;

  if (!normalizedBlockId || draftIndex < 0 || !blockToPlace) {
    return target;
  }

  let insertionIndex = target.length;
  for (let index = draftIndex + 1; index < draft.length; index += 1) {
    const followingId = String(draft[index]?.id || '').trim();
    const followingIndex = target.findIndex((block) => String(block?.id || '').trim() === followingId);
    if (followingIndex >= 0) {
      insertionIndex = followingIndex;
      break;
    }
  }
  if (insertionIndex === target.length) {
    for (let index = draftIndex - 1; index >= 0; index -= 1) {
      const precedingId = String(draft[index]?.id || '').trim();
      const precedingIndex = target.findIndex((block) => String(block?.id || '').trim() === precedingId);
      if (precedingIndex >= 0) {
        insertionIndex = precedingIndex + 1;
        break;
      }
    }
  }

  target.splice(insertionIndex, 0, blockToPlace);
  return target;
}

export function mergePublishedManagedBlocks(baseBlocks, draftBlocks, publishableBlockIds) {
  const publishableIds = (Array.isArray(publishableBlockIds) ? publishableBlockIds : [])
    .map((blockId) => String(blockId || '').trim())
    .filter(Boolean);
  let merged = composeManagedBlockOrder(baseBlocks);
  publishableIds.forEach((blockId) => {
    const draftBlock = composeManagedBlockOrder(draftBlocks)
      .find((block) => String(block?.id || '').trim() === blockId);
    merged = placeManagedBlockAtDraftPosition(merged, draftBlocks, blockId, draftBlock);
  });
  return merged;
}
