import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import NativeContentPage from './components/NativeContentPage';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BrandPage from './pages/BrandPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminRedirectsPage from './pages/AdminRedirectsPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import PageBreadcrumbs from './components/PageBreadcrumbs';
import SiteAnnouncementBar from './components/SiteAnnouncementBar';
import { pageByPath, sitePages } from './data/siteMap';
import { useContentAdmin } from './context/ContentAdminContext';
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
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage'));
const AdminBlocksPage = lazy(() => import('./pages/AdminBlocksPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ResourceArticlePage = lazy(() => import('./pages/ResourceArticlePage'));

function ExternalRedirect({ to }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && to) {
      window.location.replace(to);
    }
  }, [to]);

  return <div className="route-page-loading" />;
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

  if (routeKey === '/') {
    return withTopBands(<HomePage />);
  }

  if (routeKey === '/services') {
    return withTopBands(<ServicesPage />);
  }

  if (routeKey === '/brand') {
    return withTopBands(<BrandPage />);
  }

  if (routeKey === '/services/investments') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <InvestmentsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/services/loans') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <LoansPage />
      </Suspense>
    ));
  }

  if (routeKey === '/services/retirement') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RetirementPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/rates') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminRatesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/content') {
    return withTopBands(<AdminContentPage />);
  }

  if (routeKey === '/admin/redirects') {
    return withTopBands(<AdminRedirectsPage />);
  }

  if (routeKey === '/admin/documents') {
    return withTopBands(<AdminDocumentsPage />);
  }

  if (routeKey === '/admin/resources') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminResourcesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/media-audit') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminMediaAuditPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/consultants') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminConsultantsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/testimonials') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminTestimonialsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/jobs') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminJobsPage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/message') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminMessagePage />
      </Suspense>
    ));
  }

  if (routeKey === '/admin/blocks') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminBlocksPage />
      </Suspense>
    ));
  }

  if (routeKey === '/rates') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RatesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/resources') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <ResourcesPage />
      </Suspense>
    ));
  }

  if (routeKey === '/search') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <SearchPage />
      </Suspense>
    ));
  }

  if (routeKey === '/yourplan') {
    return <Navigate to="/" replace />;
  }

  return withTopBands(<NativeContentPage page={page} />);
}

export default function App() {
  const location = useLocation();
  const isInitialNavigationRef = useRef(true);
  const { pageHierarchy, resolveManagedPath } = useContentAdmin();
  const { resolveRedirect } = useRedirects();
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
  const managedPages = useMemo(
    () => Object.values(pageHierarchy || {})
      .filter((page) => page && page.path)
      .sort((a, b) => a.path.localeCompare(b.path)),
    [pageHierarchy],
  );
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
      <Routes>
        {routablePages.map((page) => (
          <Route key={page.path} path={page.path} element={<PageRoute page={page} />} />
        ))}
        <Route
          path="/resources/article/:slug"
          element={(
            <Suspense fallback={<div className="route-page-loading" />}>
              <ResourceArticlePage />
            </Suspense>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteLayout>
  );
}
