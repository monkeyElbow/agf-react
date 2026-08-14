import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
const NativeContentPage = lazy(() => import('./components/NativeContentPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const BrandPage = lazy(() => import('./pages/BrandPage'));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage'));
const AdminRedirectsPage = lazy(() => import('./pages/AdminRedirectsPage'));
const AdminDocumentsPage = lazy(() => import('./pages/AdminDocumentsPage'));
import PageBreadcrumbs from './components/PageBreadcrumbs';
import SiteAnnouncementBar from './components/SiteAnnouncementBar';
import SiteLoadingScreen from './components/SiteLoadingScreen';
import { pageByPath, sitePages } from './data/siteMap';
import { useContentAdmin } from './context/ContentAdminContextCore';
import { useRedirects } from './context/RedirectsContext';
import { recordHomeReturnAssistNavigation } from './lib/homeReturnAssist';

const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const RetirementPage = lazy(() => import('./pages/RetirementPage'));
const RatesPage = lazy(() => import('./pages/RatesPage'));
const AdminRatesPage = lazy(() => import('./pages/AdminRatesPage'));
const AdminResourcesPage = lazy(() => import('./pages/AdminResourcesPage'));
const AdminMediaAuditPage = lazy(() => import('./pages/AdminMediaAuditPage'));
const AdminMessagePage = lazy(() => import('./pages/AdminMessagePage'));
const AdminConsultantsPage = lazy(() => import('./pages/AdminConsultantsPage'));
const AdminTestimonialsPage = lazy(() => import('./pages/AdminTestimonialsPage'));
const AdminDisclosuresPage = lazy(() => import('./pages/AdminDisclosuresPage'));
const AdminChartsPage = lazy(() => import('./pages/AdminChartsPage'));
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage'));
const AdminBlocksPage = lazy(() => import('./pages/AdminBlocksPage'));
const AdminProfilePage = lazy(() => import('./pages/AdminProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ResourceArticlePage = lazy(() => import('./pages/ResourceArticlePage'));
const LazyConsultantsProvider = lazy(() => import('./context/ConsultantsContext').then((module) => ({
  default: module.ConsultantsProvider,
})));
const LazyConsultantResponsesProvider = lazy(() => import('./context/ConsultantResponsesContext').then((module) => ({
  default: module.ConsultantResponsesProvider,
})));
const LazyCareersJobsProvider = lazy(() => import('./context/CareersJobsContext').then((module) => ({
  default: module.CareersJobsProvider,
})));

const CONSULTANT_DATA_ROUTES = new Set([
  '/services/loans/loan-consultants',
  '/services/retirement/retirement-consultants',
  '/admin/consultants',
]);

function withRouteDataProviders(routeKey, node) {
  let nextNode = node;
  if (CONSULTANT_DATA_ROUTES.has(routeKey)) {
    nextNode = (
      <LazyConsultantResponsesProvider>
        <LazyConsultantsProvider>{nextNode}</LazyConsultantsProvider>
      </LazyConsultantResponsesProvider>
    );
  }
  if (routeKey === '/about-us/careers' || routeKey === '/admin/jobs') {
    nextNode = <LazyCareersJobsProvider>{nextNode}</LazyCareersJobsProvider>;
  }
  return nextNode;
}

function ExternalRedirect({ to }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && to) {
      window.location.replace(to);
    }
  }, [to]);

  return <SiteLoadingScreen />;
}

function sortManagedPages(pages) {
  return [...pages].sort((a, b) => String(a.path || '').localeCompare(String(b.path || '')));
}

function mergeManagedPages(cachedPages, currentPages) {
  const byPath = new Map();
  (Array.isArray(cachedPages) ? cachedPages : []).forEach((page) => {
    if (page?.path) {
      byPath.set(page.path, page);
    }
  });
  (Array.isArray(currentPages) ? currentPages : []).forEach((page) => {
    if (page?.path) {
      byPath.set(page.path, page);
    }
  });
  return sortManagedPages(Array.from(byPath.values()));
}

function PageRoute({ page }) {
  const routeKey = String(page.routeKey || page.path || '').trim();
  const showAnnouncement = true;
  const showNativeBreadcrumbs = page.source === null
    && routeKey !== '/'
    && routeKey !== '/search'
    && !routeKey.startsWith('/admin/');

  const withTopBands = (node) => (
    <>
      {showAnnouncement ? <SiteAnnouncementBar /> : null}
      {showNativeBreadcrumbs ? <PageBreadcrumbs path={page.path} /> : null}
      {node}
    </>
  );
  const withPageSuspense = (node) => withTopBands(
    <Suspense fallback={<SiteLoadingScreen />}>
      {withRouteDataProviders(routeKey, node)}
    </Suspense>,
  );

  if (routeKey === '/') {
    return withPageSuspense(<HomePage />);
  }

  if (routeKey === '/services') {
    return withPageSuspense(<ServicesPage />);
  }

  if (routeKey === '/brand') {
    return withPageSuspense(<BrandPage />);
  }

  if (routeKey === '/services/investments') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <InvestmentsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/services/loans') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <LoansPage />
      </Suspense>
    ));
  }

  if (routeKey === '/services/retirement') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <RetirementPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/rates') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminRatesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/content') {
    return withPageSuspense(<AdminContentPage />);
  }

  if (routeKey === '/admin/redirects') {
    return withPageSuspense(<AdminRedirectsPage />);
  }

  if (routeKey === '/admin/documents') {
    return withPageSuspense(<AdminDocumentsPage />);
  }

  if (routeKey === '/admin/resources') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminResourcesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/media-audit') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminMediaAuditPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/consultants') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminConsultantsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/testimonials') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminTestimonialsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/disclosures') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminDisclosuresPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/charts') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminChartsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/jobs') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminJobsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/message') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminMessagePage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/blocks') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminBlocksPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/profile') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <AdminProfilePage />
      </Suspense>
    ));
  }

  if (routeKey === '/rates') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <RatesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/resources') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <ResourcesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/search') {
    return withTopBands((
      <Suspense fallback={<SiteLoadingScreen />}>
        <SearchPage />
      </Suspense>
    ));
  }

  if (routeKey === '/yourplan') {
    return <Navigate to="/" replace />;
  }

  return withPageSuspense(<NativeContentPage page={page} />);
}

export default function App() {
  const location = useLocation();
  const isInitialNavigationRef = useRef(true);
  const [managedPagesCache, setManagedPagesCache] = useState([]);
  const { pageHierarchy, resolveManagedPath, sharedSyncStatus } = useContentAdmin();
  const { resolveRedirect } = useRedirects();
  const sharedSyncPending = Boolean(sharedSyncStatus?.isPending || sharedSyncStatus?.hasQueuedDraftSync);
  const adminPages = useMemo(
    () => sitePages
      .filter((page) => page.path.startsWith('/admin/'))
      .map((page) => ({
        ...page,
        routeKey: page.path,
        linkRef: String(page.linkRef || page.path),
      })),
    [],
  );
  const managedPagesFromState = useMemo(
    () => Object.values(pageHierarchy || {})
      .filter((page) => page && page.path)
      .sort((a, b) => a.path.localeCompare(b.path)),
    [pageHierarchy],
  );
  const managedPages = useMemo(() => {
    if (!sharedSyncPending) {
      return managedPagesFromState;
    }
    return mergeManagedPages(managedPagesCache, managedPagesFromState);
  }, [managedPagesCache, managedPagesFromState, sharedSyncPending]);

  useEffect(() => {
    if (sharedSyncPending && !managedPagesFromState.length) {
      return;
    }
    const nextCache = sharedSyncPending
      ? mergeManagedPages(managedPagesCache, managedPagesFromState)
      : managedPagesFromState;
    setManagedPagesCache((current) => (
      JSON.stringify(current) === JSON.stringify(nextCache) ? current : nextCache
    ));
  }, [managedPagesCache, managedPagesFromState, sharedSyncPending]);
  const managedPageByPath = useMemo(
    () => Object.fromEntries(managedPages.map((page) => [page.path, page])),
    [managedPages],
  );
  const routablePages = useMemo(
    () => [...managedPages, ...adminPages],
    [managedPages, adminPages],
  );

  useLayoutEffect(() => {
    recordHomeReturnAssistNavigation(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return undefined;
    }
    window.history.scrollRestoration = 'auto';
    return undefined;
  }, []);

  useEffect(() => {
    const isInitialNavigation = isInitialNavigationRef.current;
    if (isInitialNavigation) {
      isInitialNavigationRef.current = false;
    }

    if (location.hash) {
      const id = decodeURIComponent(location.hash.replace(/^#/, ''));
      let rafId = 0;
      let attempts = 0;
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

      const scrollToHashTarget = () => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: scrollBehavior });
          return;
        }
        if (attempts >= 10) {
          return;
        }
        attempts += 1;
        rafId = window.requestAnimationFrame(scrollToHashTarget);
      };

      scrollToHashTarget();
      return () => window.cancelAnimationFrame(rafId);
    }

    if (isInitialNavigation) {
      return undefined;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const page = managedPageByPath[location.pathname] || pageByPath[location.pathname];
    if (!page) {
      document.title = 'AGFinancial';
      return;
    }

    document.title = page.path === '/' ? 'AGFinancial' : `${page.title} | AGFinancial`;
  }, [location.pathname, managedPageByPath]);

  const redirectMatch = resolveRedirect({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  });

  if (redirectMatch) {
    if (redirectMatch.external) {
      return <ExternalRedirect to={redirectMatch.to} />;
    }
    return <Navigate to={redirectMatch.to} replace />;
  }

  const resolvedManagedPath = resolveManagedPath(location.pathname);
  if (
    resolvedManagedPath
    && resolvedManagedPath !== location.pathname
    && managedPageByPath[resolvedManagedPath]
  ) {
    const to = `${resolvedManagedPath}${location.search || ''}${location.hash || ''}`;
    return <Navigate to={to} replace />;
  }

  return (
    <SiteLayout>
      <RouteErrorBoundary key={`${location.pathname}${location.search}${location.hash}`}>
        <Routes>
          {routablePages.map((page) => (
            <Route key={page.path} path={page.path} element={<PageRoute page={page} />} />
          ))}
          <Route
            path="/resources/article/:slug"
            element={(
              <Suspense fallback={<SiteLoadingScreen />}>
                <ResourceArticlePage />
              </Suspense>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RouteErrorBoundary>
    </SiteLayout>
  );
}
