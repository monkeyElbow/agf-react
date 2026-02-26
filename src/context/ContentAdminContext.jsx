import { createContext, useContext, useMemo, useState } from 'react';
import { sitePages } from '../data/siteMap';
import { contentBlockBlueprintsByPath, genericPageBlockBlueprint } from '../data/contentBlockBlueprints';

const STORAGE_KEY = 'agf-content-admin-v1';
const ContentAdminContext = createContext(null);

function inferParentPath(pathname, pathSet) {
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

  if (pathSet.has('/')) {
    return '/';
  }

  return null;
}

function buildDefaultPageHierarchy() {
  const pathSet = new Set(sitePages.map((page) => page.path));
  const byPath = {};

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }

    byPath[page.path] = {
      path: page.path,
      title: page.title,
      breadcrumbLabel: page.title,
      parentPath: inferParentPath(page.path, pathSet),
      section: page.section,
      source: page.source,
    };
  });

  return byPath;
}

function buildDefaultBlocks() {
  const blocksByPath = {};

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }

    const blueprint = contentBlockBlueprintsByPath[page.path]
      || genericPageBlockBlueprint();

    blocksByPath[page.path] = blueprint.map((block) => ({
      ...block,
      settings: { ...(block.settings || {}) },
      editableFields: [...(block.editableFields || [])],
    }));
  });

  return blocksByPath;
}

function normalizeStoredConfig(payload) {
  const defaultHierarchy = buildDefaultPageHierarchy();
  const defaultBlocks = buildDefaultBlocks();

  if (!payload || typeof payload !== 'object') {
    return { pageHierarchy: defaultHierarchy, blocksByPath: defaultBlocks };
  }

  const pageHierarchy = { ...defaultHierarchy, ...(payload.pageHierarchy || {}) };
  const storedBlocksByPath = payload.blocksByPath || {};
  const blocksByPath = { ...defaultBlocks };

  Object.entries(storedBlocksByPath).forEach(([path, storedBlocks]) => {
    if (!Array.isArray(storedBlocks)) {
      return;
    }

    const defaultForPath = Array.isArray(defaultBlocks[path]) ? defaultBlocks[path] : [];
    const storedById = new Map(
      storedBlocks
        .filter((block) => block && typeof block === 'object' && block.id)
        .map((block) => [block.id, block]),
    );

    const mergedDefaults = defaultForPath.map((defaultBlock) => {
      const storedBlock = storedById.get(defaultBlock.id);
      if (!storedBlock) {
        return defaultBlock;
      }

      return {
        ...defaultBlock,
        ...storedBlock,
        settings: {
          ...(defaultBlock.settings || {}),
          ...(storedBlock.settings || {}),
        },
        // Field schema should come from the current blueprint so admin UI upgrades appear automatically.
        editableFields: defaultBlock.editableFields,
      };
    });

    const extraStoredBlocks = storedBlocks.filter((storedBlock) => (
      storedBlock
      && typeof storedBlock === 'object'
      && storedBlock.id
      && !defaultForPath.some((defaultBlock) => defaultBlock.id === storedBlock.id)
    ));

    blocksByPath[path] = [...mergedDefaults, ...extraStoredBlocks];
  });

  return { pageHierarchy, blocksByPath };
}

function readInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeStoredConfig(null);
    }
    return normalizeStoredConfig(JSON.parse(raw));
  } catch {
    return normalizeStoredConfig(null);
  }
}

function buildBreadcrumbTrail(pathname, pageHierarchy) {
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

function isValidParent(pathname, parentPath, pageHierarchy) {
  if (!parentPath || parentPath === pathname) {
    return parentPath === null;
  }

  // prevent parent cycle by walking upward from candidate parent
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

export function ContentAdminProvider({ children }) {
  const [state, setState] = useState(readInitialState);

  const value = useMemo(() => {
    const { pageHierarchy, blocksByPath } = state;

    const saveState = (nextStateOrUpdater) => {
      setState((prevState) => {
        const nextState = typeof nextStateOrUpdater === 'function'
          ? nextStateOrUpdater(prevState)
          : nextStateOrUpdater;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        } catch {
          // ignore storage failures
        }
        return nextState;
      });
    };

    const updatePageHierarchy = (pathname, patch) => {
      saveState((prevState) => {
        const prevHierarchy = prevState.pageHierarchy || {};
        if (!prevHierarchy[pathname]) {
          return prevState;
        }

        const nextPage = {
          ...prevHierarchy[pathname],
          ...patch,
        };

        const requestedParent = Object.prototype.hasOwnProperty.call(patch, 'parentPath')
          ? patch.parentPath
          : nextPage.parentPath;
        const normalizedParent = requestedParent || null;

        if (!isValidParent(pathname, normalizedParent, prevHierarchy)) {
          return prevState;
        }

        nextPage.parentPath = normalizedParent;

        return {
          ...prevState,
          pageHierarchy: {
            ...prevHierarchy,
            [pathname]: nextPage,
          },
        };
      });
    };

    const updateBlock = (pathname, blockId, patch) => {
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const nextBlocks = pageBlocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block));

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: nextBlocks,
          },
        };
      });
    };

    const updateBlockSetting = (pathname, blockId, settingKey, settingValue) => {
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const nextBlocks = pageBlocks.map((block) => {
          if (block.id !== blockId) {
            return block;
          }

          return {
            ...block,
            settings: {
              ...(block.settings || {}),
              [settingKey]: settingValue,
            },
          };
        });

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: nextBlocks,
          },
        };
      });
    };

    const resetContentAdmin = () => {
      const next = normalizeStoredConfig(null);
      saveState(next);
    };

    return {
      pageHierarchy,
      blocksByPath,
      updatePageHierarchy,
      updateBlock,
      updateBlockSetting,
      resetContentAdmin,
      getBreadcrumbTrail: (pathname) => buildBreadcrumbTrail(pathname, pageHierarchy),
    };
  }, [state]);

  return <ContentAdminContext.Provider value={value}>{children}</ContentAdminContext.Provider>;
}

export function useContentAdmin() {
  const context = useContext(ContentAdminContext);
  if (!context) {
    throw new Error('useContentAdmin must be used within ContentAdminProvider');
  }
  return context;
}
