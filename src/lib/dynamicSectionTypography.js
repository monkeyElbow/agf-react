export const DEFAULT_INTRO_LINE_SPACING = 1.04;
export const DEFAULT_INTRO_HEADING_SIZE_REM = 2.99;
export const DEFAULT_INTRO_EXTRA_LINE_SIZE_REM = 1.7;
export const DEFAULT_INTRO_EXTRA_LINE_SPACE_BEFORE_REM = 1;
export const DEFAULT_INTRO_EXTRA_LINE_HEIGHT = 1.35;
export const DEFAULT_CAREERS_EXTRA_LINE_SIZE_REM = 4.15;
export const DEFAULT_CAREERS_EXTRA_LINE_SPACE_BEFORE_REM = 2.4;
export const DEFAULT_CAREERS_EXTRA_LINE_HEIGHT = 0.94;
export const DEFAULT_BILLBOARD_LINE_SPACING = 1;
export const DEFAULT_BILLBOARD_TITLE_SIZE_REM = 3.4;
export const DEFAULT_BILLBOARD_TITLE_FONT_WEIGHT = 800;
export const DEFAULT_BILLBOARD_TITLE_LETTER_SPACING_EM = -0.03;
export const DEFAULT_BILLBOARD_SUBTITLE_SIZE_REM = 1.18;
export const DEFAULT_BILLBOARD_LEAD_COPY_SIZE_REM = 1.65;
export const DEFAULT_BILLBOARD_LEAD_COPY_LINE_HEIGHT = 1.55;

// The licensed Typekit faces do not share the same weight map. Helvetica Neue
// LT Pro exposes 400/500/700; Avenir Next World exposes 400/500/600/700/800.
// Keeping the editor options aligned with those faces prevents 600/800/900
// from all resolving to the same Helvetica 700 face.
const BILLBOARD_TITLE_WEIGHT_OPTIONS = Object.freeze({
  heading: Object.freeze([400, 500, 600, 700, 800]),
  helv: Object.freeze([400, 500, 700]),
});

export function normalizeIntroLineSpacing(value, fallback = DEFAULT_INTRO_LINE_SPACING) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0.85, Math.min(1.4, Number(numeric.toFixed(2))));
}

export function normalizeIntroHeadingSizeRem(value, fallback = DEFAULT_INTRO_HEADING_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(2.4, Math.min(8, Number(numeric.toFixed(2))));
}

export function getIntroHeadingSizeDefault(sectionClassName = '') {
  const classes = String(sectionClassName || '').split(/\s+/);
  if (classes.includes('about-native-top-intro')) {
    return 6.7;
  }
  if (classes.includes('careers-native-top-intro')) {
    return 4.15;
  }
  if (classes.includes('services-native-intro')) {
    return 5.8;
  }
  return DEFAULT_INTRO_HEADING_SIZE_REM;
}

export function normalizeIntroExtraLineSizeRem(value, fallback = DEFAULT_INTRO_EXTRA_LINE_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(5, Number(numeric.toFixed(2))));
}

export function normalizeIntroExtraLineSpaceBeforeRem(value, fallback = DEFAULT_INTRO_EXTRA_LINE_SPACE_BEFORE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(4, Number(numeric.toFixed(2))));
}

export function normalizeIntroExtraLineHeight(value, fallback = DEFAULT_INTRO_EXTRA_LINE_HEIGHT) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0.8, Math.min(1.5, Number(numeric.toFixed(2))));
}

export function getIntroExtraLineDefaults(sectionClassName = '') {
  const isCareersIntro = String(sectionClassName || '').split(/\s+/).includes('careers-native-top-intro');
  return isCareersIntro
    ? {
        extraLineSizeRem: DEFAULT_CAREERS_EXTRA_LINE_SIZE_REM,
        extraLineSpaceBeforeRem: DEFAULT_CAREERS_EXTRA_LINE_SPACE_BEFORE_REM,
        extraLineLineHeight: DEFAULT_CAREERS_EXTRA_LINE_HEIGHT,
      }
    : {
        extraLineSizeRem: DEFAULT_INTRO_EXTRA_LINE_SIZE_REM,
        extraLineSpaceBeforeRem: DEFAULT_INTRO_EXTRA_LINE_SPACE_BEFORE_REM,
        extraLineLineHeight: DEFAULT_INTRO_EXTRA_LINE_HEIGHT,
      };
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

export function getBillboardTitleWeightOptions(fontFamily = 'heading') {
  const normalizedFontFamily = normalizeBillboardTitleFontFamily(fontFamily);
  return BILLBOARD_TITLE_WEIGHT_OPTIONS[normalizedFontFamily] || BILLBOARD_TITLE_WEIGHT_OPTIONS.heading;
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
  const supportedWeights = getBillboardTitleWeightOptions(fontFamily);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return supportedWeights.reduce((closest, weight) => (
      Math.abs(weight - Number(fallback)) < Math.abs(closest - Number(fallback)) ? weight : closest
    ), supportedWeights[0]);
  }
  const rounded = Math.round(numeric / 100) * 100;
  return supportedWeights.reduce((closest, weight) => (
    Math.abs(weight - rounded) < Math.abs(closest - rounded) ? weight : closest
  ), supportedWeights[0]);
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

export function normalizeBillboardLeadCopyLineHeight(
  value,
  fallback = DEFAULT_BILLBOARD_LEAD_COPY_LINE_HEIGHT,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0.9, Math.min(2.2, Number(numeric.toFixed(2))));
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
    '--dynamic-billboard-title-tracking': `${normalizedLetterSpacing}em`,
  };
}

export function buildBillboardSubtitleStyle({
  resolvedColor,
  subtitleDisplay,
  subtitleSizeRem,
  titleFontFamily,
  titleFontWeight,
  subtitleFontWeight,
  titleSizeRem,
  subtitleLetterSpacingEm,
}) {
  const normalizedDisplay = normalizeBillboardSubtitleDisplay(subtitleDisplay);
  const normalizedFontFamily = normalizeBillboardTitleFontFamily(titleFontFamily);
  const normalizedTitleFontWeight = normalizeBillboardTitleFontWeight(titleFontWeight, normalizedFontFamily);
  const normalizedSubtitleFontWeight = normalizeBillboardTitleFontWeight(
    subtitleFontWeight,
    normalizedFontFamily,
    normalizedDisplay === 'headline' ? normalizedTitleFontWeight : 400,
  );
  const normalizedTitleSizeRem = normalizeBillboardTitleSizeRem(titleSizeRem);
  const normalizedLetterSpacing = normalizeBillboardTitleLetterSpacingEm(
    subtitleLetterSpacingEm,
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
        fontWeight: normalizedSubtitleFontWeight,
        fontSize: `clamp(calc(${normalizedSubtitleSizeRem ?? normalizedTitleSizeRem}rem * 0.58), 8vw, ${normalizedSubtitleSizeRem ?? normalizedTitleSizeRem}rem)`,
        lineHeight: 1.05,
        letterSpacing: `${normalizedLetterSpacing}em`,
      }
      : {}),
    ...(normalizedDisplay !== 'headline'
      ? {
        ...(normalizedSubtitleSizeRem
          ? { fontSize: `clamp(calc(${normalizedSubtitleSizeRem}rem * 0.68), 5vw, ${normalizedSubtitleSizeRem}rem)` }
          : {}),
        fontWeight: normalizedSubtitleFontWeight,
        letterSpacing: `${normalizedLetterSpacing}em`,
      }
      : {}),
  };
}

export function buildBillboardLeadCopyStyle(leadCopySizeRem, leadCopyLineHeight) {
  const hasSize = leadCopySizeRem != null && String(leadCopySizeRem).trim() !== '';
  const hasLineHeight = leadCopyLineHeight != null && String(leadCopyLineHeight).trim() !== '';
  if (!hasSize && !hasLineHeight) {
    return undefined;
  }

  const style = {};
  if (hasSize) {
    const normalizedSizeRem = normalizeBillboardLeadCopySizeRem(leadCopySizeRem);
    style['--dynamic-billboard-lead-copy-size'] = `clamp(calc(${normalizedSizeRem}rem * 0.68), 2.1vw, ${normalizedSizeRem}rem)`;
  }
  if (hasLineHeight) {
    style['--dynamic-billboard-lead-copy-line-height'] = String(
      normalizeBillboardLeadCopyLineHeight(leadCopyLineHeight),
    );
  }
  return style;
}
