import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EDITOR_DRAFT_PUBLISHED_EVENT,
  LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS,
} from '../lib/contentAdminTiming';

function settingsValueEquals(left, right) {
  if (Object.is(left, right)) {
    return true;
  }
  if (
    left == null
    || right == null
    || typeof left !== 'object'
    || typeof right !== 'object'
  ) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function hasPatchValues(patch) {
  return Boolean(patch && typeof patch === 'object' && Object.keys(patch).length);
}

function cloneDraftPatchMap(source) {
  const next = {};
  Object.entries(source || {}).forEach(([blockId, patch]) => {
    if (!hasPatchValues(patch)) {
      return;
    }
    next[blockId] = {
      ...patch,
    };
  });
  return next;
}

function removePatchValue(source, blockId, settingKey) {
  const currentPatch = source?.[blockId];
  if (!hasPatchValues(currentPatch) || !Object.prototype.hasOwnProperty.call(currentPatch, settingKey)) {
    return source;
  }
  const next = {
    ...(source || {}),
  };
  const nextPatch = {
    ...currentPatch,
  };
  delete nextPatch[settingKey];
  if (Object.keys(nextPatch).length) {
    next[blockId] = nextPatch;
  } else {
    delete next[blockId];
  }
  return next;
}

function setPatchValue(source, blockId, settingKey, settingValue) {
  const currentPatch = source?.[blockId] || {};
  if (settingsValueEquals(currentPatch?.[settingKey], settingValue)) {
    return source || {};
  }
  return {
    ...(source || {}),
    [blockId]: {
      ...currentPatch,
      [settingKey]: settingValue,
    },
  };
}

function removeBlockPatch(source, blockId) {
  if (!source || !Object.prototype.hasOwnProperty.call(source, blockId)) {
    return source || {};
  }
  return Object.fromEntries(Object.entries(source).filter(([nextBlockId]) => nextBlockId !== blockId));
}

function appendUniqueSettingValue(values, nextValue) {
  const nextValues = Array.isArray(values) ? [...values] : [];
  if (!nextValues.some((value) => settingsValueEquals(value, nextValue))) {
    nextValues.push(nextValue);
  }
  return nextValues;
}

function protectionIncludesValue(protection, sourceValue) {
  const previousValues = Array.isArray(protection?.previousValues)
    ? protection.previousValues
    : [protection?.previousValue];
  return previousValues.some((value) => settingsValueEquals(sourceValue, value));
}

export function applyLocalBlockDrafts(blocks, draftsByBlockId) {
  const currentBlocks = Array.isArray(blocks) ? blocks : [];
  if (!draftsByBlockId || typeof draftsByBlockId !== 'object' || !Object.keys(draftsByBlockId).length) {
    return currentBlocks;
  }

  let changed = false;
  const nextBlocks = currentBlocks.map((block) => {
    const normalizedBlockId = String(block?.id || '').trim();
    const patch = draftsByBlockId[normalizedBlockId];
    if (!patch || typeof patch !== 'object' || !Object.keys(patch).length) {
      return block;
    }

    let nextSettings = block?.settings || {};
    let didChangeBlock = false;
    Object.entries(patch).forEach(([settingKey, settingValue]) => {
      if (settingsValueEquals(nextSettings?.[settingKey], settingValue)) {
        return;
      }
      if (!didChangeBlock) {
        nextSettings = {
          ...(block?.settings || {}),
        };
        didChangeBlock = true;
      }
      nextSettings[settingKey] = settingValue;
    });

    if (!didChangeBlock) {
      return block;
    }

    changed = true;
    return {
      ...block,
      settings: nextSettings,
    };
  });

  return changed ? nextBlocks : currentBlocks;
}

export default function useLocalBlockDrafts({
  pathname = '',
  blocks = [],
  claimBufferedBlockEdit = () => false,
  commitBlockSettingsPatch = () => false,
  registerExternalDraftFlushHandler = null,
  registerExternalDraftStatusHandler = null,
}) {
  const normalizedPath = String(pathname || '').trim();
  const [draftsByBlockId, setDraftsByBlockId] = useState({});
  const [settledDraftsByBlockId, setSettledDraftsByBlockId] = useState({});
  const draftsByBlockIdRef = useRef(draftsByBlockId);
  const settledDraftsByBlockIdRef = useRef(settledDraftsByBlockId);
  const blocksRef = useRef(blocks);
  const draftProtectionRef = useRef({});
  const commitTimersRef = useRef(new Map());
  const claimedBlockIdsRef = useRef(new Set());
  const flushHandlerIdRef = useRef(`local-draft:${Math.random().toString(36).slice(2, 10)}`);
  const flushAllDraftsRef = useRef(() => false);

  useEffect(() => {
    draftsByBlockIdRef.current = draftsByBlockId;
  }, [draftsByBlockId]);

  useEffect(() => {
    settledDraftsByBlockIdRef.current = settledDraftsByBlockId;
  }, [settledDraftsByBlockId]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const clearCommitTimer = useCallback((blockId) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!normalizedBlockId) {
      return;
    }
    const existingTimerId = commitTimersRef.current.get(normalizedBlockId);
    if (existingTimerId && typeof window !== 'undefined') {
      window.clearTimeout(existingTimerId);
    }
    commitTimersRef.current.delete(normalizedBlockId);
  }, []);

  const syncDraftStateFromRef = useCallback(() => {
    setDraftsByBlockId(draftsByBlockIdRef.current);
  }, []);

  const syncSettledDraftStateFromRef = useCallback(() => {
    setSettledDraftsByBlockId(settledDraftsByBlockIdRef.current);
  }, []);

  const commitDraftPatch = useCallback((blockId) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!normalizedPath || !normalizedBlockId) {
      return false;
    }
    const patch = draftsByBlockIdRef.current?.[normalizedBlockId];
    if (!patch || typeof patch !== 'object' || !Object.keys(patch).length) {
      clearCommitTimer(normalizedBlockId);
      return false;
    }
    clearCommitTimer(normalizedBlockId);
    return Boolean(commitBlockSettingsPatch(normalizedPath, normalizedBlockId, patch));
  }, [clearCommitTimer, commitBlockSettingsPatch, normalizedPath]);

  const flushAllDrafts = useCallback(() => {
    syncDraftStateFromRef();
    const draftEntries = draftsByBlockIdRef.current;
    if (!draftEntries || typeof draftEntries !== 'object') {
      return false;
    }
    let didFlushAny = false;
    let nextDrafts = cloneDraftPatchMap(draftEntries);
    let nextSettledDrafts = cloneDraftPatchMap(settledDraftsByBlockIdRef.current);
    Object.keys(draftEntries).forEach((blockId) => {
      if (commitDraftPatch(blockId)) {
        didFlushAny = true;
        nextDrafts = removeBlockPatch(nextDrafts, blockId);
        nextSettledDrafts = {
          ...nextSettledDrafts,
          [blockId]: {
            ...(nextSettledDrafts?.[blockId] || {}),
            ...(draftEntries?.[blockId] || {}),
          },
        };
      }
    });
    if (didFlushAny) {
      draftsByBlockIdRef.current = nextDrafts;
      settledDraftsByBlockIdRef.current = nextSettledDrafts;
      setDraftsByBlockId(nextDrafts);
      setSettledDraftsByBlockId(nextSettledDrafts);
    }
    return didFlushAny;
  }, [commitDraftPatch, syncDraftStateFromRef]);

  useEffect(() => {
    flushAllDraftsRef.current = flushAllDrafts;
  }, [flushAllDrafts]);

  const stageLocalBlockSettings = useCallback((blockId, settingsPatch) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!normalizedPath || !normalizedBlockId || !settingsPatch || typeof settingsPatch !== 'object') {
      return;
    }
    const normalizedPatchEntries = Object.entries(settingsPatch)
      .map(([settingKey, settingValue]) => [String(settingKey || '').trim(), settingValue])
      .filter(([settingKey]) => settingKey);
    if (!normalizedPatchEntries.length) {
      return;
    }

    if (!claimedBlockIdsRef.current.has(normalizedBlockId)) {
      claimBufferedBlockEdit(normalizedPath, normalizedBlockId);
      claimedBlockIdsRef.current.add(normalizedBlockId);
    }

    const previousDrafts = draftsByBlockIdRef.current || {};
    const previousDraft = previousDrafts?.[normalizedBlockId] || {};
    const nextDraft = {
      ...previousDraft,
    };
    let nextSettledDrafts = settledDraftsByBlockIdRef.current || {};
    const sourceBlock = (Array.isArray(blocksRef.current) ? blocksRef.current : [])
      .find((block) => String(block?.id || '').trim() === normalizedBlockId);
    const sourceSettings = sourceBlock?.settings || {};
    const previousProtection = draftProtectionRef.current?.[normalizedBlockId] || {};
    const nextProtection = {
      ...previousProtection,
    };

    normalizedPatchEntries.forEach(([settingKey, settingValue]) => {
      const previousVisibleValue = Object.prototype.hasOwnProperty.call(previousDraft, settingKey)
        ? previousDraft[settingKey]
        : Object.prototype.hasOwnProperty.call(nextSettledDrafts?.[normalizedBlockId] || {}, settingKey)
          ? nextSettledDrafts[normalizedBlockId][settingKey]
          : sourceSettings?.[settingKey];
      const previousProtectionValues = Array.isArray(previousProtection?.[settingKey]?.previousValues)
        ? previousProtection[settingKey].previousValues
        : [previousProtection?.[settingKey]?.previousValue].filter((value) => value !== undefined);
      nextDraft[settingKey] = settingValue;
      nextSettledDrafts = removePatchValue(nextSettledDrafts, normalizedBlockId, settingKey);
      nextProtection[settingKey] = {
        previousValues: appendUniqueSettingValue(
          appendUniqueSettingValue(previousProtectionValues, sourceSettings?.[settingKey]),
          previousVisibleValue,
        ),
      };
    });
    draftsByBlockIdRef.current = {
      ...previousDrafts,
      [normalizedBlockId]: nextDraft,
    };
    settledDraftsByBlockIdRef.current = nextSettledDrafts;
    draftProtectionRef.current = {
      ...draftProtectionRef.current,
      [normalizedBlockId]: nextProtection,
    };
    syncDraftStateFromRef();
    syncSettledDraftStateFromRef();

    clearCommitTimer(normalizedBlockId);
    if (typeof window !== 'undefined') {
      const timerId = window.setTimeout(() => {
        commitDraftPatch(normalizedBlockId);
      }, LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
      commitTimersRef.current.set(normalizedBlockId, timerId);
    }
  }, [claimBufferedBlockEdit, clearCommitTimer, commitDraftPatch, normalizedPath, syncDraftStateFromRef, syncSettledDraftStateFromRef]);

  const stageLocalBlockSetting = useCallback((blockId, settingKey, settingValue) => {
    const normalizedSettingKey = String(settingKey || '').trim();
    if (!normalizedSettingKey) {
      return;
    }
    stageLocalBlockSettings(blockId, {
      [normalizedSettingKey]: settingValue,
    });
  }, [stageLocalBlockSettings]);

  const mergedBlocks = useMemo(
    () => applyLocalBlockDrafts(applyLocalBlockDrafts(blocks, settledDraftsByBlockId), draftsByBlockId),
    [blocks, draftsByBlockId, settledDraftsByBlockId],
  );

  useEffect(() => {
    const blocksById = new Map(
      (Array.isArray(blocks) ? blocks : [])
        .map((block) => [String(block?.id || '').trim(), block]),
    );

    const previousDrafts = draftsByBlockIdRef.current || {};
    let nextDrafts = cloneDraftPatchMap(previousDrafts);
    let nextSettledDrafts = cloneDraftPatchMap(settledDraftsByBlockIdRef.current);
    let nextProtections = {
      ...(draftProtectionRef.current || {}),
    };

    Object.entries(previousDrafts || {}).forEach(([blockId, patch]) => {
      const block = blocksById.get(blockId);
      if (!block) {
        nextDrafts = removeBlockPatch(nextDrafts, blockId);
        nextSettledDrafts = removeBlockPatch(nextSettledDrafts, blockId);
        nextProtections = removeBlockPatch(nextProtections, blockId);
        clearCommitTimer(blockId);
        claimedBlockIdsRef.current.delete(blockId);
        return;
      }

      Object.entries(patch || {}).forEach(([settingKey, settingValue]) => {
        if (!settingsValueEquals(block?.settings?.[settingKey], settingValue)) {
          return;
        }
        nextDrafts = removePatchValue(nextDrafts, blockId, settingKey);
        nextSettledDrafts = setPatchValue(nextSettledDrafts, blockId, settingKey, settingValue);
      });

      if (!hasPatchValues(nextDrafts?.[blockId])) {
        clearCommitTimer(blockId);
        claimedBlockIdsRef.current.delete(blockId);
      }
    });

    Object.entries(nextSettledDrafts || {}).forEach(([blockId, patch]) => {
      const block = blocksById.get(blockId);
      if (!block) {
        nextSettledDrafts = removeBlockPatch(nextSettledDrafts, blockId);
        nextProtections = removeBlockPatch(nextProtections, blockId);
        return;
      }

      Object.entries(patch || {}).forEach(([settingKey, settledValue]) => {
        const protection = nextProtections?.[blockId]?.[settingKey];
        const sourceValue = block?.settings?.[settingKey];
        if (
          settingsValueEquals(sourceValue, settledValue)
          || protectionIncludesValue(protection, sourceValue)
        ) {
          return;
        }

        nextSettledDrafts = removePatchValue(nextSettledDrafts, blockId, settingKey);
        const blockProtections = {
          ...(nextProtections?.[blockId] || {}),
        };
        delete blockProtections[settingKey];
        if (Object.keys(blockProtections).length) {
          nextProtections = {
            ...nextProtections,
            [blockId]: blockProtections,
          };
        } else {
          nextProtections = removeBlockPatch(nextProtections, blockId);
        }
      });
    });

    const draftsChanged = JSON.stringify(nextDrafts) !== JSON.stringify(draftsByBlockIdRef.current || {});
    const settledChanged = JSON.stringify(nextSettledDrafts) !== JSON.stringify(settledDraftsByBlockIdRef.current || {});
    const protectionsChanged = JSON.stringify(nextProtections) !== JSON.stringify(draftProtectionRef.current || {});

    if (draftsChanged) {
      draftsByBlockIdRef.current = nextDrafts;
      setDraftsByBlockId(nextDrafts);
    }
    if (settledChanged) {
      settledDraftsByBlockIdRef.current = nextSettledDrafts;
      setSettledDraftsByBlockId(nextSettledDrafts);
    }
    if (protectionsChanged) {
      draftProtectionRef.current = nextProtections;
    }
  }, [blocks, clearCommitTimer]);

  useEffect(() => {
    if (typeof registerExternalDraftFlushHandler !== 'function') {
      return undefined;
    }
    return registerExternalDraftFlushHandler(flushHandlerIdRef.current, flushAllDrafts);
  }, [flushAllDrafts, registerExternalDraftFlushHandler]);

  useEffect(() => {
    if (typeof registerExternalDraftStatusHandler !== 'function') {
      return undefined;
    }
    return registerExternalDraftStatusHandler(flushHandlerIdRef.current, () => ({
      pathname: normalizedPath,
      hasPendingDrafts: Object.keys(draftsByBlockIdRef.current || {}).length > 0,
      pendingBlockIds: Object.keys(draftsByBlockIdRef.current || {}),
    }));
  }, [normalizedPath, registerExternalDraftStatusHandler]);

  useEffect(() => () => {
    flushAllDraftsRef.current();
    commitTimersRef.current.forEach((timerId) => {
      if (typeof window !== 'undefined' && timerId) {
        window.clearTimeout(timerId);
      }
    });
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    claimedBlockIdsRef.current.clear();
    commitTimersRef.current.forEach((timerId) => {
      if (typeof window !== 'undefined' && timerId) {
        window.clearTimeout(timerId);
      }
    });
    commitTimersRef.current.clear();
    draftsByBlockIdRef.current = {};
    settledDraftsByBlockIdRef.current = {};
    draftProtectionRef.current = {};
    setDraftsByBlockId({});
    setSettledDraftsByBlockId({});
  }, [normalizedPath]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePublishedDrafts = (event) => {
      const detail = event?.detail || {};
      const eventPathname = String(detail.pathname || '').trim();
      if (eventPathname && eventPathname !== normalizedPath) {
        return;
      }
      const publishedBlockIds = Array.isArray(detail.blockIds)
        ? detail.blockIds.map((blockId) => String(blockId || '').trim()).filter(Boolean)
        : [];
      const shouldClearBlock = (blockId) => (
        !publishedBlockIds.length || publishedBlockIds.includes(blockId)
      );
      const clearIds = new Set([
        ...Object.keys(draftsByBlockIdRef.current || {}),
        ...Object.keys(settledDraftsByBlockIdRef.current || {}),
        ...Object.keys(draftProtectionRef.current || {}),
      ].filter(shouldClearBlock));
      if (!clearIds.size) {
        return;
      }
      clearIds.forEach((blockId) => {
        clearCommitTimer(blockId);
        claimedBlockIdsRef.current.delete(blockId);
      });
      const removeSelectedBlocks = (source) => Object.fromEntries(
        Object.entries(source || {}).filter(([blockId]) => !clearIds.has(blockId)),
      );
      const nextDrafts = removeSelectedBlocks(draftsByBlockIdRef.current);
      const nextSettledDrafts = removeSelectedBlocks(settledDraftsByBlockIdRef.current);
      const nextProtections = removeSelectedBlocks(draftProtectionRef.current);
      draftsByBlockIdRef.current = nextDrafts;
      settledDraftsByBlockIdRef.current = nextSettledDrafts;
      draftProtectionRef.current = nextProtections;
      setDraftsByBlockId(nextDrafts);
      setSettledDraftsByBlockId(nextSettledDrafts);
    };

    window.addEventListener(EDITOR_DRAFT_PUBLISHED_EVENT, handlePublishedDrafts);
    return () => window.removeEventListener(EDITOR_DRAFT_PUBLISHED_EVENT, handlePublishedDrafts);
  }, [clearCommitTimer, normalizedPath]);

  return {
    blocks: mergedBlocks,
    stageLocalBlockSetting,
    stageLocalBlockSettings,
    flushAllDrafts,
    hasPendingDrafts: Object.keys(draftsByBlockId).length > 0,
  };
}
