export const DEFAULT_INTRO_LINE_SPACING = 1.04;
export const DEFAULT_BILLBOARD_LINE_SPACING = 1;
export const DEFAULT_BILLBOARD_TITLE_SIZE_REM = 3.4;
export const DEFAULT_BILLBOARD_TITLE_FONT_WEIGHT = 800;
export const DEFAULT_BILLBOARD_TITLE_LETTER_SPACING_EM = -0.03;
export const DEFAULT_BILLBOARD_SUBTITLE_SIZE_REM = 1.18;
export const DEFAULT_BILLBOARD_LEAD_COPY_SIZE_REM = 1.65;

export function normalizeIntroLineSpacing(value, fallback = DEFAULT_INTRO_LINE_SPACING) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0.85, Math.min(1.4, Number(numeric.toFixed(2))));
}

export function normalizeBillboardLineSpacing(value, fallback = DEFAULT_BILLBOARD_LINE_SPACING) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0.85, Math.min(1.25, Number(numeric.toFixed(2))));
}

export function normalizeBillboardTitleFontFamily(value) {
  const token = String(value || '').trim().toLowerCase();
  return ['heading', 'helv'].includes(token) ? token : 'heading';
}

export function normalizeBillboardTitleSizeRem(value, fallback = DEFAULT_BILLBOARD_TITLE_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(2.4, Math.min(8, Number(numeric.toFixed(2))));
}

export function normalizeBillboardTitleFontWeight(
  value,
  fontFamily = 'heading',
  fallback = fontFamily === 'helv' ? 700 : DEFAULT_BILLBOARD_TITLE_FONT_WEIGHT,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const rounded = Math.round(numeric / 100) * 100;
  return Math.max(400, Math.min(900, rounded));
}

export function normalizeBillboardTitleLetterSpacingEm(
  value,
  fontFamily = 'heading',
  fallback = fontFamily === 'helv' ? -0.038 : DEFAULT_BILLBOARD_TITLE_LETTER_SPACING_EM,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(-0.12, Math.min(0.04, Number(numeric.toFixed(3))));
}

export function normalizeBillboardSubtitleDisplay(value) {
  return String(value || '').trim().toLowerCase() === 'headline'
    ? 'headline'
    : 'supporting';
}

export function normalizeBillboardSubtitleSizeRem(value, fallback = DEFAULT_BILLBOARD_SUBTITLE_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(8, Number(numeric.toFixed(2))));
}

export function normalizeBillboardLeadCopySizeRem(value, fallback = DEFAULT_BILLBOARD_LEAD_COPY_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(4, Number(numeric.toFixed(2))));
}

export function buildBillboardTitleStyle({
  lineSpacing,
  titleFontFamily,
  titleFontWeight,
  titleSizeRem,
  titleLetterSpacingEm,
}) {
  const normalizedFontFamily = normalizeBillboardTitleFontFamily(titleFontFamily);
  const normalizedLineSpacing = normalizeBillboardLineSpacing(lineSpacing);
  const normalizedFontWeight = normalizeBillboardTitleFontWeight(titleFontWeight, normalizedFontFamily);
  const normalizedTitleSizeRem = normalizeBillboardTitleSizeRem(titleSizeRem);
  const normalizedLetterSpacing = normalizeBillboardTitleLetterSpacingEm(
    titleLetterSpacingEm,
    normalizedFontFamily,
  );

  return {
    lineHeight: normalizedLineSpacing,
    fontFamily: normalizedFontFamily === 'helv' ? 'var(--ag-font-helv)' : 'var(--ag-font-heading)',
    fontWeight: normalizedFontWeight,
    fontSynthesis: 'weight',
    fontSize: `clamp(calc(${normalizedTitleSizeRem}rem * 0.58), 8vw, ${normalizedTitleSizeRem}rem)`,
    letterSpacing: `${normalizedLetterSpacing}em`,
  };
}

export function buildBillboardSubtitleStyle({
  resolvedColor,
  subtitleDisplay,
  subtitleSizeRem,
  titleFontFamily,
  titleFontWeight,
  titleSizeRem,
  titleLetterSpacingEm,
}) {
  const normalizedDisplay = normalizeBillboardSubtitleDisplay(subtitleDisplay);
  const normalizedFontFamily = normalizeBillboardTitleFontFamily(titleFontFamily);
  const normalizedFontWeight = normalizeBillboardTitleFontWeight(titleFontWeight, normalizedFontFamily);
  const normalizedTitleSizeRem = normalizeBillboardTitleSizeRem(titleSizeRem);
  const normalizedLetterSpacing = normalizeBillboardTitleLetterSpacingEm(
    titleLetterSpacingEm,
    normalizedFontFamily,
  );
  const normalizedSubtitleSizeRem = subtitleSizeRem == null
    ? null
    : normalizeBillboardSubtitleSizeRem(subtitleSizeRem);

  return {
    ...(resolvedColor ? { color: resolvedColor } : {}),
    ...(normalizedDisplay === 'headline'
      ? {
        fontFamily: normalizedFontFamily === 'helv' ? 'var(--ag-font-helv)' : 'var(--ag-font-heading)',
        fontWeight: normalizedFontWeight,
        fontSize: `clamp(calc(${normalizedSubtitleSizeRem ?? normalizedTitleSizeRem}rem * 0.58), 8vw, ${normalizedSubtitleSizeRem ?? normalizedTitleSizeRem}rem)`,
        lineHeight: 1.05,
        letterSpacing: `${normalizedLetterSpacing}em`,
      }
      : {}),
    ...(normalizedDisplay !== 'headline' && normalizedSubtitleSizeRem
      ? { fontSize: `clamp(calc(${normalizedSubtitleSizeRem}rem * 0.68), 5vw, ${normalizedSubtitleSizeRem}rem)` }
      : {}),
  };
}

export function buildBillboardLeadCopyStyle(leadCopySizeRem) {
  if (leadCopySizeRem == null || String(leadCopySizeRem).trim() === '') {
    return undefined;
  }

  const normalizedSizeRem = normalizeBillboardLeadCopySizeRem(leadCopySizeRem);
  return {
    '--dynamic-billboard-lead-copy-size': `clamp(calc(${normalizedSizeRem}rem * 0.68), 2.1vw, ${normalizedSizeRem}rem)`,
  };
}
