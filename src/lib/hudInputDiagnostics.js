const MAX_DIAGNOSTIC_VALUE_LENGTH = 120;

export const HUD_INPUT_DIAGNOSTICS_ENABLED = Boolean(import.meta.env?.DEV);

const diagnosticStateByKey = new Map();
const subscribers = new Set();

function isSensitiveKey(settingKey = '') {
  return /(token|secret|password|authorization|cookie|email|phone)/i.test(String(settingKey || ''));
}

export function formatHudDiagnosticValue(value, settingKey = '') {
  if (isSensitiveKey(settingKey)) {
    return '[redacted]';
  }
  if (value == null) {
    return String(value);
  }
  let formattedValue;
  if (typeof value === 'string') {
    formattedValue = value;
    if (/bearer\s|eyJ[A-Za-z0-9_-]{12,}|(?:sk|pk)[-_][A-Za-z0-9_-]{12,}|(?:token|secret|password)\s*[:=]/i.test(formattedValue)) {
      return '[redacted]';
    }
  } else {
    try {
      formattedValue = JSON.stringify(value);
    } catch {
      formattedValue = String(value);
    }
  }
  const normalizedValue = String(formattedValue);
  return normalizedValue.length > MAX_DIAGNOSTIC_VALUE_LENGTH
    ? `${normalizedValue.slice(0, MAX_DIAGNOSTIC_VALUE_LENGTH - 1)}…`
    : normalizedValue;
}

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

export function getHudInputDiagnosticKey(route, blockId) {
  return `${String(route || '').trim()}::${String(blockId || '').trim()}`;
}

export function getHudInputDiagnostic(key) {
  return diagnosticStateByKey.get(key) || null;
}

export function updateHudInputDiagnostic(key, patch = {}) {
  if (!HUD_INPUT_DIAGNOSTICS_ENABLED || !key || !patch || typeof patch !== 'object') {
    return;
  }
  const previous = diagnosticStateByKey.get(key) || {};
  diagnosticStateByKey.set(key, {
    ...previous,
    ...patch,
  });
  notifySubscribers();
}

export function subscribeHudInputDiagnostics(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}
