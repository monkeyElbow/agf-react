export function buildFastInitialContentAdminState({
  sitePages = [],
  defaultPathAliases = {},
} = {}) {
  const pageHierarchy = Object.fromEntries(
    sitePages.map((page) => [page.path, { ...page }]),
  );
  const pathSet = new Set(Object.keys(pageHierarchy));
  Object.values(pageHierarchy).forEach((page) => {
    if (page.parentPath || page.path === '/') {
      return;
    }
    const segments = String(page.path || '').split('/').filter(Boolean);
    while (segments.length > 1) {
      segments.pop();
      const candidate = `/${segments.join('/')}`;
      if (pathSet.has(candidate)) {
        page.parentPath = candidate;
        break;
      }
    }
  });

  const pathAliases = { ...defaultPathAliases };
  sitePages.forEach((page) => {
    (Array.isArray(page.linkRefAliases) ? page.linkRefAliases : []).forEach((alias) => {
      const normalizedAlias = String(alias || '').trim();
      if (normalizedAlias && normalizedAlias !== page.path) {
        pathAliases[normalizedAlias] = page.path;
      }
    });
  });

  return {
    pageHierarchy,
    blocksByPath: {},
    pathAliases,
    collaborationByPath: {},
  };
}

export function hasContentAdminSnapshotStateContent(snapshot) {
  const nextState = snapshot?.state || snapshot?.payload?.state;
  if (!nextState || typeof nextState !== 'object') {
    return false;
  }
  return (
    Object.keys(nextState.pageHierarchy || {}).length > 0
    || Object.keys(nextState.blocksByPath || {}).length > 0
  );
}

export function parseInitialContentAdminBootstrapState({
  initialState,
  normalizeStoredConfig,
  readInitialState,
  normalizeAuthorityState,
} = {}) {
  if (
    initialState
    && typeof initialState === 'object'
    && initialState.__contentAdminBootstrap
    && typeof initialState.__contentAdminBootstrap === 'object'
  ) {
    const bootstrap = initialState.__contentAdminBootstrap;
    const authoringState = normalizeAuthorityState(bootstrap.authoringState || initialState);
    const publishedState = normalizeAuthorityState(bootstrap.publishedState || bootstrap.authoringState || initialState);
    return {
      authoringState,
      publishedState,
      updatedAt: Number(bootstrap.updatedAt) || 0,
      seedBaseline: bootstrap.seedBaseline || null,
      publishedRevisionsByPath: bootstrap.publishedRevisionsByPath || {},
    };
  }

  const normalizedState = initialState ? normalizeStoredConfig(initialState) : readInitialState();
  return {
    authoringState: normalizedState,
    publishedState: normalizedState,
    updatedAt: 0,
    seedBaseline: null,
    publishedRevisionsByPath: {},
  };
}
