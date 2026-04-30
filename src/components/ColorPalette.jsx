import { buildPaletteClassName } from '../lib/paletteStandards';

function toOptionKey(option, index) {
  if (option && typeof option === 'object') {
    if (option.key != null) {
      return String(option.key);
    }
    if (option.value != null && String(option.value).trim()) {
      return String(option.value);
    }
    if (option.label != null && String(option.label).trim()) {
      return `${String(option.label)}-${index + 1}`;
    }
  }
  return `option-${index + 1}`;
}

export default function ColorPalette({
  variant = 'hud',
  options = [],
  value = '',
  onChange,
  ariaLabel = 'Color options',
  className = '',
  role = 'radiogroup',
  showLabels = variant === 'admin',
  preventMouseDown = false,
  isOptionActive,
  isOptionDisabled,
  getOptionClassName,
  getOptionStyle,
  getOptionLabel,
  getOptionShortLabel,
  hideSwatchForOption,
}) {
  const safeOptions = Array.isArray(options) ? options : [];
  const resolvedClassName = buildPaletteClassName(variant, className, showLabels);
  const groupClassName = variant === 'admin'
    ? `admin-swatch-list${resolvedClassName ? ` ${resolvedClassName}` : ''}`
    : `admin-front-hud-swatch-row${resolvedClassName ? ` ${resolvedClassName}` : ''}`;
  const buttonBaseClassName = variant === 'admin'
    ? 'admin-swatch-option'
    : 'admin-front-hud-swatch';
  const fillClassName = variant === 'admin'
    ? 'admin-swatch-chip'
    : 'admin-front-hud-swatch-fill';

  return (
    <div className={groupClassName} role={role} aria-label={ariaLabel}>
      {safeOptions.map((option, index) => {
        const optionValue = option?.value ?? '';
        const active = typeof isOptionActive === 'function'
          ? Boolean(isOptionActive(option, index))
          : String(value ?? '') === String(optionValue);
        const disabled = typeof isOptionDisabled === 'function'
          ? Boolean(isOptionDisabled(option, index))
          : false;
        const swatch = option?.swatch || '#ddd';
        const hideSwatch = typeof hideSwatchForOption === 'function'
          ? Boolean(hideSwatchForOption(option, index))
          : Boolean(option?.hideSwatch);
        const label = typeof getOptionLabel === 'function'
          ? getOptionLabel(option, index)
          : (option?.label ?? '');
        const shortLabel = typeof getOptionShortLabel === 'function'
          ? getOptionShortLabel(option, index)
          : (option?.shortLabel ?? label);
        const extraClassName = typeof getOptionClassName === 'function'
          ? getOptionClassName(option, { index, active, disabled })
          : '';
        const style = typeof getOptionStyle === 'function'
          ? getOptionStyle(option, { index, active, disabled })
          : (variant === 'admin'
            ? {
                '--admin-swatch-color': swatch,
                '--admin-bg-swatch': swatch,
              }
            : undefined);
        const buttonClassName = [
          buttonBaseClassName,
          active ? 'is-active' : '',
          disabled ? 'is-disabled' : '',
          extraClassName || '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={toOptionKey(option, index)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label || undefined}
            title={label || undefined}
            className={buttonClassName}
            style={style}
            disabled={disabled}
            onMouseDown={preventMouseDown ? (event) => event.preventDefault() : undefined}
            onClick={() => onChange?.(optionValue, option, index)}
          >
            {!hideSwatch ? (
              <span className={fillClassName} aria-hidden="true" style={{ background: swatch }} />
            ) : null}
            {showLabels ? (
              <span>{shortLabel || label}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
