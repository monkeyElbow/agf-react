import { useEffect, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';

let workflowHeightResetTimeoutId = null;
const DEFAULT_BAR_HEIGHT_PX = 60;

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
}) {
  const {
    isPageDirty = () => false,
    getPageChangeSummary = () => null,
    getPagePublishSummary = () => null,
    getPageWorkflowActivity = () => null,
    lastSharedSaveResult = null,
    lastSharedPublishResult = null,
    sharedSyncStatus = null,
    saveSharedDraftNow = async () => ({ ok: false }),
    publishSharedPageNow = async () => ({ ok: false }),
  } = useContentAdmin() || {};
  const { revealToken = 0 } = useFrontHud() || {};
  const normalizedPath = String(pathname || '').trim();
  const workflowRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishError, setPublishError] = useState('');

  useInsertionEffect(() => {
    if (typeof window === 'undefined' || placement !== 'bar') {
      return undefined;
    }

    if (workflowHeightResetTimeoutId) {
      window.clearTimeout(workflowHeightResetTimeoutId);
      workflowHeightResetTimeoutId = null;
    }

    if (!document.documentElement.style.getPropertyValue('--ag-front-hud-page-workflow-height')) {
      document.documentElement.style.setProperty('--ag-front-hud-page-workflow-height', `${DEFAULT_BAR_HEIGHT_PX}px`);
    }

    return undefined;
  }, [placement, pathname]);

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
  const saveFeedbackLabel = saveError
    ? saveError
    : pathSaveResult?.error
      ? `Last save failed${pathSaveResult.updatedAt ? ` ${formatRelativeTime(pathSaveResult.updatedAt)}` : ''}`
      : pathSaveResult?.updatedAt
        ? `Last draft save ${formatRelativeTime(pathSaveResult.updatedAt)}`
        : 'No shared draft save yet';
  const publishFeedbackLabel = publishError
    ? publishError
    : pathPublishResult?.error === 'publish-blocked-by-other-draft'
      ? `Live publish blocked${pathPublishResult.updatedAt ? ` ${formatRelativeTime(pathPublishResult.updatedAt)}` : ''}`
      : pathPublishResult?.error === 'already-live'
        ? 'Already live'
        : pathPublishResult?.error
          ? `Last publish failed${pathPublishResult.updatedAt ? ` ${formatRelativeTime(pathPublishResult.updatedAt)}` : ''}`
          : pathPublishResult?.updatedAt
            ? `Last live publish ${formatRelativeTime(pathPublishResult.updatedAt)}`
            : 'Not live yet in dev authority';
  const syncPending = Boolean(sharedSyncStatus?.isPending);
  const liveSyncLabel = syncPending
    ? 'Live sync sending changes...'
    : sharedSyncStatus?.lastSettledAt
      ? `Live sync caught up ${formatRelativeTime(sharedSyncStatus.lastSettledAt)}`
      : sharedSyncStatus?.lastAppliedAt
        ? `Live sync updated ${formatRelativeTime(sharedSyncStatus.lastAppliedAt)}`
        : 'Live sync idle';
  const headline = pageDirty ? 'Unpublished changes' : 'Draft saved';
  const statusToneClassName = saveError || pathSaveResult?.error
    ? 'is-error'
    : pageDirty
      ? 'is-dirty'
      : 'is-saved';
  const draftMarkerToneClassName = saveError || pathSaveResult?.error
    ? 'is-error'
    : pageDirty
      ? 'is-red'
      : pathSaveResult?.updatedAt
        ? 'is-amber'
        : 'is-green';
  const syncMarkerToneClassName = saveError || pathSaveResult?.error || publishError || (pathPublishResult?.error && pathPublishResult.error !== 'already-live')
    ? 'is-error'
    : syncPending || Boolean(publishSummary?.hasUnsavedChanges)
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
  const hasWorkflowOwnershipSignal = typeof workflowActivity?.hasCurrentActorDraft === 'boolean';
  const showDraftActions = hasWorkflowOwnershipSignal
    ? Boolean(workflowActivity.hasCurrentActorDraft)
    : true;
  const publishBlockedByOtherDraft = Boolean(workflowActivity?.hasOtherActorDraft);
  const hasPublishChanges = Boolean(publishSummary?.hasUnsavedChanges);
  const canMakeLive = showDraftActions && !isSaving && !isPublishing && !publishBlockedByOtherDraft && (pageDirty || hasPublishChanges);
  const makeLiveTitle = publishBlockedByOtherDraft
    ? `${workflowActivity.otherActorBlockCount || 1} other-admin block${workflowActivity.otherActorBlockCount === 1 ? '' : 's'} must be resolved before making live.`
    : hasPublishChanges || pageDirty
      ? publishFeedbackLabel
      : 'This page is already live.';

  const handleSaveDraft = async () => {
    if (!normalizedPath || !pageDirty || isSaving) {
      return;
    }
    setSaveError('');
    setIsSaving(true);
    try {
      const result = await saveSharedDraftNow('');
      if (result?.ok === false) {
        setSaveError('Save failed');
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
      const result = await publishSharedPageNow(normalizedPath, '');
      if (result?.ok === false) {
        if (result?.reason === 'publish-blocked-by-other-draft') {
          setPublishError('Live publish blocked');
        } else if (result?.reason === 'already-live') {
          setPublishError('Already live');
        } else if (result?.reason === 'save-before-publish-failed') {
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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (workflowHeightResetTimeoutId) {
      window.clearTimeout(workflowHeightResetTimeoutId);
      workflowHeightResetTimeoutId = null;
    }

    if (placement !== 'bar') {
      document.documentElement.style.removeProperty('--ag-front-hud-page-workflow-height');
      return undefined;
    }

    let rafId = 0;
    const applyWorkflowHeight = () => {
      const measuredHeight = Math.max(0, Math.round(workflowRef.current?.getBoundingClientRect().height || 0));
      const height = Math.max(DEFAULT_BAR_HEIGHT_PX, measuredHeight);
      document.documentElement.style.setProperty('--ag-front-hud-page-workflow-height', `${height}px`);
    };
    const syncWorkflowHeight = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(applyWorkflowHeight);
    };

    applyWorkflowHeight();
    window.addEventListener('resize', syncWorkflowHeight);

    let observer = null;
    if (typeof ResizeObserver === 'function' && workflowRef.current) {
      observer = new ResizeObserver(syncWorkflowHeight);
      observer.observe(workflowRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncWorkflowHeight);
      observer?.disconnect();
      workflowHeightResetTimeoutId = window.setTimeout(() => {
        document.documentElement.style.removeProperty('--ag-front-hud-page-workflow-height');
        workflowHeightResetTimeoutId = null;
      }, 180);
    };
  }, [placement, pathname, pageDirty, saveError, liveSyncLabel, saveFeedbackLabel, metaItems.length]);

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
    if (!showDraftActions && !reviewHref) {
      return null;
    }

    return (
      <div className="admin-front-hud-page-workflow is-dock-inline" role="group" aria-label="Page workflow">
        {showDraftActions ? (
          <>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action"
              onClick={handleSaveDraft}
              disabled={!pageDirty || isSaving}
              title={saveFeedbackLabel}
            >
              {isSaving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action is-secondary"
              onClick={handleMakeLive}
              disabled={!canMakeLive}
              title={makeLiveTitle}
            >
              {isPublishing ? 'Publishing…' : 'Make live'}
            </button>
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
            <span className="admin-front-hud-visually-hidden">{reviewLabel}</span>
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <section
      ref={workflowRef}
      className={`admin-front-hud-page-workflow${placement === 'bar' ? ' is-bar' : ''}${isRevealing ? ' is-revealing' : ''}`}
      aria-label="Page workflow"
    >
      <div className="admin-front-hud-page-workflow-head">
        <div className="admin-front-hud-page-workflow-head-grid">
          <div className={`admin-front-hud-page-workflow-status ${statusToneClassName}`}>
            <span className="admin-front-hud-page-workflow-marker-label">
              <span className={`admin-front-hud-page-workflow-marker ${draftMarkerToneClassName}`} aria-hidden="true" />
              <span>Draft</span>
            </span>
            <strong>{headline}</strong>
            <span>{saveFeedbackLabel}</span>
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
      <div className="admin-front-hud-page-workflow-actions">
        {showDraftActions ? (
          <>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action"
              onClick={handleSaveDraft}
              disabled={!pageDirty || isSaving}
            >
              {isSaving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              className="admin-front-hud-page-workflow-action is-secondary"
              onClick={handleMakeLive}
              disabled={!canMakeLive}
              title={makeLiveTitle}
            >
              {isPublishing ? 'Publishing…' : 'Make live'}
            </button>
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
