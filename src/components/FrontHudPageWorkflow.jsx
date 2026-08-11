import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import '../styles/front-hud.css';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useFrontHud } from '../context/FrontHudContext';
import { PUBLISH_STATUS } from '../lib/contentAdminPublishing';

const HUD_WORKFLOW_SETTLED_STATUS_DELAY_MS = 1400;

function formatRelativeTime(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 45_000) {
    return 'just now';
  }

  const deltaMinutes = Math.round(deltaMs / 60_000);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMs / 3_600_000);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaMs / 86_400_000);
  if (deltaDays < 7) {
    return `${deltaDays}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

function summarizeSharedSaveResultForPath(saveResult, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!saveResult || !normalizedPath) {
    return null;
  }

  const blockedBlocks = (Array.isArray(saveResult.blockedBlocks) ? saveResult.blockedBlocks : [])
    .filter((entry) => String(entry?.pathname || '').trim() === normalizedPath);
  const savedBlockIds = Array.isArray(saveResult.savedBlockIdsByPath?.[normalizedPath])
    ? saveResult.savedBlockIdsByPath[normalizedPath]
    : [];
  const changedOnPath = Array.isArray(saveResult.changedPaths)
    ? saveResult.changedPaths.includes(normalizedPath)
    : false;
  if (!changedOnPath && !blockedBlocks.length && !savedBlockIds.length && !saveResult?.error) {
    return null;
  }

  return {
    error: String(saveResult?.error || '').trim(),
    status: String(saveResult?.status || '').trim(),
    updatedAt: Number(saveResult?.updatedAt) || 0,
    savedBlockIds,
    blockedBlocks,
  };
}

function summarizeSharedPublishResultForPath(publishResult, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!publishResult || !normalizedPath) {
    return null;
  }

  const blockedBlocks = (Array.isArray(publishResult.blockedBlocks) ? publishResult.blockedBlocks : [])
    .filter((entry) => String(entry?.pathname || '').trim() === normalizedPath);
  const publishedBlockIds = Array.isArray(publishResult.publishedBlockIdsByPath?.[normalizedPath])
    ? publishResult.publishedBlockIdsByPath[normalizedPath]
    : [];
  const changedOnPath = Array.isArray(publishResult.changedPaths)
    ? publishResult.changedPaths.includes(normalizedPath)
    : false;
  const publishedOnPath = Array.isArray(publishResult.publishedPaths)
    ? publishResult.publishedPaths.includes(normalizedPath)
    : false;
  if (!changedOnPath && !publishedOnPath && !blockedBlocks.length && !publishedBlockIds.length && !publishResult?.error) {
    return null;
  }

  return {
    error: String(publishResult?.error || '').trim(),
    status: String(publishResult?.status || '').trim(),
    updatedAt: Number(publishResult?.updatedAt) || 0,
    publishedBlockIds,
    blockedBlocks,
    hasOrderChanges: Boolean(publishResult?.hasOrderChangesByPath?.[normalizedPath]),
    hasPageMetaChanges: Boolean(publishResult?.hasPageMetaChangesByPath?.[normalizedPath]),
  };
}

function formatWorkflowScopeLabel(prefix, summary, emptyLabel, changedBlockCountOverride = null) {
  if (!summary?.hasUnsavedChanges) {
    return emptyLabel;
  }

  const parts = [];
  const changedBlockCount = changedBlockCountOverride == null
    ? Number(summary.changedBlockCount) || 0
    : Number(changedBlockCountOverride) || 0;
  if (changedBlockCount) {
    parts.push(`${changedBlockCount} block${changedBlockCount === 1 ? '' : 's'}`);
  }
  if (summary.hasOrderChanges) {
    parts.push('order');
  }
  if (summary.hasPageMetaChanges) {
    parts.push('page details');
  }
  return `${prefix} ${parts.join(', ')}`;
}

export default function FrontHudPageWorkflow({
  pathname = '',
  reviewHref = '',
  reviewLabel = 'Open page admin',
  placement = 'dock',
  isVisible = true,
  blockId = '',
  blockLabel = 'this block',
  ownership = null,
  onOwnershipAction = null,
  showBlockPublishAction = true,
  showBlockDiscardAction = true,
  onDoneEditing = null,
  doneEditingLabel = 'Done editing',
  isBillboardEditor = false,
  isLivePreview = false,
  onToggleLivePreview = null,
}) {
  const {
    isPageDirty = () => false,
    getPageChangeSummary = () => null,
    getPagePublishSummary = () => null,
    getPageWorkflowActivity = () => null,
    lastSharedSaveResult = null,
    lastSharedPublishResult = null,
    sharedPublishStatus = '',
    sharedSyncStatus = null,
    hasPendingExternalDrafts = () => false,
    saveSharedDraftNow = async () => ({ ok: false }),
    saveSharedBlockDraftNow = async () => ({ ok: false }),
    discardSharedPageDraft = async () => ({ ok: false }),
    discardSharedBlockDraft = async () => ({ ok: false }),
    publishSharedPageNow = async () => ({ ok: false }),
    publishSharedBlockNow = async () => ({ ok: false }),
  } = useContentAdmin() || {};
  const { revealToken = 0, setEnabled: setFrontHudEnabled = null } = useFrontHud() || {};
  const normalizedPath = String(pathname || '').trim();
  const normalizedBlockId = String(blockId || '').trim();
  const workflowRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isDiscardConfirming, setIsDiscardConfirming] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  // Track visibility during render so the first visible bar render already has its reveal class.
  const previousBarVisibilityRef = useRef(false);
  const revealCycleRef = useRef(0);
  if (placement === 'bar') {
    if (!isVisible) {
      previousBarVisibilityRef.current = false;
    } else if (!previousBarVisibilityRef.current) {
      previousBarVisibilityRef.current = true;
      revealCycleRef.current += 1;
    }
  }
  const [completedRevealKey, setCompletedRevealKey] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveOutcome, setSaveOutcome] = useState(null);
  const [publishError, setPublishError] = useState('');

  const changeSummary = normalizedPath
    ? (getPageChangeSummary(normalizedPath) || {})
    : {};
  const publishSummary = normalizedPath
    ? (getPagePublishSummary(normalizedPath) || {})
    : {};
  const workflowActivity = normalizedPath
    ? (getPageWorkflowActivity(normalizedPath) || {})
    : {};
  const pageDirty = normalizedPath ? Boolean(isPageDirty(normalizedPath)) : false;
  const hasPendingExternalDraftsOnPage = normalizedPath
    ? Boolean(hasPendingExternalDrafts(normalizedPath))
    : false;
  const hasPendingExternalDraftOnBlock = normalizedPath && normalizedBlockId
    ? Boolean(hasPendingExternalDrafts(normalizedPath, normalizedBlockId))
    : false;
  const pathSaveResult = useMemo(
    () => summarizeSharedSaveResultForPath(lastSharedSaveResult, normalizedPath),
    [lastSharedSaveResult, normalizedPath],
  );
  const pathPublishResult = useMemo(
    () => summarizeSharedPublishResultForPath(lastSharedPublishResult, normalizedPath),
    [lastSharedPublishResult, normalizedPath],
  );
  const changedBlockCount = Number(changeSummary?.changedBlockCount) || 0;
  const draftScopeLabel = formatWorkflowScopeLabel('Draft saves', changeSummary, 'Draft save clean');
  const syncPending = Boolean(sharedSyncStatus?.isPending);
  const hasPublishChanges = Boolean(publishSummary?.hasUnsavedChanges);
  const hasQueuedDraftSync = Boolean(sharedSyncStatus?.hasQueuedDraftSync);
  const isSharedWorkflowBusy = sharedPublishStatus === PUBLISH_STATUS.SAVING_DRAFT
    || sharedPublishStatus === PUBLISH_STATUS.PUBLISHING
    || sharedPublishStatus === PUBLISH_STATUS.VERIFYING
    || sharedPublishStatus === PUBLISH_STATUS.STATUS_UNKNOWN;
  const hasUnpublishedChanges = Boolean(
    (normalizedBlockId ? (pageDirty || hasPendingExternalDraftOnBlock) : pageDirty)
    || (normalizedBlockId ? hasPendingExternalDraftOnBlock : hasPendingExternalDraftsOnPage)
    || hasPublishChanges
    || isSaving
    || syncPending
    || hasQueuedDraftSync,
  );
  const hasDraftActivitySignal = hasUnpublishedChanges;
  const [showSettledStatus, setShowSettledStatus] = useState(() => !hasDraftActivitySignal);
  const shouldUseCalmDraftPresentation = !showSettledStatus && !saveError && !pathSaveResult?.error;

  useEffect(() => {
    if (hasDraftActivitySignal) {
      setShowSettledStatus(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSettledStatus(true);
    }, HUD_WORKFLOW_SETTLED_STATUS_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasDraftActivitySignal]);

  useEffect(() => {
    if (!saveOutcome || saveOutcome.status !== 'saved') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveOutcome(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveOutcome]);

  const saveWasAcknowledged = saveOutcome?.status === 'saved' && !isSaving;
  const hasLocalDraftBuffer = hasPendingExternalDraftsOnPage;

  const saveFeedbackLabel = saveError
    ? saveError
    : pathSaveResult?.status === 'failed'
      ? 'Draft save failed; local changes are still here'
    : pathSaveResult?.status === 'partially-saved'
      ? `Saved ${pathSaveResult.savedBlockIds.length} block${pathSaveResult.savedBlockIds.length === 1 ? '' : 's'}; ${pathSaveResult.blockedBlocks.length} needs attention`
    : pathSaveResult?.status === 'blocked'
      ? 'Draft save blocked; resolve ownership to continue'
    : pathSaveResult?.status === 'discarded'
      ? 'Unpublished changes discarded; live content unchanged'
    : saveWasAcknowledged
      ? `Draft saved to shared content${saveOutcome.updatedAt ? ` ${formatRelativeTime(saveOutcome.updatedAt)}` : ''}`
    : hasLocalDraftBuffer
      ? 'In browser memory; not saved as a system draft yet.'
    : syncPending || hasQueuedDraftSync || isSaving
      ? 'Saving draft to shared content...'
    : pageDirty
      ? 'Draft changes ready to save.'
    : shouldUseCalmDraftPresentation
      ? 'Draft saved to shared content; confirming status...'
    : pathSaveResult?.error
      ? `Last save failed${pathSaveResult.updatedAt ? ` ${formatRelativeTime(pathSaveResult.updatedAt)}` : ''}`
      : hasUnpublishedChanges && pathSaveResult?.updatedAt
        ? `Draft saved to shared content${pathSaveResult.updatedAt ? ` ${formatRelativeTime(pathSaveResult.updatedAt)}` : ''}`
        : hasUnpublishedChanges && sharedSyncStatus?.lastAppliedAt
          ? `Draft synced to shared content ${formatRelativeTime(sharedSyncStatus.lastAppliedAt)}`
          : 'Live content is current.';
  const publishFeedbackLabel = publishError
    ? publishError
    : sharedPublishStatus === PUBLISH_STATUS.SAVING_DRAFT
      ? 'Saving draft before live publish...'
    : sharedPublishStatus === 'STATUS_UNKNOWN'
      ? 'Publish status unknown; verifying before retrying'
    : sharedPublishStatus === 'VERIFYING'
      ? 'Verifying live publish...'
    : sharedPublishStatus === 'PUBLISHING'
      ? 'Publishing live content...'
    : pathPublishResult?.status === 'failed'
      ? 'Live publish failed; draft content was preserved'
    : pathPublishResult?.status === 'partially-published'
      ? `Published ${pathPublishResult.publishedBlockIds.length} block${pathPublishResult.publishedBlockIds.length === 1 ? '' : 's'}; ${pathPublishResult.blockedBlocks.length} blocked`
      : pathPublishResult?.status === 'blocked'
        ? 'Live publish blocked; resolve ownership to continue'
    : pathPublishResult?.error === 'publish-blocked-by-other-draft'
      ? `Live publish blocked${pathPublishResult.updatedAt ? ` ${formatRelativeTime(pathPublishResult.updatedAt)}` : ''}`
      : pathPublishResult?.error === 'already-live'
        ? 'Already live'
        : pathPublishResult?.error
          ? `Last publish failed${pathPublishResult.updatedAt ? ` ${formatRelativeTime(pathPublishResult.updatedAt)}` : ''}`
          : pathPublishResult?.updatedAt
            ? 'Live publish complete'
            : 'Live site has not been updated by Make live';
  const saveActivityLabel = hasUnpublishedChanges && pathSaveResult?.updatedAt
    ? `Last draft save ${formatRelativeTime(pathSaveResult.updatedAt)}`
    : '';
  const publishActivityLabel = pathPublishResult?.updatedAt
    ? `Last live publish ${formatRelativeTime(pathPublishResult.updatedAt)}`
    : '';
  const draftSyncLabel = hasUnpublishedChanges && (syncPending || hasQueuedDraftSync)
    ? 'Saving draft to shared content...'
    : hasUnpublishedChanges && sharedSyncStatus?.lastSettledAt
      ? 'Draft sync complete'
      : hasUnpublishedChanges && sharedSyncStatus?.lastAppliedAt
        ? 'Draft synced to shared content'
      : 'Live content is current';
  const syncActivityLabel = hasUnpublishedChanges && sharedSyncStatus?.lastSettledAt
    ? `Draft sync completed ${formatRelativeTime(sharedSyncStatus.lastSettledAt)}`
    : hasUnpublishedChanges && sharedSyncStatus?.lastAppliedAt
      ? `Draft synced to shared content ${formatRelativeTime(sharedSyncStatus.lastAppliedAt)}`
      : '';
  const headline = saveError || pathSaveResult?.error || pathSaveResult?.status === 'blocked' || pathSaveResult?.status === 'failed'
    ? 'Unpublished changes'
    : pathSaveResult?.status === 'partially-saved'
      ? 'Partially saved'
    : hasLocalDraftBuffer
      ? 'Editing locally'
    : syncPending || hasQueuedDraftSync || isSaving
      ? 'Saving draft'
    : pageDirty
      ? 'Draft ready to save'
    : shouldUseCalmDraftPresentation
      ? 'Confirming draft save'
    : hasPublishChanges
      ? 'Draft saved'
        : 'Live';
  const statusToneClassName = saveError || pathSaveResult?.error || pathSaveResult?.status === 'failed'
    ? 'is-error'
    : hasLocalDraftBuffer || syncPending || hasQueuedDraftSync || pageDirty || hasPublishChanges || isSaving || shouldUseCalmDraftPresentation
      ? 'is-dirty'
      : 'is-saved';
  const draftMarkerToneClassName = saveError || pathSaveResult?.error || pathSaveResult?.status === 'failed'
    ? 'is-error'
    : hasUnpublishedChanges || shouldUseCalmDraftPresentation
      ? 'is-amber'
      : pathSaveResult?.updatedAt
        ? 'is-green'
        : 'is-green';
  const syncMarkerToneClassName = saveError || pathSaveResult?.error || publishError || (pathPublishResult?.error && pathPublishResult.error !== 'already-live')
    ? 'is-error'
    : hasUnpublishedChanges || shouldUseCalmDraftPresentation
      ? 'is-amber'
      : 'is-green';

  const hasWorkflowOwnershipSignal = typeof workflowActivity?.hasCurrentActorDraft === 'boolean';
  const hasBlockDraft = normalizedBlockId
    ? Boolean(
      publishSummary?.changedBlockIds?.includes(normalizedBlockId)
      || changeSummary?.changedBlockIds?.includes(normalizedBlockId)
      || workflowActivity?.currentActorBlockIds?.includes(normalizedBlockId)
      || hasPendingExternalDraftOnBlock,
    )
    : false;
  const canShowDraftActionsForCurrentActor = hasWorkflowOwnershipSignal
    ? !workflowActivity?.hasOtherActorDraft
    : true;
  const showDraftActions = normalizedBlockId
    ? hasBlockDraft || canShowDraftActionsForCurrentActor
    : placement === 'bar'
    ? true
    : hasWorkflowOwnershipSignal
    ? canShowDraftActionsForCurrentActor
    : true;
  const publishBlockedByOtherDraft = normalizedBlockId
    ? Boolean(workflowActivity?.otherActorBlocks?.some((entry) => entry.blockId === normalizedBlockId))
    : Boolean(workflowActivity?.hasOtherActorDraft);
  const foreignPublishBlockIds = new Set(
    (Array.isArray(workflowActivity?.otherActorBlocks) ? workflowActivity.otherActorBlocks : [])
      .map((entry) => String(entry?.blockId || '').trim())
      .filter(Boolean),
  );
  const publishablePageBlockIds = (Array.isArray(publishSummary?.changedBlockIds) ? publishSummary.changedBlockIds : [])
    .filter((blockId) => !foreignPublishBlockIds.has(String(blockId || '').trim()));
  const canPartiallyPublishPage = Boolean(
    !normalizedBlockId
    && publishBlockedByOtherDraft
    && (!publishSummary?.hasOrderChanges || publishSummary?.isDeletionOnlyOrderChange)
    && !publishSummary?.hasPageMetaChanges
    && publishablePageBlockIds.length,
  );
  const publishScopeLabel = formatWorkflowScopeLabel(
    'Make live publishes',
    publishSummary,
    'Already live',
    canPartiallyPublishPage ? publishablePageBlockIds.length : null,
  );
  const metaItems = [
    hasUnpublishedChanges ? draftScopeLabel : '',
    publishScopeLabel,
    changeSummary?.hasOrderChanges ? 'Order changed' : '',
    changeSummary?.hasPageMetaChanges ? 'Page details changed' : '',
    workflowActivity?.otherActorBlockCount
      ? `${workflowActivity.otherActorBlockCount} other-admin block${workflowActivity.otherActorBlockCount === 1 ? '' : 's'}`
      : '',
    pathSaveResult?.blockedBlocks?.length
      ? `${pathSaveResult.blockedBlocks.length} conflict${pathSaveResult.blockedBlocks.length === 1 ? '' : 's'}`
      : '',
    pathPublishResult?.blockedBlocks?.length
      ? `${pathPublishResult.blockedBlocks.length} publish block${pathPublishResult.blockedBlocks.length === 1 ? '' : 's'}`
      : '',
    syncPending || hasQueuedDraftSync ? 'Draft sync pending' : '',
  ].filter(Boolean);
  const activityItems = [saveActivityLabel, publishActivityLabel, syncActivityLabel].filter(Boolean);
  const hasBlockPublishChanges = normalizedBlockId
    ? hasBlockDraft || publishSummary?.orderChangedBlockIds?.includes(normalizedBlockId)
    : hasPublishChanges;
  const hasUnsavedOwnershipMetadata = normalizedBlockId
    ? Boolean(workflowActivity?.currentActorUnsavedSaveBlockIds?.includes(normalizedBlockId))
    : Boolean(workflowActivity?.hasCurrentActorUnsavedSave);
  const hasBlockSaveChanges = normalizedBlockId
    ? hasBlockDraft || hasPendingExternalDraftOnBlock || hasUnsavedOwnershipMetadata
    : pageDirty || hasPendingExternalDraftsOnPage || hasUnsavedOwnershipMetadata;
  const canSaveDraft = showDraftActions
    && !isSaving
    && !isPublishing
    && !isSharedWorkflowBusy
    && hasBlockSaveChanges;
  const canDiscardDraft = showDraftActions
    && !isSaving
    && !isPublishing
    && !isDiscarding
    && !isSharedWorkflowBusy
    && (normalizedBlockId
      ? hasBlockPublishChanges || hasPendingExternalDraftOnBlock
      : pageDirty || hasPublishChanges || hasPendingExternalDraftsOnPage);
  const canMakeLive = showDraftActions
    && !isSaving
    && !isPublishing
    && !isDiscarding
    && !isSharedWorkflowBusy
    && (!publishBlockedByOtherDraft || canPartiallyPublishPage)
    && (normalizedBlockId
      ? hasBlockPublishChanges || hasPendingExternalDraftOnBlock
      : pageDirty || hasPublishChanges || hasPendingExternalDraftsOnPage);
  const makeLiveTitle = publishBlockedByOtherDraft
    ? canPartiallyPublishPage
      ? `Make live will publish ${publishablePageBlockIds.length} eligible block${publishablePageBlockIds.length === 1 ? '' : 's'}; ${workflowActivity.otherActorBlockCount || 1} other-admin block${workflowActivity.otherActorBlockCount === 1 ? '' : 's'} will remain draft.`
      : `${workflowActivity.otherActorBlockCount || 1} other-admin block${workflowActivity.otherActorBlockCount === 1 ? '' : 's'} must be resolved before making live.`
    : normalizedBlockId
      ? hasBlockPublishChanges || hasPendingExternalDraftOnBlock
        ? publishFeedbackLabel
        : 'This block is already live.'
      : hasPublishChanges || pageDirty || hasPendingExternalDraftsOnPage
        ? publishFeedbackLabel
        : 'This page is already live.';

  const canTakeOver = Boolean(
    typeof onOwnershipAction === 'function'
    && (ownership?.isOwnedByOther
      || ownership?.state === 'editing-other'
      || ownership?.state === 'drafted-other'),
  );
  const takeOverLabel = ownership?.state === 'drafted-other' ? 'Take over draft' : 'Take over edit';

  const handleTakeOver = async () => {
    if (!canTakeOver || isTakingOver) {
      return;
    }
    setIsTakingOver(true);
    setSaveError('');
    try {
      const result = await onOwnershipAction();
      const settledResult = result?.pending && typeof result.pending.then === 'function'
        ? await result.pending
        : result;
      if (result?.ok === false || settledResult?.ok === false) {
        setSaveError('Takeover failed; the other admin still owns this block.');
      }
    } catch {
      setSaveError('Takeover failed; the other admin still owns this block.');
    } finally {
      setIsTakingOver(false);
    }
  };

  const takeOverAction = canTakeOver ? (
    <button
      type="button"
      className="admin-front-hud-page-workflow-action is-secondary"
      onClick={handleTakeOver}
      disabled={isTakingOver}
      title="Take ownership of this block draft so you can edit and publish it."
    >
      {isTakingOver ? 'Taking over…' : takeOverLabel}
    </button>
  ) : null;

  const handleSaveDraft = async () => {
    if (!normalizedPath || !canSaveDraft) {
      return;
    }
    setSaveError('');
    setSaveOutcome(null);
    setIsSaving(true);
    try {
      const result = normalizedBlockId
        ? await saveSharedBlockDraftNow(normalizedPath, normalizedBlockId, 'HUD block draft save')
        : await saveSharedDraftNow('');
      if (result?.ok === false) {
        setSaveError(result?.reason === 'content-admin-request-timeout' ? 'Save timed out' : 'Save failed');
      } else {
        setSaveOutcome({
          status: 'saved',
          updatedAt: Number(result?.saveResult?.updatedAt || result?.snapshot?.updatedAt || Date.now()),
        });
      }
    } catch {
      setSaveError('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraftActionLabel = normalizedBlockId ? 'Save block draft' : 'Save all page drafts';

  const handleMakeLive = async () => {
    if (!normalizedPath || !canMakeLive) {
      return;
    }
    setPublishError('');
    setIsPublishing(true);
    try {
      const result = normalizedBlockId
        ? await publishSharedBlockNow(normalizedPath, normalizedBlockId, 'HUD block publish')
        : await publishSharedPageNow(normalizedPath, '');
      if (result?.ok === false) {
        if (result?.reason === 'publish-blocked-by-other-draft') {
          setPublishError('Live publish blocked');
        } else if (result?.reason === 'already-live') {
          setPublishError('Already live');
        } else if (result?.reason === 'content-admin-request-timeout') {
          setPublishError('Live publish timed out; draft was not confirmed live');
        } else if (result?.reason === 'save-before-publish-failed' || result?.reason === 'save-before-block-publish-failed') {
          setPublishError('Draft save failed before live publish');
        } else {
          setPublishError('Live publish failed');
        }
      }
    } catch {
      setPublishError('Live publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!normalizedPath || !canDiscardDraft) {
      return;
    }
    if (isBillboardEditor && !isDiscardConfirming) {
      setIsDiscardConfirming(true);
      return;
    }
    if (!isBillboardEditor && typeof window !== 'undefined') {
      const discardScopeLabel = normalizedBlockId ? blockLabel : normalizedPath;
      const discardDescription = normalizedBlockId
        ? `This restores only ${blockLabel} to its current published content. Other drafts on the page remain unchanged.`
        : 'This restores every unpublished block on the page to its current published content. Live content remains unchanged.';
      if (!window.confirm(`Discard unpublished changes for ${discardScopeLabel}? ${discardDescription}`)) {
        return;
      }
    }
    setSaveError('');
    setIsDiscarding(true);
    try {
      const result = normalizedBlockId
        ? await discardSharedBlockDraft(normalizedPath, normalizedBlockId, 'HUD block draft discard')
        : await discardSharedPageDraft(normalizedPath, 'HUD page draft discard');
      if (result?.ok === false) {
        setSaveError(result?.reason === 'discard-blocked-by-other-draft'
          ? 'Discard blocked by another admin draft'
          : 'Discard failed');
      }
    } catch {
      setSaveError('Discard failed');
    } finally {
      setIsDiscarding(false);
      setIsDiscardConfirming(false);
    }
  };

  const handleViewLive = () => {
    if (typeof onToggleLivePreview === 'function') {
      onToggleLivePreview(!isLivePreview);
      return;
    }
    setFrontHudEnabled?.(false);
  };

  const revealKey = `${revealCycleRef.current}:${revealToken}`;
  const isRevealing = placement === 'bar'
    && isVisible
    && completedRevealKey !== revealKey;

  useLayoutEffect(() => {
    if (!isRevealing || typeof window === 'undefined') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCompletedRevealKey(revealKey);
    }, 520);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRevealing, revealKey]);

  useLayoutEffect(() => {
    if (placement !== 'bar' || typeof window === 'undefined') {
      return undefined;
    }

    const workflowNode = workflowRef.current;
    const pageRoot = workflowNode?.closest('.is-front-hud-docked');
    if (!workflowNode || !pageRoot) {
      return undefined;
    }

    const syncWorkflowHeight = () => {
      pageRoot.style.setProperty(
        '--ag-admin-front-hud-workflow-height',
        `${Math.ceil(workflowNode.getBoundingClientRect().height)}px`,
      );
    };

    syncWorkflowHeight();
    window.addEventListener('resize', syncWorkflowHeight);
    const resizeObserver = typeof window.ResizeObserver === 'function'
      ? new window.ResizeObserver(syncWorkflowHeight)
      : null;
    resizeObserver?.observe(workflowNode);

    return () => {
      window.removeEventListener('resize', syncWorkflowHeight);
      resizeObserver?.disconnect();
      pageRoot.style.removeProperty('--ag-admin-front-hud-workflow-height');
    };
  }, [isVisible, placement]);

  if (placement === 'dock-inline') {
    if (!showDraftActions && !reviewHref && !onDoneEditing && !canTakeOver && !isBillboardEditor) {
      return null;
    }

    return (
      <div className={`admin-front-hud-page-workflow is-dock-inline is-editor-command-bar${isBillboardEditor ? ' is-billboard-command-bar' : ''}`} role="group" aria-label={isBillboardEditor ? 'Billboard editor commands' : 'Page workflow'}>
        <div className="admin-front-hud-page-workflow-command-group is-left">
          {onDoneEditing ? (
            <button type="button" className="admin-front-hud-page-workflow-action is-secondary" onClick={onDoneEditing}>
              {doneEditingLabel}
            </button>
          ) : null}
          {(typeof onToggleLivePreview === 'function' || typeof setFrontHudEnabled === 'function') ? (
            <button
              type="button"
              className={`admin-front-hud-page-workflow-action is-secondary${isLivePreview ? ' is-live-preview' : ''}`}
              aria-pressed={typeof onToggleLivePreview === 'function' ? isLivePreview : undefined}
              onClick={handleViewLive}
              title={typeof onToggleLivePreview === 'function'
                ? (isLivePreview
                  ? 'Return this block to its editable draft view.'
                  : 'Preview this block as currently published without closing the editor.')
                : 'Show the published page and close the editing HUD.'}
            >
              {typeof onToggleLivePreview === 'function'
                ? (isLivePreview ? 'Toggle view draft' : 'Toggle view live')
                : 'View live'}
            </button>
          ) : null}
          {takeOverAction}
        </div>
        <div className="admin-front-hud-page-workflow-command-group is-right">
          <span className={`admin-front-hud-page-workflow-save-state${saveError ? ' is-error' : ''}`} role="status" aria-live="polite">{saveFeedbackLabel}</span>
          {showDraftActions ? (
            <button type="button" className="admin-front-hud-page-workflow-action" onClick={handleSaveDraft} disabled={!canSaveDraft} title={saveFeedbackLabel}>
              {isSaving ? 'Saving…' : saveDraftActionLabel}
            </button>
          ) : null}
          {showBlockPublishAction && showDraftActions ? (
            <button type="button" className="admin-front-hud-page-workflow-action is-primary" onClick={handleMakeLive} disabled={!canMakeLive} title={makeLiveTitle}>
              {isPublishing ? 'Publishing…' : 'Make live'}
            </button>
          ) : null}
          {(showBlockDiscardAction || reviewHref) ? (
            <details className="admin-front-hud-page-workflow-overflow">
              <summary aria-label={`More ${isBillboardEditor ? 'Billboard editor' : 'HUD editor'} actions`} title="More actions">More</summary>
              <div className="admin-front-hud-page-workflow-overflow-menu">
                {showBlockDiscardAction ? (
                  <div className="admin-front-hud-page-workflow-overflow-item">
                    {isDiscardConfirming ? <span>{normalizedBlockId ? 'Discard this block draft?' : 'Discard page drafts?'}</span> : null}
                    <button
                      type="button"
                      className="admin-front-hud-page-workflow-action is-danger"
                      onClick={handleDiscardDraft}
                      disabled={!canDiscardDraft}
                      title={normalizedBlockId
                        ? 'Discard unpublished changes for this block only; other page drafts remain.'
                        : 'Discard all unpublished changes on this page; live content remains unchanged.'}
                    >
                      {isDiscarding ? 'Discarding…' : isDiscardConfirming ? 'Confirm discard' : normalizedBlockId ? 'Discard Block Draft' : 'Discard all page drafts'}
                    </button>
                    {isDiscardConfirming ? <button type="button" className="admin-front-hud-page-workflow-action is-secondary" onClick={() => setIsDiscardConfirming(false)}>Cancel</button> : null}
                  </div>
                ) : null}
                {reviewHref ? (
                  <a href={reviewHref} target="_blank" rel="noreferrer noopener" className="admin-front-hud-page-workflow-action is-secondary" aria-label={reviewLabel} title={reviewLabel}>Open admin</a>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section
      ref={workflowRef}
      className={`admin-front-hud-page-workflow${placement === 'bar' ? ' is-bar' : ''}${isRevealing ? ' is-revealing' : ''}${placement === 'bar' && !isVisible ? ' is-hidden' : ''}`}
      aria-label="Page workflow"
      aria-hidden={placement === 'bar' && !isVisible ? 'true' : undefined}
    >
      <div className="admin-front-hud-page-workflow-head">
        <div className="admin-front-hud-page-workflow-head-grid">
          <div
            className={`admin-front-hud-page-workflow-status ${statusToneClassName}`}
            aria-live="polite"
          >
            <span className="admin-front-hud-page-workflow-marker-label">
              <span className={`admin-front-hud-page-workflow-marker ${draftMarkerToneClassName}`} aria-hidden="true" />
              <span>{hasUnpublishedChanges ? 'Draft' : 'Live'}</span>
            </span>
            <strong>{headline}</strong>
            {saveFeedbackLabel !== headline ? <span>{saveFeedbackLabel}</span> : null}
          </div>
          <div className="admin-front-hud-page-workflow-sync">
            <span className="admin-front-hud-page-workflow-sync-label">
              <span className={`admin-front-hud-page-workflow-marker ${syncMarkerToneClassName}`} aria-hidden="true" />
              <span>Published site</span>
            </span>
            <span>{publishFeedbackLabel}</span>
            <span>{draftSyncLabel}</span>
          </div>
        </div>
      </div>
      {metaItems.length ? (
        <div className="admin-front-hud-page-workflow-meta">
          {metaItems.map((item) => (
            <span key={item} className="admin-front-hud-page-workflow-pill">{item}</span>
          ))}
        </div>
      ) : null}
      {activityItems.length && showSettledStatus ? (
        <details className="admin-front-hud-page-workflow-details">
          <summary>Activity</summary>
          <div className="admin-front-hud-page-workflow-details-copy">
            {activityItems.map((item) => <span key={item}>{item}</span>)}
          </div>
        </details>
      ) : null}
      <div className="admin-front-hud-page-workflow-actions">
        {takeOverAction}
        {showDraftActions ? (
          <>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action"
              onClick={handleSaveDraft}
              disabled={!canSaveDraft}
            >
              {isSaving ? 'Saving…' : saveDraftActionLabel}
            </button>
            {showBlockDiscardAction ? (
              <button
                type="button"
                className="admin-front-hud-page-workflow-action is-danger"
                onClick={handleDiscardDraft}
                disabled={!canDiscardDraft}
                title={normalizedBlockId
                  ? 'Discard unpublished changes for this block only; other page drafts remain.'
                  : 'Discard all unpublished changes on this page; live content remains unchanged.'}
              >
                {isDiscarding ? 'Discarding…' : normalizedBlockId ? 'Discard Block Draft' : 'Discard all page drafts'}
              </button>
            ) : null}
            {showBlockPublishAction ? (
              <button
                type="button"
                className="admin-front-hud-page-workflow-action is-secondary"
                onClick={handleMakeLive}
                disabled={!canMakeLive}
                title={makeLiveTitle}
              >
                {isPublishing ? 'Publishing…' : 'Make live'}
              </button>
            ) : null}
          </>
        ) : null}
        {reviewHref ? (
          <a
            href={reviewHref}
            target="_blank"
            rel="noreferrer noopener"
            className="admin-front-hud-page-workflow-action is-secondary"
          >
            {reviewLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
