import { useEffect, useState } from 'react';
import { isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';
import { ADMIN_BLOCK_NAME_MAX_LENGTH, normalizeAdminBlockName } from '../lib/blockDisplayName';

export default function HudBlockOptions({
  block,
  pathname = '',
  ownership = null,
  contentAdmin = {},
  showWorkflowActions = true,
  showPublishAction = true,
  onOwnershipAction = null,
  onReleaseDraft = null,
  onPublishBlock = null,
  onBlockDeleted = null,
}) {
  const admin = contentAdmin || {};
  const {
    removeBlock = () => {},
    updateBlock = () => {},
    getPageChangeSummary = () => null,
    getPagePublishSummary = () => null,
    releaseActiveBlockDraft = null,
  } = admin;
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState(() => String(block?.adminName || ''));
  const isForeignOwned = isForeignOwnedBlockOwnership(ownership);
  const canTakeOver = Boolean(ownership?.isOwnedByOther) || isForeignOwned;
  const changeSummary = getPageChangeSummary(pathname) || {};
  const publishSummary = getPagePublishSummary(pathname) || {};
  const hasDraftSignalSource = Boolean(
    contentAdmin
      && (typeof contentAdmin.getPageChangeSummary === 'function'
        || typeof contentAdmin.getPagePublishSummary === 'function'),
  );
  const hasBlockDraft = !hasDraftSignalSource || Boolean(
    changeSummary?.changedBlockIds?.includes(block?.id)
      || publishSummary?.changedBlockIds?.includes(block?.id),
  );
  const releaseDraft = onReleaseDraft || (
    typeof releaseActiveBlockDraft === 'function'
      ? (force = false) => releaseActiveBlockDraft(pathname, block.id, { force })
      : null
  );

  useEffect(() => {
    setNicknameDraft(String(block?.adminName || ''));
  }, [block?.adminName, block?.id]);

  if (!block) {
    return null;
  }

  const commitNickname = () => {
    if (isForeignOwned || !block.id) {
      setNicknameDraft(String(block.adminName || ''));
      return;
    }
    const nextName = normalizeAdminBlockName(nicknameDraft);
    const currentName = normalizeAdminBlockName(block.adminName);
    setNicknameDraft(nextName);
    if (nextName === currentName) {
      return;
    }
    updateBlock(pathname, block.id, { adminName: nextName });
    setMessage(nextName ? 'Block nickname saved.' : 'Block nickname cleared.');
  };

  const handleDeleteBlock = () => {
    if (isForeignOwned) {
      return;
    }
    if (!isDeleting) {
      setIsDeleting(true);
      setMessage('Choose Delete block again to confirm.');
      return;
    }
    removeBlock(pathname, block.id);
    onBlockDeleted?.(block.id);
  };

  const handleTakeOver = async () => {
    if (!canTakeOver || isTakingOver || typeof onOwnershipAction !== 'function') {
      return;
    }
    setIsTakingOver(true);
    setMessage('');
    try {
      const result = await onOwnershipAction();
      setMessage(result?.ok === false ? 'Takeover failed; the other admin still owns this block.' : 'Draft takeover complete.');
    } finally {
      setIsTakingOver(false);
    }
  };

  return (
    <section className="admin-hud-editor-block-options-page admin-front-hud-block-options" aria-label="Block options">
      <div className="admin-front-hud-block-options-head">
        <strong>Block options</strong>
        {message ? <span role="status">{message}</span> : null}
      </div>
      <label className="admin-front-hud-field admin-front-hud-block-nickname-field">
        <span>Block nickname</span>
        <input
          type="text"
          value={nicknameDraft}
          maxLength={ADMIN_BLOCK_NAME_MAX_LENGTH}
          placeholder="Optional admin-only name"
          aria-label="Block nickname"
          disabled={isForeignOwned}
          onChange={(event) => setNicknameDraft(event.target.value)}
          onBlur={commitNickname}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setNicknameDraft(String(block.adminName || ''));
              event.currentTarget.blur();
            }
          }}
        />
        <small>Shown in admin/HUD labels only.</small>
      </label>
      <div className="admin-front-hud-block-options-actions">
        {showWorkflowActions && canTakeOver && typeof onOwnershipAction === 'function' ? (
          <button type="button" className="action-btn action-btn-outline" onClick={handleTakeOver} disabled={isTakingOver}>
            {isTakingOver ? 'Taking over…' : ownership?.state === 'drafted-other' ? 'Take over draft' : 'Take over edit'}
          </button>
        ) : null}
        {showWorkflowActions && showPublishAction && typeof onPublishBlock === 'function' ? (
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={onPublishBlock}
            disabled={isForeignOwned || !hasBlockDraft}
            title={isForeignOwned ? 'Take over this block before publishing it live.' : 'Publish only this block.'}
          >
            Make block live
          </button>
        ) : null}
        {showWorkflowActions
          && (ownership?.state === 'owned-self' || isForeignOwned)
          && typeof releaseDraft === 'function' ? (
          <button type="button" className="action-btn action-btn-outline" onClick={() => releaseDraft(isForeignOwned)}>
            Release draft
          </button>
        ) : null}
        <button
          type="button"
          className={`action-btn action-btn-danger${isDeleting ? ' is-confirm' : ''}`}
          onClick={handleDeleteBlock}
          disabled={isForeignOwned || isDeleting && !block.id}
        >
          {isDeleting ? 'Confirm delete block' : 'Delete block'}
        </button>
        {isDeleting ? (
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={() => {
              setIsDeleting(false);
              setMessage('');
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
