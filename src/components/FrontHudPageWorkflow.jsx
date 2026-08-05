import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import '../styles/front-hud.css';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useFrontHud } from '../context/FrontHudContext';

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

function formatWorkflowScopeLabel(prefix, summary, emptyLabel) {
  if (!summary?.hasUnsavedChanges) {
    return emptyLabel;
  }

  const parts = [];
  if (summary.changedBlockCount) {
    parts.push(`${summary.changedBlockCount} block${summary.changedBlockCount === 1 ? '' : 's'}`);
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
}) {
  const {
    isPageDirty = () => false,
    getPageChangeSummary = () => null,
    getPagePublishSummary = () => null,
    getPageWorkflowActivity = () => null,
    lastSharedSaveResult = null,
    lastSharedPublishResult = null,
    sharedSyncStatus = null,
    hasPendingExternalDrafts = () => false,
    saveSharedDraftNow = async () => ({ ok: false }),
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
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
  const publishScopeLabel = formatWorkflowScopeLabel('Make live publishes', publishSummary, 'Already live');
  const syncPending = Boolean(sharedSyncStatus?.isPending);
  const hasDraftActivitySignal = pageDirty || hasPendingExternalDraftsOnPage || isSaving || syncPending;
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
      ? `Draft saved${saveOutcome.updatedAt ? ` ${formatRelativeTime(saveOutcome.updatedAt)}` : ''}`
    : pageDirty || hasPendingExternalDraftsOnPage || isSaving
      ? 'Changes stay local while you type.'
      : shouldUseCalmDraftPresentation
        ? 'Draft updates are settling in the background.'
    : pathSaveResult?.error
      ? `Last save failed${pathSaveResult.updatedAt ? ` ${formatRelativeTime(pathSaveResult.updatedAt)}` : ''}`
      : pathSaveResult?.updatedAt
        ? 'Draft saved'
        : 'No shared draft save yet';
  const publishFeedbackLabel = publishError
    ? publishError
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
            : 'Not live yet in dev authority';
  const saveActivityLabel = pathSaveResult?.updatedAt
    ? `Last draft save ${formatRelativeTime(pathSaveResult.updatedAt)}`
    : '';
  const publishActivityLabel = pathPublishResult?.updatedAt
    ? `Last live publish ${formatRelativeTime(pathPublishResult.updatedAt)}`
    : '';
  const liveSyncLabel = syncPending
    ? (pageDirty || isSaving || shouldUseCalmDraftPresentation
        ? 'Live sync catching up in the background.'
        : 'Live sync sending changes...')
    : sharedSyncStatus?.lastSettledAt
      ? 'Live sync ready'
      : sharedSyncStatus?.lastAppliedAt
        ? 'Live sync updated'
        : 'Live sync idle';
  const syncActivityLabel = sharedSyncStatus?.lastSettledAt
    ? `Live sync caught up ${formatRelativeTime(sharedSyncStatus.lastSettledAt)}`
    : sharedSyncStatus?.lastAppliedAt
      ? `Live sync updated ${formatRelativeTime(sharedSyncStatus.lastAppliedAt)}`
      : '';
  const headline = saveError || pathSaveResult?.error || pathSaveResult?.status === 'blocked' || pathSaveResult?.status === 'failed'
    ? 'Unpublished changes'
    : pathSaveResult?.status === 'partially-saved'
      ? 'Partially saved'
    : pageDirty || hasPendingExternalDraftsOnPage || isSaving
      ? 'Editing draft'
      : shouldUseCalmDraftPresentation
        ? 'Updating draft'
        : 'Draft saved';
  const statusToneClassName = saveError || pathSaveResult?.error || pathSaveResult?.status === 'failed'
    ? 'is-error'
    : pageDirty || hasPendingExternalDraftsOnPage || isSaving || shouldUseCalmDraftPresentation
      ? 'is-dirty'
      : 'is-saved';
  const draftMarkerToneClassName = saveError || pathSaveResult?.error || pathSaveResult?.status === 'failed'
    ? 'is-error'
    : pageDirty || hasPendingExternalDraftsOnPage || isSaving || shouldUseCalmDraftPresentation
      ? 'is-amber'
      : pathSaveResult?.updatedAt
        ? 'is-green'
        : 'is-green';
  const syncMarkerToneClassName = saveError || pathSaveResult?.error || publishError || (pathPublishResult?.error && pathPublishResult.error !== 'already-live')
    ? 'is-error'
    : syncPending || Boolean(publishSummary?.hasUnsavedChanges) || shouldUseCalmDraftPresentation
      ? 'is-amber'
      : 'is-green';

  const metaItems = [
    draftScopeLabel,
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
    syncPending ? 'Live sync pending' : '',
  ].filter(Boolean);
  const activityItems = [saveActivityLabel, publishActivityLabel, syncActivityLabel].filter(Boolean);
  const hasWorkflowOwnershipSignal = typeof workflowActivity?.hasCurrentActorDraft === 'boolean';
  const savedBlockIds = pathSaveResult?.savedBlockIds || [];
  const hasBlockDraft = normalizedBlockId
    ? Boolean(
      publishSummary?.changedBlockIds?.includes(normalizedBlockId)
      || changeSummary?.changedBlockIds?.includes(normalizedBlockId)
      || savedBlockIds.includes(normalizedBlockId)
      || workflowActivity?.currentActorBlockIds?.includes(normalizedBlockId),
    )
    : false;
  const showDraftActions = normalizedBlockId
    ? hasBlockDraft
    : hasWorkflowOwnershipSignal
    ? Boolean(workflowActivity.hasCurrentActorDraft)
    : true;
  const publishBlockedByOtherDraft = normalizedBlockId
    ? Boolean(workflowActivity?.otherActorBlocks?.some((entry) => entry.blockId === normalizedBlockId))
    : Boolean(workflowActivity?.hasOtherActorDraft);
  const hasPublishChanges = Boolean(publishSummary?.hasUnsavedChanges);
  const hasBlockPublishChanges = normalizedBlockId
    ? hasBlockDraft
    : hasPublishChanges;
  const canSaveDraft = showDraftActions && !isSaving && (pageDirty || hasPendingExternalDraftsOnPage);
  const canDiscardDraft = showDraftActions
    && !isSaving
    && !isPublishing
    && !isDiscarding
    && (normalizedBlockId
      ? hasBlockPublishChanges
      : pageDirty || hasPublishChanges || hasPendingExternalDraftsOnPage);
  const canMakeLive = showDraftActions
    && !isSaving
    && !isPublishing
    && !publishBlockedByOtherDraft
    && (normalizedBlockId
      ? hasBlockPublishChanges
      : pageDirty || hasPublishChanges || hasPendingExternalDraftsOnPage);
  const makeLiveTitle = publishBlockedByOtherDraft
    ? `${workflowActivity.otherActorBlockCount || 1} other-admin block${workflowActivity.otherActorBlockCount === 1 ? '' : 's'} must be resolved before making live.`
    : normalizedBlockId
      ? hasBlockPublishChanges
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
      if (result?.ok === false) {
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
      const result = await saveSharedDraftNow('');
      if (result?.ok === false) {
        setSaveError('Save failed');
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
    const discardScopeLabel = normalizedBlockId ? blockLabel : normalizedPath;
    const discardDescription = normalizedBlockId
      ? `This restores only ${blockLabel} to its current published content. Other drafts on the page remain unchanged.`
      : 'This restores every unpublished block on the page to its current published content. Live content remains unchanged.';
    if (typeof window !== 'undefined' && !window.confirm(
      `Discard unpublished changes for ${discardScopeLabel}? ${discardDescription}`,
    )) {
      return;
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
    }
  };

  useLayoutEffect(() => {
    if (placement !== 'bar' || !revealToken || typeof window === 'undefined') {
      return undefined;
    }

    setIsRevealing(true);
    const timeoutId = window.setTimeout(() => {
      setIsRevealing(false);
    }, 680);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [placement, revealToken]);

  if (placement === 'dock-inline') {
    if (!showDraftActions && !reviewHref && !onDoneEditing && !canTakeOver) {
      return null;
    }

    return (
      <div className="admin-front-hud-page-workflow is-dock-inline" role="group" aria-label="Page workflow">
        {onDoneEditing ? (
          <button
            type="button"
            className="admin-front-hud-page-workflow-action is-secondary"
            onClick={onDoneEditing}
          >
            {doneEditingLabel}
          </button>
        ) : null}
        {typeof setFrontHudEnabled === 'function' ? (
          <button
            type="button"
            className="admin-front-hud-page-workflow-action is-secondary"
            onClick={() => setFrontHudEnabled(false)}
            title="Show the published page and close the editing HUD."
          >
            View live
          </button>
        ) : null}
        {takeOverAction}
        {showDraftActions ? (
          <>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action"
              onClick={handleSaveDraft}
              disabled={!canSaveDraft}
              title={saveFeedbackLabel}
            >
              {isSaving ? 'Saving…' : 'Save draft'}
            </button>
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
          </>
        ) : null}
        {reviewHref ? (
          <a
            href={reviewHref}
            target="_blank"
            rel="noreferrer noopener"
            className="admin-front-hud-dock-link admin-front-hud-page-workflow-inline-link"
            aria-label={reviewLabel}
            title={reviewLabel}
          >
            <span aria-hidden="true">↗</span>
            <span>Open admin in new window</span>
          </a>
        ) : null}
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
              <span>Draft</span>
            </span>
            <strong>{headline}</strong>
            {saveFeedbackLabel !== headline ? <span>{saveFeedbackLabel}</span> : null}
          </div>
          <div className="admin-front-hud-page-workflow-sync">
            <span className="admin-front-hud-page-workflow-sync-label">
              <span className={`admin-front-hud-page-workflow-marker ${syncMarkerToneClassName}`} aria-hidden="true" />
              <span>Live sync</span>
            </span>
            <span>{publishFeedbackLabel}</span>
            <span>{liveSyncLabel}</span>
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
              {isSaving ? 'Saving…' : 'Save draft'}
            </button>
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
