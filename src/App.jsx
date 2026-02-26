import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SiteLayout from './components/SiteLayout';
import NativeContentPage from './components/NativeContentPage';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminRedirectsPage from './pages/AdminRedirectsPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import PageBreadcrumbs from './components/PageBreadcrumbs';
import SiteAnnouncementBar from './components/SiteAnnouncementBar';
import { pageByPath, sitePages } from './data/siteMap';
import { useRedirects } from './context/RedirectsContext';

const LoansPage = lazy(() => import('./pages/LoansPage'));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));
const RetirementPage = lazy(() => import('./pages/RetirementPage'));
const RatesPage = lazy(() => import('./pages/RatesPage'));
const AdminRatesPage = lazy(() => import('./pages/AdminRatesPage'));
const AdminResourcesPage = lazy(() => import('./pages/AdminResourcesPage'));
const AdminMediaAuditPage = lazy(() => import('./pages/AdminMediaAuditPage'));
const AdminMessagePage = lazy(() => import('./pages/AdminMessagePage'));
const AdminConsultantsPage = lazy(() => import('./pages/AdminConsultantsPage'));
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage'));
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
  const showAnnouncement = page.path !== '/';
  const showNativeBreadcrumbs = page.source === null
    && page.path !== '/'
    && page.path !== '/search'
    && !page.path.startsWith('/admin/');

  const withTopBands = (node) => (
    <>
      {showAnnouncement ? <SiteAnnouncementBar /> : null}
      {showNativeBreadcrumbs ? <PageBreadcrumbs path={page.path} /> : null}
      {node}
    </>
  );

  if (page.path === '/') {
    return <HomePage />;
  }

  if (page.path === '/services') {
    return withTopBands(<ServicesPage />);
  }

  if (page.path === '/services/loans') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <LoansPage />
      </Suspense>
    ));
  }

  if (page.path === '/services/investments') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <InvestmentsPage />
      </Suspense>
    ));
  }

  if (page.path === '/services/retirement') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RetirementPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/rates') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminRatesPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/content') {
    return withTopBands(<AdminContentPage />);
  }

  if (page.path === '/admin/redirects') {
    return withTopBands(<AdminRedirectsPage />);
  }

  if (page.path === '/admin/documents') {
    return withTopBands(<AdminDocumentsPage />);
  }

  if (page.path === '/admin/resources') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminResourcesPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/media-audit') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminMediaAuditPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/consultants') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminConsultantsPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/jobs') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminJobsPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/message') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminMessagePage />
      </Suspense>
    ));
  }

  if (page.path === '/rates') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RatesPage />
      </Suspense>
    ));
  }

  if (page.path === '/resources') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <ResourcesPage />
      </Suspense>
    ));
  }

  if (page.path === '/search') {
    return withTopBands((
      <Suspense fallback={<div className="route-page-loading" />}>
        <SearchPage />
      </Suspense>
    ));
  }

  if (page.path === '/yourplan') {
    return <Navigate to="/" replace />;
  }

  return withTopBands(<NativeContentPage page={page} />);
}

export default function App() {
  const location = useLocation();
  const { resolveRedirect } = useRedirects();

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return undefined;
    }

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
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

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const page = pageByPath[location.pathname];
    if (!page) {
      document.title = 'AGFinancial';
      return;
    }

    document.title = page.path === '/' ? 'AGFinancial' : `${page.title} | AGFinancial`;
  }, [location.pathname]);

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

  return (
    <SiteLayout>
      <Routes>
        {sitePages.map((page) => (
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
