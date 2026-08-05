import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from './heroTitleSize';
import { getHeroSeedContract } from './heroSeedContracts';

function addMissingHeroLine(settings, lineNumber, lineContract) {
  const next = { ...settings };
  const textKey = `line${lineNumber}Text`;
  const classKey = `line${lineNumber}ClassName`;
  const highlightsKey = `line${lineNumber}HighlightsJson`;
  if (!Object.prototype.hasOwnProperty.call(next, textKey)) {
    next[textKey] = String(lineContract?.text || '');
  }
  if (!Object.prototype.hasOwnProperty.call(next, classKey)) {
    next[classKey] = String(lineContract?.className || '').trim();
  }
  if (!Object.prototype.hasOwnProperty.call(next, highlightsKey)) {
    next[highlightsKey] = String(lineContract?.highlightsJson || '');
  }
  return next;
}

export function normalizeDynamicHeroSettings(pathname, rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const contract = getHeroSeedContract(pathname) || {};
  let normalized = { ...settings };

  ['animationPreset', 'bgTone', 'justify', 'actionJustify'].forEach((field) => {
    if (!String(normalized[field] || '').trim() && contract[field]) {
      normalized[field] = contract[field];
    }
  });
  if (!Number.isFinite(Number(normalized.lineHeight))) {
    normalized.lineHeight = contract.lineHeight || 0.9;
  }
  if (!Number.isFinite(Number(normalized.lineGap))) {
    normalized.lineGap = contract.lineGap || 0;
  }
  if (pathname === '/' && !Number.isFinite(Number(normalized.titleSizeRem))) {
    normalized.titleSizeRem = contract.titleSizeRem;
  }
  (Array.isArray(contract.lines) ? contract.lines : []).forEach((line, index) => {
    normalized = addMissingHeroLine(normalized, index + 1, line);
  });

  return {
    ...normalized,
    titleSizeRem: normalizeHeroTitleSizeRem(normalized.titleSizeRem, DEFAULT_HERO_TITLE_SIZE_REM),
    titleLetterSpacingEm: normalizeHeroTitleLetterSpacingEm(
      normalized.titleLetterSpacingEm,
      DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
    ),
  };
}

export function inspectDynamicHeroSettings(pathname, rawSettings) {
  const normalizedSettings = normalizeDynamicHeroSettings(pathname, rawSettings);
  return {
    pathname,
    normalizedSettings,
    repairedFields: [],
    hasDrift: false,
    signature: '',
  };
}
