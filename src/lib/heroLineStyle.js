export function normalizeHeroLineGapEm(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(-0.18, Math.min(0.4, Number(numeric.toFixed(2))));
}

export function normalizeHeroLineHeightEm(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.9;
  }
  return Math.max(0.72, Math.min(1.2, Number(numeric.toFixed(2))));
}

export function buildHeroLineStyle({
  lineHeight,
  fontSize,
  letterSpacing,
  lineGap = 0,
  lineIndex = 0,
}) {
  const normalizedLineGap = normalizeHeroLineGapEm(lineGap);
  return {
    lineHeight,
    ...(fontSize ? { fontSize } : {}),
    ...(typeof letterSpacing === 'string' && letterSpacing ? { letterSpacing } : {}),
    ...(lineIndex > 0 && normalizedLineGap !== 0 ? { marginTop: `${normalizedLineGap}em` } : {}),
  };
}
