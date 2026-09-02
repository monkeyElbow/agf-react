function hasOwnEntry(value, key) {
  return Boolean(
    value
    && typeof value === 'object'
    && Object.prototype.hasOwnProperty.call(value, key),
  );
}

function normalizePathCandidates(pathname, fallbackPathname = '') {
  return [...new Set(
    [pathname, fallbackPathname]
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )];
}

const PRIMARY_BLOCK_IDS = Object.freeze(['hero', 'intro']);

function isRenderablePrimaryBlock(block, blockId) {
  return String(block?.id || '').trim() === blockId
    && String(block?.kind || '').trim().toLowerCase() === blockId
    && String(block?.mode || '').trim().toLowerCase() === 'dynamic';
}

function restoreMissingPrimaryBlocks(authoringBlocks, fallbackBlocks) {
  if (!Array.isArray(authoringBlocks) || authoringBlocks.length === 0 || !Array.isArray(fallbackBlocks)) {
    return authoringBlocks;
  }

  let nextBlocks = authoringBlocks;
  PRIMARY_BLOCK_IDS.forEach((blockId) => {
    const fallbackBlock = fallbackBlocks.find((block) => isRenderablePrimaryBlock(block, blockId));
    if (!fallbackBlock) {
      return;
    }

    const authoringIndex = nextBlocks.findIndex((block) => String(block?.id || '').trim() === blockId);
    const authoringBlock = authoringIndex >= 0 ? nextBlocks[authoringIndex] : null;
    if (isRenderablePrimaryBlock(authoringBlock, blockId)) {
      return;
    }

    if (nextBlocks === authoringBlocks) {
      nextBlocks = [...authoringBlocks];
    }
    if (authoringIndex >= 0) {
      nextBlocks[authoringIndex] = fallbackBlock;
    } else {
      const fallbackIndex = fallbackBlocks.findIndex((block) => isRenderablePrimaryBlock(block, blockId));
      const insertionIndex = Math.min(Math.max(fallbackIndex, 0), nextBlocks.length);
      nextBlocks.splice(insertionIndex, 0, fallbackBlock);
    }
  });

  return nextBlocks;
}

function repairAuthoringPrimaryBlocks(authoringBlocksByPath, fallbackBlocksByPath, paths) {
  let nextBlocksByPath = authoringBlocksByPath;
  paths.forEach((path) => {
    if (!hasOwnEntry(authoringBlocksByPath, path)) {
      return;
    }
    const repairedBlocks = restoreMissingPrimaryBlocks(
      authoringBlocksByPath[path],
      fallbackBlocksByPath?.[path],
    );
    if (repairedBlocks === authoringBlocksByPath[path]) {
      return;
    }
    if (nextBlocksByPath === authoringBlocksByPath) {
      nextBlocksByPath = { ...authoringBlocksByPath };
    }
    nextBlocksByPath[path] = repairedBlocks;
  });
  return nextBlocksByPath;
}

export function hasAuthoringContentForPaths(authoringBlocksByPath, pathname, fallbackPathname = '') {
  return normalizePathCandidates(pathname, fallbackPathname)
    .some((path) => hasOwnEntry(authoringBlocksByPath, path));
}

export function selectFrontHudContentSource({
  enabled = false,
  pathname = '',
  fallbackPathname = '',
  authoringBlocksByPath = {},
  blocksByPath = {},
  authoringPageHierarchy = {},
  pageHierarchy = {},
  publishedBlocksByPath = null,
  publishedPageHierarchy = null,
} = {}) {
  if (!enabled) {
    return {
      blocksByPath: publishedBlocksByPath || blocksByPath,
      pageHierarchy: publishedPageHierarchy || pageHierarchy,
      hasAuthoringBlocksForPath: false,
      hasAuthoringPageForPath: false,
    };
  }

  const paths = normalizePathCandidates(pathname, fallbackPathname);
  const hasAuthoringBlocksForPath = paths.some((path) => hasOwnEntry(authoringBlocksByPath, path));
  const hasAuthoringPageForPath = paths.some((path) => hasOwnEntry(authoringPageHierarchy, path));
  const publishedBlocks = publishedBlocksByPath || blocksByPath;
  const repairedAuthoringBlocksByPath = repairAuthoringPrimaryBlocks(
    authoringBlocksByPath,
    publishedBlocks,
    paths,
  );

  return {
    blocksByPath: hasAuthoringBlocksForPath ? repairedAuthoringBlocksByPath : blocksByPath,
    pageHierarchy: hasAuthoringPageForPath ? authoringPageHierarchy : pageHierarchy,
    hasAuthoringBlocksForPath,
    hasAuthoringPageForPath,
  };
}
