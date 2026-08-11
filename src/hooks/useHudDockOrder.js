import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY_PREFIX = 'agf:front-hud:dock-order:';

function normalizePanelIds(ids) {
  const seen = new Set();
  return (Array.isArray(ids) ? ids : [])
    .map((id) => String(id || '').trim())
    .filter((id) => {
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
}

function arraysEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function readStoredOrder(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return normalizePanelIds(parsed);
  } catch {
    return [];
  }
}

function writeStoredOrder(storageKey, ids) {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizePanelIds(ids)));
  } catch {
    // Ignore storage write failures (private mode, quota, etc.)
  }
}

export function mergeCurrentPanelOrder(currentOrder, panelIds) {
  const normalizedCurrent = normalizePanelIds(currentOrder);
  const normalizedPanels = normalizePanelIds(panelIds);
  const persisted = normalizedCurrent.filter((id) => normalizedPanels.includes(id));
  const persistedSet = new Set(persisted);
  const merged = [...persisted];

  // Keep intentional user ordering, but place newly added panels around the
  // existing anchors according to the page's current block order.
  normalizedPanels.forEach((panelId, panelIndex) => {
    if (persistedSet.has(panelId)) {
      return;
    }
    const nextPersistedId = normalizedPanels
      .slice(panelIndex + 1)
      .find((candidateId) => persistedSet.has(candidateId));
    if (nextPersistedId) {
      merged.splice(merged.indexOf(nextPersistedId), 0, panelId);
      return;
    }
    merged.push(panelId);
  });

  return merged;
}

function resolveDropPosition(event) {
  const target = event?.currentTarget;
  if (!target || typeof target.getBoundingClientRect !== 'function') {
    return 'before';
  }
  const bounds = target.getBoundingClientRect();
  const pointerY = Number(event?.clientY);
  if (!Number.isFinite(pointerY)) {
    return 'before';
  }
  return pointerY > bounds.top + (bounds.height / 2) ? 'after' : 'before';
}

function moveIdToPosition(ids, fromId, toId, position = 'before') {
  const list = normalizePanelIds(ids);
  const fromIndex = list.indexOf(fromId);
  const toIndex = list.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return list;
  }

  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  const targetIndex = next.indexOf(toId);
  if (targetIndex < 0) {
    next.push(moved);
    return next;
  }

  const normalizedPosition = position === 'after' ? 'after' : 'before';
  const insertionIndex = normalizedPosition === 'after'
    ? targetIndex + 1
    : targetIndex;
  next.splice(insertionIndex, 0, moved);
  return next;
}

export default function useHudDockOrder({ panels, storageKey }) {
  const normalizedPanels = Array.isArray(panels) ? panels : [];
  const panelIds = useMemo(
    () => normalizePanelIds(normalizedPanels.map((panel) => panel?.id)),
    [normalizedPanels],
  );
  const panelIdsSignature = useMemo(
    () => panelIds.join('|'),
    [panelIds],
  );
  const storageToken = useMemo(() => {
    const suffix = String(storageKey || '').trim().toLowerCase();
    if (!suffix) {
      return '';
    }
    return `${STORAGE_KEY_PREFIX}${suffix}`;
  }, [storageKey]);
  const [orderedIds, setOrderedIds] = useState([]);
  const [isOrderHydrated, setIsOrderHydrated] = useState(false);
  const previousPanelIdsRef = useRef(panelIds);
  const [draggedPanelId, setDraggedPanelId] = useState('');
  const [dragOverPanelId, setDragOverPanelId] = useState('');
  const [dragOverPosition, setDragOverPosition] = useState('');

  useEffect(() => {
    setOrderedIds(readStoredOrder(storageToken));
    setIsOrderHydrated(true);
  }, [storageToken]);

  useEffect(() => {
    if (!isOrderHydrated) {
      return;
    }
    const previousPanelIds = previousPanelIdsRef.current;
    const hasSamePanelMembers = previousPanelIds.length === panelIds.length
      && previousPanelIds.every((id) => panelIds.includes(id));
    const pageOrderChanged = hasSamePanelMembers && !arraysEqual(previousPanelIds, panelIds);
    const currentOrder = pageOrderChanged ? panelIds : orderedIds;
    const merged = mergeCurrentPanelOrder(currentOrder, panelIds);
    previousPanelIdsRef.current = panelIds;
    if (arraysEqual(orderedIds, merged)) {
      return;
    }
    setOrderedIds(merged);
    writeStoredOrder(storageToken, merged);
  }, [isOrderHydrated, orderedIds, panelIds, panelIdsSignature, storageToken]);

  const orderedPanels = useMemo(() => {
    if (!normalizedPanels.length || !orderedIds.length) {
      return normalizedPanels;
    }
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    return [...normalizedPanels].sort((a, b) => {
      const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return 0;
    });
  }, [normalizedPanels, orderedIds]);

  const reorderPanels = (fromId, toId, position = 'before') => {
    if (!fromId || !toId || fromId === toId) {
      return;
    }
    setOrderedIds((current) => {
      const base = mergeCurrentPanelOrder(current, panelIds);
      const next = moveIdToPosition(base, fromId, toId, position);
      if (arraysEqual(base, next)) {
        return current;
      }
      writeStoredOrder(storageToken, next);
      return next;
    });
  };

  const getDockTabDragProps = (panelId) => {
    const normalizedPanelId = String(panelId || '').trim();
    return {
      draggable: true,
      onDragStart: (event) => {
        setDraggedPanelId(normalizedPanelId);
        setDragOverPanelId('');
        setDragOverPosition('');
        if (event?.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', normalizedPanelId);
        }
      },
      onDragEnter: (event) => {
        if (!draggedPanelId || draggedPanelId === normalizedPanelId) {
          return;
        }
        event.preventDefault();
        const position = resolveDropPosition(event);
        setDragOverPanelId(normalizedPanelId);
        setDragOverPosition(position);
      },
      onDragOver: (event) => {
        if (!draggedPanelId || draggedPanelId === normalizedPanelId) {
          return;
        }
        event.preventDefault();
        const position = resolveDropPosition(event);
        if (dragOverPanelId !== normalizedPanelId) {
          setDragOverPanelId(normalizedPanelId);
        }
        if (dragOverPosition !== position) {
          setDragOverPosition(position);
        }
        if (event?.dataTransfer) {
          event.dataTransfer.dropEffect = 'move';
        }
      },
      onDrop: (event) => {
        event.preventDefault();
        const droppedId = draggedPanelId || event?.dataTransfer?.getData('text/plain') || '';
        const position = resolveDropPosition(event);
        reorderPanels(String(droppedId || '').trim(), normalizedPanelId, position);
        setDraggedPanelId('');
        setDragOverPanelId('');
        setDragOverPosition('');
      },
      onDragEnd: () => {
        setDraggedPanelId('');
        setDragOverPanelId('');
        setDragOverPosition('');
      },
    };
  };

  return {
    orderedPanels,
    getDockTabDragProps,
    isPanelDragging: (panelId) => String(panelId || '').trim() === draggedPanelId,
    isPanelDragOver: (panelId) => {
      const normalizedPanelId = String(panelId || '').trim();
      return Boolean(
        draggedPanelId
        && normalizedPanelId
        && draggedPanelId !== normalizedPanelId
        && dragOverPanelId === normalizedPanelId,
      );
    },
    getPanelDropPosition: (panelId) => {
      const normalizedPanelId = String(panelId || '').trim();
      if (
        !draggedPanelId
        || !normalizedPanelId
        || draggedPanelId === normalizedPanelId
        || dragOverPanelId !== normalizedPanelId
      ) {
        return '';
      }
      return dragOverPosition === 'after' ? 'after' : 'before';
    },
    isDockDragging: Boolean(draggedPanelId),
  };
}
