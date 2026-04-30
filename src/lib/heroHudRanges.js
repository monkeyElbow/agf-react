import { normalizeSemanticTextColorClass } from './colorSystem';

const HERO_COLOR_TOKENS = new Set([
  'is-atlantean',
  'is-mango',
  'is-melon',
  'is-super-grey',
  'is-sandstone',
  'is-white',
]);

export function normalizeHeroColorToken(value) {
  const normalized = normalizeSemanticTextColorClass(value);
  return HERO_COLOR_TOKENS.has(normalized) ? normalized : '';
}

export function extractHeroLineColorToken(className) {
  const tokens = String(className || '').trim().split(/\s+/).filter(Boolean);
  let matched = '';
  for (let index = 0; index < tokens.length; index += 1) {
    const token = normalizeHeroColorToken(tokens[index]);
    if (token) {
      matched = token;
    }
  }
  return matched;
}

export function resolveSelectionRangeColor(ranges, start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
    return '';
  }

  const safeRanges = (Array.isArray(ranges) ? ranges : [])
    .filter((range) => Number.isInteger(range?.start) && Number.isInteger(range?.end) && range.end > range.start)
    .filter((range) => String(range.className || '').trim());

  const exactMatch = safeRanges.find((range) => range.start === start && range.end === end);
  if (exactMatch) {
    return String(exactMatch.className || '').trim();
  }

  const containingMatches = safeRanges
    .filter((range) => range.start <= start && range.end >= end)
    .sort((left, right) => (left.end - left.start) - (right.end - right.start));
  if (containingMatches.length) {
    return String(containingMatches[0].className || '').trim();
  }

  const overlappingMatches = safeRanges
    .map((range) => ({
      ...range,
      overlap: Math.min(range.end, end) - Math.max(range.start, start),
    }))
    .filter((range) => range.overlap > 0)
    .sort((left, right) => right.overlap - left.overlap || (left.end - left.start) - (right.end - right.start));

  return overlappingMatches.length ? String(overlappingMatches[0].className || '').trim() : '';
}

export function normalizeTextSelectionState(selection, lineText = '') {
  const text = String(lineText || '');
  const max = text.length;
  const rawStart = Number(selection?.start);
  const rawEnd = Number(selection?.end);
  const start = Number.isInteger(rawStart) ? Math.max(0, Math.min(max, Math.min(rawStart, rawEnd))) : 0;
  const end = Number.isInteger(rawEnd) ? Math.max(start, Math.min(max, Math.max(rawStart, rawEnd))) : start;
  return {
    start,
    end,
    text: text.slice(start, end),
  };
}

export function readTextSelectionState(input, fallbackSelection = null, lineText = '') {
  const inputValue = input && typeof input.value === 'string' ? String(input.value) : '';
  const sourceText = inputValue || String(lineText || '');
  if (input) {
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (Number.isInteger(rawStart) && Number.isInteger(rawEnd)) {
      return normalizeTextSelectionState({ start: rawStart, end: rawEnd }, sourceText);
    }
  }
  return normalizeTextSelectionState(fallbackSelection, sourceText);
}

export function replaceHeroLineColorClass(className, nextColorToken) {
  const normalizedNext = normalizeHeroColorToken(nextColorToken);
  const tokens = String(className || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !normalizeHeroColorToken(token));
  if (normalizedNext) {
    tokens.push(normalizedNext);
  }
  return tokens.join(' ').trim();
}

export function isHeroDarkBgTone(value) {
  const token = String(value || '').trim().toLowerCase();
  return token === 'blue' || token === 'grey';
}

export function resolveHeroLineDisplayClassName(className, bgTone = '', fallbackClassName = '') {
  const fallbackTokens = String(fallbackClassName || '').trim().split(/\s+/).filter(Boolean);
  const classTokens = String(className || '').trim().split(/\s+/).filter(Boolean);
  const mergedTokens = [...fallbackTokens];

  classTokens.forEach((token) => {
    if (!mergedTokens.includes(token)) {
      mergedTokens.push(token);
    }
  });

  const hasExplicitLineColor = mergedTokens.some((token) => Boolean(normalizeHeroColorToken(token)));
  if (!hasExplicitLineColor && isHeroDarkBgTone(bgTone)) {
    mergedTokens.push('is-white');
  }

  return mergedTokens.join(' ').trim();
}

function normalizeRanges(items, text) {
  const sourceText = String(text || '');
  const max = sourceText.length;
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      start: Number.isFinite(Number(item?.start)) ? Math.max(0, Math.min(max, Number(item.start))) : null,
      end: Number.isFinite(Number(item?.end)) ? Math.max(0, Math.min(max, Number(item.end))) : null,
      className: normalizeHeroColorToken(item?.className),
    }))
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && item.className)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  normalized.forEach((item) => {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push({ ...item });
      return;
    }
    if (item.start <= prev.end) {
      if (item.className === prev.className) {
        prev.end = Math.max(prev.end, item.end);
      } else if (item.end > prev.end) {
        merged.push({ ...item, start: prev.end });
      }
      return;
    }
    if (item.start === prev.end && item.className === prev.className) {
      prev.end = item.end;
      return;
    }
    merged.push({ ...item });
  });

  return merged.filter((item) => item.end > item.start);
}

export function parseHeroRangeHighlights(rawValue, lineText) {
  const source = typeof rawValue === 'string' ? rawValue.trim() : '';
  const text = String(lineText || '');
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const hasRangeEntries = parsed.some((item) => (
      item
      && typeof item === 'object'
      && Number.isFinite(Number(item.start))
      && Number.isFinite(Number(item.end))
    ));

    if (hasRangeEntries) {
      return normalizeRanges(parsed, text);
    }

    const lower = text.toLowerCase();
    let searchCursor = 0;
    const ranges = [];
    parsed.forEach((item) => {
      const needle = String(item?.text || '');
      const className = normalizeHeroColorToken(item?.className);
      if (!needle || !className) {
        return;
      }
      const index = lower.indexOf(needle.toLowerCase(), searchCursor);
      if (index < 0) {
        return;
      }
      ranges.push({ start: index, end: index + needle.length, className });
      searchCursor = index + needle.length;
    });
    return normalizeRanges(ranges, text);
  } catch {
    return [];
  }
}

export function serializeHeroRangeHighlights(items, lineText) {
  const text = String(lineText || '');
  const normalized = normalizeRanges(items, text);
  if (!normalized.length) {
    return '';
  }
  return JSON.stringify(normalized.map((item) => ({
    start: item.start,
    end: item.end,
    className: item.className,
    text: text.slice(item.start, item.end),
  })));
}

export function remapHeroRangesForTextChange(ranges, prevText, nextText) {
  const from = String(prevText || '');
  const to = String(nextText || '');
  if (from === to) {
    return normalizeRanges(ranges, to);
  }

  let prefix = 0;
  const maxPrefix = Math.min(from.length, to.length);
  while (prefix < maxPrefix && from[prefix] === to[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  const maxSuffix = Math.min(from.length - prefix, to.length - prefix);
  while (
    suffix < maxSuffix
    && from[from.length - 1 - suffix] === to[to.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const oldChangedStart = prefix;
  const oldChangedEnd = from.length - suffix;
  const newChangedEnd = to.length - suffix;
  const newChangedLength = Math.max(0, newChangedEnd - oldChangedStart);
  const delta = to.length - from.length;
  const remapped = [];
  const isInsertionOnly = oldChangedStart === oldChangedEnd && newChangedLength > 0;

  (Array.isArray(ranges) ? ranges : []).forEach((range) => {
    if (!Number.isInteger(range?.start) || !Number.isInteger(range?.end) || range.end <= range.start) {
      return;
    }
    if (isInsertionOnly) {
      if (range.end < oldChangedStart) {
        remapped.push({ ...range });
        return;
      }
      if (range.start > oldChangedStart) {
        remapped.push({
          ...range,
          start: range.start + delta,
          end: range.end + delta,
        });
        return;
      }
      remapped.push({
        ...range,
        end: range.end + delta,
      });
      return;
    }
    if (range.end <= oldChangedStart) {
      remapped.push({ ...range });
      return;
    }
    if (range.start >= oldChangedEnd) {
      remapped.push({
        ...range,
        start: range.start + delta,
        end: range.end + delta,
      });
      return;
    }

    remapped.push({
      ...range,
      start: range.start >= oldChangedStart
        ? oldChangedStart + newChangedLength
        : range.start,
      end: range.end <= oldChangedEnd
        ? oldChangedStart + newChangedLength
        : range.end + delta,
    });
  });

  return normalizeRanges(remapped, to);
}

export function remapHighlightsJsonForTextChange(rawHighlightsJson, prevText, nextText) {
  const from = String(prevText || '');
  const to = String(nextText || '');
  return serializeHeroRangeHighlights(
    remapHeroRangesForTextChange(parseHeroRangeHighlights(rawHighlightsJson, from), from, to),
    to,
  );
}

export function applySelectionColor(rawHighlightsJson, lineText, start, end, className) {
  const normalizedClass = normalizeHeroColorToken(className);
  const sourceText = String(lineText || '');
  if (!normalizedClass || !Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
    return String(rawHighlightsJson || '');
  }

  const current = parseHeroRangeHighlights(rawHighlightsJson, sourceText);
  const nextRanges = current.filter((range) => (
    Math.max(range.start, start) >= Math.min(range.end, end)
  ));
  nextRanges.push({ start, end, className: normalizedClass });
  nextRanges.sort((a, b) => a.start - b.start || a.end - b.end);
  return serializeHeroRangeHighlights(nextRanges, sourceText);
}

export function removeSelectionRange(rawHighlightsJson, lineText, index) {
  const sourceText = String(lineText || '');
  const current = parseHeroRangeHighlights(rawHighlightsJson, sourceText);
  if (index < 0 || index >= current.length) {
    return String(rawHighlightsJson || '');
  }
  const nextRanges = current.filter((_, rangeIndex) => rangeIndex !== index);
  return serializeHeroRangeHighlights(nextRanges, sourceText);
}
