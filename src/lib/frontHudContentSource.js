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
} = {}) {
  if (!enabled) {
    return {
      blocksByPath,
      pageHierarchy,
      hasAuthoringBlocksForPath: false,
      hasAuthoringPageForPath: false,
    };
  }

  const paths = normalizePathCandidates(pathname, fallbackPathname);
  const hasAuthoringBlocksForPath = paths.some((path) => hasOwnEntry(authoringBlocksByPath, path));
  const hasAuthoringPageForPath = paths.some((path) => hasOwnEntry(authoringPageHierarchy, path));

  return {
    blocksByPath: hasAuthoringBlocksForPath ? authoringBlocksByPath : blocksByPath,
    pageHierarchy: hasAuthoringPageForPath ? authoringPageHierarchy : pageHierarchy,
    hasAuthoringBlocksForPath,
    hasAuthoringPageForPath,
  };
}
