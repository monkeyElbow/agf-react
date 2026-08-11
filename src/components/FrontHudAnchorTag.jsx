export default function FrontHudAnchorTag({
  label = '',
  icon = null,
  isActive = false,
  onClick = null,
  layerClassName = '',
  anchorClassName = '',
  style = undefined,
  buttonAriaLabel = '',
  structureControls = null,
}) {
  const nextLabel = String(label || '').trim();
  if (!nextLabel || typeof onClick !== 'function') {
    return null;
  }

  const resolvedAriaLabel = String(buttonAriaLabel || `Open ${nextLabel} HUD panel`).trim();

  return (
    <div
      className={`admin-front-hud-layer${layerClassName ? ` ${layerClassName}` : ''}`}
      style={style}
    >
      <div className={`admin-front-hud-anchor${anchorClassName ? ` ${anchorClassName}` : ''}`}>
        <button
          type="button"
          className={`admin-front-hud-anchor-label admin-front-hud-anchor-btn${isActive ? ' is-active' : ''}`}
          onClick={onClick}
          aria-label={resolvedAriaLabel}
          title={nextLabel}
        >
          {icon ? (
            <span className="admin-front-hud-anchor-icon" aria-hidden="true">
              <img src={icon} alt="" className="admin-front-hud-anchor-icon-image" />
            </span>
          ) : null}
          <span className="admin-front-hud-anchor-name">{nextLabel}</span>
        </button>
        {structureControls ? (
          <div className="admin-front-hud-anchor-structure-controls">
            {structureControls}
          </div>
        ) : null}
      </div>
    </div>
  );
}
