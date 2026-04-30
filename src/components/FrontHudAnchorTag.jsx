export default function FrontHudAnchorTag({
  label = '',
  isActive = false,
  onClick = null,
  layerClassName = '',
  anchorClassName = '',
  style = undefined,
  buttonAriaLabel = '',
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
          <span aria-hidden="true">{nextLabel}</span>
        </button>
      </div>
    </div>
  );
}
