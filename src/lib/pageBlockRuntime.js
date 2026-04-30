function toBooleanFlag(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const token = String(value || '').trim().toLowerCase();
  if (!token) {
    return false;
  }
  return !['false', '0', 'no', 'off'].includes(token);
}

export function isVisibleBlock(block) {
  return !toBooleanFlag(block?.hidden);
}

export function isVisibleDynamicBlock(block) {
  return String(block?.mode || '').trim().toLowerCase() === 'dynamic' && isVisibleBlock(block);
}

export function getVisibleDynamicBlocks(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  const seenIds = new Set();

  return source.filter((block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId || seenIds.has(blockId) || !isVisibleDynamicBlock(block)) {
      return false;
    }
    seenIds.add(blockId);
    return true;
  });
}
