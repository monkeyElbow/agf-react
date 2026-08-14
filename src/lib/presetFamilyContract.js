import { resolveBlockPresetDefinition } from '../blocks/registry';

export const PRESET_FAMILY_CONTRACT = Object.freeze({
  columns: Object.freeze({
    cssNamespace: 'columns',
    rootClassName: 'native-dynamic-columns',
    runtimePresetClassPrefix: 'is-columns-preset-',
  }),
  card_grid: Object.freeze({
    cssNamespace: 'card-grid',
    rootClassName: 'native-dynamic-grid',
    runtimePresetClassPrefix: 'is-card-grid-preset-',
  }),
  billboard: Object.freeze({
    cssNamespace: 'billboard',
    rootClassName: 'dynamic-billboard',
    runtimePresetClassPrefix: 'is-billboard-preset-',
  }),
});

export const PRESET_FAMILY_KINDS = Object.freeze(Object.keys(PRESET_FAMILY_CONTRACT));

export function getPresetFamilyContract(kind) {
  const token = String(kind || '').trim();
  return PRESET_FAMILY_CONTRACT[token] || null;
}

export function isPresetFamilyKind(kind) {
  return Boolean(getPresetFamilyContract(kind));
}

export function normalizePresetFamilyClassToken(value) {
  const token = String(value || '').trim().toLowerCase();
  const normalized = token
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'default';
}

export function resolvePresetFamilyClassToken(block, fallbackPresetId = 'default') {
  const presetId = String(
    resolveBlockPresetDefinition(block)?.id
    || block?.presetId
    || fallbackPresetId,
  ).trim();
  return normalizePresetFamilyClassToken(presetId || fallbackPresetId);
}

export function buildPresetFamilyRuntimeClassName(kind, presetId) {
  const contract = getPresetFamilyContract(kind);
  if (!contract) {
    return '';
  }
  return `${contract.runtimePresetClassPrefix}${normalizePresetFamilyClassToken(presetId)}`;
}

export function resolvePresetFamilyRuntimeClassName(block, fallbackPresetId = 'default') {
  const kind = String(block?.kind || '').trim();
  return buildPresetFamilyRuntimeClassName(kind, resolvePresetFamilyClassToken(block, fallbackPresetId));
}
