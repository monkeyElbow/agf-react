export function hasDisplayableHeroLineText(settings, lineKey) {
  const safeSettings = settings && typeof settings === 'object' ? settings : {};
  const key = String(lineKey || '').trim();
  if (!key) {
    return false;
  }

  return Boolean(String(safeSettings[`${key}Text`] || '').trim());
}

export function hasHeroLineStylingPayload(settings, lineKey) {
  const safeSettings = settings && typeof settings === 'object' ? settings : {};
  const key = String(lineKey || '').trim();
  if (!key) {
    return false;
  }

  return Boolean(
    String(safeSettings[`${key}ClassName`] || '').trim()
    || String(safeSettings[`${key}HighlightsJson`] || '').trim()
  );
}

export function supportsOptionalHeroLine3({
  fieldById,
  settings,
} = {}) {
  const safeFieldById = fieldById instanceof Map ? fieldById : null;
  if (safeFieldById) {
    return (
      safeFieldById.has('line3Text')
      || safeFieldById.has('line3ClassName')
      || safeFieldById.has('line3HighlightsJson')
      || hasDisplayableHeroLineText(settings, 'line3')
      || hasHeroLineStylingPayload(settings, 'line3')
    );
  }

  return hasDisplayableHeroLineText(settings, 'line3') || hasHeroLineStylingPayload(settings, 'line3');
}

export function hasHeroLineContent(settings, lineKey) {
  return hasDisplayableHeroLineText(settings, lineKey);
}

export function resolveVisibleHeroLineNumbers({
  fieldById,
  settings,
  includeOptionalLine3 = false,
} = {}) {
  const supportsLine3 = supportsOptionalHeroLine3({ fieldById, settings });

  const visible = [1, 2];
  if (supportsLine3 && (includeOptionalLine3 || hasDisplayableHeroLineText(settings, 'line3'))) {
    visible.push(3);
  }
  return visible;
}

export function resolveVisibleHeroLineKeys({
  settings,
  lineKeys = ['line1', 'line2', 'line3'],
  includeOptionalLine3 = false,
} = {}) {
  const safeLineKeys = Array.isArray(lineKeys) ? lineKeys : ['line1', 'line2', 'line3'];
  return safeLineKeys.filter((lineKey) => {
    const key = String(lineKey || '').trim();
    if (!key) {
      return false;
    }
    if (key !== 'line3') {
      return true;
    }
    return includeOptionalLine3 || hasDisplayableHeroLineText(settings, key);
  });
}
