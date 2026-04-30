export const HOME_RETURN_ASSIST_STORAGE_KEY = 'agf-home-return-assist-v1';
export const HOME_RETURN_ASSIST_MAX_AGE_MS = 30 * 60 * 1000;

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizePath(pathname) {
  return String(pathname || '').trim() || '/';
}

function defaultState() {
  return {
    previousPath: '',
    currentPath: '',
    lastServicesPath: '',
    lastServicesAt: 0,
    dismissed: false,
  };
}

export function isHomeReturnAssistServicesPath(pathname) {
  const token = normalizePath(pathname).replace(/\/+$/, '') || '/';
  return token === '/services' || token.startsWith('/services/');
}

export function readHomeReturnAssistState() {
  const storage = getSessionStorage();
  if (!storage) {
    return defaultState();
  }

  try {
    const raw = storage.getItem(HOME_RETURN_ASSIST_STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw);
    return {
      previousPath: normalizePath(parsed?.previousPath || ''),
      currentPath: normalizePath(parsed?.currentPath || ''),
      lastServicesPath: normalizePath(parsed?.lastServicesPath || ''),
      lastServicesAt: Number(parsed?.lastServicesAt) || 0,
      dismissed: parsed?.dismissed === true,
    };
  } catch {
    return defaultState();
  }
}

function writeHomeReturnAssistState(nextState) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(HOME_RETURN_ASSIST_STORAGE_KEY, JSON.stringify({
      previousPath: normalizePath(nextState?.previousPath || ''),
      currentPath: normalizePath(nextState?.currentPath || ''),
      lastServicesPath: normalizePath(nextState?.lastServicesPath || ''),
      lastServicesAt: Number(nextState?.lastServicesAt) || 0,
      dismissed: nextState?.dismissed === true,
    }));
  } catch {
    // Ignore sessionStorage write failures.
  }
}

export function recordHomeReturnAssistNavigation(pathname, now = Date.now()) {
  const nextPath = normalizePath(pathname);
  const timestamp = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const currentState = readHomeReturnAssistState();
  const nextState = {
    ...currentState,
    previousPath: normalizePath(currentState.currentPath || ''),
    currentPath: nextPath,
  };

  if (isHomeReturnAssistServicesPath(nextPath)) {
    nextState.lastServicesPath = nextPath;
    nextState.lastServicesAt = timestamp;
    nextState.dismissed = false;
  }

  writeHomeReturnAssistState(nextState);
  return nextState;
}

export function shouldShowHomeReturnAssist(pathname = '/', now = Date.now()) {
  if (normalizePath(pathname) !== '/') {
    return false;
  }

  const timestamp = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const state = readHomeReturnAssistState();
  const cameFromServices = isHomeReturnAssistServicesPath(state.previousPath)
    || isHomeReturnAssistServicesPath(state.currentPath);

  if (state.dismissed) {
    return false;
  }
  if (!cameFromServices) {
    return false;
  }
  if (!isHomeReturnAssistServicesPath(state.lastServicesPath)) {
    return false;
  }
  if (!Number.isFinite(Number(state.lastServicesAt)) || Number(state.lastServicesAt) <= 0) {
    return false;
  }

  const ageMs = timestamp - Number(state.lastServicesAt);
  return ageMs >= 0 && ageMs <= HOME_RETURN_ASSIST_MAX_AGE_MS;
}

export function dismissHomeReturnAssist() {
  const nextState = {
    ...readHomeReturnAssistState(),
    dismissed: true,
  };
  writeHomeReturnAssistState(nextState);
  return nextState;
}

export function clearHomeReturnAssistState() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(HOME_RETURN_ASSIST_STORAGE_KEY);
  } catch {
    // Ignore sessionStorage cleanup failures.
  }
}
