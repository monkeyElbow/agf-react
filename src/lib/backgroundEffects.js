const BACKGROUND_LIGHT_TONES = new Set(['blue', 'mango', 'melon', 'sand', 'white']);
const BACKGROUND_LIGHT_MOTION_MODES = new Set(['ambient', 'directional', 'drift']);
const EDGE_POSITION_MODEL = 'edge-v1';
const MAX_BACKGROUND_LIGHTS = 3;

const DEFAULT_LIGHT = Object.freeze({
  enabled: true,
  tone: 'blue',
  strength: 38,
  x: 50,
  y: 50,
  size: 72,
  motion: false,
  motionMode: 'ambient',
  motionX: 0,
  motionY: -18,
  motionDistance: 18,
  motionSpeed: 100,
});

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round((numeric + Number.EPSILON) * 100) / 100));
}

function parseRawEffects(value) {
  if (value && typeof value === 'object') {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeLight(light, index) {
  const source = light && typeof light === 'object' ? light : {};
  const tone = String(source.tone || DEFAULT_LIGHT.tone).trim().toLowerCase();
  const motionMode = String(source.motionMode || DEFAULT_LIGHT.motionMode).trim().toLowerCase();
  const usesEdgePositionModel = String(source.positionModel || '').trim().toLowerCase() === EDGE_POSITION_MODEL;
  const rawX = Number(source.x);
  const rawY = Number(source.y);
  const x = Number.isFinite(rawX)
    ? (usesEdgePositionModel ? rawX : rawX + 50)
    : DEFAULT_LIGHT.x;
  const y = Number.isFinite(rawY)
    ? (usesEdgePositionModel ? rawY : rawY + 50)
    : DEFAULT_LIGHT.y;
  return {
    id: String(source.id || `light-${index + 1}`).trim() || `light-${index + 1}`,
    positionModel: EDGE_POSITION_MODEL,
    enabled: source.enabled !== false,
    tone: BACKGROUND_LIGHT_TONES.has(tone) ? tone : DEFAULT_LIGHT.tone,
    strength: clamp(source.strength, 0, 100, DEFAULT_LIGHT.strength),
    x: usesEdgePositionModel ? clamp(x, -50, 150, DEFAULT_LIGHT.x) : clamp(x, 0, 100, DEFAULT_LIGHT.x),
    y: usesEdgePositionModel ? clamp(y, -50, 150, DEFAULT_LIGHT.y) : clamp(y, 0, 100, DEFAULT_LIGHT.y),
    size: clamp(source.size, 20, 220, DEFAULT_LIGHT.size),
    motion: Boolean(source.motion),
    motionMode: BACKGROUND_LIGHT_MOTION_MODES.has(motionMode) ? motionMode : DEFAULT_LIGHT.motionMode,
    motionX: clamp(source.motionX, -100, 100, DEFAULT_LIGHT.motionX),
    motionY: clamp(source.motionY, -100, 100, DEFAULT_LIGHT.motionY),
    motionDistance: clamp(source.motionDistance, 0, 100, DEFAULT_LIGHT.motionDistance),
    motionSpeed: clamp(source.motionSpeed, 25, 200, DEFAULT_LIGHT.motionSpeed),
  };
}

export function normalizeBackgroundEffects(value) {
  const source = parseRawEffects(value);
  const lights = Array.isArray(source?.lights)
    ? source.lights.map(normalizeLight).slice(0, MAX_BACKGROUND_LIGHTS)
    : [];
  const enabled = Boolean(source?.enabled) && lights.length > 0;
  return {
    enabled,
    clip: source?.clip !== false,
    lights,
  };
}

export function createDefaultBackgroundLight(index = 0) {
  return normalizeLight({
    id: `light-${index + 1}`,
    positionModel: EDGE_POSITION_MODEL,
    x: index === 0 ? 22 : (index === 1 ? 86 : 50),
    y: index === 0 ? 28 : (index === 1 ? 80 : 92),
    tone: index === 1 ? 'mango' : 'blue',
    strength: index === 0 ? 42 : 28,
    size: index === 0 ? 82 : 56,
  }, index);
}

export function serializeBackgroundEffects(value) {
  const normalized = normalizeBackgroundEffects(value);
  return JSON.stringify(normalized);
}

export function backgroundEffectsEnabled(value) {
  return normalizeBackgroundEffects(value).enabled;
}

function subtractInitialWave(value, initialValue) {
  return value - initialValue;
}

/**
 * Returns the scroll-relative transform for a light. The drift path is
 * deterministic per light, so it feels organic without jittering or changing
 * between browsers/renders.
 */
export function getBackgroundLightMotion(light, progress, index = 0) {
  const normalizedLight = normalizeLight(light, index);
  const amount = Math.min(1, Math.max(0, Number(progress) || 0));
  if (!normalizedLight.motion || normalizedLight.motionMode === 'ambient') {
    return { x: 0, y: 0, scale: 1 };
  }

  if (normalizedLight.motionMode === 'directional') {
    const response = Math.min(2, Math.max(0.25, normalizedLight.motionSpeed / 100));
    const travel = Math.min(1, amount * response);
    return {
      x: normalizedLight.motionX * travel,
      y: normalizedLight.motionY * travel,
      scale: 1 + (0.06 * travel),
    };
  }

  const phase = (index + 1) * 1.73;
  const cycles = 0.35 + ((normalizedLight.motionSpeed / 100) * 1.5);
  const angle = amount * Math.PI * 2 * cycles;
  const xWave = (
    (0.62 * subtractInitialWave(Math.sin(angle + phase), Math.sin(phase)))
    + (0.38 * subtractInitialWave(Math.sin((angle * 0.61) + (phase * 1.7)), Math.sin(phase * 1.7)))
  ) / 1.5;
  const yWave = (
    (0.58 * subtractInitialWave(Math.cos(angle + phase), Math.cos(phase)))
    + (0.42 * subtractInitialWave(Math.cos((angle * 0.47) + (phase * 1.3)), Math.cos(phase * 1.3)))
  ) / 1.5;
  const distance = normalizedLight.motionDistance;
  const x = distance * xWave;
  const y = distance * yWave;
  return {
    x,
    y,
    scale: 1 + (Math.min(distance, 40) / 40) * 0.06 * Math.abs(xWave + yWave),
  };
}

export const BACKGROUND_LIGHT_TONE_OPTIONS = Object.freeze([
  { value: 'blue', label: 'Blue', swatch: '#00adbb' },
  { value: 'mango', label: 'Mango', swatch: '#faa31a' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'sand', label: 'Sand', swatch: '#c4beb6' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
]);

export { BACKGROUND_LIGHT_MOTION_MODES, MAX_BACKGROUND_LIGHTS };
