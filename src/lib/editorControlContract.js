import { getAllBlockDefinitions, getBlockDefinition, getBlockEditorSections } from '../blocks/registry';
import { normalizeContentAdminBlock } from './contentAdminNormalization';

export const EDITOR_CONTROL_SURFACES = Object.freeze(['admin', 'hud']);

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeProbeToken(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .toLowerCase();
}

function getDifferentOption(field, currentValue) {
  const options = Array.isArray(field?.options) ? field.options : [];
  return options.find((option) => String(option?.value ?? '') !== String(currentValue ?? ''))?.value
    ?? options[0]?.value
    ?? '';
}

function getNumericProbeValue(field, currentValue, variant = '') {
  const fieldId = String(field?.id || '');
  const currentNumber = Number(currentValue);
  if (fieldId === 'titleLetterSpacingEm') {
    return Number((Number.isFinite(currentNumber) && currentNumber < 0 ? currentNumber + 0.01 : -0.01).toFixed(3));
  }
  if (fieldId === 'lineGap') {
    return Number((Number.isFinite(currentNumber) && currentNumber > 0 ? 0.1 : 0.2).toFixed(2));
  }
  if (fieldId === 'heightSvh') {
    return variant ? (Number.isFinite(currentNumber) && currentNumber > 50 ? 50 : 60) : 60;
  }
  const min = Number.isFinite(Number(field?.min)) ? Number(field.min) : null;
  const max = Number.isFinite(Number(field?.max)) ? Number(field.max) : null;
  const step = Number.isFinite(Number(field?.step)) && Number(field.step) > 0 ? Number(field.step) : 1;
  const current = Number.isFinite(Number(currentValue)) ? Number(currentValue) : (min ?? 0);
  const candidate = current + step;

  if (max != null && candidate <= max) {
    return candidate;
  }
  if (min != null && current - step >= min) {
    return current - step;
  }
  return min != null ? min : current + step;
}

function createJsonProbeValue(field, currentValue, probeText) {
  let parsed = null;
  try {
    parsed = typeof currentValue === 'string' ? JSON.parse(currentValue || 'null') : currentValue;
  } catch {
    parsed = null;
  }

  const fieldId = String(field?.id || '');
  if (fieldId === 'tableHeadersJson') {
    return JSON.stringify([probeText]);
  }
  if (fieldId === 'tableRowsJson') {
    return JSON.stringify([[probeText]]);
  }
  if (fieldId === 'supportGroupsJson') {
    return JSON.stringify([{ title: probeText, description: probeText, links: [], items: [] }]);
  }
  if (fieldId === 'slicesJson') {
    return JSON.stringify([{ title: probeText, path: '/editor-control-probe', description: probeText }]);
  }
  if (/HighlightsJson$/.test(fieldId)) {
    return JSON.stringify([{ text: probeText, className: 'is-atlantean' }]);
  }
  if (fieldId === 'fieldsJson' || /FieldsJson$/.test(fieldId)) {
    return JSON.stringify([{ id: 'probeField', label: probeText, type: 'text', required: false }]);
  }
  if (Array.isArray(parsed) && parsed.length) {
    const next = [...parsed];
    if (typeof next[0] === 'string') {
      next[0] = probeText;
    } else if (next[0] && typeof next[0] === 'object') {
      const key = Object.keys(next[0]).find((candidate) => typeof next[0][candidate] === 'string') || 'label';
      next[0] = { ...next[0], [key]: probeText };
    }
    return JSON.stringify(next);
  }
  return JSON.stringify([probeText]);
}

export function createEditorControlProbeValue(field, { kind = 'block', currentValue, variant = '' } = {}) {
  const fieldId = normalizeProbeToken(field?.id || 'field');
  const kindToken = normalizeProbeToken(kind || 'block');
  const variantToken = variant ? `__${normalizeProbeToken(variant)}` : '';
  const probeText = `__editor_control_probe__${kindToken}__${fieldId}${variantToken}`;

  if (field?.type === 'textarea' && /Json$/.test(String(field?.id || ''))) {
    return createJsonProbeValue(field, currentValue, probeText);
  }

  switch (field?.type) {
    case 'boolean':
      return currentValue === true ? false : true;
    case 'number':
      return getNumericProbeValue(field, currentValue, variant);
    case 'select':
    case 'swatch':
      return getDifferentOption(field, currentValue);
    case 'route_link':
      return JSON.stringify({
        kind: 'internal',
        to: `/__editor-control-probe__/${kindToken}/${fieldId}${variantToken}`,
        openInNewWindow: false,
      });
    case 'highlight_list':
      return JSON.stringify([{ text: probeText, className: field?.options?.[0]?.value || 'is-atlantean' }]);
    case 'html':
      return `<p>${probeText}</p>`;
    default:
      return probeText;
  }
}

export function createEditorControlProbeBlock(definition, overrides = {}) {
  const settings = {
    ...(definition?.defaults || {}),
    ...(overrides.settings || {}),
  };

  return normalizeContentAdminBlock({
    id: overrides.id || `editor-control-probe-${definition?.kind || 'block'}`,
    kind: definition?.kind,
    mode: 'dynamic',
    variant: overrides.variant || 'default',
    ...overrides,
    settings,
  });
}

export function getEditorControlFields(kind, surface = 'admin') {
  return getBlockEditorSections(kind, surface)
    .flatMap((section) => (Array.isArray(section?.fields) ? section.fields : []))
    .filter((field) => String(field?.id || '').trim());
}

export function getEditorControlMatrix() {
  return getAllBlockDefinitions().flatMap((definition) => EDITOR_CONTROL_SURFACES.flatMap((surface) => (
    getEditorControlFields(definition.kind, surface).map((field) => ({
      kind: definition.kind,
      surface,
      sectionIds: getBlockEditorSections(definition.kind, surface)
        .filter((section) => section.fields?.some((candidate) => candidate.id === field.id))
        .map((section) => section.id),
      field,
    }))
  )));
}

export function patchEditorControl(block, field, value) {
  return normalizeContentAdminBlock({
    ...cloneJson(block),
    settings: {
      ...(block?.settings || {}),
      [field.id]: value,
    },
  });
}

export function buildEditorControlRuntime(definition, block) {
  return definition?.renderer?.buildRuntime(block);
}

export function getEditorControlDefinition(kind) {
  return getBlockDefinition(kind);
}
