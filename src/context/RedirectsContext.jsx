import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'agf-redirects-admin-v1';
const RedirectsContext = createContext(null);

const DEFAULT_RULE = {
  id: '',
  from: '',
  to: '',
  enabled: true,
  matchType: 'exact',
  statusCode: '302',
  preserveQuery: true,
  notes: '',
};

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function normalizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isExternalUrl(raw)) return raw;

  const [pathPart, hashPart = ''] = raw.split('#');
  const [pathnamePart, queryPart = ''] = pathPart.split('?');
  let pathname = pathnamePart.trim();
  if (!pathname) pathname = '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');

  const query = queryPart ? `?${queryPart}` : '';
  const hash = hashPart ? `#${hashPart}` : '';
  return `${pathname}${query}${hash}`;
}

function normalizeStatusCode(value) {
  const text = String(value || '302').trim();
  return text === '301' ? '301' : '302';
}

function normalizeMatchType(value) {
  const text = String(value || 'exact').trim();
  return text === 'prefix' ? 'prefix' : 'exact';
}

function normalizeRule(rule) {
  const safe = rule && typeof rule === 'object' ? rule : {};
  const id = String(safe.id || `redirect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return {
    ...DEFAULT_RULE,
    id,
    from: normalizePath(safe.from),
    to: normalizePath(safe.to),
    enabled: safe.enabled !== false,
    matchType: normalizeMatchType(safe.matchType),
    statusCode: normalizeStatusCode(safe.statusCode),
    preserveQuery: typeof safe.preserveQuery === 'boolean' ? safe.preserveQuery : DEFAULT_RULE.preserveQuery,
    notes: String(safe.notes || ''),
  };
}

function readInitialRedirects() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRule);
  } catch {
    return [];
  }
}

function stripPathQueryHash(value) {
  const normalized = normalizePath(value);
  if (!normalized || isExternalUrl(normalized)) return normalized;
  return normalized.split('?')[0].split('#')[0];
}

function appendQuery(url, queryString) {
  if (!queryString) return url;
  if (!url) return url;
  const query = String(queryString || '');
  if (!query.startsWith('?') || query === '?') return url;

  if (isExternalUrl(url)) {
    try {
      const parsed = new URL(url);
      const incoming = new URLSearchParams(query);
      incoming.forEach((value, key) => parsed.searchParams.append(key, value));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  const [beforeHash, hash = ''] = url.split('#');
  const separator = beforeHash.includes('?') ? '&' : '?';
  const next = `${beforeHash}${separator}${query.slice(1)}`;
  return hash ? `${next}#${hash}` : next;
}

function matchRule(rule, pathname) {
  const current = stripPathQueryHash(pathname);
  const source = stripPathQueryHash(rule.from);
  if (!current || !source || isExternalUrl(source)) return false;

  if (rule.matchType === 'prefix') {
    return current === source || current.startsWith(`${source}/`);
  }

  return current === source;
}

function buildResolvedTarget(rule, currentLocation) {
  const destination = rule.to;
  if (!destination) return null;
  const query = rule.preserveQuery ? (currentLocation?.search || '') : '';
  const finalTarget = appendQuery(destination, query);

  if (isExternalUrl(finalTarget)) {
    return {
      ruleId: rule.id,
      statusCode: rule.statusCode,
      external: true,
      to: finalTarget,
    };
  }

  const currentPath = stripPathQueryHash(currentLocation?.pathname || '');
  const targetPath = stripPathQueryHash(finalTarget);
  const samePath = currentPath && targetPath && currentPath === targetPath;
  const sameQuery = String(currentLocation?.search || '') === (finalTarget.includes('?')
    ? `?${finalTarget.split('?')[1].split('#')[0]}`
    : '');
  const sameHash = String(currentLocation?.hash || '') === (finalTarget.includes('#')
    ? `#${finalTarget.split('#')[1]}`
    : '');

  if (samePath && sameQuery && sameHash) {
    return null;
  }

  return {
    ruleId: rule.id,
    statusCode: rule.statusCode,
    external: false,
    to: finalTarget,
  };
}

export function RedirectsProvider({ children }) {
  const [redirectsState, setRedirectsState] = useState(readInitialRedirects);

  const value = useMemo(() => {
    const save = (next) => {
      const normalized = Array.isArray(next) ? next.map(normalizeRule) : [];
      setRedirectsState(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage failures
      }
      return normalized;
    };

    const createRedirect = (seed = {}) => {
      const created = normalizeRule({
        ...DEFAULT_RULE,
        id: `redirect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...seed,
      });
      save([...redirectsState, created]);
      return created.id;
    };

    const updateRedirect = (id, patch) => {
      if (!id) return;
      save(redirectsState.map((rule) => (rule.id === id ? normalizeRule({ ...rule, ...patch, id }) : rule)));
    };

    const deleteRedirect = (id) => {
      if (!id) return;
      save(redirectsState.filter((rule) => rule.id !== id));
    };

    const resetRedirects = () => {
      setRedirectsState([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
    };

    const resolveRedirect = (locationLike) => {
      const locationInput = locationLike && typeof locationLike === 'object'
        ? locationLike
        : { pathname: String(locationLike || ''), search: '', hash: '' };
      const pathname = stripPathQueryHash(locationInput.pathname);
      if (!pathname || pathname.startsWith('/admin')) return null;

      for (const rule of redirectsState) {
        if (!rule.enabled) continue;
        if (!rule.from || !rule.to) continue;
        if (!matchRule(rule, pathname)) continue;
        const resolved = buildResolvedTarget(rule, locationInput);
        if (resolved) return resolved;
      }
      return null;
    };

    return {
      redirects: redirectsState,
      createRedirect,
      updateRedirect,
      deleteRedirect,
      resetRedirects,
      resolveRedirect,
    };
  }, [redirectsState]);

  return <RedirectsContext.Provider value={value}>{children}</RedirectsContext.Provider>;
}

export function useRedirects() {
  const context = useContext(RedirectsContext);
  if (!context) {
    throw new Error('useRedirects must be used within RedirectsProvider');
  }
  return context;
}

export function normalizeRedirectPath(value) {
  return normalizePath(value);
}

