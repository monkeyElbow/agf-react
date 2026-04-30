export const BLUE_SURFACE_SWATCH = 'linear-gradient(var(--ag-surface-blue-angle), var(--ag-color-atlantean-dark) 0%, var(--ag-color-atlantean) 100%)';
export const BLUE_SURFACE_OVERLAY_SOFT = 'linear-gradient(var(--ag-surface-blue-angle), rgba(var(--ag-color-atlantean-dark-rgb), 0.34) 0%, rgba(var(--ag-color-atlantean-rgb), 0.24) 100%)';
export const BLUE_SURFACE_OVERLAY_STRONG = 'linear-gradient(var(--ag-surface-blue-angle), rgba(var(--ag-color-atlantean-dark-rgb), 0.8) 0%, rgba(var(--ag-color-atlantean-rgb), 0.45) 100%)';

const TOKEN_SWATCHS = Object.freeze({
  atlantean: BLUE_SURFACE_SWATCH,
  mango: 'linear-gradient(145deg, var(--ag-color-mango) 0%, var(--ag-color-mango-dark) 100%)',
  melon: 'linear-gradient(145deg, var(--ag-color-melon) 0%, var(--ag-color-melon-dark) 100%)',
  sandstone: 'linear-gradient(145deg, var(--ag-color-sandstone) 0%, var(--ag-color-sandstone-dark) 100%)',
  'super-grey': 'linear-gradient(145deg, var(--ag-color-super-grey) 0%, var(--ag-color-super-grey-dark) 100%)',
  white: 'linear-gradient(145deg, var(--ag-color-white) 0%, var(--ag-color-white-soft) 100%)',
  sand: 'linear-gradient(145deg, var(--ag-color-sand) 0%, var(--ag-color-sand-dark) 100%)',
  blue: BLUE_SURFACE_SWATCH,
  grey: 'linear-gradient(145deg, var(--ag-color-super-grey) 0%, var(--ag-color-super-grey-dark) 100%)',
  dark: 'linear-gradient(145deg, var(--ag-color-super-grey) 0%, var(--ag-color-super-grey-dark) 100%)',
  default: 'linear-gradient(145deg, var(--ag-color-white) 0%, var(--ag-color-white-soft) 100%)',
});

const SEMANTIC_TEXT_COLOR_ALIASES = Object.freeze({
  blue: 'is-atlantean',
  atlantean: 'is-atlantean',
  mango: 'is-mango',
  melon: 'is-melon',
  grey: 'is-super-grey',
  'super-grey': 'is-super-grey',
  supergrey: 'is-super-grey',
  sand: 'is-sandstone',
  sandstone: 'is-sandstone',
  white: 'is-white',
});

const INTRO_ACCENT_TONE_ALIASES = Object.freeze({
  default: '',
  blue: 'atlantean',
  atlantean: 'atlantean',
  mango: 'mango',
  melon: 'melon',
  grey: 'super-grey',
  muted: 'super-grey',
  'super-grey': 'super-grey',
  supergrey: 'super-grey',
  sand: 'sandstone',
  sandstone: 'sandstone',
  white: 'white',
});

export const SEMANTIC_TEXT_COLOR_VALUES = Object.freeze([
  'is-atlantean',
  'is-mango',
  'is-melon',
  'is-sandstone',
  'is-super-grey',
  'is-white',
]);

export const SURFACE_BG_TONE_VALUES = Object.freeze(['white', 'sand', 'blue', 'grey']);
export const PANEL_TEXT_TONE_VALUES = Object.freeze(['dark', 'white', 'blue']);
export const BUTTON_TONE_VALUES = Object.freeze(['atlantean', 'super-grey', 'mango', 'melon', 'white']);
export const INTRO_ACCENT_TONE_VALUES = Object.freeze(['', 'atlantean', 'sandstone', 'super-grey', 'mango', 'melon', 'white']);

export const SEMANTIC_TEXT_COLOR_OPTIONS = Object.freeze([
  Object.freeze({ value: 'is-atlantean', label: 'Blue', swatch: TOKEN_SWATCHS.atlantean }),
  Object.freeze({ value: 'is-mango', label: 'Mango', swatch: TOKEN_SWATCHS.mango }),
  Object.freeze({ value: 'is-melon', label: 'Melon', swatch: TOKEN_SWATCHS.melon }),
  Object.freeze({ value: 'is-sandstone', label: 'Sandstone', swatch: TOKEN_SWATCHS.sandstone }),
  Object.freeze({ value: 'is-super-grey', label: 'Super Grey', swatch: TOKEN_SWATCHS['super-grey'] }),
  Object.freeze({ value: 'is-white', label: 'White', swatch: TOKEN_SWATCHS.white }),
]);

export const SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT = Object.freeze([
  Object.freeze({ value: '', label: 'Default', swatch: TOKEN_SWATCHS.default }),
  ...SEMANTIC_TEXT_COLOR_OPTIONS,
]);

export const HERO_TEXT_COLOR_OPTIONS = Object.freeze([
  ...SEMANTIC_TEXT_COLOR_OPTIONS,
  Object.freeze({ value: '', label: 'Clear', shortLabel: 'Clear', hideSwatch: true }),
]);

export const SURFACE_BG_TONE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'white', label: 'White', swatch: TOKEN_SWATCHS.white }),
  Object.freeze({ value: 'sand', label: 'Sand', swatch: TOKEN_SWATCHS.sand }),
  Object.freeze({ value: 'blue', label: 'Blue', swatch: TOKEN_SWATCHS.blue }),
  Object.freeze({ value: 'grey', label: 'Grey', swatch: TOKEN_SWATCHS.grey }),
]);

export const PANEL_TEXT_TONE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'dark', label: 'Dark', swatch: TOKEN_SWATCHS.dark }),
  Object.freeze({ value: 'white', label: 'White', swatch: TOKEN_SWATCHS.white }),
  Object.freeze({ value: 'blue', label: 'Blue', swatch: TOKEN_SWATCHS.blue }),
]);

export const BUTTON_TONE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'atlantean', label: 'Blue', swatch: TOKEN_SWATCHS.atlantean }),
  Object.freeze({ value: 'super-grey', label: 'Super Grey', swatch: TOKEN_SWATCHS['super-grey'] }),
  Object.freeze({ value: 'mango', label: 'Mango', swatch: TOKEN_SWATCHS.mango }),
  Object.freeze({ value: 'melon', label: 'Melon', swatch: TOKEN_SWATCHS.melon }),
  Object.freeze({ value: 'white', label: 'White', swatch: TOKEN_SWATCHS.white }),
]);

export const INTRO_ACCENT_TONE_OPTIONS = Object.freeze([
  Object.freeze({ value: '', label: 'Default / Auto', swatch: TOKEN_SWATCHS.default }),
  Object.freeze({ value: 'atlantean', label: 'Blue', swatch: TOKEN_SWATCHS.atlantean }),
  Object.freeze({ value: 'sandstone', label: 'Sand', swatch: TOKEN_SWATCHS.sandstone }),
  Object.freeze({ value: 'super-grey', label: 'Grey', swatch: TOKEN_SWATCHS['super-grey'] }),
  Object.freeze({ value: 'mango', label: 'Mango', swatch: TOKEN_SWATCHS.mango }),
  Object.freeze({ value: 'melon', label: 'Melon', swatch: TOKEN_SWATCHS.melon }),
  Object.freeze({ value: 'white', label: 'White', swatch: TOKEN_SWATCHS.white }),
]);

export function normalizeSemanticTextColorClass(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  if (SEMANTIC_TEXT_COLOR_VALUES.includes(raw)) {
    return raw;
  }
  const token = raw.startsWith('is-') ? raw.slice(3) : raw;
  return SEMANTIC_TEXT_COLOR_ALIASES[token] || '';
}

export function normalizeSurfaceBgTone(value, fallback = 'white') {
  const token = String(value || '').trim().toLowerCase();
  if (SURFACE_BG_TONE_VALUES.includes(token)) {
    return token;
  }
  return SURFACE_BG_TONE_VALUES.includes(String(fallback || '').trim().toLowerCase())
    ? String(fallback || '').trim().toLowerCase()
    : 'white';
}

export function normalizePanelTextTone(value, fallback = 'dark') {
  const token = String(value || '').trim().toLowerCase();
  if (PANEL_TEXT_TONE_VALUES.includes(token)) {
    return token;
  }
  return PANEL_TEXT_TONE_VALUES.includes(String(fallback || '').trim().toLowerCase())
    ? String(fallback || '').trim().toLowerCase()
    : 'dark';
}

export function resolvePanelTextToneClassName(value, fallback = 'dark') {
  const normalized = normalizePanelTextTone(value, fallback);
  if (normalized === 'white') {
    return 'is-white';
  }
  if (normalized === 'blue') {
    return 'is-atlantean';
  }
  return 'is-super-grey';
}

export function normalizeButtonTone(value, fallback = 'atlantean') {
  const token = String(value || '').trim().toLowerCase();
  if (BUTTON_TONE_VALUES.includes(token)) {
    return token;
  }
  return BUTTON_TONE_VALUES.includes(String(fallback || '').trim().toLowerCase())
    ? String(fallback || '').trim().toLowerCase()
    : 'atlantean';
}

export function normalizeIntroAccentTone(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('is-')) {
    return INTRO_ACCENT_TONE_ALIASES[raw.slice(3)] || '';
  }
  return INTRO_ACCENT_TONE_ALIASES[raw] ?? '';
}

export function resolveIntroAccentColor(value) {
  const tone = normalizeIntroAccentTone(value);
  if (!tone) {
    return '';
  }
  if (tone === 'atlantean') {
    return 'var(--ag-color-atlantean-dark)';
  }
  if (tone === 'mango') {
    return 'var(--ag-color-mango)';
  }
  if (tone === 'melon') {
    return 'var(--ag-color-melon)';
  }
  if (tone === 'super-grey') {
    return 'var(--ag-color-super-grey)';
  }
  if (tone === 'sandstone') {
    return 'var(--ag-color-sandstone)';
  }
  if (tone === 'white') {
    return 'var(--ag-color-white)';
  }
  return '';
}

export function getTokenSwatch(value, fallback = TOKEN_SWATCHS.default) {
  return TOKEN_SWATCHS[String(value || '').trim()] || fallback;
}
