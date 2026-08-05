import { useEffect, useMemo, useState } from 'react';
import { buildAdminBlockInsertChoices } from '../lib/adminBlockInsertChoices';
import { isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';

function getChoiceLabel(choice) {
  return String(choice?.name || choice?.kind || choice?.templateId || 'Block').trim() || 'Block';
}

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
}) {
  const admin = contentAdmin || {};
  const {
    availableBlockTemplates = [],
    authoringBlocksByPath = {},
    blocksByPath = {},
    addBlock = () => {},
    removeBlock = () => {},
    getPageChangeSummary = () => null,
    getPagePublishSummary = () => null,
    releaseActiveBlockDraft = null,
  } = admin;
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const choices = useMemo(
    () => buildAdminBlockInsertChoices(availableBlockTemplates, { mode: 'dynamic', pathname }),
    [availableBlockTemplates, pathname],
  );
  const currentBlocks = Array.isArray(authoringBlocksByPath?.[pathname])
    ? authoringBlocksByPath[pathname]
    : (Array.isArray(blocksByPath?.[pathname]) ? blocksByPath[pathname] : []);
  const blockIndex = currentBlocks.findIndex((entry) => entry?.id === block?.id);
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
    if (!selectedTemplateId && choices.length) {
      setSelectedTemplateId(choices[0].createTemplateId);
    }
  }, [choices, selectedTemplateId]);

  if (!block) {
    return null;
  }

  const handleAddBlock = () => {
    if (!selectedTemplateId || isAdding || isForeignOwned) {
      return;
    }
    setIsAdding(true);
    setMessage('');
    try {
      addBlock(pathname, selectedTemplateId, blockIndex >= 0 ? blockIndex + 1 : undefined);
      const choice = choices.find((entry) => entry.createTemplateId === selectedTemplateId);
      setMessage(`${getChoiceLabel(choice)} added after this block.`);
    } finally {
      setIsAdding(false);
    }
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
    <section className="admin-front-hud-block-options" aria-label="Block options">
      <div className="admin-front-hud-block-options-head">
        <strong>Block options</strong>
        {message ? <span role="status">{message}</span> : null}
      </div>
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
      </div>
      {choices.length ? (
        <div className="admin-front-hud-block-add">
          <label className="admin-front-hud-field">
            <span>Add block after this block</span>
            <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} disabled={isForeignOwned || isAdding}>
              {choices.map((choice) => (
                <option key={choice.id} value={choice.createTemplateId}>{getChoiceLabel(choice)}</option>
              ))}
            </select>
          </label>
          <button type="button" className="action-btn action-btn-outline" onClick={handleAddBlock} disabled={isForeignOwned || isAdding || !selectedTemplateId}>
            {isAdding ? 'Adding…' : 'Add block'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
