import '../styles/front-hud.css';

function defaultPanelText(panel) {
  return String(panel?.label || '').trim();
}

function defaultPanelTitle(panel) {
  const label = defaultPanelText(panel);
  return panel?.isHidden ? `${label} — hidden from visitors` : label;
}

function defaultPanelAriaLabel(panel) {
  const label = defaultPanelText(panel);
  return panel?.isHidden ? `${label} (hidden from visitors)` : label;
}

export default function FrontHudDock({
  panels = [],
  activePanelId = '',
  isCollapsed = true,
  isIconsOnly = false,
  isDockDragging = false,
  style,
  ariaLabel = 'Front HUD editor panels',
  panelAriaLabelPrefix = '',
  panelTitlePrefix = '',
  getPanelTitle = defaultPanelTitle,
  getPanelAriaLabel = defaultPanelAriaLabel,
  onPanelOpen = null,
  onPanelClose = null,
  onToggleIconsOnly = null,
  onClose = null,
  getDockTabDragProps = () => ({}),
  isPanelDragging = () => false,
  isPanelDragOver = () => false,
  getPanelDropPosition = () => '',
  onDockHoverLabelChange = null,
  dockHoverLabel = null,
}) {
  const safePanels = Array.isArray(panels) ? panels.filter((panel) => panel?.id) : [];
  const updateHoverLabel = (panel, target) => {
    if (typeof onDockHoverLabelChange !== 'function' || !isIconsOnly) {
      return;
    }
    const rect = target.getBoundingClientRect();
    onDockHoverLabelChange({
      id: panel.id,
      top: rect.top + rect.height / 2,
      label: panel.label,
    });
  };

  return (
    <aside
      className={`admin-front-hud-dock${isCollapsed ? ' is-collapsed' : ''}${isIconsOnly ? ' is-icons-only' : ''}`}
      style={style}
      aria-label={ariaLabel}
    >
      <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
        {safePanels.map((panel) => {
          const dropPosition = getPanelDropPosition(panel.id);
          const panelLabel = `${panelAriaLabelPrefix}${getPanelAriaLabel(panel)}`;
          const panelTitle = `${panelTitlePrefix}${getPanelTitle(panel)}`;
          return (
            <button
              key={panel.id}
              type="button"
              className={`admin-front-hud-dock-tab${panel.isHidden ? ' is-hidden-block' : ''}${!isCollapsed && activePanelId === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${dropPosition ? ` is-drop-${dropPosition}` : ''}`}
              onClick={() => {
                if (!isCollapsed && activePanelId === panel.id) {
                  onPanelClose?.(panel);
                  return;
                }
                onPanelOpen?.(panel);
              }}
              aria-label={panelLabel}
              title={panelTitle}
              onMouseEnter={(event) => updateHoverLabel(panel, event.currentTarget)}
              onMouseMove={(event) => {
                if (!isIconsOnly || dockHoverLabel?.id !== panel.id) {
                  return;
                }
                updateHoverLabel(panel, event.currentTarget);
              }}
              onMouseLeave={() => {
                if (dockHoverLabel?.id === panel.id) {
                  onDockHoverLabelChange?.(null);
                }
              }}
              onFocus={(event) => updateHoverLabel(panel, event.currentTarget)}
              onBlur={() => {
                if (dockHoverLabel?.id === panel.id) {
                  onDockHoverLabelChange?.(null);
                }
              }}
              {...(getDockTabDragProps(panel.id) || {})}
            >
              {panel.icon ? (
                <img
                  src={panel.icon}
                  alt=""
                  className="admin-front-hud-dock-tab-icon"
                  aria-hidden="true"
                />
              ) : (
                <span className="admin-front-hud-dock-tab-fallback" aria-hidden="true">{defaultPanelText(panel).slice(0, 1)}</span>
              )}
              <span className="admin-front-hud-dock-tab-label">{panel.label}</span>
              {panel.isHidden ? <span className="admin-front-hud-dock-tab-hidden-marker" aria-hidden="true">Hidden</span> : null}
            </button>
          );
        })}
      </div>
      {isIconsOnly && dockHoverLabel ? (
        <span className="admin-front-hud-dock-hover-label" style={{ top: `${dockHoverLabel.top}px` }} aria-hidden="true">
          {dockHoverLabel.label}
        </span>
      ) : null}
      <div className="admin-front-hud-dock-actions">
        <button
          type="button"
          className="admin-front-hud-structure-circle admin-front-hud-dock-collapse-toggle"
          onClick={() => onToggleIconsOnly?.()}
          aria-label={isIconsOnly ? 'Show HUD panel names' : 'Show HUD icons only'}
          title={isIconsOnly ? 'Show panel names' : 'Show icons only'}
        >
          <span aria-hidden="true">{isIconsOnly ? '←' : '→'}</span>
        </button>
        <button
          type="button"
          className="admin-front-hud-dock-collapse"
          onClick={() => onClose?.()}
          aria-label="Hide panels"
          title="Hide panels"
        >
          <span className="admin-front-hud-close-glyph" aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
