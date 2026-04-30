export const STANDARD_ADMIN_PALETTE_CLASS = 'admin-standard-swatch-palette';
export const STANDARD_HUD_PALETTE_CLASS = 'hud-standard-swatch-palette';

function hasToken(source, token) {
  return String(source || '')
    .split(/\s+/)
    .filter(Boolean)
    .includes(token);
}

export function buildPaletteClassName(variant = 'hud', className = '', showLabels = variant === 'admin') {
  const tokens = String(className || '')
    .split(/\s+/)
    .filter(Boolean);

  if (variant === 'hud') {
    if (!hasToken(className, STANDARD_HUD_PALETTE_CLASS)) {
      tokens.push(STANDARD_HUD_PALETTE_CLASS);
    }
    return Array.from(new Set(tokens)).join(' ').trim();
  }

  const isIconOnly = hasToken(className, 'is-icon-only');
  if (variant === 'admin' && isIconOnly && !showLabels && !hasToken(className, STANDARD_ADMIN_PALETTE_CLASS)) {
    tokens.push(STANDARD_ADMIN_PALETTE_CLASS);
  }

  return Array.from(new Set(tokens)).join(' ').trim();
}
