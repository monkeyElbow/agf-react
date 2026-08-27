import { useState } from 'react';
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
  getOptionLabel,
  onPaletteMouseDown,
  collapsibleSpans = false,
  spanDetailsOpen,
  onSpanDetailsToggle,
  spanDetailsLabel = 'Show span details',
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
      getOptionLabel={getOptionLabel}
      onOptionMouseDown={onPaletteMouseDown}
      onChange={onChange}
    />
  );

  const [localShowSpanDetails, setLocalShowSpanDetails] = useState(false);
  const showSpanDetails = typeof spanDetailsOpen === 'boolean' ? spanDetailsOpen : localShowSpanDetails;
  const toggleSpanDetails = () => {
    const nextValue = !showSpanDetails;
    setLocalShowSpanDetails(nextValue);
    onSpanDetailsToggle?.(nextValue);
  };

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
      {collapsibleSpans && safeRanges.length ? (
        <button
          type="button"
          className="admin-front-hud-mini-action"
          aria-expanded={showSpanDetails}
          onClick={toggleSpanDetails}
        >
          {showSpanDetails ? 'Hide span details' : 'Show span details'}
        </button>
      ) : null}
      {safeRanges.length && (!collapsibleSpans || showSpanDetails) ? (
        <div className="admin-front-hud-hero-span-tools">
          {spanDetailsLabel ? (
            <span className="admin-front-hud-control-label">{spanDetailsLabel}</span>
          ) : null}
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
