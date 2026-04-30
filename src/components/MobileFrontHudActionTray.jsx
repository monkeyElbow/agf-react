export default function MobileFrontHudActionTray({
  blockLabel = '',
  isHidden = false,
  canMoveUp = false,
  canMoveDown = false,
  isMoreOpen = false,
  isDeleteConfirming = false,
  onEdit = null,
  onMoveUp = null,
  onMoveDown = null,
  onToggleMore = null,
  onToggleVisibility = null,
  onDelete = null,
  onDismiss = null,
}) {
  const resolvedLabel = String(blockLabel || 'Block').trim() || 'Block';

  return (
    <div className="admin-front-hud-mobile-tray" aria-label={`${resolvedLabel} mobile HUD actions`}>
      {isMoreOpen ? (
        <div className="admin-front-hud-mobile-tray-menu" role="group" aria-label={`${resolvedLabel} more actions`}>
          <button
            type="button"
            className="admin-front-hud-mobile-tray-menu-btn"
            onClick={onToggleVisibility}
          >
            {isHidden ? 'Show block' : 'Hide block'}
          </button>
          <button
            type="button"
            className={`admin-front-hud-mobile-tray-menu-btn is-danger${isDeleteConfirming ? ' is-confirm' : ''}`}
            onClick={onDelete}
          >
            {isDeleteConfirming ? 'Confirm delete' : 'Delete block'}
          </button>
        </div>
      ) : null}

      <div className="admin-front-hud-mobile-tray-bar">
        <div className="admin-front-hud-mobile-tray-head">
          <div className="admin-front-hud-mobile-tray-meta">
            <span className="admin-front-hud-mobile-tray-kicker">Selected</span>
            <strong>{resolvedLabel}</strong>
          </div>
          <button
            type="button"
            className="admin-front-hud-mobile-tray-close"
            onClick={onDismiss}
            aria-label={`Clear ${resolvedLabel} selection`}
            title="Clear selection"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          className="admin-front-hud-mobile-tray-btn is-primary"
          onClick={onEdit}
        >
          Edit
        </button>
        <div className="admin-front-hud-mobile-tray-actions">
          <button
            type="button"
            className="admin-front-hud-mobile-tray-btn"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${resolvedLabel} up`}
          >
            Up
          </button>
          <button
            type="button"
            className="admin-front-hud-mobile-tray-btn"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${resolvedLabel} down`}
          >
            Down
          </button>
          <button
            type="button"
            className={`admin-front-hud-mobile-tray-btn${isMoreOpen ? ' is-active' : ''}`}
            onClick={onToggleMore}
            aria-expanded={isMoreOpen ? 'true' : 'false'}
          >
            More
          </button>
        </div>
      </div>
    </div>
  );
}
