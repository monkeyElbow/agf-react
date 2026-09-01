import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { buildAdminBlockInsertChoices } from '../lib/adminBlockInsertChoices';
import { getBlockTemplateIcon, toBlockKindMonogram } from '../lib/blockTemplatePresentation';
import { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';

function getChoiceLabel(choice) {
  return String(choice?.name || choice?.kind || choice?.templateId || 'Block').trim() || 'Block';
}

export default function FrontHudStructureControls({
  pathname = '',
  blockId = '',
  activeBlockId = '',
  canReorder = true,
}) {
  const {
    availableBlockTemplates = [],
    authoringBlocksByPath = {},
    blocksByPath = {},
    addBlock = () => {},
    moveBlock = () => {},
    getBlockCollaboration = () => null,
    devIdentity = null,
  } = useContentAdmin();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [message, setMessage] = useState('');
  const pickerRef = useRef(null);
  const pickerPanelRef = useRef(null);
  const addAboveButtonRef = useRef(null);
  const addBelowButtonRef = useRef(null);
  const [pickerPosition, setPickerPosition] = useState(null);

  const choices = useMemo(
    () => buildAdminBlockInsertChoices(availableBlockTemplates, { mode: 'dynamic', pathname }),
    [availableBlockTemplates, pathname],
  );
  const filteredChoices = useMemo(() => {
    const query = String(pickerQuery || '').trim().toLowerCase();
    if (!query) {
      return choices;
    }
    return choices.filter((choice) => [choice?.name, choice?.kind, choice?.templateId]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [choices, pickerQuery]);
  const currentBlocks = Array.isArray(authoringBlocksByPath?.[pathname])
    ? authoringBlocksByPath[pathname]
    : (Array.isArray(blocksByPath?.[pathname]) ? blocksByPath[pathname] : []);
  const targetBlockId = String(blockId || activeBlockId || '').trim();
  const targetIndex = currentBlocks.findIndex((block) => String(block?.id || '').trim() === targetBlockId);
  const targetOwnership = targetBlockId
    ? getBlockOwnershipVisual(
      getBlockCollaboration(pathname, targetBlockId),
      devIdentity?.userId,
    )
    : null;
  const canEditTarget = targetIndex >= 0 && !isForeignOwnedBlockOwnership(targetOwnership);
  const canReorderTarget = canEditTarget && canReorder;
  const targetLabel = currentBlocks[targetIndex]?.label || currentBlocks[targetIndex]?.kind || targetBlockId || 'block';
  const [pendingInsertIndex, setPendingInsertIndex] = useState(null);

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }
    const handleOutsidePointer = (event) => {
      if (
        !pickerRef.current?.contains(event.target)
        && !pickerPanelRef.current?.contains(event.target)
      ) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsidePointer);
    return () => document.removeEventListener('mousedown', handleOutsidePointer);
  }, [isPickerOpen]);

  useLayoutEffect(() => {
    if (!isPickerOpen || typeof window === 'undefined') {
      return undefined;
    }

    const updatePickerPosition = () => {
      const anchor = pendingInsertIndex === targetIndex
        ? addAboveButtonRef.current
        : addBelowButtonRef.current;
      const rect = (anchor || pickerRef.current)?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const gap = 8;
      const width = Math.min(250, Math.max(180, window.innerWidth - 24));
      const fitsRight = rect.right + gap + width <= window.innerWidth - 8;
      const left = fitsRight
        ? rect.right + gap
        : Math.max(8, rect.left - width - gap);
      const top = Math.min(
        Math.max(8, rect.top),
        Math.max(8, window.innerHeight - 390),
      );
      setPickerPosition({ left, top, width });
    };

    updatePickerPosition();
    window.addEventListener('resize', updatePickerPosition);
    window.addEventListener('scroll', updatePickerPosition, true);
    return () => {
      window.removeEventListener('resize', updatePickerPosition);
      window.removeEventListener('scroll', updatePickerPosition, true);
    };
  }, [isPickerOpen, pendingInsertIndex, targetIndex]);

  const togglePicker = (insertIndex) => {
    const isSameOpenPicker = isPickerOpen && pendingInsertIndex === insertIndex;
    setMessage('');
    setPickerQuery('');
    setPendingInsertIndex(isSameOpenPicker ? null : insertIndex);
    setIsPickerOpen(!isSameOpenPicker);
  };

  const handleAddBlock = (choice) => {
    if (!choice?.createTemplateId) {
      return;
    }
    const insertIndex = canEditTarget && Number.isInteger(pendingInsertIndex)
      ? pendingInsertIndex
      : undefined;
    addBlock(pathname, choice.createTemplateId, insertIndex);
    setMessage(`${getChoiceLabel(choice)} added to the page draft.`);
    setPickerQuery('');
    setIsPickerOpen(false);
  };

  const handleMove = (direction) => {
    if (!canReorderTarget) {
      return;
    }
    moveBlock(pathname, targetBlockId, direction);
    setMessage(`Block moved ${direction}.`);
  };

  const pickerPanel = isPickerOpen ? (
    <div
      ref={pickerPanelRef}
      className="admin-front-hud-structure-picker is-floating"
      role="listbox"
      aria-label="Choose a block to add"
      style={pickerPosition ? {
        left: `${pickerPosition.left}px`,
        top: `${pickerPosition.top}px`,
        width: `${pickerPosition.width}px`,
      } : undefined}
    >
      <input
        type="search"
        value={pickerQuery}
        onChange={(event) => setPickerQuery(event.target.value)}
        placeholder="Filter blocks"
        aria-label="Filter blocks to add"
        autoFocus
      />
      <div className="admin-front-hud-structure-picker-list">
        {filteredChoices.length ? filteredChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            role="option"
            onClick={() => handleAddBlock(choice)}
          >
            <span className="admin-front-hud-structure-picker-icon" aria-hidden="true">
              {getBlockTemplateIcon(choice) ? <img src={getBlockTemplateIcon(choice)} alt="" /> : toBlockKindMonogram(choice.kind)}
            </span>
            <span>
              <strong>{getChoiceLabel(choice)}</strong>
              <small>{choice.description}</small>
            </span>
          </button>
        )) : <span className="admin-front-hud-structure-picker-empty">No matching blocks</span>}
      </div>
    </div>
  ) : null;

  return (
    <div className={`admin-front-hud-structure-controls${isPickerOpen ? ' is-picker-open' : ''}`} aria-label={`Structure controls for ${targetLabel}`}>
      <div className="admin-front-hud-structure-add" ref={pickerRef}>
        <button
          ref={addAboveButtonRef}
          type="button"
          className="admin-front-hud-structure-circle"
          onClick={() => togglePicker(targetIndex)}
          aria-label={`Add block above ${targetLabel}`}
          aria-expanded={isPickerOpen && pendingInsertIndex === targetIndex}
          aria-haspopup="listbox"
          title={`Add block above ${targetLabel}`}
          disabled={!choices.length || !canEditTarget}
        >
          <span aria-hidden="true">↑+</span>
        </button>
        <button
          ref={addBelowButtonRef}
          type="button"
          className="admin-front-hud-structure-circle"
          onClick={() => togglePicker(targetIndex + 1)}
          aria-label={`Add block below ${targetLabel}`}
          aria-expanded={isPickerOpen && pendingInsertIndex === targetIndex + 1}
          aria-haspopup="listbox"
          title={`Add block below ${targetLabel}`}
          disabled={!choices.length || !canEditTarget}
        >
          <span aria-hidden="true">↓+</span>
        </button>
        {pickerPanel && typeof document !== 'undefined' ? createPortal(pickerPanel, document.body) : pickerPanel}
      </div>
      <div className="admin-front-hud-structure-order" role="group" aria-label={`Reorder ${targetLabel}`}>
        <button
          type="button"
          className="admin-front-hud-structure-circle"
          onClick={() => handleMove('up')}
          disabled={!canReorderTarget || targetIndex === 0}
          aria-label={`Move ${targetLabel} up`}
          title={`Move ${targetLabel} up`}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          className="admin-front-hud-structure-circle"
          onClick={() => handleMove('down')}
          disabled={!canReorderTarget || targetIndex === currentBlocks.length - 1}
          aria-label={`Move ${targetLabel} down`}
          title={`Move ${targetLabel} down`}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>
      {message ? <span className="admin-front-hud-structure-message" role="status">{message}</span> : null}
    </div>
  );
}
