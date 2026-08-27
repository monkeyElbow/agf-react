export const HERO_PADDING_MIN_REM = 0;
export const HERO_PADDING_MAX_REM = 8;
export const HERO_PADDING_STEP_REM = 0.25;
export const HERO_PADDING_DEFAULT_REM = 2.5;

export function normalizeHeroPaddingRem(value, fallback = HERO_PADDING_DEFAULT_REM) {
  const numericValue = Number(value);
  const numericFallback = Number(fallback);
  const safeValue = Number.isFinite(numericValue)
    ? numericValue
    : (Number.isFinite(numericFallback) ? numericFallback : HERO_PADDING_DEFAULT_REM);
  const clamped = Math.min(HERO_PADDING_MAX_REM, Math.max(HERO_PADDING_MIN_REM, safeValue));
  const stepped = Math.round((clamped - HERO_PADDING_MIN_REM) / HERO_PADDING_STEP_REM) * HERO_PADDING_STEP_REM + HERO_PADDING_MIN_REM;
  return Number(stepped.toFixed(2));
}
