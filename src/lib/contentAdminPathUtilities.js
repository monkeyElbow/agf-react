import { sitePages } from '../data/siteMap';

const RETIREMENT_403B_GROUP_ENROLLMENT_PATH = '/services/retirement/403b/403b-group-enrollment';
const PLANNED_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH = '/services/planned-giving/charitable-gift-annuities';
const PLANNED_GIVING_ENDOWMENTS_PATH = '/services/planned-giving/endowments';
const PLANNED_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/donor-advised-fund';
const PLANNED_GIVING_MINISTRY_IMPACT_FUND_PATH = '/services/planned-giving/ministry-impact-fund';

export const DEFAULT_MANAGED_PATH_ALIASES = Object.freeze({
  '/services/retirement/403b-for-groups/403b-group-enrollment': RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
  '/services/retirement/403b-for-groups': RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
  '/services/legacy-giving': '/services/planned-giving',
  '/services/legacy-giving/charitable-gift-annuities': PLANNED_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH,
  '/services/legacy-giving/charitable-trusts': '/services/planned-giving/charitable-trusts',
  '/services/legacy-giving/endowments': PLANNED_GIVING_ENDOWMENTS_PATH,
  '/services/planned-giving/generosity-fund': PLANNED_GIVING_GENEROSITY_FUND_PATH,
  '/services/legacy-giving/generosity-fund': PLANNED_GIVING_GENEROSITY_FUND_PATH,
  '/services/legacy-giving/ministry-impact-fund': PLANNED_GIVING_MINISTRY_IMPACT_FUND_PATH,
});

export function normalizeManagedPathInput(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }

  const withLeading = source.startsWith('/') ? source : `/${source}`;
  const compact = withLeading.replace(/\/{2,}/g, '/');
  if (compact.length > 1 && compact.endsWith('/')) {
    return compact.slice(0, -1);
  }
  return compact;
}

export function resolveAliasPath(pathname, aliases) {
  const start = normalizeManagedPathInput(pathname);
  if (!start) {
    return '';
  }
  const map = aliases && typeof aliases === 'object' ? aliases : {};
  let current = start;
  const seen = new Set();
  let guard = 0;

  while (map[current] && !seen.has(current) && guard < 40) {
    seen.add(current);
    current = normalizeManagedPathInput(map[current]);
    guard += 1;
  }

  return current || start;
}

export function normalizePathAliases(rawAliases, pageHierarchy) {
  const source = rawAliases && typeof rawAliases === 'object' ? rawAliases : {};
  const knownPaths = new Set(Object.keys(pageHierarchy || {}));
  const next = {};

  Object.entries(source).forEach(([fromRaw, toRaw]) => {
    const from = normalizeManagedPathInput(fromRaw);
    const to = normalizeManagedPathInput(toRaw);
    if (!from || !to || from === to || knownPaths.has(from)) {
      return;
    }
    next[from] = to;
  });

  const collapsed = {};
  Object.keys(next).forEach((from) => {
    const target = resolveAliasPath(next[from], next);
    if (!target || from === target) {
      return;
    }
    collapsed[from] = target;
  });

  return collapsed;
}

export function inferParentPath(pathname, pathSet) {
  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const candidate = `/${segments.join('/')}`;
    if (pathSet.has(candidate)) {
      return candidate;
    }
  }

  return pathSet.has('/') ? '/' : null;
}

export function buildDefaultPageHierarchy() {
  const pathSet = new Set(sitePages.map((page) => page.path));
  const byPath = {};

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }

    byPath[page.path] = {
      path: page.path,
      routeKey: page.path,
      linkRef: String(page.linkRef || page.path),
      title: page.title,
      breadcrumbLabel: page.title,
      parentPath: inferParentPath(page.path, pathSet),
      section: page.section,
      source: page.source,
      hideFromSitemap: Boolean(page.hideFromSitemap),
    };
  });

  return byPath;
}

export function buildBreadcrumbTrail(pathname, pageHierarchy) {
  const trail = [];
  const visited = new Set();
  let currentPath = pathname;

  while (currentPath && pageHierarchy[currentPath] && !visited.has(currentPath)) {
    visited.add(currentPath);
    const item = pageHierarchy[currentPath];
    trail.unshift({ path: item.path, label: item.breadcrumbLabel || item.title || item.path });
    currentPath = item.parentPath || null;
  }

  return trail;
}

export function isValidParent(pathname, parentPath, pageHierarchy) {
  if (!parentPath || parentPath === pathname) {
    return parentPath === null;
  }

  const seen = new Set();
  let cursor = parentPath;
  while (cursor && pageHierarchy[cursor] && !seen.has(cursor)) {
    if (cursor === pathname) {
      return false;
    }
    seen.add(cursor);
    cursor = pageHierarchy[cursor].parentPath;
  }

  return true;
}

export function toUniqueBlockId(baseId, existingBlocks) {
  const normalizedBase = String(baseId || 'block')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'block';
  const existingIds = new Set((Array.isArray(existingBlocks) ? existingBlocks : []).map((block) => String(block?.id || '')));
  if (!existingIds.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase}_${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}_${suffix}`;
  }
  return candidate;
}
