const GRID_BG_TONE_SET = new Set(['white', 'sand', 'blue', 'grey']);
const GRID_CARD_STYLE_BG_COMPATIBILITY = {
  card1: new Set(['blue']),
  card2: new Set(['white']),
  card3: new Set(['sand', 'blue', 'grey']),
  card4: new Set(['grey']),
  none: new Set(['white', 'sand', 'blue', 'grey']),
  'borderless-shadow': new Set(['white', 'sand', 'blue', 'grey']),
};
const GRID_TEXT_TONE_BG_COMPATIBILITY = {
  'super-grey': new Set(['white', 'sand']),
  atlantean: new Set(['white', 'sand', 'blue', 'grey']),
  mango: new Set(['white', 'sand', 'blue', 'grey']),
  melon: new Set(['white', 'sand', 'blue', 'grey']),
  white: new Set(['blue', 'grey']),
  alternating: new Set(['white', 'sand', 'blue', 'grey']),
};
const GRID_COLUMNS_SET = new Set(['two', 'three', 'four']);
const GRID_WIDTH_SET = new Set(['content', 'browser']);

export function normalizeGridBgTone(value) {
  const token = String(value || 'white').trim().toLowerCase();
  return GRID_BG_TONE_SET.has(token) ? token : 'white';
}

export function normalizeGridCardStyleToken(value) {
  const token = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(GRID_CARD_STYLE_BG_COMPATIBILITY, token) ? token : 'card2';
}

export function isGridCardStyleAllowedForBg(cardStyle, bgTone) {
  const normalizedStyle = normalizeGridCardStyleToken(cardStyle);
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  const allowedBgTones = GRID_CARD_STYLE_BG_COMPATIBILITY[normalizedStyle] || GRID_CARD_STYLE_BG_COMPATIBILITY.none;
  return allowedBgTones.has(normalizedBgTone);
}

export function getGridDefaultCardStyleForBg(bgTone) {
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  if (normalizedBgTone === 'white') return 'card2';
  if (normalizedBgTone === 'sand') return 'card3';
  if (normalizedBgTone === 'blue') return 'card1';
  if (normalizedBgTone === 'grey') return 'card4';
  return 'card2';
}

export function getGridDefaultToneForBg(bgTone) {
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  return normalizedBgTone === 'blue' || normalizedBgTone === 'grey' ? 'white' : 'super-grey';
}

export function getGridCompatibleCardStyleOptions(options, bgTone) {
  const source = Array.isArray(options) ? options : [];
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  return source.filter((option) => {
    const styleToken = normalizeGridCardStyleToken(option?.value);
    return isGridCardStyleAllowedForBg(styleToken, normalizedBgTone);
  });
}

export function getGridSafeCardStyleForBg(cardStyle, bgTone, options = []) {
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  const normalizedStyle = normalizeGridCardStyleToken(cardStyle);
  if (isGridCardStyleAllowedForBg(normalizedStyle, normalizedBgTone)) {
    return normalizedStyle;
  }
  const preferred = getGridDefaultCardStyleForBg(normalizedBgTone);
  const compatibleOptions = getGridCompatibleCardStyleOptions(options, normalizedBgTone);
  const preferredExists = compatibleOptions.some(
    (option) => normalizeGridCardStyleToken(option?.value) === preferred,
  );
  if (preferredExists) {
    return preferred;
  }
  if (compatibleOptions.length) {
    return normalizeGridCardStyleToken(compatibleOptions[0].value);
  }
  return preferred;
}

export function normalizeGridToneToken(value) {
  const token = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(GRID_TEXT_TONE_BG_COMPATIBILITY, token) ? token : 'super-grey';
}

export function isGridToneAllowedForBg(tone, bgTone) {
  const normalizedTone = normalizeGridToneToken(tone);
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  const allowedBgTones = GRID_TEXT_TONE_BG_COMPATIBILITY[normalizedTone] || GRID_TEXT_TONE_BG_COMPATIBILITY['super-grey'];
  return allowedBgTones.has(normalizedBgTone);
}

export function getGridCompatibleToneOptions(options, bgTone) {
  const source = Array.isArray(options) ? options : [];
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  return source.filter((option) => {
    const toneToken = normalizeGridToneToken(option?.value);
    return isGridToneAllowedForBg(toneToken, normalizedBgTone);
  });
}

export function getGridSafeToneForBg(tone, bgTone, fallback = 'super-grey', options = []) {
  const normalizedBgTone = normalizeGridBgTone(bgTone);
  const normalizedTone = normalizeGridToneToken(tone);
  if (isGridToneAllowedForBg(normalizedTone, normalizedBgTone)) {
    return normalizedTone;
  }
  const normalizedFallback = normalizeGridToneToken(fallback);
  if (isGridToneAllowedForBg(normalizedFallback, normalizedBgTone)) {
    return normalizedFallback;
  }
  const preferred = getGridDefaultToneForBg(normalizedBgTone);
  if (isGridToneAllowedForBg(preferred, normalizedBgTone)) {
    return preferred;
  }
  const compatibleOptions = getGridCompatibleToneOptions(options, normalizedBgTone);
  if (compatibleOptions.length) {
    return normalizeGridToneToken(compatibleOptions[0].value);
  }
  return preferred;
}

export function normalizeDynamicGridColumns(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === '2') return 'two';
  if (token === '3') return 'three';
  if (token === '4') return 'four';
  return GRID_COLUMNS_SET.has(token) ? token : 'three';
}

export function normalizeDynamicGridWidth(value) {
  const token = String(value || '').trim().toLowerCase();
  return GRID_WIDTH_SET.has(token) ? token : 'content';
}

export function normalizeDynamicGridCardPaddingRem(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1.35;
  }
  return Math.max(0.75, Math.min(3, Number(numeric.toFixed(2))));
}

export function normalizeDynamicGridCardTitleSizeRem(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1.14;
  }
  return Math.max(0.9, Math.min(2, Number(numeric.toFixed(2))));
}

export function normalizeDynamicGridCardBodySizeRem(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(0.8, Math.min(1.5, Number(numeric.toFixed(2))));
}

export function normalizeDynamicGridCardBodyLineHeight(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1.58;
  }
  return Math.max(1.1, Math.min(2.1, Number(numeric.toFixed(2))));
}
