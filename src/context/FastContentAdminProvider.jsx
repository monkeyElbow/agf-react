import { useCallback, useEffect, useMemo, useState } from 'react';
import { sitePages } from '../data/siteMap';
import { ContentAdminContext } from './ContentAdminContextCore';
import { fetchPublishedContentRouteSnapshot } from '../lib/devContentAuthorityClient';

const FRONT_HUD_ENABLED_STORAGE_KEY = 'agf-admin-front-hud-enabled-v1';

function readFrontHudEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(FRONT_HUD_ENABLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function buildFastState(snapshot = null) {
  const snapshotState = snapshot?.baseSnapshot || snapshot?.state || {};
  const seededPages = Object.fromEntries(sitePages.map((page) => [page.path, { ...page }]));
  const pageHierarchy = Object.keys(snapshotState.pageHierarchy || {}).length
    ? { ...seededPages, ...snapshotState.pageHierarchy }
    : seededPages;
  const blocksByPath = snapshotState.blocksByPath && typeof snapshotState.blocksByPath === 'object'
    ? snapshotState.blocksByPath
    : {};
  const pathAliases = snapshotState.pathAliases && typeof snapshotState.pathAliases === 'object'
    ? { ...snapshotState.pathAliases }
    : {};
  const pathSet = new Set(Object.keys(pageHierarchy));

  Object.values(pageHierarchy).forEach((page) => {
    if (page.path !== '/' && !page.parentPath) {
      const segments = String(page.path || '').split('/').filter(Boolean);
      while (segments.length > 1) {
        segments.pop();
        const candidate = `/${segments.join('/')}`;
        if (pathSet.has(candidate)) {
          page.parentPath = candidate;
          break;
        }
      }
    }
    (Array.isArray(page.linkRefAliases) ? page.linkRefAliases : []).forEach((alias) => {
      const normalizedAlias = String(alias || '').trim();
      if (normalizedAlias && normalizedAlias !== page.path) {
        pathAliases[normalizedAlias] = page.path;
      }
    });
  });

  return {
    pageHierarchy,
    blocksByPath,
    authoringPageHierarchy: pageHierarchy,
    authoringBlocksByPath: {},
    pathAliases,
    authoringPathAliases: pathAliases,
  };
}

function resolvePathFromRef(pathRef, fallback = '/') {
  const normalized = String(pathRef || '').trim();
  return normalized || fallback;
}

function buildBreadcrumbTrail(pathname, pageHierarchy) {
  const trail = [];
  const visited = new Set();
  let currentPath = String(pathname || '').trim();
  while (currentPath && pageHierarchy[currentPath] && !visited.has(currentPath)) {
    visited.add(currentPath);
    const page = pageHierarchy[currentPath];
    trail.unshift({ path: page.path, label: page.breadcrumbLabel || page.title || page.path });
    currentPath = page.parentPath || '';
  }
  return trail;
}

function buildFastContextValue(state) {
  return {
    ...state,
    devIdentity: null,
    resolveManagedPath: resolvePathFromRef,
    resolveManagedPathFromRef: resolvePathFromRef,
    resolveAuthoringManagedPathFromRef: resolvePathFromRef,
    getBreadcrumbTrail: (pathname) => buildBreadcrumbTrail(pathname, state.pageHierarchy),
    getAuthoringBreadcrumbTrail: (pathname) => buildBreadcrumbTrail(pathname, state.authoringPageHierarchy),
  };
}

export default function FastContentAdminProvider({ children }) {
  const [publishedSnapshot, setPublishedSnapshot] = useState(null);
  const [locationPathname, setLocationPathname] = useState(() => (
    typeof window !== 'undefined' ? window.location.pathname : '/'
  ));
  const [HeavyProvider, setHeavyProvider] = useState(null);
  const [shouldLoadHeavy, setShouldLoadHeavy] = useState(
    () => typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/') || readFrontHudEnabled(),
  );
  const fastState = useMemo(() => buildFastState(publishedSnapshot), [publishedSnapshot]);

  const activateAdminProvider = useCallback(() => {
    setShouldLoadHeavy(true);
  }, []);

  useEffect(() => {
    if (shouldLoadHeavy || !import.meta.env.DEV || typeof window === 'undefined') {
      return undefined;
    }

    let active = true;
    fetchPublishedContentRouteSnapshot(locationPathname)
      .then((snapshot) => {
        if (active && snapshot?.initialized) {
          setPublishedSnapshot(snapshot);
        }
      })
      .catch(() => {
        // Public rendering remains available from the code-owned page map and native content.
      });

    return () => {
      active = false;
    };
  }, [locationPathname, shouldLoadHeavy]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const updatePathname = () => setLocationPathname(window.location.pathname || '/');
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushStateWithContentRouteUpdate(...args) {
      const result = originalPushState.apply(this, args);
      updatePathname();
      return result;
    };
    window.history.replaceState = function replaceStateWithContentRouteUpdate(...args) {
      const result = originalReplaceState.apply(this, args);
      updatePathname();
      return result;
    };
    window.addEventListener('popstate', updatePathname);
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', updatePathname);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadHeavy) {
      return undefined;
    }
    let active = true;
    import('./ContentAdminContext').then((module) => {
      if (active) {
        setHeavyProvider(() => module.ContentAdminProvider);
      }
    }).catch(() => {
      // Public rendering remains available if the optional admin provider fails to load.
    });
    return () => {
      active = false;
    };
  }, [shouldLoadHeavy]);

  if (HeavyProvider) {
    return <HeavyProvider>{children}</HeavyProvider>;
  }

  return (
    <ContentAdminContext.Provider value={{
      ...buildFastContextValue(fastState),
      activateAdminProvider,
      isAdminProviderLoading: shouldLoadHeavy,
    }}>
      {children}
    </ContentAdminContext.Provider>
  );
}
