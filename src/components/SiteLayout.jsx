import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { navSections } from '../data/siteMap';
import { useContentAdmin } from '../context/ContentAdminContext';
import { FrontHudContext } from '../context/FrontHudContext';
import { isApplePlatformNavigator, isSafariBrowserNavigator } from '../lib/browserFlags';
import SiteFooter from './SiteFooter';
import AnimatedBrandLogo from './AnimatedBrandLogo';
import SiteChatbotWindow from './SiteChatbotWindow';

const DESKTOP_NAV_QUERY = '(min-width: 1100px)';
const CONTENT_WIDTH_OVERLAY_STORAGE_KEY = 'agf-admin-content-width-overlay-v1';
const FRONT_HUD_ENABLED_STORAGE_KEY = 'agf-admin-front-hud-enabled-v1';
const FRONT_HUD_OPACITY_STORAGE_KEY = 'agf-admin-front-hud-opacity-v1';
const FRONT_HUD_DIM_STRENGTH_STORAGE_KEY = 'agf-admin-front-hud-dim-strength-v1';
const ADMIN_NAV_ITEMS = [
  { to: '/admin/rates', label: 'Rates' },
  { to: '/admin/content', label: 'Core Content' },
  { to: '/admin/resources', label: 'Resources' },
  { to: '/admin/consultants', label: 'Consultants' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/documents', label: 'Documents' },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/message', label: 'Message' },
  { to: '/admin/redirects', label: 'Redirects' },
  { to: '/admin/media-audit', label: 'Media Audit' },
  { to: '/admin/blocks', label: 'Blocks Audit' },
];

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(5, Math.min(90, Math.round(numeric)));
}

function clampFrontHudDimStrength(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 42;
  }
  return Math.max(0, Math.min(85, Math.round(numeric)));
}

function navLinkClass({ isActive }) {
  return `site-nav-dropdown-link${isActive ? ' is-active' : ''}`;
}

function getNavSectionId(title) {
  return String(title || 'section')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }
  const tagName = String(target.tagName || '').toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return true;
  }
  return target.isContentEditable;
}

export default function SiteLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolveManagedPathFromRef } = useContentAdmin();
  const isAdminRoute = location.pathname.startsWith('/admin/');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [desktopQueryMatch, setDesktopQueryMatch] = useState(
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_NAV_QUERY).matches : false,
  );
  const [forceCompactNav, setForceCompactNav] = useState(false);
  const [contentWidthOverlayEnabled, setContentWidthOverlayEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(CONTENT_WIDTH_OVERLAY_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [frontHudEnabled, setFrontHudEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(FRONT_HUD_ENABLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [frontHudOpacity, setFrontHudOpacity] = useState(() => {
    if (typeof window === 'undefined') {
      return 15;
    }
    try {
      const stored = window.localStorage.getItem(FRONT_HUD_OPACITY_STORAGE_KEY);
      return clampFrontHudOpacity(stored);
    } catch {
      return 15;
    }
  });
  const [frontHudRevealToken, setFrontHudRevealToken] = useState(0);
  const [isFrontHudRevealing, setIsFrontHudRevealing] = useState(false);
  const [frontHudDimStrength, setFrontHudDimStrength] = useState(() => {
    if (typeof window === 'undefined') {
      return 42;
    }
    try {
      const stored = window.localStorage.getItem(FRONT_HUD_DIM_STRENGTH_STORAGE_KEY);
      return clampFrontHudDimStrength(stored);
    } catch {
      return 42;
    }
  });
  const [isApplePlatform] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return isApplePlatformNavigator(window.navigator);
  });
  const [isSafariBrowser] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return isSafariBrowserNavigator(window.navigator);
  });
  const frontHudEnabledRef = useRef(frontHudEnabled);
  const previousFrontHudEnabledRef = useRef(frontHudEnabled);
  const frontHudOpacityRef = useRef(frontHudOpacity);
  const navHoverCloseTimeoutRef = useRef(null);
  const navRef = useRef(null);
  const navInnerRef = useRef(null);
  const brandRef = useRef(null);
  const navLinksRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    document.documentElement.classList.toggle('ag-browser-safari', isSafariBrowser);
    return () => {
      document.documentElement.classList.remove('ag-browser-safari');
    };
  }, [isSafariBrowser]);

  const closeNavMenus = () => {
    if (typeof window !== 'undefined' && navHoverCloseTimeoutRef.current !== null) {
      window.clearTimeout(navHoverCloseTimeoutRef.current);
      navHoverCloseTimeoutRef.current = null;
    }
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  const cancelScheduledDropdownClose = () => {
    if (typeof window === 'undefined' || navHoverCloseTimeoutRef.current === null) {
      return;
    }
    window.clearTimeout(navHoverCloseTimeoutRef.current);
    navHoverCloseTimeoutRef.current = null;
  };

  const scheduleDropdownClose = () => {
    if (typeof window === 'undefined') {
      setOpenDropdown(null);
      return;
    }
    cancelScheduledDropdownClose();
    navHoverCloseTimeoutRef.current = window.setTimeout(() => {
      navHoverCloseTimeoutRef.current = null;
      setOpenDropdown(null);
    }, 85);
  };

  const resolveManagedNavPath = (pathRef, fallback = '/') => {
    const resolved = resolveManagedPathFromRef(pathRef, pathRef);
    return resolved || fallback;
  };
  const homePath = resolveManagedNavPath('/', '/');
  const searchPath = resolveManagedNavPath('/search', '/search');
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
    const measureDesktopLinksWidth = (links) => {
      if (!(links instanceof HTMLElement) || typeof document === 'undefined') {
        return 0;
      }

      const measurementShell = document.createElement('div');
      measurementShell.setAttribute('aria-hidden', 'true');
      measurementShell.style.position = 'absolute';
      measurementShell.style.left = '-99999px';
      measurementShell.style.top = '0';
      measurementShell.style.visibility = 'hidden';
      measurementShell.style.pointerEvents = 'none';
      measurementShell.style.width = 'max-content';
      measurementShell.style.maxWidth = 'none';
      measurementShell.style.overflow = 'visible';
      measurementShell.style.contain = 'layout style';

      const linksClone = links.cloneNode(true);
      if (!(linksClone instanceof HTMLElement)) {
        return 0;
      }

      linksClone.style.width = 'max-content';
      linksClone.style.maxWidth = 'none';
      linksClone.style.flex = '0 0 auto';
      linksClone.style.justifyContent = 'flex-start';

      measurementShell.appendChild(linksClone);
      document.body.appendChild(measurementShell);

      const measuredWidth = Math.ceil(
        linksClone.getBoundingClientRect().width
        || linksClone.scrollWidth
        || 0,
      );

      measurementShell.remove();
      return measuredWidth;
    };

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
      const linksWidth = measureDesktopLinksWidth(links);
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

  useEffect(() => () => {
    if (typeof window !== 'undefined' && navHoverCloseTimeoutRef.current !== null) {
      window.clearTimeout(navHoverCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    closeNavMenus();
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let rafId = 0;
    const syncNavHeight = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const navHeight = Math.max(0, Math.round(navRef.current?.getBoundingClientRect().height || 0));
        document.documentElement.style.setProperty('--ag-site-nav-height', `${navHeight}px`);
      });
    };

    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);

    let observer = null;
    if (typeof ResizeObserver === 'function' && navRef.current) {
      observer = new ResizeObserver(syncNavHeight);
      observer.observe(navRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncNavHeight);
      observer?.disconnect();
    };
  }, [forceCompactNav, location.pathname, menuOpen, openDropdown]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(CONTENT_WIDTH_OVERLAY_STORAGE_KEY, String(contentWidthOverlayEnabled));
    } catch {
      // Local storage can be blocked in some contexts; ignore persistence failure.
    }
  }, [contentWidthOverlayEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FRONT_HUD_ENABLED_STORAGE_KEY, String(frontHudEnabled));
    } catch {
      // Local storage can be blocked in some contexts; ignore persistence failure.
    }
  }, [frontHudEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FRONT_HUD_OPACITY_STORAGE_KEY, String(frontHudOpacity));
    } catch {
      // Local storage can be blocked in some contexts; ignore persistence failure.
    }
  }, [frontHudOpacity]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FRONT_HUD_DIM_STRENGTH_STORAGE_KEY, String(frontHudDimStrength));
    } catch {
      // Local storage can be blocked in some contexts; ignore persistence failure.
    }
  }, [frontHudDimStrength]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const opacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
    const dimStrengthRatio = clampFrontHudDimStrength(frontHudDimStrength) / 100;
    document.documentElement.style.setProperty('--ag-admin-front-hud-opacity', String(opacityRatio));
    document.documentElement.style.setProperty('--ag-admin-front-hud-dim-strength', String(dimStrengthRatio));
  }, [frontHudEnabled, frontHudOpacity, frontHudDimStrength]);

  useEffect(() => {
    frontHudEnabledRef.current = frontHudEnabled;
  }, [frontHudEnabled]);

  useEffect(() => {
    const previousEnabled = previousFrontHudEnabledRef.current;
    if (!previousEnabled && frontHudEnabled) {
      setFrontHudRevealToken((current) => current + 1);
    }
    previousFrontHudEnabledRef.current = frontHudEnabled;
  }, [frontHudEnabled]);

  useEffect(() => {
    if (!frontHudRevealToken || typeof window === 'undefined') {
      return undefined;
    }

    setIsFrontHudRevealing(true);
    const timeoutId = window.setTimeout(() => {
      setIsFrontHudRevealing(false);
    }, 680);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [frontHudRevealToken]);

  useEffect(() => {
    frontHudOpacityRef.current = frontHudOpacity;
  }, [frontHudOpacity]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const setHudEnabledImmediate = (nextEnabled) => {
      frontHudEnabledRef.current = Boolean(nextEnabled);
      setFrontHudEnabled(Boolean(nextEnabled));
    };

    const setHudOpacityImmediate = (nextOpacity) => {
      const clamped = clampFrontHudOpacity(nextOpacity);
      frontHudOpacityRef.current = clamped;
      setFrontHudOpacity(clamped);
      return clamped;
    };

    const onKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      const hasPrimaryMod = event.metaKey || event.ctrlKey;
      const isPrimaryBracketDown = hasPrimaryMod
        && (event.code === 'BracketLeft' || event.key === '[' || event.key === '{');
      const isPrimaryBracketUp = hasPrimaryMod
        && (event.code === 'BracketRight' || event.key === ']' || event.key === '}');
      const isFallbackDown = !hasPrimaryMod
        && event.altKey
        && event.shiftKey
        && event.code === 'ArrowDown';
      const isFallbackUp = !hasPrimaryMod
        && event.altKey
        && event.shiftKey
        && event.code === 'ArrowUp';
      if (isPrimaryBracketDown || isPrimaryBracketUp || isFallbackDown || isFallbackUp) {
        event.preventDefault();
        const shouldIncrease = isPrimaryBracketUp || isFallbackUp;
        const base = clampFrontHudOpacity(frontHudOpacityRef.current);
        const delta = shouldIncrease ? 5 : -5;
        setHudOpacityImmediate(base + delta);
        if (shouldIncrease && !frontHudEnabledRef.current) {
          setHudEnabledImmediate(true);
        }
        return;
      }
      if (event.repeat) {
        return;
      }
      const isBackslash = event.key === '\\'
        || event.key === '|'
        || event.code === 'Backslash'
        || event.code === 'IntlBackslash'
        || event.keyCode === 220
        || event.which === 220;
      if (!hasPrimaryMod || !isBackslash) {
        return;
      }
      event.preventDefault();
      if (frontHudEnabledRef.current) {
        setHudEnabledImmediate(false);
        return;
      }
      setHudEnabledImmediate(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function toggleDropdown(title) {
    setOpenDropdown((current) => (current === title ? null : title));
  }

  const handleNavItemSelect = () => {
    closeNavMenus();
  };

  const handleGroupFocus = (title) => {
    if (!isDesktop) {
      return;
    }
    cancelScheduledDropdownClose();
    setOpenDropdown(title);
  };

  const handleGroupBlur = (event) => {
    if (!isDesktop) {
      return;
    }
    const current = event.currentTarget;
    const related = event.relatedTarget;
    if (related instanceof Node && current.contains(related)) {
      return;
    }
    scheduleDropdownClose();
  };

  const handleGroupMouseLeave = (event) => {
    if (!isDesktop) {
      return;
    }
    const current = event.currentTarget;
    const related = event.relatedTarget;
    if (related instanceof Node && current.contains(related)) {
      return;
    }
  };

  const handleNavLinksMouseLeave = (event) => {
    if (!isDesktop) {
      return;
    }
    const current = event.currentTarget;
    const related = event.relatedTarget;
    if (related instanceof Node && current.contains(related)) {
      return;
    }
    scheduleDropdownClose();
  };

  return (
    <FrontHudContext.Provider
      value={{
        enabled: frontHudEnabled,
        opacity: clampFrontHudOpacity(frontHudOpacity),
        revealToken: frontHudRevealToken,
        setEnabled: setFrontHudEnabled,
        setOpacity: setFrontHudOpacity,
      }}
    >
      <div className="site-layout">
        <nav
          ref={navRef}
          className={`site-nav${forceCompactNav ? ' is-force-mobile' : ''}${isFrontHudRevealing ? ' is-front-hud-revealing' : ''}`}
          aria-label="Main navigation"
          onKeyDown={(event) => {
            if (event.key !== 'Escape') {
              return;
            }
            if (!menuOpen && !openDropdown) {
              return;
            }
            closeNavMenus();
          }}
        >
          <div ref={navInnerRef} className="site-nav-inner">
            <Link ref={brandRef} to={homePath} className="site-brand" aria-label="AGFinancial Home">
              <AnimatedBrandLogo />
            </Link>

            <button
              type="button"
              className="site-nav-toggle"
              aria-controls="site-nav-menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className={`site-nav-toggle-icon${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            <div id="site-nav-menu" className={`site-nav-menu${menuOpen ? ' is-open' : ''}`}>
              <div ref={navLinksRef} className="site-nav-links" onMouseLeave={handleNavLinksMouseLeave}>
                <div className="site-nav-links-primary">
                  {navSections.map((section) => {
                    const sectionId = getNavSectionId(section.title);
                    const dropdownId = `site-nav-dropdown-${sectionId}`;
                    const isSectionOpen = openDropdown === section.title;
                    return (
                    <div
                      key={section.title}
                      className={`site-nav-group${openDropdown === section.title ? ' is-open' : ''}`}
                      onMouseEnter={() => {
                        if (isDesktop) {
                          cancelScheduledDropdownClose();
                          setOpenDropdown(section.title);
                        }
                      }}
                      onMouseLeave={handleGroupMouseLeave}
                      onFocusCapture={() => handleGroupFocus(section.title)}
                      onBlurCapture={handleGroupBlur}
                    >
                      <div className="site-nav-group-head">
                        <button
                          type="button"
                          className="site-nav-group-link"
                          onClick={() => {
                            navigate(resolveManagedNavPath(section.rootPath || section.items[0]?.path, '/'));
                            handleNavItemSelect();
                          }}
                        >
                          {section.title}
                        </button>
                        <button
                          type="button"
                          className="site-nav-group-toggle"
                          aria-expanded={isSectionOpen}
                          aria-controls={dropdownId}
                          aria-label={`${isSectionOpen ? 'Collapse' : 'Expand'} ${section.title} menu`}
                          onClick={() => toggleDropdown(section.title)}
                        >
                          <svg className="site-nav-group-toggle-icon" viewBox="0 0 10 6" aria-hidden="true" focusable="false">
                            <path
                              d="M1 1l4 4 4-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <div id={dropdownId} className="site-nav-dropdown">
                        {section.items.map((item, index) => {
                          const itemPath = resolveManagedNavPath(item.path, '/');
                          return (
                            <NavLink
                              to={itemPath}
                              key={item.path}
                              className={navLinkClass}
                              style={{ '--site-nav-item-index': index }}
                              onClick={handleNavItemSelect}
                            >
                              {item.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
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
                  <NavLink to={searchPath} className="site-nav-link nav-search-link" aria-label="Search">
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
                        cancelScheduledDropdownClose();
                        setOpenDropdown('Admin');
                      }
                    }}
                    onMouseLeave={handleGroupMouseLeave}
                    onFocusCapture={() => handleGroupFocus('Admin')}
                    onBlurCapture={handleGroupBlur}
                  >
                    <div className="site-nav-group-head">
                      <button
                        type="button"
                        className="site-nav-group-link"
                        onClick={() => {
                          navigate('/admin/content');
                          handleNavItemSelect();
                        }}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        className="site-nav-group-toggle"
                        aria-expanded={openDropdown === 'Admin'}
                        aria-controls="site-nav-dropdown-admin"
                        aria-label={`${openDropdown === 'Admin' ? 'Collapse' : 'Expand'} Admin menu`}
                        onClick={() => toggleDropdown('Admin')}
                      >
                        <svg className="site-nav-group-toggle-icon" viewBox="0 0 10 6" aria-hidden="true" focusable="false">
                          <path
                            d="M1 1l4 4 4-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div id="site-nav-dropdown-admin" className="site-nav-dropdown">
                      {ADMIN_NAV_ITEMS.map((item, index) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={navLinkClass}
                          style={{ '--site-nav-item-index': index }}
                          onClick={handleNavItemSelect}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                      <div className="site-nav-admin-overlay-grid is-switches">
                        <div
                          className="site-nav-admin-overlay-row is-content-width is-switch-card"
                          role="group"
                          aria-label="Content width overlay"
                        >
                          <span className="site-nav-admin-overlay-label">Content Width Overlay</span>
                          <div className="site-nav-admin-overlay-selector" role="radiogroup" aria-label="Content width overlay toggle">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={!contentWidthOverlayEnabled}
                              className={`site-nav-admin-overlay-option${!contentWidthOverlayEnabled ? ' is-active' : ''}`}
                              onClick={() => setContentWidthOverlayEnabled(false)}
                            >
                              Off
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={contentWidthOverlayEnabled}
                              className={`site-nav-admin-overlay-option${contentWidthOverlayEnabled ? ' is-active' : ''}`}
                              onClick={() => setContentWidthOverlayEnabled(true)}
                            >
                              On
                            </button>
                          </div>
                        </div>
                        <div
                          className="site-nav-admin-overlay-row is-front-hud is-switch-card"
                          role="group"
                          aria-label="Front-end HUD overlay"
                        >
                          <span className="site-nav-admin-overlay-label">
                            Front-end HUD
                            <kbd className="site-nav-admin-overlay-hotkey">{isApplePlatform ? 'Cmd+\\' : 'Ctrl+\\'}</kbd>
                          </span>
                          <div className="site-nav-admin-overlay-selector" role="radiogroup" aria-label="Front-end HUD toggle">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={!frontHudEnabled}
                              className={`site-nav-admin-overlay-option${!frontHudEnabled ? ' is-active' : ''}`}
                              onClick={() => setFrontHudEnabled(false)}
                            >
                              Off
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={frontHudEnabled}
                              className={`site-nav-admin-overlay-option${frontHudEnabled ? ' is-active' : ''}`}
                              onClick={() => setFrontHudEnabled(true)}
                            >
                              On
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="site-nav-admin-overlay-grid is-sliders">
                        <label className="site-nav-admin-overlay-row site-nav-admin-overlay-slider is-front-hud-slider" htmlFor="frontHudOpacitySlider">
                          <div className="site-nav-admin-overlay-slider-head">
                            <span>Tool Opacity {clampFrontHudOpacity(frontHudOpacity)}%</span>
                            <kbd className="site-nav-admin-overlay-hotkey">
                              {isApplePlatform ? 'Cmd+[ / ]' : 'Ctrl+[ / ]'} or Alt+Shift+↑/↓
                            </kbd>
                          </div>
                          <input
                            id="frontHudOpacitySlider"
                            type="range"
                            min="5"
                            max="90"
                            step="1"
                            value={clampFrontHudOpacity(frontHudOpacity)}
                            onChange={(event) => {
                              setFrontHudOpacity(clampFrontHudOpacity(event.target.value));
                            }}
                          />
                        </label>
                        <label className="site-nav-admin-overlay-row site-nav-admin-overlay-slider is-front-hud-slider" htmlFor="frontHudDimStrengthSlider">
                          <div className="site-nav-admin-overlay-slider-head">
                            <span>Block Dim {clampFrontHudDimStrength(frontHudDimStrength)}%</span>
                          </div>
                          <input
                            id="frontHudDimStrengthSlider"
                            type="range"
                            min="0"
                            max="85"
                            step="1"
                            value={clampFrontHudDimStrength(frontHudDimStrength)}
                            onChange={(event) => {
                              setFrontHudDimStrength(clampFrontHudDimStrength(event.target.value));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {contentWidthOverlayEnabled && !isAdminRoute ? (
          <div className="admin-content-width-overlay" aria-hidden="true">
            <div className="admin-content-width-overlay-center" />
          </div>
        ) : null}

        <main className="app-main">
          <div className="app-main-shell">
            {children}
          </div>
        </main>
        {/* Mounted at layout scope so the utility can later share global site context without page-by-page wiring. */}
        {!isAdminRoute && !frontHudEnabled ? <SiteChatbotWindow /> : null}
        <SiteFooter />
      </div>
    </FrontHudContext.Provider>
  );
}
