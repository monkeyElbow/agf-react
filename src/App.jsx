import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SiteLayout from './components/SiteLayout';
import NativeContentPage from './components/NativeContentPage';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import AdminContentPage from './pages/AdminContentPage';
import PageBreadcrumbs from './components/PageBreadcrumbs';
import { pageByPath, sitePages } from './data/siteMap';

const LoansPage = lazy(() => import('./pages/LoansPage'));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));
const RetirementPage = lazy(() => import('./pages/RetirementPage'));
const RatesPage = lazy(() => import('./pages/RatesPage'));
const AdminRatesPage = lazy(() => import('./pages/AdminRatesPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

function PageRoute({ page }) {
  const showNativeBreadcrumbs = page.source === null
    && page.path !== '/'
    && page.path !== '/search'
    && !page.path.startsWith('/admin/');

  const withBreadcrumbs = (node) => (
    <>
      {showNativeBreadcrumbs ? <PageBreadcrumbs path={page.path} /> : null}
      {node}
    </>
  );

  if (page.path === '/') {
    return <HomePage />;
  }

  if (page.path === '/services') {
    return withBreadcrumbs(<ServicesPage />);
  }

  if (page.path === '/services/loans') {
    return withBreadcrumbs((
      <Suspense fallback={<div className="route-page-loading" />}>
        <LoansPage />
      </Suspense>
    ));
  }

  if (page.path === '/services/investments') {
    return withBreadcrumbs((
      <Suspense fallback={<div className="route-page-loading" />}>
        <InvestmentsPage />
      </Suspense>
    ));
  }

  if (page.path === '/services/retirement') {
    return withBreadcrumbs((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RetirementPage />
      </Suspense>
    ));
  }

  if (page.path === '/admin/rates') {
    return (
      <Suspense fallback={<div className="route-page-loading" />}>
        <AdminRatesPage />
      </Suspense>
    );
  }

  if (page.path === '/admin/content') {
    return <AdminContentPage />;
  }

  if (page.path === '/rates') {
    return withBreadcrumbs((
      <Suspense fallback={<div className="route-page-loading" />}>
        <RatesPage />
      </Suspense>
    ));
  }

  if (page.path === '/search') {
    return (
      <Suspense fallback={<div className="route-page-loading" />}>
        <SearchPage />
      </Suspense>
    );
  }

  return <NativeContentPage page={page} />;
}

export default function App() {
  const location = useLocation();

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
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
      }
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const page = pageByPath[location.pathname];
    if (!page) {
      document.title = 'AGFinancial';
      return;
    }

    document.title = page.path === '/' ? 'AGFinancial' : `${page.title} | AGFinancial`;
  }, [location.pathname]);

  return (
    <SiteLayout>
      <Routes>
        {sitePages.map((page) => (
          <Route key={page.path} path={page.path} element={<PageRoute page={page} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteLayout>
  );
}
