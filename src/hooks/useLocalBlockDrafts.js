import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS } from '../context/ContentAdminContext';

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
}) {
  const normalizedPath = String(pathname || '').trim();
  const [draftsByBlockId, setDraftsByBlockId] = useState({});
  const draftsByBlockIdRef = useRef(draftsByBlockId);
  const commitTimersRef = useRef(new Map());
  const claimedBlockIdsRef = useRef(new Set());
  const flushHandlerIdRef = useRef(`local-draft:${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    draftsByBlockIdRef.current = draftsByBlockId;
  }, [draftsByBlockId]);

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
    Object.keys(draftEntries).forEach((blockId) => {
      if (commitDraftPatch(blockId)) {
        didFlushAny = true;
      }
    });
    return didFlushAny;
  }, [commitDraftPatch, syncDraftStateFromRef]);

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
    normalizedPatchEntries.forEach(([settingKey, settingValue]) => {
      nextDraft[settingKey] = settingValue;
    });
    draftsByBlockIdRef.current = {
      ...previousDrafts,
      [normalizedBlockId]: nextDraft,
    };
    syncDraftStateFromRef();

    clearCommitTimer(normalizedBlockId);
    if (typeof window !== 'undefined') {
      const timerId = window.setTimeout(() => {
        commitDraftPatch(normalizedBlockId);
      }, LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
      commitTimersRef.current.set(normalizedBlockId, timerId);
    }
  }, [claimBufferedBlockEdit, clearCommitTimer, commitDraftPatch, normalizedPath, syncDraftStateFromRef]);

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
    () => applyLocalBlockDrafts(blocks, draftsByBlockId),
    [blocks, draftsByBlockId],
  );

  useEffect(() => {
    const blocksById = new Map(
      (Array.isArray(blocks) ? blocks : [])
        .map((block) => [String(block?.id || '').trim(), block]),
    );

    setDraftsByBlockId((previous) => {
      let didChange = false;
      const nextDrafts = {};

      Object.entries(previous || {}).forEach(([blockId, patch]) => {
        const block = blocksById.get(blockId);
        if (!block) {
          didChange = true;
          clearCommitTimer(blockId);
          claimedBlockIdsRef.current.delete(blockId);
          return;
        }

        const nextPatch = Object.fromEntries(
          Object.entries(patch || {}).filter(([settingKey, settingValue]) => (
            !settingsValueEquals(block?.settings?.[settingKey], settingValue)
          )),
        );

        if (!Object.keys(nextPatch).length) {
          didChange = true;
          clearCommitTimer(blockId);
          claimedBlockIdsRef.current.delete(blockId);
          return;
        }

        if (Object.keys(nextPatch).length !== Object.keys(patch || {}).length) {
          didChange = true;
        }
        nextDrafts[blockId] = nextPatch;
      });

      return didChange ? nextDrafts : previous;
    });
  }, [blocks, clearCommitTimer]);

  useEffect(() => {
    if (typeof registerExternalDraftFlushHandler !== 'function') {
      return undefined;
    }
    return registerExternalDraftFlushHandler(flushHandlerIdRef.current, flushAllDrafts);
  }, [flushAllDrafts, registerExternalDraftFlushHandler]);

  useEffect(() => () => {
    flushAllDrafts();
    commitTimersRef.current.forEach((timerId) => {
      if (typeof window !== 'undefined' && timerId) {
        window.clearTimeout(timerId);
      }
    });
    commitTimersRef.current.clear();
  }, [flushAllDrafts]);

  useEffect(() => {
    claimedBlockIdsRef.current.clear();
  }, [normalizedPath]);

  return {
    blocks: mergedBlocks,
    stageLocalBlockSetting,
    stageLocalBlockSettings,
    flushAllDrafts,
    hasPendingDrafts: Object.keys(draftsByBlockId).length > 0,
  };
}
