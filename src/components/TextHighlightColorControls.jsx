import ColorPalette from './ColorPalette';

export default function TextHighlightColorControls({
  label,
  ariaLabel,
  options = [],
  value = '',
  onChange,
  note = '',
  sourceText = '',
  highlightRanges = [],
  onRemoveSpan,
  onClearSpans,
  layout = 'row',
  notePlacement = 'below',
  paletteVariant = 'hud',
  paletteClassName = 'is-field-linked',
  swatchClassName = '',
}) {
  const safeRanges = Array.isArray(highlightRanges) ? highlightRanges : [];
  const resolvedSwatchClassName = swatchClassName || (paletteVariant === 'hud' ? 'is-compact is-icon-only' : '');
  const palette = (
    <ColorPalette
      variant={paletteVariant}
      className={`${paletteClassName}${resolvedSwatchClassName ? ` ${resolvedSwatchClassName}` : ''}`.trim()}
      ariaLabel={ariaLabel}
      options={options}
      value={value}
      preventMouseDown
      onChange={onChange}
    />
  );

  return (
    <>
      {layout === 'stacked' ? (
        <div className="admin-front-hud-field-group">
          <span className="admin-front-hud-control-label">{label}</span>
          {palette}
        </div>
      ) : note && notePlacement === 'inline' ? (
        <div className="admin-front-hud-row admin-front-hud-text-highlight-inline">
          <span>{label}</span>
          {palette}
          <span className="admin-front-hud-note">{note}</span>
        </div>
      ) : (
        <div className="admin-front-hud-row">
          <span>{label}</span>
          {palette}
        </div>
      )}
      {note && notePlacement !== 'inline' ? (
        <p className="admin-front-hud-note">{note}</p>
      ) : null}
      {safeRanges.length ? (
        <div className="admin-front-hud-hero-span-tools">
          <div className="admin-front-hud-hero-span-chip-list">
            {safeRanges.map((range, rangeIndex) => {
              const chipText = String(sourceText || '').slice(range.start, range.end);
              const swatch = options.find((option) => option.value === range.className);
              return (
                <button
                  key={`text-highlight-span-${range.start}-${range.end}-${range.className}-${rangeIndex + 1}`}
                  type="button"
                  className="admin-hero-inline-span-chip"
                  onClick={() => onRemoveSpan?.(rangeIndex)}
                  title="Remove span"
                >
                  <span
                    className="admin-hero-inline-span-chip-color"
                    aria-hidden="true"
                    style={{ background: swatch?.swatch || '#ddd' }}
                  />
                  <span className="admin-hero-inline-span-chip-text">“{chipText || ' '}”</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="admin-front-hud-mini-action"
            onClick={() => onClearSpans?.()}
          >
            Clear spans
          </button>
        </div>
      ) : null}
    </>
  );
}
