const loggedHeroDriftKeys = new Set();

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
  if (!import.meta.env.DEV || !report?.hasDrift) {
    return;
  }
  const key = `${source}|${report.pathname}|${report.signature}`;
  if (loggedHeroDriftKeys.has(key)) {
    return;
  }
  loggedHeroDriftKeys.add(key);
  console.warn(formatHeroDriftWarningMessage(report, source));
}
