import { PRESET_FAMILY_KINDS } from './presetFamilyContract';

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

export function buildBlockTemplateCreateId(template) {
  const kind = normalizeToken(template?.kind);
  const mode = normalizeToken(template?.mode);
  const presetId = normalizeToken(template?.presetId);
  const templateLookupId = String(template?.templateLookupId || '').trim();
  const templateId = String(template?.templateId || '').trim();

  if (PRESET_FAMILY_KINDS.includes(kind) && mode && presetId && normalizeToken(templateId) === kind) {
    return `${mode}:${kind}:${presetId}`;
  }

  return templateLookupId || templateId;
}
