import { useEffect, useMemo, useRef, useState } from 'react';

const FRONT_HUD_PANEL_OFFSET_STORAGE_KEY = 'agf-front-hud-panel-offset-y-v2';
const FRONT_HUD_PANEL_RECOVERY_HANDLE_PX = 56;
const FRONT_HUD_PANEL_DEFAULT_OFFSET_RATIO = 0.08;
const FRONT_HUD_PANEL_DEFAULT_OFFSET_MIN_PX = 24;
const FRONT_HUD_PANEL_DEFAULT_OFFSET_MAX_PX = 72;

function clampPanelOffset(value, min = 0, max = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(min, Math.min(Math.round(numeric), max));
}

export default function FrontHudPanelShell({
  title,
  onClose,
  children,
  style,
  className = '',
  draggable = true,
  isMobileSheet = false,
  closeButtonText = null,
}) {
  const shellRef = useRef(null);
  const [hasStoredOffset] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(FRONT_HUD_PANEL_OFFSET_STORAGE_KEY) != null;
    } catch {
      return false;
    }
  });
  const [offsetInitialized, setOffsetInitialized] = useState(hasStoredOffset);
  const [offsetY, setOffsetY] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }
    try {
      return clampPanelOffset(window.localStorage.getItem(FRONT_HUD_PANEL_OFFSET_STORAGE_KEY));
    } catch {
      return 0;
    }
  });
  const dragStateRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragBounds, setDragBounds] = useState({ min: 0, max: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const measureBounds = () => {
      const shellHeight = shellRef.current?.getBoundingClientRect().height || 0;
      const roundedHeight = Math.max(0, Math.round(shellHeight));
      const min = 0;
      const max = roundedHeight > FRONT_HUD_PANEL_RECOVERY_HANDLE_PX
        ? roundedHeight - FRONT_HUD_PANEL_RECOVERY_HANDLE_PX
        : 0;
      const defaultOffset = clampPanelOffset(
        Math.round(
          Math.min(
            FRONT_HUD_PANEL_DEFAULT_OFFSET_MAX_PX,
            Math.max(FRONT_HUD_PANEL_DEFAULT_OFFSET_MIN_PX, roundedHeight * FRONT_HUD_PANEL_DEFAULT_OFFSET_RATIO),
          ),
        ),
        min,
        max,
      );
      setDragBounds((current) => (
        current.min === min && current.max === max ? current : { min, max }
      ));
      setOffsetY((current) => {
        if (!offsetInitialized && !hasStoredOffset) {
          return defaultOffset;
        }
        return clampPanelOffset(current, min, max);
      });
      if (!offsetInitialized) {
        setOffsetInitialized(true);
      }
    };

    measureBounds();
    window.addEventListener('resize', measureBounds);
    return () => window.removeEventListener('resize', measureBounds);
  }, [children, hasStoredOffset, offsetInitialized, title]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FRONT_HUD_PANEL_OFFSET_STORAGE_KEY, String(offsetY));
    } catch {
      // Ignore persistence issues.
    }
  }, [offsetY]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const state = dragStateRef.current;
      if (!state) {
        return;
      }
      const deltaY = event.clientY - state.startY;
      setOffsetY(clampPanelOffset(state.startOffset + deltaY, state.minOffset, state.maxOffset));
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleHeaderPointerDown = (event) => {
    if (!draggable) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    dragStateRef.current = {
      startY: event.clientY,
      startOffset: offsetY,
      minOffset: dragBounds.min,
      maxOffset: dragBounds.max,
    };
    setIsDragging(true);
  };

  const resolvedStyle = useMemo(
    () => ({
      ...(style || {}),
      '--ag-admin-front-hud-panel-offset-y': `${offsetY}px`,
    }),
    [offsetY, style],
  );
  const shellClassName = `admin-front-hud-tool is-docked is-panel-active${className ? ` ${className}` : ''}`;
  const resolvedCloseButtonText = closeButtonText ?? (isMobileSheet ? 'Close' : '×');

  return (
    <div ref={shellRef} className={shellClassName} style={resolvedStyle}>
      <div
        className={`admin-front-hud-tool-head is-draggable${isDragging ? ' is-dragging-panel' : ''}${isMobileSheet ? ' is-mobile-sheet-header' : ''}`}
        onPointerDown={draggable ? handleHeaderPointerDown : undefined}
        data-mobile-front-hud-sheet-header={isMobileSheet ? 'true' : undefined}
      >
        <span>{title}</span>
        <button
          type="button"
          className={`admin-front-hud-tool-close${isMobileSheet ? ' is-mobile-sheet-close' : ''}`}
          onClick={onClose}
          aria-label="Close panel"
          title="Close panel"
        >
          {resolvedCloseButtonText}
        </button>
      </div>
      <div className="admin-front-hud-tool-content">
        {children}
      </div>
    </div>
  );
}
