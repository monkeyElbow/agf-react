const OWNERSHIP_FIELDS = Object.freeze([
  'draftedBy',
  'draftedAt',
  'savedBy',
  'savedAt',
  'lockedBy',
  'lockedAt',
]);

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sameValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function routeBlocks(state, pathname) {
  return Array.isArray(state?.blocksByPath?.[pathname]) ? state.blocksByPath[pathname] : [];
}

function routeAliases(state, pathname) {
  return Object.fromEntries(Object.entries(state?.pathAliases || {}).filter(([fromPath, toPath]) => (
    fromPath === pathname || toPath === pathname
  )));
}

function blockId(block) {
  return String(block?.id || '').trim();
}

function blockMap(blocks) {
  return new Map(blocks.map((block) => [blockId(block), block]).filter(([id]) => id));
}

function editableSettingFields(activeBlock, seedBlock) {
  const editableFields = [
    ...(Array.isArray(activeBlock?.editableFields) ? activeBlock.editableFields : []),
    ...(Array.isArray(seedBlock?.editableFields) ? seedBlock.editableFields : []),
  ]
    .map((field) => String(field?.id || '').trim())
    .filter(Boolean);

  if (editableFields.length) {
    return [...new Set(editableFields)].sort();
  }

  return [...new Set([
    ...Object.keys(activeBlock?.settings || {}),
    ...Object.keys(seedBlock?.settings || {}),
  ])].sort();
}

function addChange(changes, change) {
  changes.push({
    ...change,
    activeValue: cloneJson(change.activeValue),
    seedValue: cloneJson(change.seedValue),
  });
}

function compareStateSlice(changes, activeState, seedState, pathname, source) {
  const activeBlocks = routeBlocks(activeState, pathname);
  const seedBlocks = routeBlocks(seedState, pathname);
  const activeById = blockMap(activeBlocks);
  const seedById = blockMap(seedBlocks);
  const activeIds = activeBlocks.map(blockId).filter(Boolean);
  const seedIds = seedBlocks.map(blockId).filter(Boolean);

  activeIds.forEach((id, index) => {
    if (seedById.has(id)) {
      return;
    }
    addChange(changes, {
      route: pathname,
      source,
      type: 'block-added',
      blockId: id,
      field: 'block',
      activeValue: { index, block: activeById.get(id) },
      seedValue: null,
    });
  });

  seedIds.forEach((id, index) => {
    if (activeById.has(id)) {
      return;
    }
    addChange(changes, {
      route: pathname,
      source,
      type: 'block-removed',
      blockId: id,
      field: 'block',
      activeValue: null,
      seedValue: { index, block: seedById.get(id) },
    });
  });

  const seedIndexById = new Map(seedIds.map((id, index) => [id, index]));
  activeIds.forEach((id, index) => {
    if (!seedIndexById.has(id) || seedIndexById.get(id) === index) {
      return;
    }
    addChange(changes, {
      route: pathname,
      source,
      type: 'block-order-changed',
      blockId: id,
      field: 'order',
      activeValue: index,
      seedValue: seedIndexById.get(id),
    });
  });

  activeIds.filter((id) => seedById.has(id)).forEach((id) => {
    const activeBlock = activeById.get(id);
    const seedBlock = seedById.get(id);
    ['kind', 'mode'].forEach((field) => {
      if (String(activeBlock?.[field] || '') === String(seedBlock?.[field] || '')) {
        return;
      }
      addChange(changes, {
        route: pathname,
        source,
        type: 'block-shape-changed',
        blockId: id,
        field,
        activeValue: activeBlock?.[field] || null,
        seedValue: seedBlock?.[field] || null,
      });
    });

    editableSettingFields(activeBlock, seedBlock).forEach((field) => {
      const activeValue = activeBlock?.settings?.[field];
      const seedValue = seedBlock?.settings?.[field];
      if (sameValue(activeValue, seedValue)) {
        return;
      }
      addChange(changes, {
        route: pathname,
        source,
        type: 'editable-setting-changed',
        blockId: id,
        field: `settings.${field}`,
        activeValue,
        seedValue,
      });
    });

    const activeOwnership = activeState?.collaborationByPath?.[pathname]?.blocks?.[id] || {};
    const seedOwnership = seedState?.collaborationByPath?.[pathname]?.blocks?.[id] || {};
    OWNERSHIP_FIELDS.forEach((field) => {
      if (sameValue(activeOwnership[field], seedOwnership[field])) {
        return;
      }
      addChange(changes, {
        route: pathname,
        source,
        type: 'draft-ownership-changed',
        blockId: id,
        field: `collaboration.blocks.${id}.${field}`,
        activeValue: activeOwnership[field] ?? null,
        seedValue: seedOwnership[field] ?? null,
      });
    });
  });

  const activePage = activeState?.pageHierarchy?.[pathname] || null;
  const seedPage = seedState?.pageHierarchy?.[pathname] || null;
  [...new Set([...Object.keys(activePage || {}), ...Object.keys(seedPage || {})])].sort().forEach((field) => {
    if (sameValue(activePage?.[field], seedPage?.[field])) {
      return;
    }
    addChange(changes, {
      route: pathname,
      source,
      type: 'route-meta-changed',
      blockId: '__route__',
      field: `pageHierarchy.${field}`,
      activeValue: activePage?.[field] ?? null,
      seedValue: seedPage?.[field] ?? null,
    });
  });

  const activeAliases = routeAliases(activeState, pathname);
  const seedAliases = routeAliases(seedState, pathname);
  if (!sameValue(activeAliases, seedAliases)) {
    addChange(changes, {
      route: pathname,
      source,
      type: 'route-meta-changed',
      blockId: '__route__',
      field: 'pathAliases',
      activeValue: activeAliases,
      seedValue: seedAliases,
    });
  }
}

export function compareSeedRouteSlices({ activeState, baseSnapshot, seedState, pathnames }) {
  const routes = [...new Set((Array.isArray(pathnames) ? pathnames : [pathnames])
    .map((pathname) => String(pathname || '').trim())
    .filter(Boolean))];
  const changes = [];

  routes.forEach((pathname) => {
    compareStateSlice(changes, activeState, seedState, pathname, 'state');
    compareStateSlice(changes, baseSnapshot, seedState, pathname, 'baseSnapshot');
  });

  return {
    hasChanges: changes.length > 0,
    routes,
    changes,
    changedRoutes: [...new Set(changes.map((change) => change.route))],
  };
}

function displayValue(value) {
  if (value == null) {
    return '(missing)';
  }
  if (typeof value === 'string') {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  }
  const serialized = JSON.stringify(value);
  return serialized.length > 120 ? `${serialized.slice(0, 117)}...` : serialized;
}

export function formatSeedRouteSliceDiffReport(comparison) {
  if (!comparison?.changes?.length) {
    return 'No active route differences from seed.';
  }
  return comparison.changes.map((change) => (
    `${change.route} | ${change.source} | ${change.blockId} | ${change.field}: ${displayValue(change.activeValue)} -> ${displayValue(change.seedValue)}`
  )).join('\n');
}
