const loggedHeroDriftKeys = new Set();
const HERO_DRIFT_DEBUG_STORAGE_KEY = 'agf:debug:hero-drift';
const LOW_SIGNAL_HERO_REPAIR_FIELDS = new Set([
  'titleSizeRem',
  'titleLetterSpacingEm',
]);

function readHeroDriftDebugFlag() {
  if (typeof window === 'undefined') {
    return '';
  }
  if (window.__AGF_DEBUG_HERO_DRIFT__ === true) {
    return 'true';
  }
  try {
    return String(window.localStorage?.getItem(HERO_DRIFT_DEBUG_STORAGE_KEY) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function isLowSignalHeroRepair(entry) {
  const field = String(entry?.field || '').trim();
  const reason = String(entry?.reason || '').trim();
  return LOW_SIGNAL_HERO_REPAIR_FIELDS.has(field) && reason === 'restored';
}

export function isHeroDriftDebugEnabled() {
  if (!import.meta.env.DEV) {
    return false;
  }
  const flag = readHeroDriftDebugFlag();
  return flag === '1' || flag === 'true' || flag === 'debug';
}

export function shouldLogHeroDriftWarning(report) {
  if (!import.meta.env.DEV || !report?.hasDrift) {
    return false;
  }
  if (isHeroDriftDebugEnabled()) {
    return true;
  }
  const repairedFields = Array.isArray(report?.repairedFields) ? report.repairedFields : [];
  if (!repairedFields.length) {
    return true;
  }
  return !repairedFields.every(isLowSignalHeroRepair);
}

export function resetHeroDriftWarningsForTests() {
  loggedHeroDriftKeys.clear();
}

export function summarizeHeroDriftFields(repairedFields, maxItems = 4) {
  const labels = (Array.isArray(repairedFields) ? repairedFields : [])
    .map((entry) => String(entry?.label || '').trim())
    .filter(Boolean);
  if (!labels.length) {
    return '';
  }
  if (labels.length <= maxItems) {
    return labels.join(', ');
  }
  return `${labels.slice(0, maxItems).join(', ')} +${labels.length - maxItems} more`;
}

export function formatHeroDriftWarningMessage(report, source = 'Hero') {
  const pathname = String(report?.pathname || '').trim() || '(unknown path)';
  const repairedSummary = summarizeHeroDriftFields(report?.repairedFields);
  return `${source} drift detected for ${pathname}. Auto-repaired: ${repairedSummary}.`;
}

export function logHeroDriftWarningOnce(report, source = 'Hero') {
  if (!shouldLogHeroDriftWarning(report)) {
    return;
  }
  const key = `${source}|${report.pathname}|${report.signature}`;
  if (loggedHeroDriftKeys.has(key)) {
    return;
  }
  loggedHeroDriftKeys.add(key);
  console.warn(formatHeroDriftWarningMessage(report, source));
}
