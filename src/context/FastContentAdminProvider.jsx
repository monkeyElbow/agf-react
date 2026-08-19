import { Component, useCallback, useEffect, useMemo, useState } from 'react';
import { sitePages } from '../data/siteMap';
import { ContentAdminContext } from './ContentAdminContextCore';
import { fetchPublishedContentRouteSnapshot } from '../lib/devContentAuthorityRuntime';
import SiteLoadingScreen from '../components/SiteLoadingScreen';

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
    publishedRevisionsByPath: snapshot?.publishedRevisionsByPath || {},
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
    getPublishedRevisionForPath: (pathname) => state.publishedRevisionsByPath?.[String(pathname || '').trim()] || '',
  };
}

function describeProviderError(error) {
  return {
    name: error?.name || 'Error',
    message: error?.message || 'The admin provider could not be loaded.',
  };
}

function AdminProviderFailure({ error, onRetry }) {
  return (
    <main className="admin-provider-failure" role="alert">
      <div className="admin-provider-failure-card">
        <p className="admin-provider-failure-eyebrow">Content admin unavailable</p>
        <h1>Admin tools could not finish loading.</h1>
        <p>
          Your content is unchanged. Check that one Vite content-admin server is running, then try again.
        </p>
        <p className="admin-provider-failure-detail">{error?.message || 'Unknown provider load error.'}</p>
        <button type="button" onClick={onRetry}>Try again</button>
      </div>
    </main>
  );
}

class PublicAdminProviderBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function FastContentAdminProvider({ children }) {
  const [publishedSnapshot, setPublishedSnapshot] = useState(null);
  const [locationPathname, setLocationPathname] = useState(() => (
    typeof window !== 'undefined' ? window.location.pathname : '/'
  ));
  const [HeavyProvider, setHeavyProvider] = useState(null);
  const [adminProviderError, setAdminProviderError] = useState(null);
  const [adminProviderLoadAttempt, setAdminProviderLoadAttempt] = useState(0);
  const [shouldLoadHeavy, setShouldLoadHeavy] = useState(
    () => typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/') || readFrontHudEnabled(),
  );
  const isAdminRoute = locationPathname.startsWith('/admin/');
  const fastState = useMemo(() => buildFastState(publishedSnapshot), [publishedSnapshot]);

  const activateAdminProvider = useCallback(() => {
    setAdminProviderError(null);
    setShouldLoadHeavy(true);
    setAdminProviderLoadAttempt((attempt) => attempt + 1);
  }, []);

  const retryAdminProvider = useCallback(() => {
    setAdminProviderError(null);
    setHeavyProvider(null);
    setShouldLoadHeavy(true);
    setAdminProviderLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (locationPathname.startsWith('/admin/') && !shouldLoadHeavy) {
      setShouldLoadHeavy(true);
    }
  }, [locationPathname, shouldLoadHeavy]);

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

    // Admin/HUD controls own this stylesheet. Keep 145 KB of editor CSS out
    // of ordinary public-route startup, but load it with the same activation
    // boundary as the heavy admin provider.
    void import('../styles/admin.css');
    return undefined;
  }, [shouldLoadHeavy]);

  useEffect(() => {
    if (!shouldLoadHeavy) {
      return undefined;
    }
    let active = true;
    setAdminProviderError(null);
    import('./ContentAdminContext').then((module) => {
      if (active && typeof module.ContentAdminProvider === 'function') {
        setHeavyProvider(() => module.ContentAdminProvider);
        return;
      }
      if (active) {
        setAdminProviderError(describeProviderError(new Error('ContentAdminProvider export was not found.')));
      }
    }).catch((error) => {
      if (active) {
        setAdminProviderError(describeProviderError(error));
      }
    });
    return () => {
      active = false;
    };
  }, [adminProviderLoadAttempt, shouldLoadHeavy]);

  const fastContextValue = {
    ...buildFastContextValue(fastState),
    activateAdminProvider,
    retryAdminProvider,
    isAdminProviderReady: Boolean(HeavyProvider),
    isAdminProviderLoading: shouldLoadHeavy && !HeavyProvider && !adminProviderError,
    adminProviderError,
  };

  if (HeavyProvider) {
    const publicFallback = isAdminRoute
      ? (
        <ContentAdminContext.Provider value={fastContextValue}>
          <AdminProviderFailure
            error={adminProviderError || new Error('The admin provider could not finish loading.')}
            onRetry={retryAdminProvider}
          />
        </ContentAdminContext.Provider>
      )
      : children;
    return (
      <PublicAdminProviderBoundary
        key={adminProviderLoadAttempt}
        fallback={publicFallback}
        onError={(error) => setAdminProviderError(describeProviderError(error))}
      >
        <HeavyProvider>{children}</HeavyProvider>
      </PublicAdminProviderBoundary>
    );
  }

  if (isAdminRoute) {
    return (
      <ContentAdminContext.Provider value={fastContextValue}>
        {adminProviderError ? (
          <AdminProviderFailure error={adminProviderError} onRetry={retryAdminProvider} />
        ) : (
          <SiteLoadingScreen />
        )}
      </ContentAdminContext.Provider>
    );
  }

  return (
    <ContentAdminContext.Provider value={fastContextValue}>
      {children}
    </ContentAdminContext.Provider>
  );
}
