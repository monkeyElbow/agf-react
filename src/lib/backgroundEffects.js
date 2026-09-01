const BACKGROUND_LIGHT_TONES = new Set(['blue', 'mango', 'melon', 'sand', 'white']);
const MAX_BACKGROUND_LIGHTS = 3;

const DEFAULT_LIGHT = Object.freeze({
  tone: 'blue',
  strength: 38,
  x: 0,
  y: 0,
  size: 72,
  motion: false,
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
  return {
    id: String(source.id || `light-${index + 1}`).trim() || `light-${index + 1}`,
    tone: BACKGROUND_LIGHT_TONES.has(tone) ? tone : DEFAULT_LIGHT.tone,
    strength: clamp(source.strength, 0, 100, DEFAULT_LIGHT.strength),
    x: clamp(source.x, -100, 100, DEFAULT_LIGHT.x),
    y: clamp(source.y, -100, 100, DEFAULT_LIGHT.y),
    size: clamp(source.size, 20, 220, DEFAULT_LIGHT.size),
    motion: Boolean(source.motion),
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
    x: index === 0 ? -28 : (index === 1 ? 36 : 0),
    y: index === 0 ? -22 : (index === 1 ? 30 : 42),
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

export const BACKGROUND_LIGHT_TONE_OPTIONS = Object.freeze([
  { value: 'blue', label: 'Blue', swatch: '#00adbb' },
  { value: 'mango', label: 'Mango', swatch: '#faa31a' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'sand', label: 'Sand', swatch: '#c4beb6' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
]);

export { MAX_BACKGROUND_LIGHTS };
