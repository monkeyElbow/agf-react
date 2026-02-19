import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { navSections } from '../data/siteMap';
import SiteFooter from './SiteFooter';
import agfLogo from '../assets/agf-logo.svg';

const DESKTOP_NAV_QUERY = '(min-width: 1100px)';

function navLinkClass({ isActive }) {
  return isActive ? 'is-active' : '';
}

export default function SiteLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [desktopQueryMatch, setDesktopQueryMatch] = useState(
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_NAV_QUERY).matches : false,
  );
  const [forceCompactNav, setForceCompactNav] = useState(false);
  const navInnerRef = useRef(null);
  const brandRef = useRef(null);
  const navLinksRef = useRef(null);

  const isDesktop = desktopQueryMatch && !forceCompactNav;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const sync = () => {
      setDesktopQueryMatch(media.matches);
      if (!media.matches) {
        setForceCompactNav(false);
        setOpenDropdown(null);
      } else {
        setMenuOpen(false);
      }
    };
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    let rafId = 0;

    const measure = () => {
      const inner = navInnerRef.current;
      const brand = brandRef.current;
      const links = navLinksRef.current;
      if (!inner || !brand || !links) {
        return;
      }

      if (!media.matches) {
        setForceCompactNav(false);
        return;
      }

      const innerWidth = inner.clientWidth;
      const brandWidth = brand.offsetWidth;
      const linksWidth = links.scrollWidth;
      const reserved = 40;
      const available = Math.max(0, innerWidth - brandWidth - reserved);
      setForceCompactNav(linksWidth > available);
    };

    const queueMeasure = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };

    let observer = null;
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(queueMeasure);
      if (navInnerRef.current) {
        observer.observe(navInnerRef.current);
      }
      if (brandRef.current) {
        observer.observe(brandRef.current);
      }
      if (navLinksRef.current) {
        observer.observe(navLinksRef.current);
      }
    }
    window.addEventListener('resize', queueMeasure);
    document.fonts?.ready?.then(queueMeasure);
    queueMeasure();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', queueMeasure);
      observer?.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  function toggleDropdown(title) {
    setOpenDropdown((current) => (current === title ? null : title));
  }

  return (
    <>
      <nav className={`site-nav${forceCompactNav ? ' is-force-mobile' : ''}`} aria-label="Main navigation">
        <div ref={navInnerRef} className="site-nav-inner">
          <Link ref={brandRef} to="/" className="site-brand" aria-label="AGFinancial Home">
            <img src={agfLogo} alt="AGFinancial" className="brand-logo" />
          </Link>

          <button
            type="button"
            className="site-nav-toggle"
            aria-controls="site-nav-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>

          <div id="site-nav-menu" className={`site-nav-menu${menuOpen ? ' is-open' : ''}`}>
            <div ref={navLinksRef} className="site-nav-links">
              <div className="site-nav-links-primary">
                {navSections.map((section) => (
                  <div
                    key={section.title}
                    className={`site-nav-group${openDropdown === section.title ? ' is-open' : ''}`}
                    onMouseEnter={() => {
                      if (isDesktop) {
                        setOpenDropdown(section.title);
                      }
                    }}
                    onMouseLeave={() => {
                      if (isDesktop) {
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    <div className="site-nav-group-head">
                      <button
                        type="button"
                        className="site-nav-group-link"
                        onClick={() => {
                          navigate(section.rootPath || section.items[0]?.path || '/');
                          setMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                      >
                        {section.title}
                      </button>
                      <button
                        type="button"
                        className="site-nav-group-toggle"
                        aria-expanded={openDropdown === section.title}
                        onClick={() => toggleDropdown(section.title)}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="site-nav-dropdown">
                      {section.items.map((item) => (
                        <NavLink to={item.path} key={item.path} className={navLinkClass}>
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="site-nav-links-utility">
                <a
                  href="https://secure.agfinancial.org/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="site-nav-link nav-login-link"
                >
                  <span className="nav-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                      />
                    </svg>
                  </span>
                  <span>Log In</span>
                </a>
                <NavLink to="/search" className="site-nav-link nav-search-link" aria-label="Search">
                  <span className="nav-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M10 2a8 8 0 1 0 5.29 14l4.35 4.35 1.41-1.41-4.35-4.35A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
                      />
                    </svg>
                  </span>
                  <span className="nav-search-text">Search</span>
                </NavLink>
                <div
                  className={`site-nav-group is-admin${openDropdown === 'Admin' ? ' is-open' : ''}`}
                  onMouseEnter={() => {
                    if (isDesktop) {
                      setOpenDropdown('Admin');
                    }
                  }}
                  onMouseLeave={() => {
                    if (isDesktop) {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <div className="site-nav-group-head">
                    <button
                      type="button"
                      className="site-nav-group-link"
                      onClick={() => {
                        navigate('/admin/content');
                        setMenuOpen(false);
                        setOpenDropdown(null);
                      }}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      className="site-nav-group-toggle"
                      aria-expanded={openDropdown === 'Admin'}
                      onClick={() => toggleDropdown('Admin')}
                    >
                      ▼
                    </button>
                  </div>
                  <div className="site-nav-dropdown">
                    <NavLink to="/admin/content" className={navLinkClass}>
                      Content
                    </NavLink>
                    <NavLink to="/admin/resources" className={navLinkClass}>
                      Resources
                    </NavLink>
                    <NavLink to="/admin/rates" className={navLinkClass}>
                      Rates
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <div className="app-main-shell">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
