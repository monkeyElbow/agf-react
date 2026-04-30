export const DEFAULT_HERO_TITLE_SIZE_REM = 7;
export const MIN_HERO_TITLE_SIZE_REM = 4.5;
export const MAX_HERO_TITLE_SIZE_REM = 9;
export const DEFAULT_HERO_TITLE_LETTER_SPACING_EM = -0.05;
export const MIN_HERO_TITLE_LETTER_SPACING_EM = -0.08;
export const MAX_HERO_TITLE_LETTER_SPACING_EM = 0.04;

export function normalizeHeroTitleSizeRem(value, fallback = DEFAULT_HERO_TITLE_SIZE_REM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Number(
    Math.max(MIN_HERO_TITLE_SIZE_REM, Math.min(MAX_HERO_TITLE_SIZE_REM, numeric)).toFixed(2),
  );
}

export function heroTitleSizeRemToRuntimeCss(value) {
  const sizeRem = normalizeHeroTitleSizeRem(value);
  const minRem = Number((sizeRem * 0.43).toFixed(2));
  return `clamp(${minRem}rem, 9.2vw, ${sizeRem}rem)`;
}

export function heroTitleSizeRemToEditorCss(value) {
  const sizeRem = normalizeHeroTitleSizeRem(value);
  const minRem = Number((sizeRem * 0.29).toFixed(2));
  const maxRem = Number((sizeRem * 0.46).toFixed(2));
  return `clamp(${minRem}rem, 4.1vw, ${maxRem}rem)`;
}

export function normalizeHeroTitleLetterSpacingEm(
  value,
  fallback = DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Number(
    Math.max(
      MIN_HERO_TITLE_LETTER_SPACING_EM,
      Math.min(MAX_HERO_TITLE_LETTER_SPACING_EM, numeric),
    ).toFixed(3),
  );
}
